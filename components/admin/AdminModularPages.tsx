"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

const DEFAULT_FULL_DATA: Data = {
  content: [
    {
      type: "HeaderModularBlock",
      props: {
        id: "header-block-1",
        brandName: "Axon | آکسون",
        brandLogoText: "▲",
        menuItems: [
          { label: "کاتالوگ محصولات", href: "/products" },
          { label: "اخبار تکنولوژی", href: "/news" },
          { label: "مجله سئو", href: "/blog" },
          { label: "پیگیری سفارش", href: "/track-order" },
          { label: "تماس با ما", href: "/contact" },
        ],
        showCartIcon: true,
        showThemeIcon: true,
        showUserIcon: true,
        headerBg: "rgba(7, 9, 14, 0.85)",
        capsuleBorder: "rgba(255, 255, 255, 0.1)"
      }
    },
    {
      type: "Hero3DModularBlock",
      props: {
        id: "hero-block-1",
        badgeText: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        badgeColor: "#38bdf8",
        title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
        subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای ۵K با ۱۸ ماه گارانتی طلایی",
        ctaButtonText: "ورود به کاتالوگ مانیتورها",
        ctaButtonUrl: "/products",
        canvasHeight: 520
      }
    },
    {
      type: "PerspectiveSliderModularBlock",
      props: {
        id: "slider-block-1",
        sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
        sectionSubtitle: "پیمایش جهت بررسی دقیق مشخصات و گارانتی",
        slides: [
          {
            title: "Apple Studio Display 27 5K",
            subtitle: "پنل رتینا با کالیبراسیون ۳D LUT",
            badge: "پرچمدار",
            imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
            linkUrl: "/products",
            priceText: "۱۲۸,۵۰۰,۰۰۰ تومان"
          },
          {
            title: "Apple Pro Display XDR 32 6K",
            subtitle: "روشنایی ۱۶۰۰ نیت و وضوح خیره‌کننده 6K",
            badge: "استودیوی حرفه‌ای",
            imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
            linkUrl: "/products",
            priceText: "۲۴۵,۰۰۰,۰۰۰ تومان"
          }
        ]
      }
    },
    {
      type: "ProductCatalogModularBlock",
      props: {
        id: "catalog-block-1",
        catalogTitle: "کاتالوگ تجهیزات تخصصی و مانیتورها",
        catalogSubtitle: "تمامی کالاها با گارانتی اصالت طلایی و تست سلامت فیزیکی عرضه می‌شوند",
        limit: 6,
        columns: 3
      }
    },
    {
      type: "ExplodedViewModularBlock",
      props: {
        id: "exploded-block-1",
        targetProductTitle: "Apple Studio Display 5K Retina",
        badgeTitle: "🧬 کالبدشکافی تخصصی لایه‌ها",
        boxBg: "transparent"
      }
    },
    {
      type: "FooterModularBlock",
      props: {
        id: "footer-block-1",
        brandTitle: "Axon | آکسون",
        brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
        bioDescription: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
        badge1: "✓ گارانتی اصالت ۱۰۰٪ فیزیکی",
        badge2: "🚀 ارسال پیشتاز سراسری",
        phone: "09376110200",
        email: "Pouriarahimi@yahoo.com",
        warehouseAddress: "شیراز - ستارخان",
        workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: "27424534",
        copyright: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
        quickLinks: [
          { label: "کاتالوگ کالاها", href: "/products" },
          { label: "سامانه رهگیری مرسولات", href: "/track-order" },
          { label: "جدیدترین اخبار تکنولوژی", href: "/news" },
          { label: "مجله مقالات تخصصی", href: "/blog" },
          { label: "درباره آکسون", href: "/about" },
        ],
        customerServiceLinks: [
          { label: "ثبت تیکت مشاوره", href: "/contact" },
          { label: "شرایط گارانتی طلایی", href: "/about" },
          { label: "ضمانت بازگشت وجه ۷ روزه", href: "/about" },
          { label: "راهنمای کالیبراسیون ۵K", href: "/blog" },
        ]
      }
    }
  ],
  root: { props: { title: "صفحه اصلی" } }
};

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data>(DEFAULT_FULL_DATA);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const loadPage = async (slug: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();
    try {
      const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page && json.page.puck_data && json.page.puck_data.content?.length > 0) {
        setPageData(json.page.puck_data);
      } else {
        setPageData(DEFAULT_FULL_DATA);
      }
    } catch {
      setPageData(DEFAULT_FULL_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار تغییرات روی سایت...");
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: currentSlug === "home" ? "صفحه اصلی" : currentSlug,
          puck_data: data,
          is_published: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setToast("✓ تمام تغییرات اتمیک با موفقیت ذخیره و در سایت منتشر شد.");
      } else {
        setToast("خطا در ذخیره‌سازی.");
      }
    } catch {
      setToast("خطا در برقراری ارتباط با سرور.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : `/${currentSlug}`;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ کنترل صفحه ساز */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">انتخاب صفحه:</span>
            <select
              value={currentSlug}
              onChange={(e) => loadPage(e.target.value)}
              className="p-2 px-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black outline-none cursor-pointer"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده در سایت</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      {/* بوم تمام‌عرض ۱۰۰٪ آزاد Puck بدون فشرده‌سازی و بدون خطای لایه‌بندی */}
      <div className="w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[850px]">
        {loading ? (
          <div className="py-32 text-center text-xs font-bold text-slate-400">در حال آماده‌سازی بوم بصری...</div>
        ) : (
          <Puck
            config={puckConfig}
            data={pageData}
            onPublish={handleSave}
          />
        )}
      </div>
    </div>
  );
}
