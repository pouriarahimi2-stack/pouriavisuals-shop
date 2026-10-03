// File Path: components/DynamicHomeSections.tsx
"use client";

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
  mobileHeight: 165,
  tabletHeight: 250,
  desktopHeight: 350,
  mobileImageSize: 96,
  desktopImageSize: 230,
  mobileLayout: "horizontal",
};

export const DEFAULT_SECTIONS_ORDER: ResponsiveSectionItem[] = [
  {
    id: "sec_banners",
    type: "banners_slider",
    title: "اسلایدر بنرهای تبلیغاتی و محصولات ویژه",
    subtitle: "نمایش بنرهای کلیک‌پذیر متصل به صفحات محصول",
    enabled: true,
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true,
  },
  {
    id: "sec_perspective",
    type: "NativePerspectiveSlider",
    title: "نمایشگاه تعاملی سه‌بعدی محصولات پرچمدار",
    subtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی",
    enabled: true,
    showOnMobile: true,
    showOnTablet: false,
    showOnDesktop: false,
  },
  {
    id: "sec_catalog",
    type: "NativeProductCatalog",
    title: "کاتالوگ تجهیزات تخصصی و کالای دیجیتال",
    subtitle: "تمامی کالاها با گارانتی اصالت طلایی عرضه می‌شوند",
    enabled: true,
    showOnMobile: false,
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
    try {
      meta = JSON.parse(match[1]);
    } catch {}
    rawDesc = rawDesc.replace(/<!--MEDIA_METADATA:[\s\S]*?-->/g, "").trim();
  }
  const primaryImg =
    p.image ||
    p.image_url ||
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
      Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : Array.isArray(meta.images) && meta.images.length > 0
        ? meta.images
        : [primaryImg],
    description: rawDesc,
  };
}

function getDeviceVisibilityClasses(sec: ResponsiveSectionItem): string {
  // مقادیر پیش‌فرض استاندارد در صورتی که هنوز در دیتابیس ذخیره نشده باشند:
  // اسلایدر سه‌بعدی فقط در موبایل | کاتالوگ گرید فقط در تبلت و دسکتاپ | بنر در همه
  const defaultMob = sec.type === "NativeProductCatalog" ? false : true;
  const defaultTab = sec.type === "NativePerspectiveSlider" ? false : true;
  const defaultDesk = sec.type === "NativePerspectiveSlider" ? false : true;

  const mob = sec.showOnMobile !== undefined ? Boolean(sec.showOnMobile) : defaultMob;
  const tab = sec.showOnTablet !== undefined ? Boolean(sec.showOnTablet) : defaultTab;
  const desk = sec.showOnDesktop !== undefined ? Boolean(sec.showOnDesktop) : defaultDesk;

  if (!mob && !tab && !desk) return "hidden";

  const mCls = mob ? "block" : "hidden";
  const tCls = tab ? "md:block" : "md:hidden";
  const dCls = desk ? "lg:block" : "lg:hidden";

  return mCls + " " + tCls + " " + dCls;
}

