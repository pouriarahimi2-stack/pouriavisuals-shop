"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import MediaUploadModal from "@/components/admin/MediaUploadModal";
import AdminMenu from "@/components/AdminMenu";
import AdminModularPages from "@/components/admin/AdminModularPages";
import { applyFaviconToDOM } from "@/lib/realtimeSync";

export type StudioTabType = "header" | "footer" | "sections" | "menus" | "page_builder";

export interface HomeSectionConfig {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
}

export interface FooterLinkItem {
  id: string;
  title: string;
  url: string;
  show?: boolean;
}

const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = [
  {
    id: "sec_banners",
    type: "banners_slider",
    title: "اسلایدر بنرهای تبلیغاتی و محصولات ویژه (بالای صفحه)",
    subtitle: "نمایش بنرهای کلیک‌پذیر متصل به صفحات محصول در بالاترین بخش سایت",
    enabled: true,
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true,
  },
  {
    id: "sec_perspective",
    type: "NativePerspectiveSlider",
    title: "نمایشگاه تعاملی سه‌بعدی محصولات پرچمدار (ویژه موبایل)",
    subtitle: "بررسی لایه‌به‌لایه و ساختار مهندسی قطعات با کنترل لمسی در موبایل",
    enabled: true,
    showOnMobile: true,
    showOnTablet: false,
    showOnDesktop: false,
  },
  {
    id: "sec_catalog",
    type: "NativeProductCatalog",
    title: "کاتالوگ تجهیزات و محصولات (ویژه دسکتاپ و تبلت)",
    subtitle: "تمامی کالاها با گارانتی اصالت طلایی، تست سلامت فیزیکی و ارسال پیشتاز عرضه می‌شوند",
    enabled: true,
    showOnMobile: false,
    showOnTablet: true,
    showOnDesktop: true,
  },
];

const COLUMN_LABELS: Record<string, string> = {
  brand: "۱. ستون لوگو، معرفی برند و نشانی",
  quick_links: "۲. ستون لینک‌های دسترسی سریع",
  support: "۳. ستون پشتیبانی و لینک‌های رسمی",
  enamad: "۴. ستون نشان رسمی اینماد",
};

