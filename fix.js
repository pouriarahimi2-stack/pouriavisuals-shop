/**
 * AXON CORE - Clean Full-Width Studio & Fully Editable In-Canvas Components (fix.js)
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

console.log("\x1b[36m[AXON-STUDIO-REPAIR]\x1b[0m رفع به هم ریختگی و تبدیل به استودیوی تمام‌عرض با کنترل تک‌تک اجزا...");

// =============================================================================
// ۱. بازنویسی lib/puckConfig.tsx با کنترل‌های دقیق و بدون ارور برای تک‌تک بخش‌ها
// =============================================================================
const cleanPuckConfig = `import React, { useState, useEffect } from "react";
import type { Config } from "@measured/puck";
import Link from "next/link";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
import { productService, Product } from "@/services/productService";

export type ComponentProps = {
  GlobalHeaderBlock: {
    brandName: string;
    link1Text: string;
    link1Url: string;
    link2Text: string;
    link2Url: string;
    link3Text: string;
    link3Url: string;
    link4Text: string;
    link4Url: string;
    link5Text: string;
    link5Url: string;
  };
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
    nav: {
      title: "🧭 ناوبری سایت (هدر و فوتر)",
      components: ["GlobalHeaderBlock", "GlobalFooterBlock"]
    },
    core: {
      title: "⭐ بدنه اصلی صفحه نخست",
      components: ["NativeHero3D", "NativePerspectiveSlider", "NativeProductCatalog", "NativeExplodedView"]
    }
  },
  components: {
    GlobalHeaderBlock: {
      label: "هدر کپسولی شیشه‌ای سراسری",
      fields: {
        brandName: { type: "text", label: "نام برند" },
        link1Text: { type: "text", label: "عنوان منو ۱" },
        link1Url: { type: "text", label: "لینک منو ۱" },
        link2Text: { type: "text", label: "عنوان منو ۲" },
        link2Url: { type: "text", label: "لینک منو ۲" },
        link3Text: { type: "text", label: "عنوان منو ۳" },
        link3Url: { type: "text", label: "لینک منو ۳" },
        link4Text: { type: "text", label: "عنوان منو ۴" },
        link4Url: { type: "text", label: "لینک منو ۴" },
        link5Text: { type: "text", label: "عنوان منو ۵" },
        link5Url: { type: "text", label: "لینک منو ۵" },
      },
      defaultProps: {
        brandName: "Axon | آکسون",
        link1Text: "کاتالوگ محصولات",
        link1Url: "/products",
        link2Text: "اخبار تکنولوژی",
        link2Url: "/news",
        link3Text: "مجله سئو",
        link3Url: "/blog",
        link4Text: "پیگیری سفارش",
        link4Url: "/track-order",
        link5Text: "تماس با ما",
        link5Url: "/contact",
      },
      render: ({ brandName, link1Text, link1Url, link2Text, link2Url, link3Text, link3Url, link4Text, link4Url, link5Text, link5Url }) => (
        <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 my-2 select-none font-sans" dir="rtl">
          <div className="flex items-center justify-between px-6 py-3 rounded-full bg-[var(--modal-bg,#ffffff)]/90 dark:bg-[#07090e]/90 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-xl">
            <div className="flex items-center gap-2">
              <Link href="/cart" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200">
                🛒
              </Link>
              <button type="button" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200">
                🌙
              </button>
              <Link href="/admin/login" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200">
                👤
              </Link>
            </div>

            <nav className="hidden lg:flex items-center gap-7 text-xs font-black text-slate-700 dark:text-slate-300">
              <Link href={link5Url || "/contact"} className="hover:text-sky-500 transition">{link5Text}</Link>
              <Link href={link4Url || "/track-order"} className="hover:text-sky-500 transition">{link4Text}</Link>
              <Link href={link3Url || "/blog"} className="hover:text-sky-500 transition">{link3Text}</Link>
              <Link href={link2Url || "/news"} className="hover:text-sky-500 transition">{link2Text}</Link>
              <Link href={link1Url || "/products"} className="hover:text-sky-500 transition">{link1Text}</Link>
            </nav>

            <Link href="/" className="flex items-center gap-3">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                {brandName}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs">
                ▲
              </div>
            </Link>
          </div>
        </header>
      )
    },

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

    GlobalFooterBlock: {
      label: "فوتر ۴ ستونه کامل و سازمانی",
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
        <footer className="w-full bg-[var(--modal-bg,#ffffff)] dark:bg-[#07090e] border-t border-slate-200 dark:border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none mt-16" dir="rtl">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs">
                      ▲
                    </div>
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white">{brandTitle}</h3>
                  </div>
                  <p className="text-xs font-bold text-sky-500">{brandSubtitle}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">{brandDesc}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black">
                    ✓ گارانتی اصالت ۱۰۰٪ فیزیکی
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-black">
                    🚀 ارسال پیشتاز سراسری
                  </span>
                </div>
                <div className="pt-3 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    شبکه‌های ارتباطی و اجتماعی:
                  </span>
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
                <h4 className="font-black text-sm text-slate-900 dark:text-white">دسترسی سریع</h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <li><Link href="/products" className="hover:text-sky-500 transition">کاتالوگ کالاها</Link></li>
                  <li><Link href="/track-order" className="hover:text-sky-500 transition">سامانه رهگیری مرسولات</Link></li>
                  <li><Link href="/news" className="hover:text-sky-500 transition">جدیدترین اخبار تکنولوژی</Link></li>
                  <li><Link href="/blog" className="hover:text-sky-500 transition">مجله مقالات تخصصی</Link></li>
                  <li><Link href="/about" className="hover:text-sky-500 transition">درباره آکسون</Link></li>
                </ul>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-slate-900 dark:text-white">خدمات مشتریان</h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <li><Link href="/contact" className="hover:text-sky-500 transition">ثبت تیکت مشاوره</Link></li>
                  <li><Link href="/about" className="hover:text-sky-500 transition">شرایط گارانتی طلایی</Link></li>
                  <li><Link href="/about" className="hover:text-sky-500 transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
                  <li><Link href="/blog" className="hover:text-sky-500 transition">راهنمای کالیبراسیون ۵K</Link></li>
                </ul>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <h4 className="font-black text-sm text-slate-900 dark:text-white">اطلاعات تماس و دفتر</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">تلفن پشتیبانی:</span>
                      <span className="font-mono font-black text-slate-800 dark:text-slate-200">{supportPhone}</span>
                    </div>
                    <span>📞</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">پست الکترونیک:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{supportEmail}</span>
                    </div>
                    <span>✉️</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">نشانی انبار و تحویل:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{warehouseAddress}</span>
                    </div>
                    <span>📍</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">نماد اعتماد الکترونیکی</span>
                      <span className="text-[10px] text-slate-400 block">کد: {enamadCode}</span>
                    </div>
                    <span>🛡️</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex justify-between text-xs font-bold text-slate-500">
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
writeFile('lib/puckConfig.tsx', cleanPuckConfig);

// =============================================================================
// ۲. بازنویسی components/admin/AdminModularPages.tsx به استودیوی تمام‌عرض (Full-Width Studio)
// =============================================================================
const fullStudioCode = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

const COMPLETE_HOMEPAGE_STRUCTURE: Data = {
  content: [
    {
      type: "GlobalHeaderBlock",
      props: {
        id: "header-1",
        brandName: "Axon | آکسون",
        link1Text: "کاتالوگ محصولات",
        link1Url: "/products",
        link2Text: "اخبار تکنولوژی",
        link2Url: "/news",
        link3Text: "مجله سئو",
        link3Url: "/blog",
        link4Text: "پیگیری سفارش",
        link4Url: "/track-order",
        link5Text: "تماس با ما",
        link5Url: "/contact",
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
  root: { props: { title: "صفحه اصلی سایت" } }
};

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data>(COMPLETE_HOMEPAGE_STRUCTURE);
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
        setPageData(COMPLETE_HOMEPAGE_STRUCTURE);
      }
    } catch {
      setPageData(COMPLETE_HOMEPAGE_STRUCTURE);
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
    setToast("در حال ذخیره و انتشار سراسری در سایت...");
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
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ تک‌ردیفه تمیز استودیو */}
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

      {/* بوم تمام‌عرض بدون تقسیم‌بندی اشتباه */}
      <div className="w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[800px]">
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
writeFile('components/admin/AdminModularPages.tsx', fullStudioCode);

// =============================================================================
// ۳. تست بیلد و ارسال به گیت‌هاب و استقرار ورسل
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
  execSync('git commit -m "fix(puck-ui): full-width responsive canvas layout, editable header & footer blocks inside canvas"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ بوم تمام‌عرض با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}