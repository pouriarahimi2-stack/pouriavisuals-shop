// components/AdminStyleSettings.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminStyleSettings() {
  const [storeName, setStoreName] = useState("آکسون | Axon");
  const [storeEmoji, setStoreEmoji] = useState("⚡");
  const [selectedFont, setSelectedFont] = useState("Vazirmatn");
  const [announcement, setAnnouncement] = useState(
    "ارسال رایگان خریدهای بالای ۲ میلیون تومان | کد تخفیف: OFF10 🚀"
  );
  const [accentColor, setAccentColor] = useState("#0071e3");

  useEffect(() => {
    const savedName = localStorage.getItem("app_store_name");
    const savedFont = localStorage.getItem("app_font");
    if (savedName) setStoreName(savedName);
    if (savedFont) setSelectedFont(savedFont);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playSuccess();
    localStorage.setItem("app_store_name", storeName);
    localStorage.setItem("app_font", selectedFont);
    document.body.style.fontFamily = selectedFont;
    alert("تنظیمات با موفقیت ذخیره شد! ✨");
  };

  return (
    <div className="space-y-6 font-sans text-xs text-[var(--text-primary)] select-none">
      <form onSubmit={handleSaveSettings} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl space-y-6 border border-[var(--card-border)] shadow-xl">
        <h3 className="text-base font-black flex items-center gap-2 border-b border-[var(--card-border)] pb-3 text-[var(--accent-blue)]">
          <span>🎨</span> تنظیمات برندینگ و فونت سایت
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-secondary)]">نام برند / فروشگاه:</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-secondary)]">ایموجی لوگو:</label>
            <input
              type="text"
              value={storeEmoji}
              onChange={(e) => setStoreEmoji(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-secondary)]">فونت اصلی سایت:</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--accent-blue)]"
            >
              <option value="Vazirmatn">وزیر متن (Vazirmatn)</option>
              <option value="Shabnam">شبنم (Shabnam)</option>
              <option value="Samim">صمیم (Samim)</option>
              <option value="Sahel">ساحل (Sahel)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-secondary)]">رنگ اصلی دکمه‌ها (Accent Color):</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-11 p-1 rounded-xl cursor-pointer bg-transparent border border-[var(--card-border)]"
              />
              <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{accentColor}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--text-secondary)]">متن نوار اعلانات هدر:</label>
          <input
            type="text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
          />
        </div>

        <button
          type="submit"
          className="py-3.5 px-6 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs cursor-pointer shadow-md hover:opacity-90 transition"
        >
          ذخیره تغییرات برندینگ 💾
        </button>
      </form>
    </div>
  );
}