"use client";
// File Path: components/DynamicHomeSections.tsx
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import MobileSlider from "@/components/MobileSlider";
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
  mobileHeight: 220,
  tabletHeight: 280,
  desktopHeight: 360,
  mobileImageSize: 100,
  desktopImageSize: 240,
  mobileLayout: "horizontal",
};

export const DEFAULT_SECTIONS_ORDER: ResponsiveSectionItem[] = [
  {
    id: "sec_banners",
    type: "banners_slider",
    title: "اسلایدر بنرهای تبلیغاتی",
    subtitle: "نمایش بنرهای کلیک‌پذیر متصل به محصولات",
    enabled: true,
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true,
  },
  {
    id: "sec_perspective",
    type: "NativePerspectiveSlider",
    title: "نمایشگاه تعاملی سه‌بعدی محصولات",
    subtitle: "پیمایش لمسی جهت بررسی مشخصات و گارانتی",
    enabled: true,
    showOnMobile: false,
    showOnTablet: false,
    showOnDesktop: true,
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
    images: Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : Array.isArray(meta.images) && meta.images.length > 0
      ? meta.images
      : [primaryImg],
    description: rawDesc,
  };
}

export default function DynamicHomeSections({
  initialProducts = [],
  initialBanners  = [],
  initialSiteInfo = null,
}: Props) {
  const { siteInfo: ctxSiteInfo } = useSiteInfo();
  const activeSiteInfo = ctxSiteInfo && Object.keys(ctxSiteInfo).length > 0 ? ctxSiteInfo : initialSiteInfo;
  const layoutCfg = activeSiteInfo?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
  const tbCfg     = activeSiteInfo?.theme_builder_config   || layoutCfg?.theme_builder_config || {};

  const bannerSizing: BannerSizingConfig = { ...DEFAULT_BANNER_SIZING, ...(tbCfg?.bannerSizing || layoutCfg?.bannerSizing || {}) };

  const [products, setProducts] = useState<any[]>(() => (initialProducts || []).map(normalizeProductRow));
  const [banners,  setBanners]  = useState<any[]>(initialBanners);
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchLiveHomeData = useCallback(async () => {
    try {
      const [pRes, bRes] = await Promise.all([
        fetch("/api/products",       { cache: "no-store" }).catch(() => null),
        fetch("/api/public/banners", { cache: "no-store" }).catch(() => null),
      ]);
      if (pRes?.ok) {
        const pJson = await pRes.json();
        const pList = pJson.data || pJson.products || [];
        if (Array.isArray(pList)) setProducts(pList.map(normalizeProductRow));
      }
      if (bRes?.ok) {
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
    const ch = supabase
      .channel("realtime-home-unified")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchLiveHomeData)
      .on("postgres_changes", { event: "*", schema: "public", table: "banners"  }, fetchLiveHomeData)
      .subscribe();
    return () => {
      window.removeEventListener("banners_updated",  fetchLiveHomeData);
      window.removeEventListener("products_updated", fetchLiveHomeData);
      supabase.removeChannel(ch);
    };
  }, [fetchLiveHomeData, initialProducts.length]);

  const effectiveSlides = banners.length > 0
    ? banners.map((b: any) => ({
        id:       String(b.id),
        title:    b.title    || "پیشنهاد ویژه آکسون",
        subtitle: b.subtitle || "مشاهده مشخصات و خرید آنلاین با گارانتی اصالت",
        image:    b.image_url || b.image || "/placeholder.png",
        link:     b.link_url  || b.link  || "/products",
        price:    b.price ? Number(b.price) : null,
        badge:    b.badge_text || b.badge || "پیشنهاد ویژه",
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

  // آتو‌پلی دسکتاپ اسلایدر
  useEffect(() => {
    if (effectiveSlides.length <= 1) return;
    const t = setInterval(() => setActiveSlide(prev => (prev + 1) % effectiveSlides.length), 5000);
    return () => clearInterval(t);
  }, [effectiveSlides.length]);

  const rawSections: ResponsiveSectionItem[] =
    Array.isArray(tbCfg?.homeSections)    && tbCfg.homeSections.length > 0    ? tbCfg.homeSections    :
    Array.isArray(layoutCfg?.homeSections) && layoutCfg.homeSections.length > 0 ? layoutCfg.homeSections :
    DEFAULT_SECTIONS_ORDER;

  const renderSection = (sec: ResponsiveSectionItem) => {
    if (sec.enabled === false) return null;

    // ─── اسلایدر بنر ───────────────────────────────────────
    if (sec.type === "banners_slider") {
      if (effectiveSlides.length === 0) return null;
      return (
        <div key={sec.id}>
          {/* موبایل و تبلت: MobileSlider جدید */}
          <div className="block lg:hidden">
            <MobileSlider
              slides={effectiveSlides}
              config={{ height: bannerSizing.mobileHeight || 220, autoPlay: true, interval: 4500, showDots: true }}
            />
          </div>

          {/* دسکتاپ: اسلایدر کلاسیک با کارت glass */}
          <div className="hidden lg:block">
            <section className="relative w-full rounded-[2.5rem] overflow-hidden border border-[var(--card-border)] shadow-xl bg-[var(--modal-bg)] flex items-center"
              style={{ minHeight: bannerSizing.desktopHeight + "px" }}
            >
              {effectiveSlides.map((slide, idx) => {
                const isActive = idx === activeSlide;
                return (
                  <Link
                    key={slide.id + "_" + idx}
                    href={slide.link}
                    onClick={() => soundEngine.playClick()}
                    className={"w-full h-full transition-all duration-700 " + (isActive ? "opacity-100 relative z-10 block" : "opacity-0 absolute inset-0 z-0 pointer-events-none")}
                  >
                    <div className="flex flex-row items-center justify-between gap-8 p-10">
                      <div className="flex-1 min-w-0 space-y-3 text-right">
                        <span className="inline-block px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] text-xs font-black">
                          🔥 {slide.badge}
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-black leading-snug text-[var(--text-primary)] line-clamp-2">
                          {slide.title}
                        </h2>
                        {slide.subtitle && (
                          <p className="text-sm text-[var(--text-secondary)] line-clamp-2 max-w-xl">{slide.subtitle}</p>
                        )}
                        <div className="pt-2 flex items-center gap-4">
                          <span className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm shadow-md hover:opacity-90 transition inline-flex items-center gap-2">
                            <span>{slide.cta}</span><span>←</span>
                          </span>
                          {slide.price ? (
                            <span className="font-mono font-black text-lg text-emerald-500">{formatPrice(slide.price)} تومان</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center justify-center">
                        <div style={{ width: bannerSizing.desktopImageSize + "px", height: bannerSizing.desktopImageSize + "px" }}
                          className="rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] p-4 flex items-center justify-center overflow-hidden shadow-inner"
                        >
                          <img src={slide.image} alt={slide.title} className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {effectiveSlides.length > 1 && (
                <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                  {effectiveSlides.map((_, idx) => (
                    <button key={idx} type="button"
                      onClick={(e) => { e.preventDefault(); soundEngine.playClick(); setActiveSlide(idx); }}
                      className={"h-2 rounded-full transition-all cursor-pointer " + (idx === activeSlide ? "w-6 bg-[var(--accent-blue)]" : "w-2 bg-white/50")}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      );
    }

    // ─── اسلایدر سه‌بعدی (فقط دسکتاپ) ───────────────────
    if (sec.type === "NativePerspectiveSlider") {
      if (products.length === 0) return null;
      return (
        <div key={sec.id} className="hidden lg:block">
          <ProductPerspectiveSlider products={products} customTitle={sec.title} customSubtitle={sec.subtitle} />
        </div>
      );
    }

    // ─── کاتالوگ محصولات ───────────────────────────────────
    if (sec.type === "NativeProductCatalog") {
      return (
        <div key={sec.id}>
          <ProductList initialProducts={products} customHeading={sec.title} customSubtitle={sec.subtitle} />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-10 pb-32 md:pb-16 font-sans select-text"
      dir="rtl"
    >
      {rawSections.map((sec: any) => renderSection(sec))}
    </div>
  );
}
