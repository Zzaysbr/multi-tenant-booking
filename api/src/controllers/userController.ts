import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { join } from "path";
import { mkdir } from "node:fs/promises";

// --- 📝 อัปเดตข้อมูลทั่วไป ---
export const updateProfile = async ({ body, currentUser }: any) => {
  const { name, phone } = body;
  
  await db.update(users)
    .set({ name, phone })
    .where(eq(users.id, currentUser.id)); // ✅ ใช้ id จาก JWT payload

  return { message: "อัปเดตข้อมูลสำเร็จ" };
};

// --- 📸 อัปโหลดรูปโปรไฟล์ ---
export const uploadAvatar = async ({ request, currentUser }: any) => {
  const formData = await request.formData();
  const file = formData.get("avatar") as File;

  if (!file) throw new Error("กรุณาเลือกไฟล์ภาพ");

  // สร้างที่เก็บรูป
  const uploadDir = join(process.cwd(), "public/uploads/avatars");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
  const filePath = join(uploadDir, fileName);

  // ✅ Bun.write (Native Speed)
  await Bun.write(filePath, file);

  const avatarUrl = `${process.env.BACKEND_URL}/uploads/avatars/${fileName}`;
  
  await db.update(users)
    .set({ avatar_url: avatarUrl })
    .where(eq(users.id, currentUser.id));

  return { avatarUrl, message: "เปลี่ยนรูปโปรไฟล์เรียบร้อย" };
};