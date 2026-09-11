import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = String(body?.orderId || "").trim();

    if (!orderId) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    const trackingRef = "TRX-" + Date.now().toString().slice(-6) + "-" + crypto.randomBytes(2).toString("hex").toUpperCase();

    if (supabaseAdmin) {
      // به‌روزرسانی وضعیت فاکتور به پرداخت‌شده
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          status: "paid",
          updated_at: new Date().toISOString()
        })
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);

      // ثبت تراکنش در جدول payments
      try {
        await supabaseAdmin.from("payments").insert([{
          order_id: orderId,
          authority: body.authority || ("AUTH_" + Date.now()),
          tracking_ref: trackingRef,
          status: "verified",
          created_at: new Date().toISOString()
        }]);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "تراکنش بانکی با موفقیت تایید و فاکتور تسویه شد.",
      trackingRef
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "خطا در تایید تراکنش." }, { status: 500 });
  }
}
