/**
 * AXON CORE - Dual-Engine Live Split View Studio (fix.js)
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

console.log("\x1b[36m[AXON-LIVE-STUDIO]\x1b[0m پیاده‌سازی پیش‌نمایش زنده هم‌زمان (Split-Screen Live View)...");

// =============================================================================
// ارتقای components/admin/AdminModularPages.tsx به استودیوی دوگانه زنده
// =============================================================================
const splitStudioComponent = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Render, Data } from "@measured/puck";
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
      if (json.success && json.page && json.page.puck_data) {
        setPageData(json.page.puck_data);
      } else {
        setPageData(PRESET_TEMPLATES.flagship_showcase);
      }
    } catch {
      setPageData(PRESET_TEMPLATES.flagship_showcase);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
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

  const targetLiveUrl = currentSlug === "home" ? "/" : \`/\${currentSlug}\`;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4" dir="rtl">
      
      {/* نوار کنترل استودیو و سوییچر حالت‌های نمایش */}
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

        {/* سوییچر ۳ حالته: ادیتور تکی / نمای دوتایی زنده / نمای وب‌سایت لایو */}
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
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>باز کردن تب مجزا</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      {/* فضای کاری منعطف: حالت‌های Split View یا ویرایشگر تکی */}
      <div className="flex-1 w-full min-h-[750px] flex gap-4 items-start">
        {loading ? (
          <div className="w-full py-32 text-center text-xs font-bold text-slate-400">در حال آماده‌سازی بوم استودیو...</div>
        ) : (
          <>
            {/* ۱. ستون ویرایشگر درگ‌اند‌دراپ Puck */}
            {(viewMode === "editor" || viewMode === "split") && (
              <div
                className={\`rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px] transition-all duration-300 \${
                  viewMode === "split" ? "w-1/2" : "w-full"
                }\`}
              >
                <div className="p-2.5 bg-black/40 border-b border-white/10 px-4 text-xs font-bold text-sky-400 flex items-center gap-2">
                  <span>🛠️ پنل چیدمان و ابزارها</span>
                </div>
                <Puck
                  config={puckConfig}
                  data={pageData}
                  onChange={(newData) => setPageData(newData)}
                  onPublish={handleSave}
                />
              </div>
            )}

            {/* ۲. ستون پیش‌نمایش زنده در لحظه (Instant Live Render) */}
            {(viewMode === "split" || viewMode === "live_site") && (
              <div
                className={\`rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px] flex flex-col transition-all duration-300 \${
                  viewMode === "split" ? "w-1/2" : "w-full"
                }\`}
              >
                <div className="p-2.5 bg-black/40 border-b border-white/10 px-4 text-xs font-bold text-emerald-400 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>پیش‌نمایش رندر زنده صفحه (همگام با تایپ و تغییرات)</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">آدرس مقصد: {targetLiveUrl}</span>
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
writeFile('components/admin/AdminModularPages.tsx', splitStudioComponent);

// =============================================================================
// تست بیلد و استقرار ورسل
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
  execSync('git commit -m "feat(puck-live-studio): add simultaneous split-screen live preview, real-time typing sync and responsive device controls"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ استودیوی دوگانه پیش‌نمایش زنده با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}