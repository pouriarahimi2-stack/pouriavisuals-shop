/**
 * AXON CORE - Granular Page Builder, In-Canvas Logo Uploaders & Dynamic Favicon Engine (fix.js)
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

console.log("\x1b[36m[AXON-ENTERPRISE-UPDATE]\x1b[0m ۱. افزودن تنظیمات دانه‌دانه به صفحه ساز...");
console.log("\x1b[36m[AXON-ENTERPRISE-UPDATE]\x1b[0m ۲. اتصال آپلود و مدیریت لوگوی هدر و فوتر در بوم ادیتور...");
console.log("\x1b[36m[AXON-ENTERPRISE-UPDATE]\x1b[0m ۳. اتصال فاوآیکون پویا در تنظیمات و هد مرورگر...");

// =============================================================================
// ۱. ارتقای lib/puckConfig.tsx با فیلدهای عمیق، لوگوهای مجزا و کنترل کامل استایل‌ها
// =============================================================================
const deepPuckConfig = `import React, { useState, useEffect } from "react";
import type { Config } from "@measured/puck";
import { DropZone } from "@measured/puck";
import Link from "next/link";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
import { productService, Product } from "@/services/productService";

export type ComponentProps = {
  HeaderCapsuleBar: {
    brandText: string;
    logoUrl: string;
    logoWidth: number;
    logoHeight: number;
    capsuleBg: string;
    capsuleBorder: string;
    paddingY: number;
  };
  HeaderNavItem: {
    title: string;
    url: string;
    textColor: string;
    badgeText: string;
  };
  HeaderActionsGroup: {
    showCart: boolean;
    showTheme: boolean;
    showUser: boolean;
    iconBgColor: string;
  };
  NativeHero3D: {
    topBadge: string;
    badgeColor: string;
    title: string;
    subtitle: string;
    bgColor: string;
    titleSize: number;
    paddingTop: number;
    paddingBottom: number;
  };
  NativePerspectiveSlider: {
    sectionTitle: string;
    sectionSubtitle: string;
    paddingY: number;
  };
  NativeProductCatalog: {
    heading: string;
    subtitle: string;
    limit: number;
  };
  NativeExplodedView: {
    productTitle: string;
    sectionTitle: string;
  };
  GlobalFooterBlock: {
    footerLogoUrl: string;
    brandTitle: string;
    brandSubtitle: string;
    brandDesc: string;
    supportPhone: string;
    supportEmail: string;
    warehouseAddress: string;
    workingHours: string;
    enamadCode: string;
    copyrightText: string;
    footerBg: string;
  };
};

function PuckProductListWrapper({ limit }: { limit?: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    productService.getAll().then((data) => {
      if (data) setProducts(limit ? data.slice(0, limit) : data);
    });
  }, [limit]);
  return <ProductList initialProducts={products} />;
}

export const puckConfig: Config<ComponentProps> = {
  categories: {
    header_elements: {
      title: "🧭 ناوبری و هدر با کنترل لوگو",
      components: ["HeaderCapsuleBar", "HeaderNavItem", "HeaderActionsGroup"]
    },
    sections: {
      title: "⭐ بدنه صفحه و کاتالوگ",
      components: ["NativeHero3D", "NativePerspectiveSlider", "NativeProductCatalog", "NativeExplodedView"]
    },
    footer_elements: {
      title: "⚓ فوتر با لوگوی اختصاصی و تماس",
      components: ["GlobalFooterBlock"]
    }
  },
  components: {
    HeaderCapsuleBar: {
      label: "هدر کپسولی (لوگو، ابعاد و استایل)",
      fields: {
        brandText: { type: "text", label: "نام برند" },
        logoUrl: { type: "text", label: "آدرس تصویر لوگوی هدر (URL)" },
        logoWidth: { type: "number", label: "عرض لوگو (px)" },
        logoHeight: { type: "number", label: "ارتفاع لوگو (px)" },
        capsuleBg: { type: "text", label: "رنگ پس‌زمینه کپسول" },
        capsuleBorder: { type: "text", label: "رنگ مرز دور کپسول" },
        paddingY: { type: "number", label: "فاصله عمودی (px)" }
      },
      defaultProps: {
        brandText: "Axon | آکسون",
        logoUrl: "",
        logoWidth: 36,
        logoHeight: 36,
        capsuleBg: "rgba(7, 9, 14, 0.9)",
        capsuleBorder: "rgba(255, 255, 255, 0.12)",
        paddingY: 10
      },
      render: ({ brandText, logoUrl, logoWidth, logoHeight, capsuleBg, capsuleBorder, paddingY }) => (
        <header style={{ paddingTop: \`\${paddingY || 10}px\`, paddingBottom: \`\${paddingY || 10}px\` }} className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 select-none font-sans" dir="ltr">
          <div
            style={{ backgroundColor: capsuleBg || "rgba(7, 9, 14, 0.9)", borderColor: capsuleBorder || "rgba(255, 255, 255, 0.12)" }}
            className="flex items-center justify-between px-6 py-3 rounded-full border backdrop-blur-2xl shadow-2xl transition-all"
          >
            {/* سمت چپ: آیکون‌ها */}
            <div className="flex items-center gap-2 order-1">
              <DropZone zone="left-actions" />
            </div>

            {/* وسط: منوهای ناوبری */}
            <nav className="flex items-center gap-6 text-xs font-black text-slate-300 order-2" dir="rtl">
              <DropZone zone="center-menu" />
            </nav>

            {/* سمت راست: نام و لوگوی قابل تنظیم هدر */}
            <Link href="/" className="flex items-center gap-3 order-3" dir="rtl">
              <span className="font-black text-base tracking-tight text-white">{brandText || "Axon | آکسون"}</span>
              <div
                style={{ width: \`\${logoWidth || 36}px\`, height: \`\${logoHeight || 36}px\` }}
                className="rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shadow-md p-1 shrink-0"
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                    ▲
                  </div>
                )}
              </div>
            </Link>
          </div>
        </header>
      )
    },

    HeaderNavItem: {
      label: "آیتم منو با بج و رنگ",
      fields: {
        title: { type: "text", label: "عنوان منو" },
        url: { type: "text", label: "لینک منو" },
        textColor: { type: "text", label: "رنگ متن" },
        badgeText: { type: "text", label: "بج کوچک کنار منو (اختیاری)" }
      },
      defaultProps: {
        title: "کاتالوگ محصولات",
        url: "/products",
        textColor: "#ffffff",
        badgeText: ""
      },
      render: ({ title, url, textColor, badgeText }) => (
        <Link href={url || "#"} style={{ color: textColor || "#fff" }} className="hover:text-sky-400 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5 flex items-center gap-1.5">
          <span>{title}</span>
          {badgeText && (
            <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[9px] font-bold border border-rose-500/30">
              {badgeText}
            </span>
          )}
        </Link>
      )
    },

    HeaderActionsGroup: {
      label: "دکمه‌های کاربری هدر",
      fields: {
        showCart: { type: "radio", label: "سبد خرید", options: [{ label: "فعال", value: true }, { label: "غیرفعال", value: false }] },
        showTheme: { type: "radio", label: "تم شب/روز", options: [{ label: "فعال", value: true }, { label: "غیرفعال", value: false }] },
        showUser: { type: "radio", label: "پروفایل", options: [{ label: "فعال", value: true }, { label: "غیرفعال", value: false }] },
        iconBgColor: { type: "text", label: "رنگ پس‌زمینه دکمه‌ها" }
      },
      defaultProps: {
        showCart: true,
        showTheme: true,
        showUser: true,
        iconBgColor: "rgba(255, 255, 255, 0.08)"
      },
      render: ({ showCart, showTheme, showUser, iconBgColor }) => (
        <div className="flex items-center gap-2">
          {showCart && (
            <span style={{ backgroundColor: iconBgColor || "rgba(255, 255, 255, 0.08)" }} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-xs text-white">
              🛒
            </span>
          )}
          {showTheme && (
            <span style={{ backgroundColor: iconBgColor || "rgba(255, 255, 255, 0.08)" }} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-xs text-white">
              🌙
            </span>
          )}
          {showUser && (
            <span style={{ backgroundColor: iconBgColor || "rgba(255, 255, 255, 0.08)" }} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-xs text-white">
              👤
            </span>
          )}
        </div>
      )
    },

    NativeHero3D: {
      label: "هیرو ۳D (تنظیم فونت، پدینگ و رنگ)",
      fields: {
        topBadge: { type: "text", label: "متن برچسب بالا" },
        badgeColor: { type: "text", label: "رنگ برچسب" },
        title: { type: "text", label: "تیتر اصلی هیرو" },
        titleSize: { type: "number", label: "اندازه تیتر اصلی (px)" },
        subtitle: { type: "textarea", label: "متن توضیحات زیرعنوان" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه بخش" },
        paddingTop: { type: "number", label: "فاصله از بالا (px)" },
        paddingBottom: { type: "number", label: "فاصله از پایین (px)" }
      },
      defaultProps: {
        topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        badgeColor: "#38bdf8",
        title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
        titleSize: 42,
        subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
        bgColor: "transparent",
        paddingTop: 40,
        paddingBottom: 20
      },
      render: ({ topBadge, badgeColor, title, titleSize, subtitle, bgColor, paddingTop, paddingBottom }) => (
        <section
          style={{ backgroundColor: bgColor || "transparent", paddingTop: \`\${paddingTop || 40}px\`, paddingBottom: \`\${paddingBottom || 20}px\` }}
          className="w-full relative overflow-hidden select-none font-sans text-white text-center"
          dir="rtl"
        >
          <div className="max-w-4xl mx-auto space-y-4 px-4 relative z-10">
            {topBadge && (
              <span style={{ color: badgeColor || "#38bdf8" }} className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-black inline-block">
                {topBadge}
              </span>
            )}
            <h1 style={{ fontSize: \`\${titleSize || 42}px\` }} className="font-black leading-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <div className="w-full h-[480px] relative overflow-hidden mt-4">
            <Hero3DCanvas />
          </div>
        </section>
      )
    },

    NativePerspectiveSlider: {
      label: "اسلایدر پرسپکتیو بنرها",
      fields: {
        sectionTitle: { type: "text", label: "تیتر بخش" },
        sectionSubtitle: { type: "text", label: "زیرعنوان بخش" },
        paddingY: { type: "number", label: "فاصله عمودی (px)" }
      },
      defaultProps: {
        sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
        sectionSubtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی",
        paddingY: 20
      },
      render: ({ sectionTitle, sectionSubtitle, paddingY }) => (
        <div style={{ paddingTop: \`\${paddingY || 20}px\`, paddingBottom: \`\${paddingY || 20}px\` }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none" dir="rtl">
          <ProductPerspectiveSlider customTitle={sectionTitle} customSubtitle={sectionSubtitle} />
        </div>
      )
    },

    NativeProductCatalog: {
      label: "کاتالوگ اصلی محصولات",
      fields: {
        heading: { type: "text", label: "عنوان کاتالوگ" },
        subtitle: { type: "text", label: "زیرعنوان کاتالوگ" },
        limit: { type: "number", label: "حداکثر تعداد کالا" }
      },
      defaultProps: {
        heading: "کاتالوگ تجهیزات تخصصی و مانیتورها",
        subtitle: "تمامی کالاها با گارانتی اصالت طلایی و تست سلامت فیزیکی عرضه می‌شوند",
        limit: 8
      },
      render: ({ limit }) => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none" dir="rtl">
          <PuckProductListWrapper limit={limit} />
        </div>
      )
    },

    NativeExplodedView: {
      label: "کالبدشکافی ۳D سخت‌افزار",
      fields: {
        productTitle: { type: "text", label: "نام محصول مدل ۳D" },
        sectionTitle: { type: "text", label: "تیتر بخش" }
      },
      defaultProps: {
        productTitle: "Apple Studio Display 5K Retina",
        sectionTitle: "کالبدشکافی لایه‌های سخت‌افزاری"
      },
      render: ({ productTitle }) => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none" dir="rtl">
          <ProductExplodedView productTitle={productTitle || "Apple Studio Display 5K"} />
        </div>
      )
    },

    GlobalFooterBlock: {
      label: "فوتر با لوگوی اختصاصی، تماس و اینماد",
      fields: {
        footerLogoUrl: { type: "text", label: "آدرس تصویر لوگوی فوتر (URL)" },
        brandTitle: { type: "text", label: "تیتر برند در فوتر" },
        brandSubtitle: { type: "text", label: "زیرعنوان برند" },
        brandDesc: { type: "textarea", label: "متن معرفی گارانتی" },
        supportPhone: { type: "text", label: "شماره تلفن پشتیبانی" },
        supportEmail: { type: "text", label: "پست الکترونیک" },
        warehouseAddress: { type: "text", label: "نشانی انبار" },
        workingHours: { type: "text", label: "ساعات پاسخگویی" },
        enamadCode: { type: "text", label: "کد نماد اعتماد (اینماد)" },
        copyrightText: { type: "text", label: "متن کپی‌رایت" },
        footerBg: { type: "text", label: "رنگ پس‌زمینه فوتر" }
      },
      defaultProps: {
        footerLogoUrl: "",
        brandTitle: "Axon | آکسون",
        brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
        brandDesc: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
        supportPhone: "09376110200",
        supportEmail: "Pouriarahimi@yahoo.com",
        warehouseAddress: "شیراز - ستارخان",
        workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: "27424534",
        copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
        footerBg: "#07090e"
      },
      render: ({ footerLogoUrl, brandTitle, brandSubtitle, brandDesc, supportPhone, supportEmail, warehouseAddress, workingHours, enamadCode, copyrightText, footerBg }) => (
        <footer style={{ backgroundColor: footerBg || "#07090e" }} className="w-full border-t border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none text-white mt-16" dir="rtl">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shadow-md p-1 shrink-0">
                      {footerLogoUrl ? (
                        <img src={footerLogoUrl} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                          ▲
                        </div>
                      )}
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
                  <span className="text-[11px] font-bold text-slate-400">شبکه‌های ارتباطی استودیو:</span>
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
writeFile('lib/puckConfig.tsx', deepPuckConfig);

// =============================================================================
// ۲. به‌روزرسانی components/AdminSiteInfo.tsx با آپلود مستقیم Favicon و لوگوها
// =============================================================================
const siteInfoWithFaviconCode = `"use client";

import React, { useState, useEffect, useRef } from "react";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminSiteInfo() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const faviconInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const footerLogoInputRef = useRef<HTMLInputElement>(null);

  const fetchInfo = async () => {
    const data = await siteInfoService.getSiteInfo();
    if (data) {
      setSiteInfo(data);
      setSiteName(data.site_name || data.siteName || data.storeName || "Axon | آکسون");
      setTagline(data.tagline || "");
      setLogoUrl(data.logo_url || data.logoUrl || "");
      setFooterLogoUrl(data.footer_logo_url || data.footerLogoUrl || "");
      setFaviconUrl(data.favicon_url || "");
      setPhone(data.phone || "09376110200");
      setEmail(data.email || "Pouriarahimi@yahoo.com");
      setAddress(data.address || "شیراز - ستارخان");
      setWorkingHours(data.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰");
      setDescription(data.description || data.footer_text || "");
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const handleFileUpload = (file: File, setter: (val: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setter(e.target.result as string);
        soundEngine.playSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);

    try {
      const payload: Partial<SiteInfo> = {
        site_name: siteName.trim(),
        siteName: siteName.trim(),
        storeName: siteName.trim(),
        tagline: tagline.trim(),
        logo_url: logoUrl.trim(),
        logoUrl: logoUrl.trim(),
        footer_logo_url: footerLogoUrl.trim(),
        footerLogoUrl: footerLogoUrl.trim(),
        favicon_url: faviconUrl.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        working_hours: workingHours.trim(),
        description: description.trim(),
        footer_text: description.trim(),
      };

      const updated = await siteInfoService.updateSiteInfo(payload);
      if (updated) {
        soundEngine.playSuccess();
        setStatusMessage({ type: "success", text: "✓ تنظیمات عمومی، فاوآیکون و لوگوها با موفقیت در سراسر سایت ذخیره و فعال شدند." });
        
        // به‌روزرسانی آنی فاوآیکون در تب جاری مرورگر
        if (faviconUrl) {
          let link = document.getElementById("axon-dynamic-favicon") as HTMLLinkElement;
          if (!link) {
            link = document.createElement("link");
            link.id = "axon-dynamic-favicon";
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = faviconUrl;
        }
      } else {
        throw new Error("خطا در ذخیره دیتابیس");
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "خطا در ثبت اطلاعات." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <input type="file" ref={faviconInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setFaviconUrl)} accept=".ico,.png,.svg" className="hidden" />
      <input type="file" ref={logoInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setLogoUrl)} accept="image/*" className="hidden" />
      <input type="file" ref={footerLogoInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setFooterLogoUrl)} accept="image/*" className="hidden" />

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-sky-500 flex items-center gap-2">
            <span>⚙️</span> تنظیمات عمومی، مدیریت فاوآیکون مرورگر و هویت بصری
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تعیین آیکون نوار آدرس مرورگر (Favicon)، لوگوی اصلی هدر و فوتر و اطلاعات رسمی شرکت
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className={\`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn \${
          statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-rose-500/15 text-rose-600"
        }\`}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 md:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
        
        {/* بخش ویژه فاوآیکون تب مرورگر */}
        <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                <span>🌐</span> لوگو و فاوآیکون نوار آدرس مرورگر (Browser Tab Favicon)
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                تصویری که در تب بالای مرورگر و بوک‌مارک‌ها کنار نام سایت نمایش داده می‌شود
              </p>
            </div>
            <button
              type="button"
              onClick={() => faviconInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs cursor-pointer shadow-md transition"
            >
              📁 انتخاب فایل فاوآیکون
            </button>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="w-12 h-12 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center p-2 shrink-0 shadow-inner">
              {faviconUrl ? (
                <img src={faviconUrl} alt="Favicon" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl">🌐</span>
              )}
            </div>
            <input
              type="text"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="آدرس تصویر فاوآیکون (یا بارگذاری با دکمه بالا)"
              className="flex-1 p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs font-bold text-[var(--text-primary)] outline-none"
            />
          </div>
        </div>

        {/* بخش ویژه لوگوی هدر و لوگوی فوتر */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-black text-[var(--text-primary)]">لوگوی اصلی هدر کپسولی:</span>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold cursor-pointer"
              >
                بارگذاری عکس
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-1 flex items-center justify-center">
                {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-contain" /> : "▲"}
              </div>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="URL لوگوی هدر"
                className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-black text-[var(--text-primary)]">لوگوی ستون فوتر:</span>
              <button
                type="button"
                onClick={() => footerLogoInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold cursor-pointer"
              >
                بارگذاری عکس
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-1 flex items-center justify-center">
                {footerLogoUrl ? <img src={footerLogoUrl} alt="" className="w-full h-full object-contain" /> : "▲"}
              </div>
              <input
                type="text"
                value={footerLogoUrl}
                onChange={(e) => setFooterLogoUrl(e.target.value)}
                placeholder="URL لوگوی فوتر"
                className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* مشخصات عمومی و متنی */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام رسمی فروشگاه و برند:</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">شعار تجاری (Tagline):</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-medium"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره تماس پشتیبانی:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">پست الکترونیک رسمی:</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">نشانی دفتر و انبار تحویل حضوری:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">متن معرفی، گارانتی و استانداردها:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs leading-relaxed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار سراسری تغییرات"}
        </button>
      </form>
    </div>
  );
}
`;
writeFile('components/AdminSiteInfo.tsx', siteInfoWithFaviconCode);

// =============================================================================
// ۳. اتصال فاوآیکون سروری در app/layout.tsx
// =============================================================================
const updatedLayoutCode = `import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import LayoutWrapper from '@/components/LayoutWrapper';
import { getSiteInfoServer } from '@/app/actions/siteInfo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteInfoServer();
  const sName = info.site_name || info.siteName || "آکسون";
  const iconUrl = info.favicon_url || "/favicon.ico";

  return {
    title: \`\${sName} | مرجع تخصصی مانیتورهای ۵K و تجهیزات تصویر\`,
    description: info.description || "فروشگاه تخصصی و مرجع پیشرفته تجهیزات دیجیتال با ۱۸ ماه گارانتی اصالت طلایی",
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    },
    other: { enamad: '27424534' },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#07090e' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const info = await getSiteInfoServer();
  const faviconHref = info.favicon_url || "/favicon.ico";

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="enamad" content="27424534" />
        <link id="axon-dynamic-favicon" rel="icon" href={faviconHref} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
      </head>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors min-h-screen flex flex-col justify-between" suppressHydrationWarning>
        <CartProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}
`;
writeFile('app/layout.tsx', updatedLayoutCode);

// =============================================================================
// ۴. بیلد نهایی پروژه و انتشار در Vercel
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
  execSync('git commit -m "feat: granular puck controls, in-canvas header/footer logo uploaders and dynamic favicon engine"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تمام ویژگی‌های درخواستی با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}