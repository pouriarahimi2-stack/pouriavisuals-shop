import React, { useState, useEffect } from "react";
import type { Config } from "@measured/puck";
import Link from "next/link";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
import ColorGamutSimulator from "@/components/ColorGamutSimulator";
import LiveMarketArbitrage from "@/components/LiveMarketArbitrage";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

export type ComponentProps = {
  // ۱. اجزای اختصاصی صفحه اول سایت
  NativeHero3D: {
    topBadge: string;
    bgColor: string;
  };
  NativePerspectiveSlider: {
    paddingY: number;
  };
  NativeProductCatalog: {
    heading: string;
  };
  NativeExplodedView: {
    productTitle: string;
  };
  NativeColorGamut: {
    productTitle: string;
  };
  NativePriceMatch: {
    productTitle: string;
    ourPrice: number;
  };

  // ۲. بلوک‌های تکمیلی و مارکتینگ
  CountdownTimer: {
    badge: string;
    title: string;
    targetDate: string;
    buttonText: string;
    buttonUrl: string;
    bgColor: string;
  };
  ProductComparison: {
    heading: string;
    subtitle: string;
    product1Id: string;
    product2Id: string;
    bgColor: string;
  };
  FeaturesGrid: {
    heading: string;
    item1Title: string;
    item1Desc: string;
    item2Title: string;
    item2Desc: string;
    item3Title: string;
    item3Desc: string;
    bgColor: string;
    paddingTop: number;
    paddingBottom: number;
    hoverLift: boolean;
  };
  FaqAccordion: {
    heading: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    bgColor: string;
  };
  CtaBanner: {
    title: string;
    subtitle: string;
    btnText: string;
    btnUrl: string;
    bgColor: string;
    glowEffect: boolean;
  };
  CustomHtml: {
    code: string;
    paddingTop: number;
    paddingBottom: number;
  };
};

// ویترین کاتالوگ داخلی برای Puck
function PuckProductListWrapper() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    productService.getAll().then((data) => setProducts(data || []));
  }, []);

  return <ProductList initialProducts={products} />;
}

