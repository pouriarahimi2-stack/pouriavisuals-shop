import React, { useState, useEffect } from "react";
import type { Config } from "@measured/puck";
import Link from "next/link";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";

export type ComponentProps = {
  HeaderModularBlock: {
    brandName: string;
    brandLogoText: string;
    menuItems: Array<{ label: string; href: string }>;
    showCartIcon: boolean;
    showThemeIcon: boolean;
    showUserIcon: boolean;
    headerBg: string;
    capsuleBorder: string;
  };
  Hero3DModularBlock: {
    badgeText: string;
    badgeColor: string;
    title: string;
    subtitle: string;
    ctaButtonText: string;
    ctaButtonUrl: string;
    canvasHeight: number;
  };
  PerspectiveSliderModularBlock: {
    sectionTitle: string;
    sectionSubtitle: string;
    slides: Array<{
      title: string;
      subtitle: string;
      badge: string;
      imageUrl: string;
      linkUrl: string;
      priceText: string;
    }>;
  };
  ProductCatalogModularBlock: {
    catalogTitle: string;
    catalogSubtitle: string;
    limit: number;
    columns: number;
  };
  ExplodedViewModularBlock: {
    targetProductTitle: string;
    badgeTitle: string;
    boxBg: string;
  };
  FooterModularBlock: {
    brandTitle: string;
    brandSubtitle: string;
    bioDescription: string;
    badge1: string;
    badge2: string;
    quickLinks: Array<{ label: string; href: string }>;
    customerServiceLinks: Array<{ label: string; href: string }>;
    phone: string;
    email: string;
    warehouseAddress: string;
    workingHours: string;
    enamadCode: string;
    copyright: string;
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
    header_footer: {
      title: "🧭 ناوبری، هدر و فوتر اتمیک",
      components: ["HeaderModularBlock", "FooterModularBlock"]
    },
    main_sections: {
      title: "⭐ بخش‌های اصلی و سه‌بعدی صفحه",
      components: ["Hero3DModularBlock", "PerspectiveSliderModularBlock", "ProductCatalogModularBlock", "ExplodedViewModularBlock"]
    }
  },
  components: {
    // ۱. هدر اتمیک با امکان افزودن نامحدود منو و تغییر رنگ و ظاهر
    HeaderModularBlock: {
      label: "هدر کپسولی (ویرایش کامل منوها، لوگو و دکمه‌ها)",
      fields: {
        brandName: { type: "text", label: "عنوان متنی برند" },
        brandLogoText: { type: "text", label: "کاراکتر لوگو (مثلا ▲)" },
        menuItems: {
          type: "array",
          label: "منوهای ناوبری (افزودن / ویرایش / حذف منو)",
          arrayFields: {
            label: { type: "text", label: "عنوان منو" },
            href: { type: "text", label: "آدرس لینک (URL)" }
          },
          getItemSummary: (item) => item.label || "منوی جدید"
        },
        showCartIcon: {
          type: "radio",
          label: "نمایش آیکون سبد خرید",
          options: [{ label: "بله", value: true }, { label: "خیر", value: false }]
        },
        showThemeIcon: {
          type: "radio",
          label: "نمایش آیکون دارک‌مود",
          options: [{ label: "بله", value: true }, { label: "خیر", value: false }]
        },
        showUserIcon: {
          type: "radio",
          label: "نمایش آیکون پروفایل",
          options: [{ label: "بله", value: true }, { label: "خیر", value: false }]
        },
        headerBg: { type: "text", label: "رنگ پس‌زمینه کپسول (Hex یا rgba)" },
        capsuleBorder: { type: "text", label: "رنگ خط دور کپسول" }
      },
      defaultProps: {
        brandName: "Axon | آکسون",
        brandLogoText: "▲",
        menuItems: [
          { label: "کاتالوگ محصولات", href: "/products" },
          { label: "اخبار تکنولوژی", href: "/news" },
          { label: "مجله سئو", href: "/blog" },
          { label: "پیگیری سفارش", href: "/track-order" },
          { label: "تماس با ما", href: "/contact" },
        ],
        showCartIcon: true,
        showThemeIcon: true,
        showUserIcon: true,
        headerBg: "rgba(7, 9, 14, 0.85)",
        capsuleBorder: "rgba(255, 255, 255, 0.1)"
      },
      render: ({ brandName, brandLogoText, menuItems, showCartIcon, showThemeIcon, showUserIcon, headerBg, capsuleBorder }) => (
        <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 my-2 select-none font-sans" dir="rtl">
          <div
            style={{ backgroundColor: headerBg || "rgba(7, 9, 14, 0.85)", borderColor: capsuleBorder || "rgba(255, 255, 255, 0.1)" }}
            className="flex items-center justify-between px-6 py-3 rounded-full border backdrop-blur-2xl shadow-2xl transition-all"
          >
            <div className="flex items-center gap-2">
              {showCartIcon && (
                <Link href="/cart" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 hover:scale-105 transition">
                  🛒
                </Link>
              )}
              {showThemeIcon && (
                <button type="button" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 hover:scale-105 transition">
                  🌙
                </button>
              )}
              {showUserIcon && (
                <Link href="/login" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 hover:scale-105 transition">
                  👤
                </Link>
              )}
            </div>

            <nav className="hidden lg:flex items-center gap-7 text-xs font-black text-slate-300">
              {(menuItems || []).map((m, idx) => (
                <Link key={idx} href={m.href || "/"} className="hover:text-sky-400 transition">
                  {m.label}
                </Link>
              ))}
            </nav>

            <Link href="/" className="flex items-center gap-3">
              <span className="font-black text-base sm:text-lg tracking-tight text-white">
                {brandName}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs">
                {brandLogoText || "▲"}
              </div>
            </Link>
          </div>
        </header>
      )
    },

    // ۲. هیرو ۳D با ویرایش متن، تیتر، دکمه و ارتفاع
    Hero3DModularBlock: {
      label: "هیرو ۳D (ویرایش تیتر، برچسب، دکمه و مدل ۳D)",
      fields: {
        badgeText: { type: "text", label: "متن برچسب بالای هیرو" },
        badgeColor: { type: "text", label: "رنگ متن برچسب" },
        title: { type: "text", label: "تیتر اصلی هیرو" },
        subtitle: { type: "textarea", label: "زیرعنوان و توضیحات" },
        ctaButtonText: { type: "text", label: "متن دکمه اصلی" },
        ctaButtonUrl: { type: "text", label: "لینک دکمه اصلی" },
        canvasHeight: { type: "number", label: "ارتفاع کانوَس (px)" }
      },
      defaultProps: {
        badgeText: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        badgeColor: "#38bdf8",
        title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
        subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای ۵K با ۱۸ ماه گارانتی طلایی",
        ctaButtonText: "ورود به کاتالوگ مانیتورها",
        ctaButtonUrl: "/products",
        canvasHeight: 520
      },
      render: ({ badgeText, badgeColor, title, subtitle, ctaButtonText, ctaButtonUrl, canvasHeight }) => (
        <section className="w-full relative overflow-hidden select-none py-6 font-sans text-white text-center" dir="rtl">
          <div className="max-w-4xl mx-auto space-y-4 relative z-10 px-4">
            {badgeText && (
              <span style={{ color: badgeColor || "#38bdf8" }} className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-black inline-block">
                {badgeText}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-black leading-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
            {ctaButtonText && (
              <div className="pt-2">
                <Link href={ctaButtonUrl || "/products"} className="inline-block px-8 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-xl transition">
                  {ctaButtonText} ←
                </Link>
              </div>
            )}
          </div>
          <div style={{ height: `${canvasHeight || 520}px` }} className="w-full relative overflow-hidden mt-4">
            <Hero3DCanvas />
          </div>
        </section>
      )
    },

    // ۳. اسلایدر پرسپکتیو با ویرایش دانه به دانه اسلایدها و عکس‌ها
    PerspectiveSliderModularBlock: {
      label: "اسلایدر پرسپکتیو ۳D (ویرایش آزاد اسلایدها و تصاویر)",
      fields: {
        sectionTitle: { type: "text", label: "تیتر بخش اسلایدر" },
        sectionSubtitle: { type: "text", label: "زیرعنوان بخش" },
        slides: {
          type: "array",
          label: "اسلایدهای بنر (افزودن / تغییر عکس و لینک)",
          arrayFields: {
            title: { type: "text", label: "عنوان کالا در اسلاید" },
            subtitle: { type: "text", label: "توضیح کوتاه" },
            badge: { type: "text", label: "بج نئونی (مثلا آفر ویژه)" },
            imageUrl: { type: "text", label: "آدرس تصویر (URL)" },
            linkUrl: { type: "text", label: "لینک صفحه کالا" },
            priceText: { type: "text", label: "قیمت نمایشی" }
          },
          getItemSummary: (item) => item.title || "اسلاید بنر"
        }
      },
      defaultProps: {
        sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
        sectionSubtitle: "پیمایش جهت بررسی دقیق مشخصات و گارانتی",
        slides: [
          {
            title: "Apple Studio Display 27 5K",
            subtitle: "پنل رتینا با کالیبراسیون ۳D LUT",
            badge: "پرچمدار",
            imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
            linkUrl: "/products",
            priceText: "۱۲۸,۵۰۰,۰۰۰ تومان"
          },
          {
            title: "Apple Pro Display XDR 32 6K",
            subtitle: "روشنایی ۱۶۰۰ نیت و وضوح خیره‌کننده 6K",
            badge: "استودیوی حرفه‌ای",
            imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
            linkUrl: "/products",
            priceText: "۲۴۵,۰۰۰,۰۰۰ تومان"
          }
        ]
      },
      render: ({ sectionTitle, sectionSubtitle, slides }) => (
        <section className="max-w-7xl mx-auto px-4 py-8 font-sans select-none text-white space-y-6" dir="rtl">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black">{sectionTitle}</h2>
            <p className="text-xs text-slate-400">{sectionSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {(slides || []).map((slide, idx) => (
              <div key={idx} className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3 hover:border-sky-500/40 transition flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-full h-44 rounded-2xl bg-black/40 overflow-hidden flex items-center justify-center p-2 border border-white/5 relative">
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-4xl">🖥️</span>
                    )}
                    {slide.badge && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold border border-sky-500/30">
                        {slide.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{slide.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{slide.subtitle}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="font-mono text-emerald-400 font-black text-xs">{slide.priceText}</span>
                  <Link href={slide.linkUrl || "/products"} className="px-4 py-1.5 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 transition">
                    خرید کالا ←
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )
    },

    // ۴. ویترین کاتالوگ کالاها
    ProductCatalogModularBlock: {
      label: "ویترین کاتالوگ کالاها (تعداد ستون و کالا)",
      fields: {
        catalogTitle: { type: "text", label: "عنوان ویترین کاتالوگ" },
        catalogSubtitle: { type: "text", label: "توضیح کوتاه" },
        limit: { type: "number", label: "حداکثر تعداد کالا" },
        columns: { type: "number", label: "تعداد ستون‌ها (۲، ۳ یا ۴)" }
      },
      defaultProps: {
        catalogTitle: "کاتالوگ تجهیزات تخصصی و مانیتورها",
        catalogSubtitle: "تمامی کالاها با گارانتی اصالت طلایی و تست سلامت فیزیکی عرضه می‌شوند",
        limit: 6,
        columns: 3
      },
      render: ({ catalogTitle, catalogSubtitle, limit }) => (
        <section className="max-w-7xl mx-auto px-4 py-8 font-sans select-none text-white space-y-4" dir="rtl">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black">{catalogTitle}</h2>
            <p className="text-xs text-slate-400">{catalogSubtitle}</p>
          </div>
          <PuckProductListWrapper limit={limit} />
        </section>
      )
    },

    // ۵. کالبدشکافی ۳D
    ExplodedViewModularBlock: {
      label: "کالبدشکافی ۳D سخت‌افزار (انتخاب محصول)",
      fields: {
        targetProductTitle: { type: "text", label: "نام محصول مدل ۳D" },
        badgeTitle: { type: "text", label: "برچسب بالا" },
        boxBg: { type: "text", label: "رنگ پس‌زمینه باکس" }
      },
      defaultProps: {
        targetProductTitle: "Apple Studio Display 5K Retina",
        badgeTitle: "🧬 کالبدشکافی تخصصی لایه‌ها",
        boxBg: "transparent"
      },
      render: ({ targetProductTitle, badgeTitle, boxBg }) => (
        <div style={{ backgroundColor: boxBg || "transparent" }} className="max-w-7xl mx-auto px-4 py-6 font-sans select-none" dir="rtl">
          <ProductExplodedView productTitle={targetProductTitle || "Apple Studio Display 5K"} />
        </div>
      )
    },

    // ۶. فوتر اتمیک کامل با کنترل تک‌تک ستون‌ها و کارت‌های تماس
    FooterModularBlock: {
      label: "فوتر ۴ ستونه (ویرایش کامل تلفن، آدرس، نمادها و لینک‌ها)",
      fields: {
        brandTitle: { type: "text", label: "تیتر برند در فوتر" },
        brandSubtitle: { type: "text", label: "زیرعنوان برند" },
        bioDescription: { type: "textarea", label: "شرح فعالیت و گارانتی" },
        badge1: { type: "text", label: "نشان گارانتی اول" },
        badge2: { type: "text", label: "نشان گارانتی دوم" },
        phone: { type: "text", label: "شماره تلفن پشتیبانی" },
        email: { type: "text", label: "پست الکترونیک" },
        warehouseAddress: { type: "text", label: "نشانی انبار و تحویل" },
        workingHours: { type: "text", label: "ساعات پاسخگویی" },
        enamadCode: { type: "text", label: "کد نماد اعتماد (اینماد)" },
        copyright: { type: "text", label: "متن کپی‌رایت" },
        quickLinks: {
          type: "array",
          label: "لینک‌های ستون دسترسی سریع",
          arrayFields: {
            label: { type: "text", label: "عنوان لینک" },
            href: { type: "text", label: "آدرس مقصد" }
          },
          getItemSummary: (item) => item.label || "لینک"
        },
        customerServiceLinks: {
          type: "array",
          label: "لینک‌های ستون خدمات مشتریان",
          arrayFields: {
            label: { type: "text", label: "عنوان لینک" },
            href: { type: "text", label: "آدرس مقصد" }
          },
          getItemSummary: (item) => item.label || "لینک"
        }
      },
      defaultProps: {
        brandTitle: "Axon | آکسون",
        brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
        bioDescription: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
        badge1: "✓ گارانتی اصالت ۱۰۰٪ فیزیکی",
        badge2: "🚀 ارسال پیشتاز سراسری",
        phone: "09376110200",
        email: "Pouriarahimi@yahoo.com",
        warehouseAddress: "شیراز - ستارخان",
        workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: "27424534",
        copyright: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
        quickLinks: [
          { label: "کاتالوگ کالاها", href: "/products" },
          { label: "سامانه رهگیری مرسولات", href: "/track-order" },
          { label: "جدیدترین اخبار تکنولوژی", href: "/news" },
          { label: "مجله مقالات تخصصی", href: "/blog" },
          { label: "درباره آکسون", href: "/about" },
        ],
        customerServiceLinks: [
          { label: "ثبت تیکت مشاوره", href: "/contact" },
          { label: "شرایط گارانتی طلایی", href: "/about" },
          { label: "ضمانت بازگشت وجه ۷ روزه", href: "/about" },
          { label: "راهنمای کالیبراسیون ۵K", href: "/blog" },
        ]
      },
      render: ({ brandTitle, brandSubtitle, bioDescription, badge1, badge2, phone, email, warehouseAddress, workingHours, enamadCode, copyright, quickLinks, customerServiceLinks }) => (
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
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">{bioDescription}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black">
                    {badge1}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-black">
                    {badge2}
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
                  {(quickLinks || []).map((l, i) => (
                    <li key={i}><Link href={l.href || "/"} className="hover:text-sky-400 transition">{l.label}</Link></li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-white">خدمات مشتریان</h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-400">
                  {(customerServiceLinks || []).map((l, i) => (
                    <li key={i}><Link href={l.href || "/"} className="hover:text-sky-400 transition">{l.label}</Link></li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <h4 className="font-black text-sm text-white">اطلاعات تماس و دفتر</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">تلفن پشتیبانی:</span>
                      <span className="font-mono font-black text-slate-200">{phone}</span>
                    </div>
                    <span>📞</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">پست الکترونیک:</span>
                      <span className="font-mono font-bold text-slate-200">{email}</span>
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
              <p>{copyright}</p>
            </div>
          </div>
        </footer>
      )
    }
  }
};
