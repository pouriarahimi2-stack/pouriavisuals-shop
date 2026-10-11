"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import MediaUploadModal from "@/components/admin/MediaUploadModal";
import AdminMenu from "@/components/AdminMenu";
import AdminModularPages from "@/components/admin/AdminModularPages";
import { applyFaviconToDOM } from "@/lib/realtimeSync";
import { useSiteInfo } from "@/context/SiteInfoContext";
import { DEFAULT_DEVICE_OFFERS, DeviceSmartOffer } from "@/lib/defaultDeviceConfig";

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
    subtitle: "پیمایش لمسی محصولات در موبایل",
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
  brand: "۱. ستون لوگو و معرفی برند",
  quick_links: "۲. ستون لینک‌های دسترسی سریع",
  support: "۳. ستون پشتیبانی و اطلاعات تماس",
  enamad: "۴. ستون نشان رسمی اینماد",
};

export default function StorefrontLayoutStudio({
  defaultTab = "header",
}: {
  defaultTab?: StudioTabType;
}) {
  const { refresh: refreshGlobalSiteInfo } = useSiteInfo();
  const [activeTab, setActiveTab] = useState<StudioTabType>(defaultTab);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [offerDeviceTab, setOfferDeviceTab] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<"logo" | "favicon" | "footerLogo" | null>(null);

  const [deviceStats, setDeviceStats] = useState({
    mobile: { sharePercent: 72, orders: 0 },
    tablet: { sharePercent: 6, orders: 0 },
    desktop: { sharePercent: 22, orders: 0 },
  });

  // ۱. استیت‌های هدر، فاوآیکون و نوار اعلان
  const [brandName, setBrandName] = useState("آکسون کور | Axon Core");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoWidth, setLogoWidth] = useState<number>(44);
  const [logoHeight, setLogoHeight] = useState<number>(44);
  const [logoRadius, setLogoRadius] = useState<string>("12px");
  const [logoObjectFit, setLogoObjectFit] = useState<"contain" | "cover">("contain");
  const [faviconUrl, setFaviconUrl] = useState("/favicon.ico");
  const [headerVariant, setHeaderVariant] = useState<"capsule" | "full-width">("capsule");
  const [headerHeight, setHeaderHeight] = useState<number>(64);
  const [menuFontSize, setMenuFontSize] = useState<number>(12);
  const [announcementText, setAnnouncementText] = useState("ارسال سریع سفارش‌ها به سراسر کشور 🚀");
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [ctaText, setCtaText] = useState("کاتالوگ محصولات");
  const [ctaUrl, setCtaUrl] = useState("/products");
  const [headerBg, setHeaderBg] = useState("");

  const [deviceOffers, setDeviceOffers] =
    useState<Record<"mobile" | "tablet" | "desktop", DeviceSmartOffer>>(DEFAULT_DEVICE_OFFERS);

  // ۲. استیت‌های کامل فوتر و ابعاد لوگوی فوتر
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [footerLogoWidth, setFooterLogoWidth] = useState<number>(140);
  const [footerLogoHeight, setFooterLogoHeight] = useState<number>(56);
  const [footerLogoRadius, setFooterLogoRadius] = useState<string>("12px");
  const [showFooterLogoBox, setShowFooterLogoBox] = useState<boolean>(false);
  const [footerTitle, setFooterTitle] = useState("");
  const [footerSubtitle, setFooterSubtitle] = useState(
    "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال"
  );
  const [footerDesc, setFooterDesc] = useState("");
  const [showTrustBadges, setShowTrustBadges] = useState<boolean>(true);
  const [badge1Text, setBadge1Text] = useState("ضمانت اصالت کالا");
  const [badge2Text, setBadge2Text] = useState("ارسال سریع سراسری");
  const [quickLinksTitle, setQuickLinksTitle] = useState("دسترسی سریع");
  const [supportTitle, setSupportTitle] = useState("مرکز ارتباط و پشتیبانی");
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

  // ۳. استیت‌های ابعاد بنر و سکشن‌ها
  const [sections, setSections] = useState<HomeSectionConfig[]>(DEFAULT_HOME_SECTIONS);
  const [bannerMobileHeight, setBannerMobileHeight] = useState<number>(160);
  const [bannerTabletHeight, setBannerTabletHeight] = useState<number>(250);
  const [bannerDesktopHeight, setBannerDesktopHeight] = useState<number>(340);
  const [bannerMobileImgSize, setBannerMobileImgSize] = useState<number>(90);
  const [bannerDesktopImgSize, setBannerDesktopImgSize] = useState<number>(220);
  const [bannerMobileLayout, setBannerMobileLayout] = useState<"horizontal" | "vertical">("horizontal");

  const loadStudioConfig = async () => {
    try {
      const [res, statRes] = await Promise.all([
        fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" }),
        fetch("/api/analytics/device", { cache: "no-store" }).catch(() => null),
      ]);

      if (statRes && statRes.ok) {
        const sJson = await statRes.json();
        if (sJson?.stats) {
          setDeviceStats({
            mobile: sJson.stats.mobile || { sharePercent: 72, orders: 0 },
            tablet: sJson.stats.tablet || { sharePercent: 6, orders: 0 },
            desktop: sJson.stats.desktop || { sharePercent: 22, orders: 0 },
          });
        }
      }

      if (!res.ok) return;
      const tJson = await res.json();
      const cfg = tJson.config;
      if (!cfg) return;

      if (cfg.globalHeader) {
        const gh = cfg.globalHeader;
        if (gh.brandName !== undefined) setBrandName(String(gh.brandName));
        if (gh.logoUrl !== undefined) setLogoUrl(String(gh.logoUrl));
        if (gh.logoWidth) setLogoWidth(Number(gh.logoWidth));
        if (gh.logoHeight) setLogoHeight(Number(gh.logoHeight));
        if (gh.logoRadius) setLogoRadius(gh.logoRadius);
        if (gh.logoObjectFit) setLogoObjectFit(gh.logoObjectFit);
        if (gh.faviconUrl !== undefined) setFaviconUrl(String(gh.faviconUrl));
        if (gh.variant) setHeaderVariant(gh.variant);
        if (gh.height) setHeaderHeight(Number(gh.height));
        if (gh.menuFontSize) setMenuFontSize(Number(gh.menuFontSize));
        if (gh.ctaText !== undefined) setCtaText(String(gh.ctaText));
        if (gh.ctaUrl !== undefined) setCtaUrl(String(gh.ctaUrl));
        if (gh.bgColor !== undefined) setHeaderBg(String(gh.bgColor));
        if (gh.announcementText !== undefined) setAnnouncementText(String(gh.announcementText));
        if (gh.announcementEnabled !== undefined) {
          setAnnouncementEnabled(Boolean(gh.announcementEnabled));
        }
      }

      if (cfg.deviceOffers) {
        setDeviceOffers({ ...DEFAULT_DEVICE_OFFERS, ...cfg.deviceOffers });
      }

      if (cfg.globalFooter) {
        const gf = cfg.globalFooter;
        if (gf.footerLogoUrl !== undefined) setFooterLogoUrl(String(gf.footerLogoUrl));
        if (gf.footerLogoWidth) setFooterLogoWidth(Number(gf.footerLogoWidth));
        if (gf.footerLogoHeight) setFooterLogoHeight(Number(gf.footerLogoHeight));
        if (gf.footerLogoRadius) setFooterLogoRadius(String(gf.footerLogoRadius));
        if (gf.showFooterLogoBox !== undefined) setShowFooterLogoBox(Boolean(gf.showFooterLogoBox));
        if (gf.brandTitle !== undefined) setFooterTitle(String(gf.brandTitle));
        if (gf.brandSubtitle !== undefined) setFooterSubtitle(String(gf.brandSubtitle));
        if (gf.brandDescription !== undefined) setFooterDesc(String(gf.brandDescription));
        if (gf.showTrustBadges !== undefined) setShowTrustBadges(Boolean(gf.showTrustBadges));
        if (gf.badge1Text !== undefined) setBadge1Text(String(gf.badge1Text));
        if (gf.badge2Text !== undefined) setBadge2Text(String(gf.badge2Text));
        if (gf.quickLinksTitle !== undefined) setQuickLinksTitle(String(gf.quickLinksTitle));
        if (gf.supportTitle !== undefined) setSupportTitle(String(gf.supportTitle));
        if (gf.scaleMode) setFooterScale(gf.scaleMode);
        if (gf.paddingMode) setFooterPadding(gf.paddingMode);
        if (gf.bgColor !== undefined) setFooterBgColor(String(gf.bgColor));
        if (Array.isArray(gf.columnOrder) && gf.columnOrder.length === 4) {
          setColumnOrder(gf.columnOrder);
        }
        if (gf.supportPhone !== undefined) setSupportPhone(String(gf.supportPhone));
        if (gf.supportEmail !== undefined) setSupportEmail(String(gf.supportEmail));
        if (gf.warehouseAddress !== undefined) setWarehouseAddress(String(gf.warehouseAddress));
        if (gf.workingHours !== undefined) setWorkingHours(String(gf.workingHours));
        if (gf.enamadCode !== undefined) setEnamadCode(String(gf.enamadCode));
        if (gf.enamadLink !== undefined) setEnamadLink(String(gf.enamadLink));
        if (gf.enamadEnabled !== undefined) setEnamadEnabled(Boolean(gf.enamadEnabled));
        if (gf.copyright !== undefined) setCopyrightText(String(gf.copyright));
        if (Array.isArray(gf.quickLinks)) setQuickLinks(gf.quickLinks);
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

  const updateOfferField = (
    dev: "mobile" | "tablet" | "desktop",
    field: keyof DeviceSmartOffer,
    value: any
  ) => {
    setDeviceOffers((prev) => ({
      ...prev,
      [dev]: {
        ...prev[dev],
        [field]: value,
      },
    }));
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

  const persistStudioConfig = async (overrides?: {
    newLogoUrl?: string;
    newFooterLogoUrl?: string;
    newFaviconUrl?: string;
  }) => {
    soundEngine.playClick();
    setSaving(true);
    setFeedback(null);

    const effectiveLogo = overrides?.newLogoUrl !== undefined ? overrides.newLogoUrl : logoUrl;
    const effectiveFooterLogo =
      overrides?.newFooterLogoUrl !== undefined ? overrides.newFooterLogoUrl : footerLogoUrl;
    const effectiveFavicon =
      overrides?.newFaviconUrl !== undefined ? overrides.newFaviconUrl : faviconUrl;

    const themeConfig = {
      globalHeader: {
        brandName: brandName.trim(),
        logoText: brandName.trim(),
        logoUrl: effectiveLogo.trim(),
        logoWidth,
        logoHeight,
        logoRadius,
        logoObjectFit,
        faviconUrl: effectiveFavicon.trim() || "/favicon.ico",
        variant: headerVariant,
        height: headerHeight,
        menuFontSize,
        announcementText: announcementText.trim(),
        announcementEnabled,
        ctaText: ctaText.trim(),
        ctaUrl: ctaUrl.trim() || "/products",
        bgColor: headerBg,
      },
      globalFooter: {
        footerLogoUrl: effectiveFooterLogo.trim(),
        footerLogoWidth,
        footerLogoHeight,
        footerLogoRadius,
        showFooterLogoBox,
        brandTitle: footerTitle.trim(),
        brandSubtitle: footerSubtitle.trim(),
        brandDescription: footerDesc.trim(),
        showTrustBadges,
        badge1Text: badge1Text.trim(),
        badge2Text: badge2Text.trim(),
        quickLinksTitle: quickLinksTitle.trim(),
        supportTitle: supportTitle.trim(),
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
        externalLinks: [],
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
      deviceOffers,
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
              detail: json.siteInfo,
            })
          );
        }
        await refreshGlobalSiteInfo();
        setFeedback(
          json.message ||
            "✓ تمامی تنظیمات لوگوها، ابعاد، متون و لینک‌ها با موفقیت ذخیره و در لحظه روی سایت اعمال شد."
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

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await persistStudioConfig();
  };

  const activeOfferObj = deviceOffers[offerDeviceTab] || DEFAULT_DEVICE_OFFERS.mobile;

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🎨</span> مرکز فرماندهی یکپارچه ظاهر، ابعاد لوگوها، هدر، فوتر و صفحه‌ساز
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            کنترل ۱۰۰٪ ابعاد لوگوی هدر و فوتر، حذف یا تغییر هر متن دلخواه، مدیریت لینک‌های فوتر و لندینگ‌پیج‌ساز
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between">
          <div>
            <span className="font-black text-sky-400 block">📱 سهم کاربران موبایل</span>
            <span className="text-[11px] text-[var(--text-secondary)]">پیشنهاد: فعال‌سازی آفر موبایل</span>
          </div>
          <span className="font-mono font-black text-lg text-sky-400">
            {deviceStats.mobile.sharePercent}%
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between">
          <div>
            <span className="font-black text-emerald-400 block">🖥️ سهم کاربران دسکتاپ</span>
            <span className="text-[11px] text-[var(--text-secondary)]">نمایش کاتالوگ کامل</span>
          </div>
          <span className="font-mono font-black text-lg text-emerald-400">
            {deviceStats.desktop.sharePercent}%
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between">
          <div>
            <span className="font-black text-indigo-400 block">📟 سهم کاربران تبلت</span>
            <span className="text-[11px] text-[var(--text-secondary)]">چیدمان ترکیبی</span>
          </div>
          <span className="font-mono font-black text-lg text-indigo-400">
            {deviceStats.tablet.sharePercent}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-black">
        {[
          { id: "header", label: "🧭 ۱. هدر، لوگو و آفر دستگاه‌ها" },
          { id: "footer", label: "🏛 ۲. فوتر، سایز لوگو و لینک‌ها" },
          { id: "sections", label: "📑 ۳. چینش سکشن‌ها و ابعاد بنر" },
          { id: "menus", label: "🌳 ۴. منوها و دسته‌بندی‌ها" },
          { id: "page_builder", label: "⚡ ۵. صفحه‌ساز و لندینگ‌پیج" },
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
          <form
            onSubmit={handleSaveAll}
            className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5"
          >
            {activeTab === "header" && (
              <div className="space-y-5">
                <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                  تنظیمات کامل هدر، ابعاد لوگوی هدر، سایز فونت منو، فاوآیکون و نوار اعلان
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                      نام برند در هدر (در صورت خالی گذاشتن، فقط لوگو نمایش داده می‌شود):
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="خالی = عدم نمایش متن کنار لوگو"
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

                  <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-[var(--text-primary)]">تصویر لوگوی هدر:</label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl("");
                            persistStudioConfig({ newLogoUrl: "" });
                          }}
                          className="text-[10px] text-rose-500 font-bold cursor-pointer hover:underline"
                        >
                          حذف لوگو ✕
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-14 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 p-1">
                        {logoUrl ? (
                          <img key={logoUrl.slice(-32) + "_" + logoUrl.length} src={logoUrl} alt="Header Logo" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400">پیش‌فرض</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          dir="ltr"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[10px] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadTarget("logo")}
                          className="w-full py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer"
                        >
                          ☁️ آپلود لوگوی هدر
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
                    <label className="block font-black text-[var(--text-primary)]">
                      آیکون تب مرورگر (Favicon):
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-14 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 p-2">
                        {faviconUrl ? (
                          <img src={faviconUrl} alt="Favicon" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400">ICO</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          dir="ltr"
                          value={faviconUrl}
                          onChange={(e) => setFaviconUrl(e.target.value)}
                          placeholder="/favicon.ico"
                          className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[10px] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadTarget("favicon")}
                          className="w-full py-2 rounded-xl bg-indigo-600 text-white font-black cursor-pointer"
                        >
                          ☁️ آپلود فاوآیکون
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* اسلایدرهای دقیق ابعاد لوگوی هدر و ارتفاع هدر */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                  <span className="font-black text-[var(--accent-blue)] block">
                    📐 تنظیم دقیق سایز لوگوی هدر، ارتفاع هدر و سایز فونت منو:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span>عرض لوگوی هدر:</span>
                        <span className="font-mono text-[var(--accent-blue)]">{logoWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min={24}
                        max={220}
                        value={logoWidth}
                        onChange={(e) => setLogoWidth(Number(e.target.value))}
                        className="w-full accent-[var(--accent-blue)] cursor-pointer"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span>ارتفاع لوگوی هدر:</span>
                        <span className="font-mono text-[var(--accent-blue)]">{logoHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min={24}
                        max={100}
                        value={logoHeight}
                        onChange={(e) => setLogoHeight(Number(e.target.value))}
                        className="w-full accent-[var(--accent-blue)] cursor-pointer"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span>ارتفاع کل نوار هدر:</span>
                        <span className="font-mono text-emerald-500">{headerHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={110}
                        value={headerHeight}
                        onChange={(e) => setHeaderHeight(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span>سایز فونت منو:</span>
                        <span className="font-mono text-indigo-400">{menuFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={11}
                        max={18}
                        value={menuFontSize}
                        onChange={(e) => setMenuFontSize(Number(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* نوار اعلان بالای سایت */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                  <label className="block font-black text-[var(--text-primary)]">
                    📢 نوار اعلان سراسری بالای سایت:
                  </label>
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

                {/* آفر اختصاصی هر دستگاه */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-sky-500/40 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black text-sky-400">
                      🎁 آفر و نوار پیشنهاد هوشمند اختصاصی به تفکیک دستگاه:
                    </span>
                    <div className="flex gap-1 p-1 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                      {[
                        { id: "mobile", label: "📱 موبایل" },
                        { id: "tablet", label: "📟 تبلت" },
                        { id: "desktop", label: "🖥️ دسکتاپ" },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setOfferDeviceTab(d.id as any)}
                          className={
                            "px-2.5 py-1 rounded-lg font-bold cursor-pointer " +
                            (offerDeviceTab === d.id ? "bg-[var(--accent-blue)] text-white" : "")
                          }
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 font-black cursor-pointer text-emerald-400">
                    <input
                      type="checkbox"
                      checked={activeOfferObj.enabled}
                      onChange={(e) =>
                        updateOfferField(offerDeviceTab, "enabled", e.target.checked)
                      }
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                    <span>
                      فعال‌سازی نوار آفر اختصاصی برای بازدیدکنندگان{" "}
                      {offerDeviceTab === "mobile"
                        ? "📱 موبایل"
                        : offerDeviceTab === "tablet"
                        ? "📟 تبلت"
                        : "🖥️ دسکتاپ"}
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={activeOfferObj.badge}
                      onChange={(e) => updateOfferField(offerDeviceTab, "badge", e.target.value)}
                      placeholder="بج (📱 آفر موبایل)"
                      className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                    <input
                      type="text"
                      value={activeOfferObj.text}
                      onChange={(e) => updateOfferField(offerDeviceTab, "text", e.target.value)}
                      placeholder="متن پیشنهاد ویژه..."
                      className="sm:col-span-2 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "footer" && (
              <div className="space-y-5">
                <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
                  مدیریت کامل فوتر، سایز لوگوی فوتر، متون اختیاری، لینک‌های دسترسی سریع و اینماد
                </h2>

                {/* ۱. لوگوی فوتر و تنظیم سایز دقیق آن */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[var(--accent-blue)]">
                      🖼️ تصویر و ابعاد دقیق لوگوی فوتر (Footer Logo):
                    </span>
                    {footerLogoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFooterLogoUrl("");
                          persistStudioConfig({ newFooterLogoUrl: "" });
                        }}
                        className="text-[10px] text-rose-500 font-bold cursor-pointer hover:underline"
                      >
                        حذف لوگوی فوتر ✕
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center min-w-[140px] min-h-[70px]">
                      {footerLogoUrl ? (
                        <img
                          key={footerLogoUrl.slice(-32) + "_" + footerLogoUrl.length}
                          src={footerLogoUrl}
                          alt="Footer Logo Preview"
                          style={{
                            width: Math.min(200, footerLogoWidth) + "px",
                            height: Math.min(90, footerLogoHeight) + "px",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">پیش‌فرض</span>
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={footerLogoUrl}
                        onChange={(e) => setFooterLogoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadTarget("footerLogo")}
                        className="w-full py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer"
                      >
                        ☁️ آپلود لوگوی اختصاصی فوتر
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--card-border)]">
                    <div className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span>عرض لوگوی فوتر:</span>
                        <span className="font-mono font-black text-[var(--accent-blue)]">{footerLogoWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={280}
                        step={4}
                        value={footerLogoWidth}
                        onChange={(e) => setFooterLogoWidth(Number(e.target.value))}
                        className="w-full accent-[var(--accent-blue)] cursor-pointer"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span>ارتفاع لوگوی فوتر:</span>
                        <span className="font-mono font-black text-[var(--accent-blue)]">{footerLogoHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min={32}
                        max={140}
                        step={4}
                        value={footerLogoHeight}
                        onChange={(e) => setFooterLogoHeight(Number(e.target.value))}
                        className="w-full accent-[var(--accent-blue)] cursor-pointer"
                      />
                    </div>

                    <label className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFooterLogoBox}
                        onChange={(e) => setShowFooterLogoBox(e.target.checked)}
                        className="w-4 h-4 accent-[var(--accent-blue)] rounded"
                      />
                      <span className="text-[11px]">کادر سفید دور لوگوی فوتر</span>
                    </label>
                  </div>
                </div>

                {/* ۲. متون فوتر (در صورت خالی گذاشتن هر فیلد، در فوتر نمایش داده نمی‌شود) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                      عنوان برند در فوتر (خالی = عدم نمایش عنوان متنی):
                    </label>
                    <input
                      type="text"
                      value={footerTitle}
                      onChange={(e) => setFooterTitle(e.target.value)}
                      placeholder="خالی بگذارید تا فقط لوگو نمایش داده شود"
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                      زیرعنوان فوتر (خالی = مخفی):
                    </label>
                    <input
                      type="text"
                      value={footerSubtitle}
                      onChange={(e) => setFooterSubtitle(e.target.value)}
                      placeholder="شعار یا توضیح کوتاه زیر لوگو..."
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                      متن معرفی و توضیحات فوتر (خالی = مخفی):
                    </label>
                    <textarea
                      rows={2}
                      value={footerDesc}
                      onChange={(e) => setFooterDesc(e.target.value)}
                      placeholder="توضیحات درباره فروشگاه..."
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

                {/* ۳. مدیریت کامل لینک‌های دسترسی سریع در فوتر */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black text-[var(--accent-blue)]">
                      🔗 مدیریت کامل لینک‌های ستون فوتر (افزودن، ویرایش یا حذف هر لینک):
                    </span>
                    <input
                      type="text"
                      value={quickLinksTitle}
                      onChange={(e) => setQuickLinksTitle(e.target.value)}
                      placeholder="عنوان ستون (دسترسی سریع)"
                      className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    {quickLinks.map((ql, idx) => (
                      <div key={ql.id || idx} className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          value={ql.title}
                          onChange={(e) => {
                            const copy = [...quickLinks];
                            copy[idx] = { ...copy[idx], title: e.target.value };
                            setQuickLinks(copy);
                          }}
                          className="flex-1 w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={ql.url}
                          onChange={(e) => {
                            const copy = [...quickLinks];
                            copy[idx] = { ...copy[idx], url: e.target.value };
                            setQuickLinks(copy);
                          }}
                          className="flex-1 w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setQuickLinks((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer shrink-0"
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[var(--card-border)]">
                    <input
                      type="text"
                      value={newQuickTitle}
                      onChange={(e) => setNewQuickTitle(e.target.value)}
                      placeholder="عنوان لینک جدید..."
                      className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={newQuickUrl}
                      onChange={(e) => setNewQuickUrl(e.target.value)}
                      placeholder="/products"
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
                </div>

                {/* ۴. ترتیب ستون‌های فوتر */}
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
                  </div>
                </div>

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
                              ⬆
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

          {/* ستون پیش‌نمایش زنده ریسپانسیو هدر و فوتر (۵ ستون) */}
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

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col items-center justify-center min-h-[300px]">
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
                          width: Math.min(80, logoWidth) + "px",
                          height: Math.min(44, logoHeight) + "px",
                          borderRadius: logoRadius,
                          objectFit: logoObjectFit,
                        }}
                      />
                    )}
                    {brandName && (
                      <span className="font-black text-xs truncate max-w-[140px]">{brandName}</span>
                    )}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[var(--accent-blue)] text-white text-[10px] font-black">
                    🛒 0
                  </span>
                </div>

                {/* پیش‌نمایش فوتر و لوگوی بزرگ فوتر */}
                <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2.5">
                  <div className="flex flex-wrap items-center gap-3">
                    {footerLogoUrl && (
                      <img
                        key={footerLogoUrl.slice(-32) + "_" + footerLogoUrl.length}
                        src={footerLogoUrl}
                        alt="Footer"
                        style={{
                          width: Math.min(180, footerLogoWidth) + "px",
                          height: Math.min(75, footerLogoHeight) + "px",
                          objectFit: "contain",
                        }}
                      />
                    )}
                    <div>
                      {footerTitle && <div className="font-black text-xs">{footerTitle}</div>}
                      {footerSubtitle && (
                        <div className="text-[10px] text-[var(--text-secondary)]">
                          {footerSubtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  {copyrightText && (
                    <div className="text-[10px] text-[var(--text-secondary)] border-t border-[var(--card-border)] pt-2 truncate">
                      {copyrightText}
                    </div>
                  )}
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
          const target = uploadTarget;
          setUploadTarget(null);
          if (target === "favicon") {
            setFaviconUrl(url);
            persistStudioConfig({ newFaviconUrl: url });
          } else if (target === "footerLogo") {
            setFooterLogoUrl(url);
            persistStudioConfig({ newFooterLogoUrl: url });
          } else {
            setLogoUrl(url);
            persistStudioConfig({ newLogoUrl: url });
          }
        }}
      />
    </div>
  );
}
