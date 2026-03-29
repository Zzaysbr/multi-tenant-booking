// api/src/modules/booking.ts
import Elysia, { t } from "elysia";
import { db } from "../db";
import { bookings, staffs, services, businessHours, payments, users } from "../db/schema";
import { eq, and, ne, lt, gt, desc, sql, asc, or } from "drizzle-orm";
import { join } from "path";

export const bookingModule = (app: Elysia) => app.group('/bookings', (group) => group
  
  .get("/init", async ({ currentTenant }: any) => {
    const s = await db.select().from(services).where(eq(services.tenantId, currentTenant.id));
    const st = await db.select().from(staffs).where(eq(staffs.tenantId, currentTenant.id));
    const bh = await db.select().from(businessHours).where(eq(businessHours.tenantId, currentTenant.id));
    return { services: s, staffs: st, businessHours: bh };
  })

  .get("/:id", async ({ params: { id }, currentTenant }: any) => {
    const [res] = await db.select({ id: bookings.id, serviceName: services.name, staffName: staffs.name, startTime: bookings.startTime, price: services.price })
      .from(bookings).innerJoin(services, eq(bookings.serviceId, services.id)).innerJoin(staffs, eq(bookings.staffId, staffs.id))
      .where(and(eq(bookings.id, Number(id)), eq(bookings.tenantId, currentTenant.id)));
    return { booking: res };
  })

  // ✅ [NEW] รับสลิปจาก PaymentPage.tsx
  .patch("/:id/payment", async ({ params: { id }, body, currentTenant }: any) => {
    const { slipFile } = body;
    const fileName = `slip-${id}-${Date.now()}.png`;
    const filePath = join(process.cwd(), "public/uploads", fileName);
    await Bun.write(filePath, slipFile);
    
    // สร้าง/อัปเดต Payment Record
    await db.insert(payments).values({ bookingId: Number(id), method: 'promptpay', slipUrl: `/uploads/${fileName}`, status: 'pending' })
      .onConflictDoUpdate({ target: payments.bookingId, set: { slipUrl: `/uploads/${fileName}` } });
    
    return { success: true };
  }, { body: t.Object({ slipFile: t.File() }) })

  .post("/", async ({ currentTenant, currentUser, body, set }: any) => {
    if (!currentUser) { set.status = 401; return { error: "Login Required" }; }
    try {
      const { serviceId, staffId, startTime, endTime } = body;
      const [newBooking] = await db.insert(bookings).values({
        tenantId: currentTenant.id, customerId: currentUser.id,
        serviceId: Number(serviceId), staffId: Number(staffId),
        startTime: new Date(startTime), endTime: new Date(endTime), status: 'pending'
      }).returning();
      return { booking: newBooking };
    } catch (e) { set.status = 500; return { error: "Booking Failed" }; }
  })

  .get("/busy-slots", async ({ query, currentTenant }: any) => {
    const res = await db.select({ start: bookings.startTime, end: bookings.endTime }).from(bookings)
      .where(and(eq(bookings.tenantId, currentTenant.id), eq(bookings.staffId, Number(query.staffId)), eq(sql`CAST(${bookings.startTime} AS DATE)`, query.date), ne(bookings.status, 'canceled')));
    return { busy: res };
  })

  .get("/queue", async ({ currentTenant }: any) => {
    const today = await db.select({ id: bookings.id, customerName: users.name, startTime: bookings.startTime, status: bookings.status, serviceName: services.name, staffName: staffs.name })
      .from(bookings).innerJoin(services, eq(bookings.serviceId, services.id)).innerJoin(staffs, eq(bookings.staffId, staffs.id)).innerJoin(users, eq(bookings.customerId, users.id))
      .where(and(eq(bookings.tenantId, currentTenant.id), sql`CAST(${bookings.startTime} AS DATE) = CURRENT_DATE`, or(eq(bookings.status, 'confirmed'), eq(bookings.status, 'pending'))))
      .orderBy(asc(bookings.startTime));
    return { serving: today.filter(b => b.status === 'confirmed'), waiting: today.filter(b => b.status === 'pending') };
  })
);