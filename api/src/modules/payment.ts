import { Elysia } from "elysia";
import { db } from "../db";
import { payments, bookings } from "../db/schema";
import { eq } from "drizzle-orm";

export const paymentModule = new Elysia({ prefix: '/payments' })
  .post("/:bookingId/slip", async ({ params: { bookingId }, body, set }: any) => {
    const { slip } = body;
    if (!slip) {
      set.status = 400;
      return { error: "กรุณาแนบไฟล์สลิป" };
    }
    const fileName = `slip_${bookingId}_${Date.now()}.${slip.type.split('/')[1] || 'png'}`;
    const filePath = `./uploads/${fileName}`; 
    await Bun.write(filePath, slip);
    const newPayment = await db.insert(payments).values({
      bookingId: Number(bookingId), method: 'slip', slipUrl: `/uploads/${fileName}`, status: 'pending' 
    }).returning();
    return { message: "อัปโหลดสลิปสำเร็จ รอยืนยันจากร้านค้า", payment: newPayment[0] };
  })
  .post("/:bookingId/credit-card", async ({ params: { bookingId }, body, set }: any) => {
     const { cardNumber } = body as any;
     const isSuccess = Math.random() > 0.2;

     if (!isSuccess) {
        await db.insert(payments).values({ bookingId: Number(bookingId), method: 'credit_card', status: 'failed' });
        set.status = 400;
        return { error: "จำลองการตัดบัตรล้มเหลว (Failed) กรุณาลองใหม่" };
     }

     await db.transaction(async (tx) => {
        await tx.insert(payments).values({ bookingId: Number(bookingId), method: 'credit_card', status: 'paid' });
        await tx.update(bookings).set({ status: 'confirmed' }).where(eq(bookings.id, Number(bookingId)));
     });
     return { message: "ชำระเงินผ่านบัตรสำเร็จ! ระบบยืนยันคิวให้คุณแล้ว (Paid -> Confirmed)" };
  });