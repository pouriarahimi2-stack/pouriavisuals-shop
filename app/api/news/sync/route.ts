// File Path: app/api/news/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { unpackProductRow } from "@/lib/productUnpacker";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  hardware: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200",
  gadgets: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
  ai: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200",
  gaming: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200",
};

function buildDeepSeoNewsHtml(
  title: string,
  prodName: string,
  prodLink: string,
  prodPrice: number
): string {
  const formattedPrice =
    prodPrice > 0 ? prodPrice.toLocaleString("fa-IR") + " تومان" : "قیمت رقابتی روز";
  return [
    '<div style="background:rgba(2,132,199,0.1);border-right:4px solid #0284c7;padding:16px;border-radius:16px;margin-bottom:20px;">',
    "  <strong>📌 خلاصه مدیریتی و نکات کلیدی این گزارش فنی:</strong>",
    "  <ul>",
    "    <li>بررسی عمیق معماری سخت‌افزاری، راندمان مصرف انرژی و استانداردهای نسل جدید در <strong>" +
      title +
      "</strong>.</li>",
    "    <li>مقایسه تطبیقی شاخص‌های کنتراست، دوام قطعات، سرعت انتقال داده و ارزش خرید در بازار ایران.</li>",
    "    <li>دسترسی مستقیم به نسخه اورجینال <strong>" +
      prodName +
      "</strong> با گارانتی اصالت طلایی در کاتالوگ رسمی آکسون کور.</li>",
    "  </ul>",
    "</div>",
    "<h2>۱. تحلیل فنی و مهندسی: چرا این فناوری نقطه عطف بازار ۲۰۲۶ است؟</h2>",
    "<p>در سال‌های اخیر، صنعت تجهیزات دیجیتال و گجت‌های هوشمند دستخوش تغییرات بنیادینی در معماری مدارهای مجتمع، مدیریت حرارتی و ارگونومی ساخت شده است. بررسی‌های آزمایشگاهی نشان می‌دهد که نسل جدید این تجهیزات با بهره‌گیری از آلیاژهای سبک و مقاوم، تراشه‌های کم‌مصرف و ماژول‌های تغذیه هوشمند، توانسته‌اند راندمان عملکردی را تا ۴۵ درصد نسبت به نسل‌های پیشین ارتقا دهند.</p>",
    "<p>کاربران حرفه‌ای و خریداران هوشمند امروزه تنها به ظاهر محصول بسنده نمی‌کنند؛ بلکه پایداری عملکرد در استفاده طولانی‌مدت، استانداردهای ایمنی مدار و خدمات پس از فروش معتبر، معیارهای اصلی انتخاب یک کالای دیجیتال استاندارد هستند.</p>",
    "<h2>۲. جدول مقایسه تخصصی استانداردها و نسل‌های فناوری</h2>",
    '<table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:13px;">',
    "  <thead>",
    '    <tr style="background:rgba(2,132,199,0.15);">',
    '      <th style="padding:12px;border:1px solid rgba(148,163,184,0.3);text-align:right;">شاخص ارزیابی فنی</th>',
    '      <th style="padding:12px;border:1px solid rgba(148,163,184,0.3);text-align:right;">نسل‌های متداول بازار</th>',
    '      <th style="padding:12px;border:1px solid rgba(148,163,184,0.3);text-align:right;">استاندارد نسل جدید (' +
      prodName +
      ")</th>",
    "    </tr>",
    "  </thead>",
    "  <tbody>",
    "    <tr>",
    '      <td style="padding:10px;border:1px solid rgba(148,163,184,0.25);font-weight:bold;">راندمان و بهره‌وری انرژی</td>',
    '      <td style="padding:10px;border:1px solid rgba(148,163,184,0.25);">متوسط با افت توان در کارکرد مداوم</td>',
    '      <td style="padding:10px;border:1px solid rgba(148,163,184,0.25);">بهینه‌سازی هوشمند با پایداری ۱۰۰٪</td>',
    "    </tr>",
    "    <tr>",
    '      <td style="padding:10px;border:1px solid rgba(148,163,184,0.25);font-weight:bold;">کیفیت متریال و شاسی</td>',
    '      <td style="padding:10px;border:1px solid rgba(148,163,184,0.25);">پلیمرهای معمولی</td>',
    '      <td style="padding:10px;border:1px solid rgba(148,163,184,0.25);">کامپوزیت تقویت‌شده مقاوم در برابر حرارت و ضربه</td>',
    "    </tr>",
    "    <tr>",
    '      <td style="padding:10px;border:1px solid rgba(148,163,184,0.25);font-weight:bold;">استاندارد ایمنی و گارانتی</td>',
    '      <td style="padding:10px;border:1px solid rgba(148,163,184,0.25);">فاقد رهگیری اصالت</td>',
    '      <td style="padding:10px;border:1px solid rgba(148,163,184,0.25);">تضمین اصالت فیزیکی + ۱۸ ماه گارانتی طلایی آکسون</td>',
    "    </tr>",
    "  </tbody>",
    "</table>",
    "<h2>۳. بررسی ارزش خرید و جایگاه " + prodName + " در بازار ایران</h2>",
    "<p>یکی از چالش‌های اصلی خریداران در بازار تجهیزات تکنولوژی، تشخیص نمونه‌های اورجینال از نسخه‌های غیراستاندارد است. در بررسی‌های فنی انجام‌شده توسط تیم تخصصی آکسون کور، <strong>" +
      prodName +
      "</strong> توانسته است بالاترین امتیاز دوام، کیفیت مونتاژ و رضایت کاربری را کسب نماید.</p>",
    '<div style="padding:18px;border-radius:20px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);margin:20px 0;">',
    "  <h3>🛍️ پیشنهاد ویژه کاتالوگ رسمی آکسون کور</h3>",
    "  <p>هم‌اکنون می‌توانید <strong>" +
      prodName +
      "</strong> را با قیمت <strong>" +
      formattedPrice +
      "</strong>، ضمانت سلامت فیزیکی و ارسال سریع پیشتاز به سراسر کشور تهیه فرمایید:</p>",
    '  <p><a href="' +
      prodLink +
      '"><strong>🔗 مشاهده مشخصات کامل و خرید آنلاین ' +
      prodName +
      " ←</strong></a></p>",
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
    const nowIso = new Date().toISOString();

    // ۱. اکشن پاک‌سازی خودکار خبرهای تکراری دیتابیس
    if (body.action === "deduplicate_news") {
      const { data: allNews } = await supabaseAdmin
        .from("tech_news")
        .select("*")
        .order("created_at", { ascending: false });

      const seenTitles = new Map<string, any>();
      const duplicateIds: string[] = [];

      for (const item of allNews || []) {
        const normTitle = String(item.title || "")
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase();

        if (!normTitle) continue;

        if (!seenTitles.has(normTitle)) {
          seenTitles.set(normTitle, item);
        } else {
          const existingBest = seenTitles.get(normTitle);
          const currentLen = String(item.content || "").length;
          const bestLen = String(existingBest.content || "").length;

          // نگه داشتن نسخه‌ای که محتوای کامل‌تری دارد
          if (currentLen > bestLen) {
            duplicateIds.push(existingBest.id);
            seenTitles.set(normTitle, item);
          } else {
            duplicateIds.push(item.id);
          }
        }
      }

      if (duplicateIds.length > 0) {
        await supabaseAdmin.from("tech_news").delete().in("id", duplicateIds);
      }

      return NextResponse.json({
        success: true,
        removedCount: duplicateIds.length,
        remainingCount: seenTitles.size,
        message:
          duplicateIds.length > 0
            ? `🧹 پاک‌سازی کامل شد! تعداد ${duplicateIds.length} خبر تکراری حذف شد و ${seenTitles.size} خبر یکتا و استاندارد باقی ماند.`
            : "✓ هیچ خبر تکراری در دیتابیس وجود ندارد؛ تمامی اخبار یکتا هستند.",
      });
    }

    // واکشی محصولات و اخبار فعلی
    const [{ data: rawProds }, { data: existingNews }] = await Promise.all([
      supabaseAdmin.from("products").select("*").limit(20),
      supabaseAdmin.from("tech_news").select("*").order("created_at", { ascending: false }),
    ]);

    const prods = (rawProds || []).map(unpackProductRow);
    const allNews = existingNews || [];

    // ۲. اکشن ارتقای تمام اخبار کوتاه به مقالات جامع سئو
    if (body.action === "upgrade_all_short_news") {
      let upgradedCount = 0;

      for (let i = 0; i < allNews.length; i++) {
        const item = allNews[i];
        const currentLen = String(item.content || "").length;
        const matchedProd = prods[i % Math.max(1, prods.length)];
        const pName = matchedProd?.title || "تجهیزات هوشمند دیجیتال";
        const pLink = matchedProd ? "/products/" + matchedProd.id : "/products";
        const pPrice = Number(matchedProd?.discount_price || matchedProd?.price || 0);

        if (currentLen < 1200 || String(item.content || "").includes("background:#0f172a")) {
          const deepContent = buildDeepSeoNewsHtml(
            item.title || "تحول فناوری‌های دیجیتال ۲۰۲۶",
            pName,
            pLink,
            pPrice
          );
          await supabaseAdmin
            .from("tech_news")
            .update({
              content: deepContent,
              summary:
                item.summary && item.summary.length > 70
                  ? item.summary
                  : "تحلیل جامع فنی، جدول مقایسه استانداردها، بررسی ارزش خرید و راهنمای تخصصی " +
                    (item.title || pName) +
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

    // ۳. تولید خبر تحلیلی جدید (بدون تکرار تیترهای قبلی)
    const requestedProductId = body.productId || "";
    const requestedCategory = body.category || "";

    const existingTitlesSet = new Set(
      allNews.map((n: any) => String(n.title || "").trim().toLowerCase())
    );

    let targetProd = prods.find((p: any) => String(p.id) === String(requestedProductId));
    if (!targetProd && prods.length > 0) {
      // اولویت با محصولی که هنوز در تیتر اخبار نیامده است
      targetProd =
        prods.find(
          (p: any) =>
            !allNews.some((n: any) =>
              String(n.title || "").includes(String(p.title || "").slice(0, 15))
            )
        ) || prods[allNews.length % prods.length];
    }

    const prodName = targetProd?.title || "گجت‌های هوشمند نسل جدید";
    const prodLink = targetProd ? "/products/" + targetProd.id : "/products";
    const prodPrice = Number(targetProd?.discount_price || targetProd?.price || 0);

    const angleTemplates = [
      {
        cat: "gadgets" as const,
        title: `گزارش تحلیلی رادار فناوری: بررسی مهندسی، جدول مقایسه و ارزش خرید ${prodName}`,
      },
      {
        cat: "hardware" as const,
        title: `کالبدشکافی سخت‌افزاری و استانداردهای نسل جدید در ${prodName}؛ راهنمای تخصصی خریداران`,
      },
      {
        cat: "ai" as const,
        title: `نقش فناوری‌های هوشمند در ارتقای راندمان و تجربه کاربری ${prodName} در سال ۲۰۲۶`,
      },
      {
        cat: "gaming" as const,
        title: `بررسی تخصصی پایداری عملکرد، کیفیت ساخت و راندمان ${prodName} در استفاده‌های سنگین`,
      },
    ];

    const chosenTemplate =
      angleTemplates.find(
        (tpl) => !existingTitlesSet.has(tpl.title.trim().toLowerCase())
      ) || {
        cat: (requestedCategory || "gadgets") as "hardware" | "gadgets" | "ai" | "gaming",
        title: `تحلیل تخصصی فناوری و راهنمای جامع بررسی ${prodName} (گزارش ویژه شماره ${
          allNews.length + 1
        })`,
      };

    const finalCategory = (requestedCategory || chosenTemplate.cat) as
      | "hardware"
      | "gadgets"
      | "ai"
      | "gaming";
    const articleTitle = body.customTopic ? String(body.customTopic).trim() : chosenTemplate.title;

    // بررسی کلید Gemini برای تولید محتوای یونیک در صورت فعال بودن
    let finalHtmlContent = "";
    const siteRow = await getMasterSiteInfoRow();
    const aiCfg = siteRow?.homepage_layout_config?.ai_provider_config || {};
    const apiKey =
      siteRow?.gemini_api_key ||
      aiCfg?.geminiApiKey ||
      aiCfg?.apiKey ||
      process.env.GEMINI_API_KEY ||
      "";

    if (apiKey) {
      try {
        const promptText = `یک گزارش خبری-تحلیلی تخصصی فناوری و سئو شده به زبان فارسی با فرمت HTML (فقط تگ‌های h2, h3, p, ul, li, table, tr, th, td, strong, a) با تیتر «${articleTitle}» بنویس و در آن به محصول «${prodName}» با قیمت ${prodPrice.toLocaleString("fa-IR")} تومان و لینک خرید ${prodLink} در فروشگاه آکسون کور اشاره کن.`;
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
          }
        );
        if (geminiRes.ok) {
          const gJson = await geminiRes.json();
          const candidate = gJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate && candidate.trim().length > 200) {
            finalHtmlContent = candidate
              .replace(/```html/gi, "")
              .replace(/```/g, "")
              .trim();
          }
        }
      } catch {}
    }

    if (!finalHtmlContent) {
      finalHtmlContent = buildDeepSeoNewsHtml(articleTitle, prodName, prodLink, prodPrice);
    }

    const bestImage =
      targetProd?.image && targetProd.image !== "/placeholder.png"
        ? targetProd.image
        : CATEGORY_DEFAULT_IMAGES[finalCategory] || CATEGORY_DEFAULT_IMAGES.gadgets;

    const newHarvestedItem = {
      id: randomUUID(),
      title: articleTitle,
      slug: "tech-radar-" + Date.now(),
      summary:
        "کالبدشکافی تخصصی عملکرد، مقایسه تطبیقی استانداردها، تحلیل راندمان انرژی و راهنمای خرید " +
        prodName +
        " در رادار فناوری آکسون کور.",
      content: finalHtmlContent,
      category: finalCategory,
      source_name: "رادار تحلیلی سئو آکسون",
      image_url: bestImage,
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
        "✓ گزارش خبری تحلیلی و یکتا (همراه با جدول مقایسه، سوالات متداول و لینک محصول) با موفقیت تولید و منتشر شد.",
      data: newHarvestedItem,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}