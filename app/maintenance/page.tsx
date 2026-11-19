// File Path: app/maintenance/page.tsx
"use client";

import React, { useEffect, useState } from "react";

export default function MaintenancePage() {
  const [title, setTitle] = useState("بروزرسانی زیرساخت فنی آکسون کور");
  const [message, setMessage] = useState(
    "فروشگاه آکسون در حال بروزرسانی زیرساخت‌های فنی است. به زودی باز می‌گردیم."
  );
  const [endTime, setEndTime] = useState("");
  const [siteName, setSiteName] = useState("آکسون کور | Axon Core");
  const [logoUrl, setLogoUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  useEffect(() => {
    fetch("/api/site-info?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const s = json?.settings || json?.system_settings || {};
        if (s.maintenanceTitle) setTitle(String(s.maintenanceTitle));
        if (s.maintenanceMessage) setMessage(String(s.maintenanceMessage));
        if (s.maintenanceEndTime) setEndTime(String(s.maintenanceEndTime));
        if (json?.site_name || s.site_name) {
          setSiteName(String(json.site_name || s.site_name));
        }
        if (json?.logo_url || s.logo_url) {
          setLogoUrl(String(json.logo_url || s.logo_url));
        }
        if (json?.phone || s.phone) {
          setPhone(String(json.phone || s.phone));
        }
        if (json?.telegram_url || s.telegram_url) {
          setTelegramUrl(String(json.telegram_url || s.telegram_url));
        }
        if (json?.instagram_url || s.instagram_url) {
          setInstagramUrl(String(json.instagram_url || s.instagram_url));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-text"
      dir="rtl"
    >
      <div className="max-w-xl w-full p-6 sm:p-10 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl text-center space-y-6">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={siteName}
            className="w-20 h-20 mx-auto object-contain rounded-2xl p-2 bg-[var(--input-bg)] border border-[var(--card-border)]"
          />
        ) : (
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-3xl">
            🛠️
          </div>
        )}

        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-black">
            {siteName} — بروزرسانی و ارتقای فنی
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-[var(--accent-blue)] pt-1">
            {title}
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-bold whitespace-pre-line">
          {message}
        </p>

        {endTime && (
          <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold flex items-center justify-center gap-2">
            <span>⏳ زمان تقریبی بازگشایی مجدد:</span>
            <span className="font-mono font-black text-emerald-400">{endTime}</span>
          </div>
        )}

        {(phone || telegramUrl || instagramUrl) && (
          <div className="p-4 rounded-2xl bg-[var(--input-bg)]/70 border border-[var(--card-border)] space-y-2 text-xs">
            <div className="text-[11px] text-[var(--text-secondary)] font-bold">
              راه‌های ارتباط با پشتیبانی در زمان بروزرسانی:
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 font-bold">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="px-3 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[var(--accent-blue)]"
                >
                  📞 {phone}
                </a>
              )}
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30"
                >
                  ✈️ تلگرام پشتیبانی
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-pink-500/15 text-pink-400 border border-pink-500/30"
                >
                  📸 اینستاگرام
                </a>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="px-6 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-black transition cursor-pointer"
          >
            🔄 بررسی مجدد وضعیت سایت
          </button>
        </div>
      </div>
    </div>
  );
}