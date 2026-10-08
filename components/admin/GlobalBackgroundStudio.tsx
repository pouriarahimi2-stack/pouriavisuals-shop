"use client";
// File Path: components/admin/GlobalBackgroundStudio.tsx
import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";
import {
  GlobalBackgroundConfig,
  DEFAULT_BG_CONFIG,
  PRESET_ANIMATED_SVGS,
} from "@/components/GlobalSiteBackground";

export default function GlobalBackgroundStudio() {
  const [bgConfig, setBgConfig] = useState<GlobalBackgroundConfig>(DEFAULT_BG_CONFIG);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.config?.globalBackground) {
          setBgConfig((prev) => ({
            ...prev,
            ...json.config.globalBackground,
          }));
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

  const applyFooterPreset = (preset: "ultra_slim" | "compact_pro" | "original") => {
    soundEngine.playClick();
    if (preset === "ultra_slim") {
      updateLiveParam({
        footerScale: 74,
        footerBgPaddingY: 8,
        footerInnerGap: 8,
        footerPadding: "ultra_compact",
      });
    } else if (preset === "compact_pro") {
      updateLiveParam({
        footerScale: 82,
        footerBgPaddingY: 16,
        footerInnerGap: 12,
        footerPadding: "compact",
      });
    } else {
      updateLiveParam({
        footerScale: 100,
        footerBgPaddingY: 40,
        footerInnerGap: 32,
        footerPadding: "normal",
      });
    }
  };

  const handleSelectFile = async (file: File) => {
    soundEngine.playClick();
    setFeedback(null);

    if (file.size > 8 * 1024 * 1024) {
      setFeedback({
        type: "err",
        text: "حجم فایل برای حفظ سرعت سایت نباید بیشتر از ۸ مگابایت باشد.",
      });
      return;
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    let detectedType: GlobalBackgroundConfig["mediaType"] = "image";
    if (ext === "gif" || file.type.includes("gif")) detectedType = "gif";
    else if (ext === "svg" || file.type.includes("svg")) detectedType = "svg";
    else if (ext === "mp4" || ext === "webm" || file.type.includes("video"))
      detectedType = "video";

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.url) {
        soundEngine.playSuccess();
        updateLiveParam({
          enabled: true,
          mediaUrl: json.url,
          mediaType: detectedType,
        });
        setFeedback({
          type: "ok",
          text: "✓ فایل «" + file.name + "» آماده شد. روی «ذخیره و انتشار» کلیک کنید.",
        });
        setUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        soundEngine.playSuccess();
        updateLiveParam({
          enabled: true,
          mediaUrl: String(reader.result || ""),
          mediaType: detectedType,
        });
        setFeedback({
          type: "ok",
          text: "✓ فایل «" + file.name + "» آماده شد. روی «ذخیره و انتشار» کلیک کنید.",
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      setFeedback({ type: "err", text: "خطا در آپلود فایل." });
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setFeedback(null);

    try {
      const tbRes = await fetch("/api/theme-builder?t=" + Date.now(), {
        cache: "no-store",
      });
      const tbJson = await tbRes.json().catch(() => ({}));
      const prevConfig = tbJson?.config || {};

      const res = await fetch("/api/theme-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            ...prevConfig,
            globalBackground: bgConfig,
          },
        }),
      });

      if (res.ok) {
        soundEngine.playSuccess();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("theme_builder_updated"));
          window.dispatchEvent(new CustomEvent("site_info_updated"));
        }
        setFeedback({
          type: "ok",
          text: "✓ تمام تنظیمات Liquid Glass، دکمه چت، متون کارت‌ها، پس‌زمینه و فوتر با موفقیت در کل سایت اعمال شد!",
        });
        setTimeout(() => setFeedback(null), 4500);
      } else {
        setFeedback({ type: "err", text: "خطا در ذخیره تنظیمات." });
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
      className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 text-xs font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
        <div>
          <h2 className="font-black text-sm sm:text-base text-[var(--accent-blue)] flex items-center gap-2">
            <span>💎</span> مرکز فرماندهی Liquid Glass، متون کارت‌ها، پس‌زمینه سراسری و فوتر
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            کنترل ۱۰۰٪ استایل شیشه‌ای (سازگار با تم تیره و روشن)، آیکونی کردن دکمه چت زنده، حذف متون اضافی و تنظیم ارتفاع فوتر
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-xl cursor-pointer hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "در حال انتشار..." : "💾 ذخیره و انتشار بلادرنگ در کل سایت"}
        </button>
      </div>

      {feedback && (
        <div
          className={
            "p-3.5 rounded-2xl font-black border " +
            (feedback.type === "ok"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/15 border-rose-500/30 text-rose-400")
          }
        >
          {feedback.text}
        </div>
      )}

      {/* ردیف ۱: استودیوی Liquid Glass + کنترل دکمه چت و متون کارت‌ها */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 p-4 sm:p-5 rounded-3xl bg-[var(--input-bg)] border-2 border-sky-500/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
            <div>
              <h3 className="font-black text-sm text-sky-400">
                💎 استایل Liquid Glass و کنترل هدر موبایل / دکمه چت
              </h3>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                شیشه‌ای شدن کارت‌ها، هدر و فوتر در موبایل، تبلت و دسکتاپ با حفظ کامل دکمه تغییر تم تیره/روشن
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                updateLiveParam({
                  liquidGlassEnabled: !(bgConfig.liquidGlassEnabled ?? true),
                });
              }}
              className={
                "px-3.5 py-2 rounded-xl font-black cursor-pointer transition " +
                (bgConfig.liquidGlassEnabled !== false
                  ? "bg-sky-500 text-slate-950 shadow-lg"
                  : "bg-[var(--modal-bg)] border border-[var(--card-border)] text-slate-400")
              }
            >
              {bgConfig.liquidGlassEnabled !== false ? "✓ لیکوئید گلس: فعال" : "غیرفعال"}
            </button>
          </div>

          
          {/* تنظیمات جدید اسلایدر و آیکون چت */}
          <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 mb-4">
            <h4 className="font-black text-[var(--accent-blue)] text-xs border-b border-[var(--card-border)] pb-2">
               🎨 تنظیمات عکس پس‌زمینه اسلایدر و سایز آیکون چت
            </h4>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[11px]">
                  <span>شفافیت عکس محصول در پس‌زمینه اسلایدر (Opacity):</span>
                  <span className="font-mono text-sky-400">{bgConfig.sliderBgOpacity ?? 30}%</span>
                </div>
                <input
                  type="range" min={0} max={100}
                  value={bgConfig.sliderBgOpacity ?? 30}
                  onChange={(e) => updateLiveParam({ sliderBgOpacity: Number(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-[10px]">
                    <span>سایز دکمه چت در موبایل:</span>
                    <span className="font-mono text-emerald-400">{bgConfig.chatSizeMobile ?? 48}px</span>
                  </div>
                  <input
                    type="range" min={30} max={80}
                    value={bgConfig.chatSizeMobile ?? 48}
                    onChange={(e) => updateLiveParam({ chatSizeMobile: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-[10px]">
                    <span>سایز دکمه چت در دسکتاپ:</span>
                    <span className="font-mono text-indigo-400">{bgConfig.chatSizeDesktop ?? 56}px</span>
                  </div>
                  <input
                    type="range" min={40} max={100}
                    value={bgConfig.chatSizeDesktop ?? 56}
                    onChange={(e) => updateLiveParam({ chatSizeDesktop: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                 <label className="font-bold text-[11px] block">کد آیکون اختصاصی چت (SVG خام):</label>
                 <textarea
                   rows={2} dir="ltr"
                   placeholder="<svg viewBox='0 0 24 24'>...</svg>"
                   value={bgConfig.chatIconSvg || ""}
                   onChange={(e) => updateLiveParam({ chatIconSvg: e.target.value })}
                   className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[10px] outline-none"
                 />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2 cursor-pointer font-bold">
              <span>💬 دکمه گفتگوی زنده: فقط آیکون دایره‌ای (در هر ۳ پلتفرم)</span>
              <input
                type="checkbox"
                checked={bgConfig.chatButtonIconOnly !== false}
                onChange={(e) => updateLiveParam({ chatButtonIconOnly: e.target.checked })}
                className="w-4 h-4 accent-sky-500 shrink-0"
              />
            </label>

            <label className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2 cursor-pointer font-bold">
              <span>📱 نمایش نوار ناوبری پایین در موبایل</span>
              <input
                type="checkbox"
                checked={bgConfig.showMobileBottomNav !== false}
                onChange={(e) => updateLiveParam({ showMobileBottomNav: e.target.checked })}
                className="w-4 h-4 accent-sky-500 shrink-0"
              />
            </label>

            <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2 font-bold">
              <span>📍 جهت دکمه شناور چت:</span>
              <select
                value={bgConfig.chatButtonSide || "left"}
                onChange={(e) => updateLiveParam({ chatButtonSide: e.target.value as any })}
                className="p-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-black outline-none cursor-pointer"
              >
                <option value="left">⬅️ گوشه چپ صفحه</option>
                <option value="right">➡️ گوشه راست صفحه</option>
              </select>
            </div>

            <label className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2 cursor-pointer font-bold">
              <span>📱 بهینه‌سازی خودکار نام برند در هدر موبایل</span>
              <input
                type="checkbox"
                checked={bgConfig.fixMobileHeaderBrand !== false}
                onChange={(e) => updateLiveParam({ fixMobileHeaderBrand: e.target.checked })}
                className="w-4 h-4 accent-sky-500 shrink-0"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
              <div className="flex justify-between font-bold text-[11px]">
                <span>ماتی شیشه (Blur):</span>
                <span className="font-mono text-sky-400">{bgConfig.glassBlurPx ?? 24}px</span>
              </div>
              <input
                type="range"
                min={8}
                max={40}
                value={bgConfig.glassBlurPx ?? 24}
                onChange={(e) => updateLiveParam({ glassBlurPx: Number(e.target.value) })}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
              <div className="flex justify-between font-bold text-[11px]">
                <span>غلظت شیشه کارت:</span>
                <span className="font-mono text-sky-400">
                  {bgConfig.glassSurfaceOpacity ?? 64}%
                </span>
              </div>
              <input
                type="range"
                min={25}
                max={92}
                value={bgConfig.glassSurfaceOpacity ?? 64}
                onChange={(e) =>
                  updateLiveParam({ glassSurfaceOpacity: Number(e.target.value) })
                }
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
              <div className="flex justify-between font-bold text-[11px]">
                <span>درخشش لبه شیشه:</span>
                <span className="font-mono text-sky-400">
                  {bgConfig.glassBorderGlow ?? 42}%
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={85}
                value={bgConfig.glassBorderGlow ?? 42}
                onChange={(e) =>
                  updateLiveParam({ glassBorderGlow: Number(e.target.value) })
                }
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* مدیریت متون کارت‌ها */}
        <div className="lg:col-span-6 p-4 sm:p-5 rounded-3xl bg-[var(--input-bg)] border-2 border-emerald-500/40 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
            <div>
              <h3 className="font-black text-sm text-emerald-400">
                🧹 مدیریت و حذف متون اضافی کارت‌ها در هر ۳ پلتفرم
              </h3>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                روشن یا خاموش کردن متون روی کارت محصول و بالای اسلایدر در موبایل، تبلت و دسکتاپ
              </p>
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  updateLiveParam({
                    showShowcaseHeader: false,
                    showCatalogHeader: false,
                    showCardBrand: false,
                    showCardCategory: false,
                    showCardSubtitle: false,
                    showCardStockText: false,
                    showCardCartCountText: false,
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] cursor-pointer shadow"
              >
                ✨ حذف همه متون اضافی
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  updateLiveParam({
                    showShowcaseHeader: true,
                    showCatalogHeader: true,
                    showCardBrand: true,
                    showCardCategory: true,
                    showCardSubtitle: true,
                    showCardStockText: true,
                    showCardCartCountText: true,
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-[10px] cursor-pointer"
              >
                نمایش همه
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { key: "showShowcaseHeader", label: "تیتر بالای اسلایدر («نمایشگاه سه‌بعدی...»)" },
              { key: "showCatalogHeader", label: "تیتر بالای کاتالوگ («کاتالوگ تجهیزات...»)" },
              { key: "showCardBrand", label: "برچسب نام برند بالای کارت (APPLE و ...)" },
              { key: "showCardCategory", label: "برچسب دسته‌بندی بالای کارت («اتوبخار» و ...)" },
              { key: "showCardSubtitle", label: "توضیحات کوتاه زیر عنوان محصول" },
              { key: "showCardStockText", label: "عبارت سبز «موجود ✓» کنار قیمت" },
              { key: "showCardCartCountText", label: "متن «0 عدد در سبد شما» پایین دکمه" },
            ].map((item) => {
              const isShown = Boolean((bgConfig as any)[item.key]);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    updateLiveParam({ [item.key]: !isShown });
                  }}
                  className={
                    "p-2.5 rounded-2xl border text-right flex items-center justify-between gap-2 cursor-pointer transition " +
                    (isShown
                      ? "bg-[var(--modal-bg)] border-sky-500/50 text-[var(--text-primary)] font-black"
                      : "bg-[var(--modal-bg)]/50 border-[var(--card-border)] text-slate-400")
                  }
                >
                  <span className="truncate text-[11px]">{item.label}</span>
                  <span
                    className={
                      "px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 " +
                      (isShown ? "bg-sky-500/20 text-sky-400" : "bg-rose-500/20 text-rose-400")
                    }
                  >
                    {isShown ? "نمایش" : "حذف شده ✕"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ردیف ۲: پس‌زمینه سراسری و کنترلر فوتر */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-[var(--card-border)]">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-[var(--accent-blue)]">
              🖼️ تصویر، گیف یا SVG پس‌زمینه سراسری کل سایت (تضمین بدون لگ در ایران):
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                updateLiveParam({ enabled: !bgConfig.enabled });
              }}
              className={
                "px-3.5 py-1.5 rounded-xl font-black cursor-pointer transition " +
                (bgConfig.enabled
                  ? "bg-emerald-600 text-white"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-slate-400")
              }
            >
              {bgConfig.enabled ? "✓ پس‌زمینه سراسری: فعال" : "⚪ پس‌زمینه سراسری: غیرفعال"}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-black text-[var(--accent-blue)]">
                📤 آپلود مستقیم فایل (عکس، GIF، SVG، WebP) یا لینک:
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml,.svg,.gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleSelectFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer shadow transition disabled:opacity-50"
              >
                {uploading ? "در حال پردازش..." : "📁 انتخاب فایل از سیستم (عکس / GIF / SVG)"}
              </button>
            </div>

            <input
              type="text"
              dir="ltr"
              value={bgConfig.mediaUrl}
              onChange={(e) =>
                updateLiveParam({ enabled: true, mediaUrl: e.target.value })
              }
              placeholder="data:image/svg+xml... or /backgrounds/axon-bg-1-motherboard-pro.svg"
              className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        {/* کنترلر مهندسی ابعاد فوتر */}
        <div className="lg:col-span-5 p-4 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-black text-[var(--accent-blue)]">
              📐 ارتفاع پس‌زمینه فوتر و مقیاس درجا:
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => applyFooterPreset("ultra_slim")}
                className="px-2.5 py-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] font-black text-[10px] cursor-pointer"
              >
                ⚡ فوق فشرده
              </button>
              <button
                type="button"
                onClick={() => applyFooterPreset("compact_pro")}
                className="px-2.5 py-1 rounded-lg bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)] text-[var(--accent-blue)] font-black text-[10px] cursor-pointer"
              >
                ✨ استاندارد
              </button>
              <button
                type="button"
                onClick={() => applyFooterPreset("original")}
                className="px-2.5 py-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-[10px] cursor-pointer"
              >
                100%
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="p-2.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
              <div className="flex justify-between font-bold text-[11px] mb-1">
                <span>۱. اندازه اجزای فوتر (در جای خودشان):</span>
                <span className="font-mono text-emerald-400">{bgConfig.footerScale ?? 80}%</span>
              </div>
              <input
                type="range"
                min={60}
                max={100}
                value={bgConfig.footerScale ?? 80}
                onChange={(e) => updateLiveParam({ footerScale: Number(e.target.value) })}
                className="w-full accent-[var(--accent-blue)] cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
              <div className="flex justify-between font-bold text-[11px] mb-1">
                <span>۲. ارتفاع پس‌زمینه فوتر (Padding):</span>
                <span className="font-mono text-sky-400">{bgConfig.footerBgPaddingY ?? 16}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={64}
                value={bgConfig.footerBgPaddingY ?? 16}
                onChange={(e) => updateLiveParam({ footerBgPaddingY: Number(e.target.value) })}
                className="w-full accent-[var(--accent-blue)] cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
              <div className="flex justify-between font-bold text-[11px] mb-1">
                <span>۳. فاصله عمودی خط کپی‌رایت:</span>
                <span className="font-mono text-indigo-400">{bgConfig.footerInnerGap ?? 12}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={48}
                value={bgConfig.footerInnerGap ?? 12}
                onChange={(e) => updateLiveParam({ footerInnerGap: Number(e.target.value) })}
                className="w-full accent-[var(--accent-blue)] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
