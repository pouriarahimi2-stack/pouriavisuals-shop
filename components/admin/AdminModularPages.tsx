"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import { siteInfoService } from "@/services/siteInfoService";
import Link from "next/link";

const STORAGE_PREFIX = "axon_puck_page_data_v2026_";
const GLOBAL_NAV_KEY = "axon_global_header_footer_v2026";

const DEFAULT_GLOBAL_HEADER = {
  type: "HeaderCapsuleBar",
  props: {
    id: "global-header-core",
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
};

const DEFAULT_GLOBAL_FOOTER = {
  type: "GlobalFooterBlock",
  props: {
    id: "global-footer-core",
    footerLogoUrl: "",
    brandTitle: "Axon | آکسون",
    brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
    brandDesc: "",
    supportPhone: "09376110200",
    supportEmail: "Pouriarahimi@yahoo.com",
    warehouseAddress: "شیراز - ستارخان",
    workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
    enamadCode: "7434404",
    copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
    footerBg: "#07090e"
  }
};

function getPageSpecificBody(slug: string, title?: string): any[] {
  if (slug === "products") {
    return [
      {
        type: "NativeProductCatalog",
        props: {
          id: "catalog-page-main",
          heading: "کاتالوگ جامع مانیتورها و تجهیزات تصویر",
          subtitle: "دارای گارانتی اصالت طلایی و ارسال سریع پیشتاز به سراسر کشور",
          limit: 12
        }
      }
    ];
  }

  if (slug === "home") {
    return [
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
      }
    ];
  }

  return [
    {
      type: "RichTextBlock",
      props: {
        id: "custom-page-" + slug,
        title: title || "صفحه جدید",
        content: "محتوای اختصاصی این صفحه را از سایدبار تنظیم کنید یا بلوک‌های دلخواه را به آن اضافه نمایید.",
        bgColor: "transparent"
      }
    }
  ];
}

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data | null>(null);
  const [renderKey, setRenderKey] = useState<string>("init");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");

  const getGlobalHeaderFooter = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(GLOBAL_NAV_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.header && parsed.footer) return parsed;
        }
      } catch {}
    }
    return { header: DEFAULT_GLOBAL_HEADER, footer: DEFAULT_GLOBAL_FOOTER };
  };

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const loadPage = async (slug: string, customTitle?: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();

    const { header: currentGlobalHeader, footer: currentGlobalFooter } = getGlobalHeaderFooter();
    let targetData: Data | null = null;

    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(STORAGE_PREFIX + slug);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && Array.isArray(parsed.content)) {
            targetData = parsed;
          }
        }
      } catch {}
    }

    try {
      const res = await fetch("/api/pages?slug=" + encodeURIComponent(slug), { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page && json.page.puck_data && Array.isArray(json.page.puck_data.content)) {
        targetData = json.page.puck_data;
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(targetData));
        }
      }
    } catch {}

    // پاکسازی هرگونه بلاک FeaturesGridBlock (۳ کارت مزایا) که در گذشته ذخیره شده بود
    let bodyBlocks = targetData?.content ? targetData.content.filter(
      (b: any) => b.type !== "HeaderCapsuleBar" && b.type !== "GlobalFooterBlock" && b.type !== "FeaturesGridBlock"
    ) : [];

    if (bodyBlocks.length === 0) {
      bodyBlocks = getPageSpecificBody(slug, customTitle);
    }

    const mergedData: Data = {
      content: [currentGlobalHeader, ...bodyBlocks, currentGlobalFooter],
      root: { props: { title: customTitle || slug } }
    };

    setPageData(mergedData);
    setRenderKey(slug + "_" + Date.now());
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار سراسری تغییرات در تمام صفحات...");

    const cleanContent = (data.content || []).filter((b: any) => b.type !== "FeaturesGridBlock");
    const sanitizedData = { ...data, content: cleanContent };

    const newHeaderBlock = sanitizedData.content.find((b: any) => b.type === "HeaderCapsuleBar") || DEFAULT_GLOBAL_HEADER;
    const newFooterBlock = sanitizedData.content.find((b: any) => b.type === "GlobalFooterBlock") || DEFAULT_GLOBAL_FOOTER;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(GLOBAL_NAV_KEY, JSON.stringify({ header: newHeaderBlock, footer: newFooterBlock }));
        localStorage.setItem(STORAGE_PREFIX + currentSlug, JSON.stringify(sanitizedData));
      } catch {}
    }

    setPageData(sanitizedData);

    try {
      const currentPageObj = pages.find((p) => p.slug === currentSlug);
      const pageTitle = currentPageObj?.title || currentSlug;

      await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: pageTitle,
          puck_data: sanitizedData,
          is_published: true,
        }),
      });

      soundEngine.playSuccess();
      setToast("✓ تغییرات با موفقیت ذخیره و منتشر شد.");
    } catch {
      setToast("خطا در ذخیره‌سازی.");
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleCreateNewPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageSlug.trim()) return;

    soundEngine.playSuccess();
    const cleanSlug = newPageSlug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const title = newPageTitle.trim();

    setPages((prev) => [...prev, { id: "page_" + Date.now(), slug: cleanSlug, title }]);
    setShowNewPageModal(false);
    setNewPageTitle("");
    setNewPageSlug("");

    loadPage(cleanSlug, title);
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : "/" + currentSlug;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-xl shadow-md font-bold">
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
                <option key={p.id || p.slug} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => { soundEngine.playClick(); setShowNewPageModal(true); }}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black shadow-md cursor-pointer transition flex items-center gap-1"
          >
            <span>➕</span>
            <span>ایجاد صفحه جدید</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده این صفحه</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      {showNewPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn font-sans" dir="rtl">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 shadow-2xl text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm text-sky-500 flex items-center gap-2">
                <span>➕</span> ایجاد صفحه سفارشی جدید
              </h3>
              <button
                type="button"
                onClick={() => setShowNewPageModal(false)}
                className="w-7 h-7 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewPage} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">عنوان فارسی صفحه *</label>
                <input
                  type="text"
                  required
                  placeholder="شرایط خدمات"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">آدرس انگلیسی / نامک (Slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="terms"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowNewPageModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--input-bg)] text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-md transition cursor-pointer"
                >
                  ایجاد و باز کردن ←
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[880px]">
        {loading || !pageData ? (
          <div className="py-32 text-center text-xs font-bold text-slate-400">در حال لود صفحه و همگام‌سازی...</div>
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
