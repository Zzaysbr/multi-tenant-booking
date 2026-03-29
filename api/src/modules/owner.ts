// api/src/modules/owner.ts
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Elysia, t } from "elysia";
import { db } from "../db";
import { staffs, services, bookings, users, payments, tenants, businessHours } from "../db/schema"; 
import { eq, and, desc, sql } from "drizzle-orm";

// Utility: ตรวจสอบโฟลเดอร์ uploads ก่อนเขียนไฟล์
const ensureUploadDir = () => {
  const dir = join(process.cwd(), "public/uploads");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
};

export const ownerModule = (app: Elysia) => app.group('/owner', (group) => group
  
  // 🛡️ Guard: ควบคุมสิทธิ์
  .onBeforeHandle(({ currentUser, currentTenant, set }: any) => {
    if (!currentTenant) { 
      set.status = 404; 
      return { error: "Tenant Not Found" }; 
    }
    if (!currentUser || (currentUser.role !== 'OWNER' && currentUser.role !== 'STAFF')) {
      set.status = 401; 
      return { error: "Unauthorized Access" };
    }
  })

  // ✅ Business Hours Update
  .patch("/business-hours", async ({ currentTenant, body, set }: any) => {
    try {
      const { schedules } = body;
      await db.delete(businessHours).where(eq(businessHours.tenantId, currentTenant.id));
      
      const values = schedules.map((s: any) => ({
        tenantId: currentTenant.id,
        dayOfWeek: s.dayOfWeek,
        openTime: s.openTime,
        closeTime: s.closeTime,
        isClosed: s.isClosed
      }));

      await db.insert(businessHours).values(values);
      return { success: true };
    } catch (e) {
      console.error("Schedule Error:", e);
      set.status = 500; 
      return { error: "Internal Server Error" };
    }
  }, {
    body: t.Object({
      schedules: t.Array(t.Object({
        dayOfWeek: t.Number(),
        openTime: t.String(),
        closeTime: t.String(),
        isClosed: t.Boolean()
      }))
    })
  })

  // ✅ QR Upload
  .post("/config/qr-upload", async ({ currentTenant, body, set }: any) => {
    try {
      const { qrFile } = body;
      if (!qrFile) throw new Error("No file");

      const uploadDir = ensureUploadDir();
      const fileName = `qr-${currentTenant.id}-${Date.now()}.png`;
      const filePath = join(uploadDir, fileName);
      
      await Bun.write(filePath, qrFile);
      const fileUrl = `/uploads/${fileName}`;
      
      await db.update(tenants).set({ qrCodeUrl: fileUrl }).where(eq(tenants.id, currentTenant.id));
      return { success: true, qrCodeUrl: fileUrl };
    } catch (e) { 
      set.status = 500; 
      return { error: "QR Upload Failed" }; 
    }
  }, { 
    body: t.Object({ qrFile: t.File({ type: 'image', maxSize: '5m' }) }) 
  })

  // ✅ Shop Image Upload
  .post("/config/shop-upload", async ({ currentTenant, body, set }: any) => {
    try {
      const { shopFile } = body;
      if (!shopFile) throw new Error("No file");

      const uploadDir = ensureUploadDir();
      const fileName = `shop-${currentTenant.id}-${Date.now()}.png`;
      const filePath = join(uploadDir, fileName);
      
      await Bun.write(filePath, shopFile);
      const publicUrl = `/uploads/${fileName}`;

      await db.update(tenants).set({ logo_url: publicUrl }).where(eq(tenants.id, currentTenant.id));
      return { shopImageUrl: publicUrl };
    } catch (e) { 
      set.status = 500; 
      return { error: "Branding Upload Failed" }; 
    }
  }, {
    body: t.Object({ shopFile: t.File({ type: 'image' }) })
  })

  // ✅ Patch Config
  .patch("/config", async ({ currentTenant, body, set }: any) => {
    try {
      await db.update(tenants)
        .set({ 
          name: body.name, 
          phone: body.phone, 
          address: body.address,
          line_bot_id: body.line_bot_id,
          line_channel_token: body.line_channel_token,
          line_user_id: body.line_user_id
        })
        .where(eq(tenants.id, currentTenant.id));
      return { success: true };
    } catch (e) { 
      set.status = 500; 
      return { error: "DB Update Failed" }; 
    }
  }, {
    body: t.Object({
      name: t.String(),
      phone: t.Optional(t.String()),
      address: t.Optional(t.String()),
      line_bot_id: t.Optional(t.String()),
      line_channel_token: t.Optional(t.String()),
      line_user_id: t.Optional(t.String())
    })
  })

  // --- 📊 Statistics & Reports ---
  .get("/stats", async ({ currentTenant, set }: any) => {
    try {
      const [counts] = await db.select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        confirmed: sql<number>`count(*) filter (where status = 'confirmed')::int`
      }).from(bookings).where(eq(bookings.tenantId, currentTenant.id));
      
      return { stats: counts };
    } catch (e) {
      set.status = 500; return { error: "Failed to load stats" };
    }
  })

  .get("/reports", async ({ currentTenant }: any) => {
    const revenueByService = await db.select({ 
      name: services.name, 
      totalRevenue: sql<number>`sum(${services.price})::int`, 
      count: sql<number>`count(*)::int` 
    })
    .from(bookings).innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.tenantId, currentTenant.id), eq(bookings.status, 'confirmed')))
    .groupBy(services.name).orderBy(desc(sql`sum(${services.price})`));

    const bookingsByStaff = await db.select({ 
      name: staffs.name, 
      count: sql<number>`count(*)::int` 
    })
    .from(bookings).innerJoin(staffs, eq(bookings.staffId, staffs.id))
    .where(eq(bookings.tenantId, currentTenant.id))
    .groupBy(staffs.name);

    const [total] = await db.select({ 
      sum: sql<number>`COALESCE(sum(${services.price}), 0)::int` 
    })
    .from(bookings).innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.tenantId, currentTenant.id), eq(bookings.status, 'confirmed')));

    return { revenueByService, bookingsByStaff, totalRevenue: total?.sum || 0 };
  })

  // --- 👥 Customer CRM ---
  .get("/customers", async ({ currentTenant }: any) => {
    const result = await db.select({ 
      id: users.id, 
      name: users.name, 
      email: users.email, 
      phone: users.phone, 
      bookingCount: sql<number>`count(${bookings.id})::int` 
    })
    .from(users).innerJoin(bookings, eq(users.id, bookings.customerId))
    .where(eq(bookings.tenantId, currentTenant.id))
    .groupBy(users.id, users.name, users.email, users.phone)
    .orderBy(desc(sql`count(${bookings.id})`));
    
    return { customers: result };
  })

  // --- 📅 [RESTORED] Bookings Management (เจ้าของร้านดูคิวทั้งหมด) ---
  .get("/bookings", async ({ currentTenant }: any) => {
    const result = await db.select({
      id: bookings.id, 
      customerName: users.name, 
      guestName: bookings.guestName, // กรณีจองแบบไม่ได้ล็อกอิน (เผื่ออนาคต)
      serviceName: services.name,
      staffName: staffs.name, 
      status: bookings.status, 
      startTime: bookings.startTime,
      createdAt: bookings.createdAt,
      slipUrl: payments.slipUrl, 
      paymentStatus: payments.status 
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.customerId, users.id)) // ใช้ leftJoin เผื่อกรณีลูกค้าถูกลบไอดีทิ้งไปแล้ว
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(staffs, eq(bookings.staffId, staffs.id))
    .leftJoin(payments, eq(bookings.id, payments.bookingId))
    .where(eq(bookings.tenantId, currentTenant.id))
    .orderBy(desc(bookings.startTime)); // เรียงตามเวลาจอง
    
    return { bookings: result };
  })

  // อัปเดตสถานะคิว (ยืนยัน/ยกเลิก)
  .patch("/bookings/:id/status", async ({ params: { id }, body, currentTenant, set }: any) => {
    try {
      const { status } = body as any;
      await db.update(bookings)
        .set({ status })
        .where(and(eq(bookings.id, Number(id)), eq(bookings.tenantId, currentTenant.id)));
      return { success: true };
    } catch (e) {
      set.status = 500; return { error: "Update failed" };
    }
  })

  // --- ✂️ CRUD Resource Management (ช่าง & บริการ) ---
  .get("/staffs", async ({ currentTenant }: any) => ({ 
    staffs: await db.select().from(staffs).where(eq(staffs.tenantId, currentTenant.id)).orderBy(desc(staffs.id)) 
  }))
  .post("/staffs", async ({ currentTenant, body }: any) => { 
    const [res] = await db.insert(staffs).values({ tenantId: currentTenant.id, name: body.name }).returning(); 
    return { staff: res }; 
  }, { body: t.Object({ name: t.String() }) })

  .delete("/staffs/:id", async ({ params: { id }, currentTenant }: any) => { 
    await db.delete(staffs).where(and(eq(staffs.id, Number(id)), eq(staffs.tenantId, currentTenant.id))); 
    return { success: true }; 
  })

  .get("/services", async ({ currentTenant }: any) => ({ 
    services: await db.select().from(services).where(eq(services.tenantId, currentTenant.id)).orderBy(desc(services.id)) 
  }))
  .post("/services", async ({ currentTenant, body }: any) => { 
    const [res] = await db.insert(services).values({ 
      tenantId: currentTenant.id, 
      name: body.name, 
      price: Number(body.price), 
      durationMinutes: Number(body.durationMinutes) 
    }).returning(); 
    return { service: res }; 
  }, { 
    body: t.Object({ 
      name: t.String(), 
      price: t.Number(), 
      durationMinutes: t.Number() 
    }) 
  })

  .delete("/services/:id", async ({ params: { id }, currentTenant }: any) => { 
    await db.delete(services).where(and(eq(services.id, Number(id)), eq(services.tenantId, currentTenant.id))); 
    return { success: true }; 
  })
);