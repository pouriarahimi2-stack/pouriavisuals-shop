"use client";

import React, { Suspense } from "react";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductList from "@/components/ProductList";
import TechRadarFeed from "@/components/TechRadarFeed";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen space-y-16 font-sans select-none text-[var(--text-primary)] pb-12" dir="rtl">
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[var(--modal-bg)] to-[var(--input-bg)] border border-[var(--card-border)] p-6 sm:p-12 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 z-10 text-right">
              <span className="px-3.5 py-1.5 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-black inline-block">
                ⚡ مرجع تخصصی مانیتورهای تدوین رنگ ۵K و ۴K
              </span>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
                دقت بی‌نهایت رنگ، <br className="hidden sm:block" />
                استاندارد حرفه‌ای استودیو
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-lg">
                تامین، کالیبراسیون و مشاوره تخصصی نمایشگرهای رتینا، کابل‌های تاندربولت و تجهیزات استودیویی با ضمانت اصالت طلایی.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="#products"
                  className="px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl shadow-blue-500/25 flex items-center gap-2"
                >
                  <span>🛒</span>
                  <span>مشاهده کاتالوگ و خرید</span>
                </a>
                <Link
                  href="/products"
                  className="px-6 py-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition"
                >
                  آرشیو کامل محصولات ←
                </Link>
              </div>
            </div>

            <div className="relative h-72 sm:h-96 w-full flex items-center justify-center">
              <Suspense fallback={<div className="text-xs text-[var(--text-secondary)] animate-pulse">در حال آماده‌سازی مدل سه‌بعدی...</div>}>
                <Hero3DCanvas />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4" id="products">
        <ProductList />
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <TechRadarFeed />
      </section>
    </div>
  );
}
