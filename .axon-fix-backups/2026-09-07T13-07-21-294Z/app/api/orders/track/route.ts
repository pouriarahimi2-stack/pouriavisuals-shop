import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();

    if (!query) {
      return NextResponse.json(
        { success: false, message: "کد پیگیری یا شماره تماس الزامی است." },
        { status: 400 }
      );
    }

    // مسدودسازی قطعی افشای گروهی فاکتورها (query=all)
    if (query.toLowerCase() === "all") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز. امکان دریافت یکجای فاکتورها وجود ندارد." },
        { status: 403 }
      );
    }

    const cleanQuery = query.replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString());

    // استعلام فاکتور و بازگرداندن صرفاً اطلاعات مجاز عمومی مرسوله
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, tracking_code, created_at, items, final_amount")
      .or(`id.eq.${cleanQuery},order_number.eq.${cleanQuery},tracking_code.eq.${cleanQuery},phone.eq.${cleanQuery}`)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { success: false, message: "فاکتوری با این مشخصات یافت نشد." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, orders: data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "خطا در استعلام سفارش." },
      { status: 500 }
    );
  }
}
