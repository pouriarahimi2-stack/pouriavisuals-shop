"use client";
// File Path: components/DynamicHomeSections.tsx

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import { useSiteInfo } from "@/context/SiteInfoContext";
import { DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";
import { formatPrice } from "@/lib/formatters";

interface Props {
  initialProducts?: any[];
  initialBanners?: any[];
  initialSiteInfo?: any;
}

export interface ResponsiveSectionItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
}

export interface BannerSizingConfig {
  mobileHeight: number;
  tabletHeight: number;
  desktopHeight: number;
  mobileImageSize: number;
  desktopImageSize: number;
  mobileLayout: "horizontal" | "vertical";
}

export const DEFAULT_BANNER_SIZING: BannerSizingConfig = {
  mobileHeight: 210,
  tabletHeight: 260,
  desktopHeight: 340,
  mobileImageSize: 120,
  desktopImageSize: 220,
  mobileLayout: "vertical",
};

// اسلایدر بنر فقط موبایل + تبلت — دسکتاپ یک اسلایدر کافیه
export const DEFAULT_SECTIONS_ORDER: ResponsiveSectionItem[] = [
  {
    id: "sec_banners",
    type: "banners_slider",
    title: "اسلایدر بنرهای تبلیغاتی و محصولات ویژه",
    subtitle: "نمایش بنرهای کلیک‌پذیر متصل به صفحات محصول",
    enabled: true,
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: false,   // ← دسکتاپ: مخفی (NativePerspectiveSlider جای آن)
  },
  {
    id: "sec_perspective",
    type: "NativePerspectiveSlider",
    title: "نمایشگاه تعاملی سه‌بعدی محصولات پرچمدار",
    subtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی",
    enabled: true,
    showOnMobile: false,
    showOnTablet: false,
    showOnDesktop: true,    // ← دسکتاپ: نمایش
  },
  {
    id: "sec_catalog",
    type: "NativeProductCatalog",
    title: "محصولات ویژه آکسون کور",
    subtitle: "با گارانتی اصالت طلایی و ارسال سریع",
    enabled: true,
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true,
  },
];

function normalizeProductRow(p: any) {
  if (!p || typeof p !== "object") return p;
  let rawDesc = String(p.description || "");
  let meta: Record<string, any> = {};
  const match = rawDesc.match(/<!--MEDIA_METADATA:([\s\S]*?)-->/);
  if (match && match[1]) {
    try { meta = JSON.parse(match[1]); } catch {}
    rawDesc = rawDesc.replace(/<!--MEDIA_METADATA:[\s\S]*?-->/g, "").trim();
  }
  const primaryImg =
    p.image || p.image_url ||
    (Array.isArray(p.images) && p.images[0]) ||
    (Array.isArray(meta.images) && meta.images[0]) ||
    "/placeholder.png";
  return {
    ...p,
    id: String(p.id),
    title: p.title || p.name || "کالای دیجیتال",
    image: primaryImg,
    image_url: primaryImg,
    images:
      Array.isArray(p.images) && p.images.length > 0 ? p.images
      : Array.isArray(meta.images) && meta.images.length > 0 ? meta.images
      : [primaryImg],
    description: rawDesc,
  };
}

function getDeviceVisibilityClasses(sec: ResponsiveSectionItem): string {
  // اسلایدر بنر: فقط موبایل + تبلت — دسکتاپ همیشه مخفی
  if (sec.type === "banners_slider")         return "block md:block lg:hidden";
  if (sec.type === "NativePerspectiveSlider") return "hidden lg:block";
  if (sec.type === "NativeProductCatalog")    return "block";
  const mob  = sec.showOnMobile  !== undefined ? Boolean(sec.showOnMobile)  : true;
  const tab  = sec.showOnTablet  !== undefined ? Boolean(sec.showOnTablet)  : true;
  const desk = sec.showOnDesktop !== undefined ? Boolean(sec.showOnDesktop) : true;
  if (!mob && !tab && !desk) return "hidden";
  return (
    (mob  ? "block"    : "hidden")    + " " +
    (tab  ? "md:block" : "md:hidden") + " " +
    (desk ? "lg:block" : "lg:hidden")
  );
}

