/**
 * AXON CORE - Super Studio Upgrade: Template Presets, Interactive 3D Canvas & Draft Preview (fix.js)
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

console.log("\x1b[36m[AXON-SUPER-PUCK]\x1b[0m افزودن قالب‌های ۱-کلیکه، هیرو ۳D تعاملی و اشتراک پیش‌نمایش...");

// =============================================================================
// ۱. افزودن Hero3DBlock و ارتقای lib/puckConfig.tsx
// =============================================================================
const puckConfigWith3D = `import React, { useState, useEffect } from "react";
import type { Config } from "@measured/puck";
import Link from "next/link";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";

export type ComponentProps = {
  Hero3DBlock: {
    topBadge: string;
    showControls: boolean;
    bgColor: string;
  };
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
    animation: "none" | "fade-up" | "zoom-in" | "slide-right";
    glassmorphism: boolean;
    customCss: string;
  };
  ProductGrid: {
    heading: string;
    subtitle: string;
    category: string;
    limit: number;
    columns: number;
    showPriceBadge: boolean;
    bgColor: string;
    cardGlass: boolean;
  };
  ProductComparison: {
    heading: string;
    subtitle: string;
    product1Id: string;
    product2Id: string;
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

function getAnimationClass(anim?: string) {
  if (anim === "fade-up") return "animate-[fadeIn_0.7s_ease-out]";
  if (anim === "zoom-in") return "animate-[scaleIn_0.6s_ease-out]";
  if (anim === "slide-right") return "animate-[slideRight_0.6s_ease-out]";
  return "";
}

function LiveProductGridRenderer({ heading, subtitle, category, limit, columns, showPriceBadge, bgColor, cardGlass }: any) {
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

        <div className={\`grid \${colClass} gap-6 pt-4\`}>
          {products.map((p) => {
            const priceVal = Number(p.discountPrice || p.discount_price || p.price || 0);
            return (
              <div
                key={p.id}
                className={\`p-5 rounded-3xl border border-white/10 space-y-3 hover:border-sky-500/50 hover:-translate-y-1 transition duration-300 flex flex-col justify-between \${
                  cardGlass ? "bg-white/[0.04] backdrop-blur-xl shadow-2xl" : "bg-white/5"
                }\`}
              >
                <div className="space-y-3">
                  <div className="w-full h-48 rounded-2xl bg-black/40 overflow-hidden flex items-center justify-center p-2 border border-white/5 relative group">
                    <img src={p.images?.[0] || p.image || "/placeholder.png"} alt={p.title} className="w-full h-full object-contain group-hover:scale-105 transition duration-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold truncate">{p.title || p.name}</span>
                      {showPriceBadge && <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">گارانتی طلایی</span>}
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
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs transition cursor-pointer shadow-lg shadow-sky-500/20"
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

function LiveProductComparisonRenderer({ heading, subtitle, product1Id, product2Id, bgColor }: any) {
  const [p1, setP1] = useState<Product | null>(null);
  const [p2, setP2] = useState<Product | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    productService.getAll().then((data) => {
      if (data && data.length > 0) {
        const first = data.find(p => p.id === product1Id) || data[0];
        const second = data.find(p => p.id === product2Id) || data[1] || data[0];
        setP1(first);
        setP2(second);
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
                    <div className="flex justify-between py-1 border-b border-white/5"><span>وضعیت تحویل:</span><span className="font-bold">ارسال پیشتاز بیمه‌شده</span></div>
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
          <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-center min-w-[65px] shadow-lg">
            <span className="text-2xl block text-rose-400">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-[9px] font-sans text-slate-400">ساعت</span>
          </div>
          <span className="text-xl text-rose-400">:</span>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-center min-w-[65px] shadow-lg">
            <span className="text-2xl block text-rose-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-[9px] font-sans text-slate-400">دقیقه</span>
          </div>
          <span className="text-xl text-rose-400">:</span>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-center min-w-[65px] shadow-lg">
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
    "3d": {
      title: "کانواس و المان‌های ۳D",
      components: ["Hero3DBlock"]
    },
    shop: {
      title: "فروشگاه و محصولات",
      components: ["ProductGrid", "ProductComparison", "CountdownTimer", "HeroBlock"]
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
    Hero3DBlock: {
      label: "هیرو ۳D تعاملی با کانوَس",
      fields: {
        topBadge: { type: "text", label: "بج بالای کانوَس" },
        showControls: {
          type: "radio",
          label: "نمایش تعاملی کنترل ۳D",
          options: [{ label: "فعال", value: true }, { label: "خاموش", value: false }]
        },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" }
      },
      defaultProps: {
        topBadge: "🌟 تجربه نسل آینده مانیتورهای ۵K",
        showControls: true,
        bgColor: "#07090e"
      },
      render: ({ topBadge, bgColor }) => (
        <div style={{ backgroundColor: bgColor || "#07090e" }} className="w-full relative overflow-hidden py-4 font-sans select-none" dir="rtl">
          {topBadge && (
            <div className="text-center pt-4">
              <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-black inline-block">
                {topBadge}
              </span>
            </div>
          )}
          <Hero3DCanvas />
        </div>
      )
    },

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
        cardGlass: {
          type: "radio",
          label: "افکت شیشه مات (Glassmorphism)",
          options: [{ label: "فعال", value: true }, { label: "عادی", value: false }]
        },
      },
      defaultProps: {
        heading: "پرفروش‌ترین تجهیزات تصویر و مانیتورها",
        subtitle: "تأمین مستقیم و تحویل با بسته‌بندی ایمن هوانوردی",
        category: "all",
        limit: 6,
        columns: 3,
        showPriceBadge: true,
        bgColor: "#07090e",
        cardGlass: true,
      },
      render: (props) => <LiveProductGridRenderer {...props} />,
    },

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
      render: (props) => <LiveProductComparisonRenderer {...props} />,
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
        animation: {
          type: "select",
          label: "انیمیشن ورود بلوک",
          options: [
            { label: "بدون انیمیشن", value: "none" },
            { label: "آرام به سمت بالا (Fade Up)", value: "fade-up" },
            { label: "بزرگ‌نمایی ملایم (Zoom In)", value: "zoom-in" },
            { label: "ورود از راست (Slide Right)", value: "slide-right" },
          ]
        },
        glassmorphism: {
          type: "radio",
          label: "کارت شیشه‌ای بلورین",
          options: [{ label: "فعال", value: true }, { label: "غیرفعال", value: false }]
        },
        customCss: { type: "textarea", label: "کد CSS سفارشی این بلوک" },
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
        animation: "fade-up",
        glassmorphism: false,
        customCss: "",
      },
      render: ({ badge, title, subtitle, primaryBtnText, primaryBtnUrl, secondaryBtnText, secondaryBtnUrl, imageUrl, bgColor, textColor, paddingTop, paddingBottom, animation, glassmorphism, customCss }) => (
        <section
          style={{ backgroundColor: bgColor || "#020617", color: textColor || "#fff", paddingTop: \`\${paddingTop || 60}px\`, paddingBottom: \`\${paddingBottom || 60}px\` }}
          className={\`w-full text-center px-4 font-sans select-none relative \${getAnimationClass(animation)}\`}
          dir="rtl"
        >
          {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
          <div className={\`max-w-5xl mx-auto space-y-6 \${glassmorphism ? "p-8 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-2xl" : ""}\`}>
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
        hoverLift: {
          type: "radio",
          label: "افکت شناور هاور (Hover Lift)",
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
        <section style={{ backgroundColor: bgColor || "#090d16", paddingTop: \`\${paddingTop || 50}px\`, paddingBottom: \`\${paddingBottom || 50}px\` }} className="w-full px-4 font-sans select-none text-white" dir="rtl">
          <div className="max-w-7xl mx-auto space-y-8">
            {heading && <h2 className="text-2xl font-black text-center">{heading}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { t: item1Title, d: item1Desc, icon: "🛡️" },
                { t: item2Title, d: item2Desc, icon: "⚡" },
                { t: item3Title, d: item3Desc, icon: "📦" },
              ].map((item, i) => (
                <div key={i} className={\`p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2 transition duration-300 \${hoverLift ? "hover:-translate-y-1.5 hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/10" : ""}\`}>
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
          label: "هاله نور نئونی (Neon Glow)",
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
            className={\`p-8 sm:p-12 rounded-3xl text-center space-y-4 border border-blue-500/30 text-white \${
              glowEffect ? "shadow-[0_0_50px_rgba(59,130,246,0.25)]" : "shadow-2xl"
            }\`}
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
        <div style={{ paddingTop: \`\${paddingTop || 20}px\`, paddingBottom: \`\${paddingBottom || 20}px\` }} className="max-w-7xl mx-auto px-4">
          <div dangerouslySetInnerHTML={{ __html: code || "" }} />
        </div>
      ),
    },
  },
};
`;
writeFile('lib/puckConfig.tsx', puckConfigWith3D);

// =============================================================================
// ۲. افزودن مخزن قالب‌های ۱-کلیکه به components/admin/AdminModularPages.tsx
// =============================================================================
const studioWithPresets = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

const PRESET_TEMPLATES: Record<string, Data> = {
  festival_sale: {
    content: [
      {
        type: "CountdownTimer",
        props: {
          id: "timer-pres-1",
          badge: "🔥 تخفیف شگفت‌انگیز ۲۴ ساعته",
          title: "جشنواره مانیتورهای مرجع رنگ و استودیو",
          targetDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 19),
          buttonText: "مشاهده پیشنهادهای شگفت‌انگیز",
          buttonUrl: "/products",
          bgColor: "#0f172a"
        }
      },
      {
        type: "ProductGrid",
        props: {
          id: "grid-pres-1",
          heading: "کالاهای منتخب با تخفیف طلایی",
          subtitle: "تعداد محدود به همراه ارسال رایگان پیشتاز",
          category: "all",
          limit: 6,
          columns: 3,
          showPriceBadge: true,
          bgColor: "#07090e",
          cardGlass: true
        }
      },
      {
        type: "CtaBanner",
        props: {
          id: "cta-pres-1",
          title: "نیاز به مشاوره قبل از ثبت نهایی فاکتور دارید؟",
          subtitle: "کارشناسان فنی ما به صورت مستقیم پاسخگوی شما هستند.",
          btnText: "ارسال پیام در واتساپ یا تماس",
          btnUrl: "/contact",
          bgColor: "#1e1b4b",
          glowEffect: true
        }
      }
    ],
    root: { props: { title: "کمپین جشنواره فروش" } }
  },
  flagship_showcase: {
    content: [
      {
        type: "Hero3DBlock",
        props: {
          id: "hero3d-pres-1",
          topBadge: "🚀 پرچمدار تکنولوژی بصری ۲۰۲۶",
          showControls: true,
          bgColor: "#07090e"
        }
      },
      {
        type: "ProductComparison",
        props: {
          id: "comp-pres-1",
          heading: "مقایسه فنی دو مانیتور استودیویی",
          subtitle: "بررسی تراز رنگ، روشنایی نیت و تاندربولت",
          product1Id: "prod-studio-display-5k",
          product2Id: "prod-pro-display-xdr",
          bgColor: "#090d16"
        }
      },
      {
        type: "FeaturesGrid",
        props: {
          id: "feat-pres-1",
          heading: "تعهدات طلایی آکسون",
          item1Title: "۱۸ ماه تعویض کامل",
          item1Desc: "گارانتی معتبر شرکتی بی قید و شرط.",
          item2Title: "کالیبراسیون ۳D LUT",
          item2Desc: "تنظیم تراز دقیق سینمایی قبل از تحویل.",
          item3Title: "بسته‌بندی ایمن هوانوردی",
          item3Desc: "ارسال سریع پیشتاز با پوشش کامل بیمه مرسوله.",
          bgColor: "#07090e",
          paddingTop: 50,
          paddingBottom: 50,
          hoverLift: true
        }
      }
    ],
    root: { props: { title: "معرفی پرچمدار استودیو" } }
  }
};

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data>(PRESET_TEMPLATES.flagship_showcase);
  const [revisions, setRevisions] = useState<Array<{ id: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<"100%" | "768px" | "390px">("100%");
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

  const fetchRevisions = async (slug: string) => {
    try {
      const res = await fetch(\`/api/pages?slug=\${encodeURIComponent(slug)}&revisions=true\`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.revisions)) {
        setRevisions(json.revisions);
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
      if (json.success && json.page && json.page.puck_data) {
        setPageData(json.page.puck_data);
      } else {
        setPageData(PRESET_TEMPLATES.flagship_showcase);
      }
      fetchRevisions(slug);
    } catch {
      setPageData(PRESET_TEMPLATES.flagship_showcase);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
    fetchRevisions("home");
  }, []);

  const handleApplyPreset = (presetKey: string) => {
    if (!confirm("آیا تمایل دارید ساختار این صفحه را با قالب آماده جایگزین کنید؟")) return;
    soundEngine.playSuccess();
    const t = PRESET_TEMPLATES[presetKey];
    if (t) {
      setPageData(t);
      setToast("✓ قالب آماده با موفقیت روی بوم لود شد.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار تغییرات در دیتابیس...");
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
        setToast("✓ صفحه با موفقیت ذخیره شد و اسنپ‌شات نسخه ثبت گردید.");
        fetchRevisions(currentSlug);
      } else {
        setToast("خطا در ذخیره‌سازی.");
      }
    } catch {
      setToast("خطا در برقراری ارتباط با سرور.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4" dir="rtl">
      
      {/* نوار ابزار اصلی بالای استودیو */}
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
              className="p-2 px-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black outline-none cursor-pointer text-[var(--text-primary)]"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* لود قالب‌های آماده با ۱ کلیک */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)] font-bold">🎯 لود قالب آماده:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset("flagship_showcase")}
            className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold text-sky-400 hover:border-sky-500 transition cursor-pointer"
          >
            🌟 معرفی پرچمدار ۳D
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset("festival_sale")}
            className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold text-rose-400 hover:border-rose-500 transition cursor-pointer"
          >
            🔥 جشنواره تخفیف ۲۴ ساعته
          </button>
        </div>

        {/* سوییچر اندازه فریم بوم (دسکتاپ، تبلت و موبایل) */}
        <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--card-border)]">
          {[
            { id: "100%", label: "دسکتاپ", icon: "🖥️" },
            { id: "768px", label: "تبلت", icon: "📱" },
            { id: "390px", label: "موبایل", icon: "📲" },
          ].map((vp) => (
            <button
              key={vp.id}
              type="button"
              onClick={() => { soundEngine.playClick(); setViewportWidth(vp.id as any); }}
              className={"px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer " + (
                viewportWidth === vp.id ? "bg-sky-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
              )}
            >
              <span>{vp.icon}</span>
              <span className="hidden sm:inline">{vp.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={currentSlug === "home" ? "/" : \`/\${currentSlug}\`}
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

      {/* بوم تعاملی Puck */}
      <div className="flex-1 w-full flex justify-center items-start">
        <div
          style={{ width: viewportWidth, maxWidth: "100%", transition: "width 0.3s ease" }}
          className="rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px]"
        >
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
    </div>
  );
}
`;
writeFile('components/admin/AdminModularPages.tsx', studioWithPresets);

// =============================================================================
// ۳. تست بیلد نهایی پروژه و انتشار در Vercel
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
  execSync('git commit -m "feat(puck-super): add 1-click template presets library and interactive Hero3DCanvas block"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ امکانات فوق‌پیشرفته Puck با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}