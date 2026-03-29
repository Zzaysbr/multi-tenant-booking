// api/src/routes/userRoutes.ts
import { Elysia, t } from "elysia";
import { updateProfile, uploadAvatar } from "../controllers/userController";
import { tenantAuthMiddleware } from "../middlewares/tenantAuth";
import { db } from "../db";
import { bookings, services, staffs, tenants, users } from "../db/schema";
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

        // ✅ [NEW] ให้ Owner ที่ยังไม่มีร้าน สร้างร้านของตัวเองได้
        .post("/create-shop", async ({ body, currentUser, set }: any) => {
          if (!currentUser) { set.status = 401; return { error: "Unauthorized" }; }
          if (currentUser.role !== 'OWNER') { set.status = 403; return { error: "Access Denied" }; }
          if (currentUser.tenantId) { set.status = 400; return { error: "You already have a shop" }; }

          const { name, path_name } = body as any;
          try {
            const existing = await db.select().from(tenants).where(eq(tenants.path_name, path_name));
            if (existing.length > 0) {
              set.status = 400; return { error: "URL นี้มีคนใช้งานแล้ว กรุณาเปลี่ยนใหม่" };
            }

            const [newTenant] = await db.insert(tenants).values({ name, path_name }).returning();
            await db.update(users).set({ tenantId: newTenant.id }).where(eq(users.id, currentUser.id));

            return { success: true, tenant: newTenant };
          } catch (e) {
            set.status = 500; return { error: "Failed to create shop" };
          }
        }, { 
          body: t.Object({ name: t.String(), path_name: t.String() }) 
        })

        // ✅ ดึงประวัติรวมทุกร้าน (Global History)
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
              shopName: tenants.name,
              tenantPath: tenants.path_name
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