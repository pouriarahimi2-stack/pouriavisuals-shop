"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function AboutPage() {
  const [info, setInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    setInfo(siteInfoService.getSiteInfo());
  }, []);

  if (!info) return null;

  return (
    <main className="min-h-screen pb-16">
      <Header />

      <div className="max-w-3xl mx-auto px-4 mt-12 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black">ℹ️ درباره {info.storeName}</h1>
          <p className="text-xs opacity-70">آشنایی بیشتر با اهداف و خدمات مجموعه ما</p>
        </div>

        <div className="liquid-glass-card p-8 space-y-6 text-sm leading-relaxed">
          <p className="whitespace-pre-line opacity-90">{info.aboutText}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--glass-border)] text-center text-xs">
            <div className="p-4 rounded-2xl bg-white/5 border border-[var(--glass-border)] space-y-1">
              <span className="text-2xl block">🚀</span>
              <h4 className="font-bold">ارسال اکسپرس</h4>
              <p className="opacity-60 text-[10px]">تحویل سریع به سراسر کشور</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-[var(--glass-border)] space-y-1">
              <span className="text-2xl block">🛡️</span>
              <h4 className="font-bold">ضمانت اصالت</h4>
              <p className="opacity-60 text-[10px]">۱۰۰٪ کالای اصلی و با کیفیت</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-[var(--glass-border)] space-y-1">
              <span className="text-2xl block">🎧</span>
              <h4 className="font-bold">پشتیبانی ۲۴/۷</h4>
              <p className="opacity-60 text-[10px]">پاسخگویی سریع به مشتریان</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}