export default function StorefrontLayoutStudio({
  defaultTab = "header",
}: {
  defaultTab?: StudioTabType;
}) {
  const [activeTab, setActiveTab] = useState<StudioTabType>(defaultTab);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<"logo" | "favicon" | "footerLogo" | null>(null);

  // ۱. استیت‌های هدر، فاوآیکون و نوار اعلان
  const [brandName, setBrandName] = useState("آکسون کور | Axon Core");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoWidth, setLogoWidth] = useState<number>(38);
  const [logoHeight, setLogoHeight] = useState<number>(38);
  const [logoRadius, setLogoRadius] = useState<string>("12px");
  const [logoObjectFit, setLogoObjectFit] = useState<"contain" | "cover">("contain");
  const [faviconUrl, setFaviconUrl] = useState("/favicon.ico");
  const [headerVariant, setHeaderVariant] = useState<"capsule" | "full-width">("capsule");
  const [headerHeight, setHeaderHeight] = useState<number>(60);
  const [announcementText, setAnnouncementText] = useState("ارسال سریع سفارش‌ها به سراسر کشور 🚀");
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [ctaText, setCtaText] = useState("کاتالوگ محصولات");
  const [ctaUrl, setCtaUrl] = useState("/products");
  const [headerBg, setHeaderBg] = useState("");

  // ۲. استیت‌های فوتر و اینماد
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [footerTitle, setFooterTitle] = useState("آکسون کور | Axon Core");
  const [footerSubtitle, setFooterSubtitle] = useState(
    "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال"
  );
  const [footerDesc, setFooterDesc] = useState("");
  const [footerScale, setFooterScale] = useState<"compact" | "normal" | "large">("normal");
  const [footerPadding, setFooterPadding] = useState<"compact" | "normal" | "relaxed">("normal");
  const [footerBgColor, setFooterBgColor] = useState("");
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "brand",
    "quick_links",
    "support",
    "enamad",
  ]);
  const [supportPhone, setSupportPhone] = useState("09376110200");
  const [supportEmail, setSupportEmail] = useState("Pouriarahimi@yahoo.com");
  const [warehouseAddress, setWarehouseAddress] = useState("شیراز - ستارخان");
  const [workingHours, setWorkingHours] = useState("شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰");
  const [enamadCode, setEnamadCode] = useState("7434404");
  const [enamadLink, setEnamadLink] = useState(
    "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
  );
  const [enamadEnabled, setEnamadEnabled] = useState(true);
  const [copyrightText, setCopyrightText] = useState(
    "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026"
  );

  const [quickLinks, setQuickLinks] = useState<FooterLinkItem[]>([
    { id: "q1", title: "🛍️ کاتالوگ محصولات دیجیتال", url: "/products", show: true },
    { id: "q2", title: "📡 رادار اخبار تکنولوژی", url: "/news", show: true },
    { id: "q3", title: "📚 مجله تخصصی و راهنمای خرید", url: "/blog", show: true },
    { id: "q4", title: "📦 پیگیری لحظه‌ای سفارشات", url: "/track-order", show: true },
  ]);
  const [newQuickTitle, setNewQuickTitle] = useState("");
  const [newQuickUrl, setNewQuickUrl] = useState("");

  const [externalLinks, setExternalLinks] = useState<FooterLinkItem[]>([
    { id: "ext_torob", title: "فید رسمی محصولات در ترب (Torob)", url: "/api/torob", show: true },
    { id: "ext_sitemap", title: "نقشه سایت گوگل (Sitemap)", url: "/sitemap.xml", show: true },
  ]);
  const [newExtTitle, setNewExtTitle] = useState("");
  const [newExtUrl, setNewExtUrl] = useState("");

  // ۳. استیت‌های ابعاد بنر و چینش ریسپانسیو سکشن‌ها در موبایل، تبلت و دسکتاپ
  const [sections, setSections] = useState<HomeSectionConfig[]>(DEFAULT_HOME_SECTIONS);
  const [bannerMobileHeight, setBannerMobileHeight] = useState<number>(160);
  const [bannerTabletHeight, setBannerTabletHeight] = useState<number>(250);
  const [bannerDesktopHeight, setBannerDesktopHeight] = useState<number>(340);
  const [bannerMobileImgSize, setBannerMobileImgSize] = useState<number>(90);
  const [bannerDesktopImgSize, setBannerDesktopImgSize] = useState<number>(220);
  const [bannerMobileLayout, setBannerMobileLayout] = useState<"horizontal" | "vertical">("horizontal");

  const loadStudioConfig = async () => {
    try {
      const res = await fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return;
      const tJson = await res.json();
      const cfg = tJson.config;
      if (!cfg) return;

      if (cfg.globalHeader) {
        const gh = cfg.globalHeader;
        if (gh.brandName !== undefined) setBrandName(gh.brandName);
        if (gh.logoUrl !== undefined) setLogoUrl(gh.logoUrl);
        if (gh.logoWidth) setLogoWidth(Number(gh.logoWidth));
        if (gh.logoHeight) setLogoHeight(Number(gh.logoHeight));
        if (gh.logoRadius) setLogoRadius(gh.logoRadius);
        if (gh.logoObjectFit) setLogoObjectFit(gh.logoObjectFit);
        if (gh.faviconUrl !== undefined) setFaviconUrl(gh.faviconUrl);
        if (gh.variant) setHeaderVariant(gh.variant);
        if (gh.height) setHeaderHeight(Number(gh.height));
        if (gh.ctaText !== undefined) setCtaText(gh.ctaText);
        if (gh.ctaUrl !== undefined) setCtaUrl(gh.ctaUrl);
        if (gh.bgColor !== undefined) setHeaderBg(gh.bgColor);
        if (gh.announcementText !== undefined) setAnnouncementText(gh.announcementText);
        if (gh.announcementEnabled !== undefined) {
          setAnnouncementEnabled(Boolean(gh.announcementEnabled));
        }
      }

      if (cfg.globalFooter) {
        const gf = cfg.globalFooter;
        if (gf.footerLogoUrl !== undefined) setFooterLogoUrl(gf.footerLogoUrl);
        if (gf.brandTitle !== undefined) setFooterTitle(gf.brandTitle);
        if (gf.brandSubtitle !== undefined) setFooterSubtitle(gf.brandSubtitle);
        if (gf.brandDescription !== undefined) setFooterDesc(gf.brandDescription);
        if (gf.scaleMode) setFooterScale(gf.scaleMode);
        if (gf.paddingMode) setFooterPadding(gf.paddingMode);
        if (gf.bgColor !== undefined) setFooterBgColor(gf.bgColor);
        if (Array.isArray(gf.columnOrder) && gf.columnOrder.length === 4) {
          setColumnOrder(gf.columnOrder);
        }
        if (gf.supportPhone !== undefined) setSupportPhone(gf.supportPhone);
        if (gf.supportEmail !== undefined) setSupportEmail(gf.supportEmail);
        if (gf.warehouseAddress !== undefined) setWarehouseAddress(gf.warehouseAddress);
        if (gf.workingHours !== undefined) setWorkingHours(gf.workingHours);
        if (gf.enamadCode !== undefined) setEnamadCode(gf.enamadCode);
        if (gf.enamadLink !== undefined) setEnamadLink(gf.enamadLink);
        if (gf.enamadEnabled !== undefined) setEnamadEnabled(Boolean(gf.enamadEnabled));
        if (gf.copyright !== undefined) setCopyrightText(gf.copyright);
        if (Array.isArray(gf.quickLinks)) setQuickLinks(gf.quickLinks);
        if (Array.isArray(gf.externalLinks)) setExternalLinks(gf.externalLinks);
      }

      if (cfg.bannerSizing) {
        const bs = cfg.bannerSizing;
        if (bs.mobileHeight) setBannerMobileHeight(Number(bs.mobileHeight));
        if (bs.tabletHeight) setBannerTabletHeight(Number(bs.tabletHeight));
        if (bs.desktopHeight) setBannerDesktopHeight(Number(bs.desktopHeight));
        if (bs.mobileImageSize) setBannerMobileImgSize(Number(bs.mobileImageSize));
        if (bs.desktopImageSize) setBannerDesktopImgSize(Number(bs.desktopImageSize));
        if (bs.mobileLayout) setBannerMobileLayout(bs.mobileLayout);
      }

      if (Array.isArray(cfg.homeSections) && cfg.homeSections.length > 0) {
        setSections(
          cfg.homeSections.map((s: any) => ({
            ...s,
            showOnMobile:
              s.showOnMobile !== undefined
                ? Boolean(s.showOnMobile)
                : s.type !== "NativeProductCatalog",
            showOnTablet:
              s.showOnTablet !== undefined
                ? Boolean(s.showOnTablet)
                : s.type !== "NativePerspectiveSlider",
            showOnDesktop:
              s.showOnDesktop !== undefined
                ? Boolean(s.showOnDesktop)
                : s.type !== "NativePerspectiveSlider",
          }))
        );
      }
    } catch (e) {
      console.error("Studio load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudioConfig();
  }, []);

  const moveSection = (index: number, dir: "up" | "down") => {
    soundEngine.playClick();
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setSections(copy);
  };

  const toggleSection = (id: string) => {
    soundEngine.playClick();
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const toggleSectionDevice = (
    id: string,
    field: "showOnMobile" | "showOnTablet" | "showOnDesktop"
  ) => {
    soundEngine.playClick();
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const cur =
          s[field] !== undefined
            ? Boolean(s[field])
            : field === "showOnMobile"
            ? s.type !== "NativeProductCatalog"
            : s.type !== "NativePerspectiveSlider";
        return { ...s, [field]: !cur };
      })
    );
  };

  const updateSectionText = (id: string, field: "title" | "subtitle", val: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  };

  const moveFooterColumn = (index: number, dir: "left" | "right") => {
    soundEngine.playClick();
    const target = dir === "right" ? index - 1 : index + 1;
    if (target < 0 || target >= columnOrder.length) return;
    const copy = [...columnOrder];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setColumnOrder(copy);
  };

  const handleAddQuickLink = () => {
    if (!newQuickTitle.trim() || !newQuickUrl.trim()) return;
    soundEngine.playClick();
    setQuickLinks((prev) => [
      ...prev,
      { id: "q_" + Date.now(), title: newQuickTitle.trim(), url: newQuickUrl.trim(), show: true },
    ]);
    setNewQuickTitle("");
    setNewQuickUrl("");
  };

  const handleAddExternalLink = () => {
    if (!newExtTitle.trim() || !newExtUrl.trim()) return;
    soundEngine.playClick();
    setExternalLinks((prev) => [
      ...prev,
      { id: "ext_" + Date.now(), title: newExtTitle.trim(), url: newExtUrl.trim(), show: true },
    ]);
    setNewExtTitle("");
    setNewExtUrl("");
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setFeedback(null);

    const themeConfig = {
      globalHeader: {
        brandName: brandName.trim(),
        logoText: brandName.trim(),
        logoUrl: logoUrl.trim(),
        logoWidth,
        logoHeight,
        logoRadius,
        logoObjectFit,
        faviconUrl: faviconUrl.trim() || "/favicon.ico",
        variant: headerVariant,
        height: headerHeight,
        announcementText: announcementText.trim(),
        announcementEnabled,
        ctaText: ctaText.trim(),
        ctaUrl: ctaUrl.trim() || "/products",
        bgColor: headerBg,
      },
      globalFooter: {
        footerLogoUrl: footerLogoUrl.trim(),
        logoWidth,
        logoHeight,
        logoRadius,
        brandTitle: footerTitle.trim(),
        brandSubtitle: footerSubtitle.trim(),
        brandDescription: footerDesc.trim(),
        scaleMode: footerScale,
        paddingMode: footerPadding,
        bgColor: footerBgColor.trim(),
        columnOrder,
        supportPhone: supportPhone.trim(),
        supportEmail: supportEmail.trim(),
        warehouseAddress: warehouseAddress.trim(),
        workingHours: workingHours.trim(),
        enamadCode: enamadEnabled ? enamadCode.trim() : "",
        enamadLink: enamadLink.trim(),
        enamadEnabled,
        quickLinks,
        externalLinks,
        copyright: copyrightText.trim(),
      },
      bannerSizing: {
        mobileHeight: bannerMobileHeight,
        tabletHeight: bannerTabletHeight,
        desktopHeight: bannerDesktopHeight,
        mobileImageSize: bannerMobileImgSize,
        desktopImageSize: bannerDesktopImgSize,
        mobileLayout: bannerMobileLayout,
      },
      homeSections: sections,
    };

    try {
      const res = await fetch("/api/theme-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: themeConfig }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        if (themeConfig.globalHeader.faviconUrl) {
          applyFaviconToDOM(themeConfig.globalHeader.faviconUrl);
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem("axon_site_info_cache_permanent_v2026");
          window.dispatchEvent(
            new CustomEvent("theme_builder_updated", {
              detail: json.siteInfo || { homepage_layout_config: { theme_builder_config: themeConfig } },
            })
          );
        }
        setFeedback(
          json.message ||
            "✓ تمامی تنظیمات هدر، نوار اعلان، فاوآیکون، فوتر و ابعاد بنر موبایل/دسکتاپ ذخیره و به صورت زنده در سایت اعمال شد."
        );
      } else {
        setFeedback(json.message || "خطا در ذخیره تنظیمات.");
      }
    } catch {
      setFeedback("خطا در برقراری ارتباط با سرور.");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      {/* هدر اصلی استودیوی ظاهر */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🎨</span> مرکز فرماندهی یکپارچه ظاهر، هدر، فوتر، منوها و صفحه‌ساز ماژولار
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            کنترل ۱۰۰٪ اجزای هدر، ابعاد لوگو، نوار اعلان، فوتر، ابعاد بنر موبایل/تبلت/دسکتاپ و درخت منو در یک پنل واحد
          </p>
        </div>

        <button
          type="button"
          disabled={saving || loading}
          onClick={() => handleSaveAll()}
          className="w-full lg:w-auto px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-xl hover:opacity-90 transition cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال ذخیره و انتشار زنده..." : "💾 ذخیره و انتشار آنی در کل سایت"}
        </button>
      </div>

      {/* ۵ تب اصلی استودیو */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-black">
        {[
          { id: "header", label: "🧭 ۱. هدر، لوگو و فاوآیکون" },
          { id: "footer", label: "🏛️ ۲. فوتر، ستون‌ها و اینماد" },
          { id: "sections", label: "📑 ۳. چینش سکشن‌ها و ابعاد بنر" },
          { id: "menus", label: "🌳 ۴. منوها و دسته‌بندی‌ها" },
          { id: "page_builder", label: "⚡ ۵. صفحه‌ساز ماژولار" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab(t.id as StudioTabType);
            }}
            className={
              "py-3 px-3 rounded-2xl transition cursor-pointer text-center " +
              (activeTab === t.id
                ? "bg-[var(--accent-blue)] text-white shadow-lg"
                : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-black animate-fadeIn">
          {feedback}
        </div>
      )}

      {activeTab === "menus" && <AdminMenu />}
      {activeTab === "page_builder" && <AdminModularPages />}

      {(activeTab === "header" || activeTab === "footer" || activeTab === "sections") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* ستون تنظیمات (۷ ستون) */}
          <form
            onSubmit={handleSaveAll}
            className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5"
          >
            {activeTab === "header" && (
              <div className="space-y-5">
                <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                  تنظیمات کامل هدر، ویرایشگر ابعاد لوگو، فاوآیکون و نوار اعلان
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام برند در هدر:</label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">قالب ظاهری هدر:</label>
                    <select
                      value={headerVariant}
                      onChange={(e) => setHeaderVariant(e.target.value as any)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                    >
                      <option value="capsule">کپسولی شناور مدرن (Capsule)</option>
                      <option value="full-width">تمام‌عرض کلاسیک (Full Width)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تصویر لوگوی هدر:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadTarget("logo")}
                        className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shrink-0"
                      >
                        ☁️ آپلود
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">آیکون تب مرورگر (Favicon):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={faviconUrl}
                        onChange={(e) => setFaviconUrl(e.target.value)}
                        placeholder="/favicon.ico"
                        className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadTarget("favicon")}
                        className="px-4 py-3 rounded-2xl bg-indigo-600 text-white font-black cursor-pointer shrink-0"
                      >
                        ☁️ آپلود
                      </button>
                    </div>
                  </div>
                </div>

                {/* ابعاد لوگو */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                  <span className="font-black text-[var(--accent-blue)] block">
                    📐 ویرایشگر دقیق ابعاد و استایل لوگو:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block mb-1 text-[11px] font-bold text-[var(--text-secondary)]">عرض لوگو (px):</label>
                      <input
                        type="number"
                        min={20}
                        max={180}
                        value={logoWidth}
                        onChange={(e) => setLogoWidth(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[11px] font-bold text-[var(--text-secondary)]">ارتفاع لوگو (px):</label>
                      <input
                        type="number"
                        min={20}
                        max={120}
                        value={logoHeight}
                        onChange={(e) => setLogoHeight(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[11px] font-bold text-[var(--text-secondary)]">گردی کادر لوگو:</label>
                      <select
                        value={logoRadius}
                        onChange={(e) => setLogoRadius(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                      >
                        <option value="0px">مربعی (0px)</option>
                        <option value="8px">نرم (8px)</option>
                        <option value="12px">استاندارد (12px)</option>
                        <option value="9999px">دایره‌ای کامل</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-[11px] font-bold text-[var(--text-secondary)]">حالت برش تصویر:</label>
                      <select
                        value={logoObjectFit}
                        onChange={(e) => setLogoObjectFit(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                      >
                        <option value="contain">نمایش کامل (Contain)</option>
                        <option value="cover">پر کردن کادر (Cover)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* نوار اعلان بالای سایت */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                  <label className="block font-bold text-[var(--text-secondary)]">متن نوار اعلان بالای سایت:</label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="ارسال سریع سفارش‌ها به سراسر کشور 🚀"
                    className="w-full p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                  <label className="flex items-center gap-2 font-black cursor-pointer text-[var(--accent-blue)]">
                    <input
                      type="checkbox"
                      checked={announcementEnabled}
                      onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[var(--accent-blue)] rounded cursor-pointer"
                    />
                    <span>نمایش فعال نوار اعلان بالای سایت</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === "footer" && (
              <div className="space-y-5">
                <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                  مدیریت کامل فوتر، لوگوی فوتر، متن معرفی، ترتیب ستون‌ها و اینماد
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">عنوان برند در فوتر:</label>
                    <input
                      type="text"
                      value={footerTitle}
                      onChange={(e) => setFooterTitle(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">زیرعنوان فوتر:</label>
                    <input
                      type="text"
                      value={footerSubtitle}
                      onChange={(e) => setFooterSubtitle(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تصویر لوگوی فوتر (اختیاری):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={footerLogoUrl}
                        onChange={(e) => setFooterLogoUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadTarget("footerLogo")}
                        className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shrink-0"
                      >
                        ☁️ آپلود لوگوی فوتر
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">متن معرفی و توضیحات فوتر:</label>
                    <textarea
                      rows={3}
                      value={footerDesc}
                      onChange={(e) => setFooterDesc(e.target.value)}
                      placeholder="توضیحات درباره فروشگاه و تضمین اصالت کالاها..."
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تلفن پشتیبانی فوتر:</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">ایمیل پشتیبانی فوتر:</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نشانی فیزیکی در فوتر:</label>
                    <input
                      type="text"
                      value={warehouseAddress}
                      onChange={(e) => setWarehouseAddress(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">ساعات پاسخگویی:</label>
                    <input
                      type="text"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">متن کپی‌رایت پایین فوتر:</label>
                    <input
                      type="text"
                      value={copyrightText}
                      onChange={(e) => setCopyrightText(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                  </div>
                </div>

                {/* ترتیب ستون‌های فوتر */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
                  <span className="font-black text-[var(--accent-blue)] block">
                    🔄 ترتیب قرارگیری ۴ ستون فوتر (راست به چپ):
                  </span>
                  <div className="space-y-2">
                    {columnOrder.map((colKey, idx) => (
                      <div
                        key={colKey}
                        className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between"
                      >
                        <span className="font-bold">{COLUMN_LABELS[colKey] || colKey}</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveFooterColumn(idx, "right")}
                            className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                          >
                            ⬆️ بالاتر
                          </button>
                          <button
                            type="button"
                            disabled={idx === columnOrder.length - 1}
                            onClick={() => moveFooterColumn(idx, "left")}
                            className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                          >
                            ⬇️ پایین‌تر
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sections" && (
              <div className="space-y-5">
                {/* کنترل مستقیم ارتفاع بنر در موبایل، تبلت و دسکتاپ */}
                <div className="p-4 sm:p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/40 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-2.5">
                    <h3 className="font-black text-sm text-[var(--accent-blue)]">
                      📐 کنترل اندازه و ارتفاع بنر تبلیغاتی در موبایل، تبلت و دسکتاپ
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setBannerMobileHeight(160);
                        setBannerTabletHeight(250);
                        setBannerDesktopHeight(340);
                        setBannerMobileImgSize(90);
                        setBannerDesktopImgSize(220);
                        setBannerMobileLayout("horizontal");
                      }}
                      className="px-3 py-1 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold cursor-pointer"
                    >
                      بازنشانی به استاندارد
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span>📱 ارتفاع بنر موبایل:</span>
                        <span className="font-mono font-black text-[var(--accent-blue)]">{bannerMobileHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min={110}
                        max={320}
                        step={5}
                        value={bannerMobileHeight}
                        onChange={(e) => setBannerMobileHeight(Number(e.target.value))}
                        className="w-full accent-[var(--accent-blue)] cursor-pointer"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span>📟 ارتفاع بنر تبلت:</span>
                        <span className="font-mono font-black text-[var(--accent-blue)]">{bannerTabletHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min={180}
                        max={400}
                        step={5}
                        value={bannerTabletHeight}
                        onChange={(e) => setBannerTabletHeight(Number(e.target.value))}
                        className="w-full accent-[var(--accent-blue)] cursor-pointer"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span>🖥️ ارتفاع بنر دسکتاپ:</span>
                        <span className="font-mono font-black text-[var(--accent-blue)]">{bannerDesktopHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min={220}
                        max={500}
                        step={10}
                        value={bannerDesktopHeight}
                        onChange={(e) => setBannerDesktopHeight(Number(e.target.value))}
                        className="w-full accent-[var(--accent-blue)] cursor-pointer"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span>📱 اندازه عکس در موبایل:</span>
                        <span className="font-mono font-black text-emerald-500">{bannerMobileImgSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={60}
                        max={150}
                        step={5}
                        value={bannerMobileImgSize}
                        onChange={(e) => setBannerMobileImgSize(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span>🖥️ اندازه عکس در دسکتاپ:</span>
                        <span className="font-mono font-black text-emerald-500">{bannerDesktopImgSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={140}
                        max={320}
                        step={5}
                        value={bannerDesktopImgSize}
                        onChange={(e) => setBannerDesktopImgSize(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
                      <span className="block font-bold">📱 چیدمان بنر در موبایل:</span>
                      <select
                        value={bannerMobileLayout}
                        onChange={(e) => setBannerMobileLayout(e.target.value as any)}
                        className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                      >
                        <option value="horizontal">افقی جمع‌وجور (پیشنهادی)</option>
                        <option value="vertical">عمودی (عکس بالای متن)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* لیست سکشن‌ها با کنترل مستقل موبایل، تبلت و دسکتاپ */}
                <div className="space-y-3">
                  <h3 className="font-black text-sm text-[var(--accent-blue)]">
                    مدیریت نمایش سکشن‌ها به تفکیک 📱 موبایل، 📟 تبلت و 🖥️ دسکتاپ
                  </h3>
                  {sections.map((sec, idx) => {
                    const mobOn = sec.showOnMobile ?? sec.type !== "NativeProductCatalog";
                    const tabOn = sec.showOnTablet ?? sec.type !== "NativePerspectiveSlider";
                    const deskOn = sec.showOnDesktop ?? sec.type !== "NativePerspectiveSlider";

                    return (
                      <div
                        key={sec.id}
                        className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-black text-xs text-[var(--text-primary)]">
                            {idx + 1}. {sec.title}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveSection(idx, "up")}
                              className="px-2.5 py-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                            >
                              ⬆️️
                            </button>
                            <button
                              type="button"
                              disabled={idx === sections.length - 1}
                              onClick={() => moveSection(idx, "down")}
                              className="px-2.5 py-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                            >
                              ⬇️
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSection(sec.id)}
                              className={
                                "px-3 py-1 rounded-xl font-black cursor-pointer " +
                                (sec.enabled
                                  ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-500 border border-rose-500/30")
                              }
                            >
                              {sec.enabled ? "فعال ✓" : "غیرفعال"}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => updateSectionText(sec.id, "title", e.target.value)}
                            className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                          />
                          <input
                            type="text"
                            value={sec.subtitle}
                            onChange={(e) => updateSectionText(sec.id, "subtitle", e.target.value)}
                            className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => toggleSectionDevice(sec.id, "showOnMobile")}
                            className={
                              "px-3 py-1.5 rounded-xl text-[11px] font-black border transition cursor-pointer " +
                              (mobOn
                                ? "bg-sky-500/15 border-sky-500/40 text-sky-500"
                                : "bg-[var(--modal-bg)] border-[var(--card-border)] text-slate-400 opacity-60")
                            }
                          >
                            📱 موبایل: {mobOn ? "نمایش فعال ✓" : "مخفی"}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleSectionDevice(sec.id, "showOnTablet")}
                            className={
                              "px-3 py-1.5 rounded-xl text-[11px] font-black border transition cursor-pointer " +
                              (tabOn
                                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-500"
                                : "bg-[var(--modal-bg)] border-[var(--card-border)] text-slate-400 opacity-60")
                            }
                          >
                            📟 تبلت: {tabOn ? "نمایش فعال ✓" : "مخفی"}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleSectionDevice(sec.id, "showOnDesktop")}
                            className={
                              "px-3 py-1.5 rounded-xl text-[11px] font-black border transition cursor-pointer " +
                              (deskOn
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                                : "bg-[var(--modal-bg)] border-[var(--card-border)] text-slate-400 opacity-60")
                            }
                          >
                            🖥️ دسکتاپ: {deskOn ? "نمایش فعال ✓" : "مخفی"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-xl hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? "در حال ذخیره و انتشار زنده..." : "💾 ذخیره و انتشار آنی تغییرات در کل سایت"}
            </button>
          </form>

          {/* ستون پیش‌نمایش زنده ریسپانسیو (۵ ستون) */}
          <div className="lg:col-span-5 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 h-fit">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <span className="font-black text-sm">پیش‌نمایش زنده ریسپانسیو</span>
              <div className="flex gap-1 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={
                    "px-2.5 py-1 rounded-lg cursor-pointer " +
                    (previewDevice === "desktop" ? "bg-[var(--accent-blue)] text-white" : "")
                  }
                >
                  🖥️ دسکتاپ
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("tablet")}
                  className={
                    "px-2.5 py-1 rounded-lg cursor-pointer " +
                    (previewDevice === "tablet" ? "bg-[var(--accent-blue)] text-white" : "")
                  }
                >
                  📟 تبلت
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={
                    "px-2.5 py-1 rounded-lg cursor-pointer " +
                    (previewDevice === "mobile" ? "bg-[var(--accent-blue)] text-white" : "")
                  }
                >
                  📱 موبایل
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col items-center justify-center min-h-[260px]">
              <div
                className={
                  "transition-all duration-300 space-y-3 " +
                  (previewDevice === "mobile"
                    ? "w-[270px]"
                    : previewDevice === "tablet"
                    ? "w-[350px]"
                    : "w-full")
                }
              >
                {announcementEnabled && announcementText && (
                  <div className="w-full py-1.5 px-3 rounded-xl bg-[#0284c7] text-white text-[10px] font-black text-center shadow">
                    {announcementText}
                  </div>
                )}

                <div className="p-3 rounded-full bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt=""
                        style={{
                          width: Math.min(36, logoWidth) + "px",
                          height: Math.min(36, logoHeight) + "px",
                          borderRadius: logoRadius,
                          objectFit: logoObjectFit,
                        }}
                      />
                    )}
                    <span className="font-black text-xs truncate max-w-[140px]">{brandName}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[var(--accent-blue)] text-white text-[10px] font-black">
                    🛒 0
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] space-y-1">
                  <div className="font-black text-[var(--accent-blue)]">وضعیت ابعاد بنر در این دستگاه:</div>
                  <div className="text-[var(--text-secondary)]">
                    ارتفاع فعلی:{" "}
                    <strong className="font-mono text-[var(--text-primary)]">
                      {previewDevice === "mobile"
                        ? bannerMobileHeight + "px (افقی جمع‌وجور)"
                        : previewDevice === "tablet"
                        ? bannerTabletHeight + "px"
                        : bannerDesktopHeight + "px"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MediaUploadModal
        isOpen={uploadTarget !== null}
        bucket="site-assets"
        title={
          uploadTarget === "favicon"
            ? "آپلود آیکون تب مرورگر (Favicon)"
            : uploadTarget === "footerLogo"
            ? "آپلود لوگوی اختصاصی فوتر"
            : "آپلود لوگوی اصلی هدر"
        }
        currentValue={
          uploadTarget === "favicon"
            ? faviconUrl
            : uploadTarget === "footerLogo"
            ? footerLogoUrl
            : logoUrl
        }
        onClose={() => setUploadTarget(null)}
        onUploadSuccess={(url) => {
          if (uploadTarget === "favicon") setFaviconUrl(url);
          else if (uploadTarget === "footerLogo") setFooterLogoUrl(url);
          else setLogoUrl(url);
          setUploadTarget(null);
        }}
      />
    </div>
  );
}
