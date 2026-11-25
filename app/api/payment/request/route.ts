// File Path: app/api/payment/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { postViaNetafrazRelay } from "@/lib/netafrazRelay";
import { rateLimiter } from "@/lib/rateLimiter";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { normalizeSystemSettings } from "@/lib/systemSettings";

export const dynamic = "force-dynamic";

const ZARINPAL_MERCHANT_ID = (process.env.ZARINPAL_MERCHANT_ID || "").trim();

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateCheck = await rateLimiter.checkLimit(
      clientIp,
      "payment_gateway_request",
      15,
      10
    );
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "تعداد درخواست‌های اتصال به درگاه بیش از حد مجاز است. لطفاً دقایقی دیگر تلاش کنید.",
        },
        { status: 429 }
      );
    }

    if (!ZARINPAL_MERCHANT_ID) {
      return NextResponse.json(
        {
          success: false,
          message: "تنظیمات درگاه پرداخت (Merchant ID) روی سرور پیکربندی نشده است.",
        },
        { status: 500 }
      );
    }

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

    let orderRow: any = null;
    const { data: byId } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, final_amount, total_amount, phone, status, payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (byId) {
      orderRow = byId;
    } else {
      const { data: byNum } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, final_amount, total_amount, phone, status, payment_status")
        .eq("order_number", orderId)
        .maybeSingle();
      if (byNum) orderRow = byNum;
    }

    if (orderRow) {
      if (orderRow.payment_status === "paid" || orderRow.status === "paid") {
        return NextResponse.json(
          { success: false, message: "این فاکتور قبلاً پرداخت و تسویه شده است." },
          { status: 400 }
        );
      }
      const dbAmount = Number(orderRow.final_amount ?? orderRow.total_amount ?? 0);
      if (dbAmount === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "مبلغ قابل پرداخت این سفارش صفر است و نیازی به درگاه بانکی ندارد.",
          },
          { status: 400 }
        );
      }
      if (dbAmount > 0) {
        amount = dbAmount;
      }
      if (!phone && orderRow.phone) {
        phone = String(orderRow.phone).replace(/\D/g, "");
      }
    }

    if (!amount || amount < 1000) {
      amount = 1000;
    }

    const siteRow = await getMasterSiteInfoRow();
    const sys = normalizeSystemSettings(
      siteRow?.homepage_layout_config || {},
      siteRow
    );
    const storeName = sys.site_name || "آکسون کور";

    const canonicalOrderId = String(orderRow?.id || orderId);

    const origin =
      req.headers.get("origin") ||
      sys.canonicalBaseUrl ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://axoncore.ir";

    const callbackUrl =
      origin.replace(/\/+$/, "") +
      "/checkout/payment?orderId=" +
      encodeURIComponent(canonicalOrderId) +
      "&amount=" +
      encodeURIComponent(String(amount)) +
      (phone ? "&phone=" + encodeURIComponent(phone) : "");

    const descriptionText =
      body.description ||
      `پرداخت سفارش ${orderRow?.order_number || canonicalOrderId} در فروشگاه ${storeName}`;

    const zpPayload = {
      merchant_id: ZARINPAL_MERCHANT_ID,
      amount: Math.round(amount),
      currency: "IRT",
      description: descriptionText,
      callback_url: callbackUrl,
      metadata: {
        ...(phone ? { mobile: phone } : {}),
        order_id: canonicalOrderId,
      },
    };

    let authority = "";
    const attemptsLog: Array<Record<string, any>> = [];

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
      const firstErrObj =
        attemptsLog.find((a) => a.response?.errors)?.response?.errors || {};
      const errCode = firstErrObj?.code || attemptsLog[0]?.httpStatus || 502;
      const errMsg = firstErrObj?.message || "ZarinPal Connection Error";

      try {
        await supabaseAdmin.from("admin_audit_logs").insert([
          {
            action: "PAYMENT_GATEWAY_ERROR",
            user_id: phone || canonicalOrderId,
            details: {
              resource: "zarinpal:v4",
              orderId: canonicalOrderId,
              amountIRT: amount,
              zarinpalErrorCode: errCode,
              zarinpalErrorMessage: errMsg,
              rawGatewayAttempts: attemptsLog,
            },
            ip_address: clientIp,
            severity: "error",
            created_at: new Date().toISOString(),
          },
        ]);
      } catch {}

      return NextResponse.json(
        {
          success: false,
          message:
            "خطا در برقراری ارتباط با درگاه پرداخت. لطفاً لحظاتی دیگر مجدداً تلاش کنید.",
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