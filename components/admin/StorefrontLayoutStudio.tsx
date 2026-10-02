"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import MediaUploadModal from "@/components/admin/MediaUploadModal";
import AdminMenu from "@/components/AdminMenu";
import AdminModularPages from "@/components/admin/AdminModularPages";

export type StudioTabType = "header" | "footer" | "sections" | "menus" | "page_builder";

export interface HomeSectionConfig {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  enabled: boolean;
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
  },
  {
    id: "sec_perspective",
    type: "NativePerspectiveSlider",
    title: "نمایشگاه تعاملی سه‌بعدی محصولات پرچمدار (ویژه موبایل)",
    subtitle: "بررسی لایه‌به‌‌لایه و ساختار مهندسی قطعات با کنترل لمسی در موبایل",
    enabled: true,
  },
  {
    id: "sec_catalog",
    type: "NativeProductCatalog",
    title: "کاتالوگ تجهیزات و محصولات (ویژه دسکتاپ و تبلت)",
    subtitle: "تمامی کالاها با گارانتی اصالت طلایی، تست سلامت فیزیکی و ارسال پیشتاز عرضه می‌شوند",
    enabled: true,
  },
];

const COLUMN_LABELS: Record<string, string> = {
  brand: "۱. ستون لوگو، معرفی برند و نشانی",
  quick_links: "۲. ستون لینک‌های دسترسی سریع",
  support: "۳. ستون پشتیبانی و لینک‌های رسمی (ترب/سایت‌مپ)",
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

  // استیت‌های هدر و لوگو
  const [brandName, setBrandName] = useState("آکسون کور | Axon Core");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoWidth, setLogoWidth] = useState<number>(38);
  const [logoHeight, setLogoHeight] = useState<number>(38);
  const [logoRadius, setLogoRadius] = useState<string>("12px");
  const [logoObjectFit, setLogoObjectFit] = useState<"contain" | "cover">("contain");
  const [faviconUrl, setFaviconUrl] = useState("/favicon.ico");
  const [headerVariant, setHeaderVariant] = useState<"capsule" | "full-width">("capsule");
  const [headerHeight, setHeaderHeight] = useState<number>(60);
  const [announcementText, setAnnouncementText] = useState(
    "ارسال سریع و رایگان سفارش‌های ویژه به سراسر کشور 🚀"
  );
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [ctaText, setCtaText] = useState("کاتالوگ محصولات");
  const [ctaUrl, setCtaUrl] = useState("/products");
  const [headerBg, setHeaderBg] = useState("#07090e");

  // استیت‌های فوتر و اینماد
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

  // لینک‌های ستون دسترسی سریع و لینک‌های خارجی فوتر
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

  // استیت چینش سکشن‌های صفحه اصلی
  const [sections, setSections] = useState<HomeSectionConfig[]>(DEFAULT_HOME_SECTIONS);

  const loadStudioConfig = async () => {
    try {
      const [siteRes, themeRes] = await Promise.all([
        fetch("/api/site-info", { cache: "no-store" }).catch(() => null),
        fetch("/api/theme-builder", { cache: "no-store" }).catch(() => null),
      ]);

      if (siteRes && siteRes.ok) {
        const sJson = await siteRes.json();
        const info = sJson.data || {};
        const layoutCfg = info.homepage_layout_config || {};
        if (info.site_name) setBrandName(info.site_name);
        if (info.logo_url) setLogoUrl(info.logo_url);
        if (info.favicon_url) setFaviconUrl(info.favicon_url);
        if (info.phone) setSupportPhone(info.phone);
        if (info.email) setSupportEmail(info.email);
        if (info.address) setWarehouseAddress(info.address);
        if (info.working_hours) setWorkingHours(info.working_hours);
        if (layoutCfg.header?.variant) setHeaderVariant(layoutCfg.header.variant);
        if (layoutCfg.header?.height) setHeaderHeight(Number(layoutCfg.header.height));
      }

      if (themeRes && themeRes.ok) {
        const tJson = await themeRes.json();
        const cfg = tJson.config;
        if (cfg) {
          if (cfg.globalHeader) {
            const gh = cfg.globalHeader;
            if (gh.brandName) setBrandName(gh.brandName);
            if (gh.logoUrl !== undefined) setLogoUrl(gh.logoUrl);
            if (gh.logoWidth) setLogoWidth(Number(gh.logoWidth));
            if (gh.logoHeight) setLogoHeight(Number(gh.logoHeight));
            if (gh.logoRadius) setLogoRadius(gh.logoRadius);
            if (gh.logoObjectFit) setLogoObjectFit(gh.logoObjectFit);
            if (gh.faviconUrl) setFaviconUrl(gh.faviconUrl);
            if (gh.ctaText) setCtaText(gh.ctaText);
            if (gh.ctaUrl) setCtaUrl(gh.ctaUrl);
            if (gh.bgColor) setHeaderBg(gh.bgColor);
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
          if (Array.isArray(cfg.homeSections) && cfg.homeSections.length > 0) {
            setSections(cfg.homeSections);
          }
        }
      }
    } catch (e) {
      console.error("Error loading layout studio:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudioConfig();

    const channel = supabase
      .channel("realtime-storefront-layout-studio")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        loadStudioConfig();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        textColor: "#ffffff",
      },
      globalFooter: {
        footerLogoUrl: footerLogoUrl.trim() || logoUrl.trim(),
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
      homeSections: sections,
    };

    try {
      const [tRes, sRes] = await Promise.all([
        fetch("/api/theme-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: themeConfig }),
        }),
        fetch("/api/site-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site_name: brandName.trim(),
            logo_url: logoUrl.trim(),
            favicon_url: faviconUrl.trim() || "/favicon.ico",
            phone: supportPhone.trim(),
            email: supportEmail.trim(),
            address: warehouseAddress.trim(),
            working_hours: workingHours.trim(),
            header_announcement: announcementText.trim(),
            theme_builder_config: themeConfig,
          }),
        }),
      ]);

      if (tRes.ok || sRes.ok) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("axon_site_info_cache_permanent_v2026");
          window.dispatchEvent(new CustomEvent("site_info_updated", { detail: themeConfig }));
          window.dispatchEvent(new CustomEvent("theme_builder_updated", { detail: themeConfig }));
        }
        soundEngine.playSuccess();
        setFeedback(
          "✓ تمامی تغییرات هدر، لوگو، چیدمان و ستون‌های فوتر، اینماد و سکشن‌ها در دیتابیس ذخیره شد و در کل سایت فعال گردید."
        );
      } else {
        setFeedback("خطا در ذخیره اطلاعات در سرور.");
      }
    } catch {
      setFeedback("خطا در ارتباط با سرور.");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4500);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🎨</span> مرکز فرماندهی یکپارچه ظاهر، هدر، فوتر، منوها و صفحه‌ساز ماژولار
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            کنترل ۱۰۰٪ اجزای هدر، ابعاد لوگو، چیدمان ستون‌ها و لینک‌های فوتر، درخت منوهای ۳ سطحی و صفحه‌ساز ماژولار در یک پنل واحد
          </p>
        </div>

        {activeTab !== "menus" && activeTab !== "page_builder" && (
          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="w-full lg:w-auto px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال انتشار در کل سایت..." : "💾 ذخیره و انتشار آنی در کل سایت"}
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-fadeIn">
          {feedback}
        </div>
      )}

      {/* ۵ تب یکپارچه (ادغام استودیوی ظاهر + منوها + صفحه‌ساز ماژولار) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-black">
        {[
          { id: "header", label: "🧭 ۱. هدر، لوگو و فاوآیکون" },
          { id: "footer", label: "🏛️ ۲. فوتر، ستون‌ها و اینماد" },
          { id: "sections", label: "📑 ۳. چینش سکشن‌های سایت" },
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
              "py-3 px-3 rounded-xl transition cursor-pointer text-center truncate " +
              (activeTab === t.id
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "menus" && <AdminMenu />}
      {activeTab === "page_builder" && <AdminModularPages />}

      {loading && activeTab !== "menus" && activeTab !== "page_builder" ? (
        <div className="p-12 text-center text-xs text-slate-400 font-bold">
          در حال بارگذاری تنظیمات استودیوی ظاهر...
        </div>
      ) : activeTab !== "menus" && activeTab !== "page_builder" ? (
        <form onSubmit={handleSaveAll} className="space-y-6 text-xs">
          {activeTab === "header" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
                <h3 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                  تنظیمات کامل هدر، ویرایشگر ابعاد لوگو و فاوآیکون
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                      نام برند در هدر:
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                      قالب ظاهری هدر:
                    </label>
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
                    <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                      تصویر لوگوی هدر:
                    </label>
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
                        className="px-3.5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer shrink-0"
                      >
                        ☁️ آپلود
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                      آیکون تب مرورگر (Favicon):
                    </label>
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
                        className="px-3.5 py-3 rounded-2xl bg-indigo-600 text-white font-bold cursor-pointer shrink-0"
                      >
                        ☁️ آپلود
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                  <h4 className="font-black text-xs text-[var(--accent-blue)]">
                    📐 ویرایشگر دقیق ابعاد و استایل لوگو (اعمال هم‌زمان در هدر و فوتر):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-slate-400">
                        عرض لوگو (px):
                      </label>
                      <input
                        type="number"
                        min={20}
                        max={200}
                        value={logoWidth}
                        onChange={(e) => setLogoWidth(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-slate-400">
                        ارتفاع لوگو (px):
                      </label>
                      <input
                        type="number"
                        min={20}
                        max={120}
                        value={logoHeight}
                        onChange={(e) => setLogoHeight(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-slate-400">
                        گردی کادر لوگو:
                      </label>
                      <select
                        value={logoRadius}
                        onChange={(e) => setLogoRadius(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                      >
                        <option value="0px">مربعی (0px)</option>
                        <option value="8px">ملایم (8px)</option>
                        <option value="12px">استاندارد (12px)</option>
                        <option value="999px">دایره‌ای کامل</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-slate-400">
                        حالت برش تصویر:
                      </label>
                      <select
                        value={logoObjectFit}
                        onChange={(e) => setLogoObjectFit(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                      >
                        <option value="contain">نمایش کامل (Contain)</option>
                        <option value="cover">پر کردن کادر (Cover)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block font-bold text-[var(--text-secondary)]">
                    متن نوار اعلان بالای سایت:
                  </label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementEnabled}
                      onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                      className="rounded accent-[var(--accent-blue)]"
                    />
                    <span>نمایش فعال نوار اعلان بالای سایت</span>
                  </label>
                </div>
              </div>

              <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col justify-between space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
                  <h4 className="font-black text-sm">پیش‌نمایش زنده ریسپانسیو</h4>
                  <div className="flex gap-1 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={
                        "px-2.5 py-1 rounded-lg cursor-pointer " +
                        (previewDevice === "desktop" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
                      }
                    >
                      🖥️ دسکتاپ
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("tablet")}
                      className={
                        "px-2.5 py-1 rounded-lg cursor-pointer " +
                        (previewDevice === "tablet" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
                      }
                    >
                      📟 تبلت
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={
                        "px-2.5 py-1 rounded-lg cursor-pointer " +
                        (previewDevice === "mobile" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
                      }
                    >
                      📱 موبایل
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center bg-[var(--input-bg)] rounded-2xl p-4 border border-[var(--card-border)] overflow-hidden">
                  <div
                    className={
                      "transition-all duration-300 space-y-2 " +
                      (previewDevice === "mobile"
                        ? "w-[270px]"
                        : previewDevice === "tablet"
                        ? "w-[360px]"
                        : "w-full")
                    }
                  >
                    {announcementEnabled && (
                      <div className="p-2 rounded-xl bg-[var(--accent-blue)] text-white text-[10px] font-bold text-center truncate">
                        {announcementText}
                      </div>
                    )}
                    <div
                      style={{ backgroundColor: headerBg }}
                      className={
                        "p-3.5 border border-white/10 flex items-center justify-between gap-2 text-white shadow-xl " +
                        (headerVariant === "capsule" ? "rounded-full px-5" : "rounded-2xl")
                      }
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Logo"
                            style={{
                              width: logoWidth + "px",
                              height: logoHeight + "px",
                              borderRadius: logoRadius,
                              objectFit: logoObjectFit,
                            }}
                            className="border border-white/15 shrink-0"
                          />
                        ) : (
                          <div
                            style={{
                              width: logoWidth + "px",
                              height: logoHeight + "px",
                              borderRadius: logoRadius,
                            }}
                            className="bg-sky-500 text-white flex items-center justify-center font-black shrink-0"
                          >
                            A
                          </div>
                        )}
                        <span className="font-black text-xs truncate">{brandName}</span>
                      </div>
                      <span className="px-3 py-1.5 rounded-full bg-sky-500 text-white text-[10px] font-black shrink-0">
                        🛒 0
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "footer" && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
              <h3 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                کنترل کامل فوتر: جابه‌جایی ستون‌ها، تغییر اندازه نوشته‌ها، ویرایش لینک‌ها و نشان اینماد
              </h3>

              {/* جابه‌جایی ترتیب ۴ ستون فوتر */}
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                <span className="font-black text-[var(--accent-blue)] block">
                  🔄 ترتیب و چیدمان ستون‌های فوتر (با دکمه‌ها جابه‌جا کنید):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {columnOrder.map((colKey, idx) => (
                    <div
                      key={colKey}
                      className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2"
                    >
                      <span className="font-bold text-[11px] truncate">
                        {COLUMN_LABELS[colKey] || colKey}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveFooterColumn(idx, "right")}
                          className="p-1.5 rounded-lg bg-[var(--input-bg)] disabled:opacity-30 cursor-pointer"
                          title="انتقال به راست"
                        >
                          ➡️
                        </button>
                        <button
                          type="button"
                          disabled={idx === columnOrder.length - 1}
                          onClick={() => moveFooterColumn(idx, "left")}
                          className="p-1.5 rounded-lg bg-[var(--input-bg)] disabled:opacity-30 cursor-pointer"
                          title="انتقال به چپ"
                        >
                          ⬅️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* اندازه نوشته‌ها و فاصله‌های فوتر */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    اندازه نوشته‌های فوتر:
                  </label>
                  <select
                    value={footerScale}
                    onChange={(e) => setFooterScale(e.target.value as any)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                  >
                    <option value="compact">فشرده و ظریف (Compact)</option>
                    <option value="normal">استاندارد (Normal)</option>
                    <option value="large">بزرگ و برجسته (Large)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    فاصله عمودی و ارتفاع فوتر:
                  </label>
                  <select
                    value={footerPadding}
                    onChange={(e) => setFooterPadding(e.target.value as any)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                  >
                    <option value="compact">کم‌ارتفاع و جمع‌وجور</option>
                    <option value="normal">استاندارد</option>
                    <option value="relaxed">مرتفع و باز (Relaxed)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    تصویر لوگوی فوتر (اختیاری):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={footerLogoUrl}
                      onChange={(e) => setFooterLogoUrl(e.target.value)}
                      placeholder="خالی = همان لوگوی هدر"
                      className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadTarget("footerLogo")}
                      className="px-3.5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer shrink-0"
                    >
                      ☁️
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    عنوان برند در فوتر:
                  </label>
                  <input
                    type="text"
                    value={footerTitle}
                    onChange={(e) => setFooterTitle(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    زیرعنوان معرفی در فوتر:
                  </label>
                  <input
                    type="text"
                    value={footerSubtitle}
                    onChange={(e) => setFooterSubtitle(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    شماره تماس پشتیبانی:
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    ایمیل پشتیبانی:
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    نشانی دفتر / انبار مرکزی:
                  </label>
                  <input
                    type="text"
                    value={warehouseAddress}
                    onChange={(e) => setWarehouseAddress(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    ساعات پاسخگویی:
                  </label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
              </div>

              {/* مدیریت لینک‌های ستون دسترسی سریع */}
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                <h4 className="font-black text-xs text-[var(--accent-blue)]">
                  📑 مدیریت لینک‌های ستون «دسترسی سریع» در فوتر:
                </h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newQuickTitle}
                    onChange={(e) => setNewQuickTitle(e.target.value)}
                    placeholder="عنوان لینک (مثال: قوانین و مقررات)"
                    className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={newQuickUrl}
                    onChange={(e) => setNewQuickUrl(e.target.value)}
                    placeholder="/about"
                    className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickLink}
                    className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shrink-0"
                  >
                    + افزودن لینک
                  </button>
                </div>
                <div className="space-y-2">
                  {quickLinks.map((lnk, idx) => (
                    <div
                      key={lnk.id}
                      className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full">
                        <input
                          type="text"
                          value={lnk.title}
                          onChange={(e) => {
                            const copy = [...quickLinks];
                            copy[idx] = { ...copy[idx], title: e.target.value };
                            setQuickLinks(copy);
                          }}
                          className="p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={lnk.url}
                          onChange={(e) => {
                            const copy = [...quickLinks];
                            copy[idx] = { ...copy[idx], url: e.target.value };
                            setQuickLinks(copy);
                          }}
                          className="p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuickLinks(quickLinks.filter((x) => x.id !== lnk.id))}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 font-bold cursor-pointer self-end sm:self-center"
                      >
                        🗑️️ حذف
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* مدیریت لینک‌های خارجی (ترب، سایت‌مپ و...) */}
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                <h4 className="font-black text-xs text-[var(--accent-blue)]">
                  🔗 مدیریت لینک‌های سامانه‌های رسمی در فوتر (ترب، ایمالز، شبکه‌های اجتماعی و...):
                </h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newExtTitle}
                    onChange={(e) => setNewExtTitle(e.target.value)}
                    placeholder="عنوان لینک (مثال: مشاهده در ترب)"
                    className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={newExtUrl}
                    onChange={(e) => setNewExtUrl(e.target.value)}
                    placeholder="/api/torob یا https://..."
                    className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddExternalLink}
                    className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shrink-0"
                  >
                    + افزودن به فوتر
                  </button>
                </div>

                <div className="space-y-2">
                  {externalLinks.map((lnk, idx) => (
                    <div
                      key={lnk.id}
                      className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full">
                        <input
                          type="text"
                          value={lnk.title}
                          onChange={(e) => {
                            const copy = [...externalLinks];
                            copy[idx] = { ...copy[idx], title: e.target.value };
                            setExternalLinks(copy);
                          }}
                          className="p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={lnk.url}
                          onChange={(e) => {
                            const copy = [...externalLinks];
                            copy[idx] = { ...copy[idx], url: e.target.value };
                            setExternalLinks(copy);
                          }}
                          className="p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExternalLinks(externalLinks.filter((x) => x.id !== lnk.id))
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 font-bold cursor-pointer self-end sm:self-center"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* تنظیمات اینماد و کپی‌رایت */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--card-border)]">
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    کد رهگیری نشان اینماد:
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={enamadCode}
                    onChange={(e) => setEnamadCode(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    لینک مستقیم استعلام اینماد:
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={enamadLink}
                    onChange={(e) => setEnamadLink(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    متن کپی‌رایت پایین فوتر:
                  </label>
                  <input
                    type="text"
                    value={copyrightText}
                    onChange={(e) => setCopyrightText(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enamadEnabled}
                    onChange={(e) => setEnamadEnabled(e.target.checked)}
                    className="rounded accent-[var(--accent-blue)]"
                  />
                  <span>نمایش فعال لوگوی رسمی اینماد در فوتر</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === "sections" && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
              <h3 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                مدیریت ترتیب، ویرایش عناوین و فعال/مخفی‌سازی سکشن‌های صفحه اصلی
              </h3>
              <div className="space-y-3">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={
                      "p-4 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 " +
                      (sec.enabled
                        ? "bg-[var(--input-bg)] border-[var(--card-border)]"
                        : "bg-black/20 border-rose-500/20 opacity-60")
                    }
                  >
                    <div className="flex-1 space-y-2 w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, "up")}
                        disabled={idx === 0}
                        className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                      >
                        ⬆️
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, "down")}
                        disabled={idx === sections.length - 1}
                        className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                      >
                        ⬇️
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        className={
                          "px-3.5 py-2 rounded-xl font-black cursor-pointer " +
                          (sec.enabled
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-rose-500/15 text-rose-400")
                        }
                      >
                        {sec.enabled ? "فعال ✓" : "مخفی ✕"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      ) : null}

      <MediaUploadModal
        isOpen={uploadTarget !== null}
        bucket="site-assets"
        title={
          uploadTarget === "favicon"
            ? "آپلود آیکون تب مرورگر (Favicon)"
            : uploadTarget === "footerLogo"
            ? "آپلود لوگوی فوتر"
            : "آپلود لوگوی اصلی هدر"
        }
        onClose={() => setUploadTarget(null)}
        onUploadSuccess={(url) => {
          if (uploadTarget === "logo") setLogoUrl(url);
          if (uploadTarget === "favicon") setFaviconUrl(url);
          if (uploadTarget === "footerLogo") setFooterLogoUrl(url);
          setUploadTarget(null);
        }}
      />
    </div>
  );
}
