import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const rateCheck = await checkRateLimit(clientIp, "order_track", 15, 15);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, message: "تعداد درخواست‌های پیگیری بیش از حد مجاز است." }, { status: 429 });
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 5) {
      return NextResponse.json({ success: false, message: "شماره موبایل یا شماره سفارش معتبر وارد نمایید." }, { status: 400 });
    }

    const cleanQuery = query.trim().replace(/[^A-Za-z0-9\-\u0600-\u06FF]/g, "");
    const isPhone = /^0?9\d{9}$/.test(cleanQuery);

    let dbQuery = supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, total_amount, final_amount, payment_status, status, created_at, items, tracking_code");

    if (isPhone) {
      const normalizedPhone = cleanQuery.replace(/^\+98/, "0");
      dbQuery = dbQuery.eq("customer_phone", normalizedPhone);
    } else {
      dbQuery = dbQuery.eq("order_number", cleanQuery);
    }

    const { data: orders, error } = await dbQuery.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: "خطا در بازیابی سفارشات." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
