// api/src/modules/auth.ts
import Elysia, { t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { users, tenants } from "../db/schema";
import { desc, eq, and, gt } from "drizzle-orm";
import { Resend } from 'resend';
import * as crypto from "crypto";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export const authModule = (app: Elysia) => app.group('/auth', (group) => group
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'super-secret-key' }))

  // --- 🔑 1. Login ปกติ (คงเดิม) ---
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

  // --- 🌐 2. Google OAuth Redirect (ฉบับอัปเกรดกันหน้าขาว) ---
  .get("/google", ({ query, set }) => {
    console.log("🎯 [Auth] กำลังสร้างคำสั่ง Redirect ให้เบราว์เซอร์...");
    
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const backendUrl = process.env.BACKEND_URL;

    if (!clientId || !backendUrl) {
      console.error("❌ [Auth] Configuration Missing!");
      return "Config Error: Check your .env file";
    }

    const options = {
      redirect_uri: `${backendUrl}/auth/google/callback`,
      client_id: clientId,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
      ].join(" "),
      state: (query.redirect as string) || "", 
    };
    
    const qs = new URLSearchParams(options);
    const googleAuthUrl = `${rootUrl}?${qs.toString()}`;
    
    console.log("🚀 [Auth] เบราว์เซอร์รับคำสั่ง Redirect แล้ว!");

    // ✅ ใช้ Response.redirect แทน set.redirect เพื่อความ "ชัวร์" ในทุุกเบราว์เซอร์
    return Response.redirect(googleAuthUrl);
  })

  // --- 🌐 3. Google OAuth Callback (FIXED & FULL) ---
  .get("/google/callback", async ({ query, jwt }) => {
    const { code, state } = query;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const backendUrl = process.env.BACKEND_URL;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!code) return Response.redirect(`${frontendUrl}/login?error=no_code`);

    try {
      // 1. แลก Code เป็น Access Token
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: `${backendUrl}/auth/google/callback`, 
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error("Token Exchange Failed");

      // 2. ดึงข้อมูล Profile
      const userRes = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokenData.access_token}`);
      const googleUser = await userRes.json();

      // 3. ค้นหาพร้อม Join TenantPath (เพื่อให้หน้าบ้านเปลี่ยนหน้าถูก)
      const result = await db.select({
        id: users.id, name: users.name, email: users.email, role: users.role, 
        tenantId: users.tenantId, tenantPath: tenants.path_name, avatar_url: users.avatar_url
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(eq(users.email, googleUser.email))
      .limit(1);

      let user = result[0];

      if (!user) {
        const [newUser] = await db.insert(users).values({
          email: googleUser.email, name: googleUser.name, avatar_url: googleUser.picture,
          passwordHash: "google-auth-locked", role: "CUSTOMER"
        }).returning();
        user = { ...newUser, tenantPath: null };
      } else {
        await db.update(users).set({ avatar_url: googleUser.picture }).where(eq(users.id, user.id));
      }

      // 4. สร้าง JWT
      const token = await jwt.sign({ id: user.id, role: user.role, tenantId: user.tenantId });
      
      // 5. ส่งกลับไปหน้าบ้าน (ใช้ Response.redirect เพื่อกัน Safari ขาว)
      const userData = encodeURIComponent(JSON.stringify({ 
        id: user.id, name: user.name, email: user.email, role: user.role, tenantPath: user.tenantPath || null, avatar_url: user.avatar_url 
      }));
      
      const finalSuccessUrl = `${frontendUrl}/auth-success?token=${token}&user=${userData}&redirect=${state}`;
      return Response.redirect(finalSuccessUrl);
      
    } catch (e) {
      console.error("🔥 Callback Error:", e);
      return Response.redirect(`${frontendUrl}/login?error=callback_failed`);
    }
  })

  // --- 🏪 4. Create Shop (คงเดิม) ---
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
        tenantId: newTenant.id, name: ownerName, email: email, passwordHash, role: "OWNER"
      }).returning();

      const token = await jwt.sign({ id: newUser.id, role: newUser.role, tenantId: newTenant.id });
      return { message: "สร้างร้านค้าสำเร็จ!", token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, tenantPath: newTenant.path_name } };
    } catch (e: any) { set.status = 500; return { error: "Server error" }; }
  })

  // --- 👤 5. Register (คงเดิม) ---
  .post("/register", async ({ body, set, jwt }: any) => {
    try {
      const { name, email, password } = body;
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) { set.status = 400; return { error: "อีเมลนี้มีผู้ใช้งานในระบบแล้ว" }; }
      const passwordHash = await Bun.password.hash(password);
      const [newUser] = await db.insert(users).values({ name, email, passwordHash, role: "CUSTOMER" }).returning();
      const token = await jwt.sign({ id: newUser.id, role: newUser.role, tenantId: null });
      return { message: "สมัครสมาชิกสำเร็จ!", token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, tenantPath: null } };
    } catch (e: any) { set.status = 500; return { error: "Server error" }; }
  })

  .get("/shops", async () => ({ shops: await db.select().from(tenants).orderBy(desc(tenants.id)) }))

  // --- 📧 7. Forgot/Reset Password (คงเดิม) ---
  .post("/forgot-password", async ({ body, set }: any) => {
    try {
      const { email } = body;
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) return { success: true, message: "หากอีเมลนี้อยู่ในระบบ ลิงก์รีเซ็ตจะถูกส่งไป" };
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); 
      await db.update(users).set({ resetPasswordToken: resetToken, resetPasswordExpires: resetExpires }).where(eq(users.id, user.id));
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await resend.emails.send({
        from: 'Cozy Booking <onboarding@resend.dev>',
        to: [user.email],
        subject: '🔑 Reset Your Password - Cozy Booking',
        html: `<div style="padding: 20px;"><h2>Reset Password</h2><p>คลิกเพื่อเปลี่ยนรหัสผ่าน: <a href="${resetLink}">${resetLink}</a></p></div>`
      });
      return { success: true, message: "ส่งอีเมลเรียบร้อยแล้ว" };
    } catch (e) { set.status = 500; return { error: "Failed to process request" }; }
  }, { body: t.Object({ email: t.String() }) })

  .post("/reset-password", async ({ body, set }: any) => {
    try {
      const { token, newPassword } = body;
      const [user] = await db.select().from(users).where(and(eq(users.resetPasswordToken, token), gt(users.resetPasswordExpires, new Date())));
      if (!user) { set.status = 400; return { error: "ลิงก์หมดอายุหรือ Token ไม่ถูกต้อง" }; }
      const passwordHash = await Bun.password.hash(newPassword);
      await db.update(users).set({ passwordHash, resetPasswordToken: null, resetPasswordExpires: null }).where(eq(users.id, user.id));
      return { success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ!" };
    } catch (e) { set.status = 500; return { error: "Reset failed" }; }
  }, { body: t.Object({ token: t.String(), newPassword: t.String() }) })
);