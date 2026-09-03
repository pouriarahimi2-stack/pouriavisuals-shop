// File Path: app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { smsService } from "@/services/smsService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authority, status, orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "شناسه فاکتور سفارش الزامی است." },
        { status: 400 }
      );
    }

    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", String(orderId))
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, message: "سفارش مورد نظر در سیستم یافت نشد." },
        { status: 404 }
      );
    }

    const refId = `REF-${Date.now().toString().slice(-8)}`;

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", String(orderId));

    if (updateError) {
      return NextResponse.json(
        { success: false, message: "خطا در ثبت وضعیت نهایی پرداخت." },
        { status: 500 }
      );
    }

    // ارسال پیامک حاوی شناسه فاکتور + نام کاربری و رمز عبور خودکار
    if (order.phone) {
      const uName = order.guest_username || `user_${order.id.slice(-4)}`;
      const uPass = order.guest_password || `${order.phone}xyz`;
      
      const smsMessage = `${order.customer_name || 'خریدار گرامی'}، پرداخت فاکتور ${order.id} تایید شد.\nاطلاعات ورود به حساب کاربری:\nنام کاربری: ${uName}\nکلمه عبور: ${uPass}\nفروشگاه آکسون`;
      try {
        await smsService.sendSMS(order.phone, smsMessage);
      } catch (smsErr) {
        console.warn("Payment verify SMS warning:", smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "پرداخت با موفقیت انجام شد.",
      refId,
      orderId: order.id,
      credentials: {
        username: order.guest_username,
        password: order.guest_password,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "خطای سیستمی: " + err.message },
      { status: 500 }
    );
  }
}
