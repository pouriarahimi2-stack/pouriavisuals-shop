// File Path: app/about/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AboutPage() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  const fetchAboutData = async () => {
    const data = await siteInfoService.getSiteInfo();
    if (data) setSiteInfo(data);
  };

  useEffect(() => {
    fetchAboutData();

    const channel = supabase
      .channel("about-page-realtime-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => fetchAboutData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const storeName = siteInfo?.storeName || siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const aboutText =
    siteInfo?.aboutText ||
    siteInfo?.description ||
    siteInfo?.footer_text ||
    `مجموعه ${storeName} مرجع تخصصی تامین، کالیبراسیون و مشاوره تجهیزات پیشرفته تصویر، مانیتورهای تدوین رنگ ۵K و ۴K، کارت‌های کپچر و ابزارهای حرفه‌ای استودیو در ایران است.\n\nتعهد ما ارائه کالاهای ۱۰۰٪ اورجینال با گارانتی اصالت طلایی، تضمین بهترین قیمت بازار و ارسال سریع پیشتاز به سراسر کشور با بسته‌بندی ضدضربه استودیویی است.`;

  return (
    <div className="min-h-[70vh] max-w-4xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-8 md:p-12 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <span className="p-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xl shadow-md">🏢</span>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)]">درباره {storeName}</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-bold">استانداردهای مهندسی، گارانتی اصالت طلایی و تعهدات ما</p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-loose text-[var(--text-secondary)] font-medium whitespace-pre-line text-justify">
          {aboutText}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--card-border)]">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1 text-center">
            <span className="text-2xl block">🛡️</span>
            <strong className="text-xs font-black text-[var(--text-primary)] block">گارانتی اصالت طلایی</strong>
            <p className="text-[11px] text-[var(--text-secondary)]">تضمین ۱۰۰٪ اصالت فیزیکی</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1 text-center">
            <span className="text-2xl block">🚀</span>
            <strong className="text-xs font-black text-[var(--text-primary)] block">ارسال سریع پیشتاز</strong>
            <p className="text-[11px] text-[var(--text-secondary)]">بسته‌بندی ضدضربه استودیو</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1 text-center">
            <span className="text-2xl block">🎨</span>
            <strong className="text-xs font-black text-[var(--text-primary)] block">کالیبراسیون دقیق</strong>
            <p className="text-[11px] text-[var(--text-secondary)]">تست سلامت گاموت رنگی</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md"
          >
            ← بازگشت به صفحه نخست
          </Link>
        </div>
      </div>
    </div>
  );
}