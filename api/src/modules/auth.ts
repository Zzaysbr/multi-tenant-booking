// api/src/modules/auth.ts
import Elysia, { t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { users, tenants } from "../db/schema";
import { desc, eq, and, gt } from "drizzle-orm"; // ✅ เพิ่ม and, gt
import { Resend } from 'resend'; // ✅ เพิ่ม Resend
import * as crypto from "crypto"; // ✅ เพิ่ม crypto

// Initialize Resend (ดึง Key จาก .env)
const resend = new Resend(process.env.RESEND_API_KEY);

export const authModule = (app: Elysia) => app.group('/auth', (group) => group
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'super-secret-key' }))

  // --- 🔑 1. Login ---
  .post("/login", async ({ body, set, jwt }: any) => {
    try {
      const { email, password } = body;
      const result = await db.select({
        id: users.id, name: users.name, email: users.email, role: users.role, tenantId: users.tenantId, tenantPath: tenants.path_name, passwordHash: users.passwordHash
      }).from(users).leftJoin(tenants, eq(users.tenantId, tenants.id)).where(eq(users.email, email)).limit(1);

      const user = result[0];
      if (!user || !(await Bun.password.verify(password, user.passwordHash))) {
        set.status = 401; return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
      }

      const token = await jwt.sign({ id: user.id, role: user.role, tenantId: user.tenantId });
      return { message: "เข้าสู่ระบบสำเร็จ", token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantPath: user.tenantPath || null } };
    } catch (e: any) { set.status = 500; return { error: "Server error" }; }
  })

  // --- 🏪 2. Create Shop (Register as Owner) ---
  .post("/create-shop", async ({ body, set, jwt }: any) => {
    try {
      const { shopName, tenantPath, ownerName, email, password } = body;
      
      const existingTenant = await db.select().from(tenants).where(eq(tenants.path_name, tenantPath)).limit(1);
      if (existingTenant.length > 0) { set.status = 400; return { error: "URL ร้านค้านี้มีคนใช้งานแล้ว" }; }

      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) { set.status = 400; return { error: "อีเมลนี้มีผู้ใช้งานในระบบแล้ว" }; }

      const passwordHash = await Bun.password.hash(password);
      const [newTenant] = await db.insert(tenants).values({ name: shopName, path_name: tenantPath }).returning();
      
      const [newUser] = await db.insert(users).values({
        tenantId: newTenant.id, name: ownerName, email: email, passwordHash: passwordHash, role: "OWNER"
      }).returning();

      const token = await jwt.sign({ id: newUser.id, role: newUser.role, tenantId: newTenant.id });
      return { message: "สร้างร้านค้าสำเร็จ!", token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, tenantPath: newTenant.path_name } };
    } catch (e: any) { set.status = 500; return { error: "เกิดข้อผิดพลาดในการสร้างร้านค้า" }; }
  })

  // --- 👤 3. Register (Customer) ---
  .post("/register", async ({ body, set, jwt }: any) => {
    try {
      const { name, email, password } = body;

      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) { set.status = 400; return { error: "อีเมลนี้มีผู้ใช้งานในระบบแล้ว" }; }

      const passwordHash = await Bun.password.hash(password);
      
      const [newUser] = await db.insert(users).values({
        name: name, email: email, passwordHash: passwordHash, role: "CUSTOMER"
      }).returning();

      const token = await jwt.sign({ id: newUser.id, role: newUser.role, tenantId: null });
      return { message: "สมัครสมาชิกสำเร็จ!", token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, tenantPath: null } };
    } catch (e: any) { set.status = 500; return { error: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }; }
  })

  // --- 🏢 4. Get All Shops ---
  .get("/shops", async () => {
    const allShops = await db.select().from(tenants).orderBy(desc(tenants.id));
    return { shops: allShops };
  })

  // ✅ [NEW] 5. Forgot Password (ส่งเมลผ่าน Resend)
  .post("/forgot-password", async ({ body, set }: any) => {
    try {
      const { email } = body;
      const [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user) {
        return { success: true, message: "หากอีเมลนี้อยู่ในระบบ ลิงก์รีเซ็ตจะถูกส่งไป" };
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); 

      await db.update(users)
        .set({ resetPasswordToken: resetToken, resetPasswordExpires: resetExpires })
        .where(eq(users.id, user.id));

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await resend.emails.send({
        from: 'Cozy Booking <onboarding@resend.dev>',
        to: [user.email],
        subject: '🔑 Reset Your Password - Cozy Booking',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px;">
            <h2 style="color: #1a1a1a;">แจ้งรีเซ็ตรหัสผ่าน</h2>
            <p style="color: #666;">คุณได้รับอีเมลฉบับนี้เนื่องจากมีการร้องขอเปลี่ยนรหัสผ่านสำหรับบัญชีของคุณ</p>
            <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #000; color: #fff; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px;">ตั้งรหัสผ่านใหม่ที่นี่</a>
            <p style="margin-top: 30px; font-size: 11px; color: #999;">ลิงก์นี้จะมีอายุการใช้งาน 1 ชั่วโมงเท่านั้น</p>
          </div>
        `
      });

      return { success: true, message: "ส่งอีเมลเรียบร้อยแล้ว" };
    } catch (e) {
      set.status = 500; return { error: "Failed to process request" };
    }
  }, { body: t.Object({ email: t.String() }) })

  // ✅ [NEW] 6. Reset Password (ยืนยันรหัสผ่านใหม่)
  .post("/reset-password", async ({ body, set }: any) => {
    try {
      const { token, newPassword } = body;
      const [user] = await db.select().from(users)
        .where(and(
          eq(users.resetPasswordToken, token),
          gt(users.resetPasswordExpires, new Date())
        ));

      if (!user) {
        set.status = 400; return { error: "ลิงก์หมดอายุหรือ Token ไม่ถูกต้อง" };
      }

      const passwordHash = await Bun.password.hash(newPassword);

      await db.update(users)
        .set({ passwordHash, resetPasswordToken: null, resetPasswordExpires: null })
        .where(eq(users.id, user.id));

      return { success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ!" };
    } catch (e) {
      set.status = 500; return { error: "Reset failed" };
    }
  }, { body: t.Object({ token: t.String(), newPassword: t.String() }) })
);