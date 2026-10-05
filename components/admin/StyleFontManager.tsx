"use client";
// File Path: components/admin/StyleFontManager.tsx
import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";
import {
  GlobalBackgroundConfig,
  PRESET_ANIMATED_SVGS,
} from "@/components/GlobalSiteBackground";

const FONT_OPTIONS = [
  { id: "Vazirmatn", label: "فونت وزیرمتن (Vazirmatn - استاندارد و مدرن)" },
  { id: "IRANSans", label: "ایران‌سنس (IRANSansX - رسمی و خوانا)" },
  { id: "YekanBakh", label: "یکان‌بخ (Yekan Bakh - استارتاپی و ضخیم)" },
  { id: "Dana", label: "فونت دانا (Dana - نرم و گرد)" },
];

export default function StyleFontManager() {
  const [activeFont, setActiveFont] = useState("Vazirmatn");
  const [accentColor, setAccentColor] = useState("#0ea5e9");
  const [borderRadiusMode, setBorderRadiusMode] = useState("rounded-3xl");
  const [customCss, setCustomCss] = useState("");

  // تنظیمات پس‌زمینه سراسری کل سایت (عکس، GIF، SVG، WebP و ویدیو)
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

  const [uploadingBg, setUploadingBg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadCurrentStylesAndBg = async () => {
    try {
      const [stRes, tbRes] = await Promise.all([
        fetch("/api/admin/styles?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
        fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
      ]);

      if (stRes && stRes.ok) {
        const stJson = await stRes.json();
        const s = stJson.styles || stJson.data || {};
        if (s.active_font_id || s.fontFamily) setActiveFont(s.active_font_id || s.fontFamily);
        if (s.primary_color || s.accentColor) setAccentColor(s.primary_color || s.accentColor);
        if (s.custom_css) setCustomCss(s.custom_css);
      }

      if (tbRes && tbRes.ok) {
        const tbJson = await tbRes.json();
        const cfg = tbJson.config || {};
        if (cfg.globalBackground) {
          setBgConfig((prev) => ({
            ...prev,
            ...cfg.globalBackground,
          }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadCurrentStylesAndBg();
  }, []);

  const handleUploadBackgroundMedia = async (file: File) => {
    soundEngine.playClick();
    setUploadingBg(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (res.ok && json.success && json.url) {
        soundEngine.playSuccess();
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        let detectedType: GlobalBackgroundConfig["mediaType"] = "image";
        if (ext === "gif" || file.type.includes("gif")) detectedType = "gif";
        else if (ext === "svg" || file.type.includes("svg")) detectedType = "svg";
        else if (ext === "mp4" || ext === "webm" || file.type.includes("video"))
          detectedType = "video";

        setBgConfig((prev) => ({
          ...prev,
          enabled: true,
          mediaUrl: json.url,
          mediaType: detectedType,
        }));
        setFeedback({
          type: "ok",
          text:
            "✓ فایل پس‌زمینه («" +
            file.name +
            "») آپلود شد. روی دکمه «ذخیره و انتشار بلادرنگ» کلیک کنید.",
        });
      } else {
        setFeedback({
          type: "err",
          text: json.message || "خطا در آپلود فایل پس‌زمینه.",
        });
      }
    } catch {
      setFeedback({ type: "err", text: "خطا در ارتباط با سرور آپلود." });
    } finally {
      setUploadingBg(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setFeedback(null);

    try {
      const tbRes = await fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" });
      const tbJson = await tbRes.json().catch(() => ({}));
      const prevConfig = tbJson?.config || {};

      const [saveTb, saveSt] = await Promise.all([
        fetch("/api/theme-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: {
              ...prevConfig,
              globalBackground: bgConfig,
            },
          }),
        }),
        fetch("/api/admin/styles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            active_font_id: activeFont,
            fontFamily: activeFont,
            primary_color: accentColor,
            accentColor,
            borderRadiusMode,
            custom_css: customCss,
          }),
        }),
      ]);

      if (saveTb.ok || saveSt.ok) {
        soundEngine.playSuccess();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("theme_builder_updated"));
          window.dispatchEvent(new CustomEvent("site_info_updated"));
        }
        setFeedback({
          type: "ok",
          text: "✓ تنظیمات پس‌زمینه سراسری (عکس/GIF/SVG)، فونت و استایل با موفقیت در کل سایت اعمال شد!",
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

  const previewUrl =
    bgConfig.mediaType === "preset_svg"
      ? PRESET_ANIMATED_SVGS[bgConfig.presetId || "cyber_grid"]?.dataUri
      : bgConfig.mediaUrl;

  return (
    <form
      onSubmit={handleSaveAll}
      className="space-y-6 font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>✨</span> استودیوی پس‌زمینه سراسری سایت (عکس، GIF، SVG و انیمیشن)، فونت‌ها و CSS
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تنظیم تصویر ثابت، گیف متحرک، SVG و انیمیشن در پس‌زمینه کل سایت با رندر سخت‌افزاری (Zero-Lag) بدون افت سرعت لود
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-xl hover:opacity-90 transition cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال انتشار زنده..." : "💾 ذخیره و انتشار بلادرنگ در کل سایت"}
        </button>
      </div>

      {feedback && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-black border " +
            (feedback.type === "ok"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/15 border-rose-500/30 text-rose-400")
          }
        >
          {feedback.text}
        </div>
      )}

      {/* بخش ۱: استودیوی پس‌زمینه سراسری کل سایت (پشتیبانی از عکس، GIF، SVG، WebP و ویدیو) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
          <div>
            <h2 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2">
              <span>🖼️</span> پس‌زمینه سراسری کل سایت (پشتیبانی از JPG, PNG, WebP, GIF, SVG, MP4/WebM)
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              این تصویر یا انیمیشن در یک لایه GPU مجزا پس از لود محتوا اجرا می‌شود و سرعت سایت (LCP/FPS) را ۱٪ هم کاهش نمی‌دهد.
            </p>
          </div>

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
            {bgConfig.enabled
              ? "✓ پس‌زمینه سراسری سایت: فعال"
              : "⚪ پس‌زمینه سراسری سایت: غیرفعال"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ستون تنظیمات فایل، لینک و الگوهای آماده */}
          <div className="lg:col-span-7 space-y-4">
            {/* انتخاب نوع منبع */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: "auto", label: "🖼️ عکس / خودکار" },
                { id: "gif", label: "🎞️ گیف متحرک (GIF)" },
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
                    📤 آپلود مستقیم فایل (عکس، GIF، SVG، WebP یا ویدیو) یا وارد کردن لینک:
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml,.svg,.gif,video/mp4,video/webm"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleUploadBackgroundMedia(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingBg}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer shadow transition disabled:opacity-50"
                  >
                    {uploadingBg
                      ? "در حال آپلود روی سرور..."
                      : "📁 انتخاب و آپلود فایل (عکس / GIF / SVG)"}
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

            {/* اسلایدرهای تنظیم شفافیت، بلور و نحوه نمایش */}
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
                  <span>مات‌شدگی شیشه‌ای (Blur):</span>
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
                  <span>نمایش این پس‌زمینه در داخل پنل ادمین هم فعال باشد</span>
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

          {/* ستون پیش‌نمایش زنده پس‌زمینه انتخابی */}
          <div className="lg:col-span-5 flex flex-col">
            <span className="font-black text-[var(--text-secondary)] mb-2 block">
              👁️ پیش‌نمایش زنده پس‌زمینه و خوانایی کارت‌های سایت:
            </span>
            <div className="relative flex-1 min-h-[250px] rounded-3xl border-2 border-[var(--card-border)] overflow-hidden bg-[#07090e] flex items-center justify-center p-6">
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
                  نمونه نمایش کارت محصول روی پس‌زمینه فعلی شما با حفظ ۱۰۰٪ سرعت و خوانایی
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* بخش ۲: تایپوگرافی، رنگ سازمانی و CSS سفارشی */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            🔤 تایپوگرافی و رنگ اصلی برند
          </h2>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
              فونت اصلی کل وب‌سایت:
            </label>
            <select
              value={activeFont}
              onChange={(e) => setActiveFont(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
              رنگ تاکیدی دکمه‌ها و لینک‌ها (Accent Color):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-11 rounded-xl border border-[var(--card-border)] cursor-pointer bg-transparent"
              />
              <input
                type="text"
                dir="ltr"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            💻 استایل اختصاصی (Custom CSS)
          </h2>
          <textarea
            rows={5}
            dir="ltr"
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            placeholder="/* کدهای CSS سفارشی شما */"
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[11px] outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>
    </form>
  );
}
