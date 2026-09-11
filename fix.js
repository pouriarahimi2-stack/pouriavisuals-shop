/**
 * AXON CORE - True Micro-Drag & Drop Atomic Header & Fixed Alignment (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-HEADER-MICRO-BUILDER]\x1b[0m اصلاح چینش چپ/راست هدر و تفکیک تک‌تک اجزا به درگ‌واند‌دراپ ماوس...");

// =============================================================================
// ۱. اصلاح components/Header.tsx با ترتیب فیزیکی استاندارد و قطعی
// =============================================================================
const exactHeaderCode = `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function Header() {
  const { totalItems, toggleCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    setMounted(true);
    const cached = siteInfoService.getSiteInfoSync();
    if (cached) setSiteInfo(cached);

    siteInfoService.getSiteInfo().then((data) => {
      if (data) setSiteInfo(data);
    });

    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}

    const handleUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };

    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const toggleDarkMode = () => {
    soundEngine.playClick();
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
      localStorage.setItem("theme", "dark");
    }
  };

  const storeName = siteInfo?.site_name || siteInfo?.siteName || siteInfo?.storeName || "Axon | آکسون";

  return (
    <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 my-2 select-none font-sans" dir="ltr">
      <div className="flex items-center justify-between px-6 py-3 rounded-full bg-white/90 dark:bg-[#07090e]/90 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-xl transition-all">
        
        {/* سمت چپ مطلق: ابزارهای کاربری (سبد خرید، دارک‌مود، پروفایل) */}
        <div className="flex items-center gap-2 order-1">
          <button
            type="button"
            onClick={() => { soundEngine.playClick(); toggleCart(); }}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition cursor-pointer relative shadow-sm"
            title="سبد خرید"
          >
            🛒
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-bounce">
                {totalItems}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition cursor-pointer text-xs"
            title="حالت شب / روز"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <Link
            href="/admin/login"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition cursor-pointer text-xs"
            title="ورود به حساب"
          >
            👤
          </Link>
        </div>

        {/* وسط: منوهای ناوبری فارسی */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-black text-slate-700 dark:text-slate-300 order-2" dir="rtl">
          <Link href="/products" className="hover:text-sky-500 transition cursor-pointer">کاتالوگ محصولات</Link>
          <Link href="/news" className="hover:text-sky-500 transition cursor-pointer">اخبار تکنولوژی</Link>
          <Link href="/blog" className="hover:text-sky-500 transition cursor-pointer">مجله سئو</Link>
          <Link href="/track-order" className="hover:text-sky-500 transition cursor-pointer">پیگیری سفارش</Link>
          <Link href="/contact" className="hover:text-sky-500 transition cursor-pointer">تماس با ما</Link>
        </nav>

        {/* سمت راست مطلق: نام و نشان اختصاصی برند آکسون */}
        <Link href="/" className="flex items-center gap-3 group order-3" dir="rtl">
          <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-sky-500 transition">
            {storeName}
          </span>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs group-hover:scale-105 transition">
            ▲
          </div>
        </Link>

      </div>
    </header>
  );
}
`;
writeFile('components/Header.tsx', exactHeaderCode);

// =============================================================================
// ۲. بازنویسی lib/puckConfig.tsx با اجزای اتمیک درگ‌واند‌دراپ با ماوس
// =============================================================================
const atomicDropzonePuckConfig = `import React, { useState, useEffect } from "react";
import type { Config } from "@measured/puck";
import { DropZone } from "@measured/puck";
import Link from "next/link";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
import { productService, Product } from "@/services/productService";

export type ComponentProps = {
  // ۱. ساختار هدر اتمیک
  HeaderCapsuleBar: {
    paddingY: number;
  };
  HeaderBrandLogo: {
    brandText: string;
    iconText: string;
  };
  HeaderNavItem: {
    title: string;
    url: string;
  };
  HeaderActionsGroup: {
    showCart: boolean;
    showTheme: boolean;
    showUser: boolean;
  };

  // ۲. بخش‌های بدنه
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

  // ۳. فوتر سازمانی
  GlobalFooterBlock: {
    brandTitle: string;
    brandSubtitle: string;
    brandDesc: string;
    supportPhone: string;
    supportEmail: string;
    warehouseAddress: string;
    workingHours: string;
    enamadCode: string;
    copyrightText: string;
  };
};

function PuckProductListWrapper() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    productService.getAll().then((data) => setProducts(data || []));
  }, []);
  return <ProductList initialProducts={products} />;
}

