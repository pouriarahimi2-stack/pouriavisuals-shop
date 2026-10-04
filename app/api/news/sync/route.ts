// File Path: app/api/news/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

function buildDeepSeoNewsHtml(title: string, prodName: string, prodLink: string, prodPrice: number): string {
  const formattedPrice = prodPrice > 0 ? prodPrice.toLocaleString("fa-IR") + " تومان" : "قیمت رقابتی روز";
  return [
    '<div style="background:rgba(2,132,199,0.08);border-right:4px solid #0284c7;padding:16px;border-radius:16px;margin-bottom:20px;">',
    "  <strong>📌 خلاصه مدیریتی و نکات کلیدی این گزارش فنی:</strong>",
    "  <ul>",
    "    <li>بررسی عمیق معماری سخت‌افزاری، راندمان مصرف انرژی و استانداردهای نسل جدید در <strong>" + title + "</strong>.</li>",
    "    <li>مقایسه تطبیقی شاخص‌های کنتراست، دوام قطعات، سرعت انتقال داده و ارزش خرید در بازار ایران.</li>",
    "    <li>دسترسی مستقیم به نسخه اورجینال <strong>" + prodName + "</strong> با گارانتی اصالت طلایی در کاتالوگ رسمی آکسون کور.</li>",
    "  </ul>",
    "</div>",
    "<h2>۱. تحلیل فنی و مهندسی: چرا این فناوری نقطه عطف بازار ۲۰۲۶ است؟</h2>",
    "<p>در سال‌های اخیر، صنعت تجهیزات دیجیتال و گجت‌های هوشمند دستخوش تغییرات بنیادینی در معماری مدارهای مجتمع، مدیریت حرارتی و ارگونومی ساخت شده است. بررسی‌های آزمایشگاهی نشان می‌دهد که نسل جدید این تجهیزات با بهره‌گیری از آلیاژهای سبک و مقاوم، تراشه‌های کم‌مصرف و ماژول‌های تغذیه هوشمند، توانسته‌اند راندمان عملکردی را تا ۴۵ درصد نسبت به نسل‌های پیشین ارتقا دهند.</p>",
    "<p>کاربران حرفه‌ای و خریداران هوشمند امروزه تنها به ظاهر محصول بسنده نمی‌کنند؛ بلکه پایداری عملکرد در استفاده طولانی‌مدت، استانداردهای ایمنی مدار و خدمات پس از فروش معتبر، معیارهای اصلی انتخاب یک کالای دیجیتال استاندارد هستند.</p>",
    "<h2>۲. جدول مقایسه تخصصی استانداردها و نسل‌های فناوری</h2>",
    '<table border="1" cellpadding="10" style="width:100%;border-collapse:collapse;margin:18px 0;font-size:13px;">',
    "  <thead>",
    '    <tr style="background:#0f172a;color:#38bdf8;">',
    "      <th>شاخص ارزیابی فنی</th>",
    "      <th>نسل‌های متداول بازار</th>",
    "      <th>استاندارد نسل جدید (" + prodName + ")</th>",
    "    </tr>",
    "  </thead>",
    "  <tbody>",
    "    <tr>",
    "      <td><strong>راندمان و بهره‌‌وری انرژی</strong></td>",
    "      <td>متوسط با افت توان در کارکرد مداوم</td>",
    "      <td>بهینه‌سازی هوشمند با پایداری ۱۰۰٪</td>",
    "    </tr>",
    "    <tr>",
    "      <td><strong>کیفیت متریال و شاسی</strong></td>",
    "      <td>پلیمرهای معمولی</td>",
    "      <td>کامپوزیت تقویت‌شده مقاوم در برابر حرارت و ضربه</td>",
    "    </tr>",
    "    <tr>",
    "      <td><strong>استاندارد ایمنی و گارانتی</strong></td>",
    "      <td>فاقد رهگیری اصالت</td>",
    "      <td>تضمین اصالت فیزیکی + ۱۸ ماه گارانتی طلایی آکسون</td>",
    "    </tr>",
    "  </tbody>",
    "</table>",
    "<h2>۳. بررسی ارزش خرید و جایگاه " + prodName + " در بازار ایران</h2>",
    "<p>یکی از چالش‌های اصلی خریداران در بازار تجهیزات تکنولوژی، تشخیص نمونه‌های اورجینال از نسخه‌های غیراستاندارد است. در بررسی‌های فنی انجام‌شده توسط تیم تخصصی آکسون کور، <strong>" + prodName + "</strong> توانسته است بالاترین امتیاز دوام، کیفیت مونتاژ و رضایت کاربری را کسب نماید.</p>",
    '<div style="padding:18px;border-radius:20px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);margin:20px 0;">',
    "  <h3>🛍️ پیشنهاد ویژه کاتالوگ رسمی آکسون کور</h3>",
    "  <p>هم‌اکنون می‌توانید <strong>" + prodName + "</strong> را با قیمت <strong>" + formattedPrice + "</strong>، ضمانت سلامت فیزیکی و ارسال سریع پیشتاز به سراسر کشور تهیه فرمایید:</p>",
    '  <p><a href="' + prodLink + '"><strong>🔗 مشاهده مشخصات کامل و خرید آنلاین ' + prodName + " ←</strong></a></p>",
    "</div>",
    "<h2>۴. پرسش‌های متداول خریداران و کارشناسان (FAQ)</h2>",
    "<h3>آیا این فناوری با استانداردهای برق و تجهیزات داخل ایران کاملاً سازگار است؟</h3>",
    "<p>بله، تمامی محصولات عرضه‌شده در کاتالوگ آکسون کور دارای ماژول تطبیق خودکار ولتاژ و استانداردهای ایمنی بین‌المللی هستند و بدون نیاز به مبدل خاص، بالاترین کارایی را ارائه می‌دهند.</p>",
    "<h3>شرایط گارانتی و ارسال این محصول در فروشگاه آکسون کور چگونه است؟</h3>",
    "<p>کلیه سفارشات پس از تست سلامت فیزیکی در واحد کنترل کیفیت، با بسته‌بندی ضدضربه و کد رهگیری رسمی پست پیشتاز ارسال شده و تحت پوشش ضمانت اصالت قرار دارند.</p>",
  ].join("");
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { data: prods } = await supabaseAdmin
      .from("products")
      .select("id, title, category, price, discount_price")
      .limit(10);

    const targetProd = prods?.[Math.floor(Math.random() * (prods?.length || 1))];
    const prodName = targetProd?.title || "تجهیزات هوشمند دیجیتال";
    const prodLink = targetProd ? "/products/" + targetProd.id : "/products";
    const prodPrice = Number(targetProd?.discount_price || targetProd?.price || 0);
    const nowIso = new Date().toISOString();

    if (body.action === "upgrade_all_short_news") {
      const { data: allNews } = await supabaseAdmin.from("tech_news").select("*");
      let upgradedCount = 0;

      for (const item of allNews || []) {
        const currentLen = String(item.content || "").length;
        if (currentLen < 1200) {
          const deepContent = buildDeepSeoNewsHtml(
            item.title || "تحول فناوری‌های دیجیتال ۲۰۲۶",
            prodName,
            prodLink,
            prodPrice
          );
          await supabaseAdmin
            .from("tech_news")
            .update({
              content: deepContent,
              summary:
                item.summary && item.summary.length > 70
                  ? item.summary
                  : "تحلیل جامع فنی، جدول مقایسه استانداردها، بررسی ارزش خرید و راهنمای تخصصی " +
                    (item.title || prodName) +
                    " در رادار فناوری آکسون کور.",
              updated_at: nowIso,
            })
            .eq("id", item.id);
          upgradedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        upgradedCount,
        message:
          "⚡ تعداد " +
          upgradedCount +
          " خبر کوتاه با موفقیت به مقالات تحلیلی جامع و عمیق سئو (همراه با جدول مقایسه، FAQ و لینک خرید محصول) ارتقا یافتند!",
      });
    }

    const articleTitle =
      "گزارش تحلیلی رادار فناوری ۲۰۲۶: بررسی عمیق مهندسی، جدول مقایسه و ارزش خرید " + prodName;

    const newHarvestedItem = {
      id: randomUUID(),
      title: articleTitle,
      slug: "tech-radar-deep-analysis-" + Date.now(),
      summary:
        "کالبدشکافی تخصصی عملکرد، مقایسه تطبیقی استانداردها، تحلیل راندمان انرژی و راهنمای خرید " +
        prodName +
        " در بازار ایران.",
      content: buildDeepSeoNewsHtml(articleTitle, prodName, prodLink, prodPrice),
      category: "gadgets",
      source_name: "رادار تحلیلی سئو آکسون",
      image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      tags: ["رادار فناوری", prodName, "بررسی تخصصی", "راهنمای خرید ۲۰۲۶", "کالای دیجیتال"],
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
        "✓ مقاله خبری جامع و عمیق سئومحور (شامل جدول مقایسه، سوالات متداول و لینک محصول) با موفقیت تولید و منتشر شد.",
      data: newHarvestedItem,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
