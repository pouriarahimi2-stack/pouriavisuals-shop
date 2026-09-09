/**
 * AXON CORE - Next-Gen Puck Visual Studio Migration (fix.js)
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

console.log("\x1b[36m[AXON-PUCK-MIGRATION]\x1b[0m گام ۱: نصب پکیج رسمی @measured/puck...");
try {
  execSync('npm install @measured/puck', { stdio: 'inherit' });
  console.log("\x1b[32m✔ پکیج @measured/puck با موفقیت نصب شد.\x1b[0m");
} catch (err) {
  console.log("\x1b[33m⚠️ تلاش مجدد با فلگ --legacy-peer-deps...\x1b[0m");
  execSync('npm install @measured/puck --legacy-peer-deps', { stdio: 'inherit' });
}

// =============================================================================
// گام ۲: ساخت کانفیگ اختصاصی کامپوننت‌ها در lib/puckConfig.tsx
// =============================================================================
console.log("\x1b[36m[AXON-PUCK-MIGRATION]\x1b[0m گام ۲: تعریف کامپوننت‌های زنده ری‌اکت در lib/puckConfig.tsx...");

const puckConfigCode = `import React from "react";
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
            style={{ backgroundColor: bgColor || "#020617", color: textColor || "#fff", paddingTop: \`\${paddingTop || 60}px\`, paddingBottom: \`\${paddingBottom || 60}px\` }}
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
            style={{ backgroundColor: bgColor || "#090d16", paddingTop: \`\${paddingTop || 50}px\`, paddingBottom: \`\${paddingBottom || 50}px\` }}
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
          <div style={{ paddingTop: \`\${paddingTop || 20}px\`, paddingBottom: \`\${paddingBottom || 20}px\` }} className="max-w-7xl mx-auto px-4">
            <div dangerouslySetInnerHTML={{ __html: code || "" }} />
          </div>
        );
      },
    },
  },
};
`;
writeFile('lib/puckConfig.tsx', puckConfigCode);

// =============================================================================
// گام ۳: بازنویسی components/admin/AdminModularPages.tsx به استودیوی زنده Puck
// =============================================================================
console.log("\x1b[36m[AXON-PUCK-MIGRATION]\x1b[0m گام ۳: استقرار ویرایشگر بومی Puck در components/admin/AdminModularPages.tsx...");

const puckStudioComponent = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

const DEFAULT_HOME_DATA: Data = {
  content: [
    {
      type: "HeroBlock",
      props: {
        id: "hero-1",
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
    },
    {
      type: "FeaturesGrid",
      props: {
        id: "feat-1",
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
    },
    {
      type: "CtaBanner",
      props: {
        id: "cta-1",
        title: "به یک مشاوره تخصصی برای استودیو نیاز دارید؟",
        subtitle: "کارشناسان آکسون متناسب با نرم‌افزار شما مانیتور مناسب را پیشنهاد می‌دهند.",
        btnText: "ثبت تیکت مشاوره",
        btnUrl: "/contact",
        bgColor: "#1e1b4b",
      },
    },
  ],
  root: { props: { title: "صفحه اصلی" } },
};

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data>(DEFAULT_HOME_DATA);
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
      if (json.success && json.page && json.page.puck_data) {
        setPageData(json.page.puck_data);
      } else {
        setPageData(DEFAULT_HOME_DATA);
      }
    } catch {
      setPageData(DEFAULT_HOME_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

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
        setToast("✓ صفحه با موفقیت ذخیره و در سراسر سایت منتشر شد.");
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
      
      {/* سربرگ هوشمند کنترل صفحات */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">انتخاب صفحه جهت ویرایش زنده:</span>
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

      {/* بوم Puck کاملاً بومی و زنده با امکان Undo / Redo و Drag & Drop حقیقی */}
      <div className="flex-1 w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px]">
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
writeFile('components/admin/AdminModularPages.tsx', puckStudioComponent);

// =============================================================================
// گام ۴: به‌روزرسانی روت سروری app/api/pages/route.ts برای پشتیبانی از فیلد puck_data
// =============================================================================
console.log("\x1b[36m[AXON-PUCK-MIGRATION]\x1b[0m گام ۴: به‌روزرسانی API برای ذخیره داده‌های استاندارد Puck...");

const pagesRouteCode = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export const SYSTEM_PAGES = [
  { id: "sys-home", slug: "home", title: "صفحه اصلی (خانه)" },
  { id: "sys-products", slug: "products", title: "کاتالوگ محصولات و تجهیزات" },
  { id: "sys-news", slug: "news", title: "رادار اخبار تکنولوژی" },
  { id: "sys-blog", slug: "blog", title: "مجله تخصصی و مقالات سئو" },
  { id: "sys-about", slug: "about", title: "درباره استودیو آکسون" },
  { id: "sys-contact", slug: "contact", title: "تماس و مشاوره تخصصی" },
  { id: "sys-track", slug: "track-order", title: "پیگیری مرسولات پستی" },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const { data } = await supabaseAdmin
        .from("modular_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (data) {
        return NextResponse.json({ success: true, page: data });
      }

      const sys = SYSTEM_PAGES.find((p) => p.slug === slug);
      if (sys) {
        return NextResponse.json({ success: true, page: sys });
      }
    }

    const { data: customPages } = await supabaseAdmin
      .from("modular_pages")
      .select("id, slug, title, is_published, updated_at")
      .order("updated_at", { ascending: false });

    const combined = [...SYSTEM_PAGES];
    (customPages || []).forEach((cp) => {
      if (!combined.some((p) => p.slug === cp.slug)) {
        combined.push(cp);
      }
    });

    return NextResponse.json({ success: true, pages: combined });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { slug, title, puck_data, is_published } = body;
    const cleanSlug = String(slug || "").trim().toLowerCase();

    const payload: any = {
      slug: cleanSlug,
      title: String(title || cleanSlug).trim(),
      puck_data: puck_data || {},
      is_published: is_published !== false,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from("modular_pages").select("id").eq("slug", cleanSlug).maybeSingle();

    if (existing) {
      await supabaseAdmin.from("modular_pages").update(payload).eq("id", existing.id);
    } else {
      payload.id = "page_" + Date.now();
      payload.created_at = new Date().toISOString();
      await supabaseAdmin.from("modular_pages").insert([payload]);
    }

    return NextResponse.json({ success: true, message: "صفحه با موفقیت ذخیره و منتشر شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/pages/route.ts', pagesRouteCode);

// =============================================================================
// گام ۵: تست بیلد نهایی پروژه و انتشار در Vercel
// =============================================================================
console.log("\x1b[36m[AXON-PUCK-MIGRATION]\x1b[0m گام ۵: تست بیلد نهایی نرم‌افزار (npm run build)...");
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
  execSync('git commit -m "feat(puck): migrate to professional Puck component-based visual editor with true drag-and-drop & native React rendering"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ استودیوی پیشرفته Puck با موفقیت دیپلوی شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}