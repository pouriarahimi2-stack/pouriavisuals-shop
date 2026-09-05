"use client";

import React, { Suspense } from "react";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductList from "@/components/ProductList";
import TechRadarFeed from "@/components/TechRadarFeed";
import ContactDock from "@/components/ContactDock";
import LiveMarketArbitrage from "@/components/LiveMarketArbitrage";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen space-y-14 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* نوار آربیتراژ و پایش لحظه‌ای بازار */}
      <section className="max-w-7xl mx-auto px-4 pt-4">
        <LiveMarketArbitrage />
      </section>

      {/* هیرو سکشن مینیمال با بنر پرمیوم */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[var(--modal-bg)] to-[var(--input-bg)] border border-[var(--card-border)] p-6 sm:p-12 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 z-10 text-right">
              <span className="px-3.5 py-1.5 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-black inline-block">
                ⚡ نسل جدید مانیتورهای ۵K استودیو و تجهیزات تدوین
              </span>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
                دقت بی‌نهایت رنگ، <br className="hidden sm:block" />
                استاندارد حرفه‌ای استودیو
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-lg">
                تامین تخصصی مانیتورهای کالیبره‌شده، کابل‌های تاندربولت و کارت‌های کپچر با ضمانت اصالت طلایی و ارسال اکسپرس به سراسر کشور.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/#products"
                  className="px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl shadow-blue-500/25 flex items-center gap-2"
                >
                  <span>🛒</span>
                  <span>مشاهده کاتالوگ و خرید</span>
                </Link>
                <Link
                  href="/products"
                  className="px-6 py-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition"
                >
                  فیلتر پیشرفته محصولات ←
                </Link>
              </div>
            </div>

            <div className="relative h-72 sm:h-96 w-full flex items-center justify-center">
              <Suspense fallback={<div className="text-xs text-[var(--text-secondary)] animate-pulse">در حال بارگذاری المان سه‌بعدی...</div>}>
                <Hero3DCanvas />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ویترین اصلی کاتالوگ محصولات */}
      <section className="max-w-7xl mx-auto px-4">
        <ProductList />
      </section>

      {/* فید اخبار و رادار تکنولوژی جهانی */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <TechRadarFeed />
      </section>

      {/* داک دسترسی سریع ارتباط با ما */}
      <ContactDock />
    </div>
  );
}
