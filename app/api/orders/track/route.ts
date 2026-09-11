import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // پشتیبانی همزمان از هر دو پارامتر query و q
    const query = (searchParams.get("query") || searchParams.get("q") || "").trim();

    if (!query) {
      return NextResponse.json(
        { success: false, message: "کد رهگیری فاکتور یا شماره موبایل الزامی است." },
        { status: 400 }
      );
    }

    if (query.toLowerCase() === "all") {
      if (!verifyAdminSession(req)) {
        return NextResponse.json(
          { success: false, message: "دسترسی غیرمجاز." },
          { status: 401 }
        );
      }

      if (supabaseAdmin) {
        const { data } = await supabaseAdmin
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        return NextResponse.json({ success: true, data: data || [] });
      }

      return NextResponse.json({ success: true, data: [] });
    }

    const cleanQuery = query.replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString()).replace(/\D/g, "");

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, customer_name, phone, status, tracking_code, items, total_amount, final_amount, created_at, province, city, address")
        .or(`id.eq.${query},order_number.eq.${query},tracking_code.eq.${query},phone.eq.${cleanQuery || query}`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) {
        return NextResponse.json({ success: false, message: "فاکتوری با این مشخصات یافت نشد." }, { status: 404 });
      }

      return NextResponse.json({ success: true, order: data[0], data });
    }

    return NextResponse.json({ success: false, message: "دیتابیس در دسترس نیست." }, { status: 503 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
