// File Path: app/api/orders/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyCustomerToken, CUSTOMER_COOKIE_NAME } from "@/lib/customerSession";
import { rateLimiter } from "@/lib/rateLimiter";
import { triggerBackInStockNotifications } from "@/lib/backInStockService";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

function normalizeDigits(val: any): string {
  return String(val || "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .trim();
}

function normalizePhone(val: any): string {
  const digits = normalizeDigits(val).replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) return "0" + digits.slice(2);
  if (digits.startsWith("9") && digits.length === 10) return "0" + digits;
  return digits;
}

function extractWalletDeductionFromAddress(addressStr: string): number {
  const match = String(addressStr || "").match(
    /\[کسر از کیف پول:\s*([\d,۰-۹]+)\s*تومان\]/
  );
  if (!match || !match[1]) return 0;
  const englishDigits = normalizeDigits(match[1]).replace(/,/g, "").trim();
  const num = Number(englishDigits);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function normalizeOrderRecord(row: any) {
  if (!row || typeof row !== "object") return row;
  const resolvedPhone = row.phone || row.customer_phone || "";
  const rawAddress = String(row.address || row.customer_address || "");
  const cleanAddress = rawAddress
    .replace(/\s*\[مالیات\s*\d+%:\s*\d+\s*تومان\]/g, "")
    .replace(/\s*\[کسر از کیف پول:\s*[\d,۰-۹]+\s*تومان\]/g, "")
    .trim();

  const shortDigits =
    String(row.tracking_code || "").replace(/\D/g, "").slice(0, 6) ||
    String(row.id || "").replace(/\D/g, "").slice(0, 6) ||
    String(row.id || "").slice(0, 6).toUpperCase();

  const resolvedOrderNum =
    row.order_number && !String(row.order_number).includes("-4")
      ? row.order_number
      : "AXN-" + shortDigits;

  const resolvedTracking = row.tracking_code || resolvedOrderNum;
  const resolvedFinal = Number(
    row.final_amount ?? row.total_amount ?? row.total_price ?? 0
  );

  return {
    ...row,
    phone: resolvedPhone,
    customer_phone: resolvedPhone,
    address: rawAddress,
    clean_address: cleanAddress,
    order_number: resolvedOrderNum,
    tracking_code: resolvedTracking,
    final_amount: resolvedFinal,
    total_amount: Number(row.total_amount ?? resolvedFinal),
    total_price: resolvedFinal,
  };
}

async function fetchOrdersByPhoneOrCode(params: {
  phone?: string;
  code?: string;
  query?: string;
}) {
  const rawQuery = normalizeDigits(params.query || "");
  let cleanPhone = normalizePhone(params.phone || "");
  let cleanCode = normalizeDigits(params.code || "").toUpperCase();

  if (rawQuery) {
    const maybePhone = normalizePhone(rawQuery);
    if (/^09\d{9}$/.test(maybePhone) && !cleanPhone) {
      cleanPhone = maybePhone;
    } else if (!cleanCode) {
      cleanCode = rawQuery.toUpperCase();
    }
  }

  if (cleanPhone && /^09\d{9}$/.test(cleanPhone)) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("phone", cleanPhone)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !Array.isArray(data)) return [];
    const normalized = data.map(normalizeOrderRecord);

    if (!cleanCode) {
      return normalized;
    }

    return normalized.filter((row: any) => {
      const rowId = String(row.id || "").toUpperCase();
      const rowOrderNum = String(row.order_number || "").toUpperCase();
      const rowTracking = String(row.tracking_code || "").toUpperCase();
      return (
        rowId === cleanCode ||
        rowOrderNum === cleanCode ||
        rowTracking === cleanCode ||
        rowId.includes(cleanCode) ||
        rowOrderNum.includes(cleanCode) ||
        rowTracking.includes(cleanCode)
      );
    });
  }

  if (cleanCode && cleanCode.length >= 4) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250);

    if (error || !Array.isArray(data)) return [];
    return data
      .map(normalizeOrderRecord)
      .filter((row: any) => {
        const rowId = String(row.id || "").toUpperCase();
        const rowOrderNum = String(row.order_number || "").toUpperCase();
        const rowTracking = String(row.tracking_code || "").toUpperCase();
        return (
          rowId === cleanCode ||
          rowOrderNum === cleanCode ||
          rowTracking === cleanCode ||
          rowId.endsWith(cleanCode) ||
          rowOrderNum.includes(cleanCode) ||
          rowTracking.includes(cleanCode)
        );
      });
  }

  return [];
}

