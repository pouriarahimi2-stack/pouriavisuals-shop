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

      /* ──────────────────────────────────────────────────────
         اسلایدر موبایل — طراحی کامل جدید
         ارتفاع ثابت 200px موبایل / 260px تبلت / 340px دسکتاپ
      ────────────────────────────────────────────────────── */
      return (
        <div key={sec.id} className={visibilityClass}>
          <div
            className="axon-sl-wrap relative w-full overflow-hidden rounded-3xl shadow-2xl"
            style={{ height: "200px" }}
          >
            <style>{`
              @media (min-width: 640px)  { .axon-sl-wrap { height: 260px !important; } }
              @media (min-width: 1024px) { .axon-sl-wrap { height: 340px !important; } }
            `}</style>
            {/* slides */}
            {effectiveSlides.map((slide, idx) => {
              const isActive = idx === activeSlide;
              const GRADS = [
                "linear-gradient(120deg,#0f0c29,#302b63)",
                "linear-gradient(120deg,#000428,#004e92)",
                "linear-gradient(120deg,#1a1a2e,#0f3460)",
                "linear-gradient(120deg,#200122,#6f0000)",
              ];
              return (
                <div
                  key={idx}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{
                    opacity: isActive ? 1 : 0,
                    zIndex: isActive ? 2 : 1,
                    pointerEvents: isActive ? "auto" : "none",
                    background: GRADS[idx % GRADS.length],
                  }}
                >
                  <Link
                    href={slide.link || "#"}
                    onClick={() => soundEngine.playClick()}
                    className="flex items-center w-full h-full"
                  >
                    {/* تصویر — سمت چپ */}
                    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: "44%", height: "100%" }}>
                      {slide.image ? (
                        <img
                          src={slide.image}
                          alt={slide.title || ""}
                          style={{
                            maxWidth: "90%",
                            maxHeight: "90%",
                            objectFit: "contain",
                            filter: "drop-shadow(0 0 20px rgba(139,92,246,0.6))",
                          }}
                          loading={idx === 0 ? "eager" : "lazy"}
                          draggable={false}
                        />
                      ) : (
                        <div style={{ width: 80, height: 80, borderRadius: 16, background: "rgba(255,255,255,0.07)" }} />
                      )}
                    </div>

                    {/* جداکننده گرادیان */}
                    <div
                      className="absolute"
                      style={{
                        left: "38%",
                        top: 0,
                        bottom: 0,
                        width: 40,
                        background: "linear-gradient(to right, rgba(0,0,0,0.15), transparent)",
                        pointerEvents: "none",
                      }}
                    />

                    {/* متن — سمت راست */}
                    <div
                      className="flex flex-col gap-1.5 px-3 py-4 text-right"
                      style={{ flex: 1, direction: "rtl", overflow: "hidden" }}
                    >
                      {slide.badge ? (
                        <span style={{
                          display: "inline-block",
                          alignSelf: "flex-end",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 10px",
                          borderRadius: 999,
                          background: "rgba(6,182,212,0.2)",
                          border: "1px solid rgba(6,182,212,0.4)",
                          color: "#67e8f9",
                        }}>
                          🔥 {slide.badge}
                        </span>
                      ) : null}

                      <h2 style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: "#fff",
                        lineHeight: 1.4,
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                      }}>
                        {slide.title}
                      </h2>

                      {slide.subtitle ? (
                        <p style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.65)",
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.5,
                        }}>
                          {slide.subtitle}
                        </p>
                      ) : null}

                      {slide.price ? (
                        <p style={{ fontSize: 13, fontWeight: 900, color: "#34d399", margin: 0 }}>
                          {formatPrice(slide.price)} تومان
                        </p>
                      ) : null}

                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        alignSelf: "flex-end",
                        marginTop: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#fff",
                        background: "linear-gradient(135deg,#0066ff,#7c3aed)",
                        borderRadius: 999,
                        padding: "6px 14px",
                        boxShadow: "0 2px 12px rgba(124,58,237,0.4)",
                      }}>
                        {slide.cta || "مشاهده"} ←
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* dots — ثابت در پایین */}
            {effectiveSlides.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(0,0,0,0.35)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 999,
                  padding: "5px 10px",
                }}
              >
                {effectiveSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => { e.preventDefault(); soundEngine.playClick(); setActiveSlide(idx); }}
                    style={{
                      width: idx === activeSlide ? 20 : 6,
                      height: 6,
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      background: idx === activeSlide ? "#0066ff" : "rgba(255,255,255,0.45)",
                      transition: "all 0.3s",
                    }}
                    aria-label={"اسلاید " + (idx + 1)}
                  />
                ))}
              </div>
            )}
          </div>
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
