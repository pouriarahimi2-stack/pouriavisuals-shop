"use client";
import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

const FONT_OPTIONS = [
  { value: "Vazirmatn", label: "وزیرمتن (پیش‌فرض)" },
  { value: "IRANSans",  label: "ایران سنس" },
  { value: "Yekan",     label: "یکان" },
  { value: "Shabnam",   label: "شبنم" },
  { value: "Samim",     label: "صمیم" },
];

const RADIUS_OPTIONS = [
  { value: "0.5rem", label: "تیز" },
  { value: "1rem",   label: "کمی گرد" },
  { value: "1.5rem", label: "گرد (پیش‌فرض)" },
  { value: "2rem",   label: "بسیار گرد" },
  { value: "9999px", label: "دایره" },
];

export default function AdminStylesPage() {
  const [primaryColor,   setPrimaryColor]   = useState("#0071e3");
  const [secondaryColor, setSecondaryColor] = useState("#4f46e5");
  const [fontFamily,     setFontFamily]     = useState("Vazirmatn");
  const [borderRadius,   setBorderRadius]   = useState("1.5rem");
  const [customCss,      setCustomCss]      = useState("");
  const [saving,         setSaving]         = useState(false);
  const [msg,            setMsg]            = useState<{type:"success"|"error";text:string}|null>(null);

  useEffect(() => {
    fetch("/api/admin/styles").then(r => r.json()).then(d => {
      if (d.success && d.styles) {
        setPrimaryColor(d.styles.primary_color   || "#0071e3");
        setSecondaryColor(d.styles.secondary_color || "#4f46e5");
        setFontFamily(d.styles.font_family       || "Vazirmatn");
        setBorderRadius(d.styles.border_radius   || "1.5rem");
        setCustomCss(d.styles.custom_css         || "");
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-blue",        primaryColor);
    document.documentElement.style.setProperty("--accent-purple",      secondaryColor);
    document.documentElement.style.setProperty("--border-radius-card", borderRadius);
    document.documentElement.style.setProperty("--font-primary",       fontFamily + ", Vazirmatn, sans-serif");
  }, [primaryColor, secondaryColor, fontFamily, borderRadius]);

  const handleSave = async () => {
    soundEngine.playClick();
    setSaving(true); setMsg(null);
    try {
      const res  = await fetch("/api/admin/styles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primary_color: primaryColor, secondary_color: secondaryColor, font_family: fontFamily, border_radius: borderRadius, custom_css: customCss }),
      });
      const data = await res.json();
      if (data.success) {
        soundEngine.playSuccess();
        setMsg({ type: "success", text: "✓ هویت بصری ذخیره و در کل سایت اعمال شد." });
        window.dispatchEvent(new CustomEvent("site_styles_updated"));
      } else {
        setMsg({ type: "error", text: data.message || "خطا در ذخیره." });
      }
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] max-w-3xl" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">✨ هویت بصری و فونت‌ها</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">تغییرات به صورت زنده پیش‌نمایش داده می‌شود.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border ${msg.type === "success" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600" : "bg-rose-500/15 border-rose-500/30 text-rose-600"}`}>
          {msg.text}
        </div>
      )}

      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🎨 رنگ‌های اصلی</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "رنگ اصلی (Primary)", value: primaryColor, set: setPrimaryColor },
              { label: "رنگ ثانویه (Secondary)", value: secondaryColor, set: setSecondaryColor },
            ].map(c => (
              <div key={c.label} className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)]">{c.label}</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={c.value} onChange={e => c.set(e.target.value)}
                    className="w-12 h-10 rounded-xl border border-[var(--card-border)] cursor-pointer" />
                  <input type="text" value={c.value} onChange={e => c.set(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-[var(--accent-blue)]" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="h-10 w-32 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md" style={{ background: primaryColor }}>رنگ اصلی</div>
            <div className="h-10 w-32 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md" style={{ background: secondaryColor }}>رنگ ثانویه</div>
            <div className="h-10 w-32 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md" style={{ background: "linear-gradient(135deg," + primaryColor + "," + secondaryColor + ")" }}>گرادیان</div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🖋️ فونت اصلی سایت</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FONT_OPTIONS.map(f => (
              <button key={f.value} onClick={() => { soundEngine.playClick(); setFontFamily(f.value); }}
                style={{ fontFamily: f.value + ", sans-serif" }}
                className={`p-3 rounded-2xl border text-sm font-bold transition cursor-pointer text-right ${fontFamily === f.value ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]" : "border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-secondary)]"}`}>
                {f.label} — نمونه متن ۱۲۳
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">⬜ شکل گوشه‌ها</h2>
          <div className="flex flex-wrap gap-3">
            {RADIUS_OPTIONS.map(r => (
              <button key={r.value} onClick={() => { soundEngine.playClick(); setBorderRadius(r.value); }}
                style={{ borderRadius: r.value }}
                className={`px-4 py-2.5 border text-xs font-bold transition cursor-pointer ${borderRadius === r.value ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white" : "border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-secondary)]"}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">⚙️ CSS اختصاصی</h2>
          <textarea rows={5} value={customCss} onChange={e => setCustomCss(e.target.value)}
            placeholder=":root { --my-custom: value; }"
            className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-[var(--accent-blue)] resize-none text-[var(--text-primary)]" />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-lg">
          {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و اعمال سراسری هویت بصری"}
        </button>
      </div>
    </div>
  );
}
