// api/src/modules/admin.ts
import { Elysia, t } from "elysia";
import { db } from "../db";
import { tenants, users, bookings } from "../db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { tenantAuthMiddleware } from "../middlewares/tenantAuth";

export const adminModule = (app: Elysia) => app
  .use(tenantAuthMiddleware)
  .group('/api/admin', (group) => group
    
    // 🛡️ Guard: ตรวจสอบสิทธิ์ระดับสููงสุด (Super Admin Only)
    .onBeforeHandle(({ currentUser, set }: any) => {
      if (!currentUser || currentUser.role !== 'ADMIN') {
        set.status = 403;
        return { error: "Access Denied: Requires Super Admin privileges." };
      }
    })

    // --- 📊 1. Dashboard Stats ---
    .get("/dashboard", async () => {
      try {
        const [tenantCount] = await db.select({ count: sql<number>`count(*)::int` }).from(tenants);
        const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
        const [bookingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(bookings);

        return {
          stats: {
            totalShops: tenantCount.count,
            totalUsers: userCount.count,
            totalBookings: bookingCount.count
          }
        };
      } catch (e) {
        return { error: "Failed to load admin stats" };
      }
    })

    // --- 🏢 2. Tenant Management ---
    .get("/tenants", async () => {
      try {
        // รายชื่อร้านทั้งหมด พร้อมยอดจอง
        const shops = await db.select({
          id: tenants.id,
          name: tenants.name,
          path_name: tenants.path_name,
          createdAt: tenants.createdAt,
          bookingCount: sql<number>`count(${bookings.id})::int`
        })
        .from(tenants)
        .leftJoin(bookings, eq(tenants.id, bookings.tenantId))
        .groupBy(tenants.id, tenants.name, tenants.path_name, tenants.createdAt)
        .orderBy(desc(tenants.createdAt));

        return { tenants: shops };
      } catch (e) {
        return { error: "Failed to load tenants" };
      }
    })

    // (โบนัส) ลบร้านค้า (สำหรับ Admin ลบร้านขยะ)
    .delete("/tenants/:id", async ({ params: { id }, set }: any) => {
      try {
        // *ในระบบจริง ควรใช้ Soft Delete แต่โจทย์นี้ให้ลบแข็งเลย
        await db.delete(tenants).where(eq(tenants.id, Number(id)));
        return { success: true, message: "Tenant deleted successfully" };
      } catch (e) {
        set.status = 500;
        return { error: "Failed to delete tenant. Please check constraints." };
      }
    })

    // --- 👥 3. User Management ---
    .get("/users", async () => {
      try {
        const allUsers = await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          shopName: tenants.name // ดูว่าผูกกับร้านไหน (ถ้ามี)
        })
        .from(users)
        .leftJoin(tenants, eq(users.tenantId, tenants.id))
        .orderBy(desc(users.createdAt));

        return { users: allUsers };
      } catch (e) {
        return { error: "Failed to load users" };
      }
    })

    // อัปเดต Role ผู้ใช้ (ให้เป็น Admin/Owner/Customer)
    .patch("/users/:id/role", async ({ params: { id }, body, set }: any) => {
      try {
        const { role } = body as { role: 'ADMIN' | 'OWNER' | 'STAFF' | 'CUSTOMER' };
        await db.update(users).set({ role }).where(eq(users.id, Number(id)));
        return { success: true };
      } catch (e) {
        set.status = 500; return { error: "Failed to update role" };
      }
    }, {
      body: t.Object({
        role: t.Union([t.Literal('ADMIN'), t.Literal('OWNER'), t.Literal('STAFF'), t.Literal('CUSTOMER')])
      })
    })
  );