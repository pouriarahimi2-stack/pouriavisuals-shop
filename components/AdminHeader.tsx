"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { adminAuthService } from "@/services/adminAuthService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminHeader() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  const fetchHeaderInfo = async () => {
    try {
      const data = await siteInfoService.getSiteInfo();
      if (data) setSiteInfo(data);
    } catch (e) {
      console.error("AdminHeader fetch error:", e);
    }
  };

  useEffect(() => {
    fetchHeaderInfo();

    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}

    const handleSiteUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };

    window.addEventListener("site_info_updated", handleSiteUpdate);
    return () => {
      window.removeEventListener("site_info_updated", handleSiteUpdate);
    };
  }, []);

  const toggleDarkMode = () => {
    soundEngine.playClick();
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    if (nextDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;
  const isOnline = (siteInfo?.maintenance_mode || "none") === "none";

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[var(--modal-bg)]/90 border-b border-[var(--card-border)] text-[var(--text-primary)] transition-colors select-none font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
            ) : (
              <span className="text-xl text-[var(--accent-blue)] font-black">⚡</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-[var(--text-primary)] block">
                {storeName} <span className="text-[10px] text-[var(--accent-blue)] font-bold">(پنل مدیریت)</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse" : "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]"}`} />
            </div>
            <span className="text-[10px] text-[var(--text-secondary)] font-medium block">
              کنترل‌پنل جامع فروشگاهی و هوش مصنوعی
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="text-xs px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] transition font-bold shadow-sm flex items-center gap-1.5"
          >
            <span>🏠</span>
            <span>مشاهده فروشگاه</span>
          </Link>

          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] transition cursor-pointer text-xs font-bold shadow-sm flex items-center justify-center"
            title="تغییر تم"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              adminAuthService.logout();
              router.replace("/admin/login");
            }}
            className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
            title="خروج از حساب کاربری ادمین"
          >
            <span>🚪</span>
            <span>خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
}
