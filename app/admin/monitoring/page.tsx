"use client";
// File Path: app/admin/monitoring/page.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

interface MonitoredUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  permissions: string[];
  ui_theme: "dark" | "light";
  isOnline: boolean;
  currentPath: string;
  currentSectionTitle: string;
  ip: string;
  lastActiveAt: string | null;
  lastLoginAt: string | null;
  totalLogins: number;
  totalPageViews: number;
  totalActions: number;
  totalBlocked: number;
  topSections: Array<{ title: string; count: number }>;
}

interface ActivityEvent {
  id: string;
  username: string;
  full_name: string;
  role: string;
  eventType: "login" | "logout" | "page_view" | "action_success" | "action_blocked";
  sectionKey: string;
  sectionTitle: string;
  path: string;
  method?: string;
  details: string;
  ip: string;
  userAgent: string;
  timestamp: string;
}

function getRoleTitleFa(role: string) {
  if (role === "superadmin") return "👑 مدیر ارشد کل سیستم";
  if (role === "product_manager") return "📦 مدیر کاتالوگ و انبار";
  if (role === "order_manager") return "💳 پشتیبان سفارشات و مالی";
  if (role === "content_seo_manager") return "🚀 کارشناس محتوا و سئو";
  if (role === "viewer_reporter") return "👁️ بیننده و گزارش‌دهنده";
  return role;
}

function getEventBadge(eventType: string) {
  if (eventType === "login") {
    return {
      label: "🔑 ورود به پنل",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    };
  }
  if (eventType === "logout") {
    return {
      label: "🚪 خروج از پنل",
      cls: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    };
  }
  if (eventType === "action_success") {
    return {
      label: "✏️ انجام عملیات / ویرایش",
      cls: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    };
  }
  if (eventType === "action_blocked") {
    return {
      label: "⛔ تلاش مسدودشده (قفل امنیتی)",
      cls: "bg-rose-500/20 text-rose-400 border-rose-500/40",
    };
  }
  return {
    label: "👁️ بازدید و مشاهده بخش",
    cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  };
}

