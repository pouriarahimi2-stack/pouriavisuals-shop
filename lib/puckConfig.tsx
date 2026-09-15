import React, { useState, useEffect } from "react";
import type { Config } from "@measured/puck";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
import { productService, Product } from "@/services/productService";

// کامپوننت انتخابگر رنگ سفارشی بازگردانی‌شده
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
  GlobalHeaderMount: {};
  GlobalFooterMount: {};
  HeaderCapsuleBar: {
    brandText: string;
    logoUrl: string;
    logoWidth: number;
    logoHeight: number;
    menuItems?: Array<{ title: string; url: string; badge?: string }>;
    menu1Text?: string;
    menu1Url?: string;
    menu2Text?: string;
    menu2Url?: string;
    menu3Text?: string;
    menu3Url?: string;
    menu4Text?: string;
    menu4Url?: string;
    menu5Text?: string;
    menu5Url?: string;
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
    global_layout: {
      title: "🌐 چیدمان سراسری ویترین",
      components: ["GlobalHeaderMount", "GlobalFooterMount"],
    },
    navigation: {
      title: "🧭 ناوبری هدر و فوتر مستقل",
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
    GlobalHeaderMount: {
      label: "هدر سراسری سایت (تنظیمات از استودیوی ظاهر)",
      fields: {},
      render: () => <Header />,
    },
    GlobalFooterMount: {
      label: "فوتر سراسری سایت (تنظیمات از استودیوی ظاهر)",
      fields: {},
      render: () => <Footer />,
    },
    HeaderCapsuleBar: {
      label: "هدر کپسولی اختصاصی این صفحه",
      fields: {
        brandText: { type: "text", label: "نام برند" },
        logoUrl: { type: "text", label: "آدرس تصویر لوگو (URL)" },
        logoWidth: { type: "number", label: "عرض لوگو (px)" },
        logoHeight: { type: "number", label: "ارتفاع لوگو (px)" },
        menuItems: {
          type: "array",
          label: "منوهای ناوبری",
          arrayFields: {
            title: { type: "text", label: "عنوان منو" },
            url: { type: "text", label: "لینک مقصد" },
            badge: { type: "text", label: "برچسب (اختیاری)" },
          },
          defaultItemProps: { title: "منوی جدید", url: "/" },
        },
        showCart: {
          type: "radio",
          label: "آیکون سبد خرید",
          options: [{ label: "فعال", value: true }, { label: "غیرفعال", value: false }],
        },
        showTheme: {
          type: "radio",
          label: "آیکون تغییر تم",
          options: [{ label: "فعال", value: true }, { label: "غیرفعال", value: false }],
        },
        showUser: {
          type: "radio",
          label: "آیکون پروفایل",
          options: [{ label: "فعال", value: true }, { label: "غیرفعال", value: false }],
        },
        capsuleBg: {
          type: "custom",
          render: ({ value, onChange }) => (
            <ColorPickerCustomField label="رنگ پس‌زمینه کپسول" value={value} onChange={onChange} />
          ),
        },
        capsuleBorder: {
          type: "custom",
          render: ({ value, onChange }) => (
            <ColorPickerCustomField label="رنگ خط دور کپسول" value={value} onChange={onChange} />
          ),
        },
      },
      defaultProps: {
        brandText: "Axon | آکسون",
        logoUrl: "",
        logoWidth: 36,
        logoHeight: 36,
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
        menuItems,
        menu1Text, menu1Url,
        menu2Text, menu2Url,
        menu3Text, menu3Url,
        menu4Text, menu4Url,
        menu5Text, menu5Url,
        showCart,
        showTheme,
        showUser,
        capsuleBg,
        capsuleBorder,
      }) => {
        const items = menuItems && menuItems.length > 0 ? menuItems : [
          { title: menu1Text, url: menu1Url },
          { title: menu2Text, url: menu2Url },
          { title: menu3Text, url: menu3Url },
          { title: menu4Text, url: menu4Url },
          { title: menu5Text, url: menu5Url },
        ].filter((m): m is { title: string; url: string } => Boolean(m.title && m.url));

        return (
          <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 my-2 select-none font-sans" dir="rtl">
            <div
              style={{ backgroundColor: capsuleBg || "#07090e", borderColor: capsuleBorder || "#27272a" }}
              className="flex items-center justify-between px-6 py-3 rounded-full border backdrop-blur-2xl shadow-2xl"
            >
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="" style={{ width: `${logoWidth || 36}px`, height: `${logoHeight || 36}px` }} className="object-contain" />
                ) : (
                  <span className="text-xl text-sky-400 font-black">⚡</span>
                )}
                <span className="font-black text-sm text-white">{brandText}</span>
              </div>

              <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-300">
                {items.map((item, idx) => (
                  <Link key={idx} href={item.url} className="hover:text-sky-400 transition">
                    {item.title}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                {showTheme && <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs">🌙</span>}
                {showUser && <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs">👤</span>}
                {showCart && <span className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">🛍️</span>}
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
        badgeColor: {
          type: "custom",
          render: ({ value, onChange }) => (
            <ColorPickerCustomField label="رنگ برچسب بالا" value={value} onChange={onChange} />
          ),
        },
        title: { type: "text", label: "تیتر اصلی هیرو" },
        titleSize: { type: "number", label: "اندازه تیتر اصلی (px)" },
        subtitle: { type: "textarea", label: "متن توضیحات زیرعنوان" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" },
      },
      defaultProps: {
        topBadge: "🚀 جدیدترین تجهیزات و تصویر استودیو",
        badgeColor: "#38bdf8",
        title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
        titleSize: 42,
        subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با گارانتی اصالت طلایی.",
        bgColor: "transparent",
      },
      render: ({ topBadge, badgeColor, title, titleSize, subtitle, bgColor }) => (
        <section style={{ backgroundColor: bgColor || "transparent" }} className="w-full relative overflow-hidden select-none font-sans text-white text-center py-6" dir="rtl">
          <div className="max-w-4xl mx-auto space-y-4 px-4 relative z-10">
            {topBadge && (
              <span style={{ color: badgeColor || "#38bdf8" }} className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-black inline-block">
                {topBadge}
              </span>
            )}
            <h1 style={{ fontSize: (titleSize || 42) + "px" }} className="font-black leading-tight text-white">
              {title}
            </h1>
            {subtitle && <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">{subtitle}</p>}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none py-4" dir="rtl">
          <ProductPerspectiveSlider customTitle={sectionTitle} customSubtitle={sectionSubtitle} />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none py-4" dir="rtl">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none py-4" dir="rtl">
          <ProductExplodedView productTitle={productTitle || "Apple Studio Display 5K"} />
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
        col1Title: "🛡️ گارانتی اصالت طلایی",
        col1Desc: "تضمین اصالت فیزیکی و تست سلامت سخت‌افزاری.",
        col2Title: "🚀 ارسال سریع پیشتاز",
        col2Desc: "بسته‌بندی ضدضربه ویژه با پوشش بیمه کامل مرسوله.",
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
            <ColorPickerCustomField label="رنگ پس‌زمینه فوتر" value={value} onChange={onChange} />
          ),
        },
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
        enamadCode: "7434404",
        copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
        footerBg: "#07090e",
      },
      render: ({ footerLogoUrl, brandTitle, brandSubtitle, brandDesc, supportPhone, supportEmail, warehouseAddress, enamadCode, copyrightText, footerBg }) => (
        <footer style={{ backgroundColor: footerBg || "#07090e" }} className="w-full border-t border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none text-white mt-16" dir="rtl">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  {footerLogoUrl ? <img src={footerLogoUrl} alt="" className="h-12 object-contain" /> : <span className="text-2xl text-sky-400 font-black">⚡</span>}
                  <div>
                    <h3 className="font-black text-lg">{brandTitle}</h3>
                    <p className="text-xs text-sky-400">{brandSubtitle}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed text-justify">{brandDesc}</p>
              </div>
              <div className="md:col-span-3 space-y-2 text-xs">
                <span className="font-bold text-white block">اطلاعات تماس:</span>
                <p>تلفن: {supportPhone}</p>
                <p>ایمیل: {supportEmail}</p>
                <p>نشانی: {warehouseAddress}</p>
              </div>
              <div className="md:col-span-4 flex justify-end">
                <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-white/10">
                  <img src="https://trustseal.enamad.ir/logo.aspx?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD" alt="اینماد" className="w-20 h-20 object-contain" />
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-white/10 text-xs text-slate-500 text-center">
              <p>{copyrightText}</p>
            </div>
          </div>
        </footer>
      ),
    },
  },
};
