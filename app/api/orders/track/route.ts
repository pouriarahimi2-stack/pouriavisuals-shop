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
  const resolvedOrderNum = row.order_number || row.id || "";
  const resolvedTracking = row.tracking_code || resolvedOrderNum;
  return {
    ...row,
    phone: resolvedPhone,
    customer_phone: resolvedPhone,
    order_number: resolvedOrderNum,
    tracking_code: resolvedTracking,
  };
}

async function searchOrders(params: {
  phone?: string;
  code?: string;
}) {
  const cleanPhone = normalizePhone(params.phone);
  const cleanCode = normalizeDigits(params.code).toUpperCase();

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
      const rowPhone = normalizePhone(row.phone || row.customer_phone || "");
      const rowId = String(row.id || "").toUpperCase();
      const rowOrderNum = String(row.order_number || "").toUpperCase();
      const rowTracking = String(row.tracking_code || "").toUpperCase();

      const phoneMatches = !cleanPhone || rowPhone === cleanPhone || rowPhone.endsWith(cleanPhone.slice(-10));
      const codeMatches =
        !cleanCode ||
        rowId === cleanCode ||
        rowOrderNum === cleanCode ||
        rowTracking === cleanCode ||
        rowId.includes(cleanCode) ||
        rowOrderNum.includes(cleanCode) ||
        rowTracking.includes(cleanCode);

      if (cleanPhone && cleanCode) {
        return phoneMatches && codeMatches;
      }
      if (cleanCode) {
        return codeMatches;
      }
      if (cleanPhone) {
        return phoneMatches;
      }
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

    if (!phone && !code) {
      return NextResponse.json(
        {
          success: false,
          message: "لطفاً شماره موبایل یا کد رهگیری سفارش را وارد نمایید.",
        },
        { status: 400 }
      );
    }

    const matched = await searchOrders({ phone, code });

    if (matched.length === 0) {
      return NextResponse.json(
        {
          success: false,
          orders: [],
          order: null,
          message: "سفارشی با این مشخصات یافت نشد.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: matched[0],
        orders: matched,
        data: matched[0],
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
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

    if (!phone && !code) {
      return NextResponse.json(
        {
          success: false,
          message: "لطفاً شماره موبایل یا کد رهگیری سفارش را وارد نمایید.",
        },
        { status: 400 }
      );
    }

    const matched = await searchOrders({ phone, code });

    if (matched.length === 0) {
      return NextResponse.json(
        {
          success: false,
          orders: [],
          order: null,
          message: "سفارشی با این مشخصات یافت نشد.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: matched[0],
        orders: matched,
        data: matched[0],
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در رهگیری سفارش." },
      { status: 500 }
    );
  }
}
