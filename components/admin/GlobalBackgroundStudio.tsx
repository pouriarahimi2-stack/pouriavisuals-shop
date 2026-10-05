"use client";
// File Path: components/admin/GlobalBackgroundStudio.tsx
import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";
import {
  GlobalBackgroundConfig,
  PRESET_ANIMATED_SVGS,
} from "@/components/GlobalSiteBackground";

export default function GlobalBackgroundStudio() {
  const [bgConfig, setBgConfig] = useState<GlobalBackgroundConfig>({
    enabled: false,
    mediaUrl: "",
    mediaType: "auto",
    presetId: "cyber_grid",
    opacity: 35,
    blurPx: 0,
    overlayOpacity: 40,
    sizeMode: "cover",
    applyToAdmin: false,
  });

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
        setBgConfig((prev) => ({
          ...prev,
          enabled: true,
          mediaUrl: json.url,
          mediaType: detectedType,
        }));
        setFeedback({
          type: "ok",
          text: "✓ فایل «" + file.name + "» آپلود شد. اکنون روی «ذخیره و انتشار پس‌زمینه» کلیک کنید.",
        });
        setUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        soundEngine.playSuccess();
        setBgConfig((prev) => ({
          ...prev,
          enabled: true,
          mediaUrl: String(reader.result || ""),
          mediaType: detectedType,
        }));
        setFeedback({
          type: "ok",
          text: "✓ فایل «" + file.name + "» آماده شد. اکنون روی «ذخیره و انتشار پس‌زمینه» کلیک کنید.",
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      setFeedback({ type: "err", text: "خطا در آپلود فایل." });
    }
  };

  const handleSaveBackground = async (e: React.FormEvent) => {
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
          text: "✓ پس‌زمینه سراسری سایت (عکس/GIF/SVG) با موفقیت ذخیره و به صورت بلادرنگ در کل سایت فعال شد!",
        });
        setTimeout(() => setFeedback(null), 4500);
      } else {
        setFeedback({ type: "err", text: "خطا در ذخیره تنظیمات پس‌زمینه." });
      }
    } catch {
      setFeedback({ type: "err", text: "خطا در ارتباط با سرور." });
    } finally {
      setSaving(false);
    }
  };

  const previewUrl =
    bgConfig.mediaType === "preset_svg"
      ? PRESET_ANIMATED_SVGS[bgConfig.presetId || "cyber_grid"]?.dataUri
      : bgConfig.mediaUrl;

  return (
    <form
      onSubmit={handleSaveBackground}
      className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
        <div>
          <h2 className="font-black text-sm sm:text-base text-[var(--accent-blue)] flex items-center gap-2">
            <span>🖼️</span> استودیوی پس‌زمینه سراسری کل سایت (عکس، GIF، SVG و تصویر متحرک — بدون افت سرعت)
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            پشتیبانی از آپلود مستقیم یا لینک عکس، گیف متحرک (GIF)، وکتور (SVG) و انیمیشن با رندر سخت‌افزاری (Zero-Lag)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setBgConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
            }}
            className={
              "px-4 py-2.5 rounded-2xl font-black cursor-pointer transition " +
              (bgConfig.enabled
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-slate-400")
            }
          >
            {bgConfig.enabled ? "✓ پس‌زمینه سراسری: فعال" : "⚪ پس‌زمینه سراسری: غیرفعال"}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "در حال ذخیره..." : "💾 ذخیره و انتشار پس‌زمینه"}
          </button>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: "auto", label: "🖼️ عکس / خودکار" },
              { id: "gif", label: "🎞️ گیف (GIF)" },
              { id: "svg", label: "✒️ برداری (SVG)" },
              { id: "video", label: "🎬 ویدیو (MP4/WebM)" },
              { id: "preset_svg", label: "⚡ SVG متحرک آماده" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setBgConfig((prev) => ({
                    ...prev,
                    enabled: true,
                    mediaType: t.id as any,
                  }));
                }}
                className={
                  "p-2.5 rounded-xl border font-black text-[11px] cursor-pointer transition " +
                  (bgConfig.mediaType === t.id
                    ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow"
                    : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]")
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {bgConfig.mediaType === "preset_svg" ? (
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
              <label className="block font-black text-[var(--accent-blue)]">
                ⚡ انتخاب انیمیشن برداری SVG آماده (حجم صفر کیلوبایت — ۶۰ فریم بر ثانیه):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(PRESET_ANIMATED_SVGS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setBgConfig((prev) => ({
                        ...prev,
                        enabled: true,
                        mediaType: "preset_svg",
                        presetId: key,
                      }));
                    }}
                    className={
                      "p-3 rounded-xl border text-right font-bold cursor-pointer transition " +
                      (bgConfig.presetId === key
                        ? "bg-[var(--accent-blue)]/15 border-[var(--accent-blue)] text-[var(--text-primary)] font-black"
                        : "bg-[var(--modal-bg)] border-[var(--card-border)] text-[var(--text-secondary)]")
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="font-black text-[var(--accent-blue)]">
                  📤 آپلود مستقیم فایل (عکس، GIF، SVG، WebP) یا وارد کردن لینک:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml,.svg,.gif,video/mp4,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleSelectFile(e.target.files[0]);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer shadow transition disabled:opacity-50"
                >
                  {uploading
                    ? "در حال آپلود..."
                    : "📁 انتخاب فایل از سیستم (عکس / GIF / SVG)"}
                </button>
              </div>

              <input
                type="text"
                dir="ltr"
                value={bgConfig.mediaUrl}
                onChange={(e) =>
                  setBgConfig((prev) => ({
                    ...prev,
                    enabled: true,
                    mediaUrl: e.target.value,
                  }))
                }
                placeholder="https://example.com/background.gif or .svg or .webp"
                className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1.5">
              <div className="flex justify-between font-bold">
                <span>وضوح تصویر (Opacity):</span>
                <span className="font-mono text-[var(--accent-blue)]">{bgConfig.opacity}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={bgConfig.opacity}
                onChange={(e) =>
                  setBgConfig((prev) => ({ ...prev, opacity: Number(e.target.value) }))
                }
                className="w-full accent-[var(--accent-blue)] cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1.5">
              <div className="flex justify-between font-bold">
                <span>تیرگی محافظ متن:</span>
                <span className="font-mono text-[var(--accent-blue)]">
                  {bgConfig.overlayOpacity}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                value={bgConfig.overlayOpacity}
                onChange={(e) =>
                  setBgConfig((prev) => ({
                    ...prev,
                    overlayOpacity: Number(e.target.value),
                  }))
                }
                className="w-full accent-[var(--accent-blue)] cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1.5">
              <div className="flex justify-between font-bold">
                <span>مات‌شدگی (Blur):</span>
                <span className="font-mono text-[var(--accent-blue)]">{bgConfig.blurPx}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={24}
                value={bgConfig.blurPx}
                onChange={(e) =>
                  setBgConfig((prev) => ({ ...prev, blurPx: Number(e.target.value) }))
                }
                className="w-full accent-[var(--accent-blue)] cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                نحوه چیدمان تصویر در صفحه:
              </label>
              <select
                value={bgConfig.sizeMode}
                onChange={(e) =>
                  setBgConfig((prev) => ({
                    ...prev,
                    sizeMode: e.target.value as any,
                  }))
                }
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                <option value="cover">🖼️ تمام‌صفحه یکدست (Cover)</option>
                <option value="repeat">🏁 تکرار الگوی کاشی‌وار (Repeat Pattern / SVG)</option>
                <option value="contain">📐 نمایش کامل در مرکز (Contain)</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between cursor-pointer font-bold">
                <span>اعمال در داخل محیط پنل ادمین</span>
                <input
                  type="checkbox"
                  checked={bgConfig.applyToAdmin}
                  onChange={(e) =>
                    setBgConfig((prev) => ({ ...prev, applyToAdmin: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[var(--accent-blue)]"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <span className="font-black text-[var(--text-secondary)] mb-2 block">
            👁️ پیش‌نمایش زنده پس‌زمینه انتخابی:
          </span>
          <div className="relative flex-1 min-h-[230px] rounded-3xl border-2 border-[var(--card-border)] overflow-hidden bg-[#07090e] flex items-center justify-center p-6">
            {bgConfig.enabled && previewUrl && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("${previewUrl}")`,
                  backgroundSize:
                    bgConfig.sizeMode === "repeat" ? "auto" : bgConfig.sizeMode,
                  backgroundRepeat:
                    bgConfig.sizeMode === "repeat" ? "repeat" : "no-repeat",
                  backgroundPosition: "center",
                  opacity: bgConfig.opacity / 100,
                  filter: bgConfig.blurPx > 0 ? `blur(${bgConfig.blurPx}px)` : undefined,
                }}
              />
            )}
            {bgConfig.enabled && (
              <div
                className="absolute inset-0 bg-[#07090e]"
                style={{ opacity: bgConfig.overlayOpacity / 100 }}
              />
            )}

            <div className="relative z-10 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/15 text-white text-center space-y-1.5 shadow-2xl max-w-xs">
              <div className="text-xs font-black text-sky-400">
                آکسون کور | AXON CORE
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                پیش‌نمایش کارت‌های سایت روی پس‌زمینه انتخابی شما بدون افت سرعت
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
