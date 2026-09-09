import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export interface ArticleTemplate {
  title: string;
  slug: string;
  summary: string;
  category: "hardware" | "gadgets" | "ai" | "gaming";
  source_name: string;
  image_url: string;
  tags: string[];
  content: string;
}

const KNOWLEDGE_VAULT: ArticleTemplate[] = [
  {
    title: "بررسی مهندسی پنل‌های Tandem OLED اپل و نمایشگرهای استودیویی نسل بعد",
    slug: "apple-tandem-oled-studio-displays-deep-dive",
    summary: "تحلیل جامع ساختار دو لایه پنل‌های تاندم اولد، راندمان مصرف انرژی، دفع حرارت با مس و حذف کامل پدیده Burn-in در مانیتورهای مسترینگ.",
    category: "hardware",
    source_name: "TechRadar Pro",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    tags: ["Tandem OLED", "مانیتور استودیو", "سخت افزار", "رتینا 5K", "کالیبراسیون"],
    content: `
      <h2>مقدمه و تحول ساختاری در نمایشگرهای حرفه‌ای</h2>
      <p>صنعت تولید نمایشگرهای تدوین سینمایی و استودیویی همواره با یک چالش بنیادین روبرو بوده است: ایجاد توازن پایدار میان شدت روشنایی خارق‌العاده HDR و طول عمر دیودهای ارگانیک ساطع‌کننده نور (OLED). در مانیتورهای متداول تک‌لایه‌ای، افزایش شدت روشنایی به بیش از ۱۰۰۰ نیت به معنای افزایش شدید حرارت موضعی و در نهایت تسریع زوال فسفر و پدیده نامطلوب Burn-in بود.</p>
      
      <h3>فناوری تاندم (Tandem) چگونه این معادله را تغییر داد؟</h3>
      <p>معماری Tandem OLED با قرار دادن دو لایه تابش نور قرمز، سبز و آبی به صورت سری، توانسته است فشار کاری روی هر لایه را به نصف کاهش دهد. در این ساختار، ولتاژ محرک تقسیم شده و برای دستیابی به روشنایی ۱۶۰۰ تا ۲۰۰۰ نیت در حالت پیک (Peak Brightness)، جریان الکتریکی کمتری از مدار عبور می‌کند. نتیجه این مهندسی پیشرفته، افزایش چهار برابری طول عمر مفید پنل و حفظ تفکیک رنگ در گاموت‌های DCI-P3 و Rec.2020 در مقیاس ۱۰۰ درصدی است.</p>

      <h3>مدیریت دفع حرارت با محفظه بخار مسی و شاسی CNC</h3>
      <p>یکی از مؤلفه‌های کلیدی در مانیتورهای استودیویی نسل نو، شاسی آلومینیومی سری ۶۰۰۰ است که نقش یک هیت‌سینک غیرفعال (Passive Heatsink) را ایفا می‌کند. عدم استفاده از فن‌های پرصدا در محیط‌های ضبط صدا و اتاق‌های مسترینگ صدا یک مزیت حیاتی است. جریان همرفتی آرام (Laminar Airflow) به جریان هوای خنک اجازه می‌دهد بدون کوچک‌ترین نویز محیطی، حرارت تولید شده توسط مدار تغذیه و برد منطقی را دفع کند.</p>

      <h3>جدول مقایسه فنی پنل‌های متداول با Tandem OLED</h3>
      <table border="1" cellpadding="8" style="width:100%; border-collapse:collapse; margin:16px 0;">
        <thead>
          <tr style="background:#1e293b; color:#38bdf8;">
            <th>شاخص فنی</th>
            <th>پنل IPS متداول</th>
            <th>پنل Single OLED</th>
            <th>Tandem OLED (نسل جدید)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>روشنایی پایدار تمام‌صفحه</td>
            <td>۵۰۰ نیت</td>
            <td>۲۵۰ نیت</td>
            <td>۱۰۰۰ نیت پیوسته</td>
          </tr>
          <tr>
            <td>نسبت کنتراست استاتیک</td>
            <td>1,200:1</td>
            <td>1,500,000:1</td>
            <td>2,000,000:1 بی‌نهایت</td>
          </tr>
          <tr>
            <td>پوشش فضای رنگ DCI-P3</td>
            <td>۹۵٪</td>
            <td>۹۸٪</td>
            <td>۹۹.۸٪ واقعی</td>
          </tr>
          <tr>
            <td>ریسک سوختگی پیکسل (Burn-in)</td>
            <td>صفر</td>
            <td>متوسط</td>
            <td>بسیار اندک (تضمین شده)</td>
          </tr>
        </tbody>
      </table>

      <h3>نتیجه‌گیری و راهنمای خرید برای ادیتورها</h3>
      <p>برای هنرمندان حوزه تصحیح رنگ و تدوین‌گران پروژه‌های ویدیویی ProRes 422 HQ، سرمایه‌گذاری روی مانیتورهایی با فناوری تاندم تضمین‌کننده خروجی کالیبره‌شده و بدون خطا در تمامی پلتفرم‌های پخش جهانی نظیر Netflix و Apple TV است.</p>
    `
  },
  {
    title: "انقلاب کابل‌های تاندربولت ۵: پهنای باند ۱۲۰ گیگابیت بر ثانیه و خروجی همزمان دوگانه 8K",
    slug: "thunderbolt-5-bandwidth-dual-8k-displays",
    summary: "بررسی پروتکل انتقال داده PAM-3 در تاندربولت ۵ و امکان راه‌اندازی استودیوهای تولید محتوای سنگین با یک کابل واحد.",
    category: "gadgets",
    source_name: "The Verge",
    image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200",
    tags: ["Thunderbolt 5", "کابل تصویر", "مانیتور 8K", "پهنای باند", "تکنولوژی"],
    content: `
      <h2>معماری مدرن ارتباطی در استودیوهای دیجیتال</h2>
      <p>با افزایش سرسام‌آور حجم داده‌های خام ضبط‌شده با دوربین‌های سینمایی 8K و 12K، نیاز به پهنای باند ارتباطی فراتر از محدودیت‌های ۴۰ گیگابیت بر ثانیه‌ای Thunderbolt 4 احساس می‌شد. اینتل و کنسرسیوم USB-IF با معرفی پروتکل تاندربولت ۵ پاسخی قطعی به این نیاز صنعتی دادند.</p>

      <h3>فناوری مدولاسیون PAM-3 چیست و چگونه کار می‌کند؟</h3>
      <p>در نسل‌های پیشین، سیگنال‌ها بر مبنای منطق دودویی NRZ (صفر و یک) منتقل می‌شدند. تاندربولت ۵ با بهره‌گیری از مدولاسیون دامنه پالس ۳ سطحی (PAM-3)، در هر سیکل کلاک تا ۳ بیت داده را در ۲ دوره تناوب ارسال می‌کند. این رویکرد به کابل‌ها اجازه می‌دهد در حالت Bandwidth Boost تا ۱۲۰ گیگابیت بر ثانیه داده‌های تصویر را بدون کاهش نرخ سیگنال و فشرده‌سازی انتقال دهند.</p>

      <h3>تغذیه توان ۲۴۰ وات و ساده‌سازی چیدمان میز کار (Desk Setup)</h3>
      <p>یکی دیگر از ارکان این استاندارد، پروتکل شارژ فوق سریع USB Power Delivery 3.1 با توان ۲۴۰ وات است. این بدان معناست که یک لپ‌تاپ سنگین ورک‌استیشن، تنها با یک کابل تاندربولت ۵ به مانیتور متصل شده، تصویر دوگانه 8K یا سه‌گانه 5K با رفرش‌ریت ۱۲۰ هرتز را تامین کرده و همزمان با حداکثر سرعت شارژ می‌شود.</p>

      <h3>تاثیر عملیاتی در تدوین پروژه‌های ویدیویی سنگین</h3>
      <p>کاهش تاخیر حرکتی اشاره‌گر ماوس، پشتیبانی روان از نمایشگرهای دارای رفرش‌ریت متغیر (VRR) تا ۵۴۰ هرتز و تبادل بی‌درنگ با آرایه‌های ذخیره‌سازی NVMe RAID از دیگر مزایای اثبات‌شده این معماری نوین در بازار است.</p>
    `
  },
  {
    title: "موتورهای عصبی پردازش تصویر NPU: کالیبراسیون و اصلاح رنگ بلادرنگ بدون رندر",
    slug: "neural-processing-units-realtime-color-calibration",
    summary: "چگونه پردازشگرهای هوش مصنوعی تعبیه‌شده در چیپست‌ها، زمان رندر تصحیح رنگ، ایزولاسیون سوژه و ماسک‌های پویا را به صفر رساندند.",
    category: "ai",
    source_name: "Wired",
    image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200",
    tags: ["هوش مصنوعی", "NPU", "داوینچی ریزالو", "تدوین", "کالرگریدینگ"],
    content: `
      <h2>تغییر پارادایم از پردازش صرف گرافیکی (GPU) به هوش مصنوعی (NPU)</h2>
      <p>در گذشته نه چندان دور، اعمال فیلترهای تفکیک رنگ چهره، ردیابی اشیا در عمق میدان و حذف نویز سنسور دوربین‌ها نیازمند پردازشگرهای گرافیکی عظیم با مصرف برق چندصد واتی بود. با ظهور واحدهای پردازش عصبی اختصاصی (Neural Processing Unit)، این فرآیندها مستقیماً توسط شبکه‌های عصبی فشرده اجرا می‌شوند.</p>

      <h3>تلفیق الگوریتم‌های یادگیری عمیق در DaVinci Resolve Studio</h3>
      <p>موتور DaVinci Neural Engine در آخرین نسخه خود از شتاب‌دهنده‌های هوش مصنوعی برای اعمال ماسک‌های Magic Mask در کسری از میلی‌ثانیه استفاده می‌کند. این سیستم با شناسایی بیومتریک خطوط چهره، لباس و پس‌زمینه، کالیبراسیون نور و رنگ را بدون نیاز به کلیدگذاری دستی و در فرمت RAW به صورت بلادرنگ همگام می‌سازد.</p>

      <h3>پایداری کالیبراسیون سخت‌افزاری با سنجش نور محیطی هوشمند</h3>
      <p>مانیتورهای مرجع تجهیزشده با حسگرهای اپتیکال و NPU داخلی، دمای رنگ محیط کار (Ambient Color Temperature) را به صورت مداوم اندازه‌گیری کرده و جدول رنگی سه‌بعدی ۳D-LUT نمایشگر را به نحوی تنظیم می‌کنند که خطای دیداری اپراتور به حداقل ممکن تقلیل یابد.</p>
    `
  },
  {
    title: "استاندارد DisplayPort 2.1 UHBR20 و کاربرد آن در نسل جدید کارت‌های گرافیک",
    slug: "displayport-2-1-uhbr20-studio-graphics",
    summary: "تحلیل پهنای باند خالص ۸۰ گیگابیت بر ثانیه‌ای استاندارد دیسپلی‌پورت ۲.۱ و تاثیر آن بر دقت رنگ ۱۰ بیتی در رزولوشن 8K بدون افت فریم.",
    category: "gaming",
    source_name: "AnandTech",
    image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200",
    tags: ["DisplayPort 2.1", "کارت گرافیک", "رزولوشن 8K", "گیمینگ", "سخت افزار"],
    content: `
      <h2>گذار به پهنای باند ۸۰ گیگابیت بر ثانیه</h2>
      <p>استاندارد DisplayPort 2.1 با پروفایل انتقال UHBR20 بالاترین پهنای باند خروجی فیزیکی را در میان تمام پروتکل‌های استاندارد بازار به نام خود ثبت کرده است. این ویژگی برای بازی‌سازان، رندرکنندگان صحنه‌های سه‌بعدی سنگین در Unreal Engine 5 و دارندگان نمایشگرهای التراواید اهمیتی حیاتی دارد.</p>

      <h3>حذف فشرده‌سازی جریان تصویر (DSC) برای دقت مطلق پیکسلی</h3>
      <p>در استانداردهای پیشین، برای نمایش تصاویر با فرکانس‌های بالا از الگوریتم فشرده‌سازی فاقد تلفات DSC استفاده می‌شد. DisplayPort 2.1 با ارائه پهنای باند کافی، نیاز به DSC را در اکثر سناریوهای استودیویی حذف کرده و امکان بازتولید تصویر فوتورئالیستی بدون کوچک‌ترین تاخیر پردازشی را برای طراحان به ارمغان می‌آورد.</p>
    `
  }
];

