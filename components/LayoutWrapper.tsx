// components/LayoutWrapper.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { initRealtimeSync } from "@/lib/realtimeSync";
import { siteInfoService, SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/admin");

  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>("none");
  const [maintenanceUntil, setMaintenanceUntil] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  const evaluateMaintenanceStatus = (info: SiteInfo | null) => {
    if (!info) return;
    setSiteInfo(info);

    const mode = info.maintenance_mode || (info.allow_google_index === false || info.allowGoogleIndex === false ? "indefinite" : "none");
    const until = info.maintenance_until || null;

    if (mode === "timed" && until) {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) {
        // زمان تایمر تمام شده، سایت خودکار باز می‌شود
        setMaintenanceMode("none");
        setMaintenanceUntil(null);
        return;
      }
    }

    setMaintenanceMode(mode);
    setMaintenanceUntil(until);
  };

  const fetchSiteStatus = async () => {
    try {
      const info = await siteInfoService.getSiteInfo();
      if (info) evaluateMaintenanceStatus(info);
    } catch (e) {
      console.error("LayoutWrapper status sync error:", e);
    }
  };

  // ۱. مدیریت حافظه هوشمند موقعیت کاربر قبل از رفتن به حالت تعمیر
  useEffect(() => {
    if (typeof window !== "undefined" && !isAdmin) {
      if (maintenanceMode !== "none") {
        // ذخیره موقعیت فعلی کاربر
        const currentFullPath = window.location.pathname + window.location.search;
        sessionStorage.setItem("axon_preserved_user_path", currentFullPath);
      } else {
        // اگر سایت آنلاین شد و موقعیت قبلی ذخیره شده بود، کاربر را دقیقا به همانجا بازگردان
        const savedPath = sessionStorage.getItem("axon_preserved_user_path");
        if (savedPath && savedPath !== window.location.pathname) {
          sessionStorage.removeItem("axon_preserved_user_path");
          router.replace(savedPath);
        }
      }
    }
  }, [maintenanceMode, isAdmin, router]);

  // ۲. محاسبه زنده و بلادرنگ ثانیه‌شمار برای حالت تعمیرات زمان‌دار
  useEffect(() => {
    if (maintenanceMode !== "timed" || !maintenanceUntil) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = new Date(maintenanceUntil).getTime() - Date.now();
      if (diff <= 0) {
        // اتمام زمان تعمیر: بازگشت آنی و بدون رفرش به سایت
        setMaintenanceMode("none");
        setTimeLeft(null);
        siteInfoService.updateSiteInfo({ maintenance_mode: "none", allow_google_index: true, allowGoogleIndex: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [maintenanceMode, maintenanceUntil]);

  useEffect(() => {
    fetchSiteStatus();
    const cleanup = initRealtimeSync();

    const handleUpdate = (e: any) => {
      if (e.detail) evaluateMaintenanceStatus(e.detail);
      else fetchSiteStatus();
    };

    window.addEventListener("site_info_updated", handleUpdate);

    // اتصال وب‌سوکت بلادرنگ برای دریافت تغییرات لحظه‌ای وضعیت سایت
    const channel = supabase
      .channel("layout-maintenance-sync-v12")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => fetchSiteStatus())
      .subscribe();

    return () => {
      if (typeof cleanup === "function") cleanup();
      window.removeEventListener("site_info_updated", handleUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  // دسترسی بدون وقفه ادمین‌ها به پنل مدیریت
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {children}
      </div>
    );
  }

  // نمایش صفحه تعمیرات لوکس اپلی در صورت فعال بودن یکی از دو حالت
  if (maintenanceMode !== "none") {
    const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
    const phone = siteInfo?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
    const email = siteInfo?.email || "support@axoncore.ir";
    const isTimed = maintenanceMode === "timed";

    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#07090e] text-slate-100 font-sans select-none relative overflow-hidden"
      >
        {/* نورهای نئونی پس‌زمینه */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/25 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none animate-pulse" />

        <div className="max-w-2xl w-full rounded-[3rem] bg-slate-900/85 border border-slate-800 p-8 sm:p-14 text-center space-y-8 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] backdrop-blur-3xl relative z-10 animate-fadeIn">
          
          {/* نشانگر زنده وضعیت */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>
              {isTimed ? "به‌روزرسانی برنامه‌ریزی‌شده و ارتقای سرورها" : "عملیات ارتقا و نگهداری تخصصی زیرساخت"}
            </span>
          </div>

          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-3xl shadow-2xl shadow-blue-500/20 animate-bounce">
              ⚡
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-snug">
              {isTimed ? `فروشگاه ${storeName} به زودی بازمی‌گردد` : `فروشگاه ${storeName} در حال ارتقای زیرساخت است`}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
              {isTimed
                ? "به منظور افزایش سرعت پردازش، نصب تجهیزات جدید و ارتقای امنیت درگاه‌ها، وب‌سایت موقتاً در حال به‌روزرسانی است."
                : "به منظور ارتقای جامع سرورها و پیاده‌سازی گجت‌های جدید، دسترسی به وب‌سایت تا پایان عملیات محدود شده است."}
            </p>

            {/* کارت هوشمند حفظ موقعیت کاربر */}
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 font-bold max-w-md mx-auto flex items-center justify-center gap-2">
              <span>🔒</span>
              <span>موقعیت و سبد خرید شما در حافظه سیستم محفوظ است و پس از بازگشایی به همان صفحه هدایت می‌شوید.</span>
            </div>
          </div>

          {/* باکس شمارنده معکوس مدرن در حالت زمان‌دار */}
          {isTimed && timeLeft && (
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/90 space-y-3">
              <span className="text-[11px] font-black text-slate-400 block">زمان تقریبی بازگشایی خودکار سایت:</span>
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

          {/* پل ارتباطی پشتیبانی */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-3xl bg-slate-950/60 border border-slate-800 text-xs text-right">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block">📞 تلفن اضطراری پشتیبانی:</span>
              <span className="font-mono font-black text-blue-400 text-sm" dir="ltr">{phone}</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block">✉️ ایمیل پاسخگویی ۲۴ ساعته:</span>
              <span className="font-mono text-slate-200 text-xs truncate block" dir="ltr">{email}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>سیستم پایش بلادرنگ Supabase WebSocket</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">Auto-Resume Active ✓</span>
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