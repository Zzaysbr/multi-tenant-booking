// api/src/middlewares/tenantAuth.ts
import Elysia from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { tenants } from "../db/schema";
import { eq } from "drizzle-orm";

export const tenantAuthMiddleware = (app: Elysia) => app
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'super-secret-key' }))
  .derive(async ({ params, request, jwt }) => {
    try {
      let tenantPath = params?.tenantPath as string | undefined;
      
      // Fallback path detection
      if (!tenantPath) {
        const url = new URL(request.url);
        const segments = url.pathname.split('/');
        const apiIdx = segments.indexOf('api');
        if (apiIdx !== -1 && segments.length > apiIdx + 1) tenantPath = segments[apiIdx + 1];
      }

      if (!tenantPath) return { currentTenant: null, currentUser: null };

      // ดึงข้อมูล Tenant
      const [tenant] = await db.select().from(tenants).where(eq(tenants.path_name, tenantPath)).limit(1);
      if (!tenant) return { currentTenant: null, currentUser: null };

      let currentUser = null;
      const authHeader = request.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const payload = await jwt.verify(token);

        if (payload && typeof payload.id === 'number') {
          // 🛡️ OWASP A01: ตรวจสอบว่าถ้าเป็น OWNER/STAFF ต้องเป็นของ Tenant นี้จริงหรือไม่
          const isBelongToTenant = payload.tenantId === null || payload.tenantId === tenant.id;
          
          if (isBelongToTenant) {
            currentUser = {
              id: payload.id,
              email: payload.email,
              role: payload.role,
              tenantId: payload.tenantId
            };
          }
        }
      }

      return { currentTenant: tenant, currentUser: currentUser };
    } catch (err) {
      console.error("Auth Middleware Error:", err);
      return { currentTenant: null, currentUser: null };
    }
  });