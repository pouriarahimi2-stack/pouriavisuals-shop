// File Path: components/DynamicHomeSections.tsx
"use client";

import React, { useState, useEffect } from "react";
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

export default function DynamicHomeSections({
  initialProducts = [],
  initialBanners = [],
}: Props) {
  const { siteInfo } = useSiteInfo();
  const layoutCfg = siteInfo?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;

  const [products, setProducts] = useState<any[]>(initialProducts);
  const [banners, setBanners] = useState<any[]>(initialBanners);
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchLiveHomeData = async () => {
    try {
      const [pRes, bRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }).catch(() => null),
        fetch("/api/public/banners", { cache: "no-store" }).catch(() => null),
      ]);
      if (pRes && pRes.ok) {
        const pJson = await pRes.json();
        const pList = pJson.data || pJson.products || [];
        if (Array.isArray(pList)) setProducts(pList);
      }
      if (bRes && bRes.ok) {
        const bJson = await bRes.json();
        const bList = (bJson.banners || bJson.data || []).filter(
          (b: any) => b.is_active !== false
        );
        setBanners(bList);
      }
    } catch {}
  };

  useEffect(() => {
    fetchLiveHomeData();

    const chProds = supabase
      .channel("realtime-home-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchLiveHomeData();
      })
      .subscribe();

    const chBanners = supabase
      .channel("realtime-home-banners")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        fetchLiveHomeData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chProds);
      supabase.removeChannel(chBanners);
    };
  }, []);

  // ساخت اسلایدهای بنر: اگر بنر در جدول banners ثبت شده باشد از آن‌ها استفاده می‌شود،
  // و اگر هنوز بنری ثبت نشده باشد، به صورت خودکار از محصولات کاتالوگ بنرهای کلیک‌پذیر می‌سازد.
  const effectiveSlides =
    banners.length > 0
      ? banners.map((b: any) => ({
          id: String(b.id),
          title: b.title || "پیشنهاد ویژه آکسون",
          subtitle: b.subtitle || "مشاهده مشخصات و خرید آنلاین با گارانتی اصالت",
          image: b.image_url || b.image || "/placeholder.png",
          link: b.link_url || b.link || "/products",
          price: b.price ? Number(b.price) : null,
          badge: b.badge || "پیشنهاد ویژه",
        }))
      : products.slice(0, 5).map((p: any) => ({
          id: String(p.id),
          title: p.title || p.name || "محصول ویژه",
          subtitle:
            p.short_description ||
            (p.description
              ? String(p.description).replace(/<!--MEDIA_METADATA:[\s\S]*?-->/g, "").slice(0, 110)
              : "خرید مستقیم با گارانتی اصالت و ارسال سریع"),
          image:
            p.image ||
            p.image_url ||
            (Array.isArray(p.images) && p.images[0]) ||
            "/placeholder.png",
          link: "/products/" + p.id,
          price: Number(p.discount_price || p.discountPrice || p.price || 0),
          badge: p.category || "ویژه کاتالوگ",
        }));

  useEffect(() => {
    if (effectiveSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % effectiveSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [effectiveSlides.length]);

  const showcaseCfg = layoutCfg.showcase3D || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.showcase3D;

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 font-sans select-none"
      dir="rtl"
    >
      {/* ۱. جایگزینی باکس متنی هیرو با اسلایدر بنرهای کلیک‌پذیر متصل به صفحه محصول (طبق عکس سوم) */}
      {effectiveSlides.length > 0 && (
        <section className="relative w-full rounded-[2.2rem] sm:rounded-[2.5rem] overflow-hidden border border-[var(--card-border)] shadow-2xl bg-[var(--modal-bg)] min-h-[280px] sm:min-h-[380px] md:min-h-[430px] flex items-center">
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
                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 p-6 sm:p-10 md:p-12">
                  <div className="md:col-span-7 space-y-4 text-right order-2 md:order-1">
                    <span className="inline-block px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] text-xs font-black">
                      🔥 {slide.badge}
                    </span>

                    <h1 className="text-xl sm:text-3xl md:text-4xl font-black leading-snug text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition">
                      {slide.title}
                    </h1>

                    {slide.subtitle && (
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2 font-medium max-w-xl">
                        {slide.subtitle}
                      </p>
                    )}

                    <div className="pt-2 flex flex-wrap items-center gap-4">
                      <span className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs sm:text-sm shadow-xl hover:opacity-90 transition inline-flex items-center gap-2">
                        <span>مشاهده و خرید محصول</span>
                        <span>←</span>
                      </span>

                      {slide.price ? (
                        <span className="font-mono font-black text-base sm:text-lg text-emerald-500">
                          {formatPrice(slide.price)} تومان
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="md:col-span-5 flex items-center justify-center order-1 md:order-2">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] p-4 flex items-center justify-center overflow-hidden shadow-inner">
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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
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
                    "h-2 rounded-full transition-all cursor-pointer " +
                    (idx === activeSlide ? "w-6 bg-[var(--accent-blue)]" : "w-2 bg-white/50")
                  }
                  aria-label={"اسلاید " + (idx + 1)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ۲. نمایشگاه تعاملی سه‌بعدی: فقط در موبایل نمایش داده شود و در دسکتاپ مخفی باشد (طبق عکس چهارم) */}
      {showcaseCfg?.show !== false && products.length > 0 && (
        <div className="block md:hidden">
          <ProductPerspectiveSlider
            products={products}
            customTitle={showcaseCfg.title}
            customSubtitle={showcaseCfg.subtitle}
          />
        </div>
      )}

      {/* ۳. گرید کاتالوگ تجهیزات و محصولات: فقط در دسکتاپ و تبلت نمایش داده شود و در موبایل مخفی باشد (برعکس مورد بالا) */}
      {layoutCfg.productsSection?.show !== false && (
        <div className="hidden md:block">
          <ProductList initialProducts={products} />
        </div>
      )}
    </div>
  );
}
