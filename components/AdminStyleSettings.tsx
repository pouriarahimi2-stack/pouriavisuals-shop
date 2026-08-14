"use client";

import React, { useState, useEffect } from "react";

export default function AdminStyleSettings() {
  const [storeName, setStoreName] = useState("STORE");
  const [storeEmoji, setStoreEmoji] = useState("💎");
  const [selectedFont, setSelectedFont] = useState("Vazirmatn");
  const [announcement, setAnnouncement] = useState(
    "ارسال رایگان خریدهای بالای ۲ میلیون تومان | کد تخفیف: APPLE2026 🚀"
  );
  const [accentColor, setAccentColor] = useState("#0071e3");

  useEffect(() => {
    // لود تنظیمات از LocalStorage در صورت وجود
    const savedName = localStorage.getItem("app_store_name");
    const savedFont = localStorage.getItem("app_font");
    if (savedName) setStoreName(savedName);
    if (savedFont) setSelectedFont(savedFont);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("app_store_name", storeName);
    localStorage.setItem("app_font", selectedFont);
    document.body.style.fontFamily = selectedFont;
    alert("تنظیمات با موفقیت ذخیره شد! ✨");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveSettings} className="liquid-glass-card p-6 space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
          <span>🎨</span> تنظیمات برندینگ و فونت سایت
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* نام فروشگاه */}
          <div className="space-y-2">
            <label className="text-xs font-bold">نام برند / فروشگاه:</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-[var(--glass-border)] text-sm outline-none"
            />
          </div>

          {/* ایموجی لوگو */}
          <div className="space-y-2">
            <label className="text-xs font-bold">ایموجی لوگو:</label>
            <input
              type="text"
              value={storeEmoji}
              onChange={(e) => setStoreEmoji(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-[var(--glass-border)] text-sm outline-none"
            />
          </div>

          {/* انتخاب فونت اصلی سایت */}
          <div className="space-y-2">
            <label className="text-xs font-bold">فونت اصلی سایت:</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-[var(--glass-border)] text-sm outline-none"
            >
              <option value="Vazirmatn">وزیر متن (Vazirmatn)</option>
              <option value="Shabnam">شبنم (Shabnam)</option>
              <option value="Samim">صمیم (Samim)</option>
              <option value="Sahel">ساحل (Sahel)</option>
            </select>
          </div>

          {/* رنگ اصلی (Accent Color) */}
          <div className="space-y-2">
            <label className="text-xs font-bold">رنگ اصلی دکمه‌ها (Accent Color):</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-11 p-1 rounded-xl cursor-pointer bg-transparent border border-[var(--glass-border)]"
              />
              <span className="text-xs font-mono">{accentColor}</span>
            </div>
          </div>
        </div>

        {/* متن نوار اعلانات */}
        <div className="space-y-2">
          <label className="text-xs font-bold">متن نوار اعلانات هدر:</label>
          <input
            type="text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-[var(--glass-border)] text-sm outline-none"
          />
        </div>

        <button
          type="submit"
          className="py-3 px-6 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-sm cursor-pointer shadow-md hover:opacity-90 transition-opacity"
        >
          ذخیره تغییرات برندینگ 💾
        </button>
      </form>
    </div>
  );
}