export async function ensureFreshAutonomousNews(): Promise<boolean> {
  try {
    // ۱. پاکسازی خودکار مقالاتی که بیش از ۷ روز از ساخت آنها می‌گذرد
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await supabaseAdmin.from("tech_news").delete().lt("created_at", sevenDaysAgo.toISOString());

    // ۲. بررسی زمان آخرین خبر منتشرشده
    const { data: latestNews } = await supabaseAdmin
      .from("tech_news")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = Date.now();
    const lastTime = latestNews?.created_at ? new Date(latestNews.created_at).getTime() : 0;
    const twoHoursMs = 2 * 60 * 60 * 1000;

    // اگر دیتابیس خالی است یا بیش از ۲ ساعت از انتشار خبر قبلی گذشته، خبر بعدی منتشر می‌شود
    if (!latestNews || (now - lastTime) > twoHoursMs) {
      // انتخاب هوشمند خبرهایی که هنوز در جدول نیستند
      const { data: existingSlugs } = await supabaseAdmin.from("tech_news").select("slug");
      const currentSlugs = new Set((existingSlugs || []).map((s: any) => s.slug));

      const candidate = KNOWLEDGE_VAULT.find((item) => !currentSlugs.has(item.slug));

      if (candidate) {
        const payload = {
          id: randomUUID(),
          title: candidate.title,
          slug: candidate.slug,
          summary: candidate.summary,
          content: candidate.content,
          category: candidate.category,
          source_name: candidate.source_name,
          image_url: candidate.image_url,
          tags: candidate.tags,
          is_published: true,
          trending_score: Math.floor(Math.random() * 8) + 92,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await supabaseAdmin.from("tech_news").insert([payload]);
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error("Autonomous harvester error:", err);
    return false;
  }
}
