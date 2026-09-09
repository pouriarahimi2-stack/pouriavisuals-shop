import { supabaseAdmin } from "@/lib/supabaseServer";

export async function seedHomePageIfMissing() {
  try {
    const { data: existing } = await supabaseAdmin
      .from("modular_pages")
      .select("id")
      .eq("slug", "home")
      .maybeSingle();

    if (!existing) {
      const defaultBlocks = [
        {
          id: "blk_home_header",
          type: "header_nav",
          title: "هدر و نوبار سراسری",
          isVisible: true,
          styles: { paddingY: 4, maxWidth: "7xl", bgColor: "#0f172a", textColor: "#ffffff" },
          data: {
            brandName: "AXON CORE",
            logoText: "آکسون استودیو",
            navLinks: [
              { label: "صفحه اصلی", url: "/" },
              { label: "محصولات", url: "/products" },
              { label: "اخبار فناوری", url: "/news" },
              { label: "ارتباط با ما", url: "/contact" }
            ],
            ctaButtonText: "مشاهده کاتالوگ",
            ctaButtonUrl: "/products"
          }
        },
        {
          id: "blk_home_hero",
          type: "hero_banner",
          title: "هیرو بنر صفحه اصلی",
          isVisible: true,
          styles: { paddingY: 16, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff", textAlign: "center" },
          data: {
            badge: "🚀 مرجع تخصصی مانیتورهای ۵K و استودیو",
            headline: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
            subheadline: "تأمین مستقیم مانیتورهای مسترینگ، پنل‌های Tandem OLED و اتصالات پهنای باند بالای تاندربولت ۵.",
            primaryBtnText: "خرید مانیتورهای استودیو",
            primaryBtnUrl: "/products",
            secondaryBtnText: "مشاوره فنی با کارشناس",
            secondaryBtnUrl: "/contact",
            imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200"
          }
        },
        {
          id: "blk_home_features",
          type: "features_grid",
          title: "گرید مزایای آکسون",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#090d16", textColor: "#ffffff" },
          data: {
            heading: "استانداردهای مهندسی تجهیزات در آکسون",
            items: [
              { icon: "🛡️", title: "گارانتی طلایی تعویض", desc: "۱۸ ماه پوشش جامع تعویض بی قید و شرط برای تمامی نمایشگرهای مرجع." },
              { icon: "⚡", title: "کالیبراسیون ۳D LUT", desc: "تراز رنگ پایدار با گاموت‌های سینمایی DCI-P3 و Rec.2020 قبل از تحویل." },
              { icon: "📦", title: "بسته‌بندی گرید هوانوردی", desc: "محافظت کامل فیزیکی در برابر تکانه‌ها و ارتعاشات حمل‌ونقل." }
            ]
          }
        },
        {
          id: "blk_home_cta",
          type: "cta_banner",
          title: "کمپین فراخوان مشاوره",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#1e1b4b", textColor: "#ffffff", textAlign: "center" },
          data: {
            title: "آیا برای چیدمان میز تدوین خود نیاز به راهنمایی دارید؟",
            subtitle: "کارشناسان آکسون متناسب با نرم‌افزار کاری شما (Premiere، DaVinci یا Final Cut) بهترین مانیتور را پیشنهاد می‌دهند.",
            btnText: "شروع مشاوره رایگان",
            btnUrl: "/contact"
          }
        },
        {
          id: "blk_home_footer",
          type: "footer_block",
          title: "فوتر صفحه اصلی",
          isVisible: true,
          styles: { paddingY: 8, maxWidth: "7xl", bgColor: "#020617", textColor: "#94a3b8" },
          data: {
            copyrightText: "تمامی حقوق محفوظ است © 2026 آکسون استودیو",
            supportPhone: "09376110200"
          }
        }
      ];

      await supabaseAdmin.from("modular_pages").insert([{
        id: "page_home_root",
        slug: "home",
        title: "صفحه اصلی وب‌سایت",
        meta_description: "مرجع تخصصی مانیتورهای ۵K و تجهیزات تصویر آکسون",
        blocks: defaultBlocks,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    }
  } catch (e) {
    console.error("Error seeding home page:", e);
  }
}
