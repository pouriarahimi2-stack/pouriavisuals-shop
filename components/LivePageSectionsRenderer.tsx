"use client";
// File Path: components/LivePageSectionsRenderer.tsx
import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export interface CustomPageSection {
  id: string;
  targetRoute: string; // "/", "/products", "/about", "/contact", or custom "/slug"
  position: "top" | "bottom";
  type:
    | "hero_banner"
    | "bento_grid"
    | "comparison_table"
    | "faq_accordion"
    | "countdown_offer"
    | "trust_badges"
    | "glass_callout";
  title: string;
  subtitle: string;
  badgeText?: string;
  ctaText?: string;
  ctaLink?: string;
  mediaUrl?: string;
  glassStyle: boolean;
  paddingY: number;
  items?: Array<{
    title: string;
    desc: string;
    badge?: string;
    icon?: string;
  }>;
  enabled: boolean;
}

export default function LivePageSectionsRenderer({
  position,
}: {
  position: "top" | "bottom";
}) {
  const pathname = usePathname() || "/";
  const [sections, setSections] = useState<CustomPageSection[]>([]);
  const [openFaqIdx, setOpenFaqIdx] = useState<Record<string, number>>({});

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch("/api/theme-builder", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      const list = json?.config?.customPageSections;
      if (Array.isArray(list)) {
        setSections(list);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSections();
    const onUpdate = () => fetchSections();
    window.addEventListener("theme_builder_updated", onUpdate);
    window.addEventListener("axon_pages_studio_updated", onUpdate);
    return () => {
      window.removeEventListener("theme_builder_updated", onUpdate);
      window.removeEventListener("axon_pages_studio_updated", onUpdate);
    };
  }, [fetchSections]);

  if (pathname.startsWith("/admin")) return null;

  const matched = sections.filter(
    (s) =>
      s.enabled !== false &&
      s.position === position &&
      (s.targetRoute === pathname || s.targetRoute === "all")
  );

  if (matched.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 my-6" dir="rtl">
      {matched.map((sec) => {
        const cardSurfaceClass = sec.glassStyle
          ? "axon-liquid-glass-surface border border-sky-500/30 shadow-2xl"
          : "bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl";

        return (
          <section
            key={sec.id}
            style={{
              paddingTop: (sec.paddingY ?? 28) + "px",
              paddingBottom: (sec.paddingY ?? 28) + "px",
            }}
            className={"rounded-3xl px-5 sm:px-8 transition-all " + cardSurfaceClass}
          >
            {/* ۱. بلوک بنر هیرو پیشرفته */}
            {sec.type === "hero_banner" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4 text-right">
                  {sec.badgeText && (
                    <span className="inline-block px-3.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-black">
                      {sec.badgeText}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] leading-tight">
                    {sec.title}
                  </h2>
                  {sec.subtitle && (
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      {sec.subtitle}
                    </p>
                  )}
                  {sec.ctaText && (
                    <div className="pt-2">
                      <Link
                        href={sec.ctaLink || "/products"}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs sm:text-sm font-black shadow-lg hover:opacity-95 transition"
                      >
                        <span>{sec.ctaText}</span>
                        <span>←</span>
                      </Link>
                    </div>
                  )}
                </div>
                {sec.mediaUrl && (
                  <div className="lg:col-span-5 flex justify-center">
                    <img
                      src={sec.mediaUrl}
                      alt={sec.title}
                      className="max-h-64 rounded-2xl object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ۲. شبکه بنتو به سبک اپل (Apple Bento Grid) */}
            {sec.type === "bento_grid" && (
              <div className="space-y-5">
                <div className="text-center space-y-1.5">
                  {sec.badgeText && (
                    <span className="px-3 py-1 rounded-full bg-sky-500/15 text-sky-400 text-[11px] font-black">
                      {sec.badgeText}
                    </span>
                  )}
                  <h2 className="text-lg sm:text-2xl font-black text-[var(--text-primary)]">
                    {sec.title}
                  </h2>
                  {sec.subtitle && (
                    <p className="text-xs text-[var(--text-secondary)]">{sec.subtitle}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(sec.items || []).map((item, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-[var(--input-bg)]/80 border border-[var(--card-border)] hover:border-sky-500/40 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{item.icon || "💎"}</span>
                        {item.badge && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/15 text-sky-400 text-[10px] font-black">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-sm text-[var(--text-primary)]">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ۳. جدول مقایسه تخصصی */}
            {sec.type === "comparison_table" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-xl font-black text-[var(--text-primary)]">
                    {sec.title}
                  </h2>
                  {sec.subtitle && (
                    <p className="text-xs text-[var(--text-secondary)]">{sec.subtitle}</p>
                  )}
                </div>
                <div className="overflow-x-auto rounded-2xl border border-[var(--card-border)]">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[var(--input-bg)] text-[var(--accent-blue)] font-black">
                      <tr>
                        <th className="p-3.5">ویژگی / شاخص</th>
                        <th className="p-3.5">استاندارد آکسون کور</th>
                        <th className="p-3.5">وضعیت تضمین</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {(sec.items || []).map((item, i) => (
                        <tr key={i}>
                          <td className="p-3.5 font-black text-[var(--text-primary)]">
                            {item.title}
                          </td>
                          <td className="p-3.5 text-[var(--text-secondary)]">{item.desc}</td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-black text-[11px]">
                              {item.badge || "✓ تضمین‌شده"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ۴. سوالات متداول آکاردئونی (FAQ) */}
            {sec.type === "faq_accordion" && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="text-base sm:text-xl font-black text-[var(--text-primary)]">
                    {sec.title}
                  </h2>
                  {sec.subtitle && (
                    <p className="text-xs text-[var(--text-secondary)]">{sec.subtitle}</p>
                  )}
                </div>
                <div className="space-y-2.5 max-w-3xl mx-auto">
                  {(sec.items || []).map((item, i) => {
                    const isOpen = (openFaqIdx[sec.id] ?? 0) === i;
                    return (
                      <div
                        key={i}
                        className="rounded-2xl bg-[var(--input-bg)]/80 border border-[var(--card-border)] overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFaqIdx((prev) => ({
                              ...prev,
                              [sec.id]: isOpen ? -1 : i,
                            }))
                          }
                          className="w-full p-4 text-right font-black text-xs sm:text-sm text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
                        >
                          <span>{item.title}</span>
                          <span className="text-sky-400">{isOpen ? "−" : "+"}</span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--card-border)] pt-3">
                            {item.desc}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ۵. بنر جشنواره و پیشنهاد ویژه یا نوار ضمانت */}
            {(sec.type === "countdown_offer" ||
              sec.type === "trust_badges" ||
              sec.type === "glass_callout") && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center md:text-right">
                  {sec.badgeText && (
                    <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-black">
                      {sec.badgeText}
                    </span>
                  )}
                  <h3 className="text-base sm:text-xl font-black text-[var(--text-primary)]">
                    {sec.title}
                  </h3>
                  {sec.subtitle && (
                    <p className="text-xs text-[var(--text-secondary)]">{sec.subtitle}</p>
                  )}
                </div>
                {sec.ctaText && (
                  <Link
                    href={sec.ctaLink || "/products"}
                    className="px-5 py-2.5 rounded-2xl bg-sky-500 text-slate-950 font-black text-xs shadow-lg hover:bg-sky-400 transition shrink-0"
                  >
                    {sec.ctaText} ←
                  </Link>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