export const puckConfig: Config<ComponentProps> = {
  categories: {
    site_navigation: {
      title: "🧭 ناوبری هدر و فوتر",
      components: ["GlobalHeaderBlock", "GlobalFooterBlock"]
    },
    site_core: {
      title: "⭐ اجزای اختصاصی صفحه اول سایت",
      components: [
        "NativeHero3D",
        "NativePerspectiveSlider",
        "NativeProductCatalog",
        "NativeExplodedView",
        "NativeColorGamut",
        "NativePriceMatch"
      ]
    },
    campaign: {
      title: "🎯 کمپین، تخفیف و مقایسه",
      components: ["CountdownTimer", "ProductComparison", "CtaBanner"]
    },
    content: {
      title: "📑 محتوا و اعتماد",
      components: ["FeaturesGrid", "FaqAccordion", "CustomHtml"]
    }
  },
  components: {
    // هدر کپسولی شیشه‌ای کاملاً منطبق بر عکس ارسالی
    GlobalHeaderBlock: {
      label: "هدر کپسولی شیشه‌ای سراسری (Header)",
      fields: {
        brandName: { type: "text", label: "عنوان برند (Axon | آکسون)" },
        link1Text: { type: "text", label: "منو ۱: کاتالوگ محصولات" },
        link1Url: { type: "text", label: "لینک منو ۱" },
        link2Text: { type: "text", label: "منو ۲: اخبار تکنولوژی" },
        link2Url: { type: "text", label: "لینک منو ۲" },
        link3Text: { type: "text", label: "منو ۳: مجله سئو" },
        link3Url: { type: "text", label: "لینک منو ۳" },
        link4Text: { type: "text", label: "منو ۴: پیگیری سفارش" },
        link4Url: { type: "text", label: "لینک منو ۴" },
        link5Text: { type: "text", label: "منو ۵: تماس با ما" },
        link5Url: { type: "text", label: "لینک منو ۵" },
      },
      defaultProps: {
        brandName: "Axon | آکسون",
        link1Text: "کاتالوگ محصولات",
        link1Url: "/products",
        link2Text: "اخبار تکنولوژی",
        link2Url: "/news",
        link3Text: "مجله سئو",
        link3Url: "/blog",
        link4Text: "پیگیری سفارش",
        link4Url: "/track-order",
        link5Text: "تماس با ما",
        link5Url: "/contact",
      },
      render: ({ brandName, link1Text, link1Url, link2Text, link2Url, link3Text, link3Url, link4Text, link4Url, link5Text, link5Url }) => (
        <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 my-2 select-none font-sans" dir="rtl">
          <div className="flex items-center justify-between px-6 py-3 rounded-full bg-[var(--modal-bg,#ffffff)]/80 dark:bg-[#07090e]/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-xl transition-all">
            
            {/* سمت چپ: آیکون‌های سبد خرید، تم شب و پروفایل */}
            <div className="flex items-center gap-2">
              <Link href="/cart" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition">
                🛒
              </Link>
              <button type="button" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition">
                🌙
              </button>
              <Link href="/login" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition">
                👤
              </Link>
            </div>

            {/* بخش میانی: لینک‌های ناوبری اصلی */}
            <nav className="hidden lg:flex items-center gap-8 text-xs font-black text-slate-700 dark:text-slate-300">
              <Link href={link5Url || "/contact"} className="hover:text-sky-500 transition">{link5Text}</Link>
              <Link href={link4Url || "/track-order"} className="hover:text-sky-500 transition">{link4Text}</Link>
              <Link href={link3Url || "/blog"} className="hover:text-sky-500 transition">{link3Text}</Link>
              <Link href={link2Url || "/news"} className="hover:text-sky-500 transition">{link2Text}</Link>
              <Link href={link1Url || "/products"} className="hover:text-sky-500 transition">{link1Text}</Link>
            </nav>

            {/* سمت راست: نام و نشان اختصاصی برند آکسون */}
            <Link href="/" className="flex items-center gap-3 group">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                {brandName}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs">
                ▲
              </div>
            </Link>

          </div>
        </header>
      )
    },

    // فوتر ۴ ستونه مهندسی دقیقاً منطبق بر عکس ارسالی
    GlobalFooterBlock: {
      label: "فوتر ۴ ستونه کامل و سازمانی (Footer)",
      fields: {
        brandTitle: { type: "text", label: "تیتر برند در فوتر" },
        brandSubtitle: { type: "text", label: "زیرعنوان برند" },
        brandDesc: { type: "textarea", label: "متن معرفی گارانتی و استاندارد" },
        supportPhone: { type: "text", label: "شماره پشتیبانی" },
        supportEmail: { type: "text", label: "پست الکترونیک" },
        warehouseAddress: { type: "text", label: "نشانی انبار و تحویل" },
        workingHours: { type: "text", label: "ساعات پاسخگویی" },
        enamadCode: { type: "text", label: "کد رسمی نماد اعتماد (اینماد)" },
        copyrightText: { type: "text", label: "متن کپی‌رایت پایین فوتر" }
      },
      defaultProps: {
        brandTitle: "Axon | آکسون",
        brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
        brandDesc: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
        supportPhone: "09376110200",
        supportEmail: "Pouriarahimi@yahoo.com",
        warehouseAddress: "شیراز - ستارخان",
        workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: "27424534",
        copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026"
      },
      render: ({ brandTitle, brandSubtitle, brandDesc, supportPhone, supportEmail, warehouseAddress, workingHours, enamadCode, copyrightText }) => (
        <footer className="w-full bg-[var(--modal-bg,#ffffff)] dark:bg-[#07090e] border-t border-slate-200 dark:border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none mt-16" dir="rtl">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* گرید ۴ ستونه اصلی فوتر */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
              
              {/* ستون ۱ (راست): معرفی برند، بج‌ها و کلیدهای کیبورد CONTACT */}
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs">
                      ▲
                    </div>
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white">{brandTitle}</h3>
                  </div>
                  <p className="text-xs font-bold text-sky-500">{brandSubtitle}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">{brandDesc}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black flex items-center gap-1.5">
                    <span>✓</span> گارانتی اصالت ۱۰۰٪ فیزیکی
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-black flex items-center gap-1.5">
                    <span>🚀</span> ارسال پیشتاز سراسری
                  </span>
                </div>

                {/* کلیدهای ۳D تعاملی CONTACT */}
                <div className="pt-3 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> شبکه‌های ارتباطی و اجتماعی استودیو:
                  </span>
                  <div className="p-3 rounded-3xl bg-slate-900 text-white flex items-center justify-center gap-2 shadow-2xl" dir="ltr">
                    {["C", "O", "N", "T", "A", "C", "T"].map((k, i) => (
                      <div key={i} className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-black text-xs shadow-inner hover:scale-110 hover:border-sky-400 transition cursor-pointer">
                        {k}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-center text-slate-400">برای مشاهده امکانات، ماوس را روی کلیدها ببرید یا کلیک کنید</p>
                </div>
              </div>

              {/* ستون ۲: دسترسی سریع */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> دسترسی سریع
                </h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <li><Link href="/products" className="hover:text-sky-500 transition">کاتالوگ کالاها</Link></li>
                  <li><Link href="/track-order" className="hover:text-sky-500 transition">سامانه رهگیری مرسولات</Link></li>
                  <li><Link href="/news" className="hover:text-sky-500 transition">جدیدترین اخبار تکنولوژی</Link></li>
                  <li><Link href="/blog" className="hover:text-sky-500 transition">مجله مقالات تخصصی</Link></li>
                  <li><Link href="/about" className="hover:text-sky-500 transition">درباره آکسون</Link></li>
                </ul>
              </div>

              {/* ستون ۳: خدمات مشتریان */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> خدمات مشتریان
                </h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <li><Link href="/contact" className="hover:text-sky-500 transition">ثبت تیکت مشاوره</Link></li>
                  <li><Link href="/about" className="hover:text-sky-500 transition">شرایط گارانتی طلایی</Link></li>
                  <li><Link href="/about" className="hover:text-sky-500 transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
                  <li><Link href="/blog" className="hover:text-sky-500 transition">راهنمای کالیبراسیون ۵K</Link></li>
                  <li><Link href="/about" className="hover:text-sky-500 transition">روش‌های پرداخت امن شاپرک</Link></li>
                </ul>
              </div>

              {/* ستون ۴ (چپ): کارت‌های اطلاعات تماس و اینماد رسمی */}
              <div className="lg:col-span-4 space-y-4">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> اطلاعات تماس و دفتر
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">تلفن پشتیبانی:</span>
                      <span className="font-mono font-black text-slate-800 dark:text-slate-200">{supportPhone}</span>
                    </div>
                    <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 text-sm">📞</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">پست الکترونیک:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">{supportEmail}</span>
                    </div>
                    <span className="p-2 rounded-xl bg-sky-500/10 text-sky-500 text-sm">✉️</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">نشانی تحویل حضوری و انبار:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{warehouseAddress}</span>
                    </div>
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 text-sm">📍</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">ساعات پاسخگویی:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{workingHours}</span>
                    </div>
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 text-sm">⏰</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">نماد اعتماد الکترونیکی</span>
                      <span className="text-[10px] text-slate-400 block">کد رسمی: <strong className="font-mono text-sky-500">{enamadCode}</strong></span>
                    </div>
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm">🛡️</span>
                  </div>
                </div>
              </div>

            </div>

            {/* نوار پایانی کپی‌رایت و وضعیت اینماد */}
            <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>نماد اعتماد الکترونیکی فعال ({enamadCode})</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-400">طراحی و معماری مهندسی پایدار</span>
              </div>
              <p className="text-center sm:text-left text-[11px]">
                {copyrightText}
              </p>
            </div>

          </div>
        </footer>
      )
    },

    // هدر سراسری با کنترل تک‌تک اجزا
    GlobalHeaderBlock: {
      label: "هدر سراسری سایت (Header)",
      fields: {
        brandTitle: { type: "text", label: "عنوان برند (Axon | آکسون)" },
        ctaText: { type: "text", label: "متن دکمه ورود به کاتالوگ" },
        ctaUrl: { type: "text", label: "لینک دکمه ورود به کاتالوگ" },
        link1Title: { type: "text", label: "عنوان منوی اول" },
        link1Url: { type: "text", label: "لینک منوی اول" },
        link2Title: { type: "text", label: "عنوان منوی دوم" },
        link2Url: { type: "text", label: "لینک منوی دوم" },
        link3Title: { type: "text", label: "عنوان منوی سوم" },
        link3Url: { type: "text", label: "لینک منوی سوم" },
        link4Title: { type: "text", label: "عنوان منوی چهارم" },
        link4Url: { type: "text", label: "لینک منوی چهارم" },
      },
      defaultProps: {
        brandTitle: "Axon | آکسون",
        ctaText: "کاتالوگ محصولات",
        ctaUrl: "/products",
        link1Title: "اخبار تکنولوژی",
        link1Url: "/news",
        link2Title: "مجله سئو",
        link2Url: "/blog",
        link3Title: "پیگیری سفارش",
        link3Url: "/track-order",
        link4Title: "تماس با ما",
        link4Url: "/contact",
      },
      render: ({ brandTitle, ctaText, ctaUrl, link1Title, link1Url, link2Title, link2Url, link3Title, link3Url, link4Title, link4Url }) => (
        <div className="w-full max-w-7xl mx-auto px-4 py-3 select-none" dir="rtl">
          <div className="p-3.5 px-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <span className="font-black text-sm text-sky-400">{brandTitle}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">مرجع تخصصی مانیتورهای ۵K</span>
            </div>
            <div className="hidden md:flex items-center gap-5 text-xs font-bold text-slate-300">
              <Link href={ctaUrl || "/products"} className="hover:text-white transition">{ctaText}</Link>
              <Link href={link1Url || "/news"} className="hover:text-white transition">{link1Title}</Link>
              <Link href={link2Url || "/blog"} className="hover:text-white transition">{link2Title}</Link>
              <Link href={link3Url || "/track-order"} className="hover:text-white transition">{link3Title}</Link>
              <Link href={link4Url || "/contact"} className="hover:text-white transition">{link4Title}</Link>
            </div>
            <Link href={ctaUrl || "/products"} className="px-4 py-1.5 rounded-full bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 transition">
              {ctaText}
            </Link>
          </div>
        </div>
      )
    },

    // فوتر سراسری با کنترل تک‌تک بخش‌ها
    GlobalFooterBlock: {
      label: "فوتر سراسری سایت (Footer)",
      fields: {
        brandName: { type: "text", label: "نام استودیو" },
        bioText: { type: "textarea", label: "متن معرفی فوتر" },
        supportPhone: { type: "text", label: "شماره تماس پشتیبانی" },
        email: { type: "text", label: "ایمیل پشتیبانی" },
        address: { type: "text", label: "آدرس و دفتر" },
        copyright: { type: "text", label: "متن کپی‌رایت انتهای فوتر" }
      },
      defaultProps: {
        brandName: "Axon | آکسون",
        bioText: "مرجع تخصصی تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ ۵K و تجهیزات تصویر با ۱۸ ماه گارانتی طلایی در ایران.",
        supportPhone: "09376110200",
        email: "Pouriarahimi@yahoo.com",
        address: "شیراز - ستارخان",
        copyright: "تمامی حقوق مادی و معنوی برای آکسون استودیو محفوظ است © 2026"
      },
      render: ({ brandName, bioText, supportPhone, email, address, copyright }) => (
        <footer className="w-full max-w-7xl mx-auto px-4 py-8 select-none text-white border-t border-white/10 mt-12" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 text-xs">
            <div className="space-y-3">
              <h3 className="font-black text-base text-sky-400">{brandName}</h3>
              <p className="text-slate-400 leading-relaxed">{bioText}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-200">اطلاعات تماس</h4>
              <p className="text-slate-400">تلفن: <span className="font-mono text-slate-200">{supportPhone}</span></p>
              <p className="text-slate-400">ایمیل: <span className="font-mono text-slate-200">{email}</span></p>
              <p className="text-slate-400">نشانی: <span className="text-slate-200">{address}</span></p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-200">دسترسی سریع</h4>
              <div className="flex flex-col gap-1.5 text-slate-400">
                <Link href="/products" className="hover:text-sky-400 transition">کاتالوگ کالاها</Link>
                <Link href="/news" className="hover:text-sky-400 transition">جدیدترین اخبار تکنولوژی</Link>
                <Link href="/track-order" className="hover:text-sky-400 transition">سامانه رهگیری مرسولات</Link>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 text-center text-[11px] text-slate-500 font-medium">
            {copyright}
          </div>
        </footer>
      )
    },

    // ۱. هیرو ۳D اورجینال
    NativeHero3D: {
      label: "هیرو ۳D اصلی سایت (Hero3DCanvas)",
      fields: {
        topBadge: { type: "text", label: "برچسب بالای هیرو" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" }
      },
      defaultProps: {
        topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        bgColor: "transparent"
      },
      render: ({ topBadge, bgColor }) => (
        <div style={{ backgroundColor: bgColor || "transparent" }} className="w-full relative overflow-hidden select-none" dir="rtl">
          {topBadge && (
            <div className="text-center pt-3">
              <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-black inline-block">
                {topBadge}
              </span>
            </div>
          )}
          <Hero3DCanvas />
        </div>
      )
    },

    // ۲. اسلایدر پرسپکتیو ۳D
    NativePerspectiveSlider: {
      label: "اسلایدر پرسپکتیو بنرهای اصلی (ProductPerspectiveSlider)",
      fields: {
        paddingY: { type: "number", label: "فاصله عمودی (px)" }
      },
      defaultProps: {
        paddingY: 20
      },
      render: ({ paddingY }) => (
        <div style={{ paddingTop: `${paddingY || 20}px`, paddingBottom: `${paddingY || 20}px` }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none" dir="rtl">
          <ProductPerspectiveSlider />
        </div>
      )
    },

    // ۳. کاتالوگ محصولات اصلی
    NativeProductCatalog: {
      label: "ویترین اصلی کاتالوگ محصولات (ProductList)",
      fields: {
        heading: { type: "text", label: "عنوان کاتالوگ" }
      },
      defaultProps: {
        heading: "کاتالوگ تجهیزات تخصصی"
      },
      render: () => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none" dir="rtl">
          <PuckProductListWrapper />
        </div>
      )
    },

    // ۴. کالبدشکافی ۳D
    NativeExplodedView: {
      label: "کالبدشکافی ۳D سخت‌افزار (ProductExplodedView)",
      fields: {
        productTitle: { type: "text", label: "نام محصول مدل ۳D" }
      },
      defaultProps: {
        productTitle: "Apple Studio Display 5K Retina"
      },
      render: ({ productTitle }) => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none" dir="rtl">
          <ProductExplodedView productTitle={productTitle || "Apple Studio Display 5K"} />
        </div>
      )
    },

    // ۵. شبیه‌ساز رنگ
    NativeColorGamut: {
      label: "شبیه‌ساز گاموت رنگی (ColorGamutSimulator)",
      fields: {
        productTitle: { type: "text", label: "نام نمایشگر" }
      },
      defaultProps: {
        productTitle: "نمایشگر رتینا ۵K استودیو"
      },
      render: ({ productTitle }) => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none" dir="rtl">
          <ColorGamutSimulator productTitle={productTitle || "نمایشگر رتینا ۵K"} />
        </div>
      )
    },

    // ۶. پایش لحظه‌ای قیمت بازار
    NativePriceMatch: {
      label: "پایش قیمت لحظه‌ای بازار (LiveMarketArbitrage)",
      fields: {
        productTitle: { type: "text", label: "نام کالا" },
        ourPrice: { type: "number", label: "قیمت آکسون (تومان)" }
      },
      defaultProps: {
        productTitle: "Apple Studio Display 27 5K",
        ourPrice: 128500000
      },
      render: ({ productTitle, ourPrice }) => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none" dir="rtl">
          <LiveMarketArbitrage productTitle={productTitle || "Apple Studio Display"} ourPrice={ourPrice || 128500000} />
        </div>
      )
    },

    // ۷. تایمر جشنواره
    CountdownTimer: {
      label: "تایمر معکوس جشنواره فروش",
      fields: {
        badge: { type: "text", label: "بج برچسب بالا" },
        title: { type: "text", label: "تیتر پیشنهاد ویژه" },
        targetDate: { type: "text", label: "تاریخ پایان (فرمت: YYYY-MM-DDTHH:mm:ss)" },
        buttonText: { type: "text", label: "متن دکمه خرید" },
        buttonUrl: { type: "text", label: "لینک دکمه" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" },
      },
      defaultProps: {
        badge: "⚡ پیشنهاد شگفت‌انگیز",
        title: "تخفیف ویژه مانیتورهای استودیو تا پایان امشب",
        targetDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 19),
        buttonText: "مشاهده پیشنهادها",
        buttonUrl: "/products",
        bgColor: "#0f172a",
      },
      render: ({ badge, title, targetDate, buttonText, buttonUrl, bgColor }) => {
        const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 12, minutes: 45, seconds: 30 });

        useEffect(() => {
          const end = targetDate ? new Date(targetDate).getTime() : Date.now() + 24 * 3600 * 1000;
          const timer = setInterval(() => {
            const diff = Math.max(0, end - Date.now());
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ hours, minutes, seconds });
          }, 1000);
          return () => clearInterval(timer);
        }, [targetDate]);

        return (
          <section style={{ backgroundColor: bgColor || "#111827" }} className="w-full py-10 px-4 font-sans select-none text-white border-y border-white/10" dir="rtl">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-right">
                {badge && <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30 inline-block">{badge}</span>}
                <h2 className="text-xl sm:text-2xl font-black">{title || "فرصت محدود جشنواره ویژه"}</h2>
              </div>

              <div className="flex items-center gap-3 font-mono font-black" dir="ltr">
                <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-center min-w-[65px]">
                  <span className="text-2xl block text-rose-400">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[9px] font-sans text-slate-400">ساعت</span>
                </div>
                <span className="text-xl text-rose-400">:</span>
                <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-center min-w-[65px]">
                  <span className="text-2xl block text-rose-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[9px] font-sans text-slate-400">دقیقه</span>
                </div>
                <span className="text-xl text-rose-400">:</span>
                <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-center min-w-[65px]">
                  <span className="text-2xl block text-rose-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[9px] font-sans text-slate-400">ثانیه</span>
                </div>
              </div>

              {buttonText && (
                <Link href={buttonUrl || "/products"} className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-lg shadow-rose-600/30 whitespace-nowrap">
                  {buttonText} ←
                </Link>
              )}
            </div>
          </section>
        );
      },
    },

    // ۸. مقایسه دو محصول
    ProductComparison: {
      label: "ماتریس مقایسه ۲ کالا",
      fields: {
        heading: { type: "text", label: "عنوان ماتریس" },
        subtitle: { type: "text", label: "زیرعنوان" },
        product1Id: { type: "text", label: "شناسه محصول اول" },
        product2Id: { type: "text", label: "شناسه محصول دوم" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" },
      },
      defaultProps: {
        heading: "مقایسه فنی و مشخصات ۲ مانیتور برتر",
        subtitle: "ارزیابی وضوح رتینا، پوشش گاموت و پورت‌های تاندربولت",
        product1Id: "prod-studio-display-5k",
        product2Id: "prod-pro-display-xdr",
        bgColor: "#090d16",
      },
      render: ({ heading, subtitle, product1Id, product2Id, bgColor }) => {
        const [p1, setP1] = useState<Product | null>(null);
        const [p2, setP2] = useState<Product | null>(null);
        const { addToCart } = useCart();

        useEffect(() => {
          productService.getAll().then((data) => {
            if (data && data.length > 0) {
              setP1(data.find(p => p.id === product1Id) || data[0]);
              setP2(data.find(p => p.id === product2Id) || data[1] || data[0]);
            }
          });
        }, [product1Id, product2Id]);

        if (!p1 || !p2) return null;

        return (
          <section style={{ backgroundColor: bgColor || "#090d16" }} className="w-full py-12 px-4 font-sans select-none text-white border-y border-white/10" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-black">{heading || "ماتریس مقایسه فنی و انتخاب دقیق"}</h2>
                {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {[p1, p2].map((p, idx) => {
                  const price = Number(p.discountPrice || p.price || 0);
                  return (
                    <div key={p.id + idx} className="p-6 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 space-y-4 flex flex-col justify-between shadow-2xl hover:border-sky-500/40 transition">
                      <div className="space-y-3">
                        <div className="w-full h-44 rounded-2xl bg-black/40 p-2 flex items-center justify-center">
                          <img src={p.images?.[0] || p.image || "/placeholder.png"} alt={p.title} className="w-full h-full object-contain" />
                        </div>
                        <h3 className="font-black text-sm text-sky-400">{p.title}</h3>
                        <div className="space-y-1 text-xs text-slate-300">
                          <div className="flex justify-between py-1 border-b border-white/5"><span>دسته‌بندی:</span><span className="font-bold">{p.category || "استودیویی"}</span></div>
                          <div className="flex justify-between py-1 border-b border-white/5"><span>گارانتی:</span><span className="font-bold text-emerald-400">۱۸ ماه تعویض طلایی</span></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="font-mono font-black text-emerald-400 text-sm">{price.toLocaleString("fa-IR")} تومان</span>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playAddToCart();
                            addToCart({ id: p.id, title: p.title, price, image: p.images?.[0] || p.image, stock: 10 });
                          }}
                          className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md cursor-pointer transition"
                        >
                          افزودن به سبد 🛒
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      },
    },

    // ۹. ویژگی‌ها
    FeaturesGrid: {
      label: "گرید ۳ ستونه مزایا و ویژگی‌ها",
      fields: {
        heading: { type: "text", label: "عنوان بخش" },
        item1Title: { type: "text", label: "عنوان ویژگی ۱" },
        item1Desc: { type: "textarea", label: "توضیح ویژگی ۱" },
        item2Title: { type: "text", label: "عنوان ویژگی ۲" },
        item2Desc: { type: "textarea", label: "توضیح ویژگی ۲" },
        item3Title: { type: "text", label: "عنوان ویژگی ۳" },
        item3Desc: { type: "textarea", label: "توضیح ویژگی ۳" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" },
        paddingTop: { type: "number", label: "فاصله بالا (px)" },
        paddingBottom: { type: "number", label: "فاصله پایین (px)" },
        hoverLift: {
          type: "radio",
          label: "افکت شناور هاور",
          options: [{ label: "فعال", value: true }, { label: "عادی", value: false }]
        }
      },
      defaultProps: {
        heading: "استانداردهای مهندسی آکسون استودیو",
        item1Title: "گارانتی ۱۸ ماهه طلایی",
        item1Desc: "تعویض بدون قید و شرط برای تمامی نمایشگرهای مسترینگ.",
        item2Title: "کالیبراسیون ۳D LUT",
        item2Desc: "تراز رنگ اختصاصی مطابق با گاموت‌های سینمایی DCI-P3.",
        item3Title: "بسته‌بندی ایمن هوانوردی",
        item3Desc: "محافظت کامل فیزیکی در برابر ضربه و شوک حین ارسال پیشتاز.",
        bgColor: "#090d16",
        paddingTop: 50,
        paddingBottom: 50,
        hoverLift: true,
      },
      render: ({ heading, item1Title, item1Desc, item2Title, item2Desc, item3Title, item3Desc, bgColor, paddingTop, paddingBottom, hoverLift }) => (
        <section style={{ backgroundColor: bgColor || "#090d16", paddingTop: `${paddingTop || 50}px`, paddingBottom: `${paddingBottom || 50}px` }} className="w-full px-4 font-sans select-none text-white" dir="rtl">
          <div className="max-w-7xl mx-auto space-y-8">
            {heading && <h2 className="text-2xl font-black text-center">{heading}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { t: item1Title, d: item1Desc, icon: "🛡️" },
                { t: item2Title, d: item2Desc, icon: "⚡" },
                { t: item3Title, d: item3Desc, icon: "📦" },
              ].map((item, i) => (
                <div key={i} className={`p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2 transition duration-300 ${hoverLift ? "hover:-translate-y-1.5 hover:border-sky-500/50 hover:shadow-2xl" : ""}`}>
                  <span className="text-3xl block">{item.icon}</span>
                  <h3 className="font-bold text-sm">{item.t}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ),
    },

    // ۱۰. سوالات متداول
    FaqAccordion: {
      label: "پرسش و پاسخ آکاردئونی (FAQ)",
      fields: {
        heading: { type: "text", label: "تیتر بخش پرسش‌ها" },
        q1: { type: "text", label: "سوال اول" },
        a1: { type: "textarea", label: "پاسخ اول" },
        q2: { type: "text", label: "سوال دوم" },
        a2: { type: "textarea", label: "پاسخ دوم" },
        q3: { type: "text", label: "سوال سوم" },
        a3: { type: "textarea", label: "پاسخ سوم" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" },
      },
      defaultProps: {
        heading: "پرسش‌های متداول مشتریان و استودیوها",
        q1: "آیا مانیتورها دارای گارانتی تعویض هستند؟",
        a1: "بله، تمام مانیتورهای ۵K دارای ۱۸ ماه گارانتی طلایی تعویض بی قید و شرط می‌باشند.",
        q2: "نحوه ارسال تجهیزات حساس به شهرستان چگونه است؟",
        a2: "بسته‌بندی ضربه‌گیر ویژه هوانوردی به همراه بیمه کامل مرسوله توسط پست پیشتاز اختصاصی.",
        q3: "امکان تست حضوری مانیتور وجود دارد؟",
        a3: "بله، با هماهنگی قبلی در دفتر مرکزی امکان تست کالیبراسیون پنل وجود دارد.",
        bgColor: "#020617",
      },
      render: ({ heading, q1, a1, q2, a2, q3, a3, bgColor }) => {
        const [open, setOpen] = useState<number | null>(0);
        const list = [{ q: q1, a: a1 }, { q: q2, a: a2 }, { q: q3, a: a3 }].filter(x => x.q);
        return (
          <section style={{ backgroundColor: bgColor || "#020617" }} className="w-full py-12 px-4 font-sans select-none text-white" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
              {heading && <h2 className="text-2xl font-black text-center mb-8">{heading}</h2>}
              <div className="space-y-3">
                {list.map((it, idx) => (
                  <div key={idx} onClick={() => setOpen(open === idx ? null : idx)} className="p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer transition hover:border-sky-500/30">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span>{it.q}</span>
                      <span className="text-sky-400 font-mono">{open === idx ? "▲" : "▼"}</span>
                    </div>
                    {open === idx && <p className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-300 leading-relaxed">{it.a}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }
    },

    // ۱۱. فراخوان
    CtaBanner: {
      label: "فراخوان عمل و کمپین (CTA)",
      fields: {
        title: { type: "text", label: "تیتر فراخوان" },
        subtitle: { type: "textarea", label: "متن زیرعنوان" },
        btnText: { type: "text", label: "متن دکمه" },
        btnUrl: { type: "text", label: "لینک دکمه" },
        bgColor: { type: "text", label: "رنگ باکس" },
        glowEffect: {
          type: "radio",
          label: "هاله نور نئونی",
          options: [{ label: "فعال", value: true }, { label: "خاموش", value: false }]
        }
      },
      defaultProps: {
        title: "به یک مشاوره تخصصی برای استودیو نیاز دارید؟",
        subtitle: "کارشناسان آکسون متناسب با نرم‌افزار شما مانیتور مناسب را پیشنهاد می‌دهند.",
        btnText: "ثبت تیکت مشاوره",
        btnUrl: "/contact",
        bgColor: "#1e1b4b",
        glowEffect: true,
      },
      render: ({ title, subtitle, btnText, btnUrl, bgColor, glowEffect }) => (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans select-none" dir="rtl">
          <div
            style={{ backgroundColor: bgColor || "#1e1b4b" }}
            className={`p-8 sm:p-12 rounded-3xl text-center space-y-4 border border-blue-500/30 text-white ${
              glowEffect ? "shadow-[0_0_50px_rgba(59,130,246,0.25)]" : "shadow-2xl"
            }`}
          >
            <h2 className="text-2xl font-black">{title}</h2>
            {subtitle && <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">{subtitle}</p>}
            {btnText && (
              <div className="pt-2">
                <Link href={btnUrl || "/contact"} className="inline-block px-8 py-3.5 rounded-2xl bg-white text-slate-950 font-black text-xs hover:bg-slate-100 transition shadow-xl">
                  {btnText}
                </Link>
              </div>
            )}
          </div>
        </div>
      ),
    },

    // ۱۲. کد اختصاصی
    CustomHtml: {
      label: "کد خام اختصاصی (HTML / CSS / SVG)",
      fields: {
        code: { type: "textarea", label: "کد اختصاصی" },
        paddingTop: { type: "number", label: "فاصله از بالا" },
        paddingBottom: { type: "number", label: "فاصله از پایین" },
      },
      defaultProps: {
        code: "<div class='p-6 text-center text-sky-400 font-mono text-xs border border-sky-500/20 rounded-2xl'>کدهای دلخواه HTML / CSS را اینجا وارد کنید</div>",
        paddingTop: 20,
        paddingBottom: 20,
      },
      render: ({ code, paddingTop, paddingBottom }) => (
        <div style={{ paddingTop: `${paddingTop || 20}px`, paddingBottom: `${paddingBottom || 20}px` }} className="max-w-7xl mx-auto px-4">
          <div dangerouslySetInnerHTML={{ __html: code || "" }} />
        </div>
      ),
    },
  },
};
