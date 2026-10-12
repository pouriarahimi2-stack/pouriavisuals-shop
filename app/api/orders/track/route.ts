// File Path: app/api/orders/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyCustomerToken, CUSTOMER_COOKIE_NAME } from "@/lib/customerSession";

export const dynamic = "force-dynamic";

// Rate limiting ساده در حافظه (per-IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
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

function normalizeOrderRecord(row: any) {
  if (!row || typeof row !== "object") return row;
  const resolvedPhone = row.phone || row.customer_phone || "";
  const rawAddress = String(row.address || "");
  const cleanAddress = rawAddress.replace(/\s*\[مالیات\s*\d+%:\s*\d+\s*تومان\]/g, "").trim();

  const shortDigits =
    String(row.tracking_code || "").replace(/\D/g, "").slice(0, 6) ||
    String(row.id || "").replace(/\D/g, "").slice(0, 6) ||
    String(row.id || "").slice(0, 6).toUpperCase();

  const resolvedOrderNum =
    row.order_number && !String(row.order_number).includes("-4")
      ? row.order_number
      : "AXN-" + shortDigits;

  const resolvedTracking = row.tracking_code || resolvedOrderNum;
  const resolvedFinal = Number(row.final_amount ?? row.total_amount ?? row.total_price ?? 0);

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

const MIN_CODE_LENGTH = 4;
const MIN_PHONE_DIGITS = 10;

async function searchOrdersWithBothParams(phone: string, code: string) {
  const cleanPhone = normalizePhone(phone);
  const cleanCode = normalizeDigits(code).toUpperCase();

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("phone", cleanPhone)
    .order("created_at", { ascending: false })
    .limit(20);

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
        rowId.includes(cleanCode) ||
        rowOrderNum.includes(cleanCode) ||
        rowTracking.includes(cleanCode)
      );
    });
}

async function handleTrackRequest(
  phone: string,
  code: string,
  req: NextRequest
): Promise<NextResponse> {
  const ip = getClientIp(req);

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, message: "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً چند دقیقه دیگر امتحان کنید." },
      { status: 429 }
    );
  }

  const cleanPhone = normalizePhone(phone);
  const cleanCode = normalizeDigits(code);

  if (!cleanPhone || cleanPhone.replace(/\D/g, "").length < MIN_PHONE_DIGITS) {
    return NextResponse.json(
      { success: false, message: "شماره موبایل معتبر وارد نمایید." },
      { status: 400 }
    );
  }
  if (!cleanCode || cleanCode.length < MIN_CODE_LENGTH) {
    return NextResponse.json(
      { success: false, message: "کد رهگیری سفارش را وارد نمایید." },
      { status: 400 }
    );
  }

  const cookieToken = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  if (cookieToken) {
    const session = await verifyCustomerToken(cookieToken);
    if (session) {
      const sessionPhone = normalizePhone(session.phone);
      if (sessionPhone !== cleanPhone) {
        return NextResponse.json(
          { success: false, message: "شماره موبایل با حساب شما مطابقت ندارد." },
          { status: 403 }
        );
      }
    }
  }

  const matched = await searchOrdersWithBothParams(cleanPhone, cleanCode);

  if (matched.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "سفارشی با این مشخصات یافت نشد. لطفاً شماره موبایل و کد رهگیری را بررسی نمایید.",
        order: null,
        orders: [],
        data: null,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    );
  }

  return NextResponse.json(
    {
      success: true,
      order: matched[0] || null,
      orders: matched,
      data: matched[0] || null,
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
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
    return await handleTrackRequest(phone, code, req);
  } catch {
    return NextResponse.json(
      { success: false, message: "خطا در رهگیری سفارش." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone =
      body.phone || body.mobile || body.customer_phone || body.customerPhone || "";
    const code =
      body.code ||
      body.trackingCode ||
      body.tracking_code ||
      body.orderId ||
      body.order_number ||
      body.id ||
      "";
    return await handleTrackRequest(phone, code, req);
  } catch {
    return NextResponse.json(
      { success: false, message: "خطا در رهگیری سفارش." },
      { status: 500 }
    );
  }
}
