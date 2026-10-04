"use client";
// File Path: app/admin/monitoring/page.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

interface MonitoredUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  permissions: string[];
  ui_theme: "dark" | "light";
  isOnline: boolean;
  secondsAgo: number | null;
  currentPath: string;
  currentSectionTitle: string;
  currentSubTab: string;
  lastActionDetails: string;
  ip: string;
  os: string;
  browser: string;
  deviceType: string;
  screenResolution: string;
  lastActiveAt: string | null;
  lastLoginAt: string | null;
  totalLogins: number;
  totalPageViews: number;
  totalClicks: number;
  totalActions: number;
  totalBlocked: number;
  topSections: Array<{ title: string; count: number }>;
}

interface ActivityEvent {
  id: string;
  username: string;
  full_name: string;
  role: string;
  eventType:
    | "login"
    | "logout"
    | "page_view"
    | "tab_switch"
    | "click_action"
    | "search_filter"
    | "action_success"
    | "action_blocked";
  sectionKey: string;
  sectionTitle: string;
  path: string;
  method?: string;
  details: string;
  ip: string;
  os: string;
  browser: string;
  deviceType: string;
  screenResolution: string;
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
      label: "🔑 ورود به سیستم",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    };
  }
  if (eventType === "logout") {
    return {
      label: "🚪 خروج از سیستم",
      cls: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    };
  }
  if (eventType === "tab_switch") {
    return {
      label: "📑 تغییر تب داخلی",
      cls: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    };
  }
  if (eventType === "click_action") {
    return {
      label: "🖱️ کلیک و تعامل",
      cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    };
  }
  if (eventType === "search_filter") {
    return {
      label: "🔍 جستجو / فیلتر",
      cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    };
  }
  if (eventType === "action_success") {
    return {
      label: "✏️ ثبت / ویرایش اطلاعات",
      cls: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    };
  }
  if (eventType === "action_blocked") {
    return {
      label: "⛔ تلاش مسدودشده",
      cls: "bg-rose-500/20 text-rose-400 border-rose-500/40",
    };
  }
  return {
    label: "👁️ مشاهده بخش",
    cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  };
}

