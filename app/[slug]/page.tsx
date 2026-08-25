"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { pageService, CustomPage, PageBlock } from "@/services/pageService";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

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
      setProducts(prods || []);
    } catch (e) {
      console.error("Error loading custom page:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
    const channel = supabase
      .channel(`page-${slug}-realtime-v3`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_pages" }, () => loadPage())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center font-sans">بارگذاری...</div>;
  if (!pageData) return <div className="min-h-[60vh] flex items-center justify-center font-sans">صفحه یافت نشد</div>;

  return (
    <div className="min-h-screen py-10 px-4 font-sans max-w-7xl mx-auto space-y-12 select-none" dir="rtl">
      {pageData.content.map((block: PageBlock) => (
        <RenderModularBlock key={block.id} block={block} products={products} onAddToCart={addToCart} />
      ))}
    </div>
  );
}

function RenderModularBlock({ block, products }: { block: PageBlock; products: Product[]; onAddToCart: (p: any) => void }) {
  switch (block.type) {
    case "hero":
      return (
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] p-8 md:p-14 bg-gradient-to-l from-[var(--accent-blue)]/20 to-[var(--modal-bg)] shadow-2xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)]">{block.data.title}</h1>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium">{block.data.subtitle}</p>
        </section>
      );
    case "products":
      return (
        <section className="space-y-6">
          <h3 className="text-xl font-black text-[var(--text-primary)]">{block.data.heading || "محصولات منتخب"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, block.data.limit || 6).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      );
    case "text":
      return <section className="p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)]"><p className="text-xs">{block.data.text}</p></section>;
    default:
      return null;
  }
}