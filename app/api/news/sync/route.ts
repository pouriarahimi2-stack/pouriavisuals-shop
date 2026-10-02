import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data: prods } = await supabaseAdmin
      .from("products")
      .select("id, title, category, price")
      .limit(5);

    const targetProd = prods?.[Math.floor(Math.random() * (prods?.length || 1))];
    const prodName = targetProd?.title || "گجت‌های هوشمند دیجیتال";
    const prodLink = targetProd ? "/products/" + targetProd.id : "/products";

    const nowIso = new Date().toISOString();
    const newHarvestedItem = {
      id: randomUUID(),
      title:
        "گزارش ویژه رادار فناوری: بررسی فناوری‌های نسل جدید در " +
        prodName +
        " و استانداردهای بازار ۲۰۲۶",
      slug: "tech-radar-weekly-" + Date.now(),
      summary:
        "تحلیل تخصصی عملکرد، کیفیت ساخت و مزایای رقابتی " +
        prodName +
        " برای خریداران حرفه‌ای بازار ایران.",
      content: [
        "<h2>تحلیل تخصصی رادار فناوری آکسون: " + prodName + "</h2>",
        "<p>بررسی‌های هفتگی بازار جهانی تکنولوژی نشان می‌دهد که تقاضا برای محصولاتی با طول عمر بالا، بهره‌وری انرژی و طراحی مدرن به شکل چشمگیری افزایش یافته است. در این میان، <strong>" +
          prodName +
          "</strong> به عنوان یکی از گزینه‌های شاخص و استاندارد شناخته می‌شود.</p>",
        "<h3>چرا این فناوری اهمیت دارد؟</h3>",
        "<ul>",
        "  <li>بهره‌گیری از قطعات اورجینال و استانداردهای ایمنی پیشرفته</li>",
        "  <li>طراحی ارگونومیک و کاربری آسان در کنار دوام طولانی‌مدت</li>",
        "  <li>ارزش خرید بالا نسبت به نمونه‌های مشابه در بازار</li>",
        "</ul>",
        '<p>هم‌اکنون می‌توانید این محصول را با گارانتی معتبر از طریق <a href="' +
          prodLink +
          '"><strong>صفحه رسمی ' +
          prodName +
          " در فروشگاه آکسون</strong></a> مشاهده و تهیه نمایید.</p>",
      ].join("\n"),
      category: "gadgets",
      source_name: "رادار خودکار سئو آکسون",
      image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      tags: ["رادار فناوری", prodName, "سئو تکنولوژی", "کالای دیجیتال"],
      is_published: true,
      trending_score: 99,
      published_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    await supabaseAdmin.from("tech_news").insert([newHarvestedItem]);

    return NextResponse.json({
      success: true,
      message:
        "✓ خبر سئومحور جدید مرتبط با محصولات فروشگاه با موفقیت تولید، ترجمه و در رادار اخبار منتشر شد.",
      data: newHarvestedItem,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
