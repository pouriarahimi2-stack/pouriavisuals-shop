/**
 * AXON CORE - Live Visual Header & Footer Inside Puck Canvas (fix.js)
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

console.log("\x1b[36m[AXON-HEADER-FOOTER-CANVAS]\x1b[0m تزریق هدر و فوتر زنده به داخل بوم ویرایشگر و تمام صفحات...");

// =============================================================================
// ۱. تنظیم قالب پیش‌فرض صفحه اصلی و صفحات سایت شامل هدر و فوتر روی بوم
// =============================================================================
const studioWithHeaderFooter = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Render, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

// ساختار کامل صفحه اول با هدر در بالا و فوتر در پایین روی بوم
const FULL_SITE_HOME_DATA: Data = {
  content: [
    {
      type: "GlobalHeaderBlock",
      props: {
        id: "header-core-1",
        brandTitle: "Axon | آکسون",
        ctaText: "کاتالوگ محصولات",
        ctaUrl: "/products",
        link1Title: "اخبار تکنولوژی",
        link1Url: "/news",
        link2Title: "مجله سئو",
        link2Url: "/blog",
        link3Title: "پیگیری سفارش",
        link3Url: "/track-order",
        link4Title: "تماس با ما",
        link4Url: "/contact",
      }
    },
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
    },
    {
      type: "GlobalFooterBlock",
      props: {
        id: "footer-core-1",
        brandName: "Axon | آکسون",
        bioText: "مرجع تخصصی تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ ۵K و تجهیزات تصویر با ۱۸ ماه گارانتی طلایی در ایران.",
        supportPhone: "09376110200",
        email: "Pouriarahimi@yahoo.com",
        address: "شیراز - ستارخان",
        copyright: "تمامی حقوق مادی و معنوی برای آکسون استودیو محفوظ است © 2026"
      }
    }
  ],
  root: { props: { title: "صفحه اصلی سایت" } }
};

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data>(FULL_SITE_HOME_DATA);
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
        // برای صفحه اصلی یا صفحات دیگر ساختار با هدر و فوتر قرار داده می‌شود
        setPageData({
          ...FULL_SITE_HOME_DATA,
          root: { props: { title: slug } }
        });
      }
    } catch {
      setPageData(FULL_SITE_HOME_DATA);
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
        setToast("✓ تمامی اجزا از جمله هدر و فوتر ذخیره و منتشر شد.");
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
      
      {/* نوار کنترل بالای استودیو */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">انتخاب صفحه جهت ویرایش:</span>
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

      {/* بوم استودیو شامل هدر، محتوا و فوتر */}
      <div className="flex-1 w-full min-h-[750px] flex gap-4 items-start">
        {loading ? (
          <div className="w-full py-32 text-center text-xs font-bold text-slate-400">در حال آماده‌سازی بوم کامل صفحه...</div>
        ) : (
          <>
            {(viewMode === "editor" || viewMode === "split") && (
              <div className={\`rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px] transition-all duration-300 \${viewMode === "split" ? "w-1/2" : "w-full"}\`}>
                <div className="p-2.5 bg-black/40 border-b border-white/10 px-4 text-xs font-bold text-sky-400 flex items-center gap-2">
                  <span>🛠️ ویرایش هدر، بدنه و فوتر (روی هر بخش کلیک کنید)</span>
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
                    <span>پیش‌نمایش کامل زنده (شامل هدر، بدنه و فوتر)</span>
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
writeFile('components/admin/AdminModularPages.tsx', studioWithHeaderFooter);

// =============================================================================
// ۲. به‌روزرسانی components/modular/ModularPageRenderer.tsx
// =============================================================================
const updatedRendererCode = `"use client";

import React, { useState, useEffect } from "react";
import { Render } from "@measured/puck";
import { puckConfig } from "@/lib/puckConfig";
import { supabase } from "@/lib/supabase";

interface Props {
  initialPage: any;
  slug: string;
}

export default function ModularPageRenderer({ initialPage, slug }: Props) {
  const [page, setPage] = useState<any>(initialPage);

  const fetchPage = async () => {
    try {
      const res = await fetch(\`/api/pages?slug=\${encodeURIComponent(slug)}\`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page) {
        setPage(json.page);
      }
    } catch {}
  };

  useEffect(() => {
    const channel = supabase
      .channel(\`realtime-puck-render-\${slug}\`)
      .on("postgres_changes", { event: "*", schema: "public", table: "modular_pages" }, () => {
        fetchPage();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  if (!page || !page.puck_data) {
    return null;
  }

  return (
    <div className="w-full min-h-screen font-sans select-none overflow-x-hidden" dir="rtl">
      <Render config={puckConfig} data={page.puck_data} />
    </div>
  );
}
`;
writeFile('components/modular/ModularPageRenderer.tsx', updatedRendererCode);

// =============================================================================
// ۳. تست بیلد و استقرار آنلاین
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
  execSync('git commit -m "feat(puck-canvas): make header, entire body and footer fully visible and editable on canvas for all pages"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ هدر و فوتر به داخل بوم اضافه شدند و ورسل در حال دیپلوی است!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}