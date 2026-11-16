// File Path: app/admin/audit-logs/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

interface AuditLog {
  id: string;
  admin_username: string;
  action: string;
  target_resource: string;
  details: any;
  ip_address: string;
  severity?: string;
  created_at: string;
}

const ACTION_LABELS_FA: Record<string, string> = {
  BACKGROUND_HEALTH_SCAN: "🩺 اسکن سلامت پس‌زمینه",
  SECURITY_AUTOFIX_COMPLETED: "🛡️ اسکن و ترمیم خودکار امنیتی",
  CHANGE_ADMIN_PASSWORD: "🔐 تغییر رمز عبور / پین مدیر",
  ADMIN_LOGIN_FAILED: "⛔ تلاش ناموفق ورود به پنل",
  REVIEW_SMS_SENT: "📲 ارسال پیامک نظرسنجی خرید",
  AUTO_REVIEW_SMS_SENT: "🤖 پیامک خودکار نظرسنجی (Cron)",
  AUDIT_LOGS_CLEARED: "🧹 بازنشانی دفتر کل وقایع",
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [securityScore, setSecurityScore] = useState<number>(98);
  const [suspiciousCount, setSuspiciousCount] = useState<number>(0);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "info" | "warning">("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/audit-logs?limit=120&t=" + Date.now(), {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("خطا در دریافت لاگ‌ها از سرور");
      const json = await res.json();
      if (json.success) {
        setLogs(json.logs || []);
        setSecurityScore(Number(json.securityScore ?? 98));
        setSuspiciousCount(Number(json.suspiciousCount ?? 0));
        if (json.lastScanAt) setLastScanAt(json.lastScanAt);
      } else {
        throw new Error(json.message || "خطا در واکشی اطلاعات.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("realtime-admin-audit-logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_audit_logs" },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

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
        if (json.lastScanAt) setLastScanAt(json.lastScanAt);
        await fetchLogs();
        setTimeout(() => setFeedback(null), 5000);
      }
    } finally {
      setScanning(false);
    }
  };

  const handleClearAllLogs = async () => {
    if (!confirm("آیا از پاکسازی تاریخچه لاگ‌های امنیتی اطمینان دارید؟")) return;
    soundEngine.playClick();
    setClearing(true);
    try {
      const res = await fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_logs" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFeedback(json.message);
        await fetchLogs();
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setError(json.message || "خطا در پاکسازی لاگ‌ها.");
      }
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteSingleLog = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("این رخداد از تاریخچه حذف شود؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch(
        "/api/admin/audit-logs?id=" + encodeURIComponent(id),
        { method: "DELETE" }
      );
      if (res.ok) {
        soundEngine.playSuccess();
        if (selectedLog?.id === id) setSelectedLog(null);
        await fetchLogs();
      }
    } catch {}
  };

  const handleExportCsv = () => {
    soundEngine.playSuccess();
    const headers = [
      "نوع عملیات",
      "شرح فارسی",
      "منبع هدف",
      "کاربر / ادمین",
      "آدرس IP",
      "سطح حساسیت",
      "تاریخ و زمان",
      "جزئیات JSON",
    ];
    const rows = filteredLogs.map((l) => [
      l.action,
      ACTION_LABELS_FA[l.action] || l.action,
      l.target_resource,
      l.admin_username,
      l.ip_address,
      l.severity || "info",
      new Date(l.created_at).toLocaleString("fa-IR"),
      JSON.stringify(l.details || {}),
    ]);
    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((r) =>
          r.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "axon-security-audit-logs-" + Date.now() + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    if (!selectedLog) return;
    const text = JSON.stringify(selectedLog.details, null, 2);
    navigator.clipboard.writeText(text);
    soundEngine.playSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getBadgeStyle = (action: string, severity?: string) => {
    if (
      action.includes("DELETE") ||
      action.includes("FAIL") ||
      action.includes("ERROR") ||
      severity === "error"
    ) {
      return "bg-rose-500/15 border-rose-500/30 text-rose-400";
    }
    if (
      action.includes("CREATE") ||
      action.includes("INSERT") ||
      action.includes("AUTOFIX")
    ) {
      return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
    }
    if (
      action.includes("UPDATE") ||
      action.includes("CHANGE") ||
      severity === "warning"
    ) {
      return "bg-amber-500/15 border-amber-500/30 text-amber-400";
    }
    return "bg-blue-500/15 border-blue-500/30 text-blue-400";
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const isSuspicious =
        l.action.includes("FAIL") ||
        l.action.includes("ERROR") ||
        l.action.includes("DELETE") ||
        l.severity === "warning" ||
        l.severity === "error";

      if (severityFilter === "warning" && !isSuspicious) return false;
      if (severityFilter === "info" && isSuspicious) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        (ACTION_LABELS_FA[l.action] || "").toLowerCase().includes(q) ||
        l.admin_username.toLowerCase().includes(q) ||
        l.target_resource.toLowerCase().includes(q) ||
        l.ip_address.toLowerCase().includes(q) ||
        JSON.stringify(l.details || {})
          .toLowerCase()
          .includes(q)
      );
    });
  }, [logs, severityFilter, searchQuery]);

  return (
    <div
      className="space-y-6 font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      {/* هدر اصلی */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🛡️</span> دفتر کل وقایع و اسکنر هوشمند امنیت (Audit Logs & Auto-Fix)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            رصد بلادرنگ اقدامات مدیریتی، اسکن آسیب‌پذیری‌ها و مشاهده/کپی جزئیات کامل هر رخداد
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto text-xs">
          <button
            type="button"
            onClick={handleSmartSecurityAutoFix}
            disabled={scanning}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            <span>⚡</span>
            <span>
              {scanning
                ? "در حال اسکن و رفع..."
                : "اسکن و رفع هوشمند خطاهای امنیتی"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-md cursor-pointer hover:opacity-90 transition"
          >
            📥 خروجی CSV
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              fetchLogs();
            }}
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔄</span>
            <span>تازه‌سازی</span>
          </button>

          <button
            type="button"
            onClick={handleClearAllLogs}
            disabled={clearing}
            className="px-4 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer disabled:opacity-50"
          >
            🗑️ پاکسازی تاریخچه
          </button>
        </div>
      </div>

      {/* گرید ۴ ستونی استاندارد و متقارن برای کارت‌های KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md flex items-center justify-between">
          <span className="font-bold text-[var(--text-secondary)]">
            ضریب امنیت جاری سیستم:
          </span>
          <span className="font-mono font-black text-lg text-emerald-500">
            {securityScore}% ✓
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md flex items-center justify-between">
          <span className="font-bold text-[var(--text-secondary)]">
            کل وقایع ثبت‌شده:
          </span>
          <span className="font-mono font-black text-lg text-[var(--accent-blue)]">
            {logs.length}
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md flex items-center justify-between">
          <span className="font-bold text-[var(--text-secondary)]">
            رخدادهای مشکوک / خطا:
          </span>
          <span className="font-mono font-black text-lg text-amber-500">
            {suspiciousCount} مورد
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md flex items-center justify-between">
          <span className="font-bold text-[var(--text-secondary)]">
            آخرین اسکن امنیتی:
          </span>
          <span className="font-mono font-bold text-[11px] text-sky-400">
            {lastScanAt
              ? new Date(lastScanAt).toLocaleTimeString("fa-IR")
              : "آماده اسکن"}
          </span>
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

      {/* جدول و ابزارهای فیلتر و جستجو */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[var(--card-border)] text-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 جستجو در نوع عملیات، نام ادمین، IP یا منبع هدف..."
            className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
          />

          <div className="flex gap-1.5 font-bold">
            {[
              { id: "all", label: `همه (${logs.length})` },
              { id: "info", label: "عملیات عادی" },
              { id: "warning", label: `هشدار / حساس (${suspiciousCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSeverityFilter(tab.id as any)}
                className={
                  "px-3.5 py-2.5 rounded-xl transition cursor-pointer " +
                  (severityFilter === tab.id
                    ? "bg-[var(--accent-blue)] text-white shadow"
                    : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">
            در حال بارگذاری سوابق امنیتی...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">
            هیچ رخدادی متناسب با فیلتر انتخابی یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-right text-xs min-w-[760px]">
              <thead className="sticky top-0 bg-[var(--modal-bg)] z-10">
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                  <th className="pb-3 px-3">نوع عملیات</th>
                  <th className="pb-3 px-3">منبع هدف</th>
                  <th className="pb-3 px-3">ادمین / کاربر</th>
                  <th className="pb-3 px-3">آدرس IP</th>
                  <th className="pb-3 px-3">تاریخ و زمان</th>
                  <th className="pb-3 px-3 text-left">جزئیات و مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-[var(--input-bg)]/60 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={
                            "px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold whitespace-nowrap " +
                            getBadgeStyle(log.action || "", log.severity)
                          }
                        >
                          {log.action}
                        </span>
                        {ACTION_LABELS_FA[log.action] && (
                          <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                            {ACTION_LABELS_FA[log.action]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[var(--text-primary)] font-bold">
                      {log.target_resource}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-[var(--accent-blue)]">
                      @{log.admin_username}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-400 text-[11px]">
                      {log.ip_address}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("fa-IR")}
                    </td>
                    <td className="py-3.5 px-3 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] font-bold text-[var(--accent-blue)] cursor-pointer"
                        >
                          🔍 مشاهده JSON
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingleLog(log.id, e)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white text-[11px] font-bold cursor-pointer transition"
                          title="حذف این لاگ"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال نمایش و کپی JSON جزئیات رخداد */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 shadow-2xl text-xs select-text"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3 gap-2">
              <div>
                <h3 className="font-black text-sm text-[var(--accent-blue)]">
                  جزئیات کامل رخداد: {selectedLog.action}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  توسط @{selectedLog.admin_username} | آی‌پی: {selectedLog.ip_address} |{" "}
                  {new Date(selectedLog.created_at).toLocaleString("fa-IR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow"
                >
                  {copied ? "✓ کپی شد!" : "📋 کپی کامل متن JSON"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="w-8 h-8 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <pre
              dir="ltr"
              className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[11px] overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed select-text"
            >
              {JSON.stringify(selectedLog.details, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}