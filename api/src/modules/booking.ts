// api/src/modules/booking.ts
import Elysia, { t } from "elysia";
import { db } from "../db";
import { bookings, staffs, services, businessHours, payments, users, tenants } from "../db/schema";
import { eq, and, ne, lt, gt, desc, sql, asc, or } from "drizzle-orm";
import { join } from "path";

export const bookingModule = (app: Elysia) => app.group('/bookings', (group) => group
  
  .get("/init", async ({ currentTenant, set }: any) => {
    if (!currentTenant) { set.status = 404; return { error: "Tenant Not Found" }; }
    const s = await db.select().from(services).where(eq(services.tenantId, currentTenant.id));
    const st = await db.select().from(staffs).where(eq(staffs.tenantId, currentTenant.id));
    const bh = await db.select().from(businessHours).where(eq(businessHours.tenantId, currentTenant.id));
    return { services: s, staffs: st, businessHours: bh };
  })

  .get("/:id", async ({ params: { id }, currentTenant, set }: any) => {
    if (!currentTenant) { set.status = 404; return { error: "Tenant Not Found" }; }
    const [res] = await db.select({ id: bookings.id, serviceName: services.name, staffName: staffs.name, startTime: bookings.startTime, price: services.price })
      .from(bookings).innerJoin(services, eq(bookings.serviceId, services.id)).innerJoin(staffs, eq(bookings.staffId, staffs.id))
      .where(and(eq(bookings.id, Number(id)), eq(bookings.tenantId, currentTenant.id)));
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
      
      const existing = await db.select().from(payments).where(eq(payments.bookingId, Number(id)));
      if (existing.length > 0) {
        await db.update(payments).set({ slipUrl: publicUrl, method: 'promptpay', status: 'pending' }).where(eq(payments.bookingId, Number(id)));
      } else {
        await db.insert(payments).values({ bookingId: Number(id), method: 'promptpay', slipUrl: publicUrl, status: 'pending' });
      }
      return { success: true };
    } catch (e) {
      set.status = 500; return { error: "Upload Failed" };
    }
  }, { body: t.Object({ slipFile: t.File() }) })

  .post("/:id/payment/card", async ({ params: { id }, currentTenant, set }: any) => {
    if (!currentTenant) { set.status = 404; return { error: "Tenant Not Found" }; }
    try {
      const existing = await db.select().from(payments).where(eq(payments.bookingId, Number(id)));
      if (existing.length > 0) {
        await db.update(payments).set({ method: 'credit_card', status: 'paid' }).where(eq(payments.bookingId, Number(id)));
      } else {
        await db.insert(payments).values({ bookingId: Number(id), method: 'credit_card', status: 'paid' });
      }
      
      await db.update(bookings).set({ status: 'confirmed' }).where(and(eq(bookings.id, Number(id)), eq(bookings.tenantId, currentTenant.id)));
      return { success: true, message: "Payment Successful" };
    } catch (e) {
      set.status = 500; return { error: "Payment Failed" };
    }
  })

  .post("/", async ({ currentTenant, currentUser, body, set }: any) => {
    if (!currentTenant) { set.status = 404; return { error: "Tenant Not Found" }; }
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

  // ✅ [MODIFIED] เพิ่ม durationMinutes และ staffId สำหรับใช้คำนวณตอนเลื่อนคิว
  .get("/my-bookings", async ({ currentUser, currentTenant, set }: any) => {
    if (!currentTenant) { set.status = 404; return { error: "Tenant Not Found" }; }
    if (!currentUser) { set.status = 401; return { error: "Unauthorized" }; }
    
    try {
      const myHistory = await db.select({
        id: bookings.id,
        serviceName: services.name,
        staffName: staffs.name,
        status: bookings.status,
        startTime: bookings.startTime,
        price: services.price,
        durationMinutes: services.durationMinutes, // ส่งไปให้หน้าบ้านคำนวณ
        staffId: bookings.staffId // ต้องใช้เช็คคิวชน
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(staffs, eq(bookings.staffId, staffs.id))
      .where(and(
        eq(bookings.customerId, currentUser.id), 
        eq(bookings.tenantId, currentTenant.id)
      ))
      .orderBy(desc(bookings.startTime));

      return { bookings: myHistory };
    } catch (err) {
      set.status = 500; return { error: "Failed to load history" };
    }
  })

  .patch("/:id/cancel", async ({ params: { id }, currentUser, currentTenant, set }: any) => {
    if (!currentTenant || !currentUser) { set.status = 401; return { error: "Unauthorized" }; }
    try {
      await db.update(bookings).set({ status: 'canceled' })
        .where(and(eq(bookings.id, Number(id)), eq(bookings.customerId, currentUser.id), eq(bookings.tenantId, currentTenant.id)));
      return { success: true };
    } catch (e) { set.status = 500; return { error: "Cancel Failed" }; }
  })

  // ✅ [NEW] Route สำหรับ "เลื่อนคิว" (Reschedule)
  .patch("/:id/reschedule", async ({ params: { id }, body, currentUser, currentTenant, set }: any) => {
    if (!currentTenant || !currentUser) { set.status = 401; return { error: "Unauthorized" }; }
    try {
      const { newStartTime, newEndTime } = body;
      const start = new Date(newStartTime);
      const end = new Date(newEndTime);

      // ดึงข้อมูลคิวเดิมมาเช็คว่าช่างคนเดิมว่างไหม
      const [target] = await db.select().from(bookings).where(eq(bookings.id, Number(id)));
      if (!target) { set.status = 404; return { error: "Booking not found" }; }

      // เช็คเวลาชนกัน
      const overlap = await db.select().from(bookings).where(
        and(
          eq(bookings.tenantId, currentTenant.id),
          eq(bookings.staffId, target.staffId),
          ne(bookings.id, Number(id)), // ยกเว้นตัวเอง
          ne(bookings.status, 'canceled'),
          lt(bookings.startTime, end),
          gt(bookings.endTime, start)
        )
      );

      if (overlap.length > 0) {
        set.status = 409; return { error: "เวลานี้คิวเต็มแล้วครับ กรุณาเลือกใหม่" };
      }

      // อัปเดตเวลา และปรับสถานะกลับเป็น pending (รอโอนเงินใหม่/รอยืนยันใหม่)
      await db.update(bookings).set({ startTime: start, endTime: end, status: 'pending' })
        .where(eq(bookings.id, Number(id)));

      return { success: true };
    } catch (e) {
      set.status = 500; return { error: "Reschedule Failed" };
    }
  })

  .get("/busy-slots", async ({ query, currentTenant, set }: any) => {
    if (!currentTenant) { set.status = 404; return { error: "Tenant Not Found" }; }
    const res = await db.select({ start: bookings.startTime, end: bookings.endTime }).from(bookings)
      .where(and(eq(bookings.tenantId, currentTenant.id), eq(bookings.staffId, Number(query.staffId)), eq(sql`CAST(${bookings.startTime} AS DATE)`, query.date), ne(bookings.status, 'canceled')));
    return { busy: res };
  })

  .get("/queue", async ({ currentTenant, set }: any) => {
    if (!currentTenant) { set.status = 404; return { error: "Tenant Not Found" }; }
    const today = await db.select({ id: bookings.id, customerName: users.name, startTime: bookings.startTime, status: bookings.status, serviceName: services.name, staffName: staffs.name })
      .from(bookings).innerJoin(services, eq(bookings.serviceId, services.id)).innerJoin(staffs, eq(bookings.staffId, staffs.id)).innerJoin(users, eq(bookings.customerId, users.id))
      .where(and(eq(bookings.tenantId, currentTenant.id), sql`CAST(${bookings.startTime} AS DATE) = CURRENT_DATE`, or(eq(bookings.status, 'confirmed'), eq(bookings.status, 'pending'))))
      .orderBy(asc(bookings.startTime));
    return { serving: today.filter(b => b.status === 'confirmed'), waiting: today.filter(b => b.status === 'pending') };
  })
);