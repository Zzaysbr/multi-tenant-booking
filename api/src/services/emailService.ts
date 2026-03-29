import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResetPasswordEmail = async (email: string, token: string, userName: string) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  return await resend.emails.send({
    from: 'Cozy Bookings <onboarding@resend.dev>',
    to: [email],
    subject: 'ยืนยันการตั้งรหัสผ่านใหม่ - Cozy Bookings',
    html: `
      <div style="font-family: sans-serif; background-color: #F7F3F0; padding: 60px 20px; color: #4A3728;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 50px; border-radius: 40px; box-shadow: 0 30px 60px rgba(74,55,40,0.08);">
          <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 20px; text-transform: uppercase;">Reset Password</h1>
          <p style="font-size: 14px; line-height: 1.6;">สวัสดีครับคุณ <strong>${userName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6;">เราได้รับคำขอเปลี่ยนรหัสผ่าน กรุณากดปุ่มด้านล่างเพื่อดำเนินการต่อภายใน 1 ชั่วโมง:</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetLink}" style="background-color: #4A3728; color: #ffffff; padding: 20px 40px; border-radius: 18px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase;">
              Authorize New Password
            </a>
          </div>
          <p style="font-size: 10px; color: #B38B6D; text-align: center; text-transform: uppercase;">© 2026 CozyBooking Platform</p>
        </div>
      </div>
    `
  });
};