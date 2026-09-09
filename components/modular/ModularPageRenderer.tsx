"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageBlock, ModularPageDocument } from "@/lib/modularBuilderTypes";
import { supabase } from "@/lib/supabase";

interface Props {
  initialPage: ModularPageDocument | null;
  slug: string;
}

export default function ModularPageRenderer({ initialPage, slug }: Props) {
  const [page, setPage] = useState<ModularPageDocument | null>(initialPage);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page) {
        setPage(json.page);
      }
    } catch (e) {
      console.error("Live page fetch error:", e);
    }
  };

  useEffect(() => {
    // گوش دادن بلادرنگ به تغییرات جدول modular_pages
    const channel = supabase
      .channel(`realtime-modular-page-${slug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "modular_pages" }, (payload: any) => {
        if (payload.new && payload.new.slug === slug) {
          setPage(payload.new as ModularPageDocument);
        } else {
          fetchPage();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  if (!page || !page.blocks || page.blocks.length === 0) {
    return null;
  }

  const activeBlocks = page.blocks.filter((b) => b.isVisible !== false);

  return (
    <div className="w-full flex flex-col font-sans select-none overflow-x-hidden" dir="rtl">
      {activeBlocks.map((block) => renderBlock(block, openFaqIndex, setOpenFaqIndex))}
    </div>
  );
}

function renderBlock(
  block: PageBlock,
  openFaqIndex: number | null,
  setOpenFaqIndex: (idx: number | null) => void
) {
  const { id, type, styles, data } = block;

  const containerMaxWidth =
    styles.maxWidth === "full"
      ? "w-full px-4"
      : styles.maxWidth === "5xl"
      ? "max-w-5xl mx-auto px-4"
      : styles.maxWidth === "3xl"
      ? "max-w-3xl mx-auto px-4"
      : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

  const paddingStyle = {
    paddingTop: `${styles.paddingY ?? 12}rem`,
    paddingBottom: `${styles.paddingY ?? 12}rem`,
    backgroundColor: styles.bgColor || "transparent",
    color: styles.textColor || "inherit",
    textAlign: styles.textAlign || "right",
  };

  switch (type) {
    case "header_nav":
      return (
        <header
          key={id}
          style={{ backgroundColor: styles.bgColor || "#0f172a", color: styles.textColor || "#fff" }}
          className="w-full border-b border-white/10 sticky top-0 z-40 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-sky-400 tracking-wider font-mono">
                {data.brandName || "AXON"}
              </span>
              {data.logoText && (
                <span className="text-xs font-bold opacity-80 border-r border-white/20 pr-3 mr-1">
                  {data.logoText}
                </span>
              )}
            </div>

            <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
              {(data.navLinks || []).map((link: any, i: number) => (
                <Link key={i} href={link.url || "/"} className="hover:text-sky-400 transition">
                  {link.label}
                </Link>
              ))}
            </nav>

            {data.ctaButtonText && (
              <Link
                href={data.ctaButtonUrl || "/products"}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs transition shadow-lg"
              >
                {data.ctaButtonText}
              </Link>
            )}
          </div>
        </header>
      );

    case "hero_banner":
      return (
        <section key={id} style={paddingStyle} className="w-full relative overflow-hidden">
          <div className={containerMaxWidth}>
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              {data.badge && (
                <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold animate-pulse">
                  {data.badge}
                </span>
              )}

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight max-w-4xl">
                {data.headline || "عنوان هیرو"}
              </h1>

              {data.subheadline && (
                <p className="text-sm sm:text-base font-medium opacity-80 max-w-2xl leading-relaxed">
                  {data.subheadline}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                {data.primaryBtnText && (
                  <Link
                    href={data.primaryBtnUrl || "/products"}
                    className="px-8 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs sm:text-sm shadow-xl hover:scale-105 transition duration-200"
                  >
                    {data.primaryBtnText}
                  </Link>
                )}
                {data.secondaryBtnText && (
                  <Link
                    href={data.secondaryBtnUrl || "/contact"}
                    className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-xs sm:text-sm transition"
                  >
                    {data.secondaryBtnText}
                  </Link>
                )}
              </div>

              {data.imageUrl && (
                <div className="w-full max-w-5xl mt-12 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                  <img src={data.imageUrl} alt="" className="w-full h-auto object-cover max-h-[500px]" />
                </div>
              )}
            </div>
          </div>
        </section>
      );

    case "features_grid":
      return (
        <section key={id} style={paddingStyle} className="w-full">
          <div className={containerMaxWidth}>
            {data.heading && (
              <h2 className="text-xl sm:text-3xl font-black text-center mb-12">
                {data.heading}
              </h2>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(data.items || []).map((feat: any, i: number) => (
                <div
                  key={i}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-sky-500/50 transition duration-300 space-y-3"
                >
                  <span className="text-3xl block">{feat.icon || "✨"}</span>
                  <h3 className="font-extrabold text-base">{feat.title}</h3>
                  <p className="text-xs opacity-75 leading-relaxed font-medium">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "product_showcase":
      return (
        <section key={id} style={paddingStyle} className="w-full">
          <div className={containerMaxWidth}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl sm:text-2xl font-black">{data.heading || "محصولات ویژه"}</h2>
              {data.viewAllText && (
                <Link href={data.viewAllUrl || "/products"} className="text-xs font-bold text-sky-400 hover:underline">
                  {data.viewAllText}
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                  <div className="w-full h-44 rounded-2xl bg-black/30 overflow-hidden flex items-center justify-center">
                    <span className="text-3xl">🖥️</span>
                  </div>
                  <h3 className="font-black text-xs">نمایشگر تخصصی مسترینگ ۵K رتینا</h3>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-emerald-400 font-bold">۱۳۴,۰۰۰,۰۰۰ تومان</span>
                    <Link href="/products" className="text-sky-400 font-bold text-[11px]">خرید ←</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "accordion_faq":
      return (
        <section key={id} style={paddingStyle} className="w-full">
          <div className={containerMaxWidth}>
            {data.heading && (
              <h2 className="text-xl sm:text-3xl font-black text-center mb-10">
                {data.heading}
              </h2>
            )}

            <div className="space-y-3">
              {(data.questions || []).map((faq: any, i: number) => {
                const isOpen = openFaqIndex === i;
                return (
                  <div
                    key={i}
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer transition"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs sm:text-sm">{faq.q}</span>
                      <span className="text-sm font-bold text-sky-400">{isOpen ? "▲" : "▼"}</span>
                    </div>
                    {isOpen && (
                      <p className="mt-4 pt-3 border-t border-white/10 text-xs opacity-80 leading-loose animate-fadeIn">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );

    case "cta_banner":
      return (
        <section key={id} style={paddingStyle} className="w-full">
          <div className={containerMaxWidth}>
            <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/30 text-center space-y-4 shadow-2xl">
              <h2 className="text-2xl sm:text-4xl font-black">{data.title}</h2>
              {data.subtitle && <p className="text-xs sm:text-sm opacity-85 max-w-xl mx-auto leading-relaxed">{data.subtitle}</p>}
              {data.btnText && (
                <div className="pt-4">
                  <Link
                    href={data.btnUrl || "/contact"}
                    className="inline-block px-8 py-3.5 rounded-2xl bg-white text-slate-900 font-black text-xs sm:text-sm hover:bg-slate-100 transition shadow-xl"
                  >
                    {data.btnText}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      );

    case "rich_text":
      return (
        <section key={id} style={paddingStyle} className="w-full">
          <div className={containerMaxWidth}>
            <div
              dangerouslySetInnerHTML={{ __html: data.htmlContent || "" }}
              className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-loose"
            />
          </div>
        </section>
      );

    case "footer_block":
      return (
        <footer key={id} style={paddingStyle} className="w-full border-t border-white/10 text-xs">
          <div className={containerMaxWidth}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <span>{data.copyrightText || "تمامی حقوق برای آکسون محفوظ است."}</span>
              {data.supportPhone && (
                <span className="font-mono font-bold text-sky-400">
                  پشتیبانی: {data.supportPhone}
                </span>
              )}
            </div>
          </div>
        </footer>
      );

    default:
      return null;
  }
}
