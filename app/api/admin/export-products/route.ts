import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, title, category, price, discount_price, stock, is_available")
      .order("created_at", { ascending: false });

    // ساخت فایل CSV با انکودینگ UTF-8 BOM جهت باز شدن صحیح در اکسل فارسی
    let csv = "\uFEFFشناسه,عنوان کالا,دسته‌بندی,قیمت فروش (تومان),قیمت تخفیف,موجودی,وضعیت\n";
    (products || []).forEach((p) => {
      csv += `"${p.id}","${p.title || ""}","${p.category || ""}",${p.price || 0},${p.discount_price || 0},${p.stock || 0},"${p.is_available ? "موجود" : "ناموجود"}"\n`;
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="axon_products_catalog.csv"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
