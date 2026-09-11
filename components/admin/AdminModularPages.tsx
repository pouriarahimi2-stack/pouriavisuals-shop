"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const STORAGE_PREFIX = "axon_puck_page_data_v2026_";

const FALLBACK_DEFAULT_DATA: Data = {
  content: [
    {
      type: "HeaderCapsuleBar",
      props: {
        id: "header-capsule-1",
        brandText: "Axon | آکسون",
        logoUrl: "",
        logoWidth: 36,
        logoHeight: 36,
        menu1Text: "کاتالوگ محصولات",
        menu1Url: "/products",
        menu2Text: "اخبار تکنولوژی",
        menu2Url: "/news",
        menu3Text: "مجله سئو",
        menu3Url: "/blog",
        menu4Text: "پیگیری سفارش",
        menu4Url: "/track-order",
        menu5Text: "تماس با ما",
        menu5Url: "/contact",
        showCart: true,
        showTheme: true,
        showUser: true,
        capsuleBg: "#07090e",
        capsuleBorder: "#27272a"
      }
    },
    {
      type: "NativeHero3D",
      props: {
        id: "hero-1",
        topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        badgeColor: "#38bdf8",
        title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
        titleSize: 42,
        subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
        bgColor: "transparent"
      }
    },
    {
      type: "NativePerspectiveSlider",
      props: {
        id: "slider-1",
        sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
        sectionSubtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی"
      }
    },
    {
      type: "NativeProductCatalog",
      props: {
        id: "catalog-1",
        heading: "کاتالوگ تجهیزات تخصصی و مانیتورها",
        subtitle: "تمامی کالاها با گارانتی اصالت طلایی عرضه می‌شوند",
        limit: 8
      }
    },
    {
      type: "NativeExplodedView",
      props: {
        id: "exploded-1",
        productTitle: "Apple Studio Display 5K Retina",
        sectionTitle: "کالبدشکافی لایه‌های سخت‌افزاری"
      }
    },
    {
      type: "GlobalFooterBlock",
      props: {
        id: "footer-1",
        footerLogoUrl: "",
        brandTitle: "Axon | آکسون",
        brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
        brandDesc: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
        supportPhone: "09376110200",
        supportEmail: "Pouriarahimi@yahoo.com",
        warehouseAddress: "شیراز - ستارخان",
        workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: "27424534",
        copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
        footerBg: "#07090e"
      }
    }
  ],
  root: { props: { title: "صفحه اصلی" } }
};

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data | null>(null);
  const [renderKey, setRenderKey] = useState<string>("init");
  const [loading, setLoading] = useState(true);
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

    let targetData: Data | null = null;

    // ۱. ابتدا فوراً از کش دائمی کلاینت واکشی می‌کنیم تا هیچ‌گاه ریست نشود
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(STORAGE_PREFIX + slug);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && Array.isArray(parsed.content) && parsed.content.length > 0) {
            targetData = parsed;
          }
        }
      } catch {}
    }

    // ۲. سپس آخرین نسخه را از پایگاه داده می‌خوانیم
    try {
      const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page && json.page.puck_data && Array.isArray(json.page.puck_data.content) && json.page.puck_data.content.length > 0) {
        targetData = json.page.puck_data;
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(targetData));
        }
      }
    } catch {}

    // ۳. اگر هیچ دیتایی نبود، از ساختار اولیه استفاده می‌کنیم
    if (!targetData) {
      targetData = FALLBACK_DEFAULT_DATA;
    }

    setPageData(targetData);
    setRenderKey(slug + "_" + Date.now());
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار و ذخیره دائمی تغییرات...");

    // ۱. ذخیره فوری در حافظه دائمی لوکال
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_PREFIX + currentSlug, JSON.stringify(data));
      } catch {}
    }
    setPageData(data);

    // ۲. ارسال ذخیره دائمی به دیتابیس Supabase
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
        setToast("✓ صفحه و تمام تنظیمات با موفقیت ذخیره دائم شد و پس از رفرش حفظ می‌گردد.");

        // برودکست وب‌سوکت بلادرنگ به تمام تب‌ها
        try {
          const headerBlock = data.content?.find((b: any) => b.type === "HeaderCapsuleBar");
          supabase.channel("realtime-header-puck-sync").send({
            type: "broadcast",
            event: "header_updated",
            payload: headerBlock?.props || {}
          });
        } catch {}

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("puck_published"));
        }
      } else {
        setToast("هشدار: در مرورگر ذخیره شد، خطا در سرور: " + (json.message || ""));
      }
    } catch {
      setToast("✓ تغییرات به صورت محلی پایدار شد (عدم دسترسی به سرور).");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : `/${currentSlug}`;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
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

      <div className="w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[880px]">
        {loading || !pageData ? (
          <div className="py-32 text-center text-xs font-bold text-slate-400">در حال فراخوانی داده‌های پایدار...</div>
        ) : (
          <Puck
            key={renderKey}
            config={puckConfig}
            data={pageData}
            onPublish={handleSave}
          />
        )}
      </div>
    </div>
  );
}
