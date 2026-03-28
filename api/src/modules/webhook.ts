import { Elysia, t } from "elysia";

export const webhookModule = (app: Elysia) => app.group('/webhook', (group) => group
  .post("/line", async ({ body, currentTenant }: any) => {
    // currentTenant จะมีค่าได้ ต้องตั้งค่า Webhook URL ให้มีชื่อร้าน 
    // เช่น https://api.yourdomain.com/api/larn1/webhook/line
    const events = body.events || [];

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const text = event.message.text.trim().toUpperCase();
        const userId = event.source.userId;
        const replyToken = event.replyToken;

        // ถ้าพิมพ์ว่า ID หรือ ไอดี
        if (text === "ID" || text === "ไอดี") {
          await replyToLine(currentTenant.line_channel_token, replyToken, `รหัส User ID ของพี่คือ:\n\n${userId}\n\nก๊อปปี้ไปวางในหน้าตั้งค่าได้เลยครับพี่! 🚀`);
        }
      }
    }

    return { success: true };
  })
);

// Helper
async function replyToLine(token: string, replyToken: string, message: string) {
  if (!token) return;
  
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: "text", text: message }],
    }),
  });
}