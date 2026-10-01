// File Path: components/DynamicHomeSections.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export interface PublicBanner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url: string;
  cta_text?: string;
  badge_text?: string;
}

export function DynamicHomeSections(_props?: any) {
  const [banners, setBanners] = useState<PublicBanner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bannersEnabled, setBannersEnabled] = useState(true);

  const syncBannersAndTheme = async () => {
    try {
      const [bRes, tRes] = await Promise.all([
        fetch("/api/public/banners", { cache: "no-store" }).catch(() => null),
        fetch("/api/theme-builder", { cache: "no-store" }).catch(() => null),
      ]);

      if (bRes && bRes.ok) {
        const bJson = await bRes.json();
        const list = bJson.banners || bJson.data || [];
        if (Array.isArray(list)) {
          setBanners(list);
        }
      }

      if (tRes && tRes.ok) {
        const tJson = await tRes.json();
        const cfg = tJson.config;
        if (cfg) {
          if (cfg.globalHeader && (cfg.globalHeader.faviconUrl || cfg.globalHeader.logoUrl)) {
            const fav = cfg.globalHeader.faviconUrl || cfg.globalHeader.logoUrl;
            if (typeof document !== "undefined" && fav) {
              const links = document.querySelectorAll("link[rel*='icon']");
              if (links.length > 0) {
                links.forEach((el) => {
                  (el as HTMLLinkElement).href = fav;
                });
              } else {
                const l = document.createElement("link");
                l.rel = "icon";
                l.href = fav;
                document.head.appendChild(l);
              }
            }
          }
          if (Array.isArray(cfg.homeSections)) {
            const bannerSec = cfg.homeSections.find((s: any) => s.type === "banners_slider");
            if (bannerSec && bannerSec.enabled === false) {
              setBannersEnabled(false);
            } else {
              setBannersEnabled(true);
            }
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    syncBannersAndTheme();

    const handleCustomRefresh = () => syncBannersAndTheme();
    window.addEventListener("banners_updated", handleCustomRefresh);
    window.addEventListener("theme_builder_updated", handleCustomRefresh);
    window.addEventListener("site_info_updated", handleCustomRefresh);

    const chBanners = supabase
      .channel("realtime-public-home-banners")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        syncBannersAndTheme();
      })
      .subscribe();

    const chSiteInfo = supabase
      .channel("realtime-public-home-siteinfo")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        syncBannersAndTheme();
      })
      .subscribe();

    return () => {
      window.removeEventListener("banners_updated", handleCustomRefresh);
      window.removeEventListener("theme_builder_updated", handleCustomRefresh);
      window.removeEventListener("site_info_updated", handleCustomRefresh);
      supabase.removeChannel(chBanners);
      supabase.removeChannel(chSiteInfo);
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!bannersEnabled || banners.length === 0) {
    return null;
  }

  const activeBanner = banners[currentSlide] || banners[0];

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 font-sans select-none"
      dir="rtl"
    >
      <div className="relative w-full rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl group">
        <div className="relative w-full h-[230px] sm:h-[320px] md:h-[390px] overflow-hidden">
          <img
            src={activeBanner.image_url}
            alt={activeBanner.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent" />

          <div className="absolute inset-0 p-5 sm:p-8 md:p-12 flex flex-col justify-end items-start space-y-2.5 sm:space-y-3.5 text-white">
            {activeBanner.badge_text && (
              <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)] text-white text-[10px] sm:text-xs font-black shadow-lg">
                {activeBanner.badge_text}
              </span>
            )}
            <h2 className="text-lg sm:text-2xl md:text-4xl font-black leading-tight max-w-2xl drop-shadow">
              {activeBanner.title}
            </h2>
            {activeBanner.subtitle && (
              <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-xl line-clamp-2">
                {activeBanner.subtitle}
              </p>
            )}
            <div className="pt-1">
              <Link
                href={activeBanner.link_url || "/products"}
                onClick={() => soundEngine.playClick()}
                className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-2xl bg-white text-slate-950 hover:bg-sky-400 hover:text-slate-950 font-black text-xs sm:text-sm transition shadow-xl"
              >
                <span>{activeBanner.cta_text || "مشاهده و خرید"}</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-4 left-4 sm:left-8 flex items-center gap-2 z-10">
            {banners.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setCurrentSlide(idx);
                }}
                aria-label={"اسلاید " + (idx + 1)}
                className={
                  "h-2 rounded-full transition-all cursor-pointer " +
                  (idx === currentSlide ? "w-8 bg-[var(--accent-blue)]" : "w-2 bg-white/50 hover:bg-white")
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default DynamicHomeSections;
