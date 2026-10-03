// File Path: components/AdminBanners.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

export interface BannerItem {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url: string;
  cta_text?: string;
  badge_text?: string;
  position?: string;
  sort_order?: number;
  is_active: boolean;
  created_at?: string;
}

interface CatalogProduct {
  id: string;
  title: string;
  category?: string;
  price?: number;
  image?: string;
}

interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("/products");
  const [ctaText, setCtaText] = useState("مشاهده و خرید");
  const [badgeText, setBadgeText] = useState("پیشنهاد ویژه");
  const [isActive, setIsActive] = useState(true);

  const [linkMode, setLinkMode] = useState<"product" | "category" | "page" | "custom">("product");
  const [fullThemeConfig, setFullThemeConfig] = useState<any>(null);
  const [bannerMobileHeight, setBannerMobileHeight] = useState<number>(165);
  const [bannerTabletHeight, setBannerTabletHeight] = useState<number>(250);
  const [bannerDesktopHeight, setBannerDesktopHeight] = useState<number>(350);
  const [bannerMobileImgSize, setBannerMobileImgSize] = useState<number>(96);
  const [bannerDesktopImgSize, setBannerDesktopImgSize] = useState<number>(230);
  const [savingSizing, setSavingSizing] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const fetchBannersAndCatalog = async () => {
    try {
      fetch("/api/theme-builder", { cache: "no-store" })
        .then((r) => r.json())
        .then((tJson) => {
          if (tJson?.config) {
            setFullThemeConfig(tJson.config);
            const bs = tJson.config.bannerSizing;
            if (bs) {
              if (bs.mobileHeight) setBannerMobileHeight(Number(bs.mobileHeight));
              if (bs.tabletHeight) setBannerTabletHeight(Number(bs.tabletHeight));
              if (bs.desktopHeight) setBannerDesktopHeight(Number(bs.desktopHeight));
              if (bs.mobileImageSize) setBannerMobileImgSize(Number(bs.mobileImageSize));
              if (bs.desktopImageSize) setBannerDesktopImgSize(Number(bs.desktopImageSize));
            }
          }
        })
        .catch(() => {});

      const [bannersRes, prodsRes, catsRes] = await Promise.all([
        fetch("/api/admin/banners", { cache: "no-store" }).catch(() => null),
        fetch("/api/products", { cache: "no-store" }).catch(() => null),
        fetch("/api/categories", { cache: "no-store" }).catch(() => null),
      ]);

      if (bannersRes && bannersRes.ok) {
        const bJson = await bannersRes.json();
        const list = bJson.banners || bJson.data || [];
        setBanners(Array.isArray(list) ? list : []);
      } else {
        const { data: supaBanners } = await supabase
          .from("banners")
          .select("*")
          .order("created_at", { ascending: false });
        if (supaBanners) setBanners(supaBanners as any);
      }

      if (prodsRes && prodsRes.ok) {
        const pJson = await prodsRes.json();
        const pList = pJson.data || pJson.products || [];
        setProducts(
          (Array.isArray(pList) ? pList : []).map((p: any) => ({
            id: String(p.id),
            title: p.title || p.name || "کالای دیجیتال",
            category: p.category || "کالای دیجیتال",
            price: Number(p.price || 0),
            image: p.image || (Array.isArray(p.images) ? p.images[0] : ""),
          }))
        );
      }

      if (catsRes && catsRes.ok) {
        const cJson = await catsRes.json();
        const cList = cJson.categories || cJson.data || [];
        setCategories(Array.isArray(cList) ? cList : []);
      }
    } catch (e) {
      console.error("Error loading banners/catalog:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannersAndCatalog();

    const chBanners = supabase
      .channel("realtime-admin-banners")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        fetchBannersAndCatalog();
      })
      .subscribe();

    const chProducts = supabase
      .channel("realtime-admin-banners-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchBannersAndCatalog();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chBanners);
      supabase.removeChannel(chProducts);
    };
  }, []);

  const handleSaveBannerSizing = async () => {
    soundEngine.playClick();
    setSavingSizing(true);
    try {
      const nextConfig = {
        ...(fullThemeConfig || {}),
        bannerSizing: {
          mobileHeight: bannerMobileHeight,
          tabletHeight: bannerTabletHeight,
          desktopHeight: bannerDesktopHeight,
          mobileImageSize: bannerMobileImgSize,
          desktopImageSize: bannerDesktopImgSize,
          mobileLayout: "horizontal",
        },
      };
      const res = await fetch("/api/theme-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: nextConfig }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        showFeedback("✓ ارتفاع و ابعاد بنر برای موبایل، تبلت و دسکتاپ ذخیره و در سایت اعمال شد.");
        window.dispatchEvent(new CustomEvent("theme_builder_updated"));
      }
    } finally {
      setSavingSizing(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setLinkUrl("/products");
    setCtaText("مشاهده و خرید");
    setBadgeText("پیشنهاد ویژه");
    setIsActive(true);
    setProductSearch("");
  };

  const handleSelectEdit = (b: BannerItem) => {
    soundEngine.playClick();
    setEditingId(b.id);
    setTitle(b.title || "");
    setSubtitle(b.subtitle || "");
    setImageUrl(b.image_url || (b as any).image || "");
    setLinkUrl(b.link_url || (b as any).link || "/products");
    setCtaText(b.cta_text || "مشاهده و خرید");
    setBadgeText(b.badge_text || "پیشنهاد ویژه");
    setIsActive(b.is_active !== false);
  };

  const handlePickProductForBanner = (p: CatalogProduct) => {
    soundEngine.playClick();
    setLinkUrl("/products/" + p.id);
    if (!title.trim()) setTitle(p.title);
    if (!imageUrl.trim() && p.image) setImageUrl(p.image);
    showFeedback("محصول «" + p.title + "» به عنوان مقصد بنر انتخاب شد.");
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      showFeedback("عنوان بنر و تصویر بنر الزامی هستند.", "error");
      return;
    }

    soundEngine.playClick();
    setSaving(true);

    const payload: Record<string, any> = {
      id: editingId || undefined,
      title: title.trim(),
      subtitle: subtitle.trim(),
      image_url: imageUrl.trim(),
      image: imageUrl.trim(),
      link_url: linkUrl.trim() || "/products",
      link: linkUrl.trim() || "/products",
      cta_text: ctaText.trim() || "مشاهده و خرید",
      badge_text: badgeText.trim() || "پیشنهاد ویژه",
      is_active: isActive,
    };

    try {
      const res = await fetch("/api/admin/banners", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && (json.success || json.banner || json.data)) {
        soundEngine.playSuccess();
        showFeedback(editingId ? "بنر با موفقیت ویرایش شد." : "بنر جدید با موفقیت ثبت و در سایت فعال شد.");
        resetForm();
        fetchBannersAndCatalog();
        window.dispatchEvent(new CustomEvent("banners_updated"));
      } else {
        const postRes = await fetch("/api/admin/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const postJson = await postRes.json();
        if (postRes.ok && postJson.success !== false) {
          soundEngine.playSuccess();
          showFeedback("بنر با موفقیت در دیتابیس ذخیره شد.");
          resetForm();
          fetchBannersAndCatalog();
          window.dispatchEvent(new CustomEvent("banners_updated"));
        } else {
          showFeedback(postJson.message || "خطا در ذخیره بنر.", "error");
        }
      }
    } catch {
      showFeedback("خطا در ارتباط با سرور.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("آیا از حذف این بنر تبلیغاتی اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/admin/banners?id=" + encodeURIComponent(id), {
        method: "DELETE",
      });
      if (res.ok) {
        soundEngine.playSuccess();
        showFeedback("بنر با موفقیت حذف شد.");
        if (editingId === id) resetForm();
        fetchBannersAndCatalog();
        window.dispatchEvent(new CustomEvent("banners_updated"));
      }
    } catch {
      showFeedback("خطا در حذف بنر.", "error");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      (p.title || "").toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-5 sm:p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🖼️</span> مدیریت هوشمند بنرها، اسلایدرها و لینک‌دهی کاتالوگ محصولات
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            اتصال مستقیم هر بنر به محصول دلخواه از کاتالوگ، دسته‌بندی یا صفحات سایت با همگام‌سازی بلادرنگ وب‌سوکت
          </p>
        </div>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              resetForm();
            }}
            className="px-4 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer"
          >
            + ساخت بنر جدید
          </button>
        )}
      </div>

      {statusMsg && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (statusMsg.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {statusMsg.text}
        </div>
      )}

      {/* نوار تنظیم مستقیم ارتفاع و اندازه بنر در موبایل، تبلت و دسکتاپ */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
          <div>
            <h3 className="font-black text-sm text-[var(--accent-blue)]">
              📐 تنظیم مستقیم ارتفاع و ابعاد بنر در موبایل، تبلت و دسکتاپ
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              ارتفاع کادر بنر و اندازه تصویر داخل بنر را برای نسخه موبایل و دسکتاپ به دلخواه تنظیم کنید:
            </p>
          </div>
          <button
            type="button"
            disabled={savingSizing}
            onClick={handleSaveBannerSizing}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer transition disabled:opacity-50"
          >
            {savingSizing ? "در حال اعمال..." : "💾 ذخیره ابعاد بنر در سایت"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1.5">
            <div className="flex justify-between font-bold">
              <span>📱 ارتفاع بنر در موبایل:</span>
              <span className="font-mono font-black text-[var(--accent-blue)]">{bannerMobileHeight}px</span>
            </div>
            <input
              type="range"
              min={120}
              max={320}
              step={5}
              value={bannerMobileHeight}
              onChange={(e) => setBannerMobileHeight(Number(e.target.value))}
              className="w-full accent-[var(--accent-blue)] cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1.5">
            <div className="flex justify-between font-bold">
              <span>📱 اندازه عکس در موبایل:</span>
              <span className="font-mono font-black text-emerald-500">{bannerMobileImgSize}px</span>
            </div>
            <input
              type="range"
              min={64}
              max={150}
              step={4}
              value={bannerMobileImgSize}
              onChange={(e) => setBannerMobileImgSize(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1.5">
            <div className="flex justify-between font-bold">
              <span>📟 ارتفاع بنر در تبلت:</span>
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

          <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1.5">
            <div className="flex justify-between font-bold">
              <span>🖥️ ارتفاع بنر در دسکتاپ:</span>
              <span className="font-mono font-black text-[var(--accent-blue)]">{bannerDesktopHeight}px</span>
            </div>
            <input
              type="range"
              min={240}
              max={500}
              step={10}
              value={bannerDesktopHeight}
              onChange={(e) => setBannerDesktopHeight(Number(e.target.value))}
              className="w-full accent-[var(--accent-blue)] cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveBanner}
          className="lg:col-span-5 bg-[var(--modal-bg)] p-5 sm:p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-xl text-xs h-fit"
        >
          <h3 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            {editingId ? "✏️ ویرایش بنر انتخاب‌شده" : "➕ افزودن بنر جدید به سایت"}
          </h3>

          <div className="space-y-1.5">
            <label className="block font-bold text-[var(--text-secondary)]">عنوان اصلی بنر *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: جشنواره فروش ویژه تجهیزات دیجیتال"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-[var(--text-secondary)]">زیرعنوان / توضیح کوتاه</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="با ۱۸ ماه گارانتی طلایی و ارسال فوری"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-[var(--text-secondary)]">تصویر بنر *</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                dir="ltr"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none focus:border-[var(--accent-blue)]"
              />
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shrink-0"
              >
                ☁️ آپلود
              </button>
            </div>
            {imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-[var(--card-border)] max-h-36 bg-black/20">
                <img src={imageUrl} alt="Banner Preview" className="w-full h-32 object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-2 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            <label className="block font-black text-[var(--accent-blue)]">
              🔗 انتخاب هوشمند مقصد لینک بنر:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-bold">
              {[
                { id: "product", label: "📦 محصول کاتالوگ" },
                { id: "category", label: "📁 دسته‌بندی" },
                { id: "page", label: "📄 صفحات سایت" },
                { id: "custom", label: "🌐 لینک دلخواه" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setLinkMode(m.id as any);
                  }}
                  className={
                    "py-2 px-2 rounded-xl transition cursor-pointer text-center " +
                    (linkMode === m.id
                      ? "bg-[var(--accent-blue)] text-white shadow"
                      : "bg-[var(--modal-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]")
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>

            {linkMode === "product" && (
              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="🔍 جستجو در بین محصولات کاتالوگ..."
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
                />
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {filteredProducts.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-3">محصولی یافت نشد.</p>
                  ) : (
                    filteredProducts.map((p) => {
                      const targetHref = "/products/" + p.id;
                      const isSelected = linkUrl === targetHref;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handlePickProductForBanner(p)}
                          className={
                            "p-2 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 " +
                            (isSelected
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 font-black"
                              : "border-[var(--card-border)] bg-[var(--modal-bg)] hover:border-[var(--accent-blue)]")
                          }
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {p.image && (
                              <img
                                src={p.image}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[var(--card-border)]"
                              />
                            )}
                            <span className="truncate text-[11px]">{p.title}</span>
                          </div>
                          <span className="font-mono text-[10px] shrink-0">
                            {isSelected ? "انتخاب شد ✓" : "انتخاب ←"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {linkMode === "category" && (
              <div className="pt-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) setLinkUrl("/products?category=" + encodeURIComponent(e.target.value));
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="">-- انتخاب دسته‌بندی محصول --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      📁 {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {linkMode === "page" && (
              <div className="pt-2">
                <select
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="/products">🛍️ کاتالوگ تمام محصولات (/products)</option>
                  <option value="/blog">📚 مجله تخصصی سئو (/blog)</option>
                  <option value="/news">📡 رادار اخبار تکنولوژی (/news)</option>
                  <option value="/contact">📞 تماس با ما و مشاوره (/contact)</option>
                  <option value="/about">ℹ️ درباره آکسون (/about)</option>
                  <option value="/track-order">📦 پیگیری سفارش (/track-order)</option>
                </select>
              </div>
            )}

            <div className="pt-1">
              <label className="block text-[10px] font-bold text-slate-400 mb-1">آدرس نهایی لینک بنر:</label>
              <input
                type="text"
                dir="ltr"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">متن دکمه (CTA)</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">بج بالای بنر</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 font-bold cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded accent-[var(--accent-blue)]"
            />
            <span>نمایش فعال این بنر در صفحه اصلی سایت</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال ذخیره در دیتابیس..." : editingId ? "💾 بروزرسانی بنر" : "💾 ثبت و انتشار فوری بنر"}
          </button>
        </form>

        <div className="lg:col-span-7 bg-[var(--modal-bg)] p-5 sm:p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-xl text-xs">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <h3 className="font-black text-sm">لیست بنرهای ثبت‌شده ({banners.length})</h3>
            <button
              type="button"
              onClick={fetchBannersAndCatalog}
              className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
            >
              🔄 بروزرسانی
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 font-bold">در حال بارگذاری بنرها...</div>
          ) : banners.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold">
              هنوز بنری ثبت نشده است. از فرم سمت راست اولین بنر خود را بسازید.
            </div>
          ) : (
            <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
              {banners.map((b) => {
                const img = b.image_url || (b as any).image || "/placeholder.png";
                const lnk = b.link_url || (b as any).link || "/products";
                return (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[var(--accent-blue)] transition"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={img}
                        alt={b.title}
                        className="w-24 h-16 object-cover rounded-xl border border-[var(--card-border)] shrink-0"
                      />
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-xs truncate">{b.title}</h4>
                          <span
                            className={
                              "px-2 py-0.5 rounded-md text-[9px] font-bold " +
                              (b.is_active !== false
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-rose-500/15 text-rose-400")
                            }
                          >
                            {b.is_active !== false ? "فعال" : "غیرفعال"}
                          </span>
                        </div>
                        {b.subtitle && (
                          <p className="text-[11px] text-[var(--text-secondary)] truncate">{b.subtitle}</p>
                        )}
                        <span className="text-[10px] font-mono text-[var(--accent-blue)] block truncate" dir="ltr">
                          🔗 {lnk}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectEdit(b)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold cursor-pointer"
                      >
                        ✏️ ویرایش
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold cursor-pointer transition"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <MediaUploadModal
        isOpen={isUploadOpen}
        bucket="banners"
        title="بارگذاری تصویر بنر تبلیغاتی"
        currentValue={imageUrl}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(url) => setImageUrl(url)}
      />
    </div>
  );
}
