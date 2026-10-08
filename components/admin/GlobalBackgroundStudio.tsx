"use client";
import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { GlobalBackgroundConfig, DEFAULT_BG_CONFIG } from "@/components/GlobalSiteBackground";

export default function GlobalBackgroundStudio() {
  const [bgConfig, setBgConfig] = useState<GlobalBackgroundConfig>(DEFAULT_BG_CONFIG);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.config?.globalBackground) {
          setBgConfig((prev) => ({ ...prev, ...json.config.globalBackground }));
        }
      })
      .catch(() => {});
  }, []);

  const updateLiveParam = (patch: Partial<GlobalBackgroundConfig>) => {
    setBgConfig((prev) => {
      const next = { ...prev, ...patch };
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("axon_footer_live_preview", { detail: next }));
      }
      return next;
    });
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setFeedback(null);
    try {
      const tbRes = await fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" });
      const tbJson = await tbRes.json().catch(() => ({}));
      const res = await fetch("/api/theme-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: { ...(tbJson?.config || {}), globalBackground: bgConfig },
        }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        window.dispatchEvent(new CustomEvent("theme_builder_updated"));
        setFeedback({ type: "ok", text: "✓ تنظیمات ظاهری سایت با موفقیت در دیتابیس ذخیره شد." });
        setTimeout(() => setFeedback(null), 4500);
      }
    } catch {
      setFeedback({ type: "err", text: "خطا در ارتباط با سرور." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 text-xs font-sans text-[var(--text-primary)] select-text" dir="rtl">
      
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
        <div>
          <h2 className="font-black text-sm sm:text-base text-[var(--accent-blue)]">
            💎 مرکز فرماندهی چت، اسلایدر و رابط کاربری
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            کنترل دقیق موقعیت، سایز و تصویر المان‌های کلیدی سایت
          </p>
        </div>
        <button type="submit" disabled={saving} className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-xl hover:opacity-90 transition disabled:opacity-50">
          {saving ? "در حال انتشار..." : "💾 ذخیره تنظیمات"}
        </button>
      </div>

      {feedback && (
        <div className={"p-3.5 rounded-2xl font-black border " + (feedback.type === "ok" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border-rose-500/30")}>
          {feedback.text}
        </div>
      )}

      {/* پنل ۱: تنظیمات تخصصی اسلایدر محصول */}
      <div className="p-5 rounded-3xl bg-[var(--input-bg)] border-2 border-indigo-500/30 space-y-4">
        <h3 className="font-black text-sm text-indigo-400 border-b border-[var(--card-border)] pb-2">
          🖼️ تنظیمات پس‌زمینه اسلایدر پرچمداران
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold block">لینک عکس پس‌زمینه ثابت (اختیاری):</label>
            <input
              type="text" dir="ltr"
              placeholder="اگر خالی باشد، عکس خود محصول نمایش داده می‌شود..."
              value={bgConfig.sliderCustomBgUrl || ""}
              onChange={(e) => updateLiveParam({ sliderCustomBgUrl: e.target.value })}
              className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between font-bold">
              <span>شفافیت عکس در پس‌زمینه (Opacity):</span>
              <span className="text-indigo-400">{bgConfig.sliderBgOpacity ?? 30}%</span>
            </div>
            <input
              type="range" min={0} max={100}
              value={bgConfig.sliderBgOpacity ?? 30}
              onChange={(e) => updateLiveParam({ sliderBgOpacity: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer mt-2"
            />
          </div>
        </div>
      </div>

      {/* پنل ۲: تنظیمات دکمه شناور چت زنده */}
      <div className="p-5 rounded-3xl bg-[var(--input-bg)] border-2 border-sky-500/30 space-y-4">
        <h3 className="font-black text-sm text-sky-400 border-b border-[var(--card-border)] pb-2">
          💬 تنظیمات دکمه گفتگوی زنده (Live Chat)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between font-bold">
              <span>سایز در موبایل:</span>
              <span className="text-emerald-400">{bgConfig.chatSizeMobile ?? 50}px</span>
            </div>
            <input
              type="range" min={35} max={80}
              value={bgConfig.chatSizeMobile ?? 50}
              onChange={(e) => updateLiveParam({ chatSizeMobile: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between font-bold">
              <span>سایز در دسکتاپ:</span>
              <span className="text-sky-400">{bgConfig.chatSizeDesktop ?? 60}px</span>
            </div>
            <input
              type="range" min={45} max={100}
              value={bgConfig.chatSizeDesktop ?? 60}
              onChange={(e) => updateLiveParam({ chatSizeDesktop: Number(e.target.value) })}
              className="w-full accent-sky-500"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between font-bold">
              <span>فاصله از پایین (ارتفاع):</span>
              <span className="text-amber-400">{bgConfig.chatButtonBottomPx ?? 24}px</span>
            </div>
            <input
              type="range" min={10} max={150}
              value={bgConfig.chatButtonBottomPx ?? 24}
              onChange={(e) => updateLiveParam({ chatButtonBottomPx: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="font-bold block">موقعیت دکمه در صفحه:</label>
            <select
              value={bgConfig.chatButtonSide || "left"}
              onChange={(e) => updateLiveParam({ chatButtonSide: e.target.value as any })}
              className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              <option value="left">⬅️ گوشه پایین سمت چپ</option>
              <option value="right">➡️ گوشه پایین سمت راست</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="font-bold block">کد آیکون سفارشی چت (SVG):</label>
            <textarea
              rows={2} dir="ltr"
              placeholder="اگر خالی باشد، آیکون پیش‌فرض سیستم نمایش داده می‌شود..."
              value={bgConfig.chatIconSvg || ""}
              onChange={(e) => updateLiveParam({ chatIconSvg: e.target.value })}
              className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none text-[10px]"
            />
          </div>
        </div>
      </div>

    </form>
  );
}
