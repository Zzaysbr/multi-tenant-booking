import Elysia from "elysia";
import { db } from "../db";
import { bookings, staffs, services, businessHours } from "../db/schema";
import { eq, and, ne, lt, gt, desc, sql, asc, or } from "drizzle-orm";
import { sendLinePush, createBookingFlex } from "../utils/line";

export const bookingModule = (app: Elysia) => app.group('/bookings', (group) => group
  
  .get("/init", async ({ currentTenant, set }: any) => {
    if (!currentTenant) { 
      set.status = 404; 
      return { error: "ไม่พบร้านค้าที่คุณกำลังค้นหา" }; 
    }
    
    try {
      const s = await db.select().from(services).where(eq(services.tenantId, currentTenant.id));
      const st = await db.select().from(staffs).where(eq(staffs.tenantId, currentTenant.id));
      const bh = await db.select().from(businessHours).where(eq(businessHours.tenantId, currentTenant.id));
      return { services: s, staffs: st, businessHours: bh };
    } catch (e: any) { 
      set.status = 500; 
      return { error: "เกิดข้อผิดพลาดในการดึงข้อมูลร้าน" }; 
    }
  })

  .post("/", async ({ currentTenant, currentUser, body, set }: any) => {
    if (!currentTenant) { 
      set.status = 404; return { error: "ไม่พบร้านค้า" }; 
    }
    
    if (!currentUser?.id) { 
      set.status = 401; return { error: "กรุณาเข้าสู่ระบบก่อนทำการจองคิวค่ะ" }; 
    }

    try {
      const { serviceId, staffId, startTime, endTime } = body as any;
      const start = new Date(startTime);
      const end = new Date(endTime);


      const dayOfWeek = start.getDay();
      const bookingTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

      const [hours] = await db.select()
        .from(businessHours)
        .where(and(
          eq(businessHours.tenantId, currentTenant.id),
          eq(businessHours.dayOfWeek, dayOfWeek)
        ))
        .limit(1);

      if (hours) {
        if (hours.isClosed) {
          set.status = 400;
          return { error: "ขออภัยค่ะ วันนี้ร้านปิดให้บริการ ลองเลือกวันอื่นดูนะคะ" };
        }
        if (bookingTime < hours.openTime! || bookingTime > hours.closeTime!) {
          set.status = 400;
          return { error: `ร้านเปิดให้บริการเวลา ${hours.openTime} - ${hours.closeTime} ค่ะ` };
        }
      }

      const overlap = await db.select().from(bookings).where(
        and(
          eq(bookings.tenantId, currentTenant.id),
          eq(bookings.staffId, Number(staffId)),
          ne(bookings.status, 'canceled'),
          lt(bookings.startTime, end),
          gt(bookings.endTime, start)
        )
      );

      if (overlap.length > 0) { 
        set.status = 409; 
        return { error: "ขออภัยค่ะ เวลานี้ช่างคิวเต็มแล้ว ลองเลือกเวลาอื่นดูนะคะ" }; 
      }

      
      const [newBooking] = await db.insert(bookings).values({
        tenantId: currentTenant.id, 
        customerId: currentUser.id, 
        serviceId: Number(serviceId), 
        staffId: Number(staffId), 
        startTime: start, 
        endTime: end, 
        status: 'pending'
      }).returning();


      if (currentTenant.line_channel_token && currentTenant.line_user_id) {
        try {
          const [serviceData] = await db.select().from(services).where(eq(services.id, Number(serviceId))).limit(1);
          const flexMsg = createBookingFlex(
            currentUser.name, 
            serviceData?.name || "บริการทั่วไป",
            start.toLocaleDateString('th-TH'),
            start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
          );
          await sendLinePush(currentTenant.line_channel_token, currentTenant.line_user_id, flexMsg);
        } catch (lineErr) {
          console.error("LINE Notify Failed:", lineErr);
        }
      }

      return { message: "จองคิวสำเร็จ!", booking: newBooking };

    } catch (e: any) { 
      console.error("Booking Error:", e);
      set.status = 500; 
      return { error: "ระบบขัดข้อง บันทึกการจองไม่สำเร็จ" }; 
    }
  })

  .get("/my-bookings", async ({ currentUser, currentTenant, set }: any) => {
    if (!currentUser) { set.status = 401; return { error: "Unauthorized" }; }
    
    const myHistory = await db.select({
      id: bookings.id,
      serviceName: services.name,
      staffName: staffs.name,
      status: bookings.status,
      startTime: bookings.startTime,
      price: services.price
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(staffs, eq(bookings.staffId, staffs.id))
    .where(and(eq(bookings.customerId, currentUser.id), eq(bookings.tenantId, currentTenant.id)))
    .orderBy(desc(bookings.startTime));

    return { bookings: myHistory };
  })

  .get("/busy-slots", async ({ query, currentTenant }: any) => {
    const { staffId, date } = query;
    if (!staffId || !date) return { busy: [] };

    const res = await db.select({
      start: bookings.startTime,
      end: bookings.endTime
    })
    .from(bookings)
    .where(and(
      eq(bookings.tenantId, currentTenant.id),
      eq(bookings.staffId, Number(staffId)),
      eq(sql`CAST(${bookings.startTime} AS DATE)`, date),
      ne(bookings.status, 'canceled')
    ));

    return { busy: res };
  })


  .get("/queue", async ({ currentTenant, set }: any) => {
    try {
      const todayBookings = await db.select({
        id: bookings.id,
        // ✅ เปลี่ยนจาก customerName เป็น guestName ให้ตรงตาม Schema ของพี่
        customerName: bookings.guestName, 
        startTime: bookings.startTime,
        status: bookings.status,
        serviceName: services.name,
        staffName: staffs.name,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(staffs, eq(bookings.staffId, staffs.id))
      .where(
        and(
          eq(bookings.tenantId, currentTenant.id),
          // ✅ กรองเฉพาะของวันนี้
          sql`CAST(${bookings.startTime} AS DATE) = CURRENT_DATE`,
          // ✅ ใช้ or() ที่ import มาแล้ว
          or(
            eq(bookings.status, 'confirmed'),
            eq(bookings.status, 'pending')
          )
        )
      )
      // ✅ ใช้ asc() ที่ import มาแล้ว
      .orderBy(asc(bookings.startTime)); 

      // แยกกองข้อมูลส่งให้ Frontend
      const serving = todayBookings.filter(b => b.status === 'confirmed');
      const waiting = todayBookings.filter(b => b.status === 'pending');

      return { serving, waiting };

    } catch (error) {
      console.error("Queue Error:", error);
      set.status = 500;
      return { error: "ไม่สามารถดึงข้อมูลคิวได้" };
    }
  })
);