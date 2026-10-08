import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // گرفتن پارامتر page برای صفحه‌بندی ترب (اختیاری)
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 100; // ترب معمولا ۱۰۰ کالا در هر صفحه می‌گیرد
    const offset = (page - 1) * limit;

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, title, price, discount_price, stock, is_available, image_url")
      .range(offset, offset + limit - 1);

    if (error || !products) {
      return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
    }

    // آدرس پایه سایت شما
    const baseUrl = "https://axoncore.ir";

    // مپ کردن دیتابیس آکسون به فرمت استاندارد ترب
    const torobCatalog = products.map((p) => {
      const currentPrice = Number(p.discount_price && p.discount_price > 0 ? p.discount_price : p.price || 0);
      const oldPrice = Number(p.discount_price && p.discount_price > 0 ? p.price || 0 : currentPrice);
      const isAvailable = p.is_available !== false && Number(p.stock) > 0;

      // اصلاح لینک تصویر
      let imgUrl = p.image_url || "/placeholder.png";
      if (!imgUrl.startsWith("http")) {
        imgUrl = baseUrl + (imgUrl.startsWith("/") ? "" : "/") + imgUrl;
      }

      return {
        title: p.title,
        subtitle: "", 
        page_url: `${baseUrl}/products/${p.id}`,
        price: currentPrice,
        old_price: oldPrice,
        availability: isAvailable ? "instock" : "outofstock",
        image_url: imgUrl,
      };
    });

    return NextResponse.json(torobCatalog);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
