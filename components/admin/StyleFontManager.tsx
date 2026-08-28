// File Path: components/admin/StyleFontManager.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";
import { fontEngine, CustomFontItem } from "@/lib/fontEngine";

export default function StyleFontManager() {
  const [primaryColor, setPrimaryColor] = useState("#0071e3");
  const [secondaryColor, setSecondaryColor] = useState("#4f46e5");
  const [selectedFont, setSelectedFont] = useState("Vazirmatn");
  const [selectedWeight, setSelectedWeight] = useState(400);
  const [borderRadius, setBorderRadius] = useState("1.5rem");
  const [customCss, setCustomCss] = useState("");
  
  const [fontsList, setFontsList] = useState<CustomFontItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fontFileInputRef = useRef<HTMLInputElement>(null);

  const fetchStyles = async () => {
    try {
      setFontsList(fontEngine.getAllFonts());
      const { data } = await supabase
        .from("site_styles")
        .select("*")
        .eq("id", "default_theme")
        .maybeSingle();

      if (data) {
        setPrimaryColor(data.primary_color || "#0071e3");
        setSecondaryColor(data.secondary_color || "#4f46e5");
        setSelectedFont(data.font_family || "Vazirmatn");
        setBorderRadius(data.border_radius || "1.5rem");
        setCustomCss(data.custom_css || "");
      }
    } catch (e) {
      console.error("Error fetching site styles:", e);
    }
  };

  useEffect(() => {
    fetchStyles();

    const styleChannel = supabase
      .channel("style-realtime-channel-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_styles" }, () => {
        fetchStyles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(styleChannel);
    };
  }, []);

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fontName = prompt("نام این فونت را وارد کنید:", file.name.replace(/\.[^/.]+$/, "")) || "CustomFont";
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const format = ext === "woff2" ? "woff2" : ext === "woff" ? "woff" : "truetype";

        const newFont: CustomFontItem = {
          id: `custom_${Date.now()}`,
          name: `${fontName} (شخصی)`,
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
        alert(`فونت اختصاصی «${fontName}» با موفقیت بارگذاری و در حافظه سایت ذخیره شد.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);

    const payload = {
      id: "default_theme",
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      font_family: selectedFont,
      border_radius: borderRadius,
      custom_css: customCss,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from("site_styles")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      soundEngine.playSuccess();
      setStatusMessage({ type: "success", text: "⚡ هویت بصری و فونت با موفقیت در دیتابیس ذخیره و در سراسر سایت اعمال شد." });

      document.documentElement.style.setProperty("--accent-blue", primaryColor);
      fontEngine.applyFontToTarget(selectedFont, "body");
    } catch (err) {
      console.error("Error updating styles:", err);
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی استایل‌ها در دیتابیس." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <input type="file" ref={fontFileInputRef} onChange={handleFontUpload} accept=".woff2,.woff,.ttf,.otf" className="hidden" />

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🎨</span> مدیریت هویت بصری، بارگذاری فونت و تایپوگرافی جهانی
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            شخصی‌سازی رنگ سازمانی، آپلود فونت از سیستم/موبایل با ذخیره دائمی و تنظیم وزن فونت از ۱۰۰ تا ۹۰۰
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fontFileInputRef.current?.click()}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <span>🔤</span>
            <span>+ آپلود فونت اختصاصی</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال اعمال..." : "💾 ذخیره و انتشار سراسری"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] space-y-6 shadow-xl text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* انتخاب فونت */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">تایپوگرافی و قلم اصلی سایت (Font Family):</label>
            <select
              value={selectedFont}
              onChange={(e) => {
                setSelectedFont(e.target.value);
                fontEngine.applyFontToTarget(e.target.value, "body");
              }}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--accent-blue)]"
            >
              {fontsList.map((f) => (
                <option key={f.id} value={f.fontFamily}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* انتخاب وزن فونت */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">وزن ضخامت پیش‌فرض متون (Font Weight):</label>
            <select
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(Number(e.target.value))}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--accent-blue)] font-mono"
            >
              <option value={100}>100 - نازک (Thin)</option>
              <option value={300}>300 - روشن (Light)</option>
              <option value={400}>400 - عادی (Regular)</option>
              <option value={500}>500 - متوسط (Medium)</option>
              <option value={600}>600 - نیمه‌ضخیم (SemiBold)</option>
              <option value={700}>700 - ضخیم (Bold)</option>
              <option value={800}>800 - خیلی ضخیم (ExtraBold)</option>
              <option value={900}>900 - فوق ضخیم (Black)</option>
            </select>
          </div>

          {/* رنگ اصلی */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">رنگ اصلی برند (Primary Accent):</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-2xl border border-[var(--card-border)] cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold uppercase outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>

          {/* رنگ مکمل */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">رنگ مکمل (Secondary Accent):</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-12 rounded-2xl border border-[var(--card-border)] cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold uppercase outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>

          {/* انحنای کارت‌ها */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">میزان گردی گوشه‌ها (Border Radius):</label>
            <select
              value={borderRadius}
              onChange={(e) => setBorderRadius(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--accent-blue)]"
            >
              <option value="0.75rem">کمی گرد (12px)</option>
              <option value="1rem">استاندارد مدرن (16px)</option>
              <option value="1.5rem">بسیار گرد و شیشه‌ای (24px)</option>
              <option value="2rem">حداکثر انحنای اپلی (32px)</option>
            </select>
          </div>
        </div>

        {/* کدهای سفارشی CSS */}
        <div className="space-y-2 pt-4 border-t border-[var(--card-border)]">
          <label className="block text-xs font-bold text-[var(--text-secondary)]">استایل‌های پیشرفته CSS:</label>
          <textarea
            rows={3}
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            placeholder="/* کدهای سفارشی CSS */"
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-primary)] outline-none leading-relaxed"
          />
        </div>

        {/* پیش‌نمایش زنده */}
        <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] space-y-3">
          <span className="text-[11px] font-bold text-[var(--text-secondary)]">پیش‌نمایش زنده فونت و وزن انتخابی:</span>
          <div style={{ fontFamily: `'${selectedFont}', sans-serif`, fontWeight: selectedWeight }} className="space-y-2">
            <h4 className="text-base text-[var(--text-primary)]">فروشگاه تخصصی تجهیزات دیجیتال و مانیتورهای استودیویی ۵K</h4>
            <p className="text-xs text-[var(--text-secondary)]">نمایشگر رتینا با کالیبراسیون سخت‌افزاری و تفکیک بیش از ۱ میلیارد رنگ با زاویه دید ۱۷۸ درجه.</p>
          </div>
        </div>
      </form>
    </div>
  );
}