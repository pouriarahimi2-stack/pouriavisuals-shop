import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { postViaNetafrazRelay } from "@/lib/netafrazRelay";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import { sendOtpPattern } from "@/lib/otpService";

export const dynamic = "force-dynamic";

const ZARINPAL_MERCHANT_ID =
  process.env.ZARINPAL_MERCHANT_ID || "";

async function handleVerify(params: {
  authority: string;
  status: string;
  orderId: string;
  fallbackAmount: number;
  clientIp: string;
}) {
  const { authority, status, orderId, fallbackAmount, clientIp } = params;

  if (!authority) {
    return NextResponse.json(
      { success: false, message: "کد مرجع تراکنش (Authority) یافت نشد." },
      { status: 400 }
    );
  }

  let orderRow: any = null;
  if (orderId) {
    const { data: byId } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (byId) {
      orderRow = byId;
    } else {
      const { data: byOrderNum } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("order_number", orderId)
        .maybeSingle();
      if (byOrderNum) orderRow = byOrderNum;
    }
  }

  const verifiedAmount = Math.max(
    1000,
    Math.round(
      Number(orderRow?.final_amount || orderRow?.total_amount || fallbackAmount || 1000)
    )
  );

  if (status && status.toUpperCase() !== "OK") {
    if (orderRow?.id) {
      if (orderRow.status !== "cancelled" && Array.isArray(orderRow.items)) {
        for (const it of orderRow.items) {
          const pId = String(it.id || it.productId || it.product_id || "");
          const qty = Math.max(1, Number(it.quantity || 1));
          if (!pId) continue;
          try {
            const { data: pRow } = await supabaseAdmin
              .from("products")
              .select("id, stock")
              .eq("id", pId)
              .maybeSingle();
            if (pRow) {
              await supabaseAdmin.rpc("increment_product_stock", { p_id: pRow.id, qty: qty });
            }
          } catch {}
        }
      }
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "failed",
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderRow.id);
    }

    return NextResponse.json(
      {
        success: false,
        cancelled: true,
        message: "عملیات پرداخت توسط خریدار لغو شد یا ناموفق بود.",
      },
      { status: 400 }
    );
  }

  const verifyPayload = {
    merchant_id: ZARINPAL_MERCHANT_ID,
    amount: verifiedAmount,
    authority,
  };

  let refId: string | number | null = null;
  let cardPan = "";
  const attemptsLog: Array<Record<string, any>> = [];

  const relayVerify = await postViaNetafrazRelay(
    "https://payment.zarinpal.com/pg/v4/payment/verify.json",
    {},
    verifyPayload
  );

  if (relayVerify) {
    attemptsLog.push({
      endpoint: "Netafraz-Encrypted-Bridge (" + relayVerify.relayUrl + ")",
      httpStatus: relayVerify.status,
      response: relayVerify.data,
    });

    const vCode = relayVerify.data?.data?.code;
    if ((vCode === 100 || vCode === 101) && relayVerify.data?.data?.ref_id) {
      refId = relayVerify.data.data.ref_id;
      cardPan = relayVerify.data.data.card_pan || "";
    }
  }

  if (!refId) {
    for (const ep of [
      "https://payment.zarinpal.com/pg/v4/payment/verify.json",
      "https://api.zarinpal.com/pg/v4/payment/verify.json",
    ]) {
      try {
        const zpRes = await fetch(ep, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(verifyPayload),
        });
        const zpJson = await zpRes.json().catch(() => ({}));
        attemptsLog.push({
          endpoint: ep,
          httpStatus: zpRes.status,
          response: zpJson,
        });

        const vCode = zpJson?.data?.code;
        if ((vCode === 100 || vCode === 101) && zpJson?.data?.ref_id) {
          refId = zpJson.data.ref_id;
          cardPan = zpJson.data.card_pan || "";
          break;
        }
      } catch (e: any) {
        attemptsLog.push({ endpoint: ep, error: e?.message });
      }
    }
  }

  if (!refId) {
    const firstErr =
      attemptsLog.find((a) => a.response?.errors)?.response?.errors || {};

    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: "PAYMENT_VERIFY_ERROR",
          user_id: orderRow?.phone || orderId || authority,
          details: {
            resource: "zarinpal:verify",
            orderId,
            authority,
            verifiedAmountIRT: verifiedAmount,
            zarinpalErrorCode: firstErr?.code || 502,
            zarinpalErrorMessage: firstErr?.message || "Verify Failed",
            rootCauseExplanation:
              "خطا در تایید نهایی تراکنش زرین‌پال پس از بازگشت از بانک: " +
              (firstErr?.message || "عدم تطابق وضعیت یا انقضای توکن"),
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
          "تایید تراکنش از سوی بانک انجام نشد. در صورت کسر وجه، مبلغ ظرف ۷۲ ساعت توسط سیستم بانکی به حساب شما بازگردانده می‌شود.",
      },
      { status: 400 }
    );
  }

  const trackingCode =
    orderRow?.tracking_code || "TRK-" + String(refId).slice(-6);

  if (orderRow?.id) {
    await supabaseAdmin
      .from("orders")
      .update({
        status: "processing",
        payment_status: "paid",
        tracking_code: trackingCode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderRow.id);

    if (orderRow.coupon_code) {
      try {
        const { data: cpn } = await supabaseAdmin
          .from("coupons")
          .select("id, used_count, times_used")
          .eq("code", orderRow.coupon_code)
          .maybeSingle();
        if (cpn) {
          const nextUsed = Number(cpn.used_count ?? cpn.times_used ?? 0) + 1;
          await supabaseAdmin
            .from("coupons")
            .update({ used_count: nextUsed, times_used: nextUsed })
            .eq("id", cpn.id);
        }
      } catch (err) {
        console.error("Error incrementing coupon usage:", err);
      }
    }
  }

  try {
    const { data: siteRow } = await supabaseAdmin
      .from("site_info")
      .select("homepage_layout_config")
      .limit(1)
      .maybeSingle();
    const sys = normalizeSystemSettings(siteRow?.homepage_layout_config);
    if (sys.autoSendOrderSms && orderRow?.phone) {
      sendOtpPattern({
        mobile: String(orderRow.phone),
        code: String(refId).slice(-6),
      }).catch(() => {});
    }
  } catch {}

  return NextResponse.json({
    success: true,
    verified: true,
    refId: String(refId),
    cardPan,
    orderId: orderRow?.id || orderId,
    trackingCode,
    amount: verifiedAmount,
    message: "✓ پرداخت شما با موفقیت تایید شد. کد پیگیری بانکی: " + refId,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authority = String(body.authority || body.Authority || "").trim();
    const status = String(body.status || body.Status || "OK").trim();
    const orderId = String(body.orderId || body.order_id || "").trim();
    const fallbackAmount = Number(body.amount || 0);
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    return await handleVerify({
      authority,
      status,
      orderId,
      fallbackAmount,
      clientIp,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در بررسی وضعیت پرداخت. لطفاً مجدداً تلاش کنید.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authority = String(
      searchParams.get("Authority") || searchParams.get("authority") || ""
    ).trim();
    const status = String(
      searchParams.get("Status") || searchParams.get("status") || "OK"
    ).trim();
    const orderId = String(
      searchParams.get("orderId") || searchParams.get("order_id") || ""
    ).trim();
    const fallbackAmount = Number(searchParams.get("amount") || 0);
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    return await handleVerify({
      authority,
      status,
      orderId,
      fallbackAmount,
      clientIp,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در بررسی وضعیت پرداخت.",
      },
      { status: 500 }
    );
  }
}
