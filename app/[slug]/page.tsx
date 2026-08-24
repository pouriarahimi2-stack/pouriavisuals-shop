"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { pageService, CustomPage, PageBlock } from "@/services/pageService";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DynamicCustomPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug as string);

  const [pageData, setPageData] = useState<CustomPage | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const loadPage = async () => {
    if (!slug) return;
    try {
      const [pData, prods] = await Promise.all([
        pageService.getBySlug(slug),
        productService.getAll(),
      ]);
      setPageData(pData);
      setProducts(prods);
    } catch (e) {
      console.error("Error loading custom page:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();

    // همگام‌سازی بلادرنگ تغییرات صفحه
    const channel = supabase
      .channel(`page-${slug}-realtime`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pages" }, () => {
        loadPage();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans">
        <span className="text-xs font-bold text-[var(--text-muted)] animate-pulse">در حال بارگذاری صفحه...</span>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans space-y-3">
        <span className="text-4xl">📄</span>
        <h2 className="text-base font-black text-[var(--text-primary)]">صفحه مورد نظر یافت نشد</h2>
        <Link href="/" className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-md">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 font-sans max-w-6xl mx-auto space-y-12" dir="rtl">
      {pageData.content.map((block: PageBlock) => (
        <RenderPageBlock key={block.id} block={block} products={products} onAddToCart={addToCart} />
      ))}
    </div>
  );
}

function RenderPageBlock({ block, products, onAddToCart }: { block: PageBlock; products: Product[]; onAddToCart: (p: any) => void }) {
  switch (block.type) {
    case "hero":
      return (
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] p-8 md:p-14 bg-gradient-to-l from-[var(--accent-blue)]/20 via-[var(--modal-bg)] to-[var(--modal-bg)] shadow-xl">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)]">{block.data.title}</h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed font-medium">{block.data.subtitle}</p>
          </div>
        </section>
      );

    case "text":
      return (
        <section className="p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
          <p className="text-xs md:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-medium">{block.data.text}</p>
        </section>
      );

    case "banner":
      return (
        <section className="overflow-hidden rounded-3xl border border-[var(--card-border)] shadow-xl">
          <a href={block.data.linkUrl || "#"} className="block group">
            <img src={block.data.imageUrl} alt="" className="w-full h-auto max-h-[380px] object-cover group-hover:scale-102 transition duration-500" />
          </a>
        </section>
      );

    case "products":
      return (
        <section className="space-y-6">
          <h3 className="text-lg font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📦 {block.data.heading || "محصولات برگزیده"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.slice(0, 6).map((p) => (
              <div key={p.id} className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm flex flex-col justify-between space-y-3">
                <img src={p.images?.[0] || p.image} alt="" className="w-full h-44 object-contain rounded-2xl bg-white/5 p-2" />
                <h4 className="text-xs font-black text-[var(--text-primary)] truncate">{p.title || p.name}</h4>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                    {Number(p.discountPrice || p.price).toLocaleString("fa-IR")} ت
                  </span>
                  <button onClick={() => onAddToCart(p)} className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold cursor-pointer">
                    + خرید
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    default:
      return null;
  }
}