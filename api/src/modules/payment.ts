import { Elysia, t } from "elysia";
import { db } from "../db";
import { payments, bookings, users, services } from "../db/schema";
import { eq } from "drizzle-orm";
import { sendLinePush, createPaymentFlex } from "../utils/line";

export const paymentModule = (app: Elysia) => app.group('/payments', (group) => group
  
  .post("/submit", async ({ currentTenant, body, set }: any) => {
    try {
      const { bookingId, method, slipFile } = body;
      

      const fileName = `slip-${bookingId}-${Date.now()}.${slipFile.name.split('.').pop()}`;
      await Bun.write(`uploads/${fileName}`, slipFile);
      const fileUrl = `http://localhost:3000/uploads/${fileName}`;


      const [newPayment] = await db.insert(payments).values({
        bookingId: Number(bookingId),
        method,
        slipUrl: fileUrl,
        status: 'pending'
      }).returning();


      if (currentTenant.line_channel_token && currentTenant.line_user_id) {
        // ดึงข้อมูลการจองเพื่อหาชื่อลูกค้าและยอดเงิน
        const [bookingInfo] = await db.select({
          customerName: users.name,
          price: services.price
        })
        .from(bookings)
        .innerJoin(users, eq(bookings.customerId, users.id))
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(eq(bookings.id, Number(bookingId)));

        if (bookingInfo) {
          const flex = createPaymentFlex(
            bookingId,
            bookingInfo.customerName,
            bookingInfo.price,
            fileUrl
          );
          await sendLinePush(currentTenant.line_channel_token, currentTenant.line_user_id, flex);
        }
      }

      return { success: true, payment: newPayment };
    } catch (e: any) {
      console.error(e);
      set.status = 500;
      return { error: "แจ้งโอนเงินไม่สำเร็จ" };
    }
  }, {
    body: t.Object({
      bookingId: t.String(),
      method: t.String(),
      slipFile: t.File()
    })
  })
);