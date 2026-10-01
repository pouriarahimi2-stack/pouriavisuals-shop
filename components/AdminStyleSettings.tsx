// File Path: components/AdminStyleSettings.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export interface SiteStyleConfig {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  border_radius: string;
  custom_css: string;
}

export function AdminStyleSettings() {
  const [config, setConfig] = useState<SiteStyleConfig>({
    primary_color: "#0284c7",
    secondary_color: "#4f46e5",
    font_family: "Vazirmatn",
    border_radius: "1.5rem",
    custom_css: "",
  });
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile" | "tablet">("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const applyStylesToDom = (styles: SiteStyleConfig) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (styles.primary_color) {
      root.style.setProperty("--accent-blue", styles.primary_color);
      root.style.setProperty("--primary-color", styles.primary_color);
    }
    if (styles.secondary_color) {
      root.style.setProperty("--secondary-color", styles.secondary_color);
    }
    if (styles.border_radius) {
      root.style.setProperty("--card-radius", styles.border_radius);
    }
    if (styles.font_family) {
      root.style.setProperty("--font-sans", styles.font_family + ", sans-serif");
    }

    let styleTag = document.getElementById("axon-live-custom-css") as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "axon-live-custom-css";
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = styles.custom_css || "";
  };

  const fetchStyles = async () => {
    try {
      const res = await fetch("/api/styles", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        const nextConfig: SiteStyleConfig = {
          primary_color: json.data.primary_color || "#0284c7",
          secondary_color: json.data.secondary_color || "#4f46e5",
          font_family: json.data.font_family || "Vazirmatn",
          border_radius: json.data.border_radius || "1.5rem",
          custom_css: json.data.custom_css || "",
        };
        setConfig(nextConfig);
        applyStylesToDom(nextConfig);
      }
    } catch (e) {
      console.error("Error fetching styles:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStyles();

    const channel = supabase
      .channel("realtime-site-styles")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_styles" }, () => {
        fetchStyles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSaveStyles = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        applyStylesToDom(config);
        if (typeof window !== "undefined") {
          localStorage.setItem("axon_site_styles_v2026", JSON.stringify(config));
          window.dispatchEvent(new CustomEvent("site_styles_updated", { detail: config }));
        }
        setFeedback("✓ هویت بصری، فونت‌ها و استایل‌های CSS با موفقیت در دیتابیس ذخیره و به صورت بلادرنگ در کل سایت اعمال شدند.");
      } else {
        setFeedback(json.message || "خطا در ذخیره استایل‌ها.");
      }
    } catch {
      setFeedback("خطا در ارتباط با سرور.");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const injectCssPreset = (snippet: string) => {
    soundEngine.playClick();
    const updated = (config.custom_css ? config.custom_css + "\n\n" : "") + snippet;
    const nextCfg = { ...config, custom_css: updated };
    setConfig(nextCfg);
    applyStylesToDom(nextCfg);
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* نوار ناوبری یکپارچه استودیوی طراحی */}
      <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/appearance"
            className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold transition"
          >
            🎨 استودیوی ظاهر و سکشن‌ها
          </Link>
          <Link
            href="/admin/pages"
            className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold transition"
          >
            ⚡ صفحه‌ساز ماژولار
          </Link>
          <Link
            href="/admin/menu"
            className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold transition"
          >
            🧭 منو و دسته‌بندی‌ها
          </Link>
          <span className="px-3.5 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow">
            ✨ هویت بصری، فونت و CSS
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>✨</span> مدیریت هویت بصری، تایپوگرافی و استایل‌ساز پیشرفته CSS
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تنظیم بلادرنگ پالت رنگی، فونت سراسری، انحنای کارت‌ها و کدهای اختصاصی CSS در دسکتاپ، موبایل و تبلت
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveStyles}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال انتشار..." : "💾 ذخیره و اعمال آنی در کل سایت"}
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold animate-fadeIn">
          {feedback}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-bold">در حال بارگذاری موتور استایل...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          <form
            onSubmit={handleSaveStyles}
            className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  رنگ اصلی برند (Primary Accent):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => {
                      const next = { ...config, primary_color: e.target.value };
                      setConfig(next);
                      applyStylesToDom(next);
                    }}
                    className="w-12 h-11 rounded-xl border border-[var(--card-border)] cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  رنگ مکمل و گرادیان (Secondary):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.secondary_color}
                    onChange={(e) => {
                      const next = { ...config, secondary_color: e.target.value };
                      setConfig(next);
                      applyStylesToDom(next);
                    }}
                    className="w-12 h-11 rounded-xl border border-[var(--card-border)] cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={config.secondary_color}
                    onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                    className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  خانواده فونت سراسری سایت:
                </label>
                <select
                  value={config.font_family}
                  onChange={(e) => {
                    const next = { ...config, font_family: e.target.value };
                    setConfig(next);
                    applyStylesToDom(next);
                  }}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                >
                  <option value="Vazirmatn">وزیرمتن (Vazirmatn - استاندارد مدرن)</option>
                  <option value="IRANSansX">ایران‌سنس ایکس (IRANSansX)</option>
                  <option value="YekanBakh">یکان بخ (YekanBakh)</option>
                  <option value="Shabnam">شبنم (Shabnam)</option>
                  <option value="Estedad">استعداد (Estedad)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  میزان گردی کادرها و کارت‌ها (Border Radius):
                </label>
                <select
                  value={config.border_radius}
                  onChange={(e) => {
                    const next = { ...config, border_radius: e.target.value };
                    setConfig(next);
                    applyStylesToDom(next);
                  }}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                >
                  <option value="0.75rem">کلاسیک (12px / 0.75rem)</option>
                  <option value="1rem">استاندارد (16px / 1rem)</option>
                  <option value="1.5rem">مدرن اپل (24px / 1.5rem)</option>
                  <option value="2rem">منحنی نرم (32px / 2rem)</option>
                  <option value="2.5rem">کپسولی فوق‌مدرن (40px / 2.5rem)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="font-black text-sm text-[var(--accent-blue)]">
                  💻 ویرایشگر پیشرفته استایل‌های سفارشی (Custom CSS):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      injectCssPreset(
                        "/* افکت شیشه‌ای کارت‌ها */\n.glass-card { backdrop-filter: blur(20px); }"
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[10px] font-bold cursor-pointer"
                  >
                    + افکت شیشه‌ای
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      injectCssPreset(
                        "/* بهینه‌سازی فشرده موبایل */\n@media (max-width: 640px) { body { font-size: 13px; } }"
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[10px] font-bold cursor-pointer"
                  >
                    + مدیاکوئری موبایل
                  </button>
                </div>
              </div>

              <textarea
                rows={8}
                dir="ltr"
                value={config.custom_css}
                onChange={(e) => {
                  const next = { ...config, custom_css: e.target.value };
                  setConfig(next);
                  applyStylesToDom(next);
                }}
                placeholder="/* Write custom CSS rules here... */"
                className="w-full p-4 rounded-2xl bg-slate-950 text-emerald-400 border border-[var(--card-border)] font-mono text-xs outline-none focus:border-[var(--accent-blue)] leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl cursor-pointer disabled:opacity-50"
            >
              {saving ? "در حال ثبت در دیتابیس..." : "💾 ذخیره نهایی استایل‌ها و انتشار بلادرنگ"}
            </button>
          </form>

          {/* پیش‌نمایش زنده در ۳ پلتفرم به ترتیب اولویت: دسکتاپ، موبایل، تبلت */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col justify-between space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm">پیش‌نمایش زنده ریسپانسیو</h3>
              <div className="flex gap-1 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={
                    "px-2.5 py-1 rounded-lg transition cursor-pointer " +
                    (previewDevice === "desktop" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
                  }
                >
                  🖥️ دسکتاپ
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={
                    "px-2.5 py-1 rounded-lg transition cursor-pointer " +
                    (previewDevice === "mobile" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
                  }
                >
                  📱 موبایل
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("tablet")}
                  className={
                    "px-2.5 py-1 rounded-lg transition cursor-pointer " +
                    (previewDevice === "tablet" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
                  }
                >
                  📟 تبلت
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center bg-[var(--input-bg)] rounded-2xl p-4 border border-[var(--card-border)]">
              <div
                style={{
                  fontFamily: config.font_family + ", sans-serif",
                  borderRadius: config.border_radius,
                }}
                className={
                  "bg-[var(--modal-bg)] border border-[var(--card-border)] p-5 shadow-2xl transition-all duration-300 space-y-4 " +
                  (previewDevice === "mobile"
                    ? "w-[270px]"
                    : previewDevice === "tablet"
                    ? "w-[360px]"
                    : "w-full")
                }
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{ backgroundColor: config.primary_color }}
                    className="px-3 py-1 rounded-full text-white text-[10px] font-black"
                  >
                    پرچمدار دیجیتال
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{config.font_family}</span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-black text-sm text-[var(--text-primary)]">
                    نمونه کارت محصول در فروشگاه آکسون
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    این پیش‌نمایش به صورت زنده رنگ اصلی، فونت انتخابی و میزان انحنای کادرها را در حالت{" "}
                    {previewDevice === "desktop"
                      ? "دسکتاپ"
                      : previewDevice === "mobile"
                      ? "موبایل"
                      : "تبلت"}{" "}
                    نشان می‌دهد.
                  </p>
                </div>

                <button
                  type="button"
                  style={{
                    background:
                      "linear-gradient(135deg, " +
                      config.primary_color +
                      ", " +
                      config.secondary_color +
                      ")",
                    borderRadius: config.border_radius,
                  }}
                  className="w-full py-3 text-white font-black text-xs shadow-lg"
                >
                  افزودن به سبد خرید 🛒
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStyleSettings;
