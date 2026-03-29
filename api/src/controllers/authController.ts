// api/src/controllers/authController.ts
import { db } from "../db";
import { users } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import { sendResetPasswordEmail } from "../services/emailService";

export const forgotPassword = async ({ body }: any) => {
  const { email } = body;
  const [user] = await db.select().from(users).where(eq(users.email, email));
  
  if (!user) return { message: "หากมีอีเมลนี้ในระบบ เราได้ส่งลิงก์กู้คืนให้แล้ว" };

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); 

  await db.update(users)
    .set({ resetPasswordToken: token, resetPasswordExpires: expires })
    .where(eq(users.id, user.id));

  await sendResetPasswordEmail(email, token, user.name);
  return { message: "ส่งลิงก์กู้คืนรหัสผ่านสำเร็จ" };
};

export const resetPassword = async ({ body }: any) => {
  const { token, newPassword } = body;
  const [user] = await db.select().from(users).where(
    and(eq(users.resetPasswordToken, token), gt(users.resetPasswordExpires, new Date()))
  );

  if (!user) throw new Error("ลิงก์หมดอายุหรือผิดพลาด");

  const newHash = await Bun.password.hash(newPassword);
  await db.update(users)
    .set({ passwordHash: newHash, resetPasswordToken: null, resetPasswordExpires: null })
    .where(eq(users.id, user.id));

  return { message: "เปลี่ยนรหัสผ่านสำเร็จ" };
};