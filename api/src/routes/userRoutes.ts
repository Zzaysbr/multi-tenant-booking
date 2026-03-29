// api/src/routes/userRoutes.ts
import { Elysia } from "elysia";
import { updateProfile, uploadAvatar } from "../controllers/userController";
import { tenantAuthMiddleware } from "../middlewares/tenantAuth";
import { db } from "../db";
import { bookings, services, staffs, tenants } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const userRoutes = (app: Elysia) => 
  app
    .use(tenantAuthMiddleware)
    .group("/api/user", (group) => 
      group
        // --- 📝 อัปเดตโปรไฟล์ ---
        .patch("/profile", ({ body, currentUser }) => {
          if (!currentUser) throw new Error("Unauthorized");
          return updateProfile({ body, currentUser });
        })
        
        // --- 📸 อัปโหลดรูป (รับไฟล์แบบ Multipart) ---
        .post("/upload-avatar", ({ request, currentUser }) => {
          if (!currentUser) throw new Error("Unauthorized");
          return uploadAvatar({ request, currentUser });
        })

        // ✅ [NEW] ดึงประวัติรวมทุกร้าน (Global History)
        .get("/my-bookings", async ({ currentUser, set }: any) => {
          if (!currentUser) { set.status = 401; return { error: "Unauthorized" }; }
          try {
            const myHistory = await db.select({
              id: bookings.id,
              serviceName: services.name,
              staffName: staffs.name,
              status: bookings.status,
              startTime: bookings.startTime,
              price: services.price,
              shopName: tenants.name,       // ดึงชื่อร้าน
              tenantPath: tenants.path_name // ดึง Path ร้านเพื่อไปทำลิงก์ Payment
            })
            .from(bookings)
            .innerJoin(services, eq(bookings.serviceId, services.id))
            .innerJoin(staffs, eq(bookings.staffId, staffs.id))
            .innerJoin(tenants, eq(bookings.tenantId, tenants.id))
            .where(eq(bookings.customerId, currentUser.id))
            .orderBy(desc(bookings.startTime));
      
            return { bookings: myHistory };
          } catch (e) {
            set.status = 500; return { error: "Failed to load global history" };
          }
        })
    );