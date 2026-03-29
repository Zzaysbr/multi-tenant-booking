// api/src/controllers/oauthController.ts
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

/**
 * 1. ฟังก์ชันสำหรับสร้าง URL และ Redirect ผู้ใช้ไปยังหน้า Login ของ Google
 */
export const googleAuthRedirect = () => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  
  const options = {
    redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);
  
  // ส่งผู้ใช้ไปยังหน้า Google Login
  return Response.redirect(`${rootUrl}?${qs.toString()}`);
};

/**
 * 2. ฟังก์ชัน Callback ที่ Google จะส่ง code กลับมาให้
 * เราจะเอา code ไปแลกข้อมูล User และทำการออก JWT ของระบบเราเอง
 */
export const googleAuthCallback = async ({ query }: any) => {
  const code = query.code;
  
  if (!code) {
    return Response.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
  }

  try {
    // --- 🧪 Step A: เอา Code ไปแลก Access Token ---
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    const { access_token } = tokenData;

    // --- 🧪 Step B: ดึงข้อมูลโปรไฟล์จาก Google ---
    const userRes = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`
    );
    const googleUser = await userRes.json();

    // --- 🧪 Step C: ตรวจสอบหรือสร้าง User ใน Database ---
    let [user] = await db.select().from(users).where(eq(users.email, googleUser.email));

    if (!user) {
      // ถ้ายังไม่มี User ให้สมัครสมาชิกให้เลยอัตโนมัติ (เป็น CUSTOMER)
      const [newUser] = await db.insert(users).values({
        email: googleUser.email,
        name: googleUser.name,
        passwordHash: "OAUTH_EXTERNAL_GOOGLE", // แฟล็กไว้ว่าล็อกอินผ่านภายนอก
        role: "CUSTOMER",
        // avatar_url: googleUser.picture // ถ้าพี่เปิดฟิลด์นี้ใน schema แล้วก็ปลดล็อกได้เลยครับ
      }).returning();
      user = newUser;
    }

    // --- 🧪 Step D: ออก JWT (Payload ต้องเป๊ะตามระบบหลัก) ---
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || null
    };

    const token = jwt.sign(
      tokenPayload, 
      process.env.JWT_SECRET || 'super-secret-key', 
      { expiresIn: '7d' }
    );

    // --- 🧪 Step E: เตรียมข้อมูล User ส่งกลับไปให้ Frontend ---
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantPath: null // Social Login ส่วนใหญ่จะเริ่มที่หน้า Global
    }));

    // Redirect กลับไปที่หน้าสำเร็จของ Frontend พร้อมแนบตั๋ว (Token) ไปด้วย
    return Response.redirect(
      `${process.env.FRONTEND_URL}/auth-success?token=${token}&user=${userData}`
    );

  } catch (error) {
    console.error("Google OAuth Error:", error);
    return Response.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};