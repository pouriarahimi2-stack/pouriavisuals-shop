/**
 * AXON CORE - Multi-Page Editor & Dynamic New Page Creator (fix.js)
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

console.log("\x1b[36m[AXON-MULTI-PAGE]\x1b[0m ۱. تفکیک صفحات اختصاصی در منوی کشویی...");
console.log("\x1b[36m[AXON-MULTI-PAGE]\x1b[0m ۲. فعال‌سازی قابلیت ساخت صفحه جدید و چیدمان آزاد...");

// =============================================================================
// ۱. ارتقای lib/puckConfig.tsx با اضافه کردن بلوک‌های متنی، سوالات متداول و ویژگی‌ها
// =============================================================================
const puckConfigContent = `import React, { useState, useEffect } from "react";
import type { Config } from "@measured/puck";
import Link from "next/link";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
import { productService, Product } from "@/services/productService";

const ColorPickerCustomField = ({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
}) => {
  const currentColor = value && value.startsWith("#") ? value : "#07090e";

  return (
    <div className="w-full my-3 space-y-1.5 font-sans" dir="rtl">
      {label && (
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          {label}
        </label>
      )}
      <div
        className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
        dir="ltr"
      >
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0 shrink-0 bg-transparent"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#07090e"
          className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none px-2 text-right"
        />
      </div>
    </div>
  );
};

export type ComponentProps = {
  HeaderCapsuleBar: {
    brandText: string;
    logoUrl: string;
    logoWidth: number;
    logoHeight: number;
    menu1Text: string;
    menu1Url: string;
    menu2Text: string;
    menu2Url: string;
    menu3Text: string;
    menu3Url: string;
    menu4Text: string;
    menu4Url: string;
    menu5Text: string;
    menu5Url: string;
    showCart: boolean;
    showTheme: boolean;
    showUser: boolean;
    capsuleBg: string;
    capsuleBorder: string;
  };
  NativeHero3D: {
    topBadge: string;
    badgeColor: string;
    title: string;
    titleSize: number;
    subtitle: string;
    bgColor: string;
  };
  NativePerspectiveSlider: {
    sectionTitle: string;
    sectionSubtitle: string;
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
  RichTextBlock: {
    title: string;
    content: string;
    bgColor: string;
  };
  FeaturesGridBlock: {
    heading: string;
    col1Title: string;
    col1Desc: string;
    col2Title: string;
    col2Desc: string;
    col3Title: string;
    col3Desc: string;
    bgColor: string;
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
    navigation: {
      title: "🧭 ناوبری هدر و فوتر",
      components: ["HeaderCapsuleBar", "GlobalFooterBlock"],
    },
    sections: {
      title: "⭐ کاتالوگ و المان‌های ۳D",
      components: [
        "NativeHero3D",
        "NativePerspectiveSlider",
        "NativeProductCatalog",
        "NativeExplodedView",
      ],
    },
    content_blocks: {
      title: "📝 محتوا و صفحات سفارشی",
      components: ["RichTextBlock", "FeaturesGridBlock"],
    },
  },
  components: {
    HeaderCapsuleBar: {
      label: "هدر کپسولی (کنترل تمام منوها، لوگو و رنگ)",
      fields: {
        brandText: { type: "text", label: "نام برند" },
        logoUrl: { type: "text", label: "آدرس تصویر لوگو (URL)" },
        logoWidth: { type: "number", label: "عرض لوگو (px)" },
        logoHeight: { type: "number", label: "ارتفاع لوگو (px)" },
        menu1Text: { type: "text", label: "منو ۱: عنوان" },
        menu1Url: { type: "text", label: "منو ۱: لینک" },
        menu2Text: { type: "text", label: "منو ۲: عنوان" },
        menu2Url: { type: "text", label: "منو ۲: لینک" },
        menu3Text: { type: "text", label: "منو ۳: عنوان" },
        menu3Url: { type: "text", label: "منو ۳: لینک" },
        menu4Text: { type: "text", label: "منو ۴: عنوان" },
        menu4Url: { type: "text", label: "منو ۴: لینک" },
        menu5Text: { type: "text", label: "منو ۵: عنوان" },
        menu5Url: { type: "text", label: "منو ۵: لینک" },
        showCart: {
          type: "radio",
          label: "آیکون سبد خرید",
          options: [
            { label: "فعال", value: true },
            { label: "غیرفعال", value: false },
          ],
        },
        showTheme: {
          type: "radio",
          label: "آیکون تغییر تم",
          options: [
            { label: "فعال", value: true },
            { label: "غیرفعال", value: false },
          ],
        },
        showUser: {
          type: "radio",
          label: "آیکون پروفایل",
          options: [
            { label: "فعال", value: true },
            { label: "غیرفعال", value: false },
          ],
        },
        capsuleBg: {
          type: "custom",
          render: ({ value, onChange }) => (
            <ColorPickerCustomField
              label="رنگ پس‌زمینه کپسول"
              value={value}
              onChange={onChange}
            />
          ),
        },
        capsuleBorder: {
          type: "custom",
          render: ({ value, onChange }) => (
            <ColorPickerCustomField
              label="رنگ خط دور کپسول"
              value={value}
              onChange={onChange}
            />
          ),
        },
      },
      defaultProps: {
        brandText: "Axon | آکسون",
        logoUrl: "",
        logoWidth: 36,
        logoHeight: 36,
        menu1Text: "کاتالوگ محصولات",
        menu1Url: "/products",
        menu2Text: "اخبار تکنولوژی",
        menu2Url: "/news",
        menu3Text: "مجله سئو",
        menu3Url: "/blog",
        menu4Text: "پیگیری سفارش",
        menu4Url: "/track-order",
        menu5Text: "تماس با ما",
        menu5Url: "/contact",
        showCart: true,
        showTheme: true,
        showUser: true,
        capsuleBg: "#07090e",
        capsuleBorder: "#27272a",
      },
      render: ({
        brandText,
        logoUrl,
        logoWidth,
        logoHeight,
        menu1Text,
        menu1Url,
        menu2Text,
        menu2Url,
        menu3Text,
        menu3Url,
        menu4Text,
        menu4Url,
        menu5Text,
        menu5Url,
        showCart,
        showTheme,
        showUser,
        capsuleBg,
        capsuleBorder,
      }) => {
        const w = Number(logoWidth) || 36;
        const h = Number(logoHeight) || 36;
        return (
          <header
            className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 my-2 select-none font-sans"
            dir="ltr"
          >
            <div
              style={{
                backgroundColor: capsuleBg || "#07090e",
                borderColor: capsuleBorder || "#27272a",
              }}
              className="flex items-center justify-between px-6 py-3 rounded-full border backdrop-blur-2xl shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center gap-2 order-1">
                {showCart && (
                  <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">
                    🛒
                  </span>
                )}
                {showTheme && (
                  <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">
                    🌙
                  </span>
                )}
                {showUser && (
                  <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">
                    👤
                  </span>
                )}
              </div>

              <nav
                className="hidden lg:flex items-center gap-7 text-xs font-black text-slate-300 order-2"
                dir="rtl"
              >
                {menu1Text && (
                  <Link
                    href={menu1Url || "/products"}
                    className="hover:text-sky-400 transition"
                  >
                    {menu1Text}
                  </Link>
                )}
                {menu2Text && (
                  <Link
                    href={menu2Url || "/news"}
                    className="hover:text-sky-400 transition"
                  >
                    {menu2Text}
                  </Link>
                )}
                {menu3Text && (
                  <Link
                    href={menu3Url || "/blog"}
                    className="hover:text-sky-400 transition"
                  >
                    {menu3Text}
                  </Link>
                )}
                {menu4Text && (
                  <Link
                    href={menu4Url || "/track-order"}
                    className="hover:text-sky-400 transition"
                  >
                    {menu4Text}
                  </Link>
                )}
                {menu5Text && (
                  <Link
                    href={menu5Url || "/contact"}
                    className="hover:text-sky-400 transition"
                  >
                    {menu5Text}
                  </Link>
                )}
              </nav>

              <div className="flex items-center gap-3 order-3" dir="rtl">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">
                  {brandText || "Axon | آکسون"}
                </span>
                <div
                  style={{ width: w + "px", height: h + "px" }}
                  className="rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shadow-md p-1 shrink-0 transition-all duration-300"
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                      ▲
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        );
      },
    },

    NativeHero3D: {
      label: "هیرو ۳D اصلی سایت",
      fields: {
        topBadge: { type: "text", label: "متن برچسب بالا" },
        badgeColor: { type: "text", label: "رنگ برچسب" },
        title: { type: "text", label: "تیتر اصلی هیرو" },
        titleSize: { type: "number", label: "اندازه تیتر اصلی (px)" },
        subtitle: { type: "textarea", label: "متن توضیحات زیرعنوان" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" },
      },
      defaultProps: {
        topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        badgeColor: "#38bdf8",
        title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
        titleSize: 42,
        subtitle:
          "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
        bgColor: "transparent",
      },
      render: ({
        topBadge,
        badgeColor,
        title,
        titleSize,
        subtitle,
        bgColor,
      }) => (
        <section
          style={{ backgroundColor: bgColor || "transparent" }}
          className="w-full relative overflow-hidden select-none font-sans text-white text-center py-6"
          dir="rtl"
        >
          <div className="max-w-4xl mx-auto space-y-4 px-4 relative z-10">
            {topBadge && (
              <span
                style={{ color: badgeColor || "#38bdf8" }}
                className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-black inline-block"
              >
                {topBadge}
              </span>
            )}
            <h1
              style={{ fontSize: (titleSize || 42) + "px" }}
              className="font-black leading-tight text-white"
            >
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
      ),
    },

    NativePerspectiveSlider: {
      label: "اسلایدر پرسپکتیو بنرها",
      fields: {
        sectionTitle: { type: "text", label: "تیتر بخش" },
        sectionSubtitle: { type: "text", label: "زیرعنوان بخش" },
      },
      defaultProps: {
        sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
        sectionSubtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی",
      },
      render: ({ sectionTitle, sectionSubtitle }) => (
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none py-4"
          dir="rtl"
        >
          <ProductPerspectiveSlider
            customTitle={sectionTitle}
            customSubtitle={sectionSubtitle}
          />
        </div>
      ),
    },

    NativeProductCatalog: {
      label: "کاتالوگ اصلی محصولات",
      fields: {
        heading: { type: "text", label: "عنوان کاتالوگ" },
        subtitle: { type: "text", label: "زیرعنوان کاتالوگ" },
        limit: { type: "number", label: "حداکثر تعداد کالا" },
      },
      defaultProps: {
        heading: "کاتالوگ تجهیزات تخصصی و مانیتورها",
        subtitle: "تمامی کالاها با گارانتی اصالت طلایی عرضه می‌شوند",
        limit: 8,
      },
      render: ({ limit }) => (
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none py-4"
          dir="rtl"
        >
          <PuckProductListWrapper limit={limit} />
        </div>
      ),
    },

    NativeExplodedView: {
      label: "کالبدشکافی ۳D سخت‌افزار",
      fields: {
        productTitle: { type: "text", label: "نام محصول مدل ۳D" },
        sectionTitle: { type: "text", label: "تیتر بخش" },
      },
      defaultProps: {
        productTitle: "Apple Studio Display 5K Retina",
        sectionTitle: "کالبدشکافی لایه‌های سخت‌افزاری",
      },
      render: ({ productTitle }) => (
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none py-4"
          dir="rtl"
        >
          <ProductExplodedView
            productTitle={productTitle || "Apple Studio Display 5K"}
          />
        </div>
      ),
    },

    RichTextBlock: {
      label: "بلوک محتوا و متن آزاد",
      fields: {
        title: { type: "text", label: "عنوان بخش" },
        content: { type: "textarea", label: "متن کامل یا توضیحات" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" },
      },
      defaultProps: {
        title: "درباره خدمات و تعهدات ما",
        content: "متن کامل این بخش را اینجا وارد نمایید...",
        bgColor: "transparent",
      },
      render: ({ title, content, bgColor }) => (
        <section style={{ backgroundColor: bgColor || "transparent" }} className="max-w-5xl mx-auto px-4 py-8 font-sans select-none text-white space-y-4" dir="rtl">
          {title && <h2 className="text-2xl font-black text-center">{title}</h2>}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-sm leading-loose text-slate-300 whitespace-pre-line text-justify">
            {content}
          </div>
        </section>
      ),
    },

    FeaturesGridBlock: {
      label: "گرید ۳ ستونه ویژگی‌ها و خدمات",
      fields: {
        heading: { type: "text", label: "عنوان گرید" },
        col1Title: { type: "text", label: "عنوان ستون اول" },
        col1Desc: { type: "textarea", label: "توضیح ستون اول" },
        col2Title: { type: "text", label: "عنوان ستون دوم" },
        col2Desc: { type: "textarea", label: "توضیح ستون دوم" },
        col3Title: { type: "text", label: "عنوان ستون سوم" },
        col3Desc: { type: "textarea", label: "توضیح ستون سوم" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" },
      },
      defaultProps: {
        heading: "مزایای خرید و استانداردهای آکسون",
        col1Title: "🛡️ گارانتی ۱۸ ماهه طلایی",
        col1Desc: "تضمین اصالت فیزیکی و تعویض بی قید و شرط قطعات.",
        col2Title: "🚀 ارسال سریع پیشتاز",
        col2Desc: "بسته‌بندی ضربه‌گیر ویژه هوانوردی با پوشش کامل بیمه مرسوله.",
        col3Title: "🎨 کالیبراسیون تخصصی",
        col3Desc: "تنظیم دقیق گاموت‌های رنگی سینمایی DCI-P3 قبل از تحویل.",
        bgColor: "transparent",
      },
      render: ({ heading, col1Title, col1Desc, col2Title, col2Desc, col3Title, col3Desc, bgColor }) => (
        <section style={{ backgroundColor: bgColor || "transparent" }} className="max-w-7xl mx-auto px-4 py-8 font-sans select-none text-white space-y-6" dir="rtl">
          {heading && <h2 className="text-2xl font-black text-center">{heading}</h2>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2">
              <h3 className="font-bold text-base text-sky-400">{col1Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{col1Desc}</p>
            </div>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2">
              <h3 className="font-bold text-base text-sky-400">{col2Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{col2Desc}</p>
            </div>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2">
              <h3 className="font-bold text-base text-sky-400">{col3Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{col3Desc}</p>
            </div>
          </div>
        </section>
      ),
    },

    GlobalFooterBlock: {
      label: "فوتر ۴ ستونه کامل و سازمانی",
      fields: {
        footerLogoUrl: { type: "text", label: "آدرس تصویر لوگوی فوتر (URL)" },
        brandTitle: { type: "text", label: "تیتر برند در فوتر" },
        brandSubtitle: { type: "text", label: "زیرعنوان برند" },
        brandDesc: { type: "textarea", label: "متن معرفی گارانتی" },
        supportPhone: { type: "text", label: "شماره تلفن پشتیبانی" },
        supportEmail: { type: "text", label: "پست الکترونیک" },
        warehouseAddress: { type: "text", label: "نشانی انبار" },
        workingHours: { type: "text", label: "ساعات پاسخگویی" },
        enamadCode: { type: "text", label: "کد اینماد" },
        copyrightText: { type: "text", label: "متن کپی‌رایت" },
        footerBg: {
          type: "custom",
          render: ({ value, onChange }) => (
            <ColorPickerCustomField
              label="رنگ پس‌زمینه فوتر"
              value={value}
              onChange={onChange}
            />
          ),
        },
      },
      defaultProps: {
        footerLogoUrl: "",
        brandTitle: "Axon | آکسون",
        brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
        brandDesc:
          "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
        supportPhone: "09376110200",
        supportEmail: "Pouriarahimi@yahoo.com",
        warehouseAddress: "شیراز - ستارخان",
        workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: "27424534",
        copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
        footerBg: "#07090e",
      },
      render: ({
        footerLogoUrl,
        brandTitle,
        brandSubtitle,
        brandDesc,
        supportPhone,
        supportEmail,
        warehouseAddress,
        workingHours,
        enamadCode,
        copyrightText,
        footerBg,
      }) => (
        <footer
          style={{ backgroundColor: footerBg || "#07090e" }}
          className="w-full border-t border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none text-white mt-16"
          dir="rtl"
        >
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shadow-md p-1 shrink-0">
                      {footerLogoUrl ? (
                        <img
                          src={footerLogoUrl}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                          ▲
                        </div>
                      )}
                    </div>
                    <h3 className="font-black text-2xl text-white">
                      {brandTitle}
                    </h3>
                  </div>
                  <p className="text-xs font-bold text-sky-400">
                    {brandSubtitle}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    {brandDesc}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black">
                    ✓ گارانتی اصالت ۱۰۰٪ فیزیکی
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-black">
                    🚀 ارسال پیشتاز سراسری
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-white">دسترسی سریع</h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-400">
                  <li>
                    <Link
                      href="/products"
                      className="hover:text-sky-400 transition"
                    >
                      کاتالوگ کالاها
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/track-order"
                      className="hover:text-sky-400 transition"
                    >
                      سامانه رهگیری مرسولات
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/news"
                      className="hover:text-sky-400 transition"
                    >
                      جدیدترین اخبار تکنولوژی
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/blog"
                      className="hover:text-sky-400 transition"
                    >
                      مجله مقالات تخصصی
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-white">خدمات مشتریان</h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-400">
                  <li>
                    <Link
                      href="/contact"
                      className="hover:text-sky-400 transition"
                    >
                      ثبت تیکت مشاوره
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="hover:text-sky-400 transition"
                    >
                      شرایط گارانتی طلایی
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="hover:text-sky-400 transition"
                    >
                      ضمانت بازگشت وجه ۷ روزه
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/blog"
                      className="hover:text-sky-400 transition"
                    >
                      راهنمای کالیبراسیون ۵K
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <h4 className="font-black text-sm text-white">
                  اطلاعات تماس و دفتر
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        تلفن پشتیبانی:
                      </span>
                      <span className="font-mono font-black text-slate-200">
                        {supportPhone}
                      </span>
                    </div>
                    <span>📞</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        پست الکترونیک:
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {supportEmail}
                      </span>
                    </div>
                    <span>✉️</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        نشانی تحویل و انبار:
                      </span>
                      <span className="font-bold text-slate-200">
                        {warehouseAddress}
                      </span>
                    </div>
                    <span>📍</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-200">
                        نماد اعتماد الکترونیکی
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        کد: {enamadCode}
                      </span>
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
      ),
    },
  },
};
`;
writeFile("lib/puckConfig.tsx", puckConfigContent);

// =============================================================================
// ۲. بازنویسی components/admin/AdminModularPages.tsx با قالب اختصاصی هر صفحه و دکمه ساخت صفحه جدید
// =============================================================================
const studioFullMultiPageCode = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const STORAGE_PREFIX = "axon_puck_page_data_v2026_";

// قالب پیش‌فرض اختصاصی برای هر صفحه خاص
function getInitialDataForSlug(slug: string, title?: string): Data {
  const commonHeader = {
    type: "HeaderCapsuleBar",
    props: {
      id: "header-capsule-" + slug,
      brandText: "Axon | آکسون",
      logoUrl: "",
      logoWidth: 36,
      logoHeight: 36,
      menu1Text: "کاتالوگ محصولات",
      menu1Url: "/products",
      menu2Text: "اخبار تکنولوژی",
      menu2Url: "/news",
      menu3Text: "مجله سئو",
      menu3Url: "/blog",
      menu4Text: "پیگیری سفارش",
      menu4Url: "/track-order",
      menu5Text: "تماس با ما",
      menu5Url: "/contact",
      showCart: true,
      showTheme: true,
      showUser: true,
      capsuleBg: "#07090e",
      capsuleBorder: "#27272a"
    }
  };

  const commonFooter = {
    type: "GlobalFooterBlock",
    props: {
      id: "footer-" + slug,
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
    }
  };

  if (slug === "products") {
    return {
      content: [
        commonHeader,
        {
          type: "NativeProductCatalog",
          props: {
            id: "catalog-page-main",
            heading: "کاتالوگ جامع مانیتورها و تجهیزات تصویر",
            subtitle: "دارای گارانتی اصالت طلایی و ارسال سریع پیشتاز به سراسر کشور",
            limit: 12
          }
        },
        commonFooter
      ],
      root: { props: { title: "کاتالوگ محصولات" } }
    };
  }

  if (slug === "about") {
    return {
      content: [
        commonHeader,
        {
          type: "RichTextBlock",
          props: {
            id: "about-rich-text",
            title: "درباره آکسون استودیو (Axon Core)",
            content: "مجموعه آکسون مرجع تخصصی تامین، کالیبراسیون و مشاوره تجهیزات پیشرفته تصویر، مانیتورهای تدوین رنگ ۵K و ۴K، کارت‌های کپچر و ابزارهای حرفه‌ای استودیو در ایران است.\\n\\nتعهد ما ارائه کالاهای ۱۰۰٪ اورجینال با گارانتی اصالت طلایی، تضمین بهترین قیمت بازار و ارسال سریع پیشتاز به سراسر کشور با بسته‌بندی ضدضربه استودیویی است.",
            bgColor: "transparent"
          }
        },
        {
          type: "FeaturesGridBlock",
          props: {
            id: "about-features",
            heading: "استانداردهای مهندسی و خدمات طلایی آکسون",
            col1Title: "🛡️ گارانتی اصالت طلایی",
            col1Desc: "تضمین ۱۰۰٪ اصالت فیزیکی قطعات و مهلت تست ۷ روزه بازگشت وجه.",
            col2Title: "🚀 ارسال ایمن هوانوردی",
            col2Desc: "بسته‌بندی ضربه‌گیر ویژه تجهیزات حساس اپتیکال با پوشش کامل بیمه.",
            col3Title: "🎨 کالیبراسیون ۳D LUT",
            col3Desc: "تست سلامت پنل و تطبیق با طیف رنگی سینمایی DCI-P3.",
            bgColor: "transparent"
          }
        },
        commonFooter
      ],
      root: { props: { title: "درباره ما" } }
    };
  }

  if (slug === "contact") {
    return {
      content: [
        commonHeader,
        {
          type: "RichTextBlock",
          props: {
            id: "contact-intro",
            title: "تماس با واحد مشاوره و پشتیبانی آکسون",
            content: "برای دریافت مشاوره تخصصی در خصوص انتخاب مانیتورهای ۵K، کارت‌های کپچر و هماهنگی فاکتور رسمی می‌توانید با شماره‌های پشتیبانی تماس حاصل فرمایید یا از طریق شبکه‌های اجتماعی با کارشناسان ما در ارتباط باشید.",
            bgColor: "transparent"
          }
        },
        commonFooter
      ],
      root: { props: { title: "تماس با ما" } }
    };
  }

  if (slug === "track-order") {
    return {
      content: [
        commonHeader,
        {
          type: "RichTextBlock",
          props: {
            id: "track-order-intro",
            title: "سامانه رهگیری لحظه‌ای مرسولات پستی",
            content: "کد رهگیری ۲۴ رقمی پیامک‌شده را در این قسمت وارد نمایید تا آخرین وضعیت ارسال بسته پستی خود را به صورت آنلاین مشاهده کنید.",
            bgColor: "transparent"
          }
        },
        commonFooter
      ],
      root: { props: { title: "پیگیری سفارش" } }
    };
  }

  // صفحه اصلی (خانه)
  if (slug === "home") {
    return {
      content: [
        commonHeader,
        {
          type: "NativeHero3D",
          props: {
            id: "hero-1",
            topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
            badgeColor: "#38bdf8",
            title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
            titleSize: 42,
            subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
            bgColor: "transparent"
          }
        },
        {
          type: "NativePerspectiveSlider",
          props: {
            id: "slider-1",
            sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
            sectionSubtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی"
          }
        },
        {
          type: "NativeProductCatalog",
          props: {
            id: "catalog-1",
            heading: "کاتالوگ تجهیزات تخصصی و مانیتورها",
            subtitle: "تمامی کالاها با گارانتی اصالت طلایی عرضه می‌شوند",
            limit: 8
          }
        },
        {
          type: "NativeExplodedView",
          props: {
            id: "exploded-1",
            productTitle: "Apple Studio Display 5K Retina",
            sectionTitle: "کالبدشکافی لایه‌های سخت‌افزاری"
          }
        },
        commonFooter
      ],
      root: { props: { title: "صفحه اصلی" } }
    };
  }

  // هر صفحه جدید و سفارشی دیگر
  return {
    content: [
      commonHeader,
      {
        type: "RichTextBlock",
        props: {
          id: "custom-page-" + slug,
          title: title || "صفحه جدید",
          content: "محتوای این صفحه را از سایدبار سمت راست ویرایش کنید یا بلوک‌های دلخواه را به آن اضافه نمایید.",
          bgColor: "transparent"
        }
      },
      commonFooter
    ],
    root: { props: { title: title || slug } }
  };
}

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data | null>(null);
  const [renderKey, setRenderKey] = useState<string>("init");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // استیت مدال ایجاد صفحه جدید
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const loadPage = async (slug: string, customTitle?: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();

    let targetData: Data | null = null;

    // ۱. بررسی کش کلاینت
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(STORAGE_PREFIX + slug);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && Array.isArray(parsed.content) && parsed.content.length > 0) {
            targetData = parsed;
          }
        }
      } catch {}
    }

    // ۲. بررسی دیتابیس
    try {
      const res = await fetch("/api/pages?slug=" + encodeURIComponent(slug), { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page && json.page.puck_data && Array.isArray(json.page.puck_data.content) && json.page.puck_data.content.length > 0) {
        targetData = json.page.puck_data;
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(targetData));
        }
      }
    } catch {}

    // ۳. در صورت نبودن دیتای ذخیره‌شده، لود قالب اختصاصی همان صفحه
    if (!targetData) {
      targetData = getInitialDataForSlug(slug, customTitle);
    }

    setPageData(targetData);
    setRenderKey(slug + "_" + Date.now());
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار و ذخیره تغییرات...");

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_PREFIX + currentSlug, JSON.stringify(data));
      } catch {}
    }
    setPageData(data);

    try {
      const currentPageObj = pages.find((p) => p.slug === currentSlug);
      const pageTitle = currentPageObj?.title || currentSlug;

      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: pageTitle,
          puck_data: data,
          is_published: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setToast("✓ صفحه «" + pageTitle + "» با موفقیت ذخیره و منتشر شد.");
        fetchPages();

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("puck_published"));
        }
      } else {
        setToast("هشدار: در مرورگر ثبت شد، خطا در سرور: " + (json.message || ""));
      }
    } catch {
      setToast("✓ تغییرات به صورت محلی ذخیره شد.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleCreateNewPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageSlug.trim()) return;

    soundEngine.playSuccess();
    const cleanSlug = newPageSlug.trim().toLowerCase().replace(/\\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const title = newPageTitle.trim();

    const newPageObj = { id: "page_" + Date.now(), slug: cleanSlug, title };
    setPages((prev) => [...prev, newPageObj]);

    setShowNewPageModal(false);
    setNewPageTitle("");
    setNewPageSlug("");

    // بارگذاری فوری صفحه جدید در ویرایشگر
    loadPage(cleanSlug, title);
    setToast("✓ صفحه جدید «" + title + "» ایجاد شد. اکنون می‌توانید چیدمان آن را تکمیل و Publish کنید.");
    setTimeout(() => setToast(null), 4000);
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : "/" + currentSlug;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ استودیو با منوی انتخاب صفحه و دکمه ساخت صفحه جدید */}
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
                <option key={p.id || p.slug} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => { soundEngine.playClick(); setShowNewPageModal(true); }}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black shadow-md cursor-pointer transition flex items-center gap-1"
          >
            <span>➕</span>
            <span>ایجاد صفحه جدید</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده این صفحه</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      {/* مدال ساخت صفحه جدید */}
      {showNewPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn font-sans" dir="rtl">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 shadow-2xl text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm text-sky-500 flex items-center gap-2">
                <span>➕</span> ایجاد صفحه سفارشی جدید
              </h3>
              <button
                type="button"
                onClick={() => setShowNewPageModal(false)}
                className="w-7 h-7 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewPage} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">عنوان فارسی صفحه *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شرایط گارانتی و خدمات"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">آدرس انگلیسی / نامک (Slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: warranty-terms"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">آدرس نهایی صفحه: axoncore.ir/{newPageSlug.trim() || "slug"}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowNewPageModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--input-bg)] text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-md transition cursor-pointer"
                >
                  ایجاد و باز کردن در ویرایشگر ←
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* بوم Puck */}
      <div className="w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[880px]">
        {loading || !pageData ? (
          <div className="py-32 text-center text-xs font-bold text-slate-400">در حال آماده‌سازی صفحه...</div>
        ) : (
          <Puck
            key={renderKey}
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
writeFile("components/admin/AdminModularPages.tsx", studioFullMultiPageCode);

// =============================================================================
// ۳. رندر خودکار صفحات مدولار در app/[slug]/page.tsx
// =============================================================================
const modularSlugPageRoute = `import React from "react";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseServer";
import ModularPageRenderer from "@/components/modular/ModularPageRenderer";

export const dynamic = "force-dynamic";

export default async function DynamicSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cleanSlug = String(slug || "").trim().toLowerCase();

  const { data: pageRecord } = await supabaseAdmin
    .from("modular_pages")
    .select("*")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (pageRecord && pageRecord.puck_data && pageRecord.puck_data.content?.length > 0) {
    return <ModularPageRenderer initialPage={pageRecord} slug={cleanSlug} />;
  }

  notFound();
}
`;
writeFile("app/[slug]/page.tsx", modularSlugPageRoute);

// =============================================================================
// ۴. بیلد نهایی پروژه و انتشار در Vercel
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync("git config --global http.sslBackend openssl", { stdio: "inherit" });
  execSync("git add -A", { stdio: "inherit" });
  execSync(
    'git commit -m "feat(puck-pages): independent page layouts for catalog/about/contact and add custom page creator"',
    { stdio: "inherit" }
  );

  let branchName = "main";
  try {
    branchName =
      execSync("git rev-parse --abbrev-ref HEAD").toString().trim() || "main";
  } catch {
    branchName = "main";
  }
  execSync("git push origin " + branchName, { stdio: "inherit" });
  console.log("\x1b[32m✔ قابلیت ویرایش مجزای تمام صفحات و ساخت صفحه جدید مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}