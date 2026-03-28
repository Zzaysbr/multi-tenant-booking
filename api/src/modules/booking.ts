import Elysia from "elysia";
import { db } from "../db";
import { bookings, staffs, services } from "../db/schema";
import { eq, and, ne, lt, gt, desc } from "drizzle-orm";

export const bookingModule = (app: Elysia) => app.group('/bookings', (group) => group
  
  
  .get("/init", async ({ currentTenant, set }: any) => {
    
    if (!currentTenant) { 
      set.status = 404; 
      return { error: "ไม่พบร้านค้าที่คุณกำลังค้นหา" }; 
    }
    
    try {
      
      const s = await db.select().from(services).where(eq(services.tenantId, currentTenant.id));
      const st = await db.select().from(staffs).where(eq(staffs.tenantId, currentTenant.id));
      return { services: s, staffs: st };
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

      return { message: "จองคิวสำเร็จ!", booking: newBooking };

    } catch (e: any) { 
      console.error("Booking Error:", e);
      set.status = 500; 
      return { error: "ระบบขัดข้อง บันทึกการจองไม่สำเร็จ", details: e.message }; 
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
    .where(
      and(
        eq(bookings.customerId, currentUser.id),
        eq(bookings.tenantId, currentTenant.id) 
      )
    )
    .orderBy(desc(bookings.startTime));

    return { bookings: myHistory };
  })
);