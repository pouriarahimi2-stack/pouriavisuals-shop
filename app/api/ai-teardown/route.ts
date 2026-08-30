// File Path: app/api/ai-teardown/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export interface TeardownComponent {
  id: string;
  name: string;
  nameFa: string;
  category: "panel" | "chipset" | "cooling" | "power" | "audio" | "chassis" | "optics";
  depthIndex: number;
  role: string;
  specifications: Record<string, string>;
  engineeringHighlight: string;
  material: string;
  heatResistance?: string;
  svgIcon: string;
}

export interface TeardownData {
  productId: string;
  productTitle: string;
  architectureName: string;
  summary: string;
  totalLayers: number;
  repairabilityScore: number;
  coolingEfficiency: string;
  components: TeardownComponent[];
}

export async function POST(req: NextRequest) {
  try {
    const { productId, productTitle, category } = await req.json();

    if (!productId) {
      return NextResponse.json({ success: false, message: "شناسه کالا الزامی است." }, { status: 400 });
    }

    let productData: any = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", String(productId))
        .maybeSingle();
      productData = data;
    }

    const title = productData?.title || productTitle || "مانیتور و تجهیزات استودیویی";
    let teardownResult: TeardownData | null = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `به عنوان مهندس ارشد سخت‌افزار، کالبدشکافی لایه‌به‌لایه‌ ۶ لایه‌ای (Exploded View Teardown) برای محصول «${title}» تولید کن.
خروجی فقط یک JSON با ساختار معتبر زیر باشد:
{
  "productId": "${productId}",
  "productTitle": "${title}",
  "architectureName": "نام معماری",
  "summary": "خلاصه مهندسی لایه‌ها",
  "totalLayers": 6,
  "repairabilityScore": 9.0,
  "coolingEfficiency": "توضیحات خنک‌کاری",
  "components": [
    {
      "id": "layer-1",
      "name": "Optical Glass",
      "nameFa": "شیشه نوری نانوتکستچر",
      "category": "optics",
      "depthIndex": 1,
      "role": "حذف بازتاب نور",
      "specifications": {"ضریب بازتاب": "۰.۲٪"},
      "engineeringHighlight": "حکاکی نانو",
      "material": "شیشه تقویت‌شده",
      "svgIcon": "glass"
    }
  ]
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
            }),
          }
        );

        const geminiJson = await geminiRes.json();
        const rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          teardownResult = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn("AI Teardown Fallback:", err);
      }
    }

    if (!teardownResult) {
      teardownResult = generateNativeTeardown(productId, title, category || "دیجیتال");
    }

    return NextResponse.json({
      success: true,
      data: teardownResult,
    });
  } catch (error: any) {
    console.error("AI Teardown Route Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

function generateNativeTeardown(id: string, title: string, category: string): TeardownData {
  return {
    productId: id,
    productTitle: title,
    architectureName: "معماری یکپارچه ماژولار با خنک‌کاری فعال و جریان هوای Laminar",
    summary: "ساختار ۶ لایه مهندسی پیشرفته شامل شاسی آلومینیومی CNC، آرایه پنل نوری ۱۰ بیتی، مدار پردازش عصبی تصویر و منبع تغذیه GaN.",
    totalLayers: 6,
    repairabilityScore: 9.0,
    coolingEfficiency: "هیت‌سینک مسی دوطرفه با هدایت حرارتی ۳۸۰ وات بر متر کلوین",
    components: [
      {
        id: "layer-1",
        name: "Nano-Texture Front Optical Glass & Polarizer",
        nameFa: "لایه شیشه نوری نانوتکستچر با فیلتر پولاریزه آنتی‌رفلکت",
        category: "optics",
        depthIndex: 1,
        role: "حذف ۹۹.۴٪ بازتاب‌های محیطی و عبور دقیق طیف نور بدون اعوجاج رنگی",
        specifications: { "پوشش ضدانعکاس": "چند لایه دی‌الکتریک", "ضریب عبور نور": "۹۸.۶٪", "سختی سطحی": "۹H ضدخش" },
        engineeringHighlight: "حکاکی مستقیم شیشه در مقیاس نانومتری جهت جلوگیری از افت کنتراست",
        material: "شیشه سیلیکات تقویت‌شده با پوشش اولئوفوبیک",
        svgIcon: "glass",
      },
      {
        id: "layer-2",
        name: "Active Matrix Mini-LED / OLED Precision Backlight Panel",
        nameFa: "پنل ماتریس فعال Mini-LED با مناطق نوردهی موضعی (FALD)",
        category: "panel",
        depthIndex: 2,
        role: "تولید تصویر با تفکیک رنگ ۱۰ بیتی و شدت روشنایی پایدار ۱۰۰۰ نیت",
        specifications: { "تراکم پیکسلی": "۲۱۸ PPI رتینا", "تعداد دیودها": "بیش از ۱۰,۰۰۰ میکرو LED", "پوشش گاموت": "۱۰۰٪ sRGB و ۹۹٪ DCI-P3" },
        engineeringHighlight: "کنترلر سخت‌افزاری کالیبراسیون با جدول رنگ ۳D LUT داخلی",
        material: "زیرلایه ایندیوم گالیوم زینک اکسید (IGZO)",
        svgIcon: "panel",
      },
      {
        id: "layer-3",
        name: "Main Logic Board & Realtime Image Neural Processor",
        nameFa: "مادربرد اصلی و پردازشگر عصبی تصویر (Neural Display Engine)",
        category: "chipset",
        depthIndex: 3,
        role: "پردازش لحظه‌ای سیگنال‌های ویدیویی، مدیریت رنگ و کنترل پورت‌های تاندربولت",
        specifications: { "پهنای باند ورودی": "۴۰ گیگابیت بر ثانیه (TB4)", "تعداد لایه‌ها": "PCB دوازده لایه با مس ۲ اونسی", "نرخ نوسازی": "تا ۱۲۰ هرتز بلادرنگ" },
        engineeringHighlight: "مدار اختصاصی تبدیل فضای رنگ Rec.709 به Rec.2020 در ۰.۱ میلی‌ثانیه",
        material: "فایبرگلاس گرید نظامی FR-4 با روکش طلای غوطه‌ور ENIG",
        svgIcon: "cpu",
      },
      {
        id: "layer-4",
        name: "Acoustic Chamber with Force-Cancelling Woofers",
        nameFa: "محفظه آکوستیک استودیویی با ووفرهای لغوکننده لرزش",
        category: "audio",
        depthIndex: 4,
        role: "تولید صدای فراگیر سه‌بعدی و بیس عمیق بدون انتقال ارتعاش به پنل تصویر",
        specifications: { "تعداد درایورها": "۶ درایور تفکیک‌شده (۴ ووفر + ۲ توییتر)", "پاسخ فرکانسی": "۴۵ هرتز تا ۲۲ کیلوهرتز", "پشتیبانی": "Spatial Audio با Dolby Atmos" },
        engineeringHighlight: "چیدمان متقارن جفت درایورها جهت خنثی‌سازی کامل گشتاور مکانیکی",
        material: "محفظه رزین کربن فشرده با مگنت‌های نئودیمیوم N52",
        svgIcon: "speaker",
      },
      {
        id: "layer-5",
        name: "High-Efficiency GaN Integrated Power Delivery Subsystem",
        nameFa: "ماژول تغذیه یکپارچه نیترید گالیوم (GaN Power Supply)",
        category: "power",
        depthIndex: 5,
        role: "تامین ولتاژ پایدار با راندمان ۹۶٪ و شارژ همزمان لپ‌تاپ تا ۹۶ وات",
        specifications: { "توان خروجی کلی": "۲۴۰ وات پیوسته", "راندمان مصرف": "۹۶٪ بدون افت در بار بالا", "پروتکل": "محافظت در برابر ولتاژ گذرای ۸ کیلوولت" },
        engineeringHighlight: "کاهش ۶۰ درصدی ابعاد نسبت به منابع تغذیه سیلیکونی متداول",
        material: "نیمه‌هادی‌های توان بالای GaNFast با خازن‌های جامد ژاپنی",
        svgIcon: "power",
      },
      {
        id: "layer-6",
        name: "Unibody CNC Billet Aluminum Structural Chassis & Thermal Frame",
        nameFa: "شاسی یکپارچه آلومینیوم سری ۶۰۰۰ با شبکه خنک‌کاری هدایت حرارتی",
        category: "chassis",
        depthIndex: 6,
        role: "پایداری ساختار فیزیکی، جذب نویز الکترومغناطیسی (EMI) و تخلیه یکنواخت گرما",
        specifications: { "روش ساخت": "تراشکاری تمام اتوماتیک ۵ محوره CNC", "آلیاژ فلز": "آلومینیوم هوافضایی گرید ۶۰۶۳-T6", "جذب حرارت": "دفع یکنواخت تا ۷۰ وات گرما" },
        engineeringHighlight: "سوراخ‌کاری الگوهای آکوستیک لیزری با خطای کمتر از ۰.۰۱ میلی‌متر",
        material: "آلومینیوم بازیافتی ۱۰۰٪ سازگار با محیط زیست",
        svgIcon: "chassis",
      },
    ],
  };
}