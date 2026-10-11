// File Path: components/admin/AdminModularPages.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const STORAGE_PREFIX = "axon_puck_page_data_v2026_";
const GLOBAL_NAV_KEY = "axon_global_header_footer_v2026";

const CORE_DEFAULT_PAGES = [
  { id: "core_home", slug: "home", title: "صفحه اصلی فروشگاه" },
  { id: "core_products", slug: "products", title: "کاتالوگ محصولات" },
  { id: "core_campaign", slug: "special-offer", title: "🎯 لندینگ‌پیج جشنواره فروش" },
  { id: "core_about", slug: "about", title: "درباره آکسون کور" },
  { id: "core_contact", slug: "contact", title: "تماس و پشتیبانی" },
];

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
    capsuleBorder: "#27272a",
  },
};

const DEFAULT_GLOBAL_FOOTER = {
  type: "GlobalFooterBlock",
  props: {
    id: "global-footer-core",
    footerLogoUrl: "",
    brandTitle: "Axon | آکسون",
    brandSubtitle: "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال",
    brandDesc: "",
    supportPhone: "09376110200",
    supportEmail: "Pouriarahimi@yahoo.com",
    warehouseAddress: "شیراز - ستارخان",
    workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
    enamadCode: "7434404",
    copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
    footerBg: "#07090e",
  },
};

