"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface HealthStatus {
  database: "connected" | "disconnected" | "checking";
  latencyMs: number;
  localStorageSizeKb: number;
  lastChecked: string;
}

export default function AdminHealthGuard() {
  const [health, setHealth] = useState<HealthStatus>({
    database: "checking",
    latencyMs: 0,
    localStorageSizeKb: 0,
    lastChecked: "در حال بررسی...",
  });

  const checkSystemHealth = async () => {
    const startTime = performance.now();
    let dbStatus: "connected" | "disconnected" = "disconnected";

    try {
      if (supabase) {
        const { error } = await supabase.from("products").select("id").limit(1);
        if (!error) dbStatus = "connected";
      }
    } catch {
      dbStatus = "disconnected";
    }

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    // محاسبه حجم تقریبی حافظه مرورگر
    let totalStorageBytes = 0;
    if (typeof window !== "undefined") {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalStorageBytes += (localStorage[key].length + key.length) * 2;
        }
      }
    }

    setHealth({
      database: dbStatus,
      latencyMs: latency,
      localStorageSizeKb: Math.round(totalStorageBytes / 1024),
      lastChecked: new Date().toLocaleTimeString("fa-IR"),
    });
  };

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4 font-sans select-none text-[var(--text-primary)] text-xs" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
          🛡️
        </div>
        <div>
          <h4 className="font-black text-xs">سامانه پایش پایداری و سلامت سیستم (Health Guard)</h4>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium">آخرین بررسی خودکار: {health.lastChecked}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* وضعیت پایگاه داده */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              health.database === "connected"
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"
                : health.database === "checking"
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
          />
          <span className="font-bold text-[11px]">
            {health.database === "connected"
              ? "دیتابیس Supabase: متصل و پایدار"
              : health.database === "checking"
              ? "در حال بررسی دیتابیس..."
              : "دیتابیس: آفلاین (حالت پشتیبان محلی)"}
          </span>
        </div>

        {/* پینگ اتصال */}
        <div className="px-3 py-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[11px] font-bold">
          ⚡ زمان پاسخ: <span className={health.latencyMs < 200 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}>{health.latencyMs}ms</span>
        </div>

        {/* حافظه لوکال */}
        <div className="px-3 py-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[11px] font-bold text-[var(--text-secondary)]">
          💾 کش مرورگر: {health.localStorageSizeKb} KB
        </div>

        <button
          onClick={checkSystemHealth}
          className="p-1.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs cursor-pointer transition"
          title="بررسی مجدد اتصال"
        >
          🔄
        </button>
      </div>
    </div>
  );
}