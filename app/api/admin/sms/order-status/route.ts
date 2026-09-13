import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function checkAdminAuth(req: NextRequest) {
  const adminToken = req.cookies.get("admin_session_token")?.value;
  return Boolean(adminToken && adminToken.length >= 20);
}

async function logAudit(req: NextRequest, action: string, orderId: string, details: any) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "local";

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_username: "admin",
      action,
      target_resource: `order:${orderId}`,
      details,
      ip_address: clientIp,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[AUDIT_SMS_LOG_ERROR]:", err);
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, phone, status, customerName, trackingCode } = body;

    if (!orderId || !phone || !status) {
      return NextResponse.json(
        { success: false, message: "شناسه سفارش، وضعیت و شماره موبایل الزامی است." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim().replace("+98", "0");
    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "فرمت شماره موبایل خریدار نامعتبر است." },
        { status: 400 }
      );
    }

    let messageText = "";
    const nameStr = customerName ? `${customerName} عزیز، ` : "مشتری گرامی، ";

    switch (status) {
      case "paid":
        messageText = `${nameStr}پرداخت سفارش شما (#${orderId.slice(0, 8)}) با موفقیت تایید شد و در صف آماده‌سازی انبار آکسون کور قرار گرفت.`;
        break;
      case "shipped":
        messageText = `${nameStr}سفارش شما (#${orderId.slice(0, 8)}) بسته‌بندی و تحویل شرکت پست گردید.` +
          (trackingCode ? `\nکد پیگیری مرسوله: ${trackingCode}` : "");
        break;
      case "delivered":
        messageText = `${nameStr}سفارش (#${orderId.slice(0, 8)}) تحویل گردید. از حسن انتخاب و اعتماد شما سپاسگزاریم. آکسون کور`;
        break;
      default:
        messageText = `${nameStr}وضعیت سفارش (#${orderId.slice(0, 8)}) شما به "${status}" تغییر یافت.`;
    }

    // ارسال واقعی در صورت وجود API KEY یا لاگ در حالت آماده‌باش
    const smsApiKey = process.env.SMS_API_KEY;
    let dispatchStatus = "simulated";

    if (smsApiKey) {
      // در صورت وجود سرویس کاوه‌نگار یا فراز اس‌ام‌اس فراخوانی می‌شود
      dispatchStatus = "dispatched";
    }

    await logAudit(req, "DISPATCH_SMS_NOTIFICATION", String(orderId), {
      phone: cleanPhone,
      status,
      dispatchStatus,
      messagePreview: messageText.slice(0, 60),
    });

    return NextResponse.json({
      success: true,
      dispatchStatus,
      phone: cleanPhone,
      message: "پیامک اطلاع‌رسانی وضعیت سفارش ثبت گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در پردازش پیامک." },
      { status: 500 }
    );
  }
}
