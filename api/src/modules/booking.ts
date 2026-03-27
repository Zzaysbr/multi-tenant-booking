import { Elysia } from "elysia";
import { db } from "../db";
import { bookings, services, staffs } from "../db/schema";
import { and, eq, lt, gt, ne } from "drizzle-orm";

export const bookingModule = new Elysia({ prefix: '/bookings' })
  .get("/services", async ({ currentTenant }: any) => {
    const shopServices = await db.select().from(services).where(eq(services.tenantId, currentTenant.id));
    return { services: shopServices };
  })
  .get("/staffs", async ({ currentTenant }: any) => {
    const shopStaffs = await db.select().from(staffs).where(eq(staffs.tenantId, currentTenant.id));
    return { staffs: shopStaffs };
  })
  .post("/", async ({ body, currentTenant, currentUser, set }: any) => {
    const { serviceId, staffId, startTime, endTime } = body as any;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      set.status = 400;
      return { error: "เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด" };
    }

    try {
      const result = await db.transaction(async (tx) => {
        const overlappingBookings = await tx.select().from(bookings).where(
          and(
            eq(bookings.staffId, staffId),
            eq(bookings.tenantId, currentTenant.id),
            ne(bookings.status, 'canceled'),
            lt(bookings.startTime, end),
            gt(bookings.endTime, start)
          )
        );

        if (overlappingBookings.length > 0) {
          throw new Error("เวลาดังกล่าวถูกจองไปแล้ว กรุณาเลือกเวลาอื่น");
        }

        const customerId = currentUser?.userId || currentUser?.id;
        if (!customerId) throw new Error("ระบบไม่สามารถอ่าน ID ของผู้ใช้งานได้");

        const newBooking = await tx.insert(bookings).values({
          tenantId: currentTenant.id,
          customerId: customerId,
          staffId: staffId,
          serviceId: serviceId,
          startTime: start,
          endTime: end,
          status: "pending"
        }).returning();

        return newBooking[0];
      });

      return { message: "จองคิวสำเร็จ!", booking: result };

    } catch (error: any) {
      set.status = 409;
      return { error: error.message || "เกิดข้อผิดพลาดในการจองคิว" };
    }
  });