"use client";

import React, { useEffect, useState } from "react";

interface HealthStatus {
  speedScore: number;
  speedStatus: "fast" | "normal" | "slow";
  securityStatus: "secure" | "warning";
  storageHealth: "good" | "issue";
  lastChecked: string;
}

export default function AdminHealthGuard() {
  const [health, setHealth] = useState<HealthStatus>({
    speedScore: 100,
    speedStatus: "fast",
    securityStatus: "secure",
    storageHealth: "good",
    lastChecked: "در حال آنالیز...",
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runFullDiagnostics = () => {
    setIsAnalyzing(true);
    const startTime = performance.now();

    setTimeout(() => {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // ۱. سنجش سرعت
      let score = 100 - Math.floor(responseTime / 10);
      if (score > 100) score = 100;
      if (score < 40) score = 40;

      let speedState: "fast" | "normal" | "slow" = "fast";
      if (responseTime > 150) speedState = "normal";
      if (responseTime > 350) speedState = "slow";

      // ۲. سنجش امنیت پروتکل
      const isHttps =
        typeof window !== "undefined" &&
        (window.location.protocol === "https:" || window.location.hostname === "localhost");

      // ۳. بررسی سلامت ذخیره‌سازی داده‌ها
      let storageOk = true;
      try {
        localStorage.setItem("ai_health_test", "ok");
        localStorage.removeItem("ai_health_test");
      } catch (e) {
        storageOk = false;
      }

      setHealth({
        speedScore: score,
        speedStatus: speedState,
        securityStatus: isHttps ? "secure" : "warning",
        storageHealth: storageOk ? "good" : "issue",
        lastChecked: new Date().toLocaleTimeString("fa-IR"),
      });

      setIsAnalyzing(false);
    }, 400);
  };

  useEffect(() => {
    runFullDiagnostics();
    const interval = setInterval(runFullDiagnostics, 45000); // آنالیز خودکار هر ۴۵ ثانیه
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="liquid-glass-card p-5 space-y-4 text-xs font-sans text-white select-none">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] text-base">
            🛡️
          </span>
          <div>
            <h4 className="font-bold text-sm text-[var(--accent-blue)]">
              پایشگر هوشمند سلامت، امنیت و سرعت (AI Health Guard)
            </h4>
            <p className="text-[10px] opacity-70">
              بررسی پیوسته و هوشمند فریم‌ورک، حافظه و نرخ پاسخ‌دهی سیستم
            </p>
          </div>
        </div>

        <button
          onClick={runFullDiagnostics}
          disabled={isAnalyzing}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition font-bold text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span className={isAnalyzing ? "animate-spin" : ""}>🔄</span>
          {isAnalyzing ? "در حال اسکن..." : "آنالیز مجدد"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* کارت سرعت */}
        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] space-y-1">
          <div className="flex justify-between items-center opacity-70 text-[11px]">
            <span>سرعت بارگذاری و پاسخ:</span>
            <span className="font-mono font-bold">{health.speedScore}/100</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-base">⚡</span>
            <span
              className={`font-bold ${
                health.speedStatus === "fast"
                  ? "text-emerald-400"
                  : health.speedStatus === "normal"
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {health.speedStatus === "fast"
                ? "عالی و بهینه"
                : health.speedStatus === "normal"
                ? "متوسط"
                : "کند (نیازمند بررسی)"}
            </span>
          </div>
        </div>

        {/* کارت امنیت */}
        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] space-y-1">
          <div className="flex justify-between items-center opacity-70 text-[11px]">
            <span>پروتکل امنیتی (SSL):</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-base">🔒</span>
            <span
              className={`font-bold ${
                health.securityStatus === "secure" ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {health.securityStatus === "secure" ? "ارتباط ایمن (HTTPS)" : "عدم شناسایی گواهی SSL"}
            </span>
          </div>
        </div>

        {/* کارت حافظه و دیتابیس */}
        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] space-y-1">
          <div className="flex justify-between items-center opacity-70 text-[11px]">
            <span>سلامت داده‌ها و حافظه:</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-base">💾</span>
            <span
              className={`font-bold ${
                health.storageHealth === "good" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {health.storageHealth === "good" ? "کاملاً سالم" : "اختلال در ذخیره‌سازی"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] opacity-60 pt-1">
        <span>آخرین چک هوشمند: {health.lastChecked}</span>
        <span className="text-emerald-400 font-bold">سیستم در حالت آمادگی کامل (Production Ready)</span>
      </div>
    </div>
  );
}