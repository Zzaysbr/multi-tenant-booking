export const sendLinePush = async (accessToken: string, to: string, message: string) => {
  if (!accessToken || !to) return;

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        to: to,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      })
    });
    return await response.json();
  } catch (error) {
    console.error("❌ LINE Push Error:", error);
  }
};