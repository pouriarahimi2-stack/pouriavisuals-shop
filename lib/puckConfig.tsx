import React, { useState, useEffect } from "react";
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
        <header style={{ paddingTop: `${paddingY || 10}px`, paddingBottom: `${paddingY || 10}px` }} className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 select-none font-sans" dir="ltr">
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
                style={{ width: `${logoWidth || 36}px`, height: `${logoHeight || 36}px` }}
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
          style={{ backgroundColor: bgColor || "transparent", paddingTop: `${paddingTop || 40}px`, paddingBottom: `${paddingBottom || 20}px` }}
          className="w-full relative overflow-hidden select-none font-sans text-white text-center"
          dir="rtl"
        >
          <div className="max-w-4xl mx-auto space-y-4 px-4 relative z-10">
            {topBadge && (
              <span style={{ color: badgeColor || "#38bdf8" }} className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-black inline-block">
                {topBadge}
              </span>
            )}
            <h1 style={{ fontSize: `${titleSize || 42}px` }} className="font-black leading-tight text-white">
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
        <div style={{ paddingTop: `${paddingY || 20}px`, paddingBottom: `${paddingY || 20}px` }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none" dir="rtl">
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
