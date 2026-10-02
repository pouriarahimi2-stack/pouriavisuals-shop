"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function MaintenancePage() {
  const [message, setMessage] = useState(
    "فروشگاه آکسون در حال بروزرسانی زیرساخت‌های فنی است. به زودی باز می‌گردیم."
  );

  useEffect(() => {
    fetch("/api/site-info", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const s = json?.settings || json?.system_settings;
        if (s?.maintenanceMessage) {
          setMessage(String(s.maintenanceMessage));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-text"
      dir="rtl"
    >
      <div className="max-w-lg w-full p-6 sm:p-10 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-3xl">
          🛠️
        </div>
        <h1 className="text-lg sm:text-2xl font-black text-[var(--accent-blue)]">
          بروزرسانی زیرساخت فنی آکسون کور
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-bold">
          {message}
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition"
          >
            🔄 بررسی مجدد وضعیت سایت
          </Link>
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition"
          >
            ورود مدیر سیستم
          </Link>
        </div>
      </div>
    </div>
  );
}
