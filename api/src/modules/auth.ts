// api/src/modules/auth.ts
import Elysia, { t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { users, tenants } from "../db/schema";
import { desc, eq, and, gt } from "drizzle-orm";
import { Resend } from 'resend';
import * as crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

// 🛡️ OWASP A07: Password Policy (8+ ตัวอักษร, มีตัวอักษรและตัวเลข)
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const authModule = (app: Elysia) => app.group('/auth', (group) => group
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'super-secret-key' }))

  // --- 🔑 1. Login ---
  .post("/login", async ({ body, set, jwt }: any) => {
    try {
      const { email, password } = body;
      const result = await db.select({
        id: users.id, name: users.name, email: users.email, role: users.role, 
        tenantId: users.tenantId, tenantPath: tenants.path_name, passwordHash: users.passwordHash
      }).from(users).leftJoin(tenants, eq(users.tenantId, tenants.id)).where(eq(users.email, email)).limit(1);

      const user = result[0];
      if (!user || !(await Bun.password.verify(password, user.passwordHash))) {
        set.status = 401; return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
      }

      const token = await jwt.sign({ id: user.id, role: user.role, tenantId: user.tenantId, email: user.email });
      return { message: "เข้าสู่ระบบสำเร็จ", token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantPath: user.tenantPath || null } };
    } catch (e: any) { set.status = 500; return { error: "Server error" }; }
  }, {
    body: t.Object({
      email: t.String({ format: 'email', description: "ต้องเป็นรูปแบบอีเมลที่ถูกต้อง" }),
      password: t.String()
    })
  })

  // --- 🌐 2. Google OAuth Redirect ---
  .get("/google", ({ query }) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const backendUrl = process.env.BACKEND_URL;
    if (!clientId || !backendUrl) return "Config Error: Check api/.env";

    const options = {
      redirect_uri: `${backendUrl}/auth/google/callback`,
      client_id: clientId,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"].join(" "),
      state: (query.redirect as string) || "", 
    };
    
    return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(options)}`);
  })

  // --- 🌐 3. Google OAuth Callback ---
  .get("/google/callback", async ({ query, jwt }) => {
    const { code, state } = query;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const backendUrl = process.env.BACKEND_URL;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!code) return Response.redirect(`${frontendUrl}/login?error=no_code`);

    try {
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
      const userRes = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokenData.access_token}`);
      const googleUser = await userRes.json();

      const result = await db.select({
        id: users.id, name: users.name, email: users.email, role: users.role, 
        tenantId: users.tenantId, tenantPath: tenants.path_name, avatar_url: users.avatar_url
      }).from(users).leftJoin(tenants, eq(users.tenantId, tenants.id)).where(eq(users.email, googleUser.email)).limit(1);

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

      const token = await jwt.sign({ id: user.id, role: user.role, tenantId: user.tenantId, email: user.email });
      const userData = encodeURIComponent(JSON.stringify({ 
        id: user.id, name: user.name, email: user.email, role: user.role, tenantPath: user.tenantPath || null 
      }));
      
      return Response.redirect(`${frontendUrl}/auth-success?token=${token}&user=${userData}&redirect=${state}`);
    } catch (e) {
      return Response.redirect(`${frontendUrl}/login?error=callback_failed`);
    }
  })

  // --- 🏪 4. Create Shop ---
  .post("/create-shop", async ({ body, set, jwt }: any) => {
    try {
      const { shopName, tenantPath, ownerName, email, password } = body;
      
      // 🛡️ OWASP A07: บังคับความปลอดภัยรหัสผ่าน
      if (!passwordRegex.test(password)) {
        set.status = 400; return { error: "รหัสผ่านต้องมี 8 ตัวอักษรขึ้นไปและประกอบด้วยตัวเลข" };
      }

      const existingTenant = await db.select().from(tenants).where(eq(tenants.path_name, tenantPath)).limit(1);
      if (existingTenant.length > 0) { set.status = 400; return { error: "URL ร้านค้านี้มีคนใช้งานแล้ว" }; }
      
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) { set.status = 400; return { error: "อีเมลนี้มีผู้ใช้งานในระบบแล้ว" }; }

      const passwordHash = await Bun.password.hash(password);
      const [newTenant] = await db.insert(tenants).values({ 
        name: shopName, 
        path_name: tenantPath.toLowerCase().replace(/[^a-z0-9-]/g, '') 
      }).returning();

      const [newUser] = await db.insert(users).values({
        tenantId: newTenant.id, name: ownerName, email, passwordHash, role: "OWNER"
      }).returning();

      const token = await jwt.sign({ id: newUser.id, role: newUser.role, tenantId: newTenant.id, email: newUser.email });
      return { message: "สร้างร้านค้าสำเร็จ!", token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, tenantPath: newTenant.path_name } };
    } catch (e: any) { set.status = 500; return { error: "Server error" }; }
  }, {
    body: t.Object({
      shopName: t.String({ minLength: 3 }),
      tenantPath: t.String({ minLength: 3 }),
      ownerName: t.String({ minLength: 2 }),
      email: t.String({ format: 'email' }),
      password: t.String()
    })
  })

  // --- 👤 5. Register (Customer) ---
  .post("/register", async ({ body, set, jwt }: any) => {
    try {
      const { name, email, password } = body;
      
      if (!passwordRegex.test(password)) {
        set.status = 400; return { error: "รหัสผ่านไม่ปลอดภัยพอ (ต้องการ 8+ ตัวและตัวเลข)" };
      }

      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) { set.status = 400; return { error: "อีเมลนี้มีผู้ใช้งานในระบบแล้ว" }; }

      const passwordHash = await Bun.password.hash(password);
      const [newUser] = await db.insert(users).values({ name, email, passwordHash, role: "CUSTOMER" }).returning();
      
      const token = await jwt.sign({ id: newUser.id, role: newUser.role, tenantId: null, email: newUser.email });
      return { message: "สมัครสมาชิกสำเร็จ!", token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, tenantPath: null } };
    } catch (e: any) { set.status = 500; return { error: "Server error" }; }
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      email: t.String({ format: 'email' }),
      password: t.String()
    })
  })

  // --- 🏢 6. Get Shops ---
  .get("/shops", async () => ({ shops: await db.select().from(tenants).orderBy(desc(tenants.id)) }))

  // --- 📧 7. Forgot Password ---
  .post("/forgot-password", async ({ body, set }: any) => {
    try {
      const { email } = body;
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) return { success: true, message: "ระบบได้ส่งขั้นตอนการรีเซ็ตไปที่อีเมลของคุณแล้ว" };

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); 
      await db.update(users).set({ resetPasswordToken: resetToken, resetPasswordExpires: resetExpires }).where(eq(users.id, user.id));

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await resend.emails.send({
        from: 'Cozy Booking <onboarding@resend.dev>',
        to: [user.email],
        subject: '🔑 Reset Your Password',
        html: `<p>คลิกเพื่อเปลี่ยนรหัสผ่าน: <a href="${resetLink}">${resetLink}</a></p>`
      });
      return { success: true };
    } catch (e) { set.status = 500; return { error: "Email error" }; }
  }, { body: t.Object({ email: t.String({ format: 'email' }) }) })

  // --- 🔑 8. Reset Password ---
  .post("/reset-password", async ({ body, set }: any) => {
    try {
      const { token, newPassword } = body;
      if (!passwordRegex.test(newPassword)) {
        set.status = 400; return { error: "รหัสผ่านใหม่ต้องมี 8 ตัวขึ้นไปและมีตัวเลข" };
      }
      const [user] = await db.select().from(users).where(and(eq(users.resetPasswordToken, token), gt(users.resetPasswordExpires, new Date())));
      if (!user) { set.status = 400; return { error: "ลิงก์รีเซ็ตรหัสผ่านหมดอายุหรือผิดพลาด" }; }
      
      const passwordHash = await Bun.password.hash(newPassword);
      await db.update(users).set({ passwordHash, resetPasswordToken: null, resetPasswordExpires: null }).where(eq(users.id, user.id));
      return { success: true };
    } catch (e) { set.status = 500; return { error: "Reset failed" }; }
  }, { body: t.Object({ token: t.String(), newPassword: t.String() }) })
);