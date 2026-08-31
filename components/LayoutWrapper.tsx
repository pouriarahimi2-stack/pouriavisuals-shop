"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { initRealtimeSync } from "@/lib/realtimeSync";
import { siteInfoService, SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { fontEngine } from "@/lib/fontEngine";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/admin");

  const [mounted, setMounted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>("none");
  const [maintenanceUntil, setMaintenanceUntil] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  const prevModeRef = useRef<MaintenanceMode>("none");

  const updateMaintenanceState = (info: SiteInfo | null) => {
    if (!info) return;
    setSiteInfo(info);

    if (info.active_font_id) {
      fontEngine.applyFontToTarget(info.active_font_id, "body");
    }

    const mode: MaintenanceMode = info.maintenance_mode || (info.allow_google_index === false ? "indefinite" : "none");
    const until = info.maintenance_until || null;

    if (mode === "timed" && until) {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) {
        setMaintenanceMode("none");
        setMaintenanceUntil(null);
        return;
      }
    }

    setMaintenanceMode(mode);
    setMaintenanceUntil(until);
  };

  useEffect(() => {
    setMounted(true);

    siteInfoService.getSiteInfo().then((data) => {
      if (data) updateMaintenanceState(data);
    });

    const cleanup = initRealtimeSync();

    const handleUpdate = (e: any) => {
      if (e.detail) updateMaintenanceState(e.detail);
    };
    window.addEventListener("site_info_updated", handleUpdate);

    return () => {
      if (typeof cleanup === "function") cleanup();
      window.removeEventListener("site_info_updated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!mounted || isAdmin || typeof window === "undefined") return;

    if (maintenanceMode !== "none") {
      const currentPath = window.location.pathname + window.location.search;
      if (!currentPath.startsWith("/admin")) {
        localStorage.setItem("axon_user_last_position", currentPath);
      }
    } else if (prevModeRef.current !== "none" && maintenanceMode === "none") {
      const savedPath = localStorage.getItem("axon_user_last_position");
      if (savedPath && savedPath !== window.location.pathname) {
        localStorage.removeItem("axon_user_last_position");
        router.replace(savedPath);
      }
    }

    prevModeRef.current = maintenanceMode;
  }, [maintenanceMode, mounted, isAdmin, router]);

  useEffect(() => {
    if (maintenanceMode !== "timed" || !maintenanceUntil) {
      setTimeLeft(null);
      return;
    }

    const calcTime = () => {
      const diff = new Date(maintenanceUntil).getTime() - Date.now();
      if (diff <= 0) {
        setMaintenanceMode("none");
        setTimeLeft(null);
        siteInfoService.updateSiteInfo({ maintenance_mode: "none", allow_google_index: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    calcTime();
    const timer = setInterval(calcTime, 1000);
    return () => clearInterval(timer);
  }, [maintenanceMode, maintenanceUntil]);

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {children}
      </div>
    );
  }

  // نمایش صفحه تعمیرات به صورت عایق‌شده و بدون خطای هیدریشن
  if (mounted && maintenanceMode !== "none") {
    const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
    const phone = siteInfo?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
    const email = siteInfo?.email || "support@axoncore.ir";
    const isTimed = maintenanceMode === "timed";

    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#07090e] text-slate-100 font-sans select-none relative overflow-hidden"
        suppressHydrationWarning
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/25 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none animate-pulse" />

        <div className="max-w-2xl w-full rounded-[3rem] bg-slate-900/90 border border-slate-800 p-8 sm:p-14 text-center space-y-8 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] backdrop-blur-3xl relative z-10 animate-fadeIn">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>
              {isTimed ? "به‌روزرسانی زمان‌دار و ارتقای سرورها" : "عملیات ارتقای اساسی زیرساخت سرورها"}
            </span>
          </div>

          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-3xl shadow-2xl shadow-blue-500/20 animate-bounce">
              ⚡
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-snug">
              {isTimed ? `فروشگاه ${storeName} به زودی بازمی‌گردد` : `فروشگاه ${storeName} در حال به‌روزرسانی است`}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
              {isTimed
                ? "به منظور افزایش سرعت پردازش و اضافه شدن امکانات جدید، وب‌سایت طبق زمان‌سنج زیر به طور خودکار بازگشایی خواهد شد."
                : "به منظور ارتقای جامع زیرساخت، دسترسی به سایت موقتاً محدود شده است. به محض اتمام کار، صفحه به صورت خودکار فعال خواهد شد."}
            </p>

            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-[11px] text-blue-300 font-bold max-w-md mx-auto flex items-center justify-center gap-2">
              <span>🔒</span>
              <span>سبد خرید و موقعیت شما در حافظه سیستم ذخیره شده و پس از بازگشایی مجدداً فعال می‌شود.</span>
            </div>
          </div>

          {isTimed && timeLeft && (
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/90 space-y-3">
              <span className="text-[11px] font-black text-slate-400 block">زمان بازگشایی خودکار وب‌سایت:</span>
              <div className="flex items-center justify-center gap-3 font-mono text-white">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 min-w-[70px]">
                  <span className="text-2xl sm:text-3xl font-black text-blue-400">{String(timeLeft.seconds).padStart(2, "0")}</span>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold mt-1">ثانیه</span>
                </div>
                <span className="text-2xl font-black text-slate-600">:</span>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 min-w-[70px]">
                  <span className="text-2xl sm:text-3xl font-black text-blue-400">{String(timeLeft.minutes).padStart(2, "0")}</span>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold mt-1">دقیقه</span>
                </div>
                <span className="text-2xl font-black text-slate-600">:</span>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 min-w-[70px]">
                  <span className="text-2xl sm:text-3xl font-black text-blue-400">{String(timeLeft.hours).padStart(2, "0")}</span>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold mt-1">ساعت</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-3xl bg-slate-950/60 border border-slate-800 text-xs text-right">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block">📞 تلفن پشتیبانی:</span>
              <span className="font-mono font-black text-blue-400 text-sm" dir="ltr">{phone}</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block">✉️ ایمیل پاسخگویی ۲۴ ساعته:</span>
              <span className="font-mono text-slate-200 text-xs truncate block" dir="ltr">{email}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