export default function DynamicHomeSections({
  initialProducts = [],
  initialBanners  = [],
  initialSiteInfo = null,
}: Props) {
  const { siteInfo: ctxSiteInfo } = useSiteInfo();
  const activeSiteInfo =
    ctxSiteInfo && Object.keys(ctxSiteInfo).length > 0 ? ctxSiteInfo : initialSiteInfo;
  const layoutCfg = activeSiteInfo?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
  const tbCfg     = activeSiteInfo?.theme_builder_config   || layoutCfg?.theme_builder_config || {};

  const bannerSizing: BannerSizingConfig = {
    ...DEFAULT_BANNER_SIZING,
    ...(tbCfg?.bannerSizing || layoutCfg?.bannerSizing || {}),
  };

  const [products,    setProducts]    = useState<any[]>(() => (initialProducts || []).map(normalizeProductRow));
  const [banners,     setBanners]     = useState<any[]>(initialBanners);
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchLiveHomeData = useCallback(async () => {
    try {
      const [pRes, bRes] = await Promise.all([
        fetch("/api/products",       { cache: "no-store" }).catch(() => null),
        fetch("/api/public/banners", { cache: "no-store" }).catch(() => null),
      ]);
      if (pRes && pRes.ok) {
        const pJson = await pRes.json();
        const pList = pJson.data || pJson.products || [];
        if (Array.isArray(pList)) setProducts(pList.map(normalizeProductRow));
      }
      if (bRes && bRes.ok) {
        const bJson = await bRes.json();
        const bList = (bJson.banners || bJson.data || []).filter((b: any) => b.is_active !== false);
        setBanners(bList);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (initialProducts.length === 0) fetchLiveHomeData();
    window.addEventListener("banners_updated",  fetchLiveHomeData);
    window.addEventListener("products_updated", fetchLiveHomeData);
    const chHome = supabase
      .channel("realtime-home-unified-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchLiveHomeData)
      .on("postgres_changes", { event: "*", schema: "public", table: "banners"  }, fetchLiveHomeData)
      .subscribe();
    return () => {
      window.removeEventListener("banners_updated",  fetchLiveHomeData);
      window.removeEventListener("products_updated", fetchLiveHomeData);
      supabase.removeChannel(chHome);
    };
  }, [fetchLiveHomeData, initialProducts.length]);

  const effectiveSlides =
    banners.length > 0
      ? banners.map((b: any) => ({
          id:       String(b.id),
          title:    b.title    || "پیشنهاد ویژه آکسون",
          subtitle: b.subtitle || "مشاهده مشخصات و خرید آنلاین با گارانتی اصالت",
          image:    b.image_url || b.image || "/placeholder.png",
          link:     b.link_url  || b.link  || "/products",
          price:    b.price ? Number(b.price) : null,
          badge:    b.badge_text || b.badge  || "پیشنهاد ویژه",
          cta:      b.cta_text  || "مشاهده و خرید",
        }))
      : products.slice(0, 5).map((p: any) => ({
          id:       String(p.id),
          title:    p.title || p.name || "محصول ویژه",
          subtitle: p.short_description || (p.description ? String(p.description).slice(0, 110) : "خرید مستقیم با گارانتی اصالت"),
          image:    p.image || p.image_url || "/placeholder.png",
          link:     "/products/" + p.id,
          price:    Number(p.discount_price || p.discountPrice || p.price || 0),
          badge:    p.category || "ویژه",
          cta:      "مشاهده و خرید محصول",
        }));

  useEffect(() => {
    if (effectiveSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % effectiveSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [effectiveSlides.length]);

  const rawSections: ResponsiveSectionItem[] =
    Array.isArray(tbCfg?.homeSections)    && tbCfg.homeSections.length    > 0 ? tbCfg.homeSections
    : Array.isArray(layoutCfg?.homeSections) && layoutCfg.homeSections.length > 0 ? layoutCfg.homeSections
    : DEFAULT_SECTIONS_ORDER;

  const isVerticalMobile = bannerSizing.mobileLayout === "vertical";

  const renderSectionByConfig = (sec: ResponsiveSectionItem) => {
    if (sec.enabled === false) return null;
    const visibilityClass = getDeviceVisibilityClasses(sec);
    if (visibilityClass === "hidden") return null;

    // ── اسلایدر بنر (موبایل + تبلت) ──────────────────────────────
    if (sec.type === "banners_slider") {
      if (effectiveSlides.length === 0) return null;
      return (
        <div key={sec.id} className={visibilityClass}>
          <section
            style={{
              "--axon-banner-h-mob": (bannerSizing.mobileHeight  || 300) + "px",
              "--axon-banner-h-tab":   (bannerSizing.tabletHeight  || 260) + "px",
              "--axon-banner-h-desk":  (bannerSizing.desktopHeight || 340) + "px",
              "--axon-banner-img-mob": (bannerSizing.mobileImageSize  || 120) + "px",
              "--axon-banner-img-desk":(bannerSizing.desktopImageSize || 220) + "px",
            } as React.CSSProperties}
            className="axon-hero-banner-box relative w-full rounded-3xl overflow-hidden border border-[var(--card-border)] shadow-xl bg-[var(--modal-bg)]"
          >
            <style>{`
              .axon-hero-banner-box { min-height: var(--axon-banner-h-mob); }
              @media (min-width: 768px) { .axon-hero-banner-box { min-height: var(--axon-banner-h-tab); } }
              @media (min-width: 1024px){ .axon-hero-banner-box { min-height: var(--axon-banner-h-desk);} }
              .axon-hero-banner-img { width: var(--axon-banner-img-mob); height: var(--axon-banner-img-mob); }
              @media (min-width: 768px) { .axon-hero-banner-img { width: var(--axon-banner-img-desk); height: var(--axon-banner-img-desk); } }
            `}</style>

            {effectiveSlides.map((slide, idx) => {
              const isActive = idx === activeSlide;
              return (
                <div
                  key={(slide.id ?? idx) + "_" + idx}
                  className={"absolute inset-0 transition-opacity duration-500 " + (isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}
                >
                  <Link href={slide.link || "#"} onClick={() => soundEngine.playClick()} className="block w-full h-full">
                    <div className="relative w-full h-full flex items-stretch overflow-hidden">
                      {/* ناحیه متن — راست (RTL) */}
                      <div className="relative z-10 flex flex-col justify-center pr-4 pl-3 py-4 gap-2" style={{ width: "58%" }}>
                        {slide.badge ? (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full w-fit border border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                            🔥 {slide.badge}
                          </span>
                        ) : null}
                        <h2 className="text-sm font-black text-[var(--text-primary)] leading-snug line-clamp-2 text-right">
                          {slide.title}
                        </h2>
                        {slide.subtitle ? (
                          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed line-clamp-1">
                            {slide.subtitle}
                          </p>
                        ) : null}
                        {slide.price ? (
                          <p className="text-[11px] font-bold text-emerald-500 text-right">
                            {formatPrice(slide.price)} تومان
                          </p>
                        ) : null}
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-l from-[var(--accent-blue)] to-[var(--accent-violet)] rounded-full px-3 py-1.5 w-fit shadow-md">
                          <span>{slide.cta || "مشاهده"}</span>
                          <span>←</span>
                        </span>
                      </div>
                      {/* ناحیه تصویر — چپ */}
                      <div className="absolute left-0 top-0 bottom-0 overflow-hidden" style={{ width: "46%" }}>
                        <img
                          src={slide.image || ""}
                          alt={slide.title || ""}
                          className="absolute inset-0 w-full h-full object-contain object-center p-2"
                          loading={idx === 0 ? "eager" : "lazy"}
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-[var(--modal-bg)] via-[var(--modal-bg)]/50 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}

            {effectiveSlides.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                {effectiveSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => { e.preventDefault(); soundEngine.playClick(); setActiveSlide(idx); }}
                    className={"h-1.5 rounded-full transition-all cursor-pointer " + (idx === activeSlide ? "w-5 bg-[var(--accent-blue)]" : "w-1.5 bg-white/50")}
                    aria-label={"اسلاید " + (idx + 1)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      );
    }

    // ── اسلایدر پرسپکتیو (فقط دسکتاپ) ────────────────────────────
    if (sec.type === "NativePerspectiveSlider") {
      if (products.length === 0) return null;
      return (
        <div key={sec.id} className={visibilityClass}>
          <ProductPerspectiveSlider products={products} customTitle={sec.title} customSubtitle={sec.subtitle} />
        </div>
      );
    }

    // ── کاتالوگ محصولات ───────────────────────────────────────────
    if (sec.type === "NativeProductCatalog") {
      return (
        <div key={sec.id} className={visibilityClass}>
          <ProductList initialProducts={products} customHeading={sec.title} customSubtitle={sec.subtitle} />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12 pb-40 sm:pb-24 font-sans select-text"
      dir="rtl"
    >
      {rawSections.map((sec: any) => renderSectionByConfig(sec))}
    </div>
  );
}
