import { Elysia, t } from "elysia";
import { db } from "../db";
import { businessHours } from "../db/schema";
import { eq, and } from "drizzle-orm";

export const businessHoursModule = (app: Elysia) => app.group('/business-hours', (group) => group
  

  .get("/", async ({ currentTenant }: any) => {
    const res = await db.select().from(businessHours).where(eq(businessHours.tenantId, currentTenant.id));
    return { businessHours: res };
  })

  
  .patch("/", async ({ currentTenant, body, set }: any) => {
    try {
      const { schedules } = body;
      
      for (const schedule of schedules) {
        await db.insert(businessHours)
          .values({ 
            tenantId: currentTenant.id, 
            ...schedule 
          })
          .onConflictDoUpdate({
            target: [businessHours.tenantId, businessHours.dayOfWeek],
            set: { 
              openTime: schedule.openTime, 
              closeTime: schedule.closeTime, 
              isClosed: schedule.isClosed 
            }
          });
      }
      return { success: true };
    } catch (e) {
      set.status = 500;
      return { error: "ไม่สามารถบันทึกเวลาทำการได้" };
    }
  })
);