async function handleTrackRequest(
  params: { phone?: string; code?: string; query?: string },
  req: NextRequest
): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rateCheck = await rateLimiter.checkLimit(ip, "order_track_lookup", 25, 1);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        message:
          "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً یک دقیقه دیگر امتحان کنید.",
      },
      { status: 429 }
    );
  }

  const rawInput = params.query || params.phone || params.code || "";
  if (!String(rawInput).trim()) {
    return NextResponse.json(
      {
        success: false,
        message: "لطفاً شماره موبایل یا کد پیگیری سفارش را وارد نمایید.",
      },
      { status: 400 }
    );
  }

  const cookieToken = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  if (cookieToken && params.phone) {
    const session = await verifyCustomerToken(cookieToken);
    if (session) {
      const sessionPhone = normalizePhone(session.phone);
      const reqPhone = normalizePhone(params.phone);
      if (sessionPhone && reqPhone && sessionPhone !== reqPhone) {
        return NextResponse.json(
          { success: false, message: "شماره موبایل با حساب شما مطابقت ندارد." },
          { status: 403 }
        );
      }
    }
  }

  const matched = await fetchOrdersByPhoneOrCode(params);

  return NextResponse.json(
    {
      success: matched.length > 0,
      message:
        matched.length > 0
          ? undefined
          : "سفارشی با این مشخصات یافت نشد.",
      order: matched[0] || null,
      orders: matched,
      data: matched,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone =
      searchParams.get("phone") ||
      searchParams.get("mobile") ||
      searchParams.get("customer_phone") ||
      "";
    const code =
      searchParams.get("code") ||
      searchParams.get("trackingCode") ||
      searchParams.get("tracking_code") ||
      searchParams.get("orderId") ||
      searchParams.get("id") ||
      "";
    const query = searchParams.get("query") || "";

    return await handleTrackRequest({ phone, code, query }, req);
  } catch {
    return NextResponse.json(
      { success: false, orders: [], message: "خطا در رهگیری سفارش." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone =
      body.phone ||
      body.mobile ||
      body.customer_phone ||
      body.customerPhone ||
      "";
    const code =
      body.code ||
      body.trackingCode ||
      body.tracking_code ||
      body.orderId ||
      body.order_number ||
      body.id ||
      "";
    const query = body.query || "";

    return await handleTrackRequest({ phone, code, query }, req);
  } catch {
    return NextResponse.json(
      { success: false, orders: [], message: "خطا در رهگیری سفارش." },
      { status: 500 }
    );
  }
}

// بروزرسانی مشخصات و نشانی پیش‌فرض مشتری از پنل حساب کاربری
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanPhone = normalizePhone(body.phone);
    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "شماره همراه معتبر الزامی است." },
        { status: 400 }
      );
    }

    const cookieToken = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    if (cookieToken) {
      const session = await verifyCustomerToken(cookieToken);
      if (session && normalizePhone(session.phone) !== cleanPhone) {
        return NextResponse.json(
          { success: false, message: "شماره همراه با حساب کاربری مطابقت ندارد." },
          { status: 403 }
        );
      }
    }

    const fullName = String(body.fullName || body.full_name || "").trim();
    const province = String(body.province || "").trim();
    const city = String(body.city || "").trim();
    const address = String(body.address || "").trim();
    const postalCode = normalizeDigits(body.postalCode || body.postal_code).replace(
      /\D/g,
      ""
    );

    try {
      await supabaseAdmin.from("crm_customers").upsert([
        {
          id: "cust_" + cleanPhone,
          full_name: fullName || "مشتری گرامی",
          phone: cleanPhone,
          province: province || "",
          city: city || "",
          address: address || null,
          postal_code: postalCode || null,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "✓ مشخصات و نشانی با موفقیت ذخیره شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ذخیره مشخصات." },
      { status: 500 }
    );
  }
}

