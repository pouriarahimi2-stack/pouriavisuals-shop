"use client";
// File Path: components/admin/GlobalBackgroundStudio.tsx
import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import {
  GlobalBackgroundConfig,
  DEFAULT_BG_CONFIG,
  PRESET_ANIMATED_SVGS,
} from "@/components/GlobalSiteBackground";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

export default function GlobalBackgroundStudio() {
  const [bgConfig, setBgConfig] = useState<GlobalBackgroundConfig>(DEFAULT_BG_CONFIG);
  const [saving, setSaving] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<"slider" | "globalBg" | null>(null);
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
        if (typeof window !== "undefined") {
          localStorage.removeItem("axon_site_info_cache_permanent_v2026");
          window.dispatchEvent(new CustomEvent("theme_builder_updated"));
        }
        setFeedback({
          type: "ok",
          text: "✓ تنظیمات ظاهری اسلایدر، دکمه چت و پس‌زمینه سایت با موفقیت در دیتابیس ذخیره شد.",
        });
        setTimeout(() => setFeedback(null), 4500);
      } else {
        setFeedback({ type: "err", text: "خطا در ذخیره‌سازی تنظیمات." });
      }
    } catch {
      setFeedback({ type: "err", text: "خطا در ارتباط با سرور." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSaveAll}
      className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 text-xs font-sans text-[var(--text-primary)] select-text"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
        <div>
          <h2 className="font-black text-sm sm:text-base text-[var(--accent-blue)] flex items-center gap-2">
            <span>💎</span> مرکز فرماندهی چت، اسلایدر و رابط کاربری
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            کنترل دقیق موقعیت، سایز و تصویر المان‌های کلیدی و پس‌زمینه سایت
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-xl hover:opacity-90 transition cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال انتشار..." : "💾 ذخیره تنظیمات"}
        </button>
      </div>

      {feedback && (
        <div
          className={
            "p-3.5 rounded-2xl font-black border animate-fadeIn " +
            (feedback.type === "ok"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-rose-500/15 text-rose-400 border-rose-500/30")
          }
        >
          {feedback.text}
        </div>
      )}

      {/* پنل ۱: تنظیمات تخصصی اسلایدر محصول */}
      <div className="p-5 rounded-3xl bg-[var(--input-bg)] border-2 border-indigo-500/30 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
          <h3 className="font-black text-sm text-indigo-400">
            🖼️ تنظیمات پس‌زمینه اسلایدر پرچمداران
          </h3>
          {bgConfig.sliderCustomBgUrl && (
            <button
              type="button"
              onClick={() => updateLiveParam({ sliderCustomBgUrl: "" })}
              className="text-[11px] text-rose-400 font-bold hover:underline cursor-pointer"
            >
              حذف تصویر ثابت ✕
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-1.5">
            <label className="font-bold block text-[var(--text-secondary)]">
              لینک یا آپلود عکس پس‌زمینه ثابت (اختیاری):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                dir="ltr"
                placeholder="اگر خالی باشد، عکس خود محصول نمایش داده می‌شود..."
                value={bgConfig.sliderCustomBgUrl || ""}
                onChange={(e) => updateLiveParam({ sliderCustomBgUrl: e.target.value })}
                className="flex-1 p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setUploadTarget("slider")}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black cursor-pointer shrink-0 transition"
              >
                ☁️ آپلود تصویر
              </button>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between font-bold">
              <span>شفافیت عکس در پس‌زمینه (Opacity):</span>
              <span className="font-mono font-black text-indigo-400">
                {bgConfig.sliderBgOpacity ?? 30}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={bgConfig.sliderBgOpacity ?? 30}
              onChange={(e) => updateLiveParam({ sliderBgOpacity: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* پنل ۲: تنظیمات دکمه شناور چت زنده */}
      <div className="p-5 rounded-3xl bg-[var(--input-bg)] border-2 border-sky-500/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-2">
          <h3 className="font-black text-sm text-sky-400">
            💬 تنظیمات دکمه گفتگوی زنده (Live Chat)
          </h3>
          <label className="flex items-center gap-2 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={bgConfig.showMobileBottomNav !== false}
              onChange={(e) => updateLiveParam({ showMobileBottomNav: e.target.checked })}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
            <span>نمایش نوار دسترسی سریع پایین صفحه در موبایل</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between font-bold">
              <span>سایز در موبایل:</span>
              <span className="font-mono font-black text-emerald-400">
                {bgConfig.chatSizeMobile ?? 48}px
              </span>
            </div>
            <input
              type="range"
              min={35}
              max={80}
              value={bgConfig.chatSizeMobile ?? 48}
              onChange={(e) => updateLiveParam({ chatSizeMobile: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between font-bold">
              <span>سایز در دسکتاپ:</span>
              <span className="font-mono font-black text-sky-400">
                {bgConfig.chatSizeDesktop ?? 56}px
              </span>
            </div>
            <input
              type="range"
              min={45}
              max={100}
              value={bgConfig.chatSizeDesktop ?? 56}
              onChange={(e) => updateLiveParam({ chatSizeDesktop: Number(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between font-bold">
              <span>فاصله از پایین (ارتفاع):</span>
              <span className="font-mono font-black text-amber-400">
                {bgConfig.chatButtonBottomPx ?? 80}px
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={180}
              value={bgConfig.chatButtonBottomPx ?? 80}
              onChange={(e) => updateLiveParam({ chatButtonBottomPx: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="font-bold block text-[var(--text-secondary)]">
              موقعیت دکمه در صفحه:
            </label>
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
            <label className="font-bold block text-[var(--text-secondary)]">
              کد آیکون سفارشی چت (SVG):
            </label>
            <textarea
              rows={2}
              dir="ltr"
              placeholder="اگر خالی باشد، آیکون پیش‌فرض سیستم نمایش داده می‌شود..."
              value={bgConfig.chatIconSvg || ""}
              onChange={(e) => updateLiveParam({ chatIconSvg: e.target.value })}
              className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none text-[10px]"
            />
          </div>
        </div>
      </div>

      {/* پنل ۳: پس‌زمینه سراسری سایت (انیمیشن SVG یا تصویر سفارشی) */}
      <div className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-2">
          <h3 className="font-black text-sm text-emerald-400">
            🌌 پس‌زمینه گرافیکی و متحرک سراسری فروشگاه (Ambient Canvas)
          </h3>
          <label className="flex items-center gap-2 font-black cursor-pointer text-emerald-400">
            <input
              type="checkbox"
              checked={Boolean(bgConfig.enabled)}
              onChange={(e) => updateLiveParam({ enabled: e.target.checked })}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <span>فعال‌سازی پس‌زمینه گرافیکی در کل سایت</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold block text-[var(--text-secondary)]">
              نوع پس‌زمینه سراسری:
            </label>
            <select
              value={bgConfig.mediaType}
              onChange={(e) => updateLiveParam({ mediaType: e.target.value as any })}
              className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              <option value="preset_svg">✨ انیمیشن برداری آماده (Animated SVG)</option>
              <option value="auto">🖼️ تصویر سفارشی (لینک یا آپلود)</option>
            </select>
          </div>

          {bgConfig.mediaType === "preset_svg" ? (
            <div className="space-y-1.5">
              <label className="font-bold block text-[var(--text-secondary)]">
                انتخاب الگوی متحرک SVG:
              </label>
              <select
                value={bgConfig.presetId || "cyber_grid"}
                onChange={(e) => updateLiveParam({ presetId: e.target.value })}
                className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                {Object.entries(PRESET_ANIMATED_SVGS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="font-bold block text-[var(--text-secondary)]">
                آدرس یا آپلود تصویر پس‌زمینه کل سایت:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={bgConfig.mediaUrl || ""}
                  onChange={(e) => updateLiveParam({ mediaUrl: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => setUploadTarget("globalBg")}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer shrink-0 transition"
                >
                  ☁️ آپلود
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
            <div className="flex justify-between font-bold">
              <span>شفافیت پس‌زمینه (Opacity):</span>
              <span className="font-mono text-emerald-400">{bgConfig.opacity ?? 55}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              value={bgConfig.opacity ?? 55}
              onChange={(e) => updateLiveParam({ opacity: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
            <div className="flex justify-between font-bold">
              <span>میزان تارشدگی پس‌زمینه (Blur):</span>
              <span className="font-mono text-sky-400">{bgConfig.blurPx ?? 0}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              value={bgConfig.blurPx ?? 0}
              onChange={(e) => updateLiveParam({ blurPx: Number(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <MediaUploadModal
        isOpen={uploadTarget !== null}
        bucket="site-assets"
        title={
          uploadTarget === "slider"
            ? "آپلود تصویر پس‌زمینه اسلایدر پرچمداران"
            : "آپلود تصویر پس‌زمینه سراسری سایت"
        }
        currentValue={
          uploadTarget === "slider" ? bgConfig.sliderCustomBgUrl || "" : bgConfig.mediaUrl || ""
        }
        onClose={() => setUploadTarget(null)}
        onUploadSuccess={(url) => {
          if (uploadTarget === "slider") {
            updateLiveParam({ sliderCustomBgUrl: url });
          } else {
            updateLiveParam({ mediaUrl: url, mediaType: "auto", enabled: true });
          }
          setUploadTarget(null);
        }}
      />
    </form>
  );
}