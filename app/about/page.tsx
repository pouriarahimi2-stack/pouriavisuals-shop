// File Path: app/about/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Headphones,
  Award,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShoppingBag,
} from "lucide-react";

export default function AboutPage() {
  const [siteInfo, setSiteInfo] = useState<Record<string, any>>({});
  const [catalogStats, setCatalogStats] = useState<{
    productsCount: number;
    categoriesCount: number;
  }>({ productsCount: 0, categoriesCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/site-info?t=" + Date.now(), { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({})),
      fetch("/api/products?t=" + Date.now(), { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({})),
    ])
      .then(([siteJson, prodJson]) => {
        const info = siteJson?.data || siteJson?.siteInfo || siteJson || {};
        setSiteInfo(info);

        const prods = Array.isArray(prodJson?.data)
          ? prodJson.data
          : Array.isArray(prodJson?.products)
          ? prodJson.products
          : [];
        const cats = new Set(
          prods
            .map((p: any) => String(p.category || "").trim())
            .filter(Boolean)
        );
        setCatalogStats({
          productsCount: prods.length,
          categoriesCount: cats.size,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const sys =
    siteInfo?.settings ||
    siteInfo?.system_settings ||
    siteInfo?.homepage_layout_config?.system_settings ||
    {};

  const siteName =
    sys.site_name ||
    siteInfo?.site_name ||
    siteInfo?.storeName ||
    "آکسون کور | Axon Core";

  const tagline =
    sys.tagline ||
    siteInfo?.tagline ||
    "مرجع تخصصی تجهیزات تکنولوژی، گجت‌های هوشمند و کالای دیجیتال";

  // پاکسازی خودکار متون منسوخ قدیمی در صورت باقی ماندن در دیتابیس
  const rawDescription = String(
    sys.description || siteInfo?.description || ""
  ).trim();
  const isLegacyText =
    rawDescription.includes("کالرگریدینگ") ||
    rawDescription.includes("تجهیزات بصری") ||
    rawDescription.includes("مانیتورهای تدوین") ||
    rawDescription.includes("استودیو");

  const cleanAboutDescription =
    rawDescription && !isLegacyText
      ? rawDescription
      : `${siteName} به عنوان مرجع تخصصی عرضه تجهیزات تکنولوژی، لوازم جانبی اورجینال و گجت‌های هوشمند در ایران، با تمرکز بر تضمین ۱۰۰٪ اصالت فیزیکی کالا، شفافیت قیمت و ارسال سریع به سراسر کشور فعالیت می‌کند.`;

  const phone = sys.phone || siteInfo?.phone || "";
  const mobileSupport = sys.mobile_support || siteInfo?.mobile_support || "";
  const email = sys.email || siteInfo?.email || "";
  const address = sys.address || siteInfo?.address || "";
  const workingHours = sys.working_hours || siteInfo?.working_hours || "";
  const logoUrl = sys.logo_url || siteInfo?.logo_url || "";

  const pillars = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      title: "ضمانت اصالت و سلامت فیزیکی",
      desc: "تمامی کالاها پیش از ارسال توسط واحد کنترل کیفیت بررسی شده و با ضمانت اصالت عرضه می‌شوند.",
    },
    {
      icon: <Truck className="w-6 h-6 text-[var(--accent-blue)]" />,
      title: "ارسال سریع به سراسر کشور",
      desc: "پردازش فوری سفارش‌ها و ارسال مطمئن از طریق پست پیشتاز و تیپاکس با کد رهگیری لحظه‌ای.",
    },
    {
      icon: <Headphones className="w-6 h-6 text-indigo-400" />,
      title: "مشاوره تخصصی پیش از خرید",
      desc: "همراهی کارشناسان فنی از طریق گفتگوی زنده آنلاین و تماس تلفنی برای انتخاب دقیق‌ترین محصول.",
    },
    {
      icon: <Award className="w-6 h-6 text-amber-400" />,
      title: "پرداخت امن و شفافیت فاکتور",
      desc: "تسویه‌حساب از طریق درگاه‌های بانکی معتبر با صدور فاکتور رسمی و جزئیات کامل.",
    },
  ];

  return (
    <main
      className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 font-sans select-text text-[var(--text-primary)] pb-28 md:pb-14"
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* مسیر صفحه */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-bold">
          <Link href="/" className="hover:underline">
            خانه
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)]">درباره {siteName}</span>
        </div>

        {/* کارت معرفی اصلی برند */}
        <section className="p-6 sm:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-center space-y-5">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={siteName}
              className="w-20 h-20 mx-auto object-contain rounded-2xl p-2 bg-[var(--input-bg)] border border-[var(--card-border)]"
            />
          )}

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-xs font-black inline-block">
              {tagline}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              درباره {siteName}
            </h1>
          </div>

          <p className="text-xs sm:text-base text-[var(--text-secondary)] max-w-3xl mx-auto leading-loose font-medium">
            {cleanAboutDescription}
          </p>

          {/* شاخص‌های واقعی فروشگاه */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <div className="text-xl sm:text-2xl font-black font-mono text-[var(--accent-blue)]">
                {loading
                  ? "..."
                  : catalogStats.productsCount.toLocaleString("fa-IR")}
              </div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] mt-1">
                کالای فعال در کاتالوگ
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <div className="text-xl sm:text-2xl font-black font-mono text-indigo-400">
                {loading
                  ? "..."
                  : catalogStats.categoriesCount.toLocaleString("fa-IR")}
              </div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] mt-1">
                دسته‌بندی تخصصی
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-500">
                ۱۰۰٪
              </div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] mt-1">
                تضمین اصالت کالا
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                سراسری
              </div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] mt-1">
                ارسال پست و تیپاکس
              </div>
            </div>
          </div>
        </section>

        {/* ارزش‌ها و تعهدات فروشگاه */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pillars.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="space-y-1.5">
                <h2 className="font-black text-sm text-[var(--text-primary)]">
                  {item.title}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* اطلاعات تماس و راه‌های ارتباطی مستقیم */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 text-xs">
            <h2 className="text-base sm:text-lg font-black text-[var(--accent-blue)]">
              اطلاعات تماس و پشتیبانی {siteName}
            </h2>
            <div className="space-y-2 text-[var(--text-secondary)] font-bold">
              {(phone || mobileSupport) && (
                <div className="flex items-center gap-2">
                  <Phone size={15} className="text-[var(--accent-blue)]" />
                  <span>تلفن پشتیبانی:</span>
                  <a
                    href={`tel:${phone || mobileSupport}`}
                    dir="ltr"
                    className="font-mono font-black text-[var(--text-primary)] hover:underline"
                  >
                    {phone || mobileSupport}
                  </a>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-2">
                  <Mail size={15} className="text-purple-400" />
                  <span>ایمیل رسمی:</span>
                  <a
                    href={`mailto:${email}`}
                    dir="ltr"
                    className="font-mono text-[var(--text-primary)] hover:underline"
                  >
                    {email}
                  </a>
                </div>
              )}
              {address && (
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-rose-400" />
                  <span>نشانی: {address}</span>
                </div>
              )}
              {workingHours && (
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-emerald-500" />
                  <span>ساعات پاسخگویی: {workingHours}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Link
              href="/products"
              className="flex-1 md:flex-initial px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              <span>مشاهده کاتالوگ کالاها</span>
            </Link>
            <Link
              href="/contact"
              className="flex-1 md:flex-initial px-5 py-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition text-center"
            >
              تماس با پشتیبانی
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}