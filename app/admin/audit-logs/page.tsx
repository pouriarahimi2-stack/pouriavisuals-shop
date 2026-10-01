// File Path: app/admin/audit-logs/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

interface AuditLog {
  id: string;
  admin_username: string;
  action: string;
  target_resource: string;
  details: any;
  ip_address: string;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [securityScore, setSecurityScore] = useState<number>(98);
  const [suspiciousCount, setSuspiciousCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/audit-logs?limit=60", { cache: "no-store" });
      if (!res.ok) throw new Error("خطا در دریافت لاگ‌ها از سرور");
      const json = await res.json();
      if (json.success) {
        setLogs(json.logs || []);
        setSecurityScore(Number(json.securityScore ?? 98));
        setSuspiciousCount(Number(json.suspiciousCount ?? 0));
      } else {
        throw new Error(json.message || "خطا در واکشی اطلاعات.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("realtime-admin-audit-logs")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSmartSecurityAutoFix = async () => {
    soundEngine.playClick();
    setScanning(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan_and_autofix" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFeedback(json.message);
        fetchLogs();
        setTimeout(() => setFeedback(null), 4500);
      }
    } finally {
      setScanning(false);
    }
  };

  const getBadgeStyle = (action: string) => {
    if (action.includes("DELETE") || action.includes("FAIL"))
      return "bg-rose-500/15 border-rose-500/30 text-rose-400";
    if (action.includes("CREATE") || action.includes("INSERT") || action.includes("AUTOFIX"))
      return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
    if (action.includes("UPDATE") || action.includes("CHANGE"))
      return "bg-amber-500/15 border-amber-500/30 text-amber-400";
    return "bg-blue-500/15 border-blue-500/30 text-blue-400";
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🛡️</span> دفتر کل وقایع و اسکنر هوشمند امنیت (Audit Logs & Auto-Fix)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            رصد بلادرنگ اقدامات مدیریتی، اسکن آسیب‌پذیری‌ها و پاکسازی خودکار نشست‌های مشکوک
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleSmartSecurityAutoFix}
            disabled={scanning}
            className="flex-1 sm:flex-initial justify-center px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            <span>⚡</span>
            <span>{scanning ? "در حال اسکن و رفع..." : "اسکن و رفع هوشمند خطاهای امنیتی"}</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              fetchLogs();
            }}
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <span>🔄</span> تازه‌سازی
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between">
          <span className="font-bold text-[var(--text-secondary)]">ضریب امنیت جاری سیستم:</span>
          <span className="font-mono font-black text-lg text-emerald-500">{securityScore}% ✓</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between">
          <span className="font-bold text-[var(--text-secondary)]">کل وقایع ثبت‌شده:</span>
          <span className="font-mono font-black text-lg text-[var(--accent-blue)]">{logs.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between">
          <span className="font-bold text-[var(--text-secondary)]">رخدادهای مشکوک / خطا:</span>
          <span className="font-mono font-black text-lg text-amber-500">{suspiciousCount} مورد</span>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-fadeIn">
          {feedback}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
          {error}
        </div>
      )}

      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">در حال بارگذاری سوابق امنیتی...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold">هیچ رخدادی هنوز ثبت نشده است.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[680px]">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                  <th className="pb-3 px-3">نوع عملیات</th>
                  <th className="pb-3 px-3">منبع هدف</th>
                  <th className="pb-3 px-3">ادمین</th>
                  <th className="pb-3 px-3">آدرس IP</th>
                  <th className="pb-3 px-3">تاریخ و زمان</th>
                  <th className="pb-3 px-3">جزئیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--input-bg)]/40 transition">
                    <td className="py-3.5 px-3">
                      <span
                        className={
                          "px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold whitespace-nowrap " +
                          getBadgeStyle(log.action || "")
                        }
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[var(--text-primary)] font-bold">
                      {log.target_resource}
                    </td>
                    <td className="py-3.5 px-3 text-[var(--text-secondary)]">{log.admin_username}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-400 text-[11px]">{log.ip_address}</td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("fa-IR")}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className="font-mono text-[10px] text-slate-500 truncate max-w-[220px] block"
                        title={JSON.stringify(log.details)}
                      >
                        {JSON.stringify(log.details)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
