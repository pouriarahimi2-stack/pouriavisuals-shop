// File Path: app/api/user/wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  verifyCustomerToken,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/customerSession";

export const dynamic = "force-dynamic";

function normalizeIranPhone(raw: any): string {
  const digits = String(raw || "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) return "0" + digits.slice(2);
  if (digits.startsWith("9") && digits.length === 10) return "0" + digits;
  return digits;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryPhone = normalizeIranPhone(searchParams.get("phone") || "");

    const cookieToken = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    let sessionPhone = "";

    if (cookieToken) {
      const session = await verifyCustomerToken(cookieToken);
      if (session?.phone) {
        sessionPhone = normalizeIranPhone(session.phone);
      }
    }

    if (sessionPhone && queryPhone && sessionPhone !== queryPhone) {
      return NextResponse.json(
        { success: false, balance: 0, message: "دسترسی غیرمجاز به کیف پول." },
        { status: 403 }
      );
    }

    const targetPhone = sessionPhone || queryPhone;
    if (!/^09\d{9}$/.test(targetPhone)) {
      return NextResponse.json(
        { success: false, balance: 0, message: "شماره همراه معتبر نیست." },
        { status: 400 }
      );
    }

    const { data: wallet, error } = await supabaseAdmin
      .from("customer_wallets")
      .select("balance, updated_at")
      .eq("customer_phone", targetPhone)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: true, balance: 0, updated_at: null },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        balance: Math.max(0, Number(wallet?.balance || 0)),
        updated_at: wallet?.updated_at || null,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json(
      { success: true, balance: 0, updated_at: null },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}