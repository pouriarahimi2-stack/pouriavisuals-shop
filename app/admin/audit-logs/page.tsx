"use client";

import React, { useEffect, useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/audit-logs?limit=50");
      if (!res.ok) throw new Error("خطا در دریافت لاگ‌ها از سرور");
      const json = await res.json();
      if (json.success) {
        setLogs(json.logs);
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
  }, []);

  const getBadgeStyle = (action: string) => {
    if (action.includes("DELETE")) return "bg-rose-500/15 border-rose-500/30 text-rose-400";
    if (action.includes("CREATE") || action.includes("INSERT")) return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
    if (action.includes("UPDATE")) return "bg-amber-500/15 border-amber-500/30 text-amber-400";
    return "bg-blue-500/15 border-blue-500/30 text-blue-400";
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🛡️</span> دفتر کل وقایع امنیتی (Audit Logs)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            گزارش رسمی و تغییرناپذیر اقدامات مدیریتی، لاگ تغییرات سفارشات، محصولات و پیکربندی‌های حساس
          </p>
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            fetchLogs();
          }}
          className="px-4 py-2 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <span>🔄</span> تازه‌سازی وقایع
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
          {error}
        </div>
      )}

      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">در حال بارگذاری سوابق امنیتی...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold">هیچ رخدادی هنوز ثبت نشده است.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
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
                      <span className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold ${getBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[var(--text-primary)] font-bold">
                      {log.target_resource}
                    </td>
                    <td className="py-3.5 px-3 text-[var(--text-secondary)]">
                      {log.admin_username}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-400 text-[11px]">
                      {log.ip_address}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono">
                      {new Date(log.created_at).toLocaleString("fa-IR")}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono text-[10px] text-slate-500 truncate max-w-[200px] block" title={JSON.stringify(log.details)}>
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
