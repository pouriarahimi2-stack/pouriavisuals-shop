import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const body = await req.json();
    const products = Array.isArray(body) ? body : body.products;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, message: "لیست محصولات برای ایمپورت معتبر نیست." }, { status: 400 });
    }

    const sanitizedList = products.map((p: any, idx: number) => {
      const title = String(p.title || p.name || `کالای بدون عنوان ${idx + 1}`).trim();
      const price = Math.max(0, Number(p.price || 0));
      const discountPrice = p.discount_price ? Number(p.discount_price) : null;
      const stock = p.stock !== undefined && p.stock !== null ? Math.max(0, Number(p.stock)) : 10;
      const category = String(p.category || p.category_name || "تجهیزات تخصصی").trim();

      return {
        title,
        price,
        discount_price: discountPrice,
        stock,
        is_available: stock > 0,
        category,
        category_name: category,
        image_url: p.image_url || p.image || "/placeholder.png",
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image_url || p.image || "/placeholder.png"],
        short_description: p.short_description || p.subtitle || "",
        specs: typeof p.specs === "object" ? p.specs : {},
        updated_at: new Date().toISOString(),
      };
    });

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert(sanitizedList)
      .select("id, title, price, category");

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${sanitizedList.length} محصول با موفقیت وارد پایگاه داده گردید.`,
      insertedCount: data?.length || sanitizedList.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
