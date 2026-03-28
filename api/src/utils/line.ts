// api/src/utils/line.ts

export const sendLinePush = async (token: string | null, toUserId: string | null, flexMessage: any) => {
  if (!token || !toUserId) {
    console.log("⚠️ LINE Config missing: Token or UserID is null");
    return;
  }

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: toUserId,
        messages: [flexMessage],
      }),
    });

    const result = await response.json();

    
    if (response.status !== 200) {
      console.error("❌ LINE API Error Response:", JSON.stringify(result, null, 2));
    } else {
      console.log("✅ LINE Message sent successfully!");
    }

    return result;
  } catch (error) {
    console.error("❌ Network Error while calling LINE API:", error);
  }
};

// ดีไซน์การ์ดแจ้งเตือนการจองใหม่ (Flex Message)
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
        { type: "text", text: "NEW BOOKING", weight: "bold", color: "#B38B6D", size: "sm", letterSpacing: "0.2em" },
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


export const createPaymentFlex = (bookingId: string, customer: string, amount: number, slipUrl: string) => ({
  type: "flex",
  altText: "💰 มีแจ้งโอนเงินใหม่เข้ามาครับพี่!",
  contents: {
    type: "bubble",
    styles: { header: { backgroundColor: "#FDFCFB" } },
    header: {
      type: "box", layout: "vertical",
      contents: [
        { type: "text", text: "PAYMENT RECEIVED", weight: "bold", color: "#10B981", size: "sm", letterSpacing: "0.2em" }
      ]
    },
    hero: {
      type: "image",
      url: slipUrl, 
      size: "full", aspectMode: "cover", aspectRatio: "1:1",
      action: { type: "uri", uri: slipUrl } 
    },
    body: {
      type: "box", layout: "vertical", spacing: "md",
      contents: [
        { type: "text", text: `คุณ ${customer}`, weight: "bold", size: "lg", color: "#4A3728" },
        {
          type: "box", layout: "vertical", spacing: "xs",
          contents: [
            { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "รายการจอง", color: "#aaaaaa", size: "xs", flex: 2 }, { type: "text", text: `#${bookingId}`, color: "#666666", size: "xs", flex: 5 }] },
            { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "ยอดโอน", color: "#aaaaaa", size: "xs", flex: 2 }, { type: "text", text: `฿${amount.toLocaleString()}`, color: "#10B981", size: "sm", weight: "bold", flex: 5 }] }
          ]
        }
      ]
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [
        { type: "button", style: "primary", color: "#B38B6D", height: "sm", action: { type: "uri", label: "ตรวจสอบในระบบ", uri: `http://localhost:5173/larn1/owner/bookings` } }
      ]
    }
  }
});