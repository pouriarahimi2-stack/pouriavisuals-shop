// File Path: app/api/orders/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

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

async function searchOrders(params: { phone?: string; code?: string; query?: string }) {
  let cleanPhone = normalizePhone(params.phone);
  let cleanCode = normalizeDigits(params.code).toUpperCase();
  const rawQuery = normalizeDigits(params.query);

  if (rawQuery) {
    const digitsOnly = rawQuery.replace(/\D/g, "");
    if (/^0?9\d{9}$/.test(digitsOnly) || /^989\d{9}$/.test(digitsOnly)) {
      cleanPhone = normalizePhone(digitsOnly);
    } else {
      cleanCode = rawQuery.toUpperCase();
    }
  }

  const { data: allOrders, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error || !Array.isArray(allOrders)) {
    return [];
  }

  return allOrders
    .filter((row: any) => {
      const normalized = normalizeOrderRecord(row);
      const rowPhone = normalizePhone(normalized.phone || "");
      const rowId = String(row.id || "").toUpperCase();
      const rowOrderNum = String(normalized.order_number || "").toUpperCase();
      const rowTracking = String(normalized.tracking_code || "").toUpperCase();

      const phoneMatches =
        Boolean(cleanPhone) &&
        (rowPhone === cleanPhone ||
          (cleanPhone.length >= 10 && rowPhone.endsWith(cleanPhone.slice(-10))));

      const codeMatches =
        Boolean(cleanCode) &&
        (rowId === cleanCode ||
          rowOrderNum === cleanCode ||
          rowTracking === cleanCode ||
          rowId.includes(cleanCode) ||
          rowOrderNum.includes(cleanCode) ||
          rowTracking.includes(cleanCode));

      if (cleanPhone && cleanCode) return phoneMatches && codeMatches;
      if (cleanPhone) return phoneMatches;
      if (cleanCode) return codeMatches;
      return false;
    })
    .map(normalizeOrderRecord);
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

    if (!phone && !code && !query) {
      return NextResponse.json(
        { success: false, message: "لطفاً شماره موبایل یا کد رهگیری سفارش را وارد نمایید." },
        { status: 400 }
      );
    }

    const matched = await searchOrders({ phone, code, query });

    return NextResponse.json(
      {
        success: true,
        order: matched[0] || null,
        orders: matched,
        data: matched[0] || null,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در رهگیری سفارش." },
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
    const query = body.query || "";

    if (!phone && !code && !query) {
      return NextResponse.json(
        { success: false, message: "لطفاً شماره موبایل یا کد رهگیری سفارش را وارد نمایید." },
        { status: 400 }
      );
    }

    const matched = await searchOrders({ phone, code, query });

    return NextResponse.json(
      {
        success: matched.length > 0,
        order: matched[0] || null,
        orders: matched,
        data: matched[0] || null,
        message: matched.length > 0 ? "سفارش یافت شد." : "سفارشی با این مشخصات یافت نشد.",
      },
      {
        status: matched.length > 0 ? 200 : 404,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در رهگیری سفارش." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanPhone = normalizePhone(body.phone);
    const fullName = String(body.fullName || "").trim();

    if (!cleanPhone || cleanPhone.length !== 11) {
      return NextResponse.json({ success: false, message: "شماره معتبر نیست." }, { status: 400 });
    }

    await supabaseAdmin.from("crm_customers").upsert([
      {
        id: "cust_" + cleanPhone,
        full_name: fullName || "مشتری گرامی",
        phone: cleanPhone,
        province: body.province || "فارس",
        city: body.city || "شیراز",
        address: body.address || "",
        postal_code: body.postalCode || null,
        updated_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, message: "پروفایل بروزرسانی شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    const phone = normalizePhone(searchParams.get("phone") || "");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    const { data: ord } = await supabaseAdmin
      .from("orders")
      .select("id, phone, customer_phone, status, payment_status")
      .eq("id", id)
      .maybeSingle();

    if (!ord) {
      return NextResponse.json({ success: false, message: "سفارش یافت نشد." }, { status: 404 });
    }

    const ordPhone = normalizePhone(ord.phone || ord.customer_phone || "");
    if (phone && ordPhone && ordPhone !== phone) {
      return NextResponse.json({ success: false, message: "عدم تطابق شماره همراه." }, { status: 403 });
    }

    if (ord.status === "paid" || ord.payment_status === "paid" || ord.status === "shipped") {
      return NextResponse.json(
        { success: false, message: "سفارش‌های پرداخت‌شده قابل حذف مستقیم نیستند." },
        { status: 400 }
      );
    }

    await supabaseAdmin.from("orders").delete().eq("id", id);
    return NextResponse.json({ success: true, message: "سفارش ناتمام حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
