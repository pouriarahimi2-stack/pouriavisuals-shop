// File Path: app/about/page.tsx
"use client";
import React, { useEffect, useState } from "react";

interface StatItem {
  value: string;
  label: string;
}

// پیش‌فرض — فقط زمانی که DB اطلاعاتی نداشت نشان داده می‌شود
const DEFAULT_STATS: StatItem[] = [
  { value: "+500",  label: "محصول فعال" },
  { value: "+2000", label: "مشتری راضی" },
  { value: "98٪",   label: "رضایت خریداران" },
  { value: "24h",   label: "پشتیبانی آنلاین" },
];

export default function AboutPage() {
  const [stats, setStats] = useState<StatItem[]>(DEFAULT_STATS);
  const [siteInfo, setSiteInfo] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/site-info")
      .then((r) => r.json())
      .then((json) => {
        const info = json?.data || json?.siteInfo || json || {};
        setSiteInfo(info);

        // اگر about_stats در DB تعریف شده بود از اون استفاده کن
        const dbStats = info?.about_stats;
        if (Array.isArray(dbStats) && dbStats.length > 0) {
          setStats(
            dbStats.map((s: any) => ({
              value: String(s.value || ""),
              label: String(s.label || ""),
            }))
          );
        } else {
          // fallback: تلاش برای ساختن آمار از فیلدهای جداگانه
          const dynamicStats: StatItem[] = [];
          if (info?.stat_products_count)
            dynamicStats.push({ value: String(info.stat_products_count), label: "محصول فعال" });
          if (info?.stat_customers_count)
            dynamicStats.push({ value: String(info.stat_customers_count), label: "مشتری راضی" });
          if (info?.stat_satisfaction)
            dynamicStats.push({ value: String(info.stat_satisfaction), label: "رضایت خریداران" });
          if (info?.stat_support)
            dynamicStats.push({ value: String(info.stat_support), label: "پشتیبانی آنلاین" });

          if (dynamicStats.length > 0) setStats(dynamicStats);
          // اگر هیچ‌کدام نبود DEFAULT_STATS می‌ماند
        }
      })
      .catch(() => {
        // در صورت خطا DEFAULT_STATS می‌ماند
      })
      .finally(() => setLoading(false));
  }, []);

  const siteName = siteInfo?.site_name || siteInfo?.storeName || "آکسون کور";
  const aboutText =
    siteInfo?.about_text ||
    siteInfo?.description ||
    `${siteName} یک فروشگاه آنلاین تخصصی در حوزه تکنولوژی و گجت‌های دیجیتال است که با هدف ارائه بهترین محصولات اورجینال با ضمانت اصالت طلایی فعالیت می‌کند.`;

  return (
    <main className="min-h-screen py-12 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* عنوان */}
        <h1 className="text-3xl font-bold text-center mb-8">درباره {siteName}</h1>

        {/* متن درباره ما */}
        <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
          {aboutText}
        </p>

        {/* آمار — از DB یا پیش‌فرض */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {(loading ? DEFAULT_STATS : stats).map((stat, i) => (
            <div
              key={i}
              className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* اطلاعات تماس از DB */}
        {(siteInfo?.phone || siteInfo?.email || siteInfo?.address) && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-4">اطلاعات تماس</h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              {siteInfo.phone && (
                <p>
                  📞{" "}
                  <a href={`tel:${siteInfo.phone}`} className="hover:text-blue-600">
                    {siteInfo.phone}
                  </a>
                </p>
              )}
              {siteInfo.email && (
                <p>
                  ✉️{" "}
                  <a href={`mailto:${siteInfo.email}`} className="hover:text-blue-600">
                    {siteInfo.email}
                  </a>
                </p>
              )}
              {siteInfo.address && <p>📍 {siteInfo.address}</p>}
              {siteInfo.working_hours && <p>🕐 {siteInfo.working_hours}</p>}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
