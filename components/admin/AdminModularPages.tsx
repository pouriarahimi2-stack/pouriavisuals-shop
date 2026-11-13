// File Path: components/admin/AdminModularPages.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
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

const CORE_SLUGS_SET = new Set(CORE_DEFAULT_PAGES.map((p) => p.slug));

const DEFAULT_GLOBAL_HEADER = {
  type: "HeaderCapsuleBar",
  props: {
    id: "global-header-core",
    brandText: "آکسون کور | Axon Core",
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
    brandTitle: "آکسون کور | Axon Core",
    brandSubtitle: "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال",
    brandDesc: "",
    supportPhone: "09376110200",
    supportEmail: "Pouriarahimi@yahoo.com",
    warehouseAddress: "شیراز - ستارخان",
    workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
    enamadCode: "7434404",
    copyrightText: "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026",
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
  const [campaignSlug, setCampaignSlug] = useState(
    "offer-" + Math.floor(100 + Math.random() * 900)
  );
  const [campaignBadge, setCampaignBadge] = useState("🔥 تخفیف محدود ویژه کمپین تبلیغاتی");
  const [campaignProductId, setCampaignProductId] = useState("");
  const [campaignCouponCode, setCampaignCouponCode] = useState("VIP15");

  const getGlobalHeaderFooter = async () => {
    let headerBlock = JSON.parse(JSON.stringify(DEFAULT_GLOBAL_HEADER));
    let footerBlock = JSON.parse(JSON.stringify(DEFAULT_GLOBAL_FOOTER));

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(GLOBAL_NAV_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.header) headerBlock = parsed.header;
          if (parsed.footer) footerBlock = parsed.footer;
        }
      } catch {}
    }

    // همگام‌سازی زنده با تنظیمات واقعی هدر، فوتر و منوها از دیتابیس
    try {
      const tbRes = await fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" });
      if (tbRes.ok) {
        const tbJson = await tbRes.json();
        const cfg = tbJson?.config;
        if (cfg) {
          const gh = cfg.globalHeader || {};
          const gf = cfg.globalFooter || {};
          const nav = Array.isArray(cfg.navigation_menu)
            ? cfg.navigation_menu.filter((m: any) => m.is_active !== false)
            : [];

          headerBlock.props = {
            ...headerBlock.props,
            brandText: gh.brandName !== undefined ? gh.brandName : headerBlock.props.brandText,
            logoUrl: gh.logoUrl !== undefined ? gh.logoUrl : headerBlock.props.logoUrl,
            logoWidth: Number(gh.logoWidth || headerBlock.props.logoWidth || 40),
            logoHeight: Number(gh.logoHeight || headerBlock.props.logoHeight || 40),
            menu1Text: nav[0]?.title || headerBlock.props.menu1Text,
            menu1Url: nav[0]?.url || headerBlock.props.menu1Url,
            menu2Text: nav[1]?.title || headerBlock.props.menu2Text,
            menu2Url: nav[1]?.url || headerBlock.props.menu2Url,
            menu3Text: nav[2]?.title || headerBlock.props.menu3Text,
            menu3Url: nav[2]?.url || headerBlock.props.menu3Url,
            menu4Text: nav[3]?.title || headerBlock.props.menu4Text,
            menu4Url: nav[3]?.url || headerBlock.props.menu4Url,
            menu5Text: nav[4]?.title || headerBlock.props.menu5Text,
            menu5Url: nav[4]?.url || headerBlock.props.menu5Url,
          };

          footerBlock.props = {
            ...footerBlock.props,
            footerLogoUrl:
              gf.footerLogoUrl !== undefined ? gf.footerLogoUrl : footerBlock.props.footerLogoUrl,
            brandTitle: gf.brandTitle !== undefined ? gf.brandTitle : footerBlock.props.brandTitle,
            brandSubtitle:
              gf.brandSubtitle !== undefined ? gf.brandSubtitle : footerBlock.props.brandSubtitle,
            brandDesc:
              gf.brandDescription !== undefined ? gf.brandDescription : footerBlock.props.brandDesc,
            supportPhone: gf.supportPhone || footerBlock.props.supportPhone,
            supportEmail: gf.supportEmail || footerBlock.props.supportEmail,
            warehouseAddress: gf.warehouseAddress || footerBlock.props.warehouseAddress,
            workingHours: gf.workingHours || footerBlock.props.workingHours,
            enamadCode: gf.enamadCode !== undefined ? gf.enamadCode : footerBlock.props.enamadCode,
            copyrightText: gf.copyright || footerBlock.props.copyrightText,
          };
        }
      }
    } catch {}

    return { header: headerBlock, footer: footerBlock };
  };

  const fetchPagesAndProducts = useCallback(async () => {
    try {
      const [res, pRes] = await Promise.all([
        fetch("/api/pages?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
        fetch("/api/products?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
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
  }, [campaignProductId]);

  const loadPage = useCallback(async (slug: string, customTitle?: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();
    const { header: currentGlobalHeader, footer: currentGlobalFooter } =
      await getGlobalHeaderFooter();
    let targetData: Data | null = null;

    try {
      const res = await fetch("/api/pages?slug=" + encodeURIComponent(slug) + "&t=" + Date.now(), {
        cache: "no-store",
      });
      const json = await res.json();
      if (
        json.success &&
        json.page &&
        json.page.puck_data &&
        Array.isArray(json.page.puck_data.content)
      ) {
        targetData = json.page.puck_data;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(targetData));
          } catch {}
        }
      }
    } catch {}

    if (!targetData && typeof window !== "undefined") {
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
  }, []);

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
  }, [fetchPagesAndProducts, loadPage]);

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
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentPageObj?.id,
          slug: currentSlug,
          title: pageTitle,
          puck_data: sanitizedData,
          is_published: true,
        }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        setToast(
          "✓ صفحه «/" +
            (currentSlug === "home" ? "" : currentSlug) +
            "» با موفقیت در دیتابیس ذخیره و منتشر شد."
        );
        fetchPagesAndProducts();
      } else {
        setToast("خطا در ذخیره‌سازی صفحه.");
      }
    } catch {
      setToast("خطا در ارتباط با سرور.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleDeleteCurrentPage = async () => {
    if (CORE_SLUGS_SET.has(currentSlug)) return;
    const currentPageObj = pages.find((p) => p.slug === currentSlug);
    if (
      !confirm(
        `آیا از حذف صفحه سفارشی «${currentPageObj?.title || currentSlug}» اطمینان دارید؟`
      )
    ) {
      return;
    }

    soundEngine.playClick();
    try {
      const res = await fetch(
        `/api/pages?slug=${encodeURIComponent(currentSlug)}&id=${encodeURIComponent(
          currentPageObj?.id || ""
        )}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem(STORAGE_PREFIX + currentSlug);
          } catch {}
        }
        soundEngine.playSuccess();
        setToast("✓ صفحه سفارشی با موفقیت حذف شد.");
        setPages((prev) => prev.filter((p) => p.slug !== currentSlug));
        loadPage("home");
      }
    } catch {}
  };

  const handleCreateNewPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageSlug.trim()) return;
    soundEngine.playSuccess();
    const cleanSlug = newPageSlug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const title = newPageTitle.trim();
    setPages((prev) => [
      ...prev.filter((p) => p.slug !== cleanSlug),
      { id: "page_" + Date.now(), slug: cleanSlug, title },
    ]);
    setShowNewPageModal(false);
    setNewPageTitle("");
    setNewPageSlug("");
    await loadPage(cleanSlug, title);
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
    const prodPrice = selProd
      ? selProd.price.toLocaleString("fa-IR") + " تومان"
      : "قیمت ویژه جشنواره";
    const { header: currentGlobalHeader, footer: currentGlobalFooter } =
      await getGlobalHeaderFooter();

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
        try {
          localStorage.setItem(STORAGE_PREFIX + cleanSlug, JSON.stringify(campaignData));
        } catch {}
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
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-2 md:gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-sm md:text-xl shadow-md font-bold">
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

          {!CORE_SLUGS_SET.has(currentSlug) && (
            <button
              type="button"
              onClick={handleDeleteCurrentPage}
              className="px-3 py-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-xs font-black cursor-pointer transition"
              title="حذف این صفحه سفارشی"
            >
              🗑️ حذف صفحه
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setViewportMode("desktop")}
              className={
                "px-2.5 py-1.5 rounded-lg transition cursor-pointer " +
                (viewportMode === "desktop"
                  ? "bg-[var(--accent-blue)] text-white"
                  : "text-slate-400")
              }
            >
              🖥️ دسکتاپ
            </button>
            <button
              type="button"
              onClick={() => setViewportMode("mobile")}
              className={
                "px-2.5 py-1.5 rounded-lg transition cursor-pointer " +
                (viewportMode === "mobile"
                  ? "bg-[var(--accent-blue)] text-white"
                  : "text-slate-400")
              }
            >
              📱 موبایل
            </button>
            <button
              type="button"
              onClick={() => setViewportMode("tablet")}
              className={
                "px-2.5 py-1.5 rounded-lg transition cursor-pointer " +
                (viewportMode === "tablet"
                  ? "bg-[var(--accent-blue)] text-white"
                  : "text-slate-400")
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCampaignModal(false);
          }}
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
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  ۳. بج بالای هیرو (Badge):
                </label>
                <input
                  type="text"
                  value={campaignBadge}
                  onChange={(e) => setCampaignBadge(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    ۴. آدرس اختصاصی لندینگ‌پیج (Slug) *:
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
                    ۵. کد تخفیف نمایشی در لندینگ:
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewPageModal(false);
          }}
        >
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 shadow-2xl text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm text-sky-500 flex items-center gap-2">
                <span>➕</span> ایجاد صفحه سفارشی جدید
              </h3>
              <button
                type="button"
                onClick={() => setShowNewPageModal(false)}
                className="w-7 h-7 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-[var(--input-bg)] text-xs font-bold cursor-pointer"
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