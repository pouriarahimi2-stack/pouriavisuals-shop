// File Path: app/api/payment/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const ZARINPAL_MERCHANT_ID =
  process.env.ZARINPAL_MERCHANT_ID || "459a9ff5-fed1-4a6c-b9c3-309f93c6bf73";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = String(body.orderId || "").trim();
    let amount = Number(body.amount || 0);
    let phone = String(body.phone || "").replace(/\D/g, "");

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "شناسه سفارش جهت اتصال به درگاه زرین‌پال الزامی است." },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      const { data: orderRow } = await supabaseAdmin
        .from("orders")
        .select("final_amount, total_amount, phone")
        .eq("id", orderId)
        .maybeSingle();

      if (orderRow) {
        amount = Number(orderRow.final_amount || orderRow.total_amount || 0);
        if (!phone && orderRow.phone) phone = String(orderRow.phone).replace(/\D/g, "");
      }
    }

    if (!amount || amount < 1000) {
      amount = 1000;
    }

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://axoncore.ir";

    const callbackUrl =
      origin.replace(/\/+$/, "") +
      "/checkout/payment?orderId=" +
      encodeURIComponent(orderId) +
      "&amount=" +
      encodeURIComponent(String(amount)) +
      (phone ? "&phone=" + encodeURIComponent(phone) : "");

    const descriptionText =
      body.description || "پرداخت سفارش " + orderId + " در فروشگاه آکسون کور";

    let authority = "";
    let lastError = "";

    for (const ep of [
      "https://payment.zarinpal.com/pg/v4/payment/request.json",
      "https://api.zarinpal.com/pg/v4/payment/request.json",
    ]) {
      try {
        const zpRes = await fetch(ep, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            merchant_id: ZARINPAL_MERCHANT_ID,
            amount: Math.round(amount),
            currency: "IRT",
            description: descriptionText,
            callback_url: callbackUrl,
            metadata: {
              ...(phone ? { mobile: phone } : {}),
              order_id: orderId,
            },
          }),
        });

        const zpJson = await zpRes.json().catch(() => ({}));
        if (zpJson?.data?.code === 100 && zpJson?.data?.authority) {
          authority = zpJson.data.authority;
          break;
        } else {
          lastError =
            zpJson?.errors?.message ||
            JSON.stringify(zpJson?.errors || zpJson) ||
            "خطای درگاه زرین‌پال";
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }

    if (!authority) {
      const isIpError = String(lastError).toLowerCase().includes("terminal ip not valid");
      let detectedOutboundIp = "";
      if (isIpError) {
        try {
          const ipRes = await fetch("https://api.ipify.org?format=json");
          const ipJson = await ipRes.json();
          if (ipJson?.ip) detectedOutboundIp = String(ipJson.ip);
        } catch {}
      }

      return NextResponse.json(
        {
          success: false,
          outboundServerIp: detectedOutboundIp || undefined,
          message: isIpError
            ? "خطای Terminal IP not valid از زرین‌پال: آی‌پی 216.198.79.1 آی‌پی ورودی DNS است، اما آی‌پی خروجی فعلی سرور Vercel که زرین‌پال می‌بیند «" +
              (detectedOutboundIp || "متغیر") +
              "» است. در پنل زرین‌پال یا گزینه «بدون محدودیت IP» را انتخاب و ذخیره کنید، یا آی‌پی «" +
              (detectedOutboundIp || "") +
              "» را در کادر آی‌پی‌های سرور اضافه نمایید."
            : "خطا در دریافت توکن از درگاه زرین‌پال: " + lastError,
        },
        { status: 502 }
      );
    }

    const paymentUrl = "https://payment.zarinpal.com/pg/StartPay/" + authority;

    return NextResponse.json({
      success: true,
      authority,
      paymentUrl,
      url: paymentUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در اتصال به درگاه زرین‌پال." },
      { status: 500 }
    );
  }
}
