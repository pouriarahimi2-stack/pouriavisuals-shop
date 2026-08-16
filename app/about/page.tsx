"use client";

import React, { useState, useEffect } from "react";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function AboutPage() {
  const [info, setInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    async function loadInfo() {
      try {
        if (typeof siteInfoService.getSiteInfo === "function") {
          const res = siteInfoService.getSiteInfo();
          if (res) setInfo(res);
        } else if (typeof siteInfoService.getAll === "function") {
          const res = await siteInfoService.getAll();
          if (res) setInfo(res);
        }
      } catch {
        if (typeof window !== "undefined") {
          const local = JSON.parse(localStorage.getItem("site_info_cache") || "{}");
          setInfo(local);
        }
      }
    }
    loadInfo();
  }, []);

  const storeName = info?.storeName || (info as any)?.siteTitle || "فروشگاه تخصصی Tech";
  const aboutText =
    info?.aboutText ||
    (info as any)?.aboutUs ||
    "فروشگاه تخصصی ما با هدف ارائه برترین و باکیفیت‌ترین کالاهای حوزه فناوری و تکنولوژی فعالیت خود را آغاز نموده است. ما متعهد به اصالت ۱۰۰٪ کالاها، ارسال سریع و گارانتی معتبر هستیم.";

  return (
    <main className="min-h-[80vh] pb-16 font-sans text-[var(--text-primary)] select-none">
      <div className="max-w-3xl mx-auto px-4 mt-12 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[var(--text-primary)]">
            ℹ️ درباره {storeName}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            آشنایی بیشتر با اهداف و خدمات مجموعه ما
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-6 text-xs sm:text-sm leading-relaxed shadow-xl">
          <p className="whitespace-pre-line text-[var(--text-secondary)] font-medium leading-8 text-justify">
            {aboutText}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[var(--card-border)] text-center text-xs">
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className="text-2xl block">🚀</span>
              <h4 className="font-extrabold text-[var(--text-primary)]">ارسال اکسپرس</h4>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium">تحویل سریع به سراسر کشور</p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className="text-2xl block">🛡️</span>
              <h4 className="font-extrabold text-[var(--text-primary)]">ضمانت اصالت</h4>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium">۱۰۰٪ کالای اصلی و با کیفیت</p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className="text-2xl block">🎧</span>
              <h4 className="font-extrabold text-[var(--text-primary)]">پشتیبانی ۲۴/۷</h4>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium">پاسخگویی سریع به مشتریان</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}