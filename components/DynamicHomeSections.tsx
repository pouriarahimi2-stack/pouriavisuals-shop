"use client";
import MobileSlider from "@/components/MobileSlider";
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
  mobileHeight: 220,
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
              <MobileSlider
                slides={effectiveSlides}
                config={{ height: 224, autoPlay: true, interval: 4200, showDots: true }}
              />
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
