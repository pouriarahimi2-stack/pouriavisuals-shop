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
        { success: false, message: "اطلاعات سفارش یافت نشد." },
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
    const attemptsLog: Array<Record<string, any>> = [];

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
        attemptsLog.push({
          endpoint: ep,
          httpStatus: zpRes.status,
          response: zpJson,
        });

        if (zpJson?.data?.code === 100 && zpJson?.data?.authority) {
          authority = zpJson.data.authority;
          break;
        }
      } catch (e: any) {
        attemptsLog.push({
          endpoint: ep,
          error: e?.message,
        });
      }
    }

    if (!authority) {
      let vercelOutboundIp = "نامشخص";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipJson = await ipRes.json();
        if (ipJson?.ip) vercelOutboundIp = String(ipJson.ip);
      } catch {}

      const firstErrObj = attemptsLog[0]?.response?.errors || {};
      const errCode = firstErrObj?.code || attemptsLog[0]?.httpStatus || 502;
      const errMsg = firstErrObj?.message || "ZarinPal Connection Error";
      const isIpInvalid = String(errMsg).toLowerCase().includes("terminal ip not valid");

      // ثبت کامل علت خطا، کد خطا و آی‌پی خروجی سرور در لاگ‌های امنیتی ادمین (/admin/audit-logs)
      try {
        await supabaseAdmin.from("admin_audit_logs").insert([
          {
            action: "PAYMENT_GATEWAY_ERROR",
            user_id: phone || orderId,
            details: {
              resource: "zarinpal:v4",
              orderId,
              amountIRT: amount,
              zarinpalErrorCode: errCode,
              zarinpalErrorMessage: errMsg,
              vercelServerOutboundIp: vercelOutboundIp,
              rootCauseExplanation: isIpInvalid
                ? "خطای کد -12 زرین‌پال (Terminal ip not valid): در پنل زرین‌پال آی‌پی 216.198.79.1 ثبت شده که آی‌پی ورودی DNS است؛ اما درخواست فعلی از سرور Vercel با آی‌پی خروجی «" +
                  vercelOutboundIp +
                  "» به زرین‌پال ارسال شده است."
                : "خطا در دریافت توکن پرداخت از زرین‌پال: " + errMsg,
              howToFix: isIpInvalid
                ? [
                    "۱. آی‌پی خروجی فعلی سرور («" +
                      vercelOutboundIp +
                      "») را در پنل زرین‌پال در بخش ویرایش درگاه -> آی‌پی‌های سرور اضافه کنید.",
                    "۲. توجه: از آنجایی که سرورهای رایگان Vercel آی‌پی خروجی متغیر (Dynamic IP) دارند، برای داشتن آی‌پی ثابت دائمی جهت شاپرک و رفع مسدودیت ابرآروان پیامک، از هاست/سرور دارای آی‌پی ثابت ایران استفاده نمایید.",
                  ]
                : ["بررسی وضعیت درگاه و مرچنت‌آیدی در پنل my.zarinpal.com"],
              rawGatewayAttempts: attemptsLog,
            },
            ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
            severity: "error",
            created_at: new Date().toISOString(),
          },
        ]);
      } catch {}

      // به مشتری فقط یک پیام کوتاه و استاندارد نمایش داده می‌شود
      return NextResponse.json(
        {
          success: false,
          message: "خطا در برقراری ارتباط با درگاه پرداخت. لطفاً لحظاتی دیگر مجدداً تلاش کنید.",
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
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در برقراری ارتباط با درگاه پرداخت. لطفاً مجدداً تلاش کنید.",
      },
      { status: 500 }
    );
  }
}
