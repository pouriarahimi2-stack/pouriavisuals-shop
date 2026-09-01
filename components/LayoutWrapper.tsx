"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { initRealtimeSync } from "@/lib/realtimeSync";
import { siteInfoService, SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { fontEngine } from "@/lib/fontEngine";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/admin");

  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());
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

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {children}
      </div>
    );
  }

  if (maintenanceMode !== "none") {
    const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
    const phone = siteInfo?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
    const email = siteInfo?.email || "support@axoncore.ir";
    const isTimed = maintenanceMode === "timed";

    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-[#07090e] text-slate-100 font-sans select-none" suppressHydrationWarning>
        <div className="max-w-xl w-full rounded-[2.5rem] bg-slate-900 border border-slate-800 p-8 text-center space-y-6">
          <span className="text-4xl">⚡</span>
          <h1 className="text-2xl font-black">{storeName} در حال به‌روزرسانی است</h1>
          <p className="text-xs text-slate-400">به زودی با خدمات جدید بازمی‌گردیم.</p>
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
      <MobileBottomNav />
    </>
  );
}
