import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const mailOptions = {
      from: '"مدیریت سایت BitByPouria" <admin@bitbypouria.com>',
      to: email,
      subject: "کد تایید ورود به پنل مدیریت",
      html: `
        <div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; text-align: center; border-radius: 12px;">
          <h2 style="color: #818cf8;">🔐 کد تایید ورود مدیر</h2>
          <p style="color: #cbd5e1;">کد ۶ رقمی یک‌بارمصرف شما جهت ورود به پنل مدیریت:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff; padding: 15px; background-color: #1e293b; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 11px;">این کد تا ۲ دقیقه معتبر است.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("--------------------------------------------------");
    console.log("✉️ ایمیل با موفقیت به سرور ارسال شد!");
    console.log("🔗 لینک مشاهده آنلاین اینباکس ایمیل:", nodemailer.getTestMessageUrl(info));
    console.log("--------------------------------------------------");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}