export const puckConfig: Config<ComponentProps> = {
  categories: {
    header_atoms: {
      title: "🧩 اجزای ریز هدر (درگ تک‌تک آیتم‌ها با ماوس)",
      components: ["HeaderCapsuleBar", "HeaderBrandLogo", "HeaderNavItem", "HeaderActionsGroup"]
    },
    page_sections: {
      title: "⭐ بخش‌های صفحه و فوتر",
      components: ["NativeHero3D", "NativePerspectiveSlider", "NativeProductCatalog", "NativeExplodedView", "GlobalFooterBlock"]
    }
  },
  components: {
    // کانتینر اصلی هدر با ۳ بخش مستقل درگ‌واند‌دراپ
    HeaderCapsuleBar: {
      label: "نوار کپسولی هدر (شامل جایگاه‌های درگ)",
      fields: {
        paddingY: { type: "number", label: "فاصله عمودی (px)" }
      },
      defaultProps: {
        paddingY: 10
      },
      render: ({ paddingY }) => (
        <header style={{ paddingTop: \`\${paddingY || 10}px\`, paddingBottom: \`\${paddingY || 10}px\` }} className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 select-none font-sans" dir="ltr">
          <div className="flex items-center justify-between px-6 py-3 rounded-full bg-[#07090e]/95 border border-white/10 backdrop-blur-2xl shadow-2xl">
            
            {/* شیار سمت چپ (Left Dropzone): دکمه‌های سبد خرید، تم و پروفایل */}
            <div className="flex items-center gap-2 order-1">
              <DropZone zone="left-actions" />
            </div>

            {/* شیار وسط (Center Dropzone): تک‌تک منوهای ناوبری با امکان جابجایی ماوس */}
            <nav className="flex items-center gap-6 text-xs font-black text-slate-300 order-2" dir="rtl">
              <DropZone zone="center-menu" />
            </nav>

            {/* شیار سمت راست (Right Dropzone): نشان و نام برند آکسون */}
            <div className="flex items-center gap-3 order-3" dir="rtl">
              <DropZone zone="right-brand" />
            </div>

          </div>
        </header>
      )
    },

    // المان برند و لوگو
    HeaderBrandLogo: {
      label: "نشان و نام برند آکسون",
      fields: {
        brandText: { type: "text", label: "نام برند" },
        iconText: { type: "text", label: "کاراکتر آیکون" }
      },
      defaultProps: {
        brandText: "Axon | آکسون",
        iconText: "▲"
      },
      render: ({ brandText, iconText }) => (
        <div className="flex items-center gap-3 cursor-pointer">
          <span className="font-black text-base tracking-tight text-white">{brandText}</span>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs">
            {iconText || "▲"}
          </div>
        </div>
      )
    },

    // تک‌تک منوها به عنوان بلوک مستقل قابل جابجایی
    HeaderNavItem: {
      label: "آیتم منو (قابل کشیدن با ماوس)",
      fields: {
        title: { type: "text", label: "عنوان منو" },
        url: { type: "text", label: "آدرس لینک" }
      },
      defaultProps: {
        title: "منوی جدید",
        url: "/products"
      },
      render: ({ title, url }) => (
        <Link href={url || "#"} className="hover:text-sky-400 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5">
          {title}
        </Link>
      )
    },

    // دکمه‌های سمت چپ هدر
    HeaderActionsGroup: {
      label: "دکمه‌های سبد خرید، تم و کاربر",
      fields: {
        showCart: { type: "radio", label: "سبد خرید", options: [{ label: "فعال", value: true }, { label: "خاموش", value: false }] },
        showTheme: { type: "radio", label: "تم دارک", options: [{ label: "فعال", value: true }, { label: "خاموش", value: false }] },
        showUser: { type: "radio", label: "پروفایل", options: [{ label: "فعال", value: true }, { label: "خاموش", value: false }] }
      },
      defaultProps: {
        showCart: true,
        showTheme: true,
        showUser: true
      },
      render: ({ showCart, showTheme, showUser }) => (
        <div className="flex items-center gap-2">
          {showCart && <span className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs">🛒</span>}
          {showTheme && <span className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs">🌙</span>}
          {showUser && <span className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs">👤</span>}
        </div>
      )
    },

    // هیرو ۳D
    NativeHero3D: {
      label: "هیرو ۳D اصلی سایت",
      fields: {
        topBadge: { type: "text", label: "برچسب بالای هیرو" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" }
      },
      defaultProps: {
        topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        bgColor: "transparent"
      },
      render: ({ topBadge, bgColor }) => (
        <div style={{ backgroundColor: bgColor || "transparent" }} className="w-full relative overflow-hidden select-none py-4" dir="rtl">
          {topBadge && (
            <div className="text-center pt-2">
              <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-black inline-block">
                {topBadge}
              </span>
            </div>
          )}
          <Hero3DCanvas />
        </div>
      )
    },

    // اسلایدر پرسپکتیو
    NativePerspectiveSlider: {
      label: "اسلایدر پرسپکتیو بنرها",
      fields: {
        paddingY: { type: "number", label: "فاصله عمودی (px)" }
      },
      defaultProps: {
        paddingY: 20
      },
      render: ({ paddingY }) => (
        <div style={{ paddingTop: \`\${paddingY || 20}px\`, paddingBottom: \`\${paddingY || 20}px\` }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none" dir="rtl">
          <ProductPerspectiveSlider />
        </div>
      )
    },

    // کاتالوگ محصولات
    NativeProductCatalog: {
      label: "ویترین اصلی کاتالوگ محصولات",
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

    // کالبدشکافی ۳D
    NativeExplodedView: {
      label: "کالبدشکافی ۳D سخت‌افزار",
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

    // فوتر ۴ ستونه
    GlobalFooterBlock: {
      label: "فوتر ۴ ستونه مهندسی کامل",
      fields: {
        brandTitle: { type: "text", label: "تیتر برند در فوتر" },
        brandSubtitle: { type: "text", label: "زیرعنوان برند" },
        brandDesc: { type: "textarea", label: "متن معرفی گارانتی" },
        supportPhone: { type: "text", label: "شماره پشتیبانی" },
        supportEmail: { type: "text", label: "پست الکترونیک" },
        warehouseAddress: { type: "text", label: "نشانی انبار" },
        workingHours: { type: "text", label: "ساعات پاسخگویی" },
        enamadCode: { type: "text", label: "کد اینماد" },
        copyrightText: { type: "text", label: "متن کپی‌رایت" }
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
        <footer className="w-full bg-[#07090e] border-t border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none text-white mt-16" dir="rtl">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs">
                      ▲
                    </div>
                    <h3 className="font-black text-2xl text-white">{brandTitle}</h3>
                  </div>
                  <p className="text-xs font-bold text-sky-400">{brandSubtitle}</p>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">{brandDesc}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black">
                    ✓ گارانتی اصالت ۱۰۰٪ فیزیکی
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-black">
                    🚀 ارسال پیشتاز سراسری
                  </span>
                </div>
                <div className="pt-3 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400">شبکه‌های ارتباطی:</span>
                  <div className="p-3 rounded-3xl bg-slate-900 text-white flex items-center justify-center gap-2 shadow-2xl" dir="ltr">
                    {["C", "O", "N", "T", "A", "C", "T"].map((k, i) => (
                      <div key={i} className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-black text-xs shadow-inner">
                        {k}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-white">دسترسی سریع</h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-400">
                  <li><Link href="/products" className="hover:text-sky-400 transition">کاتالوگ کالاها</Link></li>
                  <li><Link href="/track-order" className="hover:text-sky-400 transition">سامانه رهگیری مرسولات</Link></li>
                  <li><Link href="/news" className="hover:text-sky-400 transition">جدیدترین اخبار تکنولوژی</Link></li>
                  <li><Link href="/blog" className="hover:text-sky-400 transition">مجله مقالات تخصصی</Link></li>
                </ul>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-white">خدمات مشتریان</h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-400">
                  <li><Link href="/contact" className="hover:text-sky-400 transition">ثبت تیکت مشاوره</Link></li>
                  <li><Link href="/about" className="hover:text-sky-400 transition">شرایط گارانتی طلایی</Link></li>
                  <li><Link href="/about" className="hover:text-sky-400 transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
                  <li><Link href="/blog" className="hover:text-sky-400 transition">راهنمای کالیبراسیون ۵K</Link></li>
                </ul>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <h4 className="font-black text-sm text-white">اطلاعات تماس و دفتر</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">تلفن پشتیبانی:</span>
                      <span className="font-mono font-black text-slate-200">{supportPhone}</span>
                    </div>
                    <span>📞</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">پست الکترونیک:</span>
                      <span className="font-mono font-bold text-slate-200">{supportEmail}</span>
                    </div>
                    <span>✉️</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">نشانی تحویل و انبار:</span>
                      <span className="font-bold text-slate-200">{warehouseAddress}</span>
                    </div>
                    <span>📍</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-200">نماد اعتماد الکترونیکی</span>
                      <span className="text-[10px] text-slate-400 block">کد: {enamadCode}</span>
                    </div>
                    <span>🛡️</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex justify-between text-xs font-bold text-slate-500">
              <span>نماد اعتماد الکترونیکی فعال ({enamadCode})</span>
              <p>{copyrightText}</p>
            </div>
          </div>
        </footer>
      )
    }
  }
};
`;
writeFile('lib/puckConfig.tsx', atomicDropzonePuckConfig);

// =============================================================================
// ۳. به‌روزرسانی داده‌های اولیه بوم با قرار دادن تک‌تک آیتم‌های منو در شیارهای هدر
// =============================================================================
const studioAtomicLayoutCode = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

const ATOMIC_INITIAL_DATA: Data = {
  content: [
    {
      type: "HeaderCapsuleBar",
      props: {
        id: "header-capsule-1",
        paddingY: 10
      }
    },
    {
      type: "NativeHero3D",
      props: {
        id: "hero-1",
        topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        bgColor: "transparent"
      }
    },
    {
      type: "NativePerspectiveSlider",
      props: {
        id: "slider-1",
        paddingY: 20
      }
    },
    {
      type: "NativeProductCatalog",
      props: {
        id: "catalog-1",
        heading: "کاتالوگ تجهیزات تخصصی"
      }
    },
    {
      type: "NativeExplodedView",
      props: {
        id: "exploded-1",
        productTitle: "Apple Studio Display 5K Retina"
      }
    },
    {
      type: "GlobalFooterBlock",
      props: {
        id: "footer-1",
        brandTitle: "Axon | آکسون",
        brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
        brandDesc: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
        supportPhone: "09376110200",
        supportEmail: "Pouriarahimi@yahoo.com",
        warehouseAddress: "شیراز - ستارخان",
        workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: "27424534",
        copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026"
      }
    }
  ],
  zones: {
    "header-capsule-1:right-brand": [
      {
        type: "HeaderBrandLogo",
        props: {
          id: "brand-logo-1",
          brandText: "Axon | آکسون",
          iconText: "▲"
        }
      }
    ],
    "header-capsule-1:center-menu": [
      { type: "HeaderNavItem", props: { id: "nav-1", title: "کاتالوگ محصولات", url: "/products" } },
      { type: "HeaderNavItem", props: { id: "nav-2", title: "اخبار تکنولوژی", url: "/news" } },
      { type: "HeaderNavItem", props: { id: "nav-3", title: "مجله سئو", url: "/blog" } },
      { type: "HeaderNavItem", props: { id: "nav-4", title: "پیگیری سفارش", url: "/track-order" } },
      { type: "HeaderNavItem", props: { id: "nav-5", title: "تماس با ما", url: "/contact" } }
    ],
    "header-capsule-1:left-actions": [
      {
        type: "HeaderActionsGroup",
        props: {
          id: "actions-1",
          showCart: true,
          showTheme: true,
          showUser: true
        }
      }
    ]
  },
  root: { props: { title: "صفحه اصلی" } }
};

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data>(ATOMIC_INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const loadPage = async (slug: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();
    try {
      const res = await fetch(\`/api/pages?slug=\${encodeURIComponent(slug)}\`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page && json.page.puck_data && json.page.puck_data.content?.length > 0) {
        setPageData(json.page.puck_data);
      } else {
        setPageData(ATOMIC_INITIAL_DATA);
      }
    } catch {
      setPageData(ATOMIC_INITIAL_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار تغییرات روی سایت...");
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: currentSlug === "home" ? "صفحه اصلی" : currentSlug,
          puck_data: data,
          is_published: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setToast("✓ صفحه با موفقیت ذخیره شد و تغییرات اعمال گردید.");
      } else {
        setToast("خطا در ذخیره‌سازی.");
      }
    } catch {
      setToast("خطا در برقراری ارتباط با سرور.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : \`/\${currentSlug}\`;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ استودیو */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">انتخاب صفحه:</span>
            <select
              value={currentSlug}
              onChange={(e) => loadPage(e.target.value)}
              className="p-2 px-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black outline-none cursor-pointer"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده در سایت</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      {/* بوم استاندارد با بزرگنمایی طبیعی ۱۰۰٪ و قابلیت درگ با ماوس */}
      <div className="w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[880px]">
        {loading ? (
          <div className="py-32 text-center text-xs font-bold text-slate-400">در حال آماده‌سازی بوم بصری...</div>
        ) : (
          <Puck
            config={puckConfig}
            data={pageData}
            onPublish={handleSave}
          />
        )}
      </div>
    </div>
  );
}
`;
writeFile('components/admin/AdminModularPages.tsx', studioAtomicLayoutCode);

// =============================================================================
// ۴. بیلد و ارسال به گیت‌هاب و استقرار ورسل
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "fix(header-alignment): correct left/right layout order and enable true granular mouse drag-and-drop with Puck DropZones"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ اصلاح چینش هدر و فعال‌سازی درگ با ماوس با موفقیت دیپلوی شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}