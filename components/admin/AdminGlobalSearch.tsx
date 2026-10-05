"use client";
// File Path: components/admin/AdminGlobalSearch.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

interface StaticSearchTarget {
  id: string;
  moduleKey: string;
  category: "menu" | "setting";
  categoryLabel: string;
  title: string;
  subtitle: string;
  keywords: string[];
  href: string;
  superAdminOnly?: boolean;
}

// بانک جامع تمام منوها، زیربخش‌ها و تک‌تک تنظیمات داخل پنل مدیریت
const ADMIN_MASTER_INDEX: StaticSearchTarget[] = [
  {
    id: "nav_dashboard",
    moduleKey: "dashboard",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "📊 داشبورد تحلیلی و فرماندهی",
    subtitle: "نمای کلی آمار فروش، وضعیت سلامت سرور، سفارشات اخیر و موجودی انبار",
    keywords: ["داشبورد", "آمار", "فروش", "سلامت", "فرماندهی", "خانه", "dashboard", "stats"],
    href: "/admin/dashboard",
  },
  {
    id: "nav_products",
    moduleKey: "products",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "🛍️ مدیریت کاتالوگ محصولات و قیمت‌ها",
    subtitle: "افزودن محصول جدید، ویرایش قیمت، تخفیف، تصاویر، مشخصات فنی و خروجی اکسل/ترب",
    keywords: [
      "محصولات",
      "کالا",
      "کاتالوگ",
      "افزودن محصول",
      "قیمت",
      "مشخصات فنی",
      "گارانتی",
      "اکسل",
      "ایمپورت",
      "ترب",
      "products",
      "torob",
    ],
    href: "/admin/products",
  },
  {
    id: "nav_inventory",
    moduleKey: "inventory",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "🏛️ حسابداری، انبارداری و موجودی کالا",
    subtitle: "مدیریت موجودی انبار، بهای خرید، محاسبه سود خالص، مالیات ۱۰٪ و اسناد انبارگردانی",
    keywords: [
      "انبار",
      "انبارداری",
      "موجودی",
      "حسابداری",
      "بهای خرید",
      "قیمت خرید",
      "سود خالص",
      "حاشیه سود",
      "تامین کننده",
      "کاردکس",
      "inventory",
      "accounting",
      "stock",
    ],
    href: "/admin/inventory",
  },
  {
    id: "nav_orders",
    moduleKey: "orders",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "📦 مدیریت سفارشات، فاکتورها و کد رهگیری پستی",
    subtitle: "بررسی سفارشات مشتریان، تغییر وضعیت، ثبت کد رهگیری پست پیشتاز و چاپ بارنامه",
    keywords: [
      "سفارشات",
      "سفارش",
      "فاکتور",
      "بارنامه",
      "کد رهگیری",
      "پست پیشتاز",
      "ارسال مرسوله",
      "تراکنش",
      "زرین پال",
      "orders",
      "tracking",
    ],
    href: "/admin/orders",
  },
  {
    id: "nav_financial",
    moduleKey: "financial",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "💳 امور مالی و ترازنامه حسابداری",
    subtitle: "بررسی درآمد ناخالص، مالیات بر ارزش افزوده، سود ماهانه و ارزش ریالی انبار",
    keywords: ["مالی", "ترازنامه", "درآمد", "گردش مالی", "سود", "زیان", "financial"],
    href: "/admin/financial",
  },
  {
    id: "nav_reports",
    moduleKey: "reports",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "📈 گزارش‌های مالی و آمار پرفروش‌ترین کالاها",
    subtitle: "گزارش تحلیلی فروش ماهانه، نرخ موفقیت سفارشات و کالاهای رو به اتمام",
    keywords: ["گزارش", "گزارشات", "آمار فروش", "پرفروش", "تحلیل", "reports"],
    href: "/admin/reports",
  },
  {
    id: "nav_customers",
    moduleKey: "customers",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "👥 باشگاه مشتریان (CRM)، سرنخ‌ها و ارسال پیامک",
    subtitle: "لیست مشتریان وفادار (VIP)، سوابق خرید، مخاطبان ثبت‌شده و پنل ارسال اس‌ام‌اس",
    keywords: [
      "مشتریان",
      "مشتری",
      "باشگاه مشتریان",
      "سی آر ام",
      "سرنخ",
      "پیامک",
      "اس ام اس",
      "تلفن",
      "crm",
      "customers",
      "sms",
    ],
    href: "/admin/customers",
  },
  {
    id: "nav_coupons",
    moduleKey: "coupons",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "🏷️ کدهای تخفیف زمان‌دار و کمپین‌های جشنواره",
    subtitle: "تعریف کوپن درصدی یا نقدی روی کل سایت، دسته‌بندی یا کالای خاص + انتشار در هدر",
    keywords: [
      "تخفیف",
      "کد تخفیف",
      "کوپن",
      "جشنواره",
      "کمپین",
      "هدیه",
      "درصد تخفیف",
      "coupons",
      "discount",
    ],
    href: "/admin/coupons",
  },
  {
    id: "nav_messages",
    moduleKey: "messages",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "💬 گفتگوی زنده بلادرنگ (Live Support) و تیکت‌ها",
    subtitle: "پاسخگویی زنده به چت کاربران، مشاهده فایل‌ها و لینک‌های ارسالی و تیکت‌های تماس",
    keywords: [
      "گفتگوی زنده",
      "چت",
      "چت زنده",
      "پشتیبانی آنلاین",
      "تیکت",
      "پیام",
      "مخاطب",
      "live chat",
      "messages",
      "support",
    ],
    href: "/admin/messages",
  },
  {
    id: "nav_styles_bg",
    moduleKey: "styles",
    category: "setting",
    categoryLabel: "⚙️️ تنظیمات ظاهر و پس‌زمینه",
    title: "🖼️ استودیوی پس‌زمینه سراسری سایت (عکس، GIF، SVG و انیمیشن)",
    subtitle: "قرار دادن عکس، گیف متحرک، SVG و ویدیو در بکگراند کل سایت + تنظیم شفافیت و بلور",
    keywords: [
      "پس زمینه",
      "بکگراند",
      "بک گراند",
      "عکس پس زمینه",
      "گیف",
      "تصویر متحرک",
      "انیمیشن",
      "بلور",
      "شفافیت",
      "background",
      "gif",
      "svg",
      "wallpaper",
    ],
    href: "/admin/styles",
  },
  {
    id: "nav_styles_font",
    moduleKey: "styles",
    category: "setting",
    categoryLabel: "⚙️ تنظیمات ظاهر و فونت",
    title: "✨ هویت بصری، فونت‌های فارسی، رنگ سازمانی و Custom CSS",
    subtitle: "تغییر فونت سایت (وزیرمتن، ایران‌سنس، یکان‌بخ، دانا)، رنگ اصلی و کدهای CSS",
    keywords: [
      "فونت",
      "تایپوگرافی",
      "وزیرمتن",
      "ایران سنس",
      "یکان بخ",
      "دانا",
      "رنگ",
      "استایل",
      "سی اس اس",
      "font",
      "css",
      "styles",
    ],
    href: "/admin/styles",
  },
  {
    id: "nav_appearance",
    moduleKey: "appearance",
    category: "setting",
    categoryLabel: "⚙️ تنظیمات ویترین و قالب",
    title: "🎨 استودیوی طراحی ظاهر، هدر، لوگو، فوتر و چیدمان ویترین",
    subtitle: "تغییر لوگوی سایت، متن نوار اعلان بالای هدر، اطلاعات تماس فوتر و بخش‌های صفحه اول",
    keywords: [
      "ظاهر",
      "هدر",
      "فوتر",
      "لوگو",
      "آرم",
      "نوار اعلان",
      "تلفن تماس",
      "آدرس",
      "شبکه های اجتماعی",
      "اینستاگرام",
      "تلگرام",
      "اینماد",
      "appearance",
      "header",
      "footer",
      "logo",
    ],
    href: "/admin/appearance",
  },
  {
    id: "nav_menu",
    moduleKey: "menu",
    category: "setting",
    categoryLabel: "⚙️ تنظیمات منو و دسته‌بندی",
    title: "🧭 مدیریت منوهای درختی و دسته‌بندی‌های ناوبری",
    subtitle: "ایجاد و ویرایش منوهای هدر، زیرمنوها و دسته‌بندی‌های محصولات فروشگاه",
    keywords: ["منو", "منوی درختی", "زیرمنو", "دسته بندی", "ناوبری", "لینک های هدر", "menu", "categories"],
    href: "/admin/menu",
  },
  {
    id: "nav_pages",
    moduleKey: "pages",
    category: "setting",
    categoryLabel: "⚙️ صفحه‌ساز ماژولار",
    title: "⚡ صفحه‌ساز بصری و ماژولار (Page Builder)",
    subtitle: "طراحی صفحات سفارشی و لندینگ‌‌پیج‌ها با بلوک‌های آماده",
    keywords: ["صفحه ساز", "ماژولار", "صفحات", "لندینگ", "المنتور", "پاک", "pages", "builder", "puck"],
    href: "/admin/pages",
  },
  {
    id: "nav_banners",
    moduleKey: "banners",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "🖼️ مدیریت بنرهای تبلیغاتی و اسلایدر صفحه اصلی",
    subtitle: "آپلود بنرهای اسلایدر، تنظیم لینک هدف، متن دکمه (CTA) و نمایش در موبایل/دسکتاپ",
    keywords: ["بنر", "بنرها", "اسلایدر", "تصاویر صفحه اصلی", "تبلیغات", "banners", "slider"],
    href: "/admin/banners",
  },
  {
    id: "nav_seo",
    moduleKey: "seo",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "🚀 دستیار تخصصی سئو، متاتگ‌ها و اتوپایلوت گوگل",
    subtitle: "اسکن سلامت سئو، بهینه‌سازی ۱-کلیکی Meta Title و Meta Description و نقشه سایت",
    keywords: [
      "سئو",
      "متاتگ",
      "گوگل",
      "عنوان سئو",
      "توضیحات متا",
      "سایت مپ",
      "اتوپایلوت",
      "seo",
      "meta",
      "sitemap",
    ],
    href: "/admin/seo",
  },
  {
    id: "nav_blog",
    moduleKey: "blog",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "📚 مجله و مقالات سئو (متصل به محصولات)",
    subtitle: "نگارش و انتشار مقالات تخصصی، راهنمای خرید و اتصال مقاله به کالا",
    keywords: ["وبلاگ", "مقاله", "مقالات", "مجله", "پست", "تولید محتوا", "blog", "posts"],
    href: "/admin/blog",
  },
  {
    id: "nav_news",
    moduleKey: "news",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "📡 رادار اخبار فناوری و تکنولوژی",
    subtitle: "دریافت خودکار و مدیریت جدیدترین اخبار دنیای تکنولوژی",
    keywords: ["اخبار", "خبر", "رادار اخبار", "تکنولوژی", "فناوری", "news"],
    href: "/admin/news",
  },
  {
    id: "nav_reviews",
    moduleKey: "reviews",
    category: "menu",
    categoryLabel: "🧭 منوی اصلی پنل",
    title: "⭐ مدیریت دیدگاه‌ها، امتیازات و نظرات خریداران",
    subtitle: "تایید انتشار نظرات کاربران در صفحات محصول و ثبت پاسخ رسمی مدیریت",
    keywords: ["دیدگاه", "نظرات", "کامنت", "امتیاز", "رضایت", "پاسخ به نظر", "reviews", "comments"],
    href: "/admin/reviews",
  },
  {
    id: "nav_settings_global",
    moduleKey: "settings",
    category: "setting",
    categoryLabel: "⚙️ تنظیمات کلان سیستم",
    title: "⚙️ تنظیمات مالیات (VAT)، هزینه ارسال پستی، تعمیرات و NoIndex",
    subtitle: "تنظیم درصد مالیات بر ارزش افزوده، سقف ارسال رایگان، حالت تعمیرات و دسترسی ربات‌های گوگل",
    keywords: [
      "تنظیمات",
      "مالیات",
      "ارزش افزوده",
      "هزینه ارسال",
      "ارسال رایگان",
      "حالت تعمیرات",
      "در دست تعمیر",
      "ایندکس گوگل",
      "روبات",
      "settings",
      "vat",
      "shipping",
      "maintenance",
      "noindex",
    ],
    href: "/admin/settings",
  },
  {
    id: "nav_roles",
    moduleKey: "roles",
    category: "setting",
    categoryLabel: "🛡️ امنیت و دسترسی مدیران",
    title: "🛡️️ مدیریت مدیران، نقش‌های سازمانی، ماتریس دسترسی (RBAC) و تم پنل",
    subtitle: "تعریف زیرمجموعه جدید، محدود کردن منوها، قفل نقش بیننده و تغییر تم تیره/روشن هر نقش",
    keywords: [
      "نقش ها",
      "مدیران",
      "زیرمجموعه",
      "دسترسی",
      "مجوزها",
      "بیننده",
      "تم روشن",
      "تم تیره",
      "دارک مود",
      "roles",
      "permissions",
      "rbac",
      "users",
    ],
    href: "/admin/roles",
    superAdminOnly: true,
  },
  {
    id: "nav_monitoring",
    moduleKey: "monitoring",
    category: "setting",
    categoryLabel: "🛡️ امنیت و نظارت ارشد",
    title: "👁️‍🗨️ رادار نظارت بلادرنگ (WebSocket) بر عملکرد زیرمجموعه‌ها",
    subtitle: "مشاهده زنده افراد آنلاین، تب فعلی، آخرین کلیک، جستجوها، آی‌پی، مرورگر و سیستم‌عامل زیرمجموعه‌ها",
    keywords: [
      "نظارت",
      "مانیتورینگ",
      "رادار نظارت",
      "افراد آنلاین",
      "عملکرد مدیران",
      "ردیابی",
      "آی پی",
      "monitoring",
      "live radar",
    ],
    href: "/admin/monitoring",
    superAdminOnly: true,
  },
  {
    id: "nav_change_pin",
    moduleKey: "change_pin",
    category: "setting",
    categoryLabel: "🔐 امنیت حساب کاربری",
    title: "🔐 تغییر رمز عبور و پین امنیتی مدیران",
    subtitle: "تغییر رمز عبور اختصاصی حساب فعلی یا تغییر رمز سایر زیرمجموعه‌ها توسط مدیر ارشد",
    keywords: ["تغییر رمز", "پسورد", "کلمه عبور", "پین", "رمز امنیتی", "password", "pin"],
    href: "/admin/change-pin",
  },
  {
    id: "nav_audit_logs",
    moduleKey: "audit_logs",
    category: "setting",
    categoryLabel: "🛡️ امنیت و لاگ‌ها",
    title: "🚨 دفتر کل وقایع امنیتی و اسکنر هوشمند (Audit Logs & Auto-Fix)",
    subtitle: "مشاهده لاگ‌های سیستم، آدرس‌های IP، ضریب امنیت و تعمیر خودکار رکوردها",
    keywords: ["لاگ", "وقایع امنیتی", "اسکنر", "امنیت", "آی پی", "audit", "logs", "security"],
    href: "/admin/audit-logs",
  },
  {
    id: "nav_backup",
    moduleKey: "backup",
    category: "setting",
    categoryLabel: "💾 دیتابیس و پشتیبان‌گیری",
    title: "💾 مرکز بکاپ خودکار روزانه شماره‌دار و بازیابی کامل دیتابیس",
    subtitle: "دانلود مستقیم فایل پشتیبان JSON کل جداول سایت و بازیابی ۱-کلیکی اطلاعات",
    keywords: ["بکاپ", "پشتیبان", "پشتیبان گیری", "بازیابی", "ریستور", "دیتابیس", "backup", "restore", "json"],
    href: "/admin/backup",
  },
];

