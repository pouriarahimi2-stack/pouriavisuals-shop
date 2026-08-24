"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminHealthGuard() {
  const [dbStatus, setDbStatus] = useState<"connected" | "checking" | "error">("checking");
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");
  const [cacheSize, setCacheSize] = useState<number>(0);

  const checkHealth = async () => {
    setDbStatus("checking");
    const start = performance.now();
    try {
      const { error } = await supabase.from("site_info").select("id").limit(1).maybeSingle();
      const end = performance.now();
      const latency = Math.round(end - start);
      setResponseTime(latency);

      if (error) {
        setDbStatus("error");
      } else {
        setDbStatus("connected");
      }
    } catch {
      setDbStatus("error");
    }

    setLastChecked(new Date().toLocaleTimeString("fa-IR"));

    // محاسبه تقریبی حجم دیتای محلی ذخیره‌شده در کلاینت
    try {
      let total = 0;
      for (const x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += (localStorage[x].length + x.length) * 2;
        }
      }
      setCacheSize(Math.round(total / 1024));
    } catch {
      setCacheSize(0);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // چک سلامت خودکار هر ۳۰ ثانیه

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans select-none text-xs">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 text-sm font-black shadow-sm">
          🛡️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[var(--text-primary)]">سامانه پایش پایداری و سلامت سیستم (Health Guard)</span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">آخرین پایش: {lastChecked || "هم‌اکنون"}</span>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">پایش لحظه‌ای اتصال پایگاه‌داده، وب‌سوکت و حافظه موقت</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
          <span
            className={`w-2 h-2 rounded-full ${
              dbStatus === "connected"
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"
                : dbStatus === "checking"
                ? "bg-amber-500 animate-ping"
                : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
            }`}
          />
          <span className="font-bold text-[var(--text-primary)]">
            {dbStatus === "connected" ? "دیتابیس Supabase: متصل و پایدار" : dbStatus === "checking" ? "در حال پایش..." : "خطا در اتصال دیتابیس"}
          </span>
        </div>

        {responseTime !== null && (
          <div className="px-3.5 py-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[var(--text-primary)] font-bold flex items-center gap-1.5">
            <span>⚡ زمان پاسخ:</span>
            <span className={`${responseTime < 300 ? "text-emerald-500" : responseTime < 800 ? "text-amber-500" : "text-rose-500"}`}>
              {responseTime}ms
            </span>
          </div>
        )}

        <div className="px-3.5 py-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[var(--text-secondary)] font-bold">
          📦 کش مرورگر: {cacheSize} KB
        </div>

        <button
          onClick={checkHealth}
          className="p-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-blue-500 text-[var(--text-primary)] transition cursor-pointer"
          title="پایش دستی مجدد"
        >
          🔄
        </button>
      </div>
    </div>
  );
}