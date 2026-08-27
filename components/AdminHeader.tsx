// File Path: components/AdminHeader.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

export default function AdminHeader() {
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
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}

    const channel = supabase
      .channel("admin-header-realtime-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => fetchHeaderInfo())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleDarkMode = () => {
    soundEngine.playClick();
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
      localStorage.setItem("theme", "dark");
    }
  };

  const storeName = siteInfo?.site_name || siteInfo?.siteName || siteInfo?.storeName || "آکسون | Axon";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[var(--modal-bg)]/90 border-b border-[var(--card-border)] text-[var(--text-primary)] transition-colors select-none font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
            ) : (
              <span className="text-xl text-[var(--accent-blue)] font-black">⚡</span>
            )}
          </div>
          <div>
            <span className="font-black text-sm text-[var(--text-primary)] block">
              {storeName} <span className="text-[10px] text-[var(--accent-blue)] font-bold">(پنل مدیریت)</span>
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-medium block">
              کنترل‌پنل یکپارچه فروشگاهی و هوش مصنوعی
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
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
            className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] transition cursor-pointer text-xs font-bold shadow-sm"
            title="تغییر تم"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>
        </div>
      </div>
    </header>
  );
}