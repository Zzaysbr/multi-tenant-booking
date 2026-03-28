import { Elysia, t } from "elysia";
import { db } from "../db";
import { staffs, services, bookings, users, payments, tenants } from "../db/schema"; 
import { eq, and, desc, sql } from "drizzle-orm";

export const ownerModule = (app: Elysia) => app.group('/owner', (group) => group
  
  .onBeforeHandle(({ currentUser, currentTenant, set }: any) => {
    if (!currentTenant) {
      set.status = 404; return { error: "ไม่พบข้อมูลร้านค้า" };
    }
    if (!currentUser || (currentUser.role !== 'OWNER' && currentUser.role !== 'STAFF')) {
      set.status = 401; return { error: "ไม่มีสิทธิ์เข้าถึงส่วนนี้" };
    }
  })

  .post("/walk-in", async ({ currentTenant, body, set }: any) => {
    try {
      const { customerName, serviceId, staffId } = body;
      const [newBooking] = await db.insert(bookings).values({
        tenantId: currentTenant.id,
        guestName: customerName,
        serviceId: Number(serviceId),
        staffId: Number(staffId),
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60000),
        status: 'confirmed'
      }).returning();
      return { success: true, booking: newBooking };
    } catch (e) { set.status = 500; return { error: "Walk-in Failed" }; }
  })
  
  .get("/stats", async ({ currentTenant }: any) => {
    const [counts] = await db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where status = 'pending')`,
      confirmed: sql<number>`count(*) filter (where status = 'confirmed')`
    }).from(bookings).where(eq(bookings.tenantId, currentTenant.id));
    return { stats: counts };
  })

  .get("/reports", async ({ currentTenant }: any) => {
  
    const revenueByService = await db.select({
      name: services.name,
      totalRevenue: sql<number>`COALESCE(sum(${services.price}), 0)`,
      count: sql<number>`count(*)`
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.tenantId, currentTenant.id), eq(bookings.status, 'confirmed'))) // หรือ 'completed'
    .groupBy(services.name);

    const bookingsByStaff = await db.select({
      name: staffs.name,
      count: sql<number>`count(*)`
    })
    .from(bookings)
    .innerJoin(staffs, eq(bookings.staffId, staffs.id))
    .where(eq(bookings.tenantId, currentTenant.id))
    .groupBy(staffs.name);

  
    const [total] = await db.select({ sum: sql<number>`COALESCE(sum(${services.price}), 0)` })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(and(eq(bookings.tenantId, currentTenant.id), eq(bookings.status, 'confirmed')));

    return { revenueByService, bookingsByStaff, totalRevenue: total?.sum || 0 };
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
    const [res] = await db.insert(services).values({ 
      tenantId: currentTenant.id, 
      name: body.name, 
      price: Number(body.price), 
      durationMinutes: Number(body.durationMinutes) 
    }).returning();
    return { service: res };
  })

  .patch("/services/:id", async ({ params: { id }, body, currentTenant }: any) => {
    await db.update(services).set({ 
      name: body.name, 
      price: Number(body.price), 
      durationMinutes: Number(body.durationMinutes) 
    }).where(and(eq(services.id, Number(id)), eq(services.tenantId, currentTenant.id)));
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

  .patch("/config", async ({ currentTenant, body, set }: any) => {
    try {
      await db.update(tenants)
        .set({ 
          name: body.name, phone: body.phone, address: body.address,
          line_channel_token: body.lineChannelToken,
          line_user_id: body.lineUserId
        })
        .where(eq(tenants.id, currentTenant.id));
      return { success: true };
    } catch (e) { set.status = 500; return { error: "บันทึกข้อมูลล้มเหลว" }; }
  })


  .post("/config/qr-upload", async ({ currentTenant, body, set }: any) => {
    try {
      const { qrFile } = body;
      const fileName = `qr-${currentTenant.id}-${Date.now()}.${qrFile.name.split('.').pop()}`;
      await Bun.write(`uploads/${fileName}`, qrFile);
      const fileUrl = `http://localhost:3000/uploads/${fileName}`;
      await db.update(tenants).set({ qrCodeUrl: fileUrl }).where(eq(tenants.id, currentTenant.id));
      return { success: true, qrCodeUrl: fileUrl };
    } catch (e) { set.status = 500; return { error: "อัปโหลดล้มเหลว" }; }
  }, { body: t.Object({ qrFile: t.File() }) })
);