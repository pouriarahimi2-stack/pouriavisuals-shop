// File Path: components/Header.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSiteInfo } from "@/context/SiteInfoContext";
import { soundEngine } from "@/lib/soundEngine";
import { themeEngine } from "@/lib/themeEngine";
import { DEFAULT_HEADER_CONFIG } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";
import AnimatedLogo from "@/components/AnimatedLogo";

function resolveSafeUrl(val: any): string {
  if (typeof val !== "string") return "";
  const clean = val.trim();
  if (!clean) return "";
  if (clean.includes(".supabase.co/storage/")) {
    return "/api/media-proxy?url=" + encodeURIComponent(clean);
  }
  return clean;
}

interface ActiveAnnouncement {
  id: string;
  code: string;
  text: string;
  targetType: string;
}

interface SearchCatalogProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  discount_price?: number | null;
  image: string;
  stock: number;
}

interface SearchBlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
}

export default function Header() {
  const pathname = usePathname() || "/";
  const { openCart, totalItems } = useCart();
  const { siteInfo, refresh: refreshSiteInfo } = useSiteInfo();

  const layoutCfg = siteInfo?.homepage_layout_config || {};
  const persisted = layoutCfg?._persisted_identity || {};
  const sysSettings =
    siteInfo?.settings ||
    siteInfo?.system_settings ||
    layoutCfg?.system_settings ||
    {};
  const headerCfg = layoutCfg?.header || DEFAULT_HEADER_CONFIG;
  const tbCfg =
    siteInfo?.theme_builder_config || layoutCfg?.theme_builder_config || {};
  const themeHeader = tbCfg?.globalHeader || {};
  const deviceOffers = tbCfg?.deviceOffers || layoutCfg?.deviceOffers || {};
  const annCfg = headerCfg?.announcement || {};

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annDismissed, setAnnDismissed] = useState(false);
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [currentDevice, setCurrentDevice] = useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");

  const [couponAnnouncements, setCouponAnnouncements] = useState<
    ActiveAnnouncement[]
  >([]);
  const [activeCouponCodes, setActiveCouponCodes] = useState<Set<string>>(
    new Set()
  );
  const [couponsLoaded, setCouponsLoaded] = useState(false);
  const [activeAnnIndex, setActiveAnnIndex] = useState(0);

  // استیت‌های جستجوی زنده (Predictive Live Search)
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchProducts, setSearchProducts] = useState<SearchCatalogProduct[]>(
    []
  );
  const [searchPosts, setSearchPosts] = useState<SearchBlogPost[]>([]);
  const [searchIndexLoaded, setSearchIndexLoaded] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const loadSearchIndex = useCallback(async () => {
    if (searchIndexLoaded || searchLoading) return;
    setSearchLoading(true);
    try {
      const [prodRes, blogRes] = await Promise.allSettled([
        fetch("/api/products?t=" + Date.now(), { cache: "no-store" }),
        fetch("/api/blogs?published=true&t=" + Date.now(), { cache: "no-store" }),
      ]);

      if (prodRes.status === "fulfilled" && prodRes.value.ok) {
        const pJson = await prodRes.value.json();
        const rawList = Array.isArray(pJson.data)
          ? pJson.data
          : Array.isArray(pJson.products)
          ? pJson.products
          : [];
        setSearchProducts(
          rawList.map((p: any) => ({
            id: String(p.id),
            title: String(p.title || p.name || "کالای دیجیتال"),
            category: String(p.category || "کالای دیجیتال"),
            price: Number(p.price || 0),
            discount_price:
              p.discount_price && Number(p.discount_price) > 0
                ? Number(p.discount_price)
                : null,
            image: resolveSafeUrl(p.image || p.image_url) || "/placeholder.png",
            stock:
              p.stock !== undefined && p.stock !== null ? Number(p.stock) : 10,
          }))
        );
      }

      if (blogRes.status === "fulfilled" && blogRes.value.ok) {
        const bJson = await blogRes.value.json();
        const rawPosts = Array.isArray(bJson.posts)
          ? bJson.posts
          : Array.isArray(bJson.data)
          ? bJson.data
          : [];
        setSearchPosts(
          rawPosts.map((b: any) => ({
            id: String(b.id),
            title: String(b.title || "مقاله تخصصی"),
            slug: String(b.slug || b.id),
            category: String(b.category || "مجله تخصصی"),
          }))
        );
      }
      setSearchIndexLoaded(true);
    } catch {
    } finally {
      setSearchLoading(false);
    }
  }, [searchIndexLoaded, searchLoading]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) {
      return {
        products: searchProducts.slice(0, 4),
        categories: [] as string[],
        posts: [] as SearchBlogPost[],
        isSuggested: true,
      };
    }

    const matchedProducts = searchProducts
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 6);

    const catSet = new Set<string>();
    searchProducts.forEach((p) => {
      if (p.category.toLowerCase().includes(q)) {
        catSet.add(p.category);
      }
    });

    const matchedPosts = searchPosts
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      )
      .slice(0, 3);

    return {
      products: matchedProducts,
      categories: Array.from(catSet).slice(0, 4),
      posts: matchedPosts,
      isSuggested: false,
    };
  }, [searchQuery, searchProducts, searchPosts]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const rawHeaderLogo =
    sysSettings.logo_url !== undefined &&
    String(sysSettings.logo_url).trim() !== ""
      ? String(sysSettings.logo_url)
      : themeHeader.logoUrl !== undefined
      ? String(themeHeader.logoUrl)
      : persisted.logo_url !== undefined
      ? String(persisted.logo_url)
      : String(siteInfo?.logo_url || "");

  const syncAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/coupons?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const activeCoupons = Array.isArray(json.coupons) ? json.coupons : [];

        setActiveCouponCodes(
          new Set(
            activeCoupons.map((c: any) =>
              String(c.code || "").trim().toUpperCase()
            )
          )
        );

        let usedLocal: string[] = [];
        try {
          usedLocal = JSON.parse(
            localStorage.getItem("axon_used_coupons") || "[]"
          );
        } catch {}

        const validList: ActiveAnnouncement[] = activeCoupons
          .filter(
            (c: any) =>
              c.publish_to_header !== false && !usedLocal.includes(c.code)
          )
          .map((c: any) => {
            const isPct =
              (c.discount_type || c.type || "percent") === "percent";
            const val = Number(
              c.discount_percent ??
                c.value ??
                c.discount_value ??
                c.discount_amount ??
                0
            );
            const valStr = isPct
              ? `${val}٪ تخفیف`
              : `${val.toLocaleString("fa-IR")} تومان تخفیف`;
            let targetLabel = "روی کل سبد خرید";
            if (c.target_type === "product") targetLabel = "روی کالای منتخب";
            if (c.target_type === "category")
              targetLabel = `روی محصولات دسته‌بندی ${c.target_id || ""}`;

            return {
              id: c.id,
              code: c.code,
              text: `🔥 جشنواره ویژه! با وارد کردن کد «${c.code}» ${valStr} ${targetLabel} دریافت کنید`,
              targetType: c.target_type,
            };
          });

        setCouponAnnouncements(validList);
      }
    } catch {
    } finally {
      setCouponsLoaded(true);
    }
  }, []);

  const customAnnouncementText = String(
    sysSettings.header_announcement ??
      themeHeader.announcementText ??
      persisted.header_announcement ??
      siteInfo?.header_announcement ??
      ""
  ).trim();

  const isCustomAnnouncementEnabled =
    sysSettings.header_announcement_enabled !== false &&
    themeHeader.showAnnouncement !== false;

  const announcements: ActiveAnnouncement[] = useMemo(() => {
    const merged: ActiveAnnouncement[] = [];
    if (isCustomAnnouncementEnabled && customAnnouncementText) {
      const codeMatch = customAnnouncementText.match(
        /کد\s*[«"']?([A-Z0-9_-]{3,20})[»"']?/i
      );
      const referencedCode = codeMatch?.[1]?.toUpperCase() || "";
      const isStaleDeletedCoupon =
        Boolean(referencedCode) &&
        couponsLoaded &&
        !activeCouponCodes.has(referencedCode);

      if (!isStaleDeletedCoupon) {
        merged.push({
          id: "global-site-announcement",
          code: "",
          text: customAnnouncementText,
          targetType: "global",
        });
      }
    }
    return [...merged, ...couponAnnouncements];
  }, [
    isCustomAnnouncementEnabled,
    customAnnouncementText,
    couponAnnouncements,
    couponsLoaded,
    activeCouponCodes,
  ]);

  useEffect(() => {
    if (activeAnnIndex >= announcements.length && announcements.length > 0) {
      setActiveAnnIndex(0);
    }
  }, [announcements.length, activeAnnIndex]);

  useEffect(() => {
    syncAnnouncements();

    const onSiteInfoUpdated = () => {
      setAnnDismissed(false);
      refreshSiteInfo();
    };

    const channel = supabase
      .channel("realtime-header-coupons")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coupons" },
        () => {
          syncAnnouncements();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        () => {
          syncAnnouncements();
          refreshSiteInfo();
        }
      )
      .subscribe();

    window.addEventListener("coupons_updated", syncAnnouncements);
    window.addEventListener("site_info_updated", onSiteInfoUpdated);

    return () => {
      window.removeEventListener("coupons_updated", syncAnnouncements);
      window.removeEventListener("site_info_updated", onSiteInfoUpdated);
      supabase.removeChannel(channel);
    };
  }, [syncAnnouncements, refreshSiteInfo]);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setActiveAnnIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [announcements.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const detectViewportDevice = () => {
      const w = window.innerWidth;
      if (w < 768) setCurrentDevice("mobile");
      else if (w < 1024) setCurrentDevice("tablet");
      else setCurrentDevice("desktop");
    };
    detectViewportDevice();
    window.addEventListener("resize", detectViewportDevice, { passive: true });
    return () => window.removeEventListener("resize", detectViewportDevice);
  }, []);

  const syncUserSession = () => {
    try {
      let resolvedName = "";
      const draftRaw = localStorage.getItem("axon_checkout_form_draft_v2027");
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft?.firstName || draft?.lastName) {
          resolvedName =
            `${draft.firstName || ""} ${draft.lastName || ""}`.trim();
        } else if (draft?.fullName && String(draft.fullName).trim().length > 1) {
          resolvedName = String(draft.fullName).trim();
        }
      }
      const local = localStorage.getItem("axon_user_session");
      if (local) {
        const parsed = JSON.parse(local);
        const rawName =
          parsed?.full_name || parsed?.name || parsed?.username || "";
        if (rawName && !/^0?9\d{9}$/.test(String(rawName).trim())) {
          setUserLabel(String(rawName).trim());
        } else if (resolvedName) {
          setUserLabel(resolvedName);
        } else if (parsed?.phone) {
          setUserLabel(String(parsed.phone).trim());
        } else {
          setUserLabel("پنل کاربری");
        }
      } else {
        setUserLabel(null);
      }
    } catch {
      setUserLabel(null);
    }
  };

  useEffect(() => {
    themeEngine.initThemeListener();
    if (typeof document !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
    syncUserSession();

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    const onThemeChanged = (e: any) => {
      if (e?.detail) setIsDarkMode(e.detail === "dark");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("user_auth_changed", syncUserSession);
    window.addEventListener("theme_changed", onThemeChanged);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("user_auth_changed", syncUserSession);
      window.removeEventListener("theme_changed", onThemeChanged);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    soundEngine.playClick();
    const next = !isDarkMode;
    setIsDarkMode(next);
    themeEngine.applyTheme(next ? "dark" : "light", true);
  };

  const copyHeaderCoupon = (code: string) => {
    if (!code) return;
    soundEngine.playSuccess();
    navigator.clipboard?.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  if (headerCfg.show === false) return null;

  const variantMode = themeHeader.variant || headerCfg.variant || "capsule";
  const isCapsule = variantMode !== "full-width";

  const brandName =
    sysSettings.site_name !== undefined &&
    String(sysSettings.site_name).trim() !== ""
      ? String(sysSettings.site_name).trim()
      : themeHeader.brandName !== undefined
      ? String(themeHeader.brandName).trim()
      : String(persisted.site_name ?? siteInfo?.site_name ?? "").trim();

  const menuFontSize = Number(
    themeHeader.menuFontSize || headerCfg?.menu?.fontSize || 12
  );
  const logoWidth = Number(
    themeHeader.logoWidth || headerCfg?.brand?.logoWidth || 44
  );
  const logoHeight = Number(
    themeHeader.logoHeight || headerCfg?.brand?.logoHeight || 44
  );
  const logoRadius = themeHeader.logoRadius || "12px";
  const logoFit = themeHeader.logoObjectFit || "contain";
  const baseHeight = Number(themeHeader.height || headerCfg.height || 64);

  const navMenuFromDb =
    siteInfo?.navigation_menu || layoutCfg?.navigation_menu;
  const menuItems =
    Array.isArray(navMenuFromDb) && navMenuFromDb.length > 0
      ? navMenuFromDb
          .filter((m: any) => m.is_active !== false)
          .map((m: any) => ({
            id: m.id,
            title: m.title,
            url: m.url || "/products",
            children: Array.isArray(m.children) ? m.children : [],
          }))
      : (headerCfg?.menu?.items || DEFAULT_HEADER_CONFIG.menu.items).filter(
          (m: any) => m.show !== false
        );

  const isPhoneLabel = Boolean(userLabel && /^0?9\d{9}$/.test(userLabel));
  const currentAnnouncement = announcements[activeAnnIndex];
  const showAnnouncement = Boolean(currentAnnouncement && !annDismissed);

  const activeDeviceOffer = deviceOffers?.[currentDevice];
  const showDeviceOffer =
    Boolean(activeDeviceOffer?.enabled) &&
    Boolean(activeDeviceOffer?.text) &&
    !offerDismissed;

  return (
    <>
      <div
        ref={searchContainerRef}
        className="fixed top-0 inset-x-0 z-40 flex flex-col items-center pointer-events-none"
        dir="rtl"
      >
        {showAnnouncement && (
          <div
            style={{
              backgroundColor: annCfg.backgroundColor || "#0284c7",
              color: annCfg.textColor || "#ffffff",
            }}
            className="w-full px-4 py-1.5 text-[11px] sm:text-xs font-black text-center flex items-center justify-center gap-3 shadow-md pointer-events-auto font-sans select-text transition-all duration-300"
          >
            <span className="truncate max-w-3xl">
              {currentAnnouncement.text}
            </span>

            {currentAnnouncement.code && (
              <button
                type="button"
                onClick={() => copyHeaderCoupon(currentAnnouncement.code)}
                className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-mono text-[10px] font-black cursor-pointer transition shrink-0"
                title="برای کپی کد تخفیف کلیک کنید"
              >
                {copiedCoupon === currentAnnouncement.code
                  ? "کپی شد ✓"
                  : "📋 کپی کد"}
              </button>
            )}

            {announcements.length > 1 && (
              <span className="text-[9px] opacity-75 font-mono">
                ({activeAnnIndex + 1}/{announcements.length})
              </span>
            )}

            <button
              type="button"
              onClick={() => setAnnDismissed(true)}
              className="w-5 h-5 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center text-[10px] cursor-pointer shrink-0 transition"
              aria-label="بستن اعلان"
            >
              ✕
            </button>
          </div>
        )}

        {showDeviceOffer && (
          <div
            style={{
              backgroundColor: activeDeviceOffer.bgColor || "#0f172a",
              color: activeDeviceOffer.textColor || "#38bdf8",
            }}
            className="w-full px-3 py-1.5 text-[11px] font-black flex flex-wrap items-center justify-center gap-2 border-b border-white/10 shadow-md pointer-events-auto font-sans select-text"
          >
            {activeDeviceOffer.badge && (
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px]">
                {activeDeviceOffer.badge}
              </span>
            )}
            <span>{activeDeviceOffer.text}</span>
            {activeDeviceOffer.couponCode && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(activeDeviceOffer.couponCode);
                  soundEngine.playSuccess();
                  setCopiedCoupon(activeDeviceOffer.couponCode);
                  setTimeout(() => setCopiedCoupon(null), 2500);
                }}
                className="px-2.5 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-mono text-[10px] font-black cursor-pointer hover:opacity-90 transition"
              >
                {copiedCoupon === activeDeviceOffer.couponCode
                  ? "کپی شد ✓"
                  : "کد: " + activeDeviceOffer.couponCode}
              </button>
            )}
            {activeDeviceOffer.ctaText && (
              <Link
                href={activeDeviceOffer.ctaUrl || "/products"}
                className="underline hover:opacity-80 text-[10px]"
              >
                {activeDeviceOffer.ctaText} ←
              </Link>
            )}
            <button
              type="button"
              onClick={() => setOfferDismissed(true)}
              className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-[9px] cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <header
          data-axon-header="main"
          className="w-full px-3 sm:px-6 pt-2.5 pointer-events-auto transition-all duration-300"
        >
          <div
            style={{
              maxWidth: (headerCfg.maxWidth || 1280) + "px",
              height:
                isScrolled && headerCfg.shrinkOnScroll
                  ? Math.max(48, baseHeight - 6) + "px"
                  : baseHeight + "px",
            }}
            className={
              "mx-auto w-full px-4 sm:px-6 transition-all duration-300 flex items-center justify-between gap-3 border shadow-xl backdrop-blur-2xl " +
              (isCapsule ? "rounded-full" : "rounded-2xl") +
              " glass-header"
            }
          >
            <div className="flex items-center gap-4 lg:gap-6 min-w-0">
              <Link
                href="/"
                onClick={() => soundEngine.playClick()}
                className="flex items-center gap-2.5 text-sm sm:text-base font-black tracking-tight text-[var(--text-primary)] hover:opacity-90 transition shrink-0"
              >
                <AnimatedLogo
                  variant="header"
                  srcOverride={rawHeaderLogo}
                  width={logoWidth}
                  height={logoHeight}
                  borderRadius={String(logoRadius)}
                  objectFit={logoFit as "contain" | "cover"}
                />
                {brandName ? (
                  <span className="font-black whitespace-nowrap">
                    {brandName}
                  </span>
                ) : null}
              </Link>

              {headerCfg.menu?.show !== false && (
                <nav
                  style={{ fontSize: menuFontSize + "px" }}
                  className="hidden lg:flex items-center gap-4 xl:gap-5 font-bold text-[var(--text-secondary)]"
                >
                  {menuItems.map((item: any) => {
                    const isActive = pathname === item.url;
                    const hasSub =
                      Array.isArray(item.children) && item.children.length > 0;
                    return (
                      <div key={item.id} className="relative group py-2">
                        <Link
                          href={item.url}
                          className={
                            "hover:text-[var(--text-primary)] transition whitespace-nowrap flex items-center gap-1 " +
                            (isActive
                              ? "text-[var(--accent-blue)] font-black"
                              : "")
                          }
                        >
                          <span>{item.title}</span>
                          {hasSub && (
                            <span className="text-[9px] opacity-70">▼</span>
                          )}
                        </Link>

                        {hasSub && (
                          <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-50 min-w-[210px]">
                            <div className="p-2 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-1">
                              {item.children.map((sub2: any) => (
                                <div key={sub2.id} className="space-y-1">
                                  <Link
                                    href={sub2.url || "/products"}
                                    className="block px-3 py-2 rounded-xl hover:bg-[var(--input-bg)] text-[var(--text-primary)] font-bold text-xs transition"
                                  >
                                    {sub2.title}
                                  </Link>
                                  {Array.isArray(sub2.children) &&
                                    sub2.children.length > 0 && (
                                      <div className="pr-3 border-r border-[var(--card-border)] space-y-0.5">
                                        {sub2.children.map((sub3: any) => (
                                          <Link
                                            key={sub3.id}
                                            href={sub3.url || "/products"}
                                            className="block px-2.5 py-1.5 rounded-lg hover:bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] text-[11px] transition"
                                          >
                                            ↳ {sub3.title}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* نوار جستجوی زنده دسکتاپ و تبلت */}
            <div className="hidden md:flex items-center flex-1 max-w-xs xl:max-w-sm mx-2">
              <div className="relative w-full">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    setSearchOpen(true);
                    loadSearchIndex();
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!searchOpen) setSearchOpen(true);
                    loadSearchIndex();
                  }}
                  placeholder="🔍 جستجو در کالاها، برند و مقالات..."
                  className="w-full py-2 px-4 pl-8 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] focus:border-[var(--accent-blue)] text-xs font-bold text-[var(--text-primary)] outline-none transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* دکمه جستجوی سریع در موبایل */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  const next = !searchOpen;
                  setSearchOpen(next);
                  if (next) {
                    loadSearchIndex();
                    setTimeout(() => searchInputRef.current?.focus(), 60);
                  }
                }}
                className="md:hidden w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-xs transition cursor-pointer"
                title="جستجو در محصولات"
                aria-label="جستجو"
              >
                🔍
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-xs transition cursor-pointer"
                title="تغییر تم روز و شب"
              >
                {isDarkMode ? "🌙" : "☀️"}
              </button>

              <Link
                href={userLabel ? "/account" : "/login"}
                onClick={() => soundEngine.playClick()}
                className="hidden sm:flex px-4 py-2 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold text-[var(--text-primary)] transition items-center gap-1.5 max-w-[200px]"
              >
                <span>👤</span>
                {userLabel ? (
                  isPhoneLabel ? (
                    <span
                      className="font-mono font-bold tracking-tight"
                      dir="ltr"
                    >
                      {userLabel}
                    </span>
                  ) : (
                    <span className="truncate">سلام، {userLabel}</span>
                  )
                ) : (
                  <span>حساب کاربری</span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  openCart();
                }}
                className="px-4 sm:px-5 py-2 rounded-full bg-[var(--accent-blue)] text-white text-xs font-black shadow-md hover:opacity-90 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>🛒</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full font-mono text-[11px]">
                  {totalItems}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="lg:hidden w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-sm font-bold transition cursor-pointer hover:border-[var(--accent-blue)]"
                aria-label="منوی ناوبری"
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {/* پنجره نتایج زنده جستجو (Predictive Live Search Dropdown) */}
          {searchOpen && (
            <div className="max-w-3xl mx-auto mt-2.5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl p-4 sm:p-5 space-y-4 text-xs animate-fadeIn">
              {/* فیلد جستجو در نمای موبایل */}
              <div className="md:hidden relative">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="نام کالا، دسته‌بندی یا مقاله را بنویسید..."
                  className="w-full p-3 pl-9 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)] text-xs font-bold text-[var(--text-primary)] outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {searchLoading ? (
                <div className="py-8 text-center text-[var(--text-secondary)] font-bold">
                  در حال بارگذاری کاتالوگ جستجو...
                </div>
              ) : (
                <>
                  {searchResults.categories.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-[var(--accent-blue)] block">
                        📂 دسته‌بندی‌های مرتبط:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {searchResults.categories.map((cat) => (
                          <Link
                            key={cat}
                            href={`/products?category=${encodeURIComponent(cat)}`}
                            onClick={() => {
                              soundEngine.playClick();
                              setSearchOpen(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold transition"
                          >
                            {cat}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[var(--accent-blue)]">
                        {searchResults.isSuggested
                          ? "🔥 جدیدترین کالاهای پیشنهادی:"
                          : `🛍️ کالاهای منطبق (${searchResults.products.length.toLocaleString("fa-IR")} مورد):`}
                      </span>
                      <Link
                        href="/products"
                        onClick={() => setSearchOpen(false)}
                        className="text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-blue)]"
                      >
                        مشاهده همه کالاها ←
                      </Link>
                    </div>

                    {searchResults.products.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-[var(--input-bg)] text-center text-[var(--text-secondary)] font-bold">
                        کالایی با عبارت «{searchQuery}» یافت نشد.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                        {searchResults.products.map((prod) => {
                          const effectivePrice =
                            prod.discount_price || prod.price;
                          return (
                            <Link
                              key={prod.id}
                              href={`/products/${prod.id}`}
                              onClick={() => {
                                soundEngine.playClick();
                                setSearchOpen(false);
                              }}
                              className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition flex items-center gap-3"
                            >
                              <img
                                src={prod.image}
                                alt={prod.title}
                                className="w-12 h-12 rounded-xl object-contain bg-[var(--modal-bg)] p-1 border border-[var(--card-border)] shrink-0"
                              />
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="font-black text-xs text-[var(--text-primary)] truncate">
                                  {prod.title}
                                </div>
                                <div className="text-[10px] text-[var(--text-secondary)]">
                                  {prod.category}
                                </div>
                                <div className="font-mono font-black text-[11px] text-emerald-500">
                                  {prod.stock <= 0
                                    ? "ناموجود"
                                    : `${effectivePrice.toLocaleString("fa-IR")} تومان`}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {searchResults.posts.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
                      <span className="text-[11px] font-black text-indigo-400 block">
                        📚 مقالات و راهنماهای مرتبط در مجله:
                      </span>
                      <div className="space-y-1.5">
                        {searchResults.posts.map((post) => (
                          <Link
                            key={post.id}
                            href={`/blog/${encodeURIComponent(post.slug)}`}
                            onClick={() => {
                              soundEngine.playClick();
                              setSearchOpen(false);
                            }}
                            className="block p-2.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-transparent font-bold truncate transition"
                          >
                            📄 {post.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </header>
      </div>

      {showAnnouncement && <div className="h-7 w-full" />}
      {showDeviceOffer && <div className="h-7 w-full" />}

      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-x-0 top-[88px] z-30 px-3"
          dir="rtl"
        >
          <div className="rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl p-4 space-y-1 max-h-[75vh] overflow-y-auto">
            <Link
              href={userLabel ? "/account" : "/login"}
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-xs font-black text-[var(--accent-blue)] mb-3"
            >
              <span className="text-base">👤</span>
              <span>
                {userLabel
                  ? "پنل کاربری (" + userLabel + ")"
                  : "ورود / ثبت‌نام سریع"}
              </span>
            </Link>

            {menuItems.map((item: any) => (
              <Link
                key={item.id}
                href={item.url}
                onClick={() => soundEngine.playClick()}
                className={
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition " +
                  (pathname === item.url
                    ? "bg-[var(--accent-blue)] text-white"
                    : "hover:bg-[var(--input-bg)] text-[var(--text-primary)]")
                }
              >
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}