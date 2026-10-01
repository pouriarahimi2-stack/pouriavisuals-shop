// File Path: components/admin/StorefrontLayoutStudio.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import MediaUploadModal from "@/components/admin/MediaUploadModal";
import AdminMenu from "@/components/AdminMenu";

const GLOBAL_NAV_KEY = "axon_global_header_footer_v2026";
const STORAGE_PREFIX = "axon_puck_page_data_v2026_";

export interface HomeSectionConfig {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  enabled: boolean;
}

export interface FooterCustomLink {
  id: string;
  title: string;
  url: string;
}

const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = [
  {
    id: "sec_banners",
    type: "banners_slider",
    title: "اسلایدر بنرهای تبلیغاتی و جشنواره‌ها",
    subtitle: "نمایش بنرهای فعال ثبت‌شده در بخش مدیریت بنرها",
    enabled: true,
  },
  {
    id: "sec_hero",
    type: "NativeHero3D",
    title: "تجربه نسل جدید تکنولوژی و اصالت دیجیتال",
    subtitle: "تأمین و عرضه مستقیم پرچمداران سخت‌افزار، گجت‌های هوشمند و تجهیزات دیجیتال با ۱۸ ماه گارانتی طلایی",
    enabled: true,
  },
  {
    id: "sec_perspective",
    type: "NativePerspectiveSlider",
    title: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
    subtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی",
    enabled: true,
  },
  {
    id: "sec_catalog",
    type: "NativeProductCatalog",
    title: "کاتالوگ تجهیزات تخصصی و کالای دیجیتال",
    subtitle: "تمامی کالاها با گارانتی اصالت طلایی عرضه می‌شوند",
    enabled: true,
  },
];