export function AdminGlobalSearch({
  userRole = "superadmin",
  userPermissions = ["all"],
}: {
  userRole?: string;
  userPermissions?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname() || "";

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [dbResults, setDbResults] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const isSuperAdmin = userRole === "superadmin";

  // فیلتر کردن منوها و تنظیمات بر اساس سطح دسترسی نقش فعلی
  const allowedStaticTargets = useMemo(() => {
    return ADMIN_MASTER_INDEX.filter((item) => {
      if (item.superAdminOnly && !isSuperAdmin) return false;
      if (isSuperAdmin || userPermissions.includes("all")) return true;
      if (item.moduleKey === "change_pin" || item.moduleKey === "dashboard") return true;
      return userPermissions.includes(item.moduleKey);
    });
  }, [isSuperAdmin, userPermissions]);

  // تطبیق آنی کلمه سرچ‌شده با منوها، زیربخش‌ها و تنظیمات پنل ادمین
  const matchedStaticResults = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return allowedStaticTargets.slice(0, 10);

    return allowedStaticTargets.filter(
      (item) =>
        item.title.toLowerCase().includes(clean) ||
        item.subtitle.toLowerCase().includes(clean) ||
        item.categoryLabel.toLowerCase().includes(clean) ||
        item.keywords.some((k) => k.toLowerCase().includes(clean))
    );
  }, [query, allowedStaticTargets]);

  // جستجوی زنده در دیتابیس (محصولات، سفارشات، چت زنده، کوپن‌ها، مقالات و ...)
  useEffect(() => {
    if (!isOpen) return;
    const clean = query.trim();
    if (clean.length < 1) {
      setDbResults([]);
      setLoadingDb(false);
      return;
    }

    setLoadingDb(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/global-search?q=${encodeURIComponent(clean)}&t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.results)) {
            setDbResults(json.results);
          }
        }
      } catch {
      } finally {
        setLoadingDb(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // ترکیب نتایج منوها/تنظیمات و نتایج زنده دیتابیس
  const combinedResults = useMemo(() => {
    const all = [
      ...matchedStaticResults.map((s) => ({
        id: s.id,
        category: s.category,
        categoryLabel: s.categoryLabel,
        title: s.title,
        subtitle: s.subtitle,
        badge: s.category === "menu" ? "منوی پنل" : "تنظیمات",
        href: s.href,
      })),
      ...dbResults,
    ];

    if (activeCategory === "all") return all;
    if (activeCategory === "menu_setting") {
      return all.filter((r) => r.category === "menu" || r.category === "setting");
    }
    return all.filter((r) => r.category === activeCategory);
  }, [matchedStaticResults, dbResults, activeCategory]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // میانبر کیبورد Ctrl+K یا Cmd+K برای باز کردن سریع سرچ از هر جای پنل
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        soundEngine.playClick();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // بستن مودال هنگام تغییر مسیر
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleNavigate = useCallback(
    (href: string) => {
      soundEngine.playClick();
      setIsOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        combinedResults.length > 0 ? (prev + 1) % combinedResults.length : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        combinedResults.length > 0
          ? (prev - 1 + combinedResults.length) % combinedResults.length
          : 0
      );
    } else if (e.key === "Enter" && combinedResults[selectedIndex]) {
      e.preventDefault();
      handleNavigate(combinedResults[selectedIndex].href);
    }
  };

  return (
    <>
      {/* نوار سرچ همیشه در دسترس در بالای پنل مدیریت */}
      <button
        type="button"
        onClick={() => {
          soundEngine.playClick();
          setIsOpen(true);
        }}
        className="flex-1 max-w-md mx-2 px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition flex items-center justify-between gap-3 text-xs cursor-pointer shadow-inner group"
        title="جستجوی سراسری در تمام منوها، تنظیمات، محصولات و سفارشات (Ctrl + K)"
      >
        <div className="flex items-center gap-2 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] truncate">
          <span className="text-sm">🔍</span>
          <span className="font-bold truncate">
            جستجو در کل پنل ادمین (منوها، تنظیمات، کالا، سفارش، چت...)
          </span>
        </div>
        <kbd
          dir="ltr"
          className="hidden sm:inline-block px-2 py-0.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[10px] font-black text-[var(--accent-blue)] shrink-0"
        >
          Ctrl + K
        </kbd>
      </button>

      {/* پنجره Command Palette و نتایج زنده جستجو */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans select-text"
          dir="rtl"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl bg-[var(--modal-bg)] border-2 border-[var(--accent-blue)]/50 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
          >
            {/* کادر تایپ سرچ */}
            <div className="p-4 bg-[var(--input-bg)] border-b border-[var(--card-border)] flex items-center gap-3">
              <span className="text-lg">🔍</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="هر چه می‌خواهید بنویسید: نام منو، بکگراند، مالیات، کد تخفیف، نام کالا، شماره سفارش، نام مشتری..."
                className="flex-1 bg-transparent text-xs sm:text-sm font-black text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/70"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold text-rose-400 cursor-pointer"
                >
                  پاک کردن
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-black cursor-pointer hover:border-rose-500"
              >
                ✕
              </button>
            </div>

            {/* فیلتر دسته‌بندی نتایج */}
            <div className="px-4 py-2.5 bg-[var(--modal-bg)] border-b border-[var(--card-border)] flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
              {[
                { id: "all", label: "🌟 همه نتایج" },
                { id: "menu_setting", label: "🧭 منوها و تنظیمات پنل" },
                { id: "product", label: "🛍️️ محصولات" },
                { id: "order", label: "📦 سفارشات" },
                { id: "chat", label: "💬 گفتگوی زنده" },
                { id: "coupon", label: "🏷️ کدهای تخفیف" },
                { id: "content", label: "📚 مقالات و اخبار" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveCategory(tab.id);
                  }}
                  className={
                    "px-3 py-1.5 rounded-xl border whitespace-nowrap cursor-pointer transition " +
                    (activeCategory === tab.id
                      ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] font-black shadow"
                      : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]/40")
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* فهرست نتایج قابل کلیک */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[55vh]">
              {loadingDb && (
                <div className="px-3 py-1.5 text-[11px] font-bold text-[var(--accent-blue)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-ping" />
                  <span>در حال جستجوی زنده در دیتابیس...</span>
                </div>
              )}

              {!query.trim() && (
                <div className="px-2 py-1 text-[11px] font-black text-[var(--text-secondary)]">
                  ⚡ دسترسی سریع به منوها و تنظیمات پنل مدیریت (یا عبارت مورد نظر خود را تایپ کنید):
                </div>
              )}

              {combinedResults.length === 0 && !loadingDb ? (
                <div className="py-12 text-center space-y-2 text-xs text-slate-400 font-bold">
                  <div>موردی با عبارت «{query}» یافت نشد.</div>
                  <div className="text-[11px] font-normal">
                    نام منو، کلیدواژه تنظیمات، نام محصول، شماره موبایل یا کد سفارش را امتحان کنید.
                  </div>
                </div>
              ) : (
                combinedResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id + "_" + idx}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleNavigate(item.href)}
                      className={
                        "w-full p-3.5 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between gap-3 " +
                        (isSelected
                          ? "bg-[var(--accent-blue)]/15 border-[var(--accent-blue)] shadow-md"
                          : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--accent-blue)]/50")
                      }
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-[10px] font-black text-[var(--accent-blue)]">
                            {item.categoryLabel}
                          </span>
                          <span className="font-black text-xs sm:text-sm text-[var(--text-primary)] truncate">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate font-medium">
                          {item.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.badge && (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black">
                            {item.badge}
                          </span>
                        )}
                        <span className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white text-[11px] font-black shadow">
                          ورود ←
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* فوتر راهنمای کلیدهای میانبر */}
            <div className="px-4 py-2.5 bg-[var(--input-bg)] border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--text-secondary)] font-bold">
              <div className="flex items-center gap-3">
                <span>⬆️⬇️ جابجایی بین نتایج</span>
                <span>↵ Enter ورود مستقیم به بخش</span>
                <span>Esc بستن پنجره</span>
              </div>
              <span className="font-mono text-[var(--accent-blue)]">
                {combinedResults.length} نتیجه آماده
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminGlobalSearch;
