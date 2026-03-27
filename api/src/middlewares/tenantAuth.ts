import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { tenants } from "../db/schema";
import { eq } from "drizzle-orm";

interface JWTPayload {
  userId: number;
  role: string;
  tenantId: number;
}

export const tenantAuthMiddleware = (app: Elysia) =>
  app
    .use(
      jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!,
      })
    )
    .derive(async ({ params, headers, jwt, set }) => {
      const tenantPath = (params as Record<string, string>)?.tenantPath;
      
      if (!tenantPath) {
        set.status = 400;
        throw new Error("Bad Request - ไม่พบข้อมูลร้านค้าใน URL");
      }

      const tenantResult = await db.select().from(tenants).where(eq(tenants.path_name, tenantPath));
      const tenant = tenantResult[0];

      if (!tenant) {
        set.status = 404;
        throw new Error("ไม่พบร้านค้านี้ในระบบ");
      }

      const authHeader = headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        set.status = 401;
        throw new Error("Unauthorized - กรุณาเข้าสู่ระบบ");
      }

      const payload = (await jwt.verify(token)) as JWTPayload | false;
      
      if (!payload) {
        set.status = 401;
        throw new Error("Token ไม่ถูกต้องหรือหมดอายุ");
      }

      if ((payload.role === "OWNER" || payload.role === "STAFF") && payload.tenantId !== tenant.id) {
        set.status = 403;
        throw new Error("Forbidden - คุณไม่มีสิทธิ์เข้าถึงข้อมูลของร้านนี้");
      }

      return {
        currentTenant: tenant,
        currentUser: payload
      };
    });