export default function StorefrontLayoutStudio({
  defaultTab = "header",
}: {
  defaultTab?: "header" | "footer" | "sections" | "menus";
}) {
  const [activeTab, setActiveTab] = useState<"header" | "footer" | "sections" | "menus">(defaultTab);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile" | "tablet">("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<"logo" | "favicon" | "footerLogo" | null>(null);

  // استیت‌های هدر، ویرایشگر لوگو و فاوآیکون
  const [brandName, setBrandName] = useState("Axon | آکسون");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoWidth, setLogoWidth] = useState<number>(40);
  const [logoHeight, setLogoHeight] = useState<number>(40);
  const [logoRadius, setLogoRadius] = useState<string>("12px");
  const [logoObjectFit, setLogoObjectFit] = useState<"contain" | "cover">("contain");
  const [faviconUrl, setFaviconUrl] = useState("/favicon.ico");
  const [announcementText, setAnnouncementText] = useState("ارسال سریع و رایگان سفارش‌های ویژه به سراسر کشور 🚀");
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [ctaText, setCtaText] = useState("کاتالوگ محصولات");
  const [ctaUrl, setCtaUrl] = useState("/products");
  const [headerBg, setHeaderBg] = useState("#07090e");

  // استیت‌های فوتر، اینماد و لینک‌های پویا (ترب و...)
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [footerTitle, setFooterTitle] = useState("Axon | آکسون");
  const [footerSubtitle, setFooterSubtitle] = useState("مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال");
  const [supportPhone, setSupportPhone] = useState("09376110200");
  const [supportEmail, setSupportEmail] = useState("Pouriarahimi@yahoo.com");
  const [warehouseAddress, setWarehouseAddress] = useState("شیراز - ستارخان");
  const [workingHours, setWorkingHours] = useState("شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰");
  const [enamadCode, setEnamadCode] = useState("7434404");
  const [enamadLink, setEnamadLink] = useState("");
  const [enamadEnabled, setEnamadEnabled] = useState(true);
  const [copyrightText, setCopyrightText] = useState("تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026");
  const [externalLinks, setExternalLinks] = useState<FooterCustomLink[]>([
    { id: "ext_torob", title: "فید رسمی محصولات در ترب (Torob)", url: "/api/torob" },
    { id: "ext_sitemap", title: "نقشه سایت گوگل (Sitemap)", url: "/sitemap.xml" },
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
        const info = sJson.data || sJson.siteInfo || sJson;
        if (info) {
          if (info.site_name || info.brand_name) setBrandName(info.site_name || info.brand_name);
          if (info.logo_url) setLogoUrl(info.logo_url);
          if (info.favicon_url) setFaviconUrl(info.favicon_url);
          if (info.announcement_text) setAnnouncementText(info.announcement_text);
          if (info.announcement_enabled !== undefined) setAnnouncementEnabled(Boolean(info.announcement_enabled));
          if (info.support_phone) setSupportPhone(info.support_phone);
          if (info.support_email) setSupportEmail(info.support_email);
          if (info.address) setWarehouseAddress(info.address);
          if (info.working_hours) setWorkingHours(info.working_hours);
          if (info.enamad_code) setEnamadCode(info.enamad_code);
          if (info.enamad_link) setEnamadLink(info.enamad_link);
          if (info.enamad_enabled !== undefined) setEnamadEnabled(Boolean(info.enamad_enabled));
          if (info.copyright_text) setCopyrightText(info.copyright_text);
        }
      }

      if (themeRes && themeRes.ok) {
        const tJson = await themeRes.json();
        const cfg = tJson.config;
        if (cfg) {
          if (cfg.globalHeader) {
            if (cfg.globalHeader.brandName) setBrandName(cfg.globalHeader.brandName);
            if (cfg.globalHeader.logoUrl) setLogoUrl(cfg.globalHeader.logoUrl);
            if (cfg.globalHeader.logoWidth) setLogoWidth(Number(cfg.globalHeader.logoWidth));
            if (cfg.globalHeader.logoHeight) setLogoHeight(Number(cfg.globalHeader.logoHeight));
            if (cfg.globalHeader.logoRadius) setLogoRadius(cfg.globalHeader.logoRadius);
            if (cfg.globalHeader.logoObjectFit) setLogoObjectFit(cfg.globalHeader.logoObjectFit);
            if (cfg.globalHeader.faviconUrl) setFaviconUrl(cfg.globalHeader.faviconUrl);
            if (cfg.globalHeader.ctaText) setCtaText(cfg.globalHeader.ctaText);
            if (cfg.globalHeader.ctaUrl) setCtaUrl(cfg.globalHeader.ctaUrl);
            if (cfg.globalHeader.bgColor) setHeaderBg(cfg.globalHeader.bgColor);
            if (cfg.globalHeader.announcementText) setAnnouncementText(cfg.globalHeader.announcementText);
            if (cfg.globalHeader.announcementEnabled !== undefined) {
              setAnnouncementEnabled(Boolean(cfg.globalHeader.announcementEnabled));
            }
          }
          if (cfg.globalFooter) {
            if (cfg.globalFooter.footerLogoUrl) setFooterLogoUrl(cfg.globalFooter.footerLogoUrl);
            if (cfg.globalFooter.brandTitle) setFooterTitle(cfg.globalFooter.brandTitle);
            if (cfg.globalFooter.brandSubtitle) setFooterSubtitle(cfg.globalFooter.brandSubtitle);
            if (cfg.globalFooter.supportPhone) setSupportPhone(cfg.globalFooter.supportPhone);
            if (cfg.globalFooter.supportEmail) setSupportEmail(cfg.globalFooter.supportEmail);
            if (cfg.globalFooter.warehouseAddress) setWarehouseAddress(cfg.globalFooter.warehouseAddress);
            if (cfg.globalFooter.workingHours) setWorkingHours(cfg.globalFooter.workingHours);
            if (cfg.globalFooter.enamadCode) setEnamadCode(cfg.globalFooter.enamadCode);
            if (cfg.globalFooter.enamadLink) setEnamadLink(cfg.globalFooter.enamadLink);
            if (cfg.globalFooter.enamadEnabled !== undefined) {
              setEnamadEnabled(Boolean(cfg.globalFooter.enamadEnabled));
            }
            if (cfg.globalFooter.copyright) setCopyrightText(cfg.globalFooter.copyright);
            if (Array.isArray(cfg.globalFooter.externalLinks)) {
              setExternalLinks(cfg.globalFooter.externalLinks);
            }
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

  const handleAddExternalLink = () => {
    if (!newExtTitle.trim() || !newExtUrl.trim()) return;
    soundEngine.playClick();
    setExternalLinks((prev) => [
      ...prev,
      { id: "ext_" + Date.now(), title: newExtTitle.trim(), url: newExtUrl.trim() },
    ]);
    setNewExtTitle("");
    setNewExtUrl("");
  };

  const applyFaviconInDom = (iconHref: string) => {
    if (typeof document === "undefined" || !iconHref) return;
    const links = document.querySelectorAll("link[rel*='icon']");
    if (links.length > 0) {
      links.forEach((el) => {
        (el as HTMLLinkElement).href = iconHref;
      });
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = iconHref;
      document.head.appendChild(link);
    }
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
        brandTitle: footerTitle.trim() || brandName.trim(),
        brandSubtitle: footerSubtitle.trim(),
        supportPhone: supportPhone.trim(),
        supportEmail: supportEmail.trim(),
        warehouseAddress: warehouseAddress.trim(),
        workingHours: workingHours.trim(),
        enamadCode: enamadEnabled ? enamadCode.trim() : "",
        enamadLink: enamadLink.trim(),
        enamadEnabled,
        externalLinks,
        copyright: copyrightText.trim(),
        bgColor: "#020617",
        textColor: "#94a3b8",
      },
      homeSections: sections,
      designTokens: {
        accentColor: "#0284c7",
        borderRadius: "2xl",
        containerWidth: "7xl",
      },
    };

    const headerCapsuleBlock = {
      type: "HeaderCapsuleBar",
      props: {
        id: "global-header-core",
        brandText: brandName.trim(),
        logoUrl: logoUrl.trim(),
        logoWidth,
        logoHeight,
        menu1Text: ctaText.trim() || "کاتالوگ محصولات",
        menu1Url: ctaUrl.trim() || "/products",
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
        capsuleBg: headerBg,
        capsuleBorder: "#27272a",
      },
    };

    const footerGlobalBlock = {
      type: "GlobalFooterBlock",
      props: {
        id: "global-footer-core",
        footerLogoUrl: footerLogoUrl.trim() || logoUrl.trim(),
        brandTitle: footerTitle.trim() || brandName.trim(),
        brandSubtitle: footerSubtitle.trim(),
        brandDesc: "",
        supportPhone: supportPhone.trim(),
        supportEmail: supportEmail.trim(),
        warehouseAddress: warehouseAddress.trim(),
        workingHours: workingHours.trim(),
        enamadCode: enamadEnabled ? enamadCode.trim() : "",
        copyrightText: copyrightText.trim(),
        footerBg: "#07090e",
      },
    };

    try {
      await Promise.all([
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
            brand_name: brandName.trim(),
            logo_url: logoUrl.trim(),
            favicon_url: faviconUrl.trim() || "/favicon.ico",
            announcement_text: announcementText.trim(),
            announcement_enabled: announcementEnabled,
            support_phone: supportPhone.trim(),
            support_email: supportEmail.trim(),
            address: warehouseAddress.trim(),
            working_hours: workingHours.trim(),
            enamad_code: enamadEnabled ? enamadCode.trim() : "",
            enamad_link: enamadLink.trim(),
            enamad_enabled: enamadEnabled,
            copyright_text: copyrightText.trim(),
            theme_builder_config: themeConfig,
          }),
        }).catch(() => null),
      ]);

      const puckBodyBlocks = sections
        .filter((s) => s.enabled && s.type !== "banners_slider")
        .map((s) => {
          if (s.type === "NativeHero3D") {
            return {
              type: "NativeHero3D",
              props: {
                id: "hero-1",
                topBadge: "🚀 مرجع تخصصی تکنولوژی و کالای دیجیتال",
                badgeColor: "#38bdf8",
                title: s.title,
                titleSize: 42,
                subtitle: s.subtitle,
                bgColor: "transparent",
              },
            };
          }
          if (s.type === "NativePerspectiveSlider") {
            return {
              type: "NativePerspectiveSlider",
              props: {
                id: "slider-1",
                sectionTitle: s.title,
                sectionSubtitle: s.subtitle,
              },
            };
          }
          return {
            type: "NativeProductCatalog",
            props: {
              id: "catalog-1",
              heading: s.title,
              subtitle: s.subtitle,
              limit: 8,
            },
          };
        });

      const homePuckData = {
        content: [headerCapsuleBlock, ...puckBodyBlocks, footerGlobalBlock],
        root: { props: { title: brandName.trim() } },
      };

      await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "home",
          title: "صفحه اصلی",
          puck_data: homePuckData,
          is_published: true,
        }),
      }).catch(() => null);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          GLOBAL_NAV_KEY,
          JSON.stringify({ header: headerCapsuleBlock, footer: footerGlobalBlock })
        );
        localStorage.setItem(STORAGE_PREFIX + "home", JSON.stringify(homePuckData));
        applyFaviconInDom(faviconUrl.trim() || logoUrl.trim() || "/favicon.ico");
        window.dispatchEvent(new CustomEvent("site_info_updated", { detail: themeConfig }));
        window.dispatchEvent(new CustomEvent("theme_builder_updated", { detail: themeConfig }));
      }

      soundEngine.playSuccess();
      setFeedback(
        "✓ تمامی تغییرات هدر، ابعاد لوگو، فوتر، لینک‌های پویا (ترب/اینماد) و سکشن‌ها به صورت بلادرنگ در کل سایت اعمال شد."
      );
    } catch {
      setFeedback("خطا در ذخیره‌سازی تنظیمات.");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4500);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* هدر یکپارچه ادغام استودیوی ظاهر با منو و دسته‌بندی‌ها */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🎨</span> مرکز یکپارچه استودیوی ظاهر، هدر، فوتر، لوگو و درخت منوها
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ادغام کامل تنظیمات هدر، ویرایشگر حرفه‌ای لوگو، لینک‌های پویای فوتر (اینماد/ترب)، چینش سکشن‌ها و منوهای ۳ سطحی
          </p>
        </div>

        {activeTab !== "menus" && (
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
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold animate-fadeIn">
          {feedback}
        </div>
      )}

      {/* زیرمنوهای یکپارچه */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-black">
        {[
          { id: "header", label: "🧭 ۱. هدر، ویرایشگر لوگو و فاوآیکون" },
          { id: "footer", label: "🏛️ ۲. فوتر، اینماد و لینک‌های پویا (ترب)" },
          { id: "sections", label: "📑 ۳. چینش سکشن‌های صفحه اصلی" },
          { id: "menus", label: "🌳 ۴. منوهای درختی و دسته‌بندی‌ها" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab(t.id as any);
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

      {/* تب ۴: منو و دسته‌بندی‌های درختی ادغام‌شده */}
      {activeTab === "menus" && <AdminMenu />}

      {loading && activeTab !== "menus" ? (
        <div className="p-12 text-center text-xs text-slate-400 font-bold">
          در حال بارگذاری تنظیمات استودیوی ظاهر...
        </div>
      ) : activeTab !== "menus" ? (
        <form onSubmit={handleSaveAll} className="space-y-6 text-xs">
          {activeTab === "header" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
                <h3 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                  تنظیمات هدر، ویرایشگر ابعاد لوگو و فاوآیکون تب مرورگر
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام برند در هدر:</label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-[var(--text-secondary)]">رنگ پس‌زمینه هدر:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={headerBg}
                        onChange={(e) => setHeaderBg(e.target.value)}
                        className="w-11 h-11 rounded-xl border border-[var(--card-border)] cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={headerBg}
                        onChange={(e) => setHeaderBg(e.target.value)}
                        className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-[var(--text-secondary)]">تصویر لوگوی اصلی:</label>
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
                    <label className="block mb-1 font-bold text-[var(--text-secondary)]">آیکون تب مرورگر (Favicon):</label>
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

                {/* ویرایشگر حرفه‌ای ابعاد و استایل لوگو */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                  <h4 className="font-black text-xs text-[var(--accent-blue)]">
                    📐 ویرایشگر حرفه‌ای ابعاد و استایل لوگو:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-slate-400">عرض لوگو (px):</label>
                      <input
                        type="number"
                        min={20}
                        max={180}
                        value={logoWidth}
                        onChange={(e) => setLogoWidth(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-slate-400">ارتفاع لوگو (px):</label>
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
                      <label className="block mb-1 text-[10px] font-bold text-slate-400">گردی کادر لوگو:</label>
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
                      <label className="block mb-1 text-[10px] font-bold text-slate-400">حالت برش:</label>
                      <select
                        value={logoObjectFit}
                        onChange={(e) => setLogoObjectFit(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                      >
                        <option value="contain">کامل (Contain)</option>
                        <option value="cover">پر کردن (Cover)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-[var(--text-secondary)]">متن نوار اعلان بالای سایت:</label>
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

              {/* پیش‌نمایش زنده ریسپانسیو هدر و لوگو (دسکتاپ، موبایل، تبلت) */}
              <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col justify-between space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
                  <h4 className="font-black text-sm">پیش‌نمایش زنده هدر و لوگو</h4>
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
                      onClick={() => setPreviewDevice("mobile")}
                      className={
                        "px-2.5 py-1 rounded-lg cursor-pointer " +
                        (previewDevice === "mobile" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
                      }
                    >
                      📱 موبایل
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
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center bg-[var(--input-bg)] rounded-2xl p-4 border border-[var(--card-border)]">
                  <div
                    className={
                      "transition-all duration-300 space-y-2 " +
                      (previewDevice === "mobile"
                        ? "w-[260px]"
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
                      className="p-3.5 rounded-2xl border border-white/10 flex items-center justify-between gap-2 text-white shadow-xl"
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
                      <span className="px-3 py-1.5 rounded-xl bg-sky-500 text-white text-[10px] font-black shrink-0">
                        {ctaText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "footer" && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
              <h3 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                تنظیمات کامل فوتر، نشان اینماد و مدیریت پویا لینک‌های خارجی (ترب، ایمالز و...)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان برند در فوتر:</label>
                  <input
                    type="text"
                    value={footerTitle}
                    onChange={(e) => setFooterTitle(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">زیرعنوان معرفی در فوتر:</label>
                  <input
                    type="text"
                    value={footerSubtitle}
                    onChange={(e) => setFooterSubtitle(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره تماس پشتیبانی:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">ایمیل پشتیبانی:</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">نشانی دفتر / انبار مرکزی:</label>
                  <input
                    type="text"
                    value={warehouseAddress}
                    onChange={(e) => setWarehouseAddress(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">ساعات پاسخگویی:</label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">کد رهگیری نشان اینماد:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={enamadCode}
                    onChange={(e) => setEnamadCode(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">لینک مستقیم استعلام اینماد:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={enamadLink}
                    onChange={(e) => setEnamadLink(e.target.value)}
                    placeholder="https://trustseal.enamad.ir/..."
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>
              </div>

              {/* مدیریت لینک‌های پویا فوتر (ترب، ایمالز و لینک‌های آینده) */}
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                <h4 className="font-black text-xs text-[var(--accent-blue)]">
                  🔗 مدیریت لینک‌های فوتر (ترب، ایمالز، شبکه‌های اجتماعی و لینک‌های آینده):
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

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">متن کپی‌‌رایت فوتر:</label>
                <input
                  type="text"
                  value={copyrightText}
                  onChange={(e) => setCopyrightText(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === "sections" && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
              <h3 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                مدیریت ترتیب، ویرایش عناوین و مخفی‌سازی سکشن‌های صفحه اصلی
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
        title={uploadTarget === "favicon" ? "آپلود آیکون تب مرورگر (Favicon)" : "آپلود لوگوی برند"}
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