// لغو و حذف سفارش پرداخت‌نشده (Pending) توسط مشتری + بازگشت موجودی، کوپن و اعتبار کیف پول
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") || "").trim();
    const cleanPhone = normalizePhone(searchParams.get("phone") || "");

    if (!id || !/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "شناسه سفارش و شماره همراه الزامی است." },
        { status: 400 }
      );
    }

    const cookieToken = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    if (cookieToken) {
      const session = await verifyCustomerToken(cookieToken);
      if (session && normalizePhone(session.phone) !== cleanPhone) {
        return NextResponse.json(
          { success: false, message: "عدم تطابق شماره همراه با حساب کاربری." },
          { status: 403 }
        );
      }
    }

    const { data: ord } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!ord) {
      return NextResponse.json(
        { success: false, message: "سفارش مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    const ordPhone = normalizePhone(ord.phone || ord.customer_phone);
    if (ordPhone !== cleanPhone) {
      return NextResponse.json(
        { success: false, message: "شما مجاز به حذف این سفارش نیستید." },
        { status: 403 }
      );
    }

    const st = String(ord.status || "pending").toLowerCase();
    const pst = String(ord.payment_status || "pending").toLowerCase();
    if (
      pst === "paid" ||
      ["paid", "processing", "shipped", "delivered"].includes(st)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "سفارش‌های پرداخت‌شده قابل حذف نیستند.",
        },
        { status: 400 }
      );
    }

    // ۱. بازگرداندن موجودی اقلام به انبار و فعال‌سازی پیامک موجودی
    if (Array.isArray(ord.items)) {
      for (const it of ord.items) {
        const pId = String(it.id || it.productId || it.product_id || "");
        const qty = Math.max(1, Number(it.quantity || 1));
        if (!pId) continue;
        try {
          const { data: pRow } = await supabaseAdmin
            .from("products")
            .select("id, title, name, stock")
            .eq("id", pId)
            .maybeSingle();
          if (pRow) {
            const prevStock = Math.max(0, Number(pRow.stock || 0));
            const nextStock = prevStock + qty;
            await supabaseAdmin
              .from("products")
              .update({
                stock: nextStock,
                is_available: nextStock > 0,
                updated_at: new Date().toISOString(),
              })
              .eq("id", pRow.id);

            if (prevStock <= 0 && nextStock > 0) {
              await triggerBackInStockNotifications(
                pRow.id,
                String(pRow.title || pRow.name || it.title || "محصول"),
                nextStock
              );
            }
          }
        } catch {}
      }
    }

    // ۲. بازگرداندن اعتبار کیف پول در صورت استفاده در سفارش ناتمام
    const walletUsed = extractWalletDeductionFromAddress(ord.address || "");
    if (walletUsed > 0) {
      try {
        const { data: walletRow } = await supabaseAdmin
          .from("customer_wallets")
          .select("balance")
          .eq("customer_phone", cleanPhone)
          .maybeSingle();

        const currentBal = Math.max(0, Number(walletRow?.balance || 0));
        const refundedBal = currentBal + walletUsed;

        await supabaseAdmin.from("customer_wallets").upsert(
          [
            {
              customer_phone: cleanPhone,
              balance: refundedBal,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "customer_phone" }
        );

        await supabaseAdmin.from("admin_audit_logs").insert([
          {
            action: "WALLET_REFUND_ON_CUSTOMER_CANCEL",
            user_id: cleanPhone,
            details: {
              orderId: ord.id,
              orderNumber: ord.order_number,
              refundedAmount: walletUsed,
              newWalletBalance: refundedBal,
            },
            ip_address: getClientIp(req),
            severity: "info",
            created_at: new Date().toISOString(),
          },
        ]);
      } catch {}
    }

    // ۳. آزادسازی ظرفیت کد تخفیف استفاده‌شده
    if (ord.coupon_code) {
      try {
        const { data: cpn } = await supabaseAdmin
          .from("coupons")
          .select("id, used_count, times_used")
          .eq("code", ord.coupon_code)
          .maybeSingle();
        if (cpn) {
          const nextUsed = Math.max(
            0,
            Number(cpn.used_count ?? cpn.times_used ?? 1) - 1
          );
          await supabaseAdmin
            .from("coupons")
            .update({ used_count: nextUsed, times_used: nextUsed })
            .eq("id", cpn.id);
        }
      } catch {}
    }

    await supabaseAdmin.from("orders").delete().eq("id", id);

    return NextResponse.json({
      success: true,
      message:
        walletUsed > 0
          ? `✓ سفارش ناتمام لغو شد، موجودی کالا بازگشت و مبلغ ${walletUsed.toLocaleString("fa-IR")} تومان به کیف پول شما عودت داده شد.`
          : "✓ سفارش ناتمام لغو شد و موجودی کالا به انبار بازگشت.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در لغو سفارش." },
      { status: 500 }
    );
  }
}