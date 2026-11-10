// File Path: app/api/public/coupons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // استفاده از select("*") برای جلوگیری از خطای 500 در صورت نبودن نام دقیق یک ستون در دیتابیس
    const { data: coupons, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Supabase Database Error in /api/public/coupons:", error);
      throw error;
    }

    const nowMs = Date.now();
    const validCoupons = (coupons || []).filter((c: any) => {
      // بررسی انقضا
      const isNotExpired = !c.expires_at || new Date(c.expires_at).getTime() > nowMs;
      // بررسی ظرفیت مصرف
      const used = Number(c.times_used ?? c.used_count ?? 0);
      const limit = Number(c.usage_limit || 0);
      const hasCapacity = limit <= 0 || used < limit;
      
      return isNotExpired && hasCapacity;
    });

    return NextResponse.json(
      { success: true, coupons: validCoupons },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: any) {
    // چاپ خطای دقیق در ترمینال برای عیب‌یابی سریع‌تر
    console.error("API 500 Error (/api/public/coupons):", err.message);
    return NextResponse.json(
      { success: false, coupons: [], error: err.message },
      { status: 500 }
    );
  }
}