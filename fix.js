/**
 * AXON CORE - Full Native Component Integration into Puck Editor (fix.js)
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

console.log("\x1b[36m[AXON-FULL-INTEGRATION]\x1b[0m اتصال تک‌تک اجزای اصلی سایت به موتور ویژوال Puck...");

// =============================================================================
// ۱. ارتقای lib/puckConfig.tsx با کامپوننت‌های واقعی سایت
// =============================================================================
const completeSitePuckConfig = `import React, { useState, useEffect } from "react";
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
        <div style={{ paddingTop: \`\${paddingY || 20}px\`, paddingBottom: \`\${paddingY || 20}px\` }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none" dir="rtl">
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
        <section style={{ backgroundColor: bgColor || "#090d16", paddingTop: \`\${paddingTop || 50}px\`, paddingBottom: \`\${paddingBottom || 50}px\` }} className="w-full px-4 font-sans select-none text-white" dir="rtl">
          <div className="max-w-7xl mx-auto space-y-8">
            {heading && <h2 className="text-2xl font-black text-center">{heading}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { t: item1Title, d: item1Desc, icon: "🛡️" },
                { t: item2Title, d: item2Desc, icon: "⚡" },
                { t: item3Title, d: item3Desc, icon: "📦" },
              ].map((item, i) => (
                <div key={i} className={\`p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2 transition duration-300 \${hoverLift ? "hover:-translate-y-1.5 hover:border-sky-500/50 hover:shadow-2xl" : ""}\`}>
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
        <div style={{ paddingTop: \`\${paddingTop || 20}px\`, paddingBottom: \`\${paddingBottom || 20}px\` }} className="max-w-7xl mx-auto px-4">
          <div dangerouslySetInnerHTML={{ __html: code || "" }} />
        </div>
      ),
    },
  },
};
`;
writeFile('lib/puckConfig.tsx', completeSitePuckConfig);

// =============================================================================
// ۲. تنظیم ساختار پیش‌فرض دقیق صفحه اصلی در components/admin/AdminModularPages.tsx
// =============================================================================
const studioFullEditorCode = `"use client";

import React, { useState, useEffect, useRef } from "react";
import { Puck, Render, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

// دقیقاً ساختار اورجینال و چشم‌نواز صفحه اول آکسون
const ORIGINAL_HOME_PUCK_DATA: Data = {
  content: [
    {
      type: "NativeHero3D",
      props: {
        id: "hero3d-home-core",
        topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        bgColor: "transparent"
      }
    },
    {
      type: "NativePerspectiveSlider",
      props: {
        id: "slider-home-core",
        paddingY: 20
      }
    },
    {
      type: "NativeProductCatalog",
      props: {
        id: "catalog-home-core",
        heading: "کاتالوگ تجهیزات تخصصی"
      }
    },
    {
      type: "NativeExplodedView",
      props: {
        id: "exploded-home-core",
        productTitle: "Apple Studio Display 5K Retina"
      }
    }
  ],
  root: { props: { title: "صفحه اصلی سایت" } }
};

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data>(ORIGINAL_HOME_PUCK_DATA);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "split" | "live_site">("split");
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
        setPageData(ORIGINAL_HOME_PUCK_DATA);
      }
    } catch {
      setPageData(ORIGINAL_HOME_PUCK_DATA);
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
        setToast("✓ صفحه با موفقیت ذخیره شد و روی ویترین سایت اعمال گردید.");
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
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4" dir="rtl">
      
      {/* نوار کنترل استودیو */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">صفحه جاری:</span>
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

        {/* سوییچر حالت‌های نمایش */}
        <div className="flex items-center gap-1.5 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--card-border)]">
          {[
            { id: "editor", label: "محیط ویرایشگر", icon: "✏️" },
            { id: "split", label: "نمای هم‌زمان (Split View)", icon: "👁️" },
            { id: "live_site", label: "پیش‌نمایش سایت", icon: "🌐" },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => { soundEngine.playClick(); setViewMode(mode.id as any); }}
              className={"px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer " + (
                viewMode === mode.id ? "bg-sky-500 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              <span>{mode.icon}</span>
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>

        {/* سوییچر اندازه فریم بوم */}
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
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      {/* بوم دوگانه استودیو */}
      <div className="flex-1 w-full min-h-[750px] flex gap-4 items-start">
        {loading ? (
          <div className="w-full py-32 text-center text-xs font-bold text-slate-400">در حال آماده‌سازی بخش‌های صفحه...</div>
        ) : (
          <>
            {(viewMode === "editor" || viewMode === "split") && (
              <div className={\`rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px] transition-all duration-300 \${viewMode === "split" ? "w-1/2" : "w-full"}\`}>
                <div className="p-2.5 bg-black/40 border-b border-white/10 px-4 text-xs font-bold text-sky-400 flex items-center gap-2">
                  <span>🛠️ پنل ویرایش اجزای صفحه اصلی (درگ، حذف، جابجایی و ویرایش)</span>
                </div>
                <Puck
                  config={puckConfig}
                  data={pageData}
                  onChange={(newData) => setPageData(newData)}
                  onPublish={handleSave}
                />
              </div>
            )}

            {(viewMode === "split" || viewMode === "live_site") && (
              <div className={\`rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px] flex flex-col transition-all duration-300 \${viewMode === "split" ? "w-1/2" : "w-full"}\`}>
                <div className="p-2.5 bg-black/40 border-b border-white/10 px-4 text-xs font-bold text-emerald-400 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>پیش‌نمایش بلادرنگ تغییرات صفحه اصلی</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{targetLiveUrl}</span>
                </div>

                <div className="flex-1 w-full bg-[#07090e] overflow-y-auto p-4 flex justify-center">
                  <div
                    style={{ width: viewportWidth, maxWidth: "100%", transition: "width 0.3s ease" }}
                    className="rounded-2xl border border-white/5 overflow-hidden shadow-2xl bg-black min-h-[700px]"
                  >
                    <Render config={puckConfig} data={pageData} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
`;
writeFile('components/admin/AdminModularPages.tsx', studioFullEditorCode);

// =============================================================================
// ۳. اتصال هوشمند app/page.tsx به دیتابیس Puck (با حفظ فال‌بک اورجینال)
// =============================================================================
const dynamicHomePageCode = `import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import ModularPageRenderer from "@/components/modular/ModularPageRenderer";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
import { productService } from "@/services/productService";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // واکشی چیدمان ذخیره‌شده از صفحه ساز
  const { data: pageRecord } = await supabaseAdmin
    .from("modular_pages")
    .select("*")
    .eq("slug", "home")
    .maybeSingle();

  // اگر صفحه در Puck ویرایش و ذخیره شده باشد، با موتور اختصاصی رندر می‌شود
  if (pageRecord && pageRecord.puck_data && pageRecord.puck_data.content?.length > 0) {
    return <ModularPageRenderer initialPage={pageRecord} slug="home" />;
  }

  // در غیر این صورت، چیدمان اورجینال و دست‌نخورده سایت رندر می‌شود
  const products = await productService.getAll();
  const sampleProduct = products[0] || {
    id: "prod-studio-display-5k",
    title: "Apple Studio Display 27 5K Retina",
    price: 128500000,
    category: "مانیتور استودیو"
  };

  return (
    <div className="w-full flex flex-col font-sans select-none text-[var(--text-primary)] space-y-12 md:space-y-16 overflow-x-hidden pb-12" dir="rtl">
      <Hero3DCanvas />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ProductPerspectiveSlider />
      </div>
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ProductList initialProducts={products} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ProductExplodedView productTitle={sampleProduct.title || "Apple Studio Display 5K"} />
      </div>
    </div>
  );
}
`;
writeFile('app/page.tsx', dynamicHomePageCode);

// =============================================================================
// ۴. تست بیلد نهایی پروژه و انتشار در Vercel
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
  execSync('git commit -m "feat(puck-native-core): expose 100% native site components (Hero3D, PerspectiveSlider, ProductList, ExplodedView) to visual builder"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ اتصال کامل اجزای اصلی سایت به صفحه ساز با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}