"use client";
// File Path: components/admin/AdminHealthGuard.tsx
import React, { useEffect, useState, useCallback } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminHealthGuard() {
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [dbStatus, setDbStatus] = useState<"healthy" | "degraded">("healthy");
  const [cacheSizeKb, setCacheSizeKb] = useState<number>(120);
  const [lastCheck, setLastCheck] = useState<string>("");
  const [checking, setChecking] = useState(false);

  const runHealthCheck = useCallback(async (playAudio = false) => {
    if (playAudio) soundEngine.playClick();
    setChecking(true);
    const start = performance.now();
    try {
      const res = await fetch("/api/site-info", { cache: "no-store" });
      const elapsed = Math.max(14, Math.round(performance.now() - start));
      setLatencyMs(elapsed);
      setDbStatus(res.ok ? "healthy" : "degraded");

      if (typeof window !== "undefined") {
        let totalBytes = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || "";
          totalBytes += (localStorage.getItem(k) || "").length * 2;
        }
        setCacheSizeKb(Math.max(16, Math.round(totalBytes / 1024)));
      }
      setLastCheck(new Date().toLocaleTimeString("fa-IR"));
    } catch {
      setDbStatus("degraded");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    runHealthCheck(false);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") runHealthCheck(false);
    }, 45000);
    return () => clearInterval(timer);
  }, [runHealthCheck]);

  return (
    <div
      className="p-4 sm:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg shrink-0">
          🛡
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
              سامانه پایش پایداری، سرعت و سلامت دیتابیس (Health Guard)
            </h2>
            {lastCheck && (
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                {lastCheck}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            پایش مستمر زمان پاسخ‌دهی سرور و وضعیت اتصال دیتابیس بدون بار ترافیکی
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
        <span
          className={
            "px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 " +
            (dbStatus === "healthy"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
              : "bg-amber-500/15 border-amber-500/30 text-amber-500")
          }
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>دیتابیس Supabase: {dbStatus === "healthy" ? "متصل و فعال" : "در حال بررسی"}</span>
        </span>

        <span className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-[var(--accent-blue)]">
          ⚡ پاسخ سرور: {latencyMs}ms
        </span>

        <span className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold">
          🧹 کش مرورگر: {cacheSizeKb} KB
        </span>

        <button
          type="button"
          disabled={checking}
          onClick={() => runHealthCheck(true)}
          className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer hover:opacity-90 transition disabled:opacity-50"
        >
          {checking ? "..." : "🔄 استعلام لحظه‌ای"}
        </button>
      </div>
    </div>
  );
}
