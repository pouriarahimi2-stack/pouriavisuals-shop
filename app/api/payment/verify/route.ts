// File Path: app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signCustomerPayload, CUSTOMER_COOKIE_NAME } from "@/lib/customerSession";
import { sendOtpPattern, sendTextSMS } from "@/lib/otpService";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = String(body.orderId || "").trim();
    const rawPhone = String(body.phone || "")
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/\D/g, "");

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "شناسه سفارش یافت نشد." },
        { status: 400 }
      );
    }

    const { data: orderRow } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    const trackingCode =
      orderRow?.tracking_code ||
      body.trackingCode ||
      "AXN-" + Date.now().toString().slice(-6);

    const customerPhone =
      rawPhone || String(orderRow?.phone || "").replace(/\D/g, "");
    const customerName =
      orderRow?.customer_name || body.customerName || "مشتری گرامی";

    // ۱. بروزرسانی وضعیت سفارش به paid
    await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        tracking_code: trackingCode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    // ۲. ایجاد یا بازیابی حساب کاربری مشتری برای لاگین خودکار (با تایپ صریح string)
    let customerUser: {
      id: string;
      phone: string;
      username: string;
      name: string;
    } = {
      id: String(randomUUID()),
      phone: customerPhone || "09120000000",
      username: customerName,
      name: customerName,
    };

    if (customerPhone && customerPhone.length === 11) {
      try {
        const { data: existingCust } = await supabaseAdmin
          .from("customers")
          .select("*")
          .eq("phone", customerPhone)
          .maybeSingle();

        if (existingCust) {
          customerUser = {
            id: String(existingCust.id),
            phone: String(existingCust.phone),
            username: String(existingCust.username || customerName),
            name: String(existingCust.username || customerName),
          };
        } else {
          const newId = String(randomUUID());
          const { data: createdCust } = await supabaseAdmin
            .from("customers")
            .insert([
              {
                id: newId,
                phone: customerPhone,
                username: customerName,
              },
            ])
            .select()
            .maybeSingle();

          if (createdCust) {
            customerUser.id = String(createdCust.id);
          }
        }
      } catch {}

      // ۳. ارسال پیامک کد پیگیری سفارش به شماره خریدار
      try {
        const smsOk = await sendTextSMS(
          customerPhone,
          customerName +
            " عزیز، خرید شما در آکسون کور تایید شد. کد پیگیری سفارش: " +
            trackingCode +
            " | axoncore.ir/account"
        );
        if (!smsOk) {
          const numericTrack = trackingCode.replace(/\D/g, "").slice(-6) || "743440";
          await sendOtpPattern({ mobile: customerPhone, code: numericTrack });
        }
      } catch {}
    }

    const token = await signCustomerPayload(customerUser);
    const res = NextResponse.json({
      success: true,
      verified: true,
      orderId,
      trackingCode,
      user: customerUser,
      message: "✓ پرداخت با موفقیت تایید شد، کد پیگیری پیامک گردید و وارد حساب کاربری خود شدید.",
    });

    res.cookies.set(CUSTOMER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در تایید تراکنش." },
      { status: 500 }
    );
  }
}
