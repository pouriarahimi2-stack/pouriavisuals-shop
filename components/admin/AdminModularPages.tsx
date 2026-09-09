"use client";

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
      const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
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

  const targetLiveUrl = currentSlug === "home" ? "/" : `/${currentSlug}`;

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
              <div className={`rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px] transition-all duration-300 ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
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
              <div className={`rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px] flex flex-col transition-all duration-300 ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
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
