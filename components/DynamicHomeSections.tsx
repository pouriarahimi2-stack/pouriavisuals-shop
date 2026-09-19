"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

interface DynamicHomeSectionsProps {
  initialProducts: any[];
  initialBanners: any[];
  initialSiteInfo?: any;
}

export default function DynamicHomeSections({
  initialProducts,
  initialBanners,
  initialSiteInfo,
}: DynamicHomeSectionsProps) {
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [banners, setBanners] = useState<any[]>(initialBanners || []);
  const [siteInfo, setSiteInfo] = useState<any>(initialSiteInfo || null);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  const fetchLiveData = async () => {
    try {
      const [prodRes, bannerRes, siteRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/admin/banners", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/site-info", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);

      if (prodRes?.success && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }
      if (bannerRes?.success && Array.isArray(bannerRes.banners)) {
        setBanners(bannerRes.banners.filter((b: any) => b.is_active));
      }
      if (siteRes?.siteInfo) {
        setSiteInfo(siteRes.siteInfo);
      }
    } catch {}
  };

  useEffect(() => {
    const prodChannel = supabase
      .channel("realtime-home-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchLiveData())
      .subscribe();

    const bannerChannel = supabase
      .channel("realtime-home-banners")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => fetchLiveData())
      .subscribe();

    return () => {
      supabase.removeChannel(prodChannel);
      supabase.removeChannel(bannerChannel);
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const heroTitle = siteInfo?.hero_title || siteInfo?.home_title || "جهان پیشرفته فناوری و گجت‌های نوآورانه";
  const heroSubtitle =
    siteInfo?.hero_subtitle ||
    siteInfo?.home_subtitle ||
    siteInfo?.description ||
    "مرجع تخصصی خرید آنلاین جدیدترین ابزارها، تجهیزات دیجیتال و گجت‌های هوشمند با تضمین اصالت فیزیکی و ارسال سریع پیشتاز.";

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {banners.length > 0 ? (
        <div className="relative w-full rounded-[2.5rem] overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl aspect-[16/8] sm:aspect-[21/9] max-h-[480px]">
          {banners.map((b, idx) => (
            <div
              key={b.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${idx === activeBannerIdx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
            >
              <img src={b.image_url} alt={b.title || "Banner"} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-12 text-white space-y-3">
                <span className="px-3 py-1 rounded-full bg-blue-600/80 text-white text-[11px] font-bold w-fit backdrop-blur-md">
                  ویژه ویترین آکسون کور
                </span>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-black leading-tight max-w-2xl">{b.title}</h2>
                {b.link_url && (
                  <Link
                    href={b.link_url}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-slate-950 font-black text-xs hover:bg-slate-200 transition w-fit shadow-lg"
                  >
                    <span>مشاهده و سفارش کالا</span>
                    <span>←</span>
                  </Link>
                )}
              </div>
            </div>
          ))}

          {banners.length > 1 && (
            <div className="absolute bottom-4 left-6 z-20 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBannerIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === activeBannerIdx ? "w-8 bg-blue-500" : "w-2 bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-[#070b14] to-slate-950 border border-[var(--card-border)] p-8 sm:p-16 text-center space-y-6 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/15 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[var(--accent-blue)] text-xs font-bold">
              <span>⚡</span>
              <span>تامین جدیدترین ابزارها و گجت‌های هوشمند بازار</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              {heroTitle}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
              {heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                href="/products"
                onClick={() => soundEngine.playClick()}
                className="px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition shadow-xl shadow-blue-600/25"
              >
                کاتالوگ تمام محصولات ←
              </Link>
              <Link
                href="/news"
                onClick={() => soundEngine.playClick()}
                className="px-8 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition backdrop-blur-md"
              >
                رادار اخبار تکنولوژی 📡
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg sm:text-2xl font-black text-[var(--text-primary)]">
                جدیدترین محصولات و کالاهای دیجیتال
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              محصولات فعال، آماده ارسال فوری با تضمین ۱۰۰٪ اصالت فیزیکی کالا
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs font-black text-[var(--accent-blue)] hover:underline flex items-center gap-1"
          >
            <span>مشاهده همه محصولات ({products.length})</span>
            <span>←</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="p-16 text-center rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4">
            <span className="text-4xl block">📦</span>
            <p className="text-xs font-bold text-[var(--text-secondary)]">
              در حال حاضر محصولی در ویترین فعال نیست. می‌توانید از پنل مدیریت کالای جدید اضافه کنید.
            </p>
            <Link
              href="/admin/products"
              className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black"
            >
              ورود به بخش کاتالوگ محصولات ادمین
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((prod) => (
              <div key={prod.id} className="max-w-sm mx-auto sm:max-w-none w-full">
                <ProductCard product={prod} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 text-center shadow-md">
          <span className="text-3xl block">🛡️</span>
          <h3 className="text-xs font-black text-[var(--text-primary)]">ضمانت اصالت و سلامت کالا</h3>
          <p className="text-[11px] text-[var(--text-secondary)]">تضمین ۱۰۰٪ فیزیکی و بازگشت وجه تا ۷ روز</p>
        </div>
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 text-center shadow-md">
          <span className="text-3xl block">🚀</span>
          <h3 className="text-xs font-black text-[var(--text-primary)]">ارسال سریع پیشتاز به سراسر کشور</h3>
          <p className="text-[11px] text-[var(--text-secondary)]">بسته‌بندی مقاوم و صدور فوری بارنامه آنلاین</p>
        </div>
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 text-center shadow-md">
          <span className="text-3xl block">💳</span>
          <h3 className="text-xs font-black text-[var(--text-primary)]">پرداخت امن شاپرک</h3>
          <p className="text-[11px] text-[var(--text-secondary)]">اتصال امن به درگاه رسمی و صدور پیش‌فاکتور آنی</p>
        </div>
      </div>
    </div>
  );
}
