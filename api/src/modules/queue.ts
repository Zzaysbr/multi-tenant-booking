import { Elysia } from "elysia";
import { db } from "../db";
import { bookings, users, services } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

export const queueModule = (app: Elysia) => app.group('/queue-board', (group) => group
  
  .get("/", async ({ currentTenant, set }: any) => {
    try {
      const list = await db.select({
        id: bookings.id,
        customerName: users.name,
        status: bookings.status,
        startTime: bookings.startTime,
        serviceName: services.name
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.customerId, users.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(
        and(
          eq(bookings.tenantId, currentTenant.id),
          sql`CAST(${bookings.startTime} AS DATE) = CURRENT_DATE`,
          sql`status IN ('confirmed', 'pending')` 
        )
      )
      .orderBy(bookings.startTime);

      return { queue: list };
    } catch (e) {
      set.status = 500;
      return { error: "ไม่สามารถโหลดข้อมูลคิวได้" };
    }
  })
);