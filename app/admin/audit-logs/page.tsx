"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface AuditLogItem {
  id: string;
  admin_username?: string;
  action: string;
  target_resource?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || json.data || []);
      }
    } catch (e) {
      console.error("Audit log fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      (l.admin_username || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.action || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.target_resource || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🛡️</span> گزارش وقایع و لاگ‌های امنیتی سیستم (Audit Logs)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ثبت و پایش دقیق تغییرات، لاگین‌ها و عملیات‌های ادمین‌ها در دیتابیس
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              fetchLogs();
            }}
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer flex items-center gap-2"
          >
            <span>🔄</span>
            <span>به‌روزرسانی</span>
          </button>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="🔍 جستجو در عملیات، کاربر، منبع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black text-[11px] pb-3">
                <th className="p-3">کاربر مدیر</th>
                <th className="p-3">عملیات</th>
                <th className="p-3">منبع هدف</th>
                <th className="p-3">آدرس IP</th>
                <th className="p-3 text-left">زمان وقوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)] font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">در حال بارگذاری لاگ‌های امنیتی...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">هیچ رخدادی ثبت نشده است.</td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--input-bg)]/60 transition">
                    <td className="p-3 font-mono font-bold text-[var(--accent-blue)]">{log.admin_username || "system"}</td>
                    <td className="p-3 font-bold text-[var(--text-primary)]">{log.action}</td>
                    <td className="p-3 font-mono text-slate-400">{log.target_resource || "---"}</td>
                    <td className="p-3 font-mono text-xs">{log.ip_address || "لوکال / نامشخص"}</td>
                    <td className="p-3 text-left font-mono text-[10px] text-slate-400">
                      {log.created_at ? new Date(log.created_at).toLocaleString("fa-IR") : "---"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
