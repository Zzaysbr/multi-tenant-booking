import { Elysia } from "elysia";
import { db } from "../db";
import { staffs, services, bookings, users, payments } from "../db/schema"; 
import { eq, and, desc, sql } from "drizzle-orm";

export const ownerModule = (app: Elysia) => app.group('/owner', (group) => group
  .onBeforeHandle(({ currentUser, currentTenant, set }: any) => {
    if (!currentTenant) {
      set.status = 404; return { error: "ไม่พบร้านค้า" };
    }
    if (!currentUser || (currentUser.role !== 'OWNER' && currentUser.role !== 'STAFF')) {
      set.status = 401; return { error: "ไม่มีสิทธิ์เข้าถึง" };
    }
  })
  
  .get("/stats", async ({ currentTenant }: any) => {
    const [counts] = await db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where status = 'pending')`,
      confirmed: sql<number>`count(*) filter (where status = 'confirmed')`
    }).from(bookings).where(eq(bookings.tenantId, currentTenant.id));
    return { stats: counts };
  })


  .get("/bookings", async ({ currentTenant }: any) => {
    const result = await db.select({
      id: bookings.id, 
      customerName: users.name, 
      serviceName: services.name,
      staffName: staffs.name, 
      status: bookings.status, 
      startTime: bookings.startTime,
      createdAt: bookings.createdAt,
      slipUrl: payments.slipUrl, 
      paymentStatus: payments.status 
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.customerId, users.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(staffs, eq(bookings.staffId, staffs.id))
    .leftJoin(payments, eq(bookings.id, payments.bookingId))
    .where(eq(bookings.tenantId, currentTenant.id))
    .orderBy(desc(bookings.createdAt));
    
    return { bookings: result };
  })

  .patch("/bookings/:id/status", async ({ params: { id }, body, currentTenant }: any) => {
    const { status } = body as any;
    await db.update(bookings).set({ status }).where(and(eq(bookings.id, Number(id)), eq(bookings.tenantId, currentTenant.id)));
    return { success: true };
  })

  .get("/staffs", async ({ currentTenant }: any) => {
    const res = await db.select().from(staffs).where(eq(staffs.tenantId, currentTenant.id)).orderBy(desc(staffs.id));
    return { staffs: res };
  })
  .post("/staffs", async ({ currentTenant, body }: any) => {
    const [res] = await db.insert(staffs).values({ tenantId: currentTenant.id, name: body.name }).returning();
    return { staff: res };
  })
  .patch("/staffs/:id", async ({ params: { id }, body, currentTenant }: any) => {
    await db.update(staffs).set({ name: body.name }).where(and(eq(staffs.id, Number(id)), eq(staffs.tenantId, currentTenant.id)));
    return { success: true };
  })
  .delete("/staffs/:id", async ({ params: { id }, currentTenant }: any) => {
    await db.delete(staffs).where(and(eq(staffs.id, Number(id)), eq(staffs.tenantId, currentTenant.id)));
    return { success: true };
  })

  .get("/services", async ({ currentTenant }: any) => {
    const res = await db.select().from(services).where(eq(services.tenantId, currentTenant.id)).orderBy(desc(services.id));
    return { services: res };
  })
  .post("/services", async ({ currentTenant, body }: any) => {
    const [res] = await db.insert(services).values({ tenantId: currentTenant.id, name: body.name, price: Number(body.price), durationMinutes: Number(body.durationMinutes) }).returning();
    return { service: res };
  })
  .patch("/services/:id", async ({ params: { id }, body, currentTenant }: any) => {
    await db.update(services).set({ name: body.name, price: Number(body.price), durationMinutes: Number(body.durationMinutes) }).where(and(eq(services.id, Number(id)), eq(services.tenantId, currentTenant.id)));
    return { success: true };
  })
  .delete("/services/:id", async ({ params: { id }, currentTenant }: any) => {
    await db.delete(services).where(and(eq(services.id, Number(id)), eq(services.tenantId, currentTenant.id)));
    return { success: true };
  })

  .get("/customers", async ({ currentTenant }: any) => {
    const result = await db.selectDistinct({ id: users.id, name: users.name, email: users.email, lineUserId: users.lineUserId })
      .from(users).innerJoin(bookings, eq(users.id, bookings.customerId)).where(eq(bookings.tenantId, currentTenant.id));
    return { customers: result };
  })
  .get("/config", async ({ currentTenant }: any) => {
    return { config: currentTenant };
  })
);