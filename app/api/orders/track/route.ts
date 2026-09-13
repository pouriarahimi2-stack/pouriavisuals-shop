import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || searchParams.get("phone") || searchParams.get("orderNumber");

    if (!query) {
      return NextResponse.json({ success: false, message: "کد پیگیری یا شماره تماس الزامی است." }, { status: 400 });
    }

    const cleanQuery = query.trim();

    // اگر درخواست تمام سفارش‌ها ارسال شود، حتماً نیازمند لاگین قطعی با await است
    if (cleanQuery.toLowerCase() === "all") {
      const session = await verifyAdminSession(req);
      if (!session) {
        return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
      }

      const { data, error } = await supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, data, orders: data });
    }

    // پیگیری عمومی برای خود کاربر بر مبنای شماره تماس یا شماره سفارش
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, payment_status, total_amount, final_amount, tracking_code, created_at, items")
      .or(`phone.eq.${cleanQuery},order_number.eq.${cleanQuery},id.eq.${cleanQuery}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
