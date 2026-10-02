// File Path: app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signCustomerPayload, CUSTOMER_COOKIE_NAME } from "@/lib/customerSession";
import { sendOtpPattern, sendTextSMS } from "@/lib/otpService";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const ZARINPAL_MERCHANT_ID =
  process.env.ZARINPAL_MERCHANT_ID || "459a9ff5-fed1-4a6c-b9c3-309f93c6bf73";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = String(body.orderId || "").trim();
    const authority = String(body.authority || body.Authority || "").trim();
    const statusParam = String(body.status || body.Status || "OK").trim().toUpperCase();
    const rawPhone = String(body.phone || "")
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/\D/g, "");

    if (!orderId) {
      return NextResponse.json(
        { success: false, verified: false, message: "شناسه سفارش یافت نشد." },
        { status: 400 }
      );
    }

    if (authority && statusParam !== "OK") {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: "عملیات پرداخت در درگاه زرین‌پال توسط کاربر لغو شد یا ناموفق بود.",
        },
        { status: 400 }
      );
    }

    const { data: orderRow } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    const amount = Number(
      orderRow?.final_amount || orderRow?.total_amount || body.amount || 1000
    );

    let refId = "ZP-" + Date.now().toString().slice(-7);

    // اعتبارسنجی مستقیم تراکنش با سرور زرین‌پال در صورت وجود Authority
    if (authority) {
      const verifyEndpoints = [
        "https://payment.zarinpal.com/pg/v4/payment/verify.json",
        "https://api.zarinpal.com/pg/v4/payment/verify.json",
      ];

      let zpVerified = false;
      for (const ep of verifyEndpoints) {
        try {
          const vRes = await fetch(ep, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              merchant_id: ZARINPAL_MERCHANT_ID,
              amount: Math.round(amount),
              currency: "IRT",
              authority,
            }),
          });

          const vJson = await vRes.json().catch(() => ({}));
          const code = vJson?.data?.code;
          if (code === 100 || code === 101) {
            zpVerified = true;
            if (vJson?.data?.ref_id) {
              refId = String(vJson.data.ref_id);
            }
            break;
          }
        } catch {}
      }

      if (!zpVerified) {
        return NextResponse.json(
          {
            success: false,
            verified: false,
            message: "تراکنش در درگاه زرین‌پال تایید نشد. در صورت کسر وجه، تا ۷۲ ساعت به حساب شما بازمی‌گردد.",
          },
          { status: 400 }
        );
      }
    }

    const trackingCode =
      orderRow?.tracking_code ||
      body.trackingCode ||
      "AXN-" + refId;

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

    // ۲. ایجاد یا بازیابی حساب کاربری مشتری برای لاگین خودکار
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

      // ۳. ارسال پیامک کد پیگیری سفارش از طریق IPPanel Edge
      try {
        await sendOtpPattern({
          mobile: customerPhone,
          code: trackingCode,
        });
      } catch {
        try {
          await sendTextSMS(
            customerPhone,
            customerName + " عزیز، خرید شما تایید شد. کد پیگیری: " + trackingCode
          );
        } catch {}
      }
    }

    const token = await signCustomerPayload(customerUser);
    const res = NextResponse.json({
      success: true,
      verified: true,
      orderId,
      refId,
      trackingCode,
      user: customerUser,
      message: "✓ پرداخت زرین‌پال با موفقیت تایید شد، کد پیگیری پیامک گردید و وارد حساب کاربری خود شدید.",
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
      { success: false, verified: false, message: err.message || "خطا در تایید تراکنش زرین‌پال." },
      { status: 500 }
    );
  }
}
