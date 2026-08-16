"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { supabase } from "@/lib/supabase";

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl: string;
  position: "slider" | "top_double" | "footer_banner";
  badge?: string;
  targetProductId?: string;
  isActive: boolean;
  createdAt: string;
}

const BANNERS_KEY = "site_banners";

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // استیت فرم ثبت / ویرایش بنر
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [badge, setBadge] = useState("");
  const [targetProductId, setTargetProductId] = useState("");
  const [position, setPosition] = useState<Banner["position"]>("slider");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadBanners();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const prods = (await productService.getAll()) || (productService.getProducts ? productService.getProducts() : []);
      setProducts(prods || []);
    } catch (err) {
      console.warn("Could not load products for banners:", err);
    }
  };

  const loadBanners = async () => {
    // تلاش برای دریافت از Supabase
    try {
      const { data, error } = await supabase.from("banners").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped: Banner[] = data.map((b: any) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle || "",
          imageUrl: b.image_url || b.imageUrl,
          linkUrl: b.link_url || b.linkUrl || "#",
          position: (b.position as Banner["position"]) || "slider",
          badge: b.badge || "",
          targetProductId: b.target_product_id || "",
          isActive: b.is_active !== undefined ? b.is_active : true,
          createdAt: b.created_at ? new Date(b.created_at).toLocaleDateString("fa-IR") : new Date().toLocaleDateString("fa-IR"),
        }));
        setBanners(mapped);
        localStorage.setItem(BANNERS_KEY, JSON.stringify(mapped));
        return;
      }
    } catch {
      // ادامه به لوکال استوریج در صورت آفلاین بودن
    }

    const data = localStorage.getItem(BANNERS_KEY);
    if (data) {
      setBanners(JSON.parse(data));
    } else {
      const defaultBanners: Banner[] = [
        {
          id: "banner-1",
          title: "جشنواره فروش ویژه محصولات اپل",
          subtitle: "تخفیف‌های انحصاری به همراه گارانتی رسمی اصالت کالا",
          imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000",
          linkUrl: "/products",
          position: "slider",
          badge: "آفر شگفت‌انگیز 🔥",
          isActive: true,
          createdAt: new Date().toLocaleDateString("fa-IR"),
        },
      ];
      localStorage.setItem(BANNERS_KEY, JSON.stringify(defaultBanners));
      setBanners(defaultBanners);
    }
  };

  const saveBanners = async (updated: Banner[]) => {
    localStorage.setItem(BANNERS_KEY, JSON.stringify(updated));
    setBanners(updated);
  };

  // انتخاب هوشمند محصول و تکمیل خودکار فیلدهای بنر
  const handleProductSelect = (productId: string) => {
    setTargetProductId(productId);
    const selectedProd = products.find((p) => p.id === productId);
    if (selectedProd) {
      setLinkUrl(`/products/${productId}`);
      if (!title) setTitle(`فروش ویژه ${selectedProd.name}`);
      if (!subtitle) setSubtitle(`خرید آنلاین ${selectedProd.name} با بالاترین کیفیت`);
      if (!imageUrl) {
        const prodImg = selectedProd.images?.[0] || selectedProd.image || "";
        setImageUrl(prodImg);
      }
      if (selectedProd.discountPrice && selectedProd.discountPrice < selectedProd.price) {
        const percent = Math.round(((selectedProd.price - selectedProd.discountPrice) / selectedProd.price) * 100);
        setBadge(`${percent}٪ تخفیف ویژه`);
      } else {
        setBadge("پیشنهاد ویژه");
      }
      showToast(`⚡ مشخصات محصول «${selectedProd.name}» روی بنر اعمال شد.`);
    }
  };

  // 🖼️ آپلود و فشرده‌سازی تصویر روی مرورگر
  const handleCompressAndUploadImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("⚠️ لطفاً یک فایل تصویری معتبر انتخاب کنید.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const scaleFactor = MAX_WIDTH / img.width;

        canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        canvas.height = img.width > MAX_WIDTH ? img.height * scaleFactor : img.height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL("image/webp", 0.8);
        setImageUrl(compressedBase64);
        showToast("⚡ تصویر بنر با موفقیت فشرده‌سازی و قرار داده شد.");
      };
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      showToast("⚠️ لطفاً عنوان و تصویر بنر را مشخص کنید.");
      return;
    }

    if (editingBanner) {
      const updated = banners.map((b) =>
        b.id === editingBanner.id
          ? {
              ...b,
              title: title.trim(),
              subtitle: subtitle.trim(),
              imageUrl: imageUrl.trim(),
              linkUrl: linkUrl.trim() || (targetProductId ? `/products/${targetProductId}` : "#"),
              badge: badge.trim(),
              targetProductId,
              position,
            }
          : b
      );
      await saveBanners(updated);

      // همگام‌سازی Supabase
      try {
        await supabase
          .from("banners")
          .update({
            title: title.trim(),
            subtitle: subtitle.trim(),
            image_url: imageUrl.trim(),
            link_url: linkUrl.trim() || (targetProductId ? `/products/${targetProductId}` : "#"),
            badge: badge.trim(),
            target_product_id: targetProductId || null,
            position,
          })
          .eq("id", editingBanner.id);
      } catch {}

      showToast("✅ بنر با موفقیت به‌روزرسانی شد.");
    } else {
      const newId = "banner-" + Date.now();
      const newBanner: Banner = {
        id: newId,
        title: title.trim(),
        subtitle: subtitle.trim(),
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim() || (targetProductId ? `/products/${targetProductId}` : "#"),
        position,
        badge: badge.trim(),
        targetProductId,
        isActive: true,
        createdAt: new Date().toLocaleDateString("fa-IR"),
      };
      await saveBanners([newBanner, ...banners]);

      // درج در Supabase
      try {
        await supabase.from("banners").insert({
          id: newId,
          title: newBanner.title,
          subtitle: newBanner.subtitle,
          image_url: newBanner.imageUrl,
          link_url: newBanner.linkUrl,
          position: newBanner.position,
          badge: newBanner.badge,
          target_product_id: targetProductId || null,
          is_active: true,
        });
      } catch {}

      showToast("🎉 بنر جدید با موفقیت منتشر شد.");
    }

    resetForm();
  };

  const startEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || "");
    setImageUrl(banner.imageUrl);
    setLinkUrl(banner.linkUrl);
    setBadge(banner.badge || "");
    setTargetProductId(banner.targetProductId || "");
    setPosition(banner.position);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingBanner(null);
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setLinkUrl("");
    setBadge("");
    setTargetProductId("");
    setPosition("slider");
  };

  const toggleStatus = async (id: string) => {
    const updated = banners.map((b) =>
      b.id === id ? { ...b, isActive: !b.isActive } : b
    );
    await saveBanners(updated);

    const target = updated.find((b) => b.id === id);
    if (target) {
      try {
        await supabase.from("banners").update({ is_active: target.isActive }).eq("id", id);
      } catch {}
    }

    showToast("🔄 وضعیت بنر تغییر کرد.");
  };

  const handleDelete = async (id: string, bannerTitle: string) => {
    if (confirm(`آیا از حذف بنر "${bannerTitle}" اطمینان دارید؟`)) {
      const updated = banners.filter((b) => b.id !== id);
      await saveBanners(updated);

      try {
        await supabase.from("banners").delete().eq("id", id);
      } catch {}

      showToast("🗑️ بنر با موفقیت حذف شد.");
    }
  };

  const getPositionLabel = (pos: Banner["position"]) => {
    switch (pos) {
      case "slider":
        return "🎠 اسلایدر اصلی صفحه اول (Hero Slider)";
      case "top_double":
        return "🖼️ بنر دوتایی بالای صفحه (Static Grid)";
      case "footer_banner":
        return "📌 بنر عریض انتهای صفحه (فوتر)";
      default:
        return pos;
    }
  };

  return (
    <div className="space-y-6 select-none text-xs font-sans text-[var(--text-primary)]">
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold shadow-2xl border border-white/20 animate-bounce">
          {toastMessage}
        </div>
      )}

      <div className="liquid-glass-card p-6 md:p-8 rounded-3xl space-y-4 border border-[var(--card-border)] shadow-xl">
        <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
          <div>
            <h3 className="text-base font-black text-[var(--accent-blue)] flex items-center gap-2">
              <span>🖼️</span> مدیریت بنرهای تبلیغاتی، اسلایدرها و آفرهای ویژه
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              تنظیم اسلایدرهای روان اپل‌استایل، بنرهای شگفت‌انگیز، تگ‌های تخفیف و لینک مستقیم به خرید کالا
            </p>
          </div>

          <span className="px-3.5 py-1 bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 rounded-xl text-xs font-bold">
            {banners.length} بنر ثبت شده
          </span>
        </div>

        {/* فرم ساخت / ویرایش بنر */}
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-xs text-[var(--accent-blue)] block">
              {editingBanner ? `✏️ ویرایش بنر: ${editingBanner.title}` : "➕ ثبت بنر، اسلایدر یا آفر جدید:"}
            </span>
            {editingBanner && (
              <button
                type="button"
                onClick={resetForm}
                className="text-rose-500 font-bold hover:underline cursor-pointer text-[11px]"
              >
                ✕ انصراف از ویرایش
              </button>
            )}
          </div>

          {/* دراپ‌داون اتصال سریع به محصول */}
          <div className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1">
            <label className="block font-bold text-[var(--text-secondary)] text-[11px]">
              🎯 اتصال هوشمند به محصولات فروشگاه (تکمیل خودکار اطلاعات و لینک خرید):
            </label>
            <select
              value={targetProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-[var(--text-primary)] font-bold cursor-pointer focus:border-[var(--accent-blue)] transition"
            >
              <option value="">-- انتخاب محصول دلخواه جهت تخفیف / هدایت خریدار --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - ({Number(p.price).toLocaleString("fa-IR")} تومان)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان اصلی بنر *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: تخفیف‌های ویژه جمعه سیاه"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">زیرعنوان / متن توضیحات</label>
              <input
                type="text"
                placeholder="مثلاً: بالاترین قدرت با تراشه M3 Pro"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">موقعیت نمایش در سایت *</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Banner["position"])}
                className="w-full p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] cursor-pointer focus:border-[var(--accent-blue)]"
              >
                <option value="slider">🎠 اسلایدر اصلی صفحه اول (Hero Slider)</option>
                <option value="top_double">🖼️ بنر دوتایی بالای صفحه (Static Grid)</option>
                <option value="footer_banner">📌 بنر عریض انتهای صفحه (فوتر)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">لینک مقصد هنگام کلیک (صفحه محصول یا دسته):</label>
              <input
                type="text"
                placeholder="مثلاً: /products/macbook-pro یا https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-mono text-[11px] text-[var(--text-primary)] focus:border-[var(--accent-blue)] font-bold"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">برچسب آفر ویژه / بج تخفیف (Badge):</label>
              <input
                type="text"
                placeholder="مثلاً: ۲۰٪ تخفیف شگفت‌انگیز 🔥"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none text-[11px] text-[var(--text-primary)] focus:border-[var(--accent-blue)] font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-[var(--text-secondary)]">تصویر بنر (لینک مستقیم CDN یا آپلود تصویر):</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                required
                placeholder="https://... یا انتخاب عکس از دکمه روبرو"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-mono text-[11px] text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
              <label className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer hover:opacity-90 transition shrink-0 shadow-md">
                📁 آپلود تصویر
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleCompressAndUploadImage(e.target.files[0]);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
            {editingBanner && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 font-bold cursor-pointer text-[var(--text-primary)]"
              >
                انصراف
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white font-bold transition cursor-pointer shadow-md"
            >
              {editingBanner ? "ذخیره تغییرات بنر 💾" : "ثبت و انتشار بنر 🚀"}
            </button>
          </div>
        </form>

        {/* لیست بنرها */}
        <div className="space-y-3 pt-2">
          <span className="font-bold text-[var(--text-secondary)] block">بنرهای فعال و ثبت‌شده:</span>

          {banners.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-secondary)] font-bold">هنوز هیچ بنری ثبت نشده است.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 hover:border-[var(--accent-blue)] transition shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-full h-40 rounded-2xl bg-black/5 dark:bg-black/30 overflow-hidden relative border border-[var(--card-border)] flex items-center justify-center">
                      {b.imageUrl ? (
                        <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl opacity-30">🖼️</span>
                      )}

                      {b.badge && (
                        <span className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[10px] font-black shadow-md">
                          {b.badge}
                        </span>
                      )}

                      <span
                        className={`absolute top-2 left-2 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                          b.isActive
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-rose-500 text-white shadow-sm"
                        }`}
                      >
                        {b.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-[var(--accent-blue)] font-bold block">
                        {getPositionLabel(b.position)}
                      </span>
                      <h4 className="font-black text-sm text-[var(--text-primary)]">{b.title}</h4>
                      {b.subtitle && (
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 font-medium">{b.subtitle}</p>
                      )}
                      {b.linkUrl && (
                        <p className="text-[10px] text-[var(--text-secondary)] font-mono truncate font-medium pt-1">
                          🔗 {b.linkUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-[var(--card-border)]">
                    <button
                      onClick={() => startEdit(b)}
                      className="flex-1 py-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/30 font-bold transition text-[11px] cursor-pointer"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => toggleStatus(b.id)}
                      className={`flex-1 py-2 rounded-xl font-bold transition text-[11px] cursor-pointer ${
                        b.isActive
                          ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 hover:bg-[var(--accent-blue)] hover:text-white"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                      }`}
                    >
                      {b.isActive ? "👁️ مخفی‌سازی" : "✅ نمایش"}
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.title)}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold transition text-[11px] cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}