// api/src/utils/line.ts

export const createBookingFlex = (customer: string, service: string, date: string, time: string) => ({
  type: "flex",
  altText: "🆕 มีรายการจองใหม่เข้ามาค่ะ!",
  contents: {
    type: "bubble",
    hero: {
      type: "image",
      url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000",
      size: "full", aspectMode: "cover", aspectRatio: "20:13"
    },
    body: {
      type: "box", layout: "vertical", spacing: "md",
      contents: [
        // ✅ ลบ letterSpacing ออกแล้ว
        { type: "text", text: "NEW BOOKING", weight: "bold", color: "#B38B6D", size: "sm" }, 
        { type: "text", text: `คุณ ${customer}`, weight: "bold", size: "xl" },
        {
          type: "box", layout: "vertical", margin: "lg", spacing: "sm",
          contents: [
            { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "บริการ", color: "#aaaaaa", size: "xs", flex: 2 }, { type: "text", text: service, wrap: true, color: "#666666", size: "xs", flex: 5 }] },
            { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "เวลา", color: "#aaaaaa", size: "xs", flex: 2 }, { type: "text", text: `${date} @ ${time}`, wrap: true, color: "#666666", size: "xs", flex: 5 }] }
          ]
        }
      ]
    }
  }
});

// ฟังก์ชันส่ง (เหมือนเดิม)
export const sendLinePush = async (token: string | null, toUserId: string | null, flexMessage: any) => {
  if (!token || !toUserId) return;
  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ to: toUserId, messages: [flexMessage] }),
    });
    return await response.json();
  } catch (error) { console.error("LINE API Error:", error); }
};

export const createPaymentFlex = (bookingId: string, customer: string, amount: number, slipUrl: string, tenantPath: string) => ({
  type: "flex",
  altText: "💰 แจ้งโอนเงินใหม่!",
  contents: {
    type: "bubble",
    styles: { header: { backgroundColor: "#4A3728" }, footer: { separator: true } },
    header: {
      type: "box", layout: "vertical", contents: [
        { type: "text", text: "PAYMENT VERIFICATION", weight: "bold", color: "#B38B6D", size: "xs" }
      ]
    },
    hero: {
      type: "image", url: slipUrl, size: "full", aspectMode: "cover", aspectRatio: "1:1"
    },
    body: {
      type: "box", layout: "vertical", spacing: "md", contents: [
        { type: "text", text: `คุณ ${customer}`, weight: "bold", size: "lg", color: "#4A3728" },
        { type: "box", layout: "vertical", spacing: "xs", contents: [
          { type: "box", layout: "baseline", contents: [{ type: "text", text: "Ticket", color: "#aaaaaa", size: "xs", flex: 2 }, { type: "text", text: `#${bookingId}`, color: "#666666", size: "xs", flex: 5 }] },
          { type: "box", layout: "baseline", contents: [{ type: "text", text: "Amount", color: "#aaaaaa", size: "xs", flex: 2 }, { type: "text", text: `฿${amount.toLocaleString()}`, color: "#B38B6D", size: "md", weight: "bold", flex: 5 }] }
        ]}
      ]
    },
    footer: {
      type: "box", layout: "vertical", contents: [
        { type: "button", style: "primary", color: "#4A3728", height: "sm", action: { type: "uri", label: "Check System", uri: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner/bookings` } }
      ]
    }
  }
});