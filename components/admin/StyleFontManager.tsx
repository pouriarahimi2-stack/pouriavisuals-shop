"use client";

import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { fontEngine, CustomFontItem } from "@/lib/fontEngine";
import { supabase } from "@/lib/supabase";

export default function StyleFontManager() {
  const [primaryColor, setPrimaryColor] = useState("#0071e3");
  const [secondaryColor, setSecondaryColor] = useState("#4f46e5");
  const [selectedFont, setSelectedFont] = useState("Vazirmatn");
  const [selectedWeight, setSelectedWeight] = useState(400);
  const [borderRadius, setBorderRadius] = useState("1.5rem");
  const [customCss, setCustomCss] = useState("");

  // کنترلرهای استایل‌ساز بصری پیشرفته (Visual CSS Studio)
  const [glassBlurPx, setGlassBlurPx] = useState<number>(20);
  const [cardShadowStrength, setCardShadowStrength] = useState<"soft" | "medium" | "deep" | "neon">("medium");
  const [buttonHoverScale, setButtonHoverScale] = useState<number>(1.03);
  const [lineHeightScale, setLineHeightScale] = useState<number>(1.8);
  const [headingTracking, setHeadingTracking] = useState<string>("-0.02em");

  const [fontsList, setFontsList] = useState<CustomFontItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fontFileInputRef = useRef<HTMLInputElement>(null);

  const fetchStyles = async () => {
    try {
      setFontsList(fontEngine.getAllFonts());
      const res = await fetch("/api/styles", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setPrimaryColor(json.data.primary_color || "#0071e3");
          setSecondaryColor(json.data.secondary_color || "#4f46e5");
          setSelectedFont(json.data.font_family || "Vazirmatn");
          setBorderRadius(json.data.border_radius || "1.5rem");
          setCustomCss(json.data.custom_css || "");
        }
      }
    } catch (e) {
      console.error("Error fetching site styles:", e);
    }
  };

  useEffect(() => {
    fetchStyles();

    const channel = supabase
      .channel("realtime-style-font-manager")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_styles" }, () => {
        fetchStyles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const buildGeneratedVisualCss = () => {
    const shadowVal =
      cardShadowStrength === "soft"
        ? "0 8px 24px -6px rgba(0,0,0,0.12)"
        : cardShadowStrength === "deep"
        ? "0 20px 50px -12px rgba(0,0,0,0.45)"
        : cardShadowStrength === "neon"
        ? "0 12px 36px -8px " + primaryColor + "55"
        : "0 14px 34px -10px rgba(0,0,0,0.25)";

    return [
      "/* === AXON VISUAL CSS ENGINE === */",
      ":root { --accent-blue: " + primaryColor + "; --secondary-color: " + secondaryColor + "; --border-radius-card: " + borderRadius + "; }",
      "body { line-height: " + lineHeightScale + "; font-weight: " + selectedWeight + "; }",
      "h1, h2, h3, h4 { letter-spacing: " + headingTracking + "; }",
      ".backdrop-blur-2xl, .backdrop-blur-xl { backdrop-filter: blur(" + glassBlurPx + "px) !important; }",
      ".shadow-xl, .shadow-2xl { box-shadow: " + shadowVal + " !important; }",
      "button:hover, a.rounded-2xl:hover { transform: scale(" + buttonHoverScale + "); }",
    ].join("\n");
  };

  const applyVisualPreset = (presetName: string) => {
    soundEngine.playClick();
    if (presetName === "apple_glass") {
      setPrimaryColor("#0071e3");
      setSecondaryColor("#38bdf8");
      setBorderRadius("1.75rem");
      setGlassBlurPx(28);
      setCardShadowStrength("medium");
    } else if (presetName === "cyber_neon") {
      setPrimaryColor("#0284c7");
      setSecondaryColor("#6366f1");
      setBorderRadius("1.5rem");
      setGlassBlurPx(24);
      setCardShadowStrength("neon");
    } else if (presetName === "minimal_sharp") {
      setPrimaryColor("#2563eb");
      setSecondaryColor("#475569");
      setBorderRadius("0.85rem");
      setGlassBlurPx(12);
      setCardShadowStrength("soft");
    }
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fontName =
      prompt("نام این فونت را وارد کنید:", file.name.replace(/\.[^/.]+$/, "")) || "CustomFont";
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const format = ext === "woff2" ? "woff2" : ext === "woff" ? "woff" : "truetype";

        const newFont: CustomFontItem = {
          id: "custom_" + Date.now(),
          name: fontName + " (اختصاصی)",
          fontFamily: fontName,
          fontUrlOrBase64: reader.result,
          format,
          weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
          isCustom: true,
        };

        fontEngine.registerCustomFont(newFont);
        setFontsList(fontEngine.getAllFonts());
        setSelectedFont(fontName);
        fontEngine.applyFontToTarget(fontName, "body");
        soundEngine.playSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setStatusMessage(null);

    const cleanCustom = customCss.replace(/\/\* === AXON VISUAL CSS ENGINE === \*\/[\s\S]*?(?=\/\*|$)/g, "").trim();
    const compiledCss = buildGeneratedVisualCss() + (cleanCustom ? "\n" + cleanCustom : "");

    const payload = {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      font_family: selectedFont,
      border_radius: borderRadius,
      custom_css: compiledCss,
    };

    try {
      const res = await fetch("/api/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "خطا در ذخیره دیتابیس");

      setCustomCss(compiledCss);
      soundEngine.playSuccess();
      setStatusMessage({
        type: "success",
        text: "⚡ هویت بصری، تایپوگرافی و قوانین استایل‌ساز CSS با موفقیت در دیتابیس ذخیره و به صورت زنده در کل سایت اعمال شد.",
      });

      document.documentElement.style.setProperty("--accent-blue", primaryColor);
      fontEngine.applyFontToTarget(selectedFont, "body");
      window.dispatchEvent(new Event("site_styles_updated"));
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "خطا در ذخیره‌سازی استایل‌ها در دیتابیس.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <input
        type="file"
        ref={fontFileInputRef}
        onChange={handleFontUpload}
        accept=".woff2,.woff,.ttf,.otf"
        className="hidden"
      />

      <div className="bg-[var(--modal-bg)] p-5 sm:p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>✨</span> استودیوی هویت بصری، فونت‌ها و استایل‌ساز پیشرفته CSS
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            کنترل کامل تایپوگرافی کل سایت، آپلود فونت اختصاصی و تولیدکننده بصری استایل‌های CSS بدون نیاز به کدنویسی دستی
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => fontFileInputRef.current?.click()}
            className="flex-1 sm:flex-initial justify-center px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <span>🔤</span>
            <span>+ آپلود فونت اختصاصی</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال انتشار..." : "💾 ذخیره و انتشار سراسری در سایت"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " +
            (statusMessage.type === "success"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-rose-500/15 text-rose-400 border border-rose-500/30")
          }
        >
          {statusMessage.text}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-[var(--modal-bg)] p-5 sm:p-8 rounded-3xl border border-[var(--card-border)] space-y-6 shadow-xl text-xs"
      >
        {/* تمپلیت‌های آماده با یک کلیک */}
        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
          <span className="font-black text-[var(--accent-blue)] block">
            🎨 پیش‌فرض‌های آماده طراحی (با یک کلیک اعمال کنید):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => applyVisualPreset("apple_glass")}
              className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-right cursor-pointer transition"
            >
              🍎 استایل شیشه‌ای مدرن (Apple Glassmorphism)
            </button>
            <button
              type="button"
              onClick={() => applyVisualPreset("cyber_neon")}
              className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-indigo-500 font-bold text-right cursor-pointer transition"
            >
              ⚡ استایل نئونی و درخشان (21st.dev Glow)
            </button>
            <button
              type="button"
              onClick={() => applyVisualPreset("minimal_sharp")}
              className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-emerald-500 font-bold text-right cursor-pointer transition"
            >
              📐 استایل مینیمال و رسمی (Minimal Clean)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-2">
            <label className="block font-bold text-[var(--text-secondary)]">
              تایپوگرافی و قلم اصلی کل سایت:
            </label>
            <select
              value={selectedFont}
              onChange={(e) => {
                setSelectedFont(e.target.value);
                fontEngine.applyFontToTarget(e.target.value, "body");
              }}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              {fontsList.map((f) => (
                <option key={f.id} value={f.fontFamily}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-[var(--text-secondary)]">
              ضخامت پیش‌فرض متون (Font Weight):
            </label>
            <select
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(Number(e.target.value))}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold font-mono outline-none cursor-pointer"
            >
              <option value={300}>300 - ظریف (Light)</option>
              <option value={400}>400 - استاندارد (Regular)</option>
              <option value={500}>500 - متوسط (Medium)</option>
              <option value={700}>700 - ضخیم (Bold)</option>
              <option value={900}>900 - فوق ضخیم (Black)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-[var(--text-secondary)]">
              گردی گوشه‌های کارت‌ها و دکمه‌ها:
            </label>
            <select
              value={borderRadius}
              onChange={(e) => setBorderRadius(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              <option value="0.75rem">ملایم (12px)</option>
              <option value="1.25rem">استاندارد مدرن (20px)</option>
              <option value="1.5rem">گرد و شیشه‌ای (24px)</option>
              <option value="2.2rem">حداکثر انحنا (35px)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-[var(--text-secondary)]">
              رنگ اصلی سازمانی (Primary Accent):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-2xl border border-[var(--card-border)] cursor-pointer bg-transparent"
              />
              <input
                type="text"
                dir="ltr"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold uppercase outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-[var(--text-secondary)]">
              رنگ مکمل (Secondary Accent):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-12 rounded-2xl border border-[var(--card-border)] cursor-pointer bg-transparent"
              />
              <input
                type="text"
                dir="ltr"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold uppercase outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-[var(--text-secondary)]">
              شدت سایه و عمق کارت‌ها (Shadow Depth):
            </label>
            <select
              value={cardShadowStrength}
              onChange={(e) => setCardShadowStrength(e.target.value as any)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              <option value="soft">سایه نرم و ظریف</option>
              <option value="medium">سایه استاندارد سه‌بعدی</option>
              <option value="deep">سایه عمیق سینمایی</option>
              <option value="neon">درخشش نئونی هم‌رنگ برند</option>
            </select>
          </div>
        </div>

        {/* کنترلرهای بصری استایل‌‌ساز CSS */}
        <div className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
          <h3 className="font-black text-sm text-[var(--accent-blue)]">
            🎛️ کنترلرهای بصری استایل‌ساز پیشرفته CSS (تولید خودکار کدهای استایل)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
              <div className="flex justify-between">
                <span className="font-bold">شدت ماتی شیشه‌ای (Backdrop Blur):</span>
                <span className="font-mono font-black text-[var(--accent-blue)]">{glassBlurPx}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={40}
                value={glassBlurPx}
                onChange={(e) => setGlassBlurPx(Number(e.target.value))}
                className="w-full accent-[var(--accent-blue)] cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
              <div className="flex justify-between">
                <span className="font-bold">ضریب بزرگنمایی دکمه‌ها (Hover Scale):</span>
                <span className="font-mono font-black text-emerald-400">{buttonHoverScale}x</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={1.08}
                step={0.01}
                value={buttonHoverScale}
                onChange={(e) => setButtonHoverScale(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
              <div className="flex justify-between">
                <span className="font-bold">فاصله خطوط متون (Line Height):</span>
                <span className="font-mono font-black text-indigo-400">{lineHeightScale}</span>
              </div>
              <input
                type="range"
                min={1.4}
                max={2.2}
                step={0.1}
                value={lineHeightScale}
                onChange={(e) => setLineHeightScale(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="block font-bold text-[var(--text-secondary)]">
              کدهای تکمیلی CSS (خروجی استایل‌ساز بصری + کدهای دلخواه شما):
            </label>
            <textarea
              rows={4}
              dir="ltr"
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              placeholder="/* کدهای سفارشی CSS */"
              className="w-full p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[11px] outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* پیش‌نمایش زنده فونت و استایل */}
        <div
          style={{
            fontFamily: "'" + selectedFont + "', sans-serif",
            fontWeight: selectedWeight,
            lineHeight: lineHeightScale,
            borderRadius,
          }}
          className="p-6 border border-[var(--card-border)] bg-[var(--input-bg)] space-y-3"
        >
          <span className="text-[11px] font-bold text-[var(--accent-blue)] block">
            👁️ پیش‌نمایش زنده تایپوگرافی، رنگ و انحنای انتخابی:
          </span>
          <h4 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
            فروشگاه تخصصی تکنولوژی، سخت‌افزار و گجت‌های هوشمند آکسون کور
          </h4>
          <p className="text-xs text-[var(--text-secondary)]">
            تمامی تغییرات فونت، ضخامت قلم، رنگ‌های سازمانی و پارامترهای استایل‌ساز بصری به محض ذخیره، در دسکتاپ، موبایل و تبلت اعمال می‌شوند.
          </p>
          <span
            style={{ backgroundColor: primaryColor, borderRadius }}
            className="inline-block px-5 py-2.5 text-white font-black text-xs shadow-lg"
          >
            نمونه دکمه با رنگ و انحنای انتخابی
          </span>
        </div>
      </form>
    </div>
  );
}