export default function AdminMonitoringPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [summary, setSummary] = useState({
    totalUsers: 0,
    subAdminsCount: 0,
    onlineCount: 0,
    totalEventsCount: 0,
    totalBlockedCount: 0,
  });
  const [users, setUsers] = useState<MonitoredUser[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  // فیلترهای گزارش
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchMonitoringData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/monitoring?t=" + Date.now(), {
        cache: "no-store",
      });
      if (res.status === 403 || res.status === 401) {
        setAccessDenied(true);
        setTimeout(() => router.replace("/admin/dashboard"), 1500);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setSummary(json.summary || summary);
        setUsers(json.users || []);
        setEvents(json.events || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchMonitoringData();
    if (!autoRefresh) return;
    const timer = setInterval(fetchMonitoringData, 5000);
    return () => clearInterval(timer);
  }, [fetchMonitoringData, autoRefresh]);

  const handleClearLogs = async () => {
    if (!confirm("آیا از پاکسازی تاریخچه ریز فعالیت‌ها اطمینان دارید؟")) return;
    soundEngine.playClick();
    const res = await fetch("/api/admin/monitoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_logs" }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      soundEngine.playSuccess();
      setFeedback(json.message);
      fetchMonitoringData();
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleExportCsv = () => {
    soundEngine.playSuccess();
    const headers = [
      "نام کاربری",
      "نام کامل",
      "نقش سازمانی",
      "نوع رویداد",
      "بخش",
      "جزئیات عملکرد",
      "آدرس مسیر",
      "آی‌پی (IP)",
      "زمان دقیق",
    ];
    const rows = filteredEvents.map((e) => [
      e.username,
      e.full_name,
      getRoleTitleFa(e.role),
      getEventBadge(e.eventType).label,
      e.sectionTitle,
      e.details,
      e.path,
      e.ip,
      new Date(e.timestamp).toLocaleString("fa-IR"),
    ]);
    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((r) => r.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "axon-subadmins-monitoring-" + Date.now() + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (accessDenied) {
    return (
      <div className="p-12 text-center rounded-3xl bg-rose-500/15 border border-rose-500 text-rose-400 font-black text-sm">
        ⛔ دسترسی غیرمجاز! این بخش منحصراً در اختیار مدیر ارشد کل سیستم است.
      </div>
    );
  }

  const uniqueSections = Array.from(new Set(events.map((e) => e.sectionTitle)));

  const filteredEvents = events.filter((ev) => {
    const matchUser =
      selectedUserFilter === "all"
        ? true
        : ev.username.toLowerCase() === selectedUserFilter.toLowerCase();
    const matchSec =
      selectedSectionFilter === "all" ? true : ev.sectionTitle === selectedSectionFilter;
    const matchType =
      selectedTypeFilter === "all" ? true : ev.eventType === selectedTypeFilter;
    const matchSearch =
      !searchQuery.trim() ||
      ev.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.sectionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.path.toLowerCase().includes(searchQuery.toLowerCase());
    return matchUser && matchSec && matchType && matchSearch;
  });

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      {/* هدر مرکز نظارت زنده مدیر ارشد */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
              <span>👁️‍🗨️</span> رادار نظارت زنده و کارنامه عملکرد زیرمجموعه‌های مدیریتی
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ویژه مالک سایت (پایش زنده ۵ ثانیه‌ای)</span>
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            رصد لحظه‌به‌لحظه ورود، خروج، بخش‌های در حال مشاهده، ویرایش‌های انجام‌شده و تلاش‌های مسدودشده هر یک از مدیران زیرمجموعه
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setAutoRefresh(!autoRefresh);
            }}
            className={
              "px-3.5 py-2.5 rounded-2xl border font-black cursor-pointer transition " +
              (autoRefresh
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-slate-400")
            }
          >
            {autoRefresh ? "📡 رادار زنده: روشن ✓" : "⏸ رادار زنده: متوقف"}
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer hover:opacity-90 transition"
          >
            📥 خروجی اکسل گزارش عملکرد (CSV)
          </button>

          <button
            type="button"
            onClick={handleClearLogs}
            className="px-3.5 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold cursor-pointer hover:bg-rose-500 hover:text-white transition"
          >
            🗑️ پاکسازی تاریخچه
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
          {feedback}
        </div>
      )}

      {/* کارت‌های خلاصه وضعیت کلی */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">مدیران آنلاین در همین لحظه:</span>
          <span className="text-xl font-black font-mono text-emerald-400 block">
            {summary.onlineCount} نفر آنلاین ●
          </span>
          <span className="text-[10px] text-slate-400">
            از مجموع {summary.totalUsers} حساب مدیریتی
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">تعداد زیرمجموعه‌های تعریف‌شده:</span>
          <span className="text-xl font-black font-mono text-[var(--accent-blue)] block">
            {summary.subAdminsCount} زیرمجموعه
          </span>
          <span className="text-[10px] text-slate-400">تحت نظارت مستقیم مدیر ارشد</span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">کل فعالیت‌ها و بازدیدهای ثبت‌شده:</span>
          <span className="text-xl font-black font-mono text-indigo-400 block">
            {summary.totalEventsCount} رویداد
          </span>
          <span className="text-[10px] text-slate-400">شامل ورود، بازدید بخش و تغییرات</span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">تلاش‌های غیرمجاز مهارشده:</span>
          <span className="text-xl font-black font-mono text-rose-400 block">
            {summary.totalBlockedCount} مورد ⛔
          </span>
          <span className="text-[10px] text-slate-400">مسدودشده توسط فایروال نقش‌ها</span>
        </div>
      </div>

      {/* بخش ۱: کارنامه عملکرد و وضعیت آنلاین تک‌تک مدیران و زیرمجموعه‌ها */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
          <h2 className="font-black text-sm text-[var(--accent-blue)]">
            👥 کارنامه عملکرد و حضور لحظه‌ای هر زیرمجموعه (کلیک روی هر کارت = فیلتر ریز فعالیت‌های همان شخص)
          </h2>
          {selectedUserFilter !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedUserFilter("all")}
              className="px-3 py-1 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer"
            >
              نمایش همه مدیران ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((u) => {
            const isSelected = selectedUserFilter.toLowerCase() === u.username.toLowerCase();
            return (
              <div
                key={u.id}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedUserFilter(isSelected ? "all" : u.username);
                }}
                className={
                  "p-5 rounded-3xl border transition cursor-pointer space-y-3.5 " +
                  (isSelected
                    ? "bg-[var(--accent-blue)]/10 border-2 border-[var(--accent-blue)] shadow-lg"
                    : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--accent-blue)]/50")
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "w-2.5 h-2.5 rounded-full shrink-0 " +
                          (u.isOnline ? "bg-emerald-400 animate-ping" : "bg-slate-500")
                        }
                      />
                      <h3 className="font-black text-sm">{u.full_name}</h3>
                      <span className="font-mono text-xs text-[var(--accent-blue)]">
                        @{u.username}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 mt-1">
                      {getRoleTitleFa(u.role)}
                    </div>
                  </div>

                  <span
                    className={
                      "px-3 py-1 rounded-full text-[10px] font-black border " +
                      (u.isOnline
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : "bg-slate-500/15 border-slate-500/30 text-slate-400")
                    }
                  >
                    {u.isOnline ? "🟢 آنلاین در پنل" : "⚪ آفلاین"}
                  </span>
                </div>

                {/* محل حضور فعلی و زمان آخرین فعالیت */}
                <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-secondary)] font-bold">
                      📍 آخرین بخش در حال مشاهده:
                    </span>
                    <span className="font-black text-[var(--accent-blue)] truncate">
                      {u.currentSectionTitle}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-secondary)] font-bold">🕒 آخرین فعالیت:</span>
                    <span className="font-mono text-[10px]">
                      {u.lastActiveAt
                        ? new Date(u.lastActiveAt).toLocaleString("fa-IR")
                        : "هنوز فعالیتی ثبت نشده"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-secondary)] font-bold">🌐 آی‌پی و ورود:</span>
                    <span className="font-mono text-[10px]">
                      IP: {u.ip} | آخرین ورود:{" "}
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString("fa-IR") : "—"}
                    </span>
                  </div>
                </div>

                {/* ۴ شاخص عملکردی این مدیر */}
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                    <div className="text-sm font-black text-emerald-400">{u.totalLogins}</div>
                    <div className="text-[9px] font-sans font-bold text-slate-400">دفعات ورود</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                    <div className="text-sm font-black text-indigo-400">{u.totalPageViews}</div>
                    <div className="text-[9px] font-sans font-bold text-slate-400">بازدید صفحات</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                    <div className="text-sm font-black text-sky-400">{u.totalActions}</div>
                    <div className="text-[9px] font-sans font-bold text-slate-400">انجام کار</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                    <div className="text-sm font-black text-rose-400">{u.totalBlocked}</div>
                    <div className="text-[9px] font-sans font-bold text-slate-400">تلاش مسدود</div>
                  </div>
                </div>

                {/* پربازدیدترین بخش‌های این زیرمجموعه */}
                {u.topSections.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] block">
                      📊 بخش‌های مورد بازدید این کاربر به ترتیب تعداد مراجعه:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {u.topSections.slice(0, 5).map((sec, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-[10px] font-bold"
                        >
                          {sec.title}: <strong className="text-[var(--accent-blue)]">{sec.count} بار</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* بخش ۲: جدول زنده ریزِ وقایع و فعالیت‌ها به تفکیک بخش و زمان */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 border-b border-[var(--card-border)] pb-3">
          <h2 className="font-black text-sm text-[var(--accent-blue)]">
            📡 جدول زنده ریزِ فعالیت‌ها، ورودها و پیمایش بخش‌ها ({filteredEvents.length} رکورد)
          </h2>

          {/* فیلترهای پیشرفته */}
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 جستجو در کاربر، بخش، آی‌پی..."
              className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
            />

            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              <option value="all">👤 همه مدیران ({users.length})</option>
              {users.map((u) => (
                <option key={u.id} value={u.username}>
                  @{u.username} ({u.full_name})
                </option>
              ))}
            </select>

            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              <option value="all">📁 همه بخش‌های سایت</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              <option value="all">⚡ همه انواع فعالیت</option>
              <option value="login">🔑 فقط ورود به پنل</option>
              <option value="page_view">👁️ فقط بازدید بخش‌ها</option>
              <option value="action_success">✏️ فقط ویرایش و انجام کار</option>
              <option value="action_blocked">⛔ فقط تلاش‌های مسدودشده</option>
              <option value="logout">🚪 فقط خروج از پنل</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            در حال دریافت گزارش زنده فعالیت زیرمجموعه‌ها...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold">
            هنوز فعالیتی مطابق با این فیلتر ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
            <table className="w-full text-right text-xs min-w-[920px]">
              <thead className="sticky top-0 bg-[var(--modal-bg)] z-10">
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                  <th className="py-3 px-3">کاربر / زیرمجموعه</th>
                  <th className="py-3 px-3">نقش سازمانی</th>
                  <th className="py-3 px-3">نوع فعالیت</th>
                  <th className="py-3 px-3">بخش هدف</th>
                  <th className="py-3 px-3">شرح دقیق عملکرد</th>
                  <th className="py-3 px-3">آی‌پی (IP)</th>
                  <th className="py-3 px-3 text-left">تاریخ و ساعت دقیق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {filteredEvents.map((ev) => {
                  const badge = getEventBadge(ev.eventType);
                  return (
                    <tr key={ev.id} className="hover:bg-[var(--input-bg)]/50 transition">
                      <td className="py-3 px-3">
                        <div className="font-black text-[var(--text-primary)]">{ev.full_name}</div>
                        <div className="font-mono text-[10px] text-[var(--accent-blue)]">
                          @{ev.username}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-400">
                        {getRoleTitleFa(ev.role)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={
                            "px-2.5 py-1 rounded-lg border text-[10px] font-black inline-block " +
                            badge.cls
                          }
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-black text-[var(--accent-blue)]">
                        {ev.sectionTitle}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold">{ev.details}</div>
                        <div className="font-mono text-[10px] text-slate-400" dir="ltr">
                          {ev.path}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">{ev.ip}</td>
                      <td className="py-3 px-3 text-left font-mono text-[11px] text-slate-400">
                        {new Date(ev.timestamp).toLocaleString("fa-IR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
