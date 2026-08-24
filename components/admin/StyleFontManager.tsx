"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface SiteStyleConfig {
  id?: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  border_radius: string;
  custom_css?: string;
}

export default function StyleFontManager() {
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [secondaryColor, setSecondaryColor] = useState("#4f46e5");
  const [fontFamily, setFontFamily] = useState("Vazirmatn");
  const [borderRadius, setBorderRadius] = useState("1.5rem");
  const [customCss, setCustomCss] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStyles = async () => {
    try {
      const { data, error } = await supabase
        .from("site_styles")
        .select("*")
        .eq("id", "default_theme")
        .maybeSingle();

      if (data) {
        setPrimaryColor(data.primary_color || "#2563eb");
        setSecondaryColor(data.secondary_color || "#4f46e5");
        setFontFamily(data.font_family || "Vazirmatn");
        setBorderRadius(data.border_radius || "1.5rem");
        setCustomCss(data.custom_css || "");
      }
    } catch (e) {
      console.error("Error fetching site styles:", e);
    }
  };

  useEffect(() => {
    fetchStyles();

    // همگام‌سازی بلادرنگ استایل‌ها از طریق وب‌سوکت
    const styleChannel = supabase
      .channel("style-realtime-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_styles" }, () => {
        fetchStyles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(styleChannel);
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      id: "default_theme",
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      font_family: fontFamily,
      border_radius: borderRadius,
      custom_css: customCss,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from("site_styles")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      setStatusMessage({ type: "success", text: "⚡ استایل‌ها و فونت با موفقیت در دیتابیس ذخیره و زنده اعمال شدند." });
      
      // اعمال فوری در CSS متغیرهای مرورگر ادمین
      document.documentElement.style.setProperty("--accent-blue", primaryColor);
      document.documentElement.style.setProperty("--font-primary", fontFamily);
    } catch (err) {
      console.error("Error updating styles:", err);
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی استایل‌ها در دیتابیس." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">🎨 مدیریت هویت بصری، فونت و استایل لایو</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">شخصی‌سازی رنگ سازمانی، تایپوگرافی و قالب سایت با ذخیره ابری و وب‌سوکت</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition shadow-md cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال اعمال..." : "💾 ذخیره و انتشار سراسری"}
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* رنگ اصلی */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">رنگ اصلی برند (Primary Accent)</label>
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
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold uppercase"
              />
            </div>
          </div>

          {/* رنگ مکمل */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">رنگ دوم و گرادیانت (Secondary Accent)</label>
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
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold uppercase"
              />
            </div>
          </div>

          {/* انتخاب فونت */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">تایپوگرافی و فونت اصلی</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="Vazirmatn">فونت وزیر متن (Vazirmatn)</option>
              <option value="IranSans">فونت ایران سنس (IRANSans)</option>
              <option value="YekanBakh">فونت یکان باخ (YekanBakh)</option>
              <option value="Shabnam">فونت شبنم (Shabnam)</option>
              <option value="Tahoma">فونت تاهوما (Tahoma)</option>
            </select>
          </div>

          {/* میزان گردی گوشه‌ها */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">میزان انحنای کارت‌ها (Border Radius)</label>
            <select
              value={borderRadius}
              onChange={(e) => setBorderRadius(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="0.75rem">کمی گرد (12px)</option>
              <option value="1rem">استاندارد مدرن (16px)</option>
              <option value="1.5rem">بسیار گرد و شیشه‌ای (24px)</option>
              <option value="2rem">حداکثر انحنای اپلی (32px)</option>
            </select>
          </div>
        </div>

        {/* کدهای سفارشی CSS */}
        <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
          <label className="block text-xs font-bold text-[var(--text-secondary)]">استایل‌های سفارشی پیشرفته (Custom CSS)</label>
          <textarea
            rows={4}
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            placeholder="/* کدهای CSS اختصاصی خود را اینجا وارد کنید */"
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-primary)] outline-none"
          />
        </div>

        {/* پیش‌نمایش المان */}
        <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] space-y-3">
          <span className="text-[11px] font-bold text-[var(--text-secondary)]">پیش‌نمایش دکمه و برچسب با تنظیمات زنده:</span>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              style={{ backgroundColor: primaryColor, borderRadius }}
              className="px-6 py-2.5 text-white font-extrabold text-xs shadow-md"
            >
              دکمه نمونه اکشن
            </button>
            <span
              style={{ borderColor: primaryColor, color: primaryColor, borderRadius }}
              className="px-4 py-1.5 border text-xs font-bold"
            >
              برچسب قیمت و تخفیف
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}