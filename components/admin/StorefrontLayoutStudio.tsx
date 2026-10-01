// File Path: components/admin/StorefrontLayoutStudio.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

const GLOBAL_NAV_KEY = "axon_global_header_footer_v2026";
const STORAGE_PREFIX = "axon_puck_page_data_v2026_";

export interface HomeSectionConfig {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  enabled: boolean;
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

export default function StorefrontLayoutStudio() {
  const [activeTab, setActiveTab] = useState<"header" | "footer" | "sections">("header");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<"logo" | "favicon" | "footerLogo" | null>(null);

  // استیت‌های هدر و فاوآیکون
  const [brandName, setBrandName] = useState("Axon | آکسون");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("/favicon.ico");
  const [announcementText, setAnnouncementText] = useState("ارسال سریع و رایگان سفارش‌های ویژه به سراسر کشور 🚀");
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [ctaText, setCtaText] = useState("کاتالوگ محصولات");
  const [ctaUrl, setCtaUrl] = useState("/products");
  const [headerBg, setHeaderBg] = useState("#07090e");

  // استیت‌های فوتر و اینماد
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
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const updateSectionText = (id: string, field: "title" | "subtitle", val: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
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

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setFeedback(null);

    const themeConfig = {
      globalHeader: {
        brandName: brandName.trim(),
        logoText: brandName.trim(),
        logoUrl: logoUrl.trim(),
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
        brandTitle: footerTitle.trim() || brandName.trim(),
        brandSubtitle: footerSubtitle.trim(),
        supportPhone: supportPhone.trim(),
        supportEmail: supportEmail.trim(),
        warehouseAddress: warehouseAddress.trim(),
        workingHours: workingHours.trim(),
        enamadCode: enamadEnabled ? enamadCode.trim() : "",
        enamadLink: enamadLink.trim(),
        enamadEnabled,
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
        logoWidth: 36,
        logoHeight: 36,
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

      // همگام‌سازی مستقیم با صفحه‌ساز ماژولار (home) و localStorage
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
      setFeedback("✓ تمامی تغییرات استودیوی ظاهر، هدر، فوتر، فاوآیکون، اینماد و چینش سکشن‌ها به صورت بلادرنگ در کل سایت اعمال شد.");
    } catch {
      setFeedback("خطا در ذخیره‌سازی تنظیمات.");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4500);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🎨</span> استودیوی یکپارچه ظاهر، هدر، فوتر، اینماد و چینش سکشن‌ها
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            کنترل ۱۰۰٪ واقعی هدر، فاوآیکون تب مرورگر، فوتر، نماد اعتماد و چیدمان سکشن‌های صفحه اصلی با وب‌سوکت بلادرنگ
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال انتشار در کل سایت..." : "💾 ذخیره و انتشار آنی در کل سایت"}
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold animate-fadeIn">
          {feedback}
        </div>
      )}

      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-black">
        {[
          { id: "header", label: "🧭 هدر، لوگو و فاوآیکون تب مرورگر" },
          { id: "footer", label: "🏛️ فوتر، اطلاعات تماس و نشان اینماد" },
          { id: "sections", label: "📑 چینش و مدیریت سکشن‌های صفحه اصلی" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab(t.id as any);
            }}
            className={
              "flex-1 py-3 px-4 rounded-xl transition cursor-pointer text-center whitespace-nowrap " +
              (activeTab === t.id
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-bold">
          در حال بارگذاری تنظیمات استودیوی ظاهر...
        </div>
      ) : (
        <form onSubmit={handleSaveAll} className="space-y-6 text-xs">
          {activeTab === "header" && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
              <h3 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                تنظیمات هدر سراسری، لوگو و آیکون تب مرورگر (Favicon)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام برند در هدر و تب مرورگر:</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">رنگ پس‌زمینه کپسول هدر:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={headerBg}
                      onChange={(e) => setHeaderBg(e.target.value)}
                      className="w-12 h-11 rounded-xl border border-[var(--card-border)] cursor-pointer bg-transparent"
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
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تصویر لوگوی اصلی هدر:</label>
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
                      className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer shrink-0"
                    >
                      ☁️ آپلود لوگو
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
                      className="px-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold cursor-pointer shrink-0"
                    >
                      ☁️ آپلود فاوآیکون
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">متن دکمه اصلی هدر (CTA):</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">لینک دکمه اصلی هدر:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block font-bold text-[var(--text-secondary)]">متن نوار اعلان بالای سایت (Announcement Bar):</label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                  <label className="flex items-center gap-2 font-bold cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={announcementEnabled}
                      onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                      className="rounded accent-[var(--accent-blue)]"
                    />
                    <span>نمایش فعال نوار اعلان در بالای تمامی صفحات</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "footer" && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
              <h3 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                تنظیمات فوتر سراسری، اطلاعات پشتیبانی و نماد اعتماد الکترونیکی (اینماد)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">زیرعنوان معرفی در فوتر:</label>
                  <input
                    type="text"
                    value={footerSubtitle}
                    onChange={(e) => setFooterSubtitle(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شماره تماس پشتیبانی:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">ایمیل پشتیبانی:</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نشانی دفتر / انبار مرکزی:</label>
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

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کد رهگیری نشان اینماد:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={enamadCode}
                    onChange={(e) => setEnamadCode(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">لینک مستقیم استعلام اینماد (اختیاری):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={enamadLink}
                    onChange={(e) => setEnamadLink(e.target.value)}
                    placeholder="https://trustseal.enamad.ir/..."
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">متن کپی‌رایت فوتر:</label>
                  <input
                    type="text"
                    value={copyrightText}
                    onChange={(e) => setCopyrightText(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enamadEnabled}
                      onChange={(e) => setEnamadEnabled(e.target.checked)}
                      className="rounded accent-[var(--accent-blue)]"
                    />
                    <span>نمایش نشان رسمی اعتماد الکترونیکی (eNamad) در فوتر سایت</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sections" && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
              <div className="border-b border-[var(--card-border)] pb-3">
                <h3 className="text-sm font-black text-[var(--accent-blue)]">
                  مدیریت ترتیب، نمایش و عناوین سکشن‌های صفحه اصلی
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  با دکمه‌های ⬆️ و ⬇️ ترتیب سکشن‌ها را جابجا کنید یا هر بخش را فعال/غیرفعال نمایید:
                </p>
              </div>

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
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-mono font-black text-[10px]">
                          ردیف {idx + 1}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">({sec.type})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => updateSectionText(sec.id, "title", e.target.value)}
                          placeholder="عنوان سکشن"
                          className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
                        />
                        <input
                          type="text"
                          value={sec.subtitle}
                          onChange={(e) => updateSectionText(sec.id, "subtitle", e.target.value)}
                          placeholder="زیرعنوان سکشن"
                          className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs outline-none focus:border-[var(--accent-blue)]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, "up")}
                        disabled={idx === 0}
                        className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] disabled:opacity-30 cursor-pointer"
                        title="انتقال به بالا"
                      >
                        ⬆️
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, "down")}
                        disabled={idx === sections.length - 1}
                        className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] disabled:opacity-30 cursor-pointer"
                        title="انتقال به پایین"
                      >
                        ⬇️
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        className={
                          "px-3.5 py-2 rounded-xl font-black text-xs cursor-pointer transition " +
                          (sec.enabled
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30")
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
      )}

      <MediaUploadModal
        isOpen={uploadTarget !== null}
        bucket="site-assets"
        title={
          uploadTarget === "favicon"
            ? "آپلود آیکون تب مرورگر (Favicon)"
            : "آپلود لوگوی رسمی برند"
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
