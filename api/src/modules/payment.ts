import Elysia, { t } from "elysia";
import { db } from "../db";
import { payments } from "../db/schema";

export const paymentModule = (app: Elysia) => app.group('/payments', (group) => group
  .post("/submit", async ({ body, set }: any) => {
    try {
      const { bookingId, method, slipFile } = body;

      if (!slipFile) {
        set.status = 400;
        return { error: "ไม่พบไฟล์สลิป" };
      }

      
      const fileName = `slip-${bookingId}-${Date.now()}.${slipFile.name.split('.').pop()}`;
      await Bun.write(`uploads/${fileName}`, slipFile);
      
      
      const fileUrl = `http://localhost:3000/uploads/${fileName}`;

      
      const [newPayment] = await db.insert(payments).values({
        bookingId: Number(bookingId),
        method: method || 'Bank Transfer',
        slipUrl: fileUrl,
        status: 'pending'
      }).returning();

      return { 
        success: true, 
        message: "อัปโหลดหลักฐานการโอนเรียบร้อย", 
        payment: newPayment 
      };
    } catch (e: any) {
      console.error("Upload Error:", e);
      set.status = 500;
      return { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
    }
  }, {
    body: t.Object({
      bookingId: t.String(),
      method: t.String(),
      slipFile: t.File() // รับค่าเป็น File
    })
  })
);