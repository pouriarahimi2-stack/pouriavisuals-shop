// components/LayoutWrapper.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { initRealtimeSync } from "@/lib/realtimeSync";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());
  const [isMaintenance, setIsMaintenance] = useState<boolean>(false);

  const fetchSiteStatus = async () => {
    try {
      const info = await siteInfoService.getSiteInfo();
      if (info) {
        setSiteInfo(info);
        const isClosed = info.allow_google_index === false || info.allowGoogleIndex === false;
        setIsMaintenance(isClosed);
      }
    } catch (e) {
      console.error("LayoutWrapper status sync error:", e);
    }
  };

  useEffect(() => {
    fetchSiteStatus();
    const cleanup = initRealtimeSync();

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setSiteInfo(e.detail);
        const isClosed = e.detail.allow_google_index === false || e.detail.allowGoogleIndex === false;
        setIsMaintenance(isClosed);
      } else {
        fetchSiteStatus();
      }
    };

    window.addEventListener("site_info_updated", handleUpdate);

    // کانال وب‌سوکت لایو برای سوییچ فوری به حالت تعمیرات
    const channel = supabase
      .channel("layout-maintenance-realtime-master")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => fetchSiteStatus())
      .subscribe();

    return () => {
      if (typeof cleanup === "function") cleanup();
      window.removeEventListener("site_info_updated", handleUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  // ادمین‌ها در هر حالتی به پنل مدیریت دسترسی دارند
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {children}
      </div>
    );
  }

  // صفحه لوکس و فوق مدرن حالت ارتقا و نگهداری زنده
  if (isMaintenance) {
    const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
    const phone = siteInfo?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
    const email = siteInfo?.email || "support@axoncore.ir";

    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#07090e] text-slate-100 font-sans select-none relative overflow-hidden"
      >
        {/* گرادیانت‌ها و نورهای پس‌زمینه نئونی */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-2xl w-full rounded-[2.8rem] bg-slate-900/80 border border-slate-800/80 p-8 sm:p-14 text-center space-y-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-3xl relative z-10 animate-fadeIn">
          
          {/* نشانگر زنده پایش زیرساخت */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-black shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>در حال ارتقا و بهینه‌سازی زیرساخت سرورها</span>
          </div>

          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-3xl shadow-xl shadow-blue-500/10 animate-bounce">
              ⚡
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-snug">
              فروشگاه {storeName} موقتاً در حال به‌روزرسانی است
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
              به منظور ارتقای امنیت پردازش داده‌ها، پیاده‌سازی گجت‌های جدید و کالیبراسیون هوشمند سرورها، وب‌سایت برای مدتی کوتاه در دست ارتقا می‌باشد.
              <br />
              <strong className="text-blue-400 font-bold mt-2 inline-block">
                نیازی به رفرش صفحه نیست؛ به محض اتمام، صفحه خودکار فعال خواهد شد.
              </strong>
            </p>
          </div>

          {/* اطلاعات ارتباطی پشتیبانی */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-3xl bg-slate-950/70 border border-slate-800 text-xs text-right">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block">📞 تلفن پشتیبانی و پیگیری:</span>
              <span className="font-mono font-black text-blue-400 text-sm" dir="ltr">{phone}</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block">✉️ ایمیل پاسخگویی ۲۴ ساعته:</span>
              <span className="font-mono text-slate-200 text-xs truncate block" dir="ltr">{email}</span>
            </div>
          </div>

          {/* پاورقی وضعیت */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>سیستم پایش بلادرنگ Supabase WebSocket</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">Live Synced ✓</span>
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