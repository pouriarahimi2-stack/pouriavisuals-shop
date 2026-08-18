"use client";

import React, { useState, useEffect } from "react";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import Link from "next/link";

export default function AboutPage() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    async function load() {
      const data = await siteInfoService.getAll();
      if (data) setSiteInfo(data);
    }
    load();
  }, []);

  const storeName = siteInfo?.storeName || (siteInfo as any)?.site_name || "فروشگاه تخصصی";
  const aboutText = siteInfo?.aboutText || siteInfo?.description || "فروشگاه تخصصی محصولات حوزه تکنولوژی";

  return (
    <div className="min-h-[70vh] max-w-4xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-8 md:p-12 rounded-[2.5rem] liquid-glass-card border border-[var(--card-border)] space-y-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <span className="p-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xl">🏢</span>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)]">درباره {storeName}</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-bold">آشنایی با تاریخچه، خدمات و تعهدات ما</p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-[var(--text-secondary)] font-medium whitespace-pre-line">
          {aboutText}
        </div>

        <div className="pt-6 border-t border-[var(--card-border)] flex gap-4">
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md"
          >
            بازگشت به صفحه اصلی ←
          </Link>
        </div>
      </div>
    </div>
  );
}