export default function AdminMonitoringPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [wsConnected, setWsConnected] = useState(true);

  const [summary, setSummary] = useState({
    totalUsers: 0,
    subAdminsCount: 0,
    onlineCount: 0,
    totalEventsCount: 0,
    totalBlockedCount: 0,
  });
  const [users, setUsers] = useState<MonitoredUser[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

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

  // اتصال هم‌زمان به وب‌سوکت Supabase Realtime + BroadcastChannel + استریم زنده ۲ ثانیه‌ای (بدون نیاز به هیچ رفرشی)
  useEffect(() => {
    fetchMonitoringData();

    const ch = supabase
      .channel("axon-live-monitoring-bus")
      .on("broadcast", { event: "subadmin_live_action" }, () => {
        fetchMonitoringData();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        () => {
          fetchMonitoringData();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setWsConnected(true);
      });

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("axon_subadmin_live_monitor");
      bc.onmessage = () => {
        fetchMonitoringData();
      };
    } catch {}

    const timer = autoRefresh ? setInterval(fetchMonitoringData, 2000) : null;

    return () => {
      supabase.removeChannel(ch);
      if (bc) bc.close();
      if (timer) clearInterval(timer);
    };
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
      "نوع فعالیت",
      "بخش",
      "شرح دقیق عملکرد",
      "آدرس مسیر",
      "آی‌پی (IP)",
      "سیستم‌عامل و مرورگر",
      "رزولوشن صفحه",
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
      `${e.os} - ${e.browser} (${e.deviceType})`,
      e.screenResolution,
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
    a.download = "axon-subadmins-live-monitoring-" + Date.now() + ".csv";
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
      ev.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.ip.toLowerCase().includes(searchQuery.toLowerCase());
    return matchUser && matchSec && matchType && matchSearch;
  });

  const latestEvent = events[0] || null;

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      {/* هدر مرکز نظارت زنده مدیر ارشد */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
              <span>👁️️‍🗨️</span> رادار نظارت بلادرنگ (WebSocket) و کارنامه کامل زیرمجموعه‌ها
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>وب‌سوکت زنده فعال (بدون نیاز به رفرش)</span>
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            نمایش خودکار و لحظه‌به‌لحظه مکان حضور، تب فعلی، کلیک‌ها، جستجوها، تغییرات، آی‌پی، سیستم‌عامل و مرورگر هر یک از زیرمجموعه‌ها
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
            {autoRefresh ? "⚡ استریم بلادرنگ: متصل ✓" : "⏸ استریم بلادرنگ: متوقف"}
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer hover:opacity-90 transition"
          >
            📥 خروجی اکسل کامل (CSV)
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

      {/* نوار تیکر زنده آخرین حرکت انجام‌شده در کل پنل در همین ثانیه */}
      {latestEvent && (
        <div className="p-3.5 px-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="font-black text-[var(--accent-blue)]">آخرین حرکت ثبت‌شده به صورت زنده:</span>
            <span className="font-black">{latestEvent.full_name} (@{latestEvent.username})</span>
            <span>←</span>
            <span className="font-bold text-emerald-400">{latestEvent.details}</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {new Date(latestEvent.timestamp).toLocaleTimeString("fa-IR")} | IP: {latestEvent.ip}
          </span>
        </div>
      )}

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
          {feedback}
        </div>
      )}

      {/* کارت‌های خلاصه وضعیت کلی */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">افراد آنلاین در همین لحظه:</span>
          <span className="text-xl font-black font-mono text-emerald-400 block">
            {summary.onlineCount} نفر آنلاین ●
          </span>
          <span className="text-[10px] text-slate-400">
            از مجموع {summary.totalUsers} حساب مدیریتی
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">زیرمجموعه‌های تحت نظارت:</span>
          <span className="text-xl font-black font-mono text-[var(--accent-blue)] block">
            {summary.subAdminsCount} زیرمجموعه
          </span>
          <span className="text-[10px] text-slate-400">رصد ۱۰۰٪ خودکار با وب‌سوکت</span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">کل حرکات و کلیک‌های ثبت‌شده:</span>
          <span className="text-xl font-black font-mono text-indigo-400 block">
            {summary.totalEventsCount} رویداد
          </span>
          <span className="text-[10px] text-slate-400">شامل ورود، کلیک، تب، جستجو و ویرایش</span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">تلاش‌های غیرمجاز مهارشده:</span>
          <span className="text-xl font-black font-mono text-rose-400 block">
            {summary.totalBlockedCount} مورد ⛔
          </span>
          <span className="text-[10px] text-slate-400">مسدودشده توسط فایروال نقش‌ها</span>
        </div>
      </div>

      {/* بخش ۱: مانیتور زنده تک‌تک مدیران و زیرمجموعه‌ها با تمام مشخصات سیستم و آخرین اقدام */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
          <h2 className="font-black text-sm text-[var(--accent-blue)]">
            👥 مانیتور زنده هر زیرمجموعه (با کلیک روی هر کارت، ریزِ فعالیت‌های همان شخص در جدول پایین فیلتر می‌شود)
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
                      {getRoleTitleFa(u.role)} | تم پنل:{" "}
                      {u.ui_theme === "light" ? "☀️ روشن" : "🌙 تیره"}
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
                    {u.isOnline
                      ? `🟢 آنلاین در همین لحظه (${u.secondsAgo || 0} ثانیه پیش)`
                      : "⚪ آفلاین"}
                  </span>
                </div>

                {/* جزئیات لحظه‌ای: الان کجاست و دقیقاً چه کاری انجام داده */}
                <div className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-secondary)] font-bold">
                      📍 بخش و تب فعلی:
                    </span>
                    <span className="font-black text-[var(--accent-blue)] truncate">
                      {u.currentSectionTitle} ({u.currentSubTab})
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-secondary)] font-bold">
                      ⚡ آخرین اقدام / کلیک:
                    </span>
                    <span className="font-black text-emerald-400 truncate max-w-[260px]">
                      {u.lastActionDetails}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-secondary)] font-bold">
                      💻 سیستم، مرورگر و تصویر:
                    </span>
                    <span className="font-mono text-[10px]" dir="ltr">
                      {u.deviceType} | {u.os} | {u.browser} ({u.screenResolution})
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-secondary)] font-bold">
                      🌐 آی‌پی و زمان فعالیت:
                    </span>
                    <span className="font-mono text-[10px]">
                      IP: {u.ip} |{" "}
                      {u.lastActiveAt
                        ? new Date(u.lastActiveAt).toLocaleString("fa-IR")
                        : "هنوز وارد نشده"}
                    </span>
                  </div>
                </div>

                {/* ۵ شاخص آماری کامل این کاربر */}
                <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
                  <div className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                    <div className="text-sm font-black text-emerald-400">{u.totalLogins}</div>
                    <div className="text-[9px] font-sans font-bold text-slate-400">ورود</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                    <div className="text-sm font-black text-indigo-400">{u.totalPageViews}</div>
                    <div className="text-[9px] font-sans font-bold text-slate-400">بازدید صفحه</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                    <div className="text-sm font-black text-amber-400">{u.totalClicks}</div>
                    <div className="text-[9px] font-sans font-bold text-slate-400">کلیک/جستجو</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                    <div className="text-sm font-black text-sky-400">{u.totalActions}</div>
                    <div className="text-[9px] font-sans font-bold text-slate-400">ویرایش</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                    <div className="text-sm font-black text-rose-400">{u.totalBlocked}</div>
                    <div className="text-[9px] font-sans font-bold text-slate-400">مسدودشده</div>
                  </div>
                </div>

                {u.topSections.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] block">
                      📊 بخش‌های بازدیدشده توسط این زیرمجموعه:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {u.topSections.slice(0, 6).map((sec, idx) => (
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

      {/* بخش ۲: جدول بلادرنگ ریزِ تمام فعالیت‌ها، کلیک‌ها، جستجوها و تغییرات */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 border-b border-[var(--card-border)] pb-3">
          <h2 className="font-black text-sm text-[var(--accent-blue)]">
            📡 جریان زنده ریزِ حرکات، کلیک‌ها، جستجوها و تغییرات ({filteredEvents.length} رویداد)
          </h2>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 جستجو در نام، دکمه، بخش، آی‌پی..."
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
              <option value="login">🔑 فقط ورود به سیستم</option>
              <option value="page_view">👁️ فقط مشاهده بخش‌ها</option>
              <option value="tab_switch">📑 فقط تغییر تب‌های داخلی</option>
              <option value="click_action">🖱️ فقط کلیک روی دکمه‌ها</option>
              <option value="search_filter">🔍 فقط جستجوها و فیلترها</option>
              <option value="action_success">✏️ فقط ویرایش و ذخیره اطلاعات</option>
              <option value="action_blocked">⛔ فقط تلاش‌های مسدودشده</option>
              <option value="logout">🚪 فقط خروج از سیستم</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            در حال برقراری ارتباط بلادرنگ با رادار نظارت...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold">
            هنوز رویدادی مطابق با این فیلتر ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-right text-xs min-w-[980px]">
              <thead className="sticky top-0 bg-[var(--modal-bg)] z-10">
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                  <th className="py-3 px-3">کاربر / زیرمجموعه</th>
                  <th className="py-3 px-3">نوع حرکت</th>
                  <th className="py-3 px-3">بخش هدف</th>
                  <th className="py-3 px-3">شرح دقیق حرکت / کلیک / اقدام</th>
                  <th className="py-3 px-3">دستگاه، سیستم‌عامل و مرورگر</th>
                  <th className="py-3 px-3">آی‌پی (IP)</th>
                  <th className="py-3 px-3 text-left">ساعت و تاریخ دقیق</th>
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
                          @{ev.username} ({getRoleTitleFa(ev.role)})
                        </div>
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
                      <td className="py-3 px-3 font-mono text-[10px]" dir="ltr">
                        <div>{ev.deviceType} | {ev.os}</div>
                        <div className="text-slate-400">{ev.browser} ({ev.screenResolution})</div>
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
