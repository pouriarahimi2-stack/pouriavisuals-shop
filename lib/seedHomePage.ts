import { supabaseAdmin } from "@/lib/supabaseServer";

export async function seedHomePageIfMissing() {
  try {
    const { data: existing } = await supabaseAdmin
      .from("modular_pages")
      .select("id, blocks")
      .eq("slug", "home")
      .maybeSingle();

    if (!existing || !existing.blocks || existing.blocks.length === 0) {
      const defaultBlocks = [
        {
          id: "blk_home_header",
          type: "header_nav",
          title: "هدر و نوبار سراسری سایت",
          isVisible: true,
          styles: { paddingY: 4, maxWidth: "7xl", bgColor: "#0f172a", textColor: "#ffffff" },
          data: {
            brandName: "AXON CORE",
            logoText: "آکسون استودیو",
            navLinks: [
              { label: "صفحه اصلی", url: "/" },
              { label: "محصولات", url: "/products" },
              { label: "اخبار فناوری", url: "/news" },
              { label: "مجله تخصصی", url: "/blog" },
              { label: "تماس و مشاوره", url: "/contact" }
            ],
            ctaButtonText: "ورود به کاتالوگ",
            ctaButtonUrl: "/products"
          }
        },
        {
          id: "blk_home_hero",
          type: "hero_banner",
          title: "هیرو بنر بزرگ صفحه اصلی",
          isVisible: true,
          styles: { paddingY: 16, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff", textAlign: "center" },
          data: {
            badge: "🚀 مرجع تخصصی مانیتورهای ۵K و استودیو",
            headline: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
            subheadline: "تأمین، واردات و کالیبراسیون سخت‌افزاری مانیتورهای استودیویی Apple و LG با ۱۸ ماه گارانتی طلایی.",
            primaryBtnText: "خرید مانیتورهای استودیو",
            primaryBtnUrl: "/products",
            secondaryBtnText: "درخواست مشاوره فنی",
            secondaryBtnUrl: "/contact",
            imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200"
          }
        },
        {
          id: "blk_home_features",
          type: "features_grid",
          title: "گرید مزایای رقابتی آکسون",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#090d16", textColor: "#ffffff" },
          data: {
            heading: "چرا حرفه‌ای‌های تدوین آکسون را برمی‌گزینند؟",
            items: [
              { icon: "🛡️", title: "گارانتی طلایی تعویض", desc: "۱۸ ماه پوشش جامع تعویض بی قید و شرط برای تمامی نمایشگرهای مرجع." },
              { icon: "⚡", title: "کالیبراسیون ۳D LUT", desc: "تراز رنگ پایدار با گاموت‌های سینمایی DCI-P3 و Rec.2020 قبل از تحویل." },
              { icon: "📦", title: "بسته‌بندی گرید هوانوردی", desc: "محافظت کامل فیزیکی در برابر تکانه‌ها و ارتعاشات حمل‌ونقل." }
            ]
          }
        },
        {
          id: "blk_home_products",
          type: "product_showcase",
          title: "ویترین کالاهای پرچمدار استودیو",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff" },
          data: {
            heading: "پرفروش‌ترین مانیتورها و تجهیزات تصویر",
            viewAllText: "مشاهده تمام کالاها ←",
            viewAllUrl: "/products"
          }
        },
        {
          id: "blk_home_faq",
          type: "accordion_faq",
          title: "پرسش‌های متداول (FAQ)",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "5xl", bgColor: "#0b0f19", textColor: "#ffffff" },
          data: {
            heading: "پرسش‌های پرتکرار مشتریان",
            questions: [
              { q: "آیا مانیتورها دارای گارانتی تعویض هستند؟", a: "بله، تمام مانیتورهای ۵K دارای ۱۸ ماه گارانتی طلایی تعویض بی قید و شرط می‌باشند." },
              { q: "امکان تست حضوری و بررسی کالیبراسیون وجود دارد؟", a: "بله، در استودیوی شیراز با هماهنگی قبلی می‌توانید کیفیت رنگ پنل‌ها را از نزدیک ارزیابی کنید." }
            ]
          }
        },
        {
          id: "blk_home_cta",
          type: "cta_banner",
          title: "فراخوان عمل و کمپین مشاوره",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#1e1b4b", textColor: "#ffffff", textAlign: "center" },
          data: {
            title: "به یک مشاوره تخصصی برای استودیوی خود نیاز دارید؟",
            subtitle: "کارشناسان فنی آکسون شما را در انتخاب کابل تاندربولت، مانیتور و پایه هیدرولیک یاری می‌کنند.",
            btnText: "ثبت تیکت مشاوره آنلاین",
            btnUrl: "/contact"
          }
        },
        {
          id: "blk_home_footer",
          type: "footer_block",
          title: "فوتر سراسری سایت",
          isVisible: true,
          styles: { paddingY: 8, maxWidth: "7xl", bgColor: "#020617", textColor: "#94a3b8" },
          data: {
            copyrightText: "تمامی حقوق مادی و معنوی برای آکسون استودیو محفوظ است © 2026",
            supportPhone: "09376110200"
          }
        }
      ];

      const payload = {
        id: existing?.id || "page_home_root",
        slug: "home",
        title: "صفحه اصلی وب‌سایت",
        meta_description: "مرجع تخصصی مانیتورهای ۵K و تجهیزات تصویر آکسون با گارانتی طلایی",
        blocks: defaultBlocks,
        is_published: true,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        await supabaseAdmin.from("modular_pages").update(payload).eq("id", existing.id);
      } else {
        payload["created_at"] = new Date().toISOString();
        await supabaseAdmin.from("modular_pages").insert([payload]);
      }
    }
  } catch (err) {
    console.warn("seedHomePage notice:", err);
  }
}
