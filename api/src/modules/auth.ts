import Elysia from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { users, tenants } from "../db/schema";
import { desc, eq } from "drizzle-orm";

export const authModule = (app: Elysia) => app.group('/auth', (group) => group
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'super-secret-key' }))
  

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

  .get("/shops", async () => {
    const allShops = await db.select().from(tenants).orderBy(desc(tenants.id));
    return { shops: allShops };
  })
);