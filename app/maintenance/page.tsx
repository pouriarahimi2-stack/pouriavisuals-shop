// File Path: app/maintenance/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useSiteInfo } from "@/context/SiteInfoContext";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function MaintenancePage() {
  const { siteInfo } = useSiteInfo();
  const sysSettings =
    siteInfo?.homepage_layout_config?.auth_security_config?.system_settings || {};

  const brandName = siteInfo?.site_name || "آکسون کور | Axon Core";
  const message =
    sysSettings.maintenance_message ||
    "فروشگاه آکسون کور در حال بروزرسانی و ارتقای زیرساخت‌های فنی است. به زودی با سرویس‌دهی کامل باز می‌گردیم.";
  const supportPhone = siteInfo?.phone || "09376110200";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none text-center"
      dir="rtl"
    >
      <div className="max-w-lg w-full p-8 sm:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6">
        <div className="flex justify-center">
          <AnimatedLogo size={64} />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black">
            🛠️ در حال بروزرسانی زیرساخت
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--accent-blue)]">
            {brandName}
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
          {message}
        </p>

        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs space-y-1">
          <span className="text-[var(--text-secondary)] block">پشتیبانی و پیگیری سفارشات:</span>
          <a
            href={"tel:" + supportPhone}
            className="font-mono font-black text-sm text-[var(--accent-blue)] block"
          >
            📞 {supportPhone}
          </a>
        </div>

        <div className="pt-2">
          <Link
            href="/admin/dashboard"
            className="text-[11px] text-slate-400 hover:text-[var(--accent-blue)] transition font-bold"
          >
            ورود مدیر سیستم ←
          </Link>
        </div>
      </div>
    </div>
  );
}
