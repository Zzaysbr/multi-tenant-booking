import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";

import { db } from "./db";
import { staffs, services } from "./db/schema";

import { authModule } from "./modules/auth";
import { bookingModule } from "./modules/booking";
import { paymentModule } from "./modules/payment";
import { tenantAuthMiddleware } from "./middlewares/tenantAuth";

const app = new Elysia()
  .use(cors())
  .use(swagger({ path: '/docs' }))
  
  // 1. Global API (สมัคร/เข้าสู่ระบบ/เปิดร้าน)
  .use(authModule)
  
  // 2. Tenant API (มี Middleware เฝ้า)
  .group("/api/:tenantPath", (app) =>
    app
      .use(tenantAuthMiddleware)
      
      .get("/info", ({ currentTenant, currentUser }: any) => {
        return { message: `ยินดีต้อนรับสู่ร้าน ${currentTenant.name}`, tenantInfo: currentTenant, accessedBy: currentUser };
      })
      
      // 🧪 API จำลองข้อมูล
      .post("/seed", async ({ currentTenant }: any) => {
        await db.insert(staffs).values({ tenantId: currentTenant.id, name: "ช่างเอ" });
        await db.insert(staffs).values({ tenantId: currentTenant.id, name: "ช่างบี" });
        await db.insert(services).values({ tenantId: currentTenant.id, name: "ตัดผมชาย", durationMinutes: 60, price: 300 });
        await db.insert(services).values({ tenantId: currentTenant.id, name: "สระไดร์", durationMinutes: 30, price: 150 });
        return { message: "สร้างข้อมูลจำลองสำเร็จ!" };
      })

      .use(bookingModule)
      .use(paymentModule)
  )
  .listen(3000);

console.log(`🦊 Elysia SaaS Backend is running at ${app.server?.hostname}:${app.server?.port}`);