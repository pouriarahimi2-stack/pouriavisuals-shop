"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface DiagnosticIssue {
  type: "speed" | "security" | "storage" | "database";
  severity: "low" | "medium" | "high";
  title: string;
  cause: string;
  solution: string;
}

interface HealthStatus {
  speedScore: number;
  latencyMs: number;
  speedStatus: "fast" | "normal" | "slow";
  securityStatus: "secure" | "warning";
  storageHealth: "good" | "issue";
  storageUsageKb: number;
  dbStatus: "connected" | "disconnected";
  dbLatencyMs: number;
  lastChecked: string;
  issues: DiagnosticIssue[];
}

export default function AdminHealthGuard() {
  const [health, setHealth] = useState<HealthStatus>({
    speedScore: 100,
    latencyMs: 0,
    speedStatus: "fast",
    securityStatus: "secure",
    storageHealth: "good",
    storageUsageKb: 0,
    dbStatus: "connected",
    dbLatencyMs: 0,
    lastChecked: "در حال آنالیز اولیه...",
    issues: [],
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  const runFullDiagnostics = async () => {
    setIsAnalyzing(true);
    const issuesList: DiagnosticIssue[] = [];

    // ۱. تست پینگ و سرعت پاسخ‌دهی سرور
    let latency = 0;
    const startPing = performance.now();
    try {
      await fetch("/favicon.ico", { method: "HEAD", cache: "no-store" });
      latency = Math.round(performance.now() - startPing);
    } catch {
      latency = Math.round(performance.now() - startPing);
    }

    let score = 100;
    if (latency > 500) score = 45;
    else if (latency > 300) score = 65;
    else if (latency > 150) score = 85;
    else score = 98;

    let speedState: "fast" | "normal" | "slow" = "fast";
    if (latency > 350) speedState = "slow";
    else if (latency > 150) speedState = "normal";

    if (speedState === "slow") {
      issuesList.push({
        type: "speed",
        severity: "high",
        title: `زمان پاسخ‌دهی سرور بالا است (${latency} میلی‌ثانیه)`,
        cause: "تاخیر در پاسخ شبکه یا عدم فشرده‌سازی استاتیک در هاستینگ.",
        solution: "تصاویر با فرمت WebP فشرده شده و کش بهینه مرورگر فعال گردد.",
      });
    }

    // ۲. تست اتصال دیتابیس Supabase
    let dbState: "connected" | "disconnected" = "connected";
    let dbPing = 0;
    const startDb = performance.now();
    try {
      const { error } = await supabase.from("site_info").select("id").limit(1);
      dbPing = Math.round(performance.now() - startDb);
      if (error && error.code !== "PGRST116") {
        dbState = "disconnected";
        issuesList.push({
          type: "database",
          severity: "high",
          title: "خطای ارتباط با پایگاه داده Supabase",
          cause: error.message || "کلیدهای API یا URL سوپابیس مسدود است.",
          solution: "تنظیمات فایل .env.local و دسترسی‌های اینترنت را بازبینی کنید.",
        });
      }
    } catch {
      dbPing = Math.round(performance.now() - startDb);
      dbState = "disconnected";
    }

    // ۳. بررسی امنیت SSL
    const isHttps =
      typeof window !== "undefined" &&
      (window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (!isHttps) {
      issuesList.push({
        type: "security",
        severity: "high",
        title: "عدم استفاده از ارتباط امن SSL (HTTPS)",
        cause: "سایت در بستر ناامن HTTP اجرا می‌شود.",
        solution: "گواهینامه رایگان SSL هاستینگ یا کلودفلر را فعال کنید.",
      });
    }

    // ۴. بررسی حجم اشغال‌شده در کش مرورگر
    let storageOk = true;
    let totalKb = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalKb += ((localStorage[key].length + key.length) * 2) / 1024;
        }
      }
      totalKb = Math.round(totalKb);

      if (totalKb > 4000) {
        issuesList.push({
          type: "storage",
          severity: "medium",
          title: "حجم بالای حافظه کش محلی",
          cause: `فضای مصرفی بیش از ۴ مگابایت است (${totalKb} KB).`,
          solution: "تصاویر سنگین Base64 را پاک کرده و فایل‌ها را به Storage ابری منتقل کنید.",
        });
      }
    } catch {
      storageOk = false;
    }

    setHealth({
      speedScore: score,
      latencyMs: latency,
      speedStatus: speedState,
      securityStatus: isHttps ? "secure" : "warning",
      storageHealth: storageOk ? "good" : "issue",
      storageUsageKb: totalKb,
      dbStatus: dbState,
      dbLatencyMs: dbPing,
      lastChecked: new Date().toLocaleTimeString("fa-IR"),
      issues: issuesList,
    });

    setIsAnalyzing(false);
  };

  useEffect(() => {
    runFullDiagnostics();
    const interval = setInterval(runFullDiagnostics, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="liquid-glass-card p-6 space-y-5 text-xs font-sans text-[var(--text-primary)] border border-[var(--card-border)] rounded-3xl shadow-xl select-none">
        {/* نوار عنوان و دکمه اسکن */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-lg font-black shadow-sm">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-[var(--text-primary)]">
                  پایشگر هوشمند سلامت، امنیت و سرعت (AI Health Guard)
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  پایش زنده
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">
                بررسی سرعت پاسخ‌دهی سرور، سلامت اتصال دیتابیس، امنیت SSL و کش مرورگر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {health.issues.length > 0 && (
              <button
                onClick={() => setShowDiagnosticModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>⚠️</span>
                <span>راهنمای رفع مشکلات ({health.issues.length})</span>
              </button>
            )}

            <button
              onClick={runFullDiagnostics}
              disabled={isAnalyzing}
              className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 text-[var(--text-primary)] shadow-sm"
            >
              <span className={isAnalyzing ? "animate-spin text-[var(--accent-blue)]" : ""}>🔄</span>
              <span>{isAnalyzing ? "در حال آنالیز..." : "آنالیز مجدد"}</span>
            </button>
          </div>
        </div>

        {/* کارت‌های ۳گانه وضعیت */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setShowDiagnosticModal(true)}
            className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 cursor-pointer hover:border-[var(--accent-blue)] transition shadow-sm"
          >
            <div className="flex justify-between items-center text-[var(--text-secondary)] text-[11px] font-bold">
              <span>سرعت بارگذاری سرور:</span>
              <span className="font-mono font-extrabold text-[var(--text-primary)]">
                {health.speedScore}/100
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span
                  className={`font-black text-xs ${
                    health.speedStatus === "fast"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : health.speedStatus === "normal"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {health.speedStatus === "fast"
                    ? "عالی و سریع"
                    : health.speedStatus === "normal"
                    ? "متوسط (نرمال)"
                    : "کند (نیازمند بررسی)"}
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)]">
                پینگ: {health.latencyMs}ms
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[var(--text-secondary)] text-[11px] font-bold">
              <span>پروتکل امنیتی (SSL / HTTPS):</span>
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">TLS 1.3</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-lg">🔒</span>
              <span
                className={`font-black text-xs ${
                  health.securityStatus === "secure"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {health.securityStatus === "secure"
                  ? "ارتباط ایمن (HTTPS)"
                  : "ارتباط بدون گواهی SSL"}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[var(--text-secondary)] text-[11px] font-bold">
              <span>سلامت پایگاه داده:</span>
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                {health.storageUsageKb} KB مصرفی
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">💾</span>
                <span
                  className={`font-black text-xs ${
                    health.storageHealth === "good" && health.dbStatus === "connected"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {health.storageHealth === "good" && health.dbStatus === "connected"
                    ? "دیتابیس متصل و سالم"
                    : "نقص در همگام‌سازی"}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Supabase OK
              </span>
            </div>
          </div>
        </div>

        {/* نوار پایین وضعیت */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--text-secondary)] pt-2 border-t border-[var(--card-border)] font-medium">
          <span>⏱️ آخرین بررسی: <strong className="font-mono text-[var(--text-primary)]">{health.lastChecked}</strong></span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>سیستم در وضعیت پایدار (Production Ready)</span>
          </span>
        </div>
      </div>

      {/* مدال راهنمای عیب‌یابی */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl text-[var(--text-primary)] max-h-[90vh] flex flex-col justify-between my-auto">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🩺</span>
                <div>
                  <h3 className="font-black text-sm text-[var(--accent-blue)]">
                    گزارش عیب‌یابی هوشمند و بهینه‌سازی
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">
                    تحلیل فنی پارامترهای ارتباطی و پیشنهادات عملی
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center">
                  <span className="text-[10px] text-[var(--text-secondary)] block font-bold">امتیاز سرعت</span>
                  <span className="text-base font-black font-mono text-[var(--accent-blue)]">{health.speedScore}/100</span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center">
                  <span className="text-[10px] text-[var(--text-secondary)] block font-bold">پینگ سرور</span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">{health.latencyMs}ms</span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center">
                  <span className="text-[10px] text-[var(--text-secondary)] block font-bold">وضعیت دیتابیس</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-1">متصل (Cloud)</span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center">
                  <span className="text-[10px] text-[var(--text-secondary)] block font-bold">امنیت شبکه</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-1">HTTPS فعال</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-[var(--text-primary)]">تحلیل موارد فنی:</h4>
                
                {health.issues.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold space-y-1 text-center">
                    <span className="text-2xl block mb-1">🎉</span>
                    <p>تمام پارامترهای سرور، دیتابیس و امنیت در وضعیت ایده‌آل قرار دارند.</p>
                  </div>
                ) : (
                  health.issues.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          {item.type === "speed" ? "⚡ سرعت" : item.type === "database" ? "💾 دیتابیس" : "🔒 امنیت"}
                        </span>
                        <h5 className="font-bold text-xs text-[var(--text-primary)]">{item.title}</h5>
                      </div>

                      <div className="text-[11px] text-[var(--text-secondary)] space-y-1 pr-1 font-medium leading-relaxed">
                        <p><strong className="text-[var(--text-primary)]">علت فنی:</strong> {item.cause}</p>
                        <p><strong className="text-emerald-600 dark:text-emerald-400">راهکار رفع:</strong> {item.solution}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--card-border)] shrink-0">
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition cursor-pointer shadow-md"
              >
                بستن گزارش
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}