export default function DynamicHomeSections({
  initialProducts = [],
  initialBanners = [],
  initialSiteInfo = null,
}: Props) {
  const { siteInfo: ctxSiteInfo, refresh } = useSiteInfo();
  const activeSiteInfo =
    ctxSiteInfo && Object.keys(ctxSiteInfo).length > 0 ? ctxSiteInfo : initialSiteInfo;
  const layoutCfg = activeSiteInfo?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
  const tbCfg =
    activeSiteInfo?.theme_builder_config || layoutCfg?.theme_builder_config || {};

  const bannerSizing: BannerSizingConfig = {
    ...DEFAULT_BANNER_SIZING,
    ...(tbCfg?.bannerSizing || layoutCfg?.bannerSizing || {}),
  };

  const [products, setProducts] = useState<any[]>(() =>
    (initialProducts || []).map(normalizeProductRow)
  );
  const [banners, setBanners] = useState<any[]>(initialBanners);
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchLiveHomeData = useCallback(async () => {
    try {
      const [pRes, bRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }).catch(() => null),
        fetch("/api/public/banners", { cache: "no-store" }).catch(() => null),
      ]);
      if (pRes && pRes.ok) {
        const pJson = await pRes.json();
        const pList = pJson.data || pJson.products || [];
        if (Array.isArray(pList)) setProducts(pList.map(normalizeProductRow));
      }
      if (bRes && bRes.ok) {
        const bJson = await bRes.json();
        const bList = (bJson.banners || bJson.data || []).filter(
          (b: any) => b.is_active !== false
        );
        setBanners(bList);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (initialProducts.length === 0) {
      fetchLiveHomeData();
    }

    const handleStudioChange = () => {
      fetchLiveHomeData();
      if (typeof refresh === "function") refresh();
    };

    window.addEventListener("theme_builder_updated", handleStudioChange);
    window.addEventListener("banners_updated", fetchLiveHomeData);
    window.addEventListener("products_updated", fetchLiveHomeData);

    const chHome = supabase
      .channel("realtime-home-unified-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchLiveHomeData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        fetchLiveHomeData();
      })
      .subscribe();

    return () => {
      window.removeEventListener("theme_builder_updated", handleStudioChange);
      window.removeEventListener("banners_updated", fetchLiveHomeData);
      window.removeEventListener("products_updated", fetchLiveHomeData);
      supabase.removeChannel(chHome);
    };
  }, [fetchLiveHomeData, initialProducts.length, refresh]);

  const effectiveSlides =
    banners.length > 0
      ? banners.map((b: any) => ({
          id: String(b.id),
          title: b.title || "پیشنهاد ویژه آکسون",
          subtitle: b.subtitle || "مشاهده مشخصات و خرید آنلاین با گارانتی اصالت",
          image: b.image_url || b.image || "/placeholder.png",
          link: b.link_url || b.link || "/products",
          price: b.price ? Number(b.price) : null,
          badge: b.badge_text || b.badge || "پیشنهاد ویژه",
          cta: b.cta_text || "مشاهده و خرید",
        }))
      : products.slice(0, 5).map((p: any) => ({
          id: String(p.id),
          title: p.title || p.name || "محصول ویژه",
          subtitle:
            p.short_description ||
            (p.description ? String(p.description).slice(0, 110) : "خرید مستقیم با گارانتی اصالت"),
          image: p.image || p.image_url || "/placeholder.png",
          link: "/products/" + p.id,
          price: Number(p.discount_price || p.discountPrice || p.price || 0),
          badge: p.category || "ویژه",
          cta: "مشاهده و خرید محصول",
        }));

  useEffect(() => {
    if (effectiveSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % effectiveSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [effectiveSlides.length]);

  const rawSections: ResponsiveSectionItem[] =
    Array.isArray(tbCfg?.homeSections) && tbCfg.homeSections.length > 0
      ? tbCfg.homeSections
      : Array.isArray(layoutCfg?.homeSections) && layoutCfg.homeSections.length > 0
      ? layoutCfg.homeSections
      : DEFAULT_SECTIONS_ORDER;

  const isHorizontalMobile = bannerSizing.mobileLayout !== "vertical";

  const renderSectionByConfig = (sec: ResponsiveSectionItem) => {
    if (sec.enabled === false) return null;
    const visibilityClass = getDeviceVisibilityClasses(sec);
    if (visibilityClass === "hidden") return null;

    if (sec.type === "banners_slider") {
      if (effectiveSlides.length === 0) return null;
      return (
        <div key={sec.id} className={visibilityClass}>
          <section
            style={
              {
                "--axon-banner-h-mob": (bannerSizing.mobileHeight || 165) + "px",
                "--axon-banner-h-tab": (bannerSizing.tabletHeight || 250) + "px",
                "--axon-banner-h-desk": (bannerSizing.desktopHeight || 350) + "px",
                "--axon-banner-img-mob": (bannerSizing.mobileImageSize || 96) + "px",
                "--axon-banner-img-desk": (bannerSizing.desktopImageSize || 230) + "px",
              } as React.CSSProperties
            }
            className="axon-hero-banner-box relative w-full rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-[var(--card-border)] shadow-xl bg-[var(--modal-bg)] flex items-center"
          >
            <style>{
              ".axon-hero-banner-box { min-height: var(--axon-banner-h-mob); } " +
              "@media (min-width: 768px) { .axon-hero-banner-box { min-height: var(--axon-banner-h-tab); } } " +
              "@media (min-width: 1024px) { .axon-hero-banner-box { min-height: var(--axon-banner-h-desk); } } " +
              ".axon-hero-banner-img { width: var(--axon-banner-img-mob); height: var(--axon-banner-img-mob); } " +
              "@media (min-width: 768px) { .axon-hero-banner-img { width: var(--axon-banner-img-desk); height: var(--axon-banner-img-desk); } }"
            }</style>

            {effectiveSlides.map((slide, idx) => {
              const isActive = idx === activeSlide;
              return (
                <Link
                  key={slide.id + "_" + idx}
                  href={slide.link}
                  onClick={() => soundEngine.playClick()}
                  className={
                    "w-full h-full transition-all duration-700 " +
                    (isActive
                      ? "opacity-100 relative z-10 block"
                      : "opacity-0 absolute inset-0 z-0 pointer-events-none")
                  }
                >
                  <div
                    className={
                      isHorizontalMobile
                        ? "flex flex-row items-center justify-between gap-3 sm:gap-6 p-3.5 sm:p-8 md:p-10"
                        : "flex flex-col-reverse md:flex-row items-center justify-between gap-4 sm:gap-6 p-4 sm:p-8 md:p-10"
                    }
                  >
                    {/* ستون متن و دکمه */}
                    <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-3.5 text-right">
                      <span className="inline-block px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] text-[10px] sm:text-xs font-black">
                        🔥 {slide.badge}
                      </span>

                      <h2 className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-black leading-snug text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition line-clamp-1 sm:line-clamp-2">
                        {slide.title}
                      </h2>

                      {slide.subtitle && (
                        <p className="text-[11px] sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-1 sm:line-clamp-2 font-medium max-w-xl">
                          {slide.subtitle}
                        </p>
                      )}

                      <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className="px-3.5 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-[var(--accent-blue)] text-white font-black text-[10px] sm:text-xs md:text-sm shadow-md hover:opacity-90 transition inline-flex items-center gap-1.5">
                          <span>{slide.cta}</span>
                          <span>←</span>
                        </span>

                        {slide.price ? (
                          <span className="font-mono font-black text-xs sm:text-base md:text-lg text-emerald-500">
                            {formatPrice(slide.price)} تومان
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* ستون تصویر محصول / بنر */}
                    <div className="shrink-0 flex items-center justify-center">
                      <div className="axon-hero-banner-img rounded-2xl sm:rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] p-2 sm:p-4 flex items-center justify-center overflow-hidden shadow-inner">
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {effectiveSlides.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                {effectiveSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      soundEngine.playClick();
                      setActiveSlide(idx);
                    }}
                    className={
                      "h-1.5 sm:h-2 rounded-full transition-all cursor-pointer " +
                      (idx === activeSlide
                        ? "w-5 sm:w-6 bg-[var(--accent-blue)]"
                        : "w-1.5 sm:w-2 bg-white/50")
                    }
                    aria-label={"اسلاید " + (idx + 1)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      );
    }

    if (sec.type === "NativePerspectiveSlider") {
      if (products.length === 0) return null;
      return (
        <div key={sec.id} className={visibilityClass}>
          <ProductPerspectiveSlider
            products={products}
            customTitle={sec.title}
            customSubtitle={sec.subtitle}
          />
        </div>
      );
    }

    if (sec.type === "NativeProductCatalog") {
      return (
        <div key={sec.id} className={visibilityClass}>
          <ProductList
            initialProducts={products}
            customHeading={sec.title}
            customSubtitle={sec.subtitle}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-10 font-sans select-text"
      dir="rtl"
    >
      {rawSections.map((sec: any) => renderSectionByConfig(sec))}
    </div>
  );
}
