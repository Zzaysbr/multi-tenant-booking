import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { users, tenants } from "../db/schema";
import { eq } from "drizzle-orm";

export const authModule = new Elysia({ prefix: '/auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET!,
    })
  )
  .post("/register", async ({ body, set }) => {
    const { email, password, name, tenantId } = body as any;
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      set.status = 400;
      return { error: "Email นี้ถูกใช้งานแล้ว" };
    }
    const hashedPassword = await Bun.password.hash(password);
    const newUser = await db.insert(users).values({
      email, passwordHash: hashedPassword, name, tenantId, role: "CUSTOMER"
    }).returning();
    return { message: "สมัครสมาชิกสำเร็จ", user: newUser[0] };
  })
  .post("/login", async ({ body, set, jwt }) => {
    const { email, password } = body as any;
    const userResult = await db.select().from(users).where(eq(users.email, email));
    const user = userResult[0];
    if (!user) {
      set.status = 401;
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
    const isMatch = await Bun.password.verify(password, user.passwordHash);
    if (!isMatch) {
      set.status = 401;
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
    const token = await jwt.sign({ userId: user.id, role: user.role, tenantId: user.tenantId });
    return { message: "เข้าสู่ระบบสำเร็จ", token, role: user.role, tenantId: user.tenantId };
  })
  .post("/create-shop", async ({ body, set }) => {
    const { shopName, pathName, email, password, ownerName } = body as any;
    const existingTenant = await db.select().from(tenants).where(eq(tenants.path_name, pathName));
    if (existingTenant.length > 0) {
      set.status = 400;
      return { error: "ชื่อ URL ร้านนี้มีคนใช้แล้ว โปรดเลือกชื่ออื่น" };
    }
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      set.status = 400;
      return { error: "Email นี้ถูกใช้งานแล้ว" };
    }
    try {
      const result = await db.transaction(async (tx) => {
        const newTenant = await tx.insert(tenants).values({ name: shopName, path_name: pathName }).returning();
        const tenantId = newTenant[0].id;
        const hashedPassword = await Bun.password.hash(password);
        const newOwner = await tx.insert(users).values({
          tenantId: tenantId, email: email, passwordHash: hashedPassword, name: ownerName, role: "OWNER"
        }).returning();
        return { tenant: newTenant[0], owner: newOwner[0] };
      });
      return { message: "เปิดร้านสำเร็จ!", data: result };
    } catch (error) {
      set.status = 500;
      return { error: "เกิดข้อผิดพลาดในการสร้างร้านค้า" };
    }
  });