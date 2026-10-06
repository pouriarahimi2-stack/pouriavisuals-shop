"use client";
// File Path: app/admin/layout.tsx
import React, { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminReadOnlyGuard from "@/components/admin/AdminReadOnlyGuard";
import AdminLiveChatNotifier from "@/components/admin/AdminLiveChatNotifier";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import { soundEngine } from "@/lib/soundEngine";
import { themeEngine } from "@/lib/themeEngine";
import { supabase } from "@/lib/supabase";

const SUPERADMIN_THEME_STORAGE_KEY = "axon_superadmin_panel_theme_v2026";

function applyAdminDomTheme(mode: "dark" | "light") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;

  if (mode === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
    root.style.setProperty("--bg-primary", "#f1f5f9");
    root.style.setProperty("--bg-secondary", "#e2e8f0");
    root.style.setProperty("--modal-bg", "#ffffff");
    root.style.setProperty("--input-bg", "#f8fafc");
    root.style.setProperty("--card-border", "#cbd5e1");
    root.style.setProperty("--text-primary", "#0f172a");
    root.style.setProperty("--text-secondary", "#475569");
    if (body) {
      body.classList.remove("dark");
      body.classList.add("light");
    }
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
    root.style.setProperty("--bg-primary", "#07090e");
    root.style.setProperty("--bg-secondary", "#0b0f17");
    root.style.setProperty("--modal-bg", "#0f141f");
    root.style.setProperty("--input-bg", "#161d2b");
    root.style.setProperty("--card-border", "#1e293b");
    root.style.setProperty("--text-primary", "#f8fafc");
    root.style.setProperty("--text-secondary", "#94a3b8");
    if (body) {
      body.classList.remove("light");
      body.classList.add("dark");
    }
  }

  try {
    themeEngine.applyTheme(mode, true);
  } catch {}
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();

  const [adminUser, setAdminUser] = useState<{
    id?: string;
    username?: string;
    role?: string;
    ui_theme?: "dark" | "light";
  } | null>(null);
  const [activeTheme, setActiveTheme] = useState<"dark" | "light">("dark");

  const syncAdminSessionAndTheme = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.authenticated && json.user) {
        setAdminUser(json.user);
        const dbTheme: "dark" | "light" =
          json.user.ui_theme === "light" ? "light" : "dark";

        if (json.user.role === "superadmin" && typeof window !== "undefined") {
          localStorage.setItem(SUPERADMIN_THEME_STORAGE_KEY, dbTheme);
        }

        setActiveTheme(dbTheme);
        applyAdminDomTheme(dbTheme);
      }
    } catch {}
  }, []);

  const pushLiveTelemetry = useCallback(
    (payload: {
      eventType: string;
      path: string;
      subTab?: string;
      method?: string;
      details: string;
    }) => {
      if (typeof window === "undefined") return;
      const screenRes = window.screen
        ? `${window.screen.width}x${window.screen.height}`
        : "";
      const bodyData = {
        ...payload,
        screenResolution: screenRes,
        timestamp: new Date().toISOString(),
      };

      try {
        const bc = new BroadcastChannel("axon_subadmin_live_monitor");
        bc.postMessage(bodyData);
        bc.close();
      } catch {}

      fetch("/api/admin/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      }).catch(() => {});
    },
    []
  );

  useEffect(() => {
    const channelId = "axon-admin-layout-sync-" + Math.random().toString(36).slice(2, 8);
    const ch = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        () => {
          syncAdminSessionAndTheme();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [syncAdminSessionAndTheme]);

  useEffect(() => {
    if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/setup")) return;

    pushLiveTelemetry({
      eventType: "page_view",
      path: pathname,
      method: "VIEW",
      details: "👁️ ورود و مشاهده بخش " + pathname,
    });

    const hbTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        pushLiveTelemetry({
          eventType: "heartbeat",
          path: pathname,
          details: "🟢 حضور آنلاین در " + pathname,
        });
      }
    }, 25000);

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest("button, a");
      if (!btn) return;
      const text = (btn.textContent || btn.getAttribute("title") || "").trim().slice(0, 70);
      if (!text) return;

      const isTabSwitch = /^[🧭🏛📑🌳⚡🏭📦📈🎯✏️📡💻📊📋🔍🚀📚🤖]*\s*[۱۱۲۳۴۵12345]\./.test(text);
      if (isTabSwitch) {
        pushLiveTelemetry({
          eventType: "tab_switch",
          path: pathname,
          subTab: text,
          method: "TAB",
          details: "📑 تغییر تب به: «" + text + "»",
        });
      } else if (!text.includes("خروج امن") && !text.includes("استریم بلادرنگ")) {
        pushLiveTelemetry({
          eventType: "click_action",
          path: pathname,
          method: "CLICK",
          details: "🖱️ کلیک روی گزینه: «" + text + "»",
        });
      }
    };

    let searchDebounce: any = null;
    const handleGlobalInput = (e: Event) => {
      const el = e.target as HTMLInputElement | HTMLSelectElement | null;
      if (!el) return;
      if (el.type === "password") return;
      const val = String(el.value || "").trim();
      if (!val) return;
      const placeholder = el.getAttribute("placeholder") || el.name || "فیلد";

      if (searchDebounce) clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        pushLiveTelemetry({
          eventType: "search_filter",
          path: pathname,
          method: "INPUT",
          details: `🔍 ورود/انتخاب مقدار «${val.slice(0, 40)}» در (${placeholder.slice(0, 35)})`,
        });
      }, 900);
    };

    document.addEventListener("click", handleGlobalClick, true);
    document.addEventListener("change", handleGlobalInput, true);

    return () => {
      clearInterval(hbTimer);
      if (searchDebounce) clearTimeout(searchDebounce);
      document.removeEventListener("click", handleGlobalClick, true);
      document.removeEventListener("change", handleGlobalInput, true);
    };
  }, [pathname, pushLiveTelemetry]);

  useEffect(() => {
    if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/setup")) return;
    syncAdminSessionAndTheme();

    const onCustomThemeEvent = (e: any) => {
      const nextMode: "dark" | "light" = e?.detail === "light" ? "light" : "dark";
      setActiveTheme(nextMode);
      applyAdminDomTheme(nextMode);
    };

    const onFocus = () => syncAdminSessionAndTheme();
    const interval = setInterval(() => { if (document.visibilityState === 'visible') syncAdminSessionAndTheme(); }, 25000);

    window.addEventListener("axon_admin_theme_changed", onCustomThemeEvent);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("axon_admin_theme_changed", onCustomThemeEvent);
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname, syncAdminSessionAndTheme]);

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/setup")) {
    return <>{children}</>;
  }

  const isSuperAdmin = adminUser?.role === "superadmin";

  const handleToggleSuperAdminTheme = async () => {
    if (!isSuperAdmin) return;
    soundEngine.playClick();
    const nextTheme: "dark" | "light" = activeTheme === "dark" ? "light" : "dark";
    setActiveTheme(nextTheme);
    applyAdminDomTheme(nextTheme);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(SUPERADMIN_THEME_STORAGE_KEY, nextTheme);
      }
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_user_theme",
          id: adminUser?.id,
          username: adminUser?.username || "admin",
          role: "superadmin",
          ui_theme: nextTheme,
        }),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("axon_admin_theme_reload_list"));
      }
    } catch {}
  };

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      pushLiveTelemetry({
        eventType: "logout",
        path: pathname,
        method: "LOGOUT",
        details: "🚪 خروج از پنل مدیریت",
      });
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    router.replace("/admin/login");
  };

  return (
    <div
      id="axon-admin-shell"
      data-admin-theme={activeTheme}
      className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-text transition-colors duration-300"
      dir="rtl"
    >
      <style>{
        activeTheme === "light"
          ? `
        #axon-admin-shell[data-admin-theme="light"] {
          --bg-primary: #f1f5f9 !important;
          --bg-secondary: #e2e8f0 !important;
          --modal-bg: #ffffff !important;
          --input-bg: #f8fafc !important;
          --card-border: #cbd5e1 !important;
          --text-primary: #0f172a !important;
          --text-secondary: #475569 !important;
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        #axon-admin-shell[data-admin-theme="light"] [class*="bg-[#0"],
        #axon-admin-shell[data-admin-theme="light"] [class*="bg-[#1"],
        #axon-admin-shell[data-admin-theme="light"] .bg-slate-950,
        #axon-admin-shell[data-admin-theme="light"] .bg-slate-900,
        #axon-admin-shell[data-admin-theme="light"] .bg-zinc-900,
        #axon-admin-shell[data-admin-theme="light"] .bg-gray-900 {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        #axon-admin-shell[data-admin-theme="light"] .bg-slate-800,
        #axon-admin-shell[data-admin-theme="light"] .bg-zinc-800 {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        #axon-admin-shell[data-admin-theme="light"] .text-slate-200,
        #axon-admin-shell[data-admin-theme="light"] .text-slate-300,
        #axon-admin-shell[data-admin-theme="light"] .text-zinc-200,
        #axon-admin-shell[data-admin-theme="light"] .text-zinc-300 {
          color: #334155 !important;
        }
        #axon-admin-shell[data-admin-theme="light"] .border-slate-800,
        #axon-admin-shell[data-admin-theme="light"] .border-slate-700,
        #axon-admin-shell[data-admin-theme="light"] .border-zinc-800 {
          border-color: #cbd5e1 !important;
        }
      `
          : `
        #axon-admin-shell[data-admin-theme="dark"] {
          --bg-primary: #07090e !important;
          --bg-secondary: #0b0f17 !important;
          --modal-bg: #0f141f !important;
          --input-bg: #161d2b !important;
          --card-border: #1e293b !important;
          --text-primary: #f8fafc !important;
          --text-secondary: #94a3b8 !important;
          background-color: #07090e !important;
          color: #f8fafc !important;
        }
      `
      }</style>

      <header className="w-full px-4 sm:px-6 py-3 bg-[var(--modal-bg)] border-b border-[var(--card-border)] flex flex-wrap items-center justify-between gap-3 shadow-md z-30">
        <div className="flex items-center gap-3">
          <span className="text-sm sm:text-base font-black text-[var(--accent-blue)]">
            آکسون کور | AXON CORE
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-xs font-bold text-[var(--text-secondary)]">
            مرکز فرماندهی و مدیریت یکپارچه سایت
          </span>
        </div>

        <AdminGlobalSearch
          userRole={adminUser?.role}
          userPermissions={(adminUser as any)?.permissions}
        />

        <div className="flex items-center gap-2 text-xs">
          {adminUser && adminUser.role !== "viewer_reporter" && (
            <AdminLiveChatNotifier userRole={adminUser.role} />
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleToggleSuperAdminTheme}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-black transition cursor-pointer flex items-center gap-1.5"
              title="تغییر تم پنل مدیریت (ویژه مدیر ارشد)"
            >
              <span>{activeTheme === "dark" ? "☀️" : "🌙"}</span>
              <span>{activeTheme === "dark" ? "رفتن به تم روشن" : "رفتن به تم تیره"}</span>
            </button>
          )}

          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold transition"
          >
            🏬 مشاهده زنده سایت
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer"
          >
            خروج امن
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        <AdminSidebar />
        <main
          id="axon-admin-main-workspace"
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden"
        >
          <AdminReadOnlyGuard />
          {children}
        </main>
      </div>
    </div>
  );
}