function getPageSpecificBody(slug: string, title?: string): any[] {
  if (slug === "products") {
    return [
      {
        type: "NativeProductCatalog",
        props: {
          id: "catalog-page-main",
          heading: "کاتالوگ جامع تجهیزات تکنولوژی و کالای دیجیتال",
          subtitle: "دارای گارانتی اصالت طلایی و ارسال سریع پیشتاز به سراسر کشور",
          limit: 12,
        },
      },
    ];
  }
  if (slug === "home") {
    return [
      {
        type: "NativeHero3D",
        props: {
          id: "hero-1",
          topBadge: "🚀 مرجع تخصصی تکنولوژی و کالای دیجیتال",
          badgeColor: "#38bdf8",
          title: "تجربه نسل جدید تکنولوژی و اصالت دیجیتال",
          titleSize: 42,
          subtitle:
            "تأمین و عرضه مستقیم پرچمداران سخت‌افزار، گجت‌های هوشمند و تجهیزات دیجیتال با ۱۸ ماه گارانتی طلایی.",
          bgColor: "transparent",
        },
      },
      {
        type: "NativePerspectiveSlider",
        props: {
          id: "slider-1",
          sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
          sectionSubtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی",
        },
      },
      {
        type: "NativeProductCatalog",
        props: {
          id: "catalog-1",
          heading: "کاتالوگ تجهیزات تخصصی و کالای دیجیتال",
          subtitle: "تمامی کالاها با گارانتی اصالت طلایی عرضه می‌شوند",
          limit: 8,
        },
      },
    ];
  }
  return [
    {
      type: "RichTextBlock",
      props: {
        id: "custom-page-" + slug,
        title: title || "صفحه اختصاصی",
        content:
          "محتوای اختصاصی این صفحه را از سایدبار تنظیم کنید یا بلوک‌های دلخواه را به آن اضافه نمایید.",
        bgColor: "transparent",
      },
    },
  ];
}

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>(
    CORE_DEFAULT_PAGES
  );
  const [products, setProducts] = useState<Array<{ id: string; title: string; price: number }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data | null>(null);
  const [renderKey, setRenderKey] = useState<string>("init");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile" | "tablet">("desktop");

  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");

  // مودال ساخت ۱-کلیکی لندینگ‌پیج تبلیغاتی متصل به محصول
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState("جشنواره فروش ویژه با ارسال رایگان");
  const [campaignSlug, setCampaignSlug] = useState("offer-" + Math.floor(100 + Math.random() * 900));
  const [campaignBadge, setCampaignBadge] = useState("🔥 تخفیف محدود ویژه کمپین تبلیغاتی");
  const [campaignProductId, setCampaignProductId] = useState("");
  const [campaignCouponCode, setCampaignCouponCode] = useState("VIP15");

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

  const fetchPagesAndProducts = async () => {
    try {
      const [res, pRes] = await Promise.all([
        fetch("/api/pages", { cache: "no-store" }).catch(() => null),
        fetch("/api/products", { cache: "no-store" }).catch(() => null),
      ]);
      if (res && res.ok) {
        const json = await res.json();
        const map = new Map<string, { id: string; slug: string; title: string }>();
        CORE_DEFAULT_PAGES.forEach((cp) => map.set(cp.slug, cp));
        if (json.success && Array.isArray(json.pages)) {
          json.pages.forEach((dbP: any) => {
            if (dbP?.slug) {
              map.set(dbP.slug, {
                id: String(dbP.id),
                slug: dbP.slug,
                title: dbP.title || dbP.slug,
              });
            }
          });
        }
        setPages(Array.from(map.values()));
      }
      if (pRes && pRes.ok) {
        const pJson = await pRes.json();
        const pList = pJson.data || pJson.products || [];
        const mapped = (Array.isArray(pList) ? pList : []).map((p: any) => ({
          id: String(p.id),
          title: p.title || p.name || "محصول",
          price: Number(p.discount_price || p.price || 0),
        }));
        setProducts(mapped);
        if (mapped.length > 0 && !campaignProductId) {
          setCampaignProductId(mapped[0].id);
        }
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
      if (
        json.success &&
        json.page &&
        json.page.puck_data &&
        Array.isArray(json.page.puck_data.content)
      ) {
        targetData = json.page.puck_data;
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(targetData));
        }
      }
    } catch {}

    let bodyBlocks = targetData?.content
      ? targetData.content.filter(
          (b: any) =>
            b.type !== "HeaderCapsuleBar" &&
            b.type !== "GlobalFooterBlock" &&
            b.type !== "FeaturesGridBlock"
        )
      : [];

    if (bodyBlocks.length === 0) {
      bodyBlocks = getPageSpecificBody(slug, customTitle);
    }

    const mergedData: Data = {
      content: [currentGlobalHeader, ...bodyBlocks, currentGlobalFooter],
      root: { props: { title: customTitle || slug } },
    };

    setPageData(mergedData);
    setRenderKey(slug + "_" + Date.now());
    setLoading(false);
  };

  useEffect(() => {
    fetchPagesAndProducts();
    loadPage("home");
    const ch = supabase
      .channel("realtime-admin-modular-pages")
      .on("postgres_changes", { event: "*", schema: "public", table: "modular_pages" }, () => {
        fetchPagesAndProducts();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار سراسری تغییرات در دیتابیس...");
    const cleanContent = (data.content || []).filter((b: any) => b.type !== "FeaturesGridBlock");
    const sanitizedData = { ...data, content: cleanContent };

    const newHeaderBlock =
      sanitizedData.content.find((b: any) => b.type === "HeaderCapsuleBar") ||
      DEFAULT_GLOBAL_HEADER;
    const newFooterBlock =
      sanitizedData.content.find((b: any) => b.type === "GlobalFooterBlock") ||
      DEFAULT_GLOBAL_FOOTER;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          GLOBAL_NAV_KEY,
          JSON.stringify({ header: newHeaderBlock, footer: newFooterBlock })
        );
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
      setToast("✓ صفحه «/" + (currentSlug === "home" ? "" : currentSlug) + "» با موفقیت در دیتابیس ذخیره و منتشر شد.");
    } catch {
      setToast("خطا در ذخیره‌سازی.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleCreateNewPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageSlug.trim()) return;
    soundEngine.playSuccess();
    const cleanSlug = newPageSlug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const title = newPageTitle.trim();
    setPages((prev) => [...prev, { id: "page_" + Date.now(), slug: cleanSlug, title }]);
    setShowNewPageModal(false);
    setNewPageTitle("");
    setNewPageSlug("");
    loadPage(cleanSlug, title);
  };

  const handleGenerateCampaignLandingPage = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    const cleanSlug = campaignSlug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const selProd = products.find((p) => p.id === campaignProductId) || products[0];
    const prodName = selProd ? selProd.title : "محصول ویژه آکسون کور";
    const prodPrice = selProd ? selProd.price.toLocaleString("fa-IR") + " تومان" : "قیمت ویژه جشنواره";
    const { header: currentGlobalHeader, footer: currentGlobalFooter } = getGlobalHeaderFooter();

    const campaignData: Data = {
      content: [
        currentGlobalHeader,
        {
          type: "NativeHero3D",
          props: {
            id: "hero-campaign-" + Date.now(),
            topBadge: campaignBadge,
            badgeColor: "#38bdf8",
            title: campaignTitle + " — " + prodName,
            titleSize: 38,
            subtitle:
              "عرضه مستقیم " +
              prodName +
              " با قیمت استثنایی " +
              prodPrice +
              " + کد تخفیف ویژه «" +
              campaignCouponCode +
              "» و ۱۸ ماه گارانتی اصالت طلایی آکسون.",
            bgColor: "transparent",
          },
        },
        {
          type: "RichTextBlock",
          props: {
            id: "campaign-details-" + Date.now(),
            title: "چرا خرید " + prodName + " از جشنواره رسمی آکسون کور؟",
            content:
              "• تضمین ۱۰۰٪ اصالت فیزیکی و تست تخصصی قبل از ارسال | • بسته‌بندی ضدضربه و ارسال فوری با پست پیشتاز | • امکان استفاده از کد تخفیف «" +
              campaignCouponCode +
              "» در مرحله تسویه‌حساب.",
            bgColor: "transparent",
          },
        },
        {
          type: "NativeProductCatalog",
          props: {
            id: "campaign-catalog-" + Date.now(),
            heading: "انتخاب و خرید آنلاین با تخفیف جشنواره",
            subtitle: "روی محصول کلیک کنید یا مستقیماً به سبد خرید اضافه نمایید",
            limit: 8,
          },
        },
        currentGlobalFooter,
      ],
      root: { props: { title: campaignTitle } },
    };

    try {
      await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: cleanSlug,
          title: campaignTitle,
          puck_data: campaignData,
          is_published: true,
        }),
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_PREFIX + cleanSlug, JSON.stringify(campaignData));
      }
      setPages((prev) => [
        ...prev.filter((x) => x.slug !== cleanSlug),
        { id: "camp_" + Date.now(), slug: cleanSlug, title: "🎯 " + campaignTitle },
      ]);
      setCurrentSlug(cleanSlug);
      setPageData(campaignData);
      setRenderKey(cleanSlug + "_" + Date.now());
      setShowCampaignModal(false);
      soundEngine.playSuccess();
      setToast(
        "🎉 لندینگ‌پیج تبلیغاتی شما در آدرس «/" +
          cleanSlug +
          "» ساخته و منتشر شد! هم‌اکنون می‌توانید آن را ویرایش یا لینک آن را در تبلیغات قرار دهید."
      );
      setTimeout(() => setToast(null), 5000);
    } catch {}
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : "/" + currentSlug;

  return (
    <div
      className="w-full flex flex-col font-sans select-text min-h-screen space-y-4 text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">صفحه فعال:</span>
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
            onClick={() => {
              soundEngine.playClick();
              setShowCampaignModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-black shadow-lg cursor-pointer transition flex items-center gap-1.5"
          >
            <span>🎯</span>
            <span>ساخت ۱-کلیکی لندینگ‌پیج تبلیغاتی محصول</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowNewPageModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black shadow-md cursor-pointer transition flex items-center gap-1"
          >
            <span>➕</span>
            <span>صفحه جدید</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setViewportMode("desktop")}
              className={
                "px-2.5 py-1.5 rounded-lg transition cursor-pointer " +
                (viewportMode === "desktop" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
              }
            >
              🖥️ دسکتاپ
            </button>
            <button
              type="button"
              onClick={() => setViewportMode("mobile")}
              className={
                "px-2.5 py-1.5 rounded-lg transition cursor-pointer " +
                (viewportMode === "mobile" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
              }
            >
              📱 موبایل
            </button>
            <button
              type="button"
              onClick={() => setViewportMode("tablet")}
              className={
                "px-2.5 py-1.5 rounded-lg transition cursor-pointer " +
                (viewportMode === "tablet" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
              }
            >
              📟 تبلت
            </button>
          </div>
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده صفحه ({targetLiveUrl})</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-black animate-fadeIn">
          {toast}
        </div>
      )}

      {/* مودال ساخت ۱-کلیکی لندینگ‌پیج تبلیغاتی متصل به محصول */}
      {showCampaignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans"
          dir="rtl"
        >
          <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 shadow-2xl text-[var(--text-primary)] text-xs">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm text-emerald-400 flex items-center gap-2">
                <span>🎯</span> ساخت ۱-کلیکی لندینگ‌پیج کمپین تبلیغاتی (متصل به محصول)
              </h3>
              <button
                type="button"
                onClick={() => setShowCampaignModal(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleGenerateCampaignLandingPage} className="space-y-4">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  ۱. انتخاب محصول هدف از کاتالوگ:
                </label>
                <select
                  value={campaignProductId}
                  onChange={(e) => setCampaignProductId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      📦 {p.title} ({p.price.toLocaleString("fa-IR")} تومان)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  ۲. تیتر اصلی لندینگ‌پیج تبلیغاتی *:
                </label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    ۳. آدرس اختصاصی لندینگ‌پیج (Slug) *:
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={campaignSlug}
                    onChange={(e) => setCampaignSlug(e.target.value)}
                    placeholder="vip-offer"
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    ۴. کد تخفیف نمایشی در لندینگ:
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={campaignCouponCode}
                    onChange={(e) => setCampaignCouponCode(e.target.value.toUpperCase())}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer"
                >
                  🚀 تولید و انتشار فوری لندینگ‌پیج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewPageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn font-sans"
          dir="rtl"
        >
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
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  عنوان فارسی صفحه *
                </label>
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
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  آدرس انگلیسی / نامک (Slug) *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
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

      <div
        className={
          "mx-auto transition-all duration-300 rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[880px] " +
          (viewportMode === "mobile"
            ? "w-full max-w-[420px]"
            : viewportMode === "tablet"
            ? "w-full max-w-[820px]"
            : "w-full")
        }
      >
        {loading || !pageData ? (
          <div className="py-32 text-center text-xs font-bold text-slate-400">
            در حال لود صفحه و همگام‌سازی...
          </div>
        ) : (
          <Puck key={renderKey} config={puckConfig} data={pageData} onPublish={handleSave} />
        )}
      </div>
    </div>
  );
}
