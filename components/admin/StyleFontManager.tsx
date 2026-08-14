"use client";

import { useState, useEffect, ChangeEvent } from "react";

export default function StyleFontManager() {
  const [styleConfig, setStyleConfig] = useState({
    headerFont: "Vazirmatn",
    bodyFont: "Vazirmatn",
    buttonFont: "Vazirmatn",
    headerSize: "24",
    bodySize: "14",
    buttonSize: "14",
    primaryColor: "#0071e3",
    borderRadius: "16",
    glassOpacity: "0.15",
    lightBgColor: "#f5f5f7",
    lightCardBg: "#ffffff",
    darkBgColor: "#000000",
    darkCardBg: "#161617",
  });

  const [logoType, setLogoType] = useState<"emoji" | "image">("emoji");
  const [logoEmoji, setLogoEmoji] = useState("💎");
  const [logoImage, setLogoImage] = useState<string | null>(null);

  const availableIcons = ["💎", "📱", "💻", "⌚", "🎧", "⚡", "🚀", "🔥", "🛒", "🏷️", "🌟", "🎁", "🔒", "❌"];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-header", `'${styleConfig.headerFont}', sans-serif`);
    root.style.setProperty("--font-body", `'${styleConfig.bodyFont}', sans-serif`);
    root.style.setProperty("--font-button", `'${styleConfig.buttonFont}', sans-serif`);

    root.style.setProperty("--size-header", `${styleConfig.headerSize}px`);
    root.style.setProperty("--size-body", `${styleConfig.bodySize}px`);
    root.style.setProperty("--size-button", `${styleConfig.buttonSize}px`);

    root.style.setProperty("--accent-blue", styleConfig.primaryColor);
    root.style.setProperty("--main-radius", `${styleConfig.borderRadius}px`);
    root.style.setProperty("--glass-opacity", styleConfig.glassOpacity);

    root.style.setProperty("--bg-light", styleConfig.lightBgColor);
    root.style.setProperty("--card-light", styleConfig.lightCardBg);
    root.style.setProperty("--bg-dark", styleConfig.darkBgColor);
    root.style.setProperty("--card-dark", styleConfig.darkCardBg);
  }, [styleConfig]);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
        setLogoType("image");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 dir-rtl">
      {/* ۱. مدیریت و آپلود لوگو */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-4">
          🖼️ مدیریت و آپلود لوگوی اختصاصی سایت
        </h2>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setLogoType("emoji")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              logoType === "emoji" ? "bg-[var(--accent-blue)] text-white" : "bg-white/10 text-[var(--text-secondary)]"
            }`}
          >
            آیکون / ایموجی
          </button>
          <button
            onClick={() => setLogoType("image")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              logoType === "image" ? "bg-[var(--accent-blue)] text-white" : "bg-white/10 text-[var(--text-secondary)]"
            }`}
          >
            آپلود تصویر لوگو (PNG/SVG)
          </button>
        </div>

        {logoType === "emoji" ? (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[var(--text-primary)]">انتخاب ایموجی لوگو</label>
            <input
              type="text"
              suppressHydrationWarning
              value={logoEmoji}
              onChange={(e) => setLogoEmoji(e.target.value)}
              className="w-32 bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-center text-2xl font-bold"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-[var(--text-primary)]">انتخاب فایل لوگو</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="block w-full text-xs text-[var(--text-secondary)] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[var(--accent-blue)] file:text-white hover:file:opacity-90 cursor-pointer"
            />

            {logoImage && (
              <div className="p-4 rounded-2xl border border-[var(--glass-border)] bg-white/5 inline-block space-y-2">
                <span className="text-[11px] text-[var(--text-secondary)] block">پیش‌نمایش لوگوی آپلودشده:</span>
                <img src={logoImage} alt="Uploaded Logo" className="h-12 object-contain" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ۲. رنگ‌بندی Light و Dark */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-4">
          🌓 سفارشی‌سازی رنگ‌های تم روشن (Light) و تاریک (Dark)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-5 rounded-2xl border border-[var(--glass-border)] bg-white/40 dark:bg-white/5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              ☀️ تنظیمات حالت روشن (Light Mode)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">رنگ پس‌زمینه اصلی (Background)</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  suppressHydrationWarning
                  value={styleConfig.lightBgColor}
                  onChange={(e) => setStyleConfig({ ...styleConfig, lightBgColor: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-[var(--glass-border)] cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs font-bold">{styleConfig.lightBgColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">رنگ کارت‌های شیشه‌ای</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  suppressHydrationWarning
                  value={styleConfig.lightCardBg}
                  onChange={(e) => setStyleConfig({ ...styleConfig, lightCardBg: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-[var(--glass-border)] cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs font-bold">{styleConfig.lightCardBg}</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--glass-border)] bg-black/40 dark:bg-black/20 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              🌙 تنظیمات حالت تاریک (Dark Mode)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">رنگ پس‌زمینه اصلی (Background)</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  suppressHydrationWarning
                  value={styleConfig.darkBgColor}
                  onChange={(e) => setStyleConfig({ ...styleConfig, darkBgColor: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-[var(--glass-border)] cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs font-bold">{styleConfig.darkBgColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">رنگ کارت‌های شیشه‌ای</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  suppressHydrationWarning
                  value={styleConfig.darkCardBg}
                  onChange={(e) => setStyleConfig({ ...styleConfig, darkCardBg: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-[var(--glass-border)] cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs font-bold">{styleConfig.darkCardBg}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ۳. تنظیمات فونت و اندازه متون */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-4">
          🔤 تنظیمات کامل فونت، سایز و ضخامت (Real-Time Typography)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-primary)] space-y-3">
            <label className="block text-xs font-bold text-[var(--text-primary)]">فونت تیترها (Headings)</label>
            <select
              value={styleConfig.headerFont}
              onChange={(e) => setStyleConfig({ ...styleConfig, headerFont: e.target.value })}
              className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-bold"
            >
              <option value="Vazirmatn">وزیرمتن (Vazirmatn)</option>
              <option value="Shabnam">شبنم (Shabnam)</option>
              <option value="Samim">صمیم (Samim)</option>
              <option value="Sahel">ساحل (Sahel)</option>
            </select>

            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">اندازه فونت تیتر: {styleConfig.headerSize}px</label>
              <input
                type="range"
                suppressHydrationWarning
                min="18"
                max="36"
                value={styleConfig.headerSize}
                onChange={(e) => setStyleConfig({ ...styleConfig, headerSize: e.target.value })}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-primary)] space-y-3">
            <label className="block text-xs font-bold text-[var(--text-primary)]">فونت متن اصلی (Body Text)</label>
            <select
              value={styleConfig.bodyFont}
              onChange={(e) => setStyleConfig({ ...styleConfig, bodyFont: e.target.value })}
              className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-bold"
            >
              <option value="Vazirmatn">وزیرمتن (Vazirmatn)</option>
              <option value="Shabnam">شبنم (Shabnam)</option>
              <option value="Samim">صمیم (Samim)</option>
              <option value="Sahel">ساحل (Sahel)</option>
            </select>

            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">اندازه متن اصلی: {styleConfig.bodySize}px</label>
              <input
                type="range"
                suppressHydrationWarning
                min="11"
                max="20"
                value={styleConfig.bodySize}
                onChange={(e) => setStyleConfig({ ...styleConfig, bodySize: e.target.value })}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-primary)] space-y-3">
            <label className="block text-xs font-bold text-[var(--text-primary)]">فونت دکمه‌ها (Buttons)</label>
            <select
              value={styleConfig.buttonFont}
              onChange={(e) => setStyleConfig({ ...styleConfig, buttonFont: e.target.value })}
              className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-bold"
            >
              <option value="Vazirmatn">وزیرمتن (Vazirmatn)</option>
              <option value="Shabnam">شبنم (Shabnam)</option>
              <option value="Samim">صمیم (Samim)</option>
              <option value="Sahel">ساحل (Sahel)</option>
            </select>

            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">اندازه متن دکمه: {styleConfig.buttonSize}px</label>
              <input
                type="range"
                suppressHydrationWarning
                min="10"
                max="18"
                value={styleConfig.buttonSize}
                onChange={(e) => setStyleConfig({ ...styleConfig, buttonSize: e.target.value })}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ۴. آیکون‌ها */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-4">
          🧩 کتابخانه آیکون‌های پویا (Icon Picker)
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">روی هر آیکون کلیک کنید تا کد آن کپی شود:</p>
        <div className="flex flex-wrap gap-3 pt-2">
          {availableIcons.map((icon, idx) => (
            <button
              key={idx}
              onClick={() => navigator.clipboard.writeText(icon)}
              className="w-12 h-12 rounded-2xl border border-[var(--glass-border)] bg-white/5 hover:bg-[var(--accent-blue)] hover:text-white transition flex items-center justify-center text-xl shadow-sm"
              title="برای کپی کلیک کنید"
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}