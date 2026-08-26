// app/api/ai-teardown/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
    if (supabase) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();
      productData = data;
    }

    const title = productData?.title || productTitle || "کالای دیجیتال تخصصی";

    let teardownResult: TeardownData | null = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `به عنوان مهندس ارشد سخت‌افزار، کالبدشکافی لایه‌به‌لایه ۶ لایه‌ای (Exploded View Teardown) برای محصول «${title}» تولید کن.
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
      "name": "نام انگلیسی قطعه",
      "nameFa": "نام فارسی قطعه",
      "category": "optics",
      "depthIndex": 1,
      "role": "وظیفه قطعه",
      "specifications": {"پارامتر ۱": "مقدار ۱"},
      "engineeringHighlight": "هایلایت مهندسی",
      "material": "جنس متریال",
      "svgIcon": "chip"
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
      teardownResult = generateFallbackTeardown(productId, title, category || "apple");
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

function generateFallbackTeardown(id: string, title: string, category: string): TeardownData {
  const isMac = title.toLowerCase().includes("macbook") || title.includes("مک‌بوک");
  const isWatch = title.toLowerCase().includes("watch") || title.includes("واچ");
  const isIpad = title.toLowerCase().includes("ipad") || title.includes("آیپد");

  if (isMac) {
    return {
      productId: id,
      productTitle: title,
      architectureName: "معماری پردازشی ۳ نانومتری نسل دوم M5 Max با پهنای باند حافظه ۴۰۰GB/s",
      summary: "شاسی یکپارچه آلومینیومی ماشین‌کاری شده با دو فن خنک‌کننده جریان محوری، برد مدار چاپی ۱۲ لایه و پنل Liquid Retina XDR Mini-LED.",
      totalLayers: 6,
      repairabilityScore: 8.5,
      coolingEfficiency: "محفظه تبخیر مسی با دو فن گریز از مرکز و هدایت حرارت گرافنی",
      components: [
        {
          id: "mac-1",
          name: "Liquid Retina XDR Mini-LED Panel (1600 nits Peak)",
          nameFa: "نمایشگر Liquid Retina XDR با ۱۰,۰۰۰ میکرو LED و نرخ نوسازی ۱۲۰Hz ProMotion",
          category: "panel",
          depthIndex: 1,
          role: "تولید رنگ‌های ۱۰ بیتی با پوشش ۱۰۰٪ DCI-P3 و کنتراست ۱,۰۰۰,۰۰۰:۱",
          specifications: { "رزولوشن": "3456x2234 پیکسل", "روشنایی پایدار": "۱۰۰۰ نیت", "تراکم": "۲۵۴ PPI" },
          engineeringHighlight: "کالیبراسیون سخت‌افزاری کارخانه با انحراف رنگی Delta E کمتر از ۰.۳",
          material: "زیرلایه شیشه آلومینوسیلیکات با فیلتر نوری نانو پولاریزه",
          svgIcon: "screen",
        },
        {
          id: "mac-2",
          name: "Apple M5 Max SoC with Integrated 16-Core Neural Engine",
          nameFa: "تراشه یکپارچه Apple M5 Max با پردازشگر عصبی ۱۶ هسته‌ای هوش مصنوعی",
          category: "chipset",
          depthIndex: 2,
          role: "پردازش موازی بلادرنگ، رندرینگ پروژه‌های 8K ProRes و مدل‌های زبانی محلی",
          specifications: { "معماری": "۳ نانومتری نسل دوم", "پهنای باند": "۴۰۰ گیگابایت بر ثانیه", "تعداد ترانزیستور": "۹۲ میلیارد" },
          engineeringHighlight: "حافظه رم یکپارچه (Unified Memory) با تاخیر نزدیک به صفر برای پردازشگر گرافیکی",
          material: "سیلیکون با پکیجینگ سه‌بعدی UltraFusion",
          svgIcon: "cpu",
        },
        {
          id: "mac-3",
          name: "Dual Axial High-Static Pressure Thermal Chamber",
          nameFa: "سیستم خنک‌کاری فعال با دو فن و محفظه تبخیر مسی بازطراحی‌شده",
          category: "cooling",
          depthIndex: 3,
          role: "دفع حرارت پایدار بدون افت فرکانس پردازشی (Zero Thermal Throttling)",
          specifications: { "جریان هوا": "۵۰٪ انتقال حرارت بیشتر", "نویز صوتی": "زیر ۱۸ دسی‌بل در بار کامل" },
          engineeringHighlight: "پره‌های فن با انحنای متغیر جهت شکستن گردابه‌های صوتی هوا",
          material: "آلیاژ مس الکترولیتی با پره‌های پلیمر کریستال مایع",
          svgIcon: "cooling",
        },
        {
          id: "mac-4",
          name: "Six-Speaker Sound System with Force-Cancelling Woofers",
          nameFa: "سیستم صوتی ۶ اسپیکر با ووفرهای دوطرفه خنثی‌کننده لرزش بدنه",
          category: "audio",
          depthIndex: 4,
          role: "پخش صدای استودیویی با پشتیبانی از Spatial Audio و Dolby Atmos",
          specifications: { "پاسخ فرکانسی": "۴۰ هرتز تا ۲۰ کیلوهرتز", "تعداد توییتر": "۲ عدد با دیافراگم ابریشمی" },
          engineeringHighlight: "نصب متقارن مگنت‌ها برای مهار انتقال ارتعاش صوتی به کیبورد و ترک‌پد",
          material: "مگنت‌های نئودیمیومی N52 با محفظه فیبر کربن",
          svgIcon: "speaker",
        },
        {
          id: "mac-5",
          name: "100Wh High-Density 6-Cell Lithium-Polymer Battery",
          nameFa: "باتری ۶ سلولی ۱۰۰ وات‌ساعت با مدیریت هوشمند شارژ و پایش دما",
          category: "power",
          depthIndex: 5,
          role: "شارژدهی تا ۲۲ ساعت پخش مداوم ویدیو و شارژ سریع ۱۴۰ وات MagSafe 3",
          specifications: { "ظرفیت": "۱۰۰ وات‌ساعت (حداکثر مجاز پرواز)", "ولتاژ کاری": "۱۱.۴ ولت" },
          engineeringHighlight: "مدار اختصاصی پایش سلامت سلول‌ها با پالس‌های فرکانسی نانوثانیه‌ای",
          material: "کاتد کبالت با چگالی انرژی ۸۰۰ وات‌ساعت بر لیتر",
          svgIcon: "power",
        },
        {
          id: "mac-6",
          name: "Unibody 100% Recycled Aerospace Aluminum Enclosure",
          nameFa: "بدنه یکپارچه آلومینیوم سری ۶۰۰۰ تراش‌خورده با فرز CNC",
          category: "chassis",
          depthIndex: 6,
          role: "حفاظت فیزیکی قطعات، جذب ارتعاش و سپر سراسری در برابر تداخل الکترومغناطیسی (EMI)",
          specifications: { "فرآیند تولید": "تراشکاری تمام خودکار ۵ محوره", "پوشش سطحی": "آنودایز عمیق ضدجذب اثرانگشت" },
          engineeringHighlight: "سوراخ‌کاری میکرو برای ورودی هوا با لیزر فمتوثانیه",
          material: "۱۰۰٪ آلومینیوم بازیافتی اختصاصی اپل",
          svgIcon: "chassis",
        },
      ],
    };
  }

  if (isWatch) {
    return {
      productId: id,
      productTitle: title,
      architectureName: "بدنه تیتانیوم گرید ۵ با استاندارد غواصی EN13319 و تراشه S10 SiP",
      summary: "طراحی ماژولار مقاوم در برابر نفوذ آب تا عمق ۱۰۰ متر با نمایشگر ۳۰۰۰ نیتی یاقوت کبود و سنسورهای بیومتریک نوری نسل ۴.",
      totalLayers: 6,
      repairabilityScore: 8.0,
      coolingEfficiency: "هدایت حرارتی یکنواخت به پوسته فلزی تیتانیومی",
      components: [
        {
          id: "watch-1",
          name: "Flat Sapphire Crystal Front Display Cover",
          nameFa: "شیشه یاقوت کبود تخت ضدخش با لبه‌های محافظت‌شده تیتانیومی",
          category: "optics",
          depthIndex: 1,
          role: "مقاومت در برابر ضربات سنگین صخره‌نوردی و شفافیت کامل در زیر تابش مستقیم خورشید",
          specifications: { "سختی": "۹ در مقیاس موهس (فقط الماس روی آن خط می‌اندازد)", "پوشش": "ضدبازتاب دوطرفه" },
          engineeringHighlight: "برش با دقت میکرونی برای آب‌بندی کامل در فشار آب ۱۰ اتمسفر",
          material: "یاقوت کبود مصنوعی سنتز شده در دمای ۲۰۰۰ درجه سانتی‌گراد",
          svgIcon: "glass",
        },
        {
          id: "watch-2",
          name: "LTPO OLED 3000-nit Always-On Retina Display",
          nameFa: "نمایشگر LTPO OLED همیشه روشن با شدت روشنایی خیره‌کننده ۳۰۰۰ نیت",
          category: "panel",
          depthIndex: 2,
          role: "نمایش اطلاعات با نرخ تازه‌سازی متغیر از ۱ هرتز تا ۶۰ هرتز جهت بهینه‌سازی باتری",
          specifications: { "روشنایی اوج": "۳۰۰۰ نیت", "حداقل روشنایی": "۱ نیت در تاریکی شب", "رزولوشن": "502x410 پیکسل" },
          engineeringHighlight: "کاهش حاشیه صفحه نمایش تا ۱.۲ میلی‌متر برای حداکثر سطح لمسی",
          material: "دیودهای آلی تابش نور نسل جدید با راندمان مصرفی ارتقایافته",
          svgIcon: "panel",
        },
        {
          id: "watch-3",
          name: "Apple S10 SiP (System in Package) 64-bit Dual-Core",
          nameFa: "پکیج پردازشی یکپارچه S10 SiP با پردازشگر ۴ هسته‌ای هوش مصنوعی روی دستگاه",
          category: "chipset",
          depthIndex: 3,
          role: "اجرای دستیار صوتی آفلاین، ردیابی دقیق حرکات ورزشی و ژست‌های حرکتی Double Tap",
          specifications: { "حافظه داخلی": "۶۴ گیگابایت", "مودم ماهواره‌ای": "اتصال اضطراری ماهواره‌ای L1/L5" },
          engineeringHighlight: "ترکیب بیش از ۴۰ قطعه الکترونیکی در یک ماژول مهروموم شده با رزین اپوکسی",
          material: "سیلیکون با اتصالات طلا و لحیم بدون سرب",
          svgIcon: "cpu",
        },
        {
          id: "watch-4",
          name: "Taptic Engine with Dual Dual-Frequency Precision GPS",
          nameFa: "موتور لرزشی Taptic Engine و آنتن یکپارچه GPS فرکانس دوگانه (L1 + L5)",
          category: "audio",
          depthIndex: 4,
          role: "موقعیت‌یابی فوق‌دقیق در جنگل‌ها و دره‌های شهری و شبیه‌ساز بازخورد لمسی تاج دیجیتال",
          specifications: { "آژیر هشدار": "۸۶ دسی‌بل با برد ۱۸۰ متر", "تعداد میکروفون": "۳ عدد با فیلتر کاهش صدای باد" },
          engineeringHighlight: "آنتن تعبیه‌شده در دور تا دور بزل تیتانیومی بدون نیاز به خطوط پلاستیکی",
          material: "مگنت‌های تنگستن بازیافتی با فنرهای فولادی فنری",
          svgIcon: "speaker",
        },
        {
          id: "watch-5",
          name: "High-Capacity 564mAh Extended Life Battery Cell",
          nameFa: "باتری پرظرفیت ۵۶۴ میلی‌آمپرساعت با قابلیت شارژ سریع مغناطیسی",
          category: "power",
          depthIndex: 5,
          role: "شارژدهی تا ۳۶ ساعت استفاده سنگین و ۷۲ ساعت در حالت Low Power Mode",
          specifications: { "شارژ سریع": "۰ تا ۸۰ درصد در ۴۵ دقیقه", "ظرفیت": "۲.۱۸ وات‌ساعت" },
          engineeringHighlight: "سلول فلزی محصور با ایمنی بالا در برابر تغییرات ناگهانی فشار جوی",
          material: "لیتیوم یون با آند گرافیت-سیلیکون",
          svgIcon: "power",
        },
        {
          id: "watch-6",
          name: "Grade 5 Aerospace Titanium Rugged Case & Ceramic Back",
          nameFa: "کیس مقاوم تیتانیوم گرید ۵ هوانوردی با سرامیک زیرین و سنسورهای بیومتریک",
          category: "chassis",
          depthIndex: 6,
          role: "محافظت کامل در برابر شوک، سنجش ECG، دمای مچ دست و عمق‌سنج تا ۴۰ متر",
          specifications: { "استاندارد نظامی": "MIL-STD-810H", "وزن کیس": "۶۱.۴ گرم", "سنسورها": "اکسیژن خون + ژیروسکوپ" },
          engineeringHighlight: "لبه‌های برآمده قاب تیتانیومی برای جلوگیری از برخورد اجسام با شیشه",
          material: "آلیاژ تیتانیوم Ti-6Al-4V با قاب پشتی سرامیک زیرکونیا و یاقوت",
          svgIcon: "chassis",
        },
      ],
    };
  }

  // پیش‌فرض برای iPad Pro
  return {
    productId: id,
    productTitle: title,
    architectureName: "طراحی فوق باریک ۵.۱ میلی‌متری با پردازنده M5 و نمایشگر تاندم اولد (Ultra Retina XDR)",
    summary: "باریک‌ترین دستگاه تاریخ اپل با دو پنل اولد روی هم قرار گرفته برای روشنایی ۱۶۰۰ نیت، برد فشرده مرکزی و ردیف باتری‌های دوقلو.",
    totalLayers: 6,
    repairabilityScore: 8.8,
    coolingEfficiency: "ورقه‌های گرافیت با رسانایی حرارتی فوق‌بالا و لوگوی مسی دفع گرما",
    components: [
      {
        id: "ipad-1",
        name: "Tandem OLED Ultra Retina XDR Display Glass",
        nameFa: "نمایشگر تاندم اولد (Tandem OLED) با دولایه دیود نوری و شیشه نانوتکستچر",
        category: "panel",
        depthIndex: 1,
        role: "ترکیب نور دو لایه OLED برای دستیابی به روشنایی خیره‌کننده ۱۰۰۰ نیت تمام‌صفحه و ۱۶۰۰ نیت HDR",
        specifications: { "کنتراست": "۲,۰۰۰,۰۰۰:۱", "نرخ نوسازی": "۱۰ تا ۱۲۰ هرتز ProMotion", "رزولوشن": "2752x2064 پیکسل" },
        engineeringHighlight: "طول عمر دو برابری نسبت به پنل‌های تک لایه OLED بدون مشکل پیکسل سوختگی",
        material: "شیشه شیمایی تقویت‌شده با دو لایه ساطع‌کننده ارگانیک Tandem",
        svgIcon: "panel",
      },
      {
        id: "ipad-2",
        name: "Apple M5 SoC with Next-Gen Neural Acceleration Engine",
        nameFa: "پردازنده پرچمدار Apple M5 با موتور شتاب‌دهنده سخت‌افزاری رهگیری پرتو (Ray Tracing)",
        category: "chipset",
        depthIndex: 2,
        role: "اجرای نرم‌افزارهای سنگین مدل‌سازی سه‌بعدی، تدوین ویدیوی ProRes 4K و رندرینگ انیمیشن",
        specifications: { "تعداد هسته‌ها": "۱۰ هسته پردازشی + ۱۰ هسته گرافیکی", "پهنای باند": "۱۵۰ گیگابایت بر ثانیه" },
        engineeringHighlight: "انرژی مصرفی بهینه‌تر به میزان ۴۰٪ نسبت به تراشه‌های لپ‌تاپی هم‌رده",
        material: "سیلیکون ۳ نانومتری پیشرفته TSMC با روکش هدایت حرارتی نانوکربن",
        svgIcon: "cpu",
      },
      {
        id: "ipad-3",
        name: "Central Thermal Dissipation Plate with Copper Apple Logo",
        nameFa: "صفحه مرکزی دفع حرارت گرافنی متصل به لوگوی مسی پشت بدنه",
        category: "cooling",
        depthIndex: 3,
        role: "انتقال حرارت بدون فن از روی پردازنده به کل بدنه فلزی جهت کارایی بی‌صدا و پایدار",
        specifications: { "انتقال حرارت": "۲۰٪ بهبود نسبت به نسل قبل", "ضخامت لایه": "۰.۲ میلی‌متر" },
        engineeringHighlight: "استفاده از لوگوی اپل در پشت دستگاه به عنوان هیت‌سینک غیرفعال حرارتی",
        material: "ورقه‌های گرافیت سنتتیک با فویل مس اکسیژن‌زدایی‌شده",
        svgIcon: "cooling",
      },
      {
        id: "ipad-4",
        name: "Four-Speaker Studio Audio Array with 4 Studio-Quality Mics",
        nameFa: "آرایه ۴ اسپیکر محیطی به همراه ۴ میکروفون با کیفیت ضبط استودیو",
        category: "audio",
        depthIndex: 4,
        role: "صدای تفکیک‌شده چهارکاناله با تفکیک دقیق فرکانس‌های بم و کلام شفاف",
        specifications: { "ووفرها": "۴ ووفر با دامنه نوسان بالا", "میکروفون": "حذف نویز محیطی هوشمند با هوش مصنوعی" },
        engineeringHighlight: "تغییر خودکار کانال‌های چپ و راست متناسب با چرخش افقی یا عمودی تبلت",
        material: "دیافراگم‌های کامپوزیت پلیمری با مگنت‌های نئودیمیوم",
        svgIcon: "speaker",
      },
      {
        id: "ipad-5",
        name: "38.99Wh Dual-Cell Split Lithium-Polymer Battery Pack",
        nameFa: "پک باتری دوقلوی ۳۸.۹۹ وات‌ساعت با توزیع متقارن وزن",
        category: "power",
        depthIndex: 5,
        role: "تامین انرژی تا ۱۰ ساعت وبگردی و کار با وای‌فای و پشتیبانی از شارژ سریع تاندربولت",
        specifications: { "ظرفیت": "۳۸.۹۹ وات‌ساعت", "درگاه": "Thunderbolt / USB 4 با سرعت ۴۰Gbps" },
        engineeringHighlight: "تقسیم باتری به دو سلول جداگانه در دو طرف برد مرکزی برای تعادل بی‌نقص در دست",
        material: "سلول‌های پلیمر لیتیوم با چسب‌های کششی با قابلیت تعویض آسان",
        svgIcon: "power",
      },
      {
        id: "ipad-6",
        name: "5.1mm Ultra-Thin 100% Recycled Aluminum Enclosure",
        nameFa: "بدنه آلومینیومی فوق‌باریک ۵.۱ میلی‌متری با ساختار تقویت‌شده ضدخمش",
        category: "chassis",
        depthIndex: 6,
        role: "ارائه بالاترین استحکام سازه‌ای در نازک‌ترین ضخامت ممکن و اتصال مغناطیسی قلم و کیبورد",
        specifications: { "ضخامت بدنه": "فقط ۵.۱ میلی‌متر", "مگنت‌ها": "بیش از ۸۰ آهنربای تراز داخلی" },
        engineeringHighlight: "اضافه شدن ستون فقرات فلزی مرکزی (Central Rib) برای افزایش صلبیت و مقاومت در برابر خمش",
        material: "آلومینیوم سری ۶۰۰۰ آلیاژی بازیافتی با عملیات حرارتی T6",
        svgIcon: "chassis",
      },
    ],
  };
}