"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService } from "@/services/siteInfoService";

export default function MaintenancePage() {
  const [siteInfo, setSiteInfo] = useState<any>(null);

  useEffect(() => {
    siteInfoService.getSiteInfo().then(setSiteInfo);
  }, []);

  const storeName = siteInfo?.storeName || siteInfo?.site_name || "آکسون کور";
  const message = siteInfo?.header_announcement || "سایت در حال ارتقای فنی و به‌روزرسانی سرورها است. به زودی با امکاناتی نو بازمی‌گردیم.";
  const phone = siteInfo?.phone || "09376110200";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans select-none dir-rtl relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-[2.5rem] p-8 sm:p-12 text-center space-y-6 shadow-2xl backdrop-blur-2xl">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-3xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
          ⚙️
        </div>

        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black border border-amber-500/20">
            حالت ارتقا و بهینه‌سازی فنی
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white">{storeName}</h1>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
          {message}
        </p>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 flex justify-between items-center font-mono">
          <span>تماس ضروری و هماهنگی سفارشات:</span>
          <a href={`tel:${phone}`} className="font-bold text-blue-400">{phone}</a>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-center">
          <Link href="/admin/login" className="text-[10px] text-slate-500 hover:text-slate-400 transition">
            ورود به پنل مدیریت
          </Link>
        </div>
      </div>
    </div>
  );
}
