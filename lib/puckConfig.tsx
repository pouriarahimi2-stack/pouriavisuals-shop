import React, { useState, useEffect } from "react";
import type { Config } from "@measured/puck";
import Link from "next/link";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

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
  ProductGrid: {
    heading: string;
    subtitle: string;
    category: string;
    limit: number;
    columns: number;
    showPriceBadge: boolean;
    bgColor: string;
  };
  CountdownTimer: {
    badge: string;
    title: string;
    targetDate: string;
    buttonText: string;
    buttonUrl: string;
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
  };
  CustomHtml: {
    code: string;
    paddingTop: number;
    paddingBottom: number;
  };
};

function LiveProductGridRenderer({ heading, subtitle, category, limit, columns, showPriceBadge, bgColor }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    productService.getAll().then((data) => {
      if (data && data.length > 0) {
        let filtered = data;
        if (category && category !== "all") {
          filtered = data.filter((p) => (p.category || "").toLowerCase().includes(category.toLowerCase()));
        }
        setProducts(filtered.slice(0, limit || 6));
      }
    });
  }, [category, limit]);

  const colClass = columns === 2 ? "grid-cols-1 sm:grid-cols-2" : columns === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3";

  return (
    <section style={{ backgroundColor: bgColor || "#07090e" }} className="w-full py-12 px-4 font-sans select-none text-white" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black">{heading || "محصولات برگزیده استودیو"}</h2>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        <div className={`grid ${colClass} gap-6 pt-4`}>
          {products.map((p) => {
            const priceVal = Number(p.discountPrice || p.discount_price || p.price || 0);
            return (
              <div key={p.id} className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3 hover:border-sky-500/40 transition flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-full h-48 rounded-2xl bg-black/40 overflow-hidden flex items-center justify-center p-2 border border-white/5">
                    <img src={p.images?.[0] || p.image || "/placeholder.png"} alt={p.title} className="w-full h-full object-contain hover:scale-105 transition duration-300" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold truncate">{p.title || p.name}</span>
                      {showPriceBadge && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">گارانتی طلایی</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 block">{p.category || "تجهیزات تخصصی"}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="font-mono text-emerald-400 font-black text-xs">
                    {priceVal.toLocaleString("fa-IR")} تومان
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playAddToCart();
                      addToCart({
                        id: p.id,
                        title: p.title,
                        price: priceVal,
                        image: p.images?.[0] || p.image,
                        stock: p.stock ?? 10
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs transition cursor-pointer shadow-md"
                  >
                    خرید مستقیم 🛒
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LiveCountdownRenderer({ badge, title, targetDate, buttonText, buttonUrl, bgColor }: any) {
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
}

export const puckConfig: Config<ComponentProps> = {
  categories: {
    shop: {
      title: "فروشگاه و محصولات",
      components: ["ProductGrid", "CountdownTimer", "HeroBlock"]
    },
    content: {
      title: "محتوا و اعتمادسازی",
      components: ["FeaturesGrid", "FaqAccordion", "CtaBanner"]
    },
    advanced: {
      title: "پیشرفته و کدنویسی",
      components: ["CustomHtml"]
    }
  },
  components: {
    ProductGrid: {
      label: "ویترین زنده محصولات دیتابیس",
      fields: {
        heading: { type: "text", label: "عنوان ویترین" },
        subtitle: { type: "text", label: "زیرعنوان ویترین" },
        category: {
          type: "select",
          label: "فیلتر دسته کالا",
          options: [
            { label: "همه کالاها", value: "all" },
            { label: "مانیتور و تصویر", value: "مانیتور" },
            { label: "لپ‌تاپ و مک‌بوک", value: "مک" },
            { label: "ساعت هوشمند", value: "ساعت" },
            { label: "تبلت و آیپد", value: "آیپد" },
          ]
        },
        limit: { type: "number", label: "حداکثر تعداد کالا" },
        columns: { type: "number", label: "تعداد ستون‌ها (۲، ۳ یا ۴)" },
        showPriceBadge: {
          type: "radio",
          label: "نمایش برچسب گارانتی",
          options: [{ label: "بله", value: true }, { label: "خیر", value: false }]
        },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" },
      },
      defaultProps: {
        heading: "پرفروش‌ترین تجهیزات تصویر و مانیتورها",
        subtitle: "تأمین مستقیم و تحویل با بسته‌بندی ایمن هوانوردی",
        category: "all",
        limit: 6,
        columns: 3,
        showPriceBadge: true,
        bgColor: "#07090e",
      },
      render: (props) => <LiveProductGridRenderer {...props} />,
    },

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
      render: (props) => <LiveCountdownRenderer {...props} />,
    },

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
      render: ({ badge, title, subtitle, primaryBtnText, primaryBtnUrl, secondaryBtnText, secondaryBtnUrl, imageUrl, bgColor, textColor, paddingTop, paddingBottom }) => (
        <section
          style={{ backgroundColor: bgColor || "#020617", color: textColor || "#fff", paddingTop: `${paddingTop || 60}px`, paddingBottom: `${paddingBottom || 60}px` }}
          className="w-full text-center px-4 font-sans select-none relative"
          dir="rtl"
        >
          <div className="max-w-5xl mx-auto space-y-6">
            {badge && <span className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold">{badge}</span>}
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">{title}</h1>
            {subtitle && <p className="text-sm sm:text-base opacity-80 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {primaryBtnText && <Link href={primaryBtnUrl || "/products"} className="px-8 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-xl transition">{primaryBtnText}</Link>}
              {secondaryBtnText && <Link href={secondaryBtnUrl || "/contact"} className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-xs transition">{secondaryBtnText}</Link>}
            </div>
            {imageUrl && (
              <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden mt-8 shadow-2xl border border-white/10">
                <img src={imageUrl} alt="" className="w-full h-auto object-cover max-h-[480px]" />
              </div>
            )}
          </div>
        </section>
      ),
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
      render: ({ heading, item1Title, item1Desc, item2Title, item2Desc, item3Title, item3Desc, bgColor, paddingTop, paddingBottom }) => (
        <section style={{ backgroundColor: bgColor || "#090d16", paddingTop: `${paddingTop || 50}px`, paddingBottom: `${paddingBottom || 50}px` }} className="w-full px-4 font-sans select-none text-white" dir="rtl">
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
      ),
    },

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
                  <div key={idx} onClick={() => setOpen(open === idx ? null : idx)} className="p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer transition">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span>{it.q}</span>
                      <span className="text-sky-400">{open === idx ? "▲" : "▼"}</span>
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
      render: ({ title, subtitle, btnText, btnUrl, bgColor }) => (
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
      ),
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
      render: ({ code, paddingTop, paddingBottom }) => (
        <div style={{ paddingTop: `${paddingTop || 20}px`, paddingBottom: `${paddingBottom || 20}px` }} className="max-w-7xl mx-auto px-4">
          <div dangerouslySetInnerHTML={{ __html: code || "" }} />
        </div>
      ),
    },
  },
};
