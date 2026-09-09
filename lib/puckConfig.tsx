import React from "react";
import type { Config } from "@measured/puck";
import Link from "next/link";

export type ComponentProps = {
  HeroBlock: {
    badge: string;
    title: string;
    subtitle: string;
    primaryBtnText: string;
    primaryBtnUrl: string;
    secondaryBtnText: string;
    secondaryBtnUrl: string;
    imageUrl: string;
    bgColor: string;
    textColor: string;
    paddingTop: number;
    paddingBottom: number;
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
  };
  CtaBanner: {
    title: string;
    subtitle: string;
    btnText: string;
    btnUrl: string;
    bgColor: string;
  };
  CustomHtml: {
    code: string;
    paddingTop: number;
    paddingBottom: number;
  };
};

export const puckConfig: Config<ComponentProps> = {
  categories: {
    layout: {
      title: "بلوک‌های اصلی لایه‌بندی",
      components: ["HeroBlock", "FeaturesGrid", "CtaBanner"]
    },
    custom: {
      title: "المان‌های پیشرفته و کد",
      components: ["CustomHtml"]
    }
  },
  components: {
    HeroBlock: {
      label: "هیرو بنر بزرگ استودیویی",
      fields: {
        badge: { type: "text", label: "برچسب بالا (Badge)" },
        title: { type: "text", label: "تیتر اصلی هیرو" },
        subtitle: { type: "textarea", label: "متن توضیحات زیرعنوان" },
        primaryBtnText: { type: "text", label: "متن دکمه اول" },
        primaryBtnUrl: { type: "text", label: "لینک دکمه اول" },
        secondaryBtnText: { type: "text", label: "متن دکمه دوم" },
        secondaryBtnUrl: { type: "text", label: "لینک دکمه دوم" },
        imageUrl: { type: "text", label: "آدرس تصویر شاخص" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" },
        textColor: { type: "text", label: "رنگ متن" },
        paddingTop: { type: "number", label: "فاصله از بالا (px)" },
        paddingBottom: { type: "number", label: "فاصله از پایین (px)" },
      },
      defaultProps: {
        badge: "🚀 مرجع تخصصی مانیتورهای ۵K",
        title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
        subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
        primaryBtnText: "کاتالوگ مانیتورها",
        primaryBtnUrl: "/products",
        secondaryBtnText: "درخواست مشاوره",
        secondaryBtnUrl: "/contact",
        imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        bgColor: "#020617",
        textColor: "#ffffff",
        paddingTop: 60,
        paddingBottom: 60,
      },
      render: ({ badge, title, subtitle, primaryBtnText, primaryBtnUrl, secondaryBtnText, secondaryBtnUrl, imageUrl, bgColor, textColor, paddingTop, paddingBottom }) => {
        return (
          <section
            style={{ backgroundColor: bgColor || "#020617", color: textColor || "#fff", paddingTop: `${paddingTop || 60}px`, paddingBottom: `${paddingBottom || 60}px` }}
            className="w-full text-center px-4 font-sans select-none relative"
            dir="rtl"
          >
            <div className="max-w-5xl mx-auto space-y-6">
              {badge && (
                <span className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold">
                  {badge}
                </span>
              )}
              <h1 className="text-3xl sm:text-5xl font-black leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-base opacity-80 max-w-2xl mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {primaryBtnText && (
                  <Link href={primaryBtnUrl || "/products"} className="px-8 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-xl transition">
                    {primaryBtnText}
                  </Link>
                )}
                {secondaryBtnText && (
                  <Link href={secondaryBtnUrl || "/contact"} className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-xs transition">
                    {secondaryBtnText}
                  </Link>
                )}
              </div>
              {imageUrl && (
                <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden mt-8 shadow-2xl border border-white/10">
                  <img src={imageUrl} alt="" className="w-full h-auto object-cover max-h-[480px]" />
                </div>
              )}
            </div>
          </section>
        );
      },
    },
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
      },
      render: ({ heading, item1Title, item1Desc, item2Title, item2Desc, item3Title, item3Desc, bgColor, paddingTop, paddingBottom }) => {
        return (
          <section
            style={{ backgroundColor: bgColor || "#090d16", paddingTop: `${paddingTop || 50}px`, paddingBottom: `${paddingBottom || 50}px` }}
            className="w-full px-4 font-sans select-none text-white"
            dir="rtl"
          >
            <div className="max-w-7xl mx-auto space-y-8">
              {heading && <h2 className="text-2xl font-black text-center">{heading}</h2>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { t: item1Title, d: item1Desc, icon: "🛡️" },
                  { t: item2Title, d: item2Desc, icon: "⚡" },
                  { t: item3Title, d: item3Desc, icon: "📦" },
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2 hover:border-sky-500/40 transition">
                    <span className="text-3xl block">{item.icon}</span>
                    <h3 className="font-bold text-sm">{item.t}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{item.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      },
    },
    CtaBanner: {
      label: "فراخوان عمل و کمپین (CTA)",
      fields: {
        title: { type: "text", label: "تیتر فراخوان" },
        subtitle: { type: "textarea", label: "متن زیرعنوان" },
        btnText: { type: "text", label: "متن دکمه" },
        btnUrl: { type: "text", label: "لینک دکمه" },
        bgColor: { type: "text", label: "رنگ باکس" },
      },
      defaultProps: {
        title: "به یک مشاوره تخصصی برای استودیو نیاز دارید؟",
        subtitle: "کارشناسان آکسون متناسب با نرم‌افزار شما مانیتور مناسب را پیشنهاد می‌دهند.",
        btnText: "ثبت تیکت مشاوره",
        btnUrl: "/contact",
        bgColor: "#1e1b4b",
      },
      render: ({ title, subtitle, btnText, btnUrl, bgColor }) => {
        return (
          <div className="max-w-7xl mx-auto px-4 py-8 font-sans select-none" dir="rtl">
            <div style={{ backgroundColor: bgColor || "#1e1b4b" }} className="p-8 sm:p-12 rounded-3xl text-center space-y-4 border border-blue-500/30 text-white shadow-2xl">
              <h2 className="text-2xl font-black">{title}</h2>
              {subtitle && <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">{subtitle}</p>}
              {btnText && (
                <div className="pt-2">
                  <Link href={btnUrl || "/contact"} className="inline-block px-8 py-3 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-slate-100 transition shadow-lg">
                    {btnText}
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
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
      render: ({ code, paddingTop, paddingBottom }) => {
        return (
          <div style={{ paddingTop: `${paddingTop || 20}px`, paddingBottom: `${paddingBottom || 20}px` }} className="max-w-7xl mx-auto px-4">
            <div dangerouslySetInnerHTML={{ __html: code || "" }} />
          </div>
        );
      },
    },
  },
};
