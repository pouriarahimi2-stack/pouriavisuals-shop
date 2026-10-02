// File Path: app/api/payment/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { postViaNetafrazRelay } from "@/lib/netafrazRelay";

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

    const zpPayload = {
      merchant_id: ZARINPAL_MERCHANT_ID,
      amount: Math.round(amount),
      currency: "IRT",
      description: descriptionText,
      callback_url: callbackUrl,
      metadata: {
        ...(phone ? { mobile: phone } : {}),
        order_id: orderId,
      },
    };

    let authority = "";
    const attemptsLog: Array<Record<string, any>> = [];

    // ۱. تلاش اول: ارسال درخواست زرین‌پال از طریق آی‌پی ثابت هاست نت‌افراز شما (gate.axoncore.ir)
    const relayRes = await postViaNetafrazRelay(
      "https://payment.zarinpal.com/pg/v4/payment/request.json",
      {},
      zpPayload
    );

    if (relayRes) {
      attemptsLog.push({
        endpoint: "Netafraz-Static-Relay (" + relayRes.relayUrl + ")",
        httpStatus: relayRes.status,
        response: relayRes.data,
      });

      if (relayRes.data?.data?.code === 100 && relayRes.data?.data?.authority) {
        authority = relayRes.data.data.authority;
      }
    }

    // ۲. تلاش دوم: ارسال مستقیم در صورتی که پل نت‌افراز هنوز آپلود نشده باشد
    if (!authority) {
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
            body: JSON.stringify(zpPayload),
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
    }

    if (!authority) {
      let vercelOutboundIp = "نامشخص";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipJson = await ipRes.json();
        if (ipJson?.ip) vercelOutboundIp = String(ipJson.ip);
      } catch {}

      const firstErrObj =
        attemptsLog.find((a) => a.response?.errors)?.response?.errors || {};
      const errCode = firstErrObj?.code || attemptsLog[0]?.httpStatus || 502;
      const errMsg = firstErrObj?.message || "ZarinPal Connection Error";
      const isIpInvalid = String(errMsg).toLowerCase().includes("terminal ip not valid");

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
              netafrazDetectedStaticIp: "185.106.201.79",
              rootCauseExplanation: isIpInvalid
                ? "خطای کد -12 زرین‌پال (Terminal ip not valid): آی‌پی خروجی سرور با آی‌پی ثبت‌شده در پنل زرین‌پال مطابقت ندارد."
                : "خطا در دریافت توکن پرداخت از زرین‌پال: " + errMsg,
              howToFix: [
                "۱. در دایرکت‌ادمین نت‌افراز زیر دامنه gate.axoncore.ir بسازید و فایل axon-relay.php را در پوشه آن آپلود کنید.",
                "۲. آی‌پی ثابت هاست نت‌افراز خود (185.106.201.79) را در پنل زرین‌پال در کادر «با محدودیت IP» جایگزین 216.198.79.1 نمایید.",
              ],
              rawGatewayAttempts: attemptsLog,
            },
            ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
            severity: "error",
            created_at: new Date().toISOString(),
          },
        ]);
      } catch {}

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
