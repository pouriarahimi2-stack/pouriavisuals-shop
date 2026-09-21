"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService } from "@/services/siteInfoService";
import { Shield, Truck, HeadphonesIcon, Star, ChevronLeft } from "lucide-react";
import AnimatedLogo from "@/components/AnimatedLogo";

const FEATURES = [
  { icon: <Shield      size={22} />, color: "text-emerald-400 bg-emerald-400/10", title: "تضمین اصالت ۱۰۰٪",    desc: "تمامی کالاها با ضمانت سلامت فیزیکی و اصالت برند عرضه می‌شوند." },
  { icon: <Truck       size={22} />, color: "text-blue-400   bg-blue-400/10",     title: "ارسال سریع سراسری",   desc: "بسته‌بندی ضدضربه و ارسال پیشتاز به تمام نقاط ایران." },
  { icon: <HeadphonesIcon size={22}/>, color: "text-purple-400 bg-purple-400/10", title: "مشاوره تخصصی رایگان", desc: "کارشناسان ما پیش از خرید راهنمایی تخصصی ارائه می‌دهند." },
  { icon: <Star        size={22} />, color: "text-amber-400  bg-amber-400/10",    title: "بهترین قیمت بازار",   desc: "کمترین قیمت ممکن با امکان مقایسه و بازگشت وجه ۷ روزه." },
];

const STATS = [
  { value: "+500",  label: "محصول فعال" },
  { value: "+2000", label: "مشتری راضی" },
  { value: "98٪",   label: "رضایت خریداران" },
  { value: "24h",   label: "پشتیبانی آنلاین" },
];

export default function AboutPage() {
  const [siteInfo, setSiteInfo] = useState<any>(null);

  useEffect(() => {
    const load = () => siteInfoService.getSiteInfo().then((d) => { if (d) setSiteInfo(d); });
    load();
    window.addEventListener("site_info_updated", load);
    return () => window.removeEventListener("site_info_updated", load);
  }, []);

  const storeName  = siteInfo?.storeName || siteInfo?.site_name || "آکسون کور | Axon Core";
  const footerCfg  = siteInfo?.homepage_layout_config?.footer;
  const aboutText  =
    siteInfo?.description || footerCfg?.description ||
    `مجموعه ${storeName} مرجع تخصصی تأمین و عرضه جدیدترین محصولات فناوری، گجت‌های هوشمند و تجهیزات دیجیتال در ایران است.\n\nما با بیش از سال‌ها تجربه در حوزه تجارت الکترونیک، متعهد به ارائه بهترین کالاها با تضمین اصالت، قیمت منصفانه و خدمات پس از فروش قابل‌اعتماد هستیم.`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-32 md:pb-12" dir="rtl">

      {/* Hero بخش */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-8 font-bold">
          <Link href="/" className="hover:underline">خانه</Link>
          <ChevronLeft size={14} />
          <span className="text-[var(--text-primary)]">درباره ما</span>
        </div>

        {/* کارت اصلی معرفی */}
        <div className="p-8 md:p-12 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-8 shadow-2xl">

          {/* هدر */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-[var(--card-border)] pb-6">
            <div className="w-16 h-16 rounded-3xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 flex items-center justify-center shrink-0">
              {siteInfo?.logo_url ? (
                <img src={siteInfo.logo_url} alt={storeName} className="w-12 h-12 object-contain rounded-2xl" />
              ) : (
                <AnimatedLogo size={44} />
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">درباره {storeName}</h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-bold">
                فروشگاه تخصصی عرضه کالاهای فناوری، گجت‌های هوشمند و لوازم دیجیتال
              </p>
            </div>
          </div>

          {/* متن درباره ما */}
          <div className="text-sm leading-loose text-[var(--text-secondary)] font-medium whitespace-pre-line text-justify">
            {aboutText}
          </div>

          {/* آمار */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                <div className="text-2xl font-black text-[var(--accent-blue)] font-mono">{s.value}</div>
                <div className="text-[11px] text-[var(--text-secondary)] font-bold mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ویژگی‌ها */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--card-border)]">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${f.color}`}>
                  {f.icon}
                </div>
                <div>
                  <strong className="text-xs font-black text-[var(--text-primary)] block">{f.title}</strong>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed font-medium">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* دکمه‌های action */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-end">
            <Link href="/contact" className="px-6 py-3 rounded-2xl border border-[var(--card-border)] font-bold text-xs text-center hover:bg-[var(--card-hover)] transition">
              📞 تماس با ما
            </Link>
            <Link href="/products" className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs text-center hover:opacity-90 transition shadow-md">
              🛍️ مشاهده کاتالوگ محصولات
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
