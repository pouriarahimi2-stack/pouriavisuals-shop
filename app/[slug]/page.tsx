// File Path: app/[slug]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { pageService, CustomPage, PageBlock } from "@/services/pageService";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export default function DynamicCustomPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug as string);

  // اگر آدرس مربوط به تاییدیه اینماد بود نادیده بگیرد
  if (slug && (slug.endsWith(".txt") || slug.includes("27424534"))) {
    return null;
  }

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

    const handlePageUpdate = () => loadPage();
    window.addEventListener("page_structure_updated", handlePageUpdate);

    return () => {
      window.removeEventListener("page_structure_updated", handlePageUpdate);
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans text-xs font-bold text-[var(--text-secondary)]">
        در حال بارگذاری صفحه...
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans space-y-4" dir="rtl">
        <h2 className="text-xl font-black text-[var(--text-primary)]">صفحه مورد نظر یافت نشد.</h2>
        <Link href="/" className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold">
          صفحه اصلی
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 font-sans max-w-7xl mx-auto space-y-12 select-none text-[var(--text-primary)]" dir="rtl">
      {pageData.content.map((block: PageBlock) => (
        <RenderModularBlock key={block.id} block={block} products={products} onAddToCart={addToCart} />
      ))}
    </div>
  );
}

function RenderModularBlock({
  block,
  products,
}: {
  block: PageBlock;
  products: Product[];
  onAddToCart: (p: any) => void;
}) {
  switch (block.type) {
    case "hero":
      return (
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] p-8 md:p-14 bg-gradient-to-l from-[var(--accent-blue)]/20 to-[var(--modal-bg)] shadow-2xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)]">{block.data.title}</h1>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-2xl">{block.data.subtitle}</p>
        </section>
      );

    case "products":
      return (
        <section className="space-y-6">
          <h3 className="text-xl font-black text-[var(--text-primary)]">{block.data.heading || "محصولات منتخب"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, block.data.limit || 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-3">
          <h4 className="font-black text-sm text-[var(--accent-blue)]">{block.data.question || "پرسش متداول"}</h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{block.data.answer || "پاسخ"}</p>
        </section>
      );

    case "cta":
      return (
        <section className="p-8 rounded-[2.5rem] bg-[var(--accent-blue)] text-white text-center space-y-4 shadow-xl">
          <h3 className="text-xl font-black">{block.data.title || "مشاوره تخصصی استودیو"}</h3>
          <Link
            href={block.data.link || "/contact"}
            className="inline-block px-8 py-3 rounded-2xl bg-white text-gray-900 font-black text-xs shadow-lg hover:scale-105 transition"
          >
            {block.data.buttonText || "تماس با ما"}
          </Link>
        </section>
      );

    case "text":
      return (
        <section className="p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] leading-loose text-xs font-medium text-[var(--text-primary)] text-justify">
          <p>{block.data.text}</p>
        </section>
      );

    default:
      return null;
  }
}