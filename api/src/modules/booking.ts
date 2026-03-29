// api/src/modules/booking.ts
import Elysia, { t } from "elysia";
import { db } from "../db";
import { bookings, staffs, services, businessHours, payments, users } from "../db/schema";
import { eq, and, ne, desc, sql, asc, or } from "drizzle-orm";
import { join } from "path";
import { createBookingFlex, createPaymentFlex, sendLinePush } from "../utils/line";

export const bookingModule = (app: Elysia) => app.group('/bookings', (group) => group
  
  .get("/init", async ({ currentTenant, set }: any) => {
    if (!currentTenant) { set.status = 404; return { error: "Tenant Not Found" }; }
    // 🛡️ บังคับเช็ค tenantId ทุุกที่
    const s = await db.select().from(services).where(eq(services.tenantId, currentTenant.id));
    const st = await db.select().from(staffs).where(eq(staffs.tenantId, currentTenant.id));
    const bh = await db.select().from(businessHours).where(eq(businessHours.tenantId, currentTenant.id));
    return { services: s, staffs: st, businessHours: bh };
  })

  .get("/my-bookings", async ({ currentUser, currentTenant, set }: any) => {
    if (!currentTenant || !currentUser) { set.status = 401; return { error: "Unauthorized" }; }
    try {
      const myHistory = await db.select({
        id: bookings.id, serviceName: services.name, staffName: staffs.name,
        status: bookings.status, startTime: bookings.startTime, price: services.price
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(staffs, eq(bookings.staffId, staffs.id))
      // 🛡️ OWASP A01: เช็คทั้งไอดีคนจอง และไอดีร้านค้า
      .where(and(eq(bookings.customerId, currentUser.id), eq(bookings.tenantId, currentTenant.id)))
      .orderBy(desc(bookings.startTime));
      return { bookings: myHistory };
    } catch (err) { set.status = 500; return { error: "Load Failed" }; }
  })

  .get("/busy-slots", async ({ query, currentTenant, set }: any) => {
    if (!currentTenant) { set.status = 404; return { error: "Tenant Not Found" }; }
    const res = await db.select({ start: bookings.startTime, end: bookings.endTime }).from(bookings)
      .where(and(
        eq(bookings.tenantId, currentTenant.id), 
        eq(bookings.staffId, Number(query.staffId)), 
        sql`CAST(${bookings.startTime} AS DATE) = ${query.date}`, 
        ne(bookings.status, 'canceled')
      ));
    return { busy: res };
  }, { query: t.Object({ staffId: t.String(), date: t.String() }) })

  .post("/", async ({ currentTenant, currentUser, body, set }: any) => {
    if (!currentTenant || !currentUser) { set.status = 401; return { error: "Unauthorized" }; }
    try {
      const { serviceId, staffId, startTime, endTime } = body;
      
      const [newBooking] = await db.insert(bookings).values({
        tenantId: currentTenant.id, 
        customerId: currentUser.id,
        serviceId: Number(serviceId), 
        staffId: Number(staffId),
        startTime: new Date(startTime), 
        endTime: new Date(endTime), 
        status: 'pending'
      }).returning();

      // LINE Notification Logic (คงเดิม)
      const [info] = await db.select({ customerName: users.name, serviceName: services.name })
        .from(services).innerJoin(users, sql`TRUE`)
        .where(and(eq(services.id, Number(serviceId)), eq(users.id, currentUser.id))).limit(1);

      if (info && currentTenant.line_channel_token && currentTenant.line_user_id) {
        const dateStr = new Date(startTime).toLocaleDateString('th-TH');
        const timeStr = new Date(startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const flex = createBookingFlex(info.customerName, info.serviceName, dateStr, timeStr);
        await sendLinePush(currentTenant.line_channel_token, currentTenant.line_user_id, flex);
      }
      return { booking: newBooking };
    } catch (e) { set.status = 500; return { error: "Booking Failed" }; }
  }, {
    body: t.Object({
      serviceId: t.Numeric(),
      staffId: t.Numeric(),
      startTime: t.String(),
      endTime: t.String()
    })
  })

  .get("/:id", async ({ params: { id }, currentTenant, set }: any) => {
    if (!currentTenant) { set.status = 404; return { error: "Tenant Not Found" }; }
    const [res] = await db.select({ 
      id: bookings.id, serviceName: services.name, staffName: staffs.name, 
      startTime: bookings.startTime, price: services.price 
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(staffs, eq(bookings.staffId, staffs.id))
    // 🛡️ ป้องกันการสุ่ม ID เพื่อดูข้อมูลร้านอื่น
    .where(and(eq(bookings.id, Number(id)), eq(bookings.tenantId, currentTenant.id)));
    
    if (!res) { set.status = 404; return { error: "Booking Not Found" }; }
    return { booking: res };
  })

  .patch("/:id/payment", async ({ params: { id }, body, currentTenant, set }: any) => {
    if (!currentTenant) { set.status = 404; return { error: "Tenant Not Found" }; }
    try {
      const { slipFile } = body;
      const fileName = `slip-${id}-${Date.now()}.png`;
      const filePath = join(process.cwd(), "public/uploads", fileName);
      await Bun.write(filePath, slipFile);
      const publicUrl = `/uploads/${fileName}`;
      
      // 🛡️ อัปเดตเฉพาะที่มีสิทธิ์เท่านั้น
      const [target] = await db.select().from(bookings).where(and(eq(bookings.id, Number(id)), eq(bookings.tenantId, currentTenant.id)));
      if (!target) { set.status = 403; return { error: "Forbidden" }; }

      const existing = await db.select().from(payments).where(eq(payments.bookingId, Number(id)));
      if (existing.length > 0) {
        await db.update(payments).set({ slipUrl: publicUrl, status: 'pending' }).where(eq(payments.bookingId, Number(id)));
      } else {
        await db.insert(payments).values({ bookingId: Number(id), method: 'promptpay', slipUrl: publicUrl, status: 'pending' });
      }

      return { success: true };
    } catch (e) { set.status = 500; return { error: "Upload Failed" }; }
  }, { body: t.Object({ slipFile: t.File() }) })

  .patch("/:id/cancel", async ({ params: { id }, currentUser, currentTenant, set }: any) => {
    if (!currentTenant || !currentUser) { set.status = 401; return { error: "Unauthorized" }; }
    // 🛡️ ป้องกัน User แอบส่ง ID ของคนอื่นมายกเลิก
    const result = await db.update(bookings).set({ status: 'canceled' })
      .where(and(eq(bookings.id, Number(id)), eq(bookings.customerId, currentUser.id), eq(bookings.tenantId, currentTenant.id)));
    
    if (result.count === 0) { set.status = 404; return { error: "Booking not found or no permission" }; }
    return { success: true };
  })
);