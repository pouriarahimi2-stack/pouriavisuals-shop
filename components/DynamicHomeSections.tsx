"use client";

import React, { useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { soundEngine } from "@/lib/soundEngine";

interface DynamicHomeSectionsProps {
  initialProducts: any[];
  initialBanners: any[];
}

export default function DynamicHomeSections({
  initialProducts = [],
  initialBanners = [],
}: DynamicHomeSectionsProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = Array.from(
    new Set(initialProducts.map((p) => p.category).filter(Boolean))
  );

  const filteredProducts =
    activeCategory === "all"
      ? initialProducts
      : initialProducts.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-16 py-6 sm:py-10 max-w-7xl mx-auto px-4 font-sans select-none" dir="rtl">
      {/* بخش هیرو استودیویی و بنر اصلی */}
      <section className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-[var(--card-border)] p-6 sm:p-12 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-blue)]/20 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] text-xs font-mono font-bold">
            <span>⚡</span> نسل جدید مانیتورهای ۵K استودیو دیسپلی
          </span>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            دقت مطلق در رنگ و جزئیات برای استودیوهای تدوین
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            تراکم پیکسلی ۲۱۸ PPI، پوشش ۹۹٪ گاموت رنگی DCI-P3 و کالیبراسیون سخت‌افزاری اختصاصی جهت پاسخگویی به استانداردهای تصحیح رنگ و خروجی‌های حرفه‌ای.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/products"
              onClick={() => soundEngine.playClick()}
              className="px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition shadow-lg shadow-[var(--accent-blue)]/25 cursor-pointer"
            >
              مشاهده کاتالوگ تجهیزات ←
            </Link>
            <Link
              href="/blog"
              onClick={() => soundEngine.playClick()}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-bold backdrop-blur-md transition cursor-pointer"
            >
              راهنمای انتخاب مانیتور
            </Link>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(2,132,199,0.18),transparent_50%)] pointer-events-none" />
      </section>

      {/* بنرهای پرچمدار در صورت وجود */}
      {initialBanners.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {initialBanners.slice(0, 2).map((banner, idx) => (
            <div
              key={banner.id || idx}
              className="relative rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] p-6 flex flex-col justify-between min-h-[180px] shadow-sm"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[var(--accent-blue)] font-bold">ویژه استودیو</span>
                <h3 className="text-base font-black text-[var(--text-primary)]">{banner.title || "تجهیزات رتینا"}</h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{banner.subtitle || "تضمین سلامت پنل و گارانتی اصالت طلایی آکسون"}</p>
              </div>
              {banner.link && (
                <Link
                  href={banner.link}
                  className="text-xs font-bold text-[var(--accent-blue)] hover:underline pt-4 block"
                >
                  مشاهده بیشتر ←
                </Link>
              )}
            </div>
          ))}
        </section>
      )}

      {/* بخش کاتالوگ و فیلتر دسته‌بندی */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">محصولات منتخب و پرچمدار</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">آماده ارسال با بسته‌بندی ضدضربه استودیویی</p>
          </div>

          {/* فیلتر دسته‌بندی */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full pb-1">
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveCategory("all");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
                activeCategory === "all"
                  ? "bg-[var(--accent-blue)] text-white shadow-sm"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              }`}
            >
              همه ({initialProducts.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveCategory(cat);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[var(--accent-blue)] text-white shadow-sm"
                    : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* شبکه نمایش کارت کالاها */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* نشان‌های اعتماد و استانداردهای گارانتی */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[var(--card-border)] pt-10 text-center">
        <div className="p-5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
          <span className="text-2xl">🛡️</span>
          <h4 className="text-xs font-black text-[var(--text-primary)]">۱۸ ماه گارانتی اصالت طلایی</h4>
          <p className="text-[11px] text-[var(--text-secondary)]">تضمین سلامت سخت‌افزاری پنل بدون پیکسل سوخته</p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
          <span className="text-2xl">⚡</span>
          <h4 className="text-xs font-black text-[var(--text-primary)]">کالیبراسیون سخت‌افزاری</h4>
          <p className="text-[11px] text-[var(--text-secondary)]">پوشش دقیق فضاهای رنگی DCI-P3 و Rec.709</p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
          <span className="text-2xl">📦</span>
          <h4 className="text-xs font-black text-[var(--text-primary)]">ارسال فوق‌سریع و ایمن</h4>
          <p className="text-[11px] text-[var(--text-secondary)]">بسته‌بندی اختصاصی ضدضربه جهت ارسال به سراسر کشور</p>
        </div>
      </section>
    </div>
  );
}
