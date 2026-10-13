// File Path: components/AdminProducts.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

export interface FullCatalogProduct {
  id: string;
  title: string;
  name?: string;
  sku?: string;
  brand?: string;
  category: string;
  price: number;
  discount_price?: number | null;
  purchase_price?: number;
  stock: number;
  is_available: boolean;
  image?: string;
  images?: string[];
  description?: string;
  warranty?: string;
  meta_title?: string;
  meta_description?: string;
  specs?: Record<string, any>;
}

export function AdminProducts(_props: any = {}) {
  const [products, setProducts] = useState<FullCatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "instock" | "lowstock" | "outofstock">("all");
  const [discountFilter, setDiscountFilter] = useState<"all" | "discounted">("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "stock_asc">("newest");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<FullCatalogProduct | null>(null);
  const [specKeyInput, setSpecKeyInput] = useState("");
  const [specValInput, setSpecValInput] = useState("");
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchCatalog = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/products?t=" + Date.now(), { cache: "no-store" }),
        fetch("/api/categories?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
      ]);
      const pJson = await pRes.json();
      const list: FullCatalogProduct[] = (pJson.data || pJson.products || []).map((p: any) => ({
        id: String(p.id),
        title: p.title || p.name || "کالای دیجیتال",
        sku: p.sku || "SKU-" + String(p.id).slice(-6).toUpperCase(),
        brand: p.brand || "Axon",
        category: p.category || "کالای دیجیتال",
        price: Number(p.price || 0),
        discount_price: p.discount_price ? Number(p.discount_price) : null,
        purchase_price: Number(
          p.purchase_price ?? Math.round(Number(p.discount_price || p.price || 0) * 0.7)
        ),
        stock: p.stock !== undefined ? Number(p.stock) : 10,
        is_available: p.is_available !== false,
        image: p.image || p.image_url || (Array.isArray(p.images) && p.images[0]) || "/placeholder.png",
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : p.image ? [p.image] : [],
        description: p.description || "",
        warranty: p.warranty || "۱۸ ماه گارانتی اصالت طلایی",
        meta_title: p.meta_title || p.title || "",
        meta_description: p.meta_description || "",
        specs: typeof p.specs === "object" && p.specs ? p.specs : {},
      }));
      setProducts(list);

      const catSet = new Set<string>(list.map((x) => x.category).filter(Boolean));
      if (cRes && cRes.ok) {
        const cJson = await cRes.json();
        (cJson.categories || cJson.data || []).forEach((c: any) => {
          if (c.name) catSet.add(c.name);
        });
      }
      if (catSet.size === 0) {
        catSet.add("کالای دیجیتال");
        catSet.add("گجت هوشمند");
        catSet.add("لوازم جانبی");
      }
      setCategories(Array.from(catSet));
    } catch (e) {
      console.error("Catalog load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
    const ch = supabase
      .channel("realtime-admin-catalog-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchCatalog();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  /** آپلود تصویر به Supabase Storage از طریق API */
  const handleImageUpload = async (file: File, productId?: string) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (productId) fd.append("product_id", productId);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (res.ok && json.success && json.url) {
        setEditingProd((prev) => {
          if (!prev) return prev;
          const existing = Array.isArray(prev.images) ? prev.images.filter((u) => !u.startsWith("data:")) : [];
          const newImages = [json.url, ...existing.filter((u) => u !== json.url)];
          return { ...prev, image: json.url, images: newImages };
        });
        notify("✓ تصویر با موفقیت آپلود شد.");
      } else {
        notify(json.message || "خطا در آپلود تصویر.", "error");
      }
    } catch (e: any) {
      notify("خطا در ارتباط با سرور: " + e.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenNewProduct = () => {
    soundEngine.playClick();
    setEditingProd({
      id: "",
      title: "",
      sku: "AXN-" + Math.floor(100000 + Math.random() * 900000),
      brand: "Axon",
      category: categories[0] || "کالای دیجیتال",
      price: 0,
      discount_price: null,
      purchase_price: 0,
      stock: 10,
      is_available: true,
      image: "",
      images: [],
      description: "",
      warranty: "۱۸ ماه گارانتی اصالت طلایی",
      meta_title: "",
      meta_description: "",
      specs: {},
    });
    setSpecKeyInput("");
    setSpecValInput("");
    setGalleryUrlInput("");
    setIsModalOpen(true);
  };

  const handleOpenEditProduct = (p: FullCatalogProduct) => {
    soundEngine.playClick();
    setEditingProd({
      ...p,
      images: Array.isArray(p.images) ? [...p.images] : p.image ? [p.image] : [],
      specs: { ...(p.specs || {}) },
    });
    setSpecKeyInput("");
    setSpecValInput("");
    setGalleryUrlInput("");
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProd || !editingProd.title.trim()) return;

    soundEngine.playClick();
    setSaving(true);
    try {
      // فقط URL واقعی — حذف base64
      const filterReal = (arr: string[]) =>
        arr.filter((u) => u && !u.startsWith("data:") && u.length < 2000);

      const mainImg =
        editingProd.image && !editingProd.image.startsWith("data:")
          ? editingProd.image.trim()
          : filterReal(editingProd.images || [])[0] || "/placeholder.png";

      const allImgs = Array.from(
        new Set([mainImg, ...filterReal(editingProd.images || [])])
      );

      const payload = {
        id: editingProd.id || undefined,
        name: editingProd.title.trim(),
        title: editingProd.title.trim(),
        category: editingProd.category,
        price: editingProd.price,
        discount_price: editingProd.discount_price,
        purchase_price: editingProd.purchase_price,
        stock: editingProd.stock,
        is_available: editingProd.is_available,
        image: mainImg,
        image_url: mainImg,
        images: allImgs,
        description: editingProd.description || "",
        warranty: editingProd.warranty,
        meta_title: editingProd.meta_title,
        meta_description: editingProd.meta_description,
        specs: editingProd.specs || {},
        sku: editingProd.sku,
        brand: editingProd.brand,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify("✓ محصول با تمامی تصاویر، مشخصات فنی و قیمت خرید در دیتابیس ذخیره شد.");
        setIsModalOpen(false);
        fetchCatalog();
        window.dispatchEvent(new CustomEvent("products_updated"));
      } else {
        notify(json.message || "خطا در ذخیره محصول.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!confirm("آیا از حذف کامل محصول «" + title + "» از کاتالوگ اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/products?id=" + encodeURIComponent(id), { method: "DELETE" });
      if (res.ok) {
        soundEngine.playSuccess();
        notify("محصول با موفقیت از کاتالوگ حذف گردید.");
        fetchCatalog();
        window.dispatchEvent(new CustomEvent("products_updated"));
      }
    } catch {}
  };

  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      const matchStock =
        stockFilter === "all"
          ? true
          : stockFilter === "instock"
          ? p.stock > 0 && p.is_available
          : stockFilter === "lowstock"
          ? p.stock > 0 && p.stock <= 3
          : p.stock === 0 || !p.is_available;
      const matchDisc =
        discountFilter === "all"
          ? true
          : Boolean(p.discount_price && p.discount_price > 0 && p.discount_price < p.price);
      return matchSearch && matchCat && matchStock && matchDisc;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "stock_asc") return a.stock - b.stock;
      return 0;
    });

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      {/* هدر پنل */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🛍️</span> مدیریت پیشرفته کاتالوگ محصولات
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ثبت و ویرایش مشخصات کالاها، گالری تصاویر، قیمت خرید، گارانتی و متاتگ‌های سئو
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNewProduct}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-xl hover:opacity-90 transition cursor-pointer"
        >
          ➕ افزودن محصول جدید
        </button>
      </div>

      {feedback && (
        <div className={"p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
          (feedback.type === "success"
            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
            : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
        }>
          {feedback.text}
        </div>
      )}

      {/* فیلترها */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 جستجو در نام، برند، کد SKU..."
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer">
          <option value="all">📁 همه دسته‌بندی‌ها ({categories.length})</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer">
          <option value="all">📦 همه وضعیت‌های موجودی</option>
          <option value="instock">🟢 فقط کالاهای موجود</option>
          <option value="lowstock">⚠️ موجودی کم (کمتر از ۳)</option>
          <option value="outofstock">🔴 ناموجودها</option>
        </select>
        <select value={discountFilter} onChange={(e) => setDiscountFilter(e.target.value as any)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer">
          <option value="all">🏷️ همه قیمت‌ها</option>
          <option value="discounted">🔥 فقط کالاهای تخفیف‌دار</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer">
          <option value="newest">🕒 مرتب‌سازی: جدیدترین</option>
          <option value="price_desc">💎 گران‌ترین به ارزان‌ترین</option>
          <option value="price_asc">💰 ارزان‌ترین به گران‌ترین</option>
          <option value="stock_asc">📉 کمترین موجودی انبار</option>
        </select>
      </div>

      {/* گرید محصولات */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-xs">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold">در حال بارگذاری کاتالوگ...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold">
            محصولی یافت نشد. روی «➕ افزودن محصول جدید» کلیک کنید.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <div key={p.id}
                className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition flex flex-col justify-between space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={p.image || "/placeholder.png"}
                    alt={p.title}
                    className="w-20 h-20 rounded-2xl object-contain border border-[var(--card-border)] shrink-0 bg-white dark:bg-slate-900 p-1"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                  />
                  <div className="space-y-1 overflow-hidden flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                      <span className={"px-2 py-0.5 rounded-md text-[9px] font-bold " +
                        (p.stock > 0 && p.is_available
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-rose-500/15 text-rose-500")
                      }>
                        {p.stock > 0 && p.is_available ? p.stock + " عدد موجود" : "ناموجود"}
                      </span>
                    </div>
                    <h3 className="font-black text-xs line-clamp-2">{p.title}</h3>
                    <span className="text-[10px] text-[var(--accent-blue)] font-bold block">
                      {p.category} | {p.brand}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between">
                  <div>
                    {p.discount_price && p.discount_price < p.price ? (
                      <div>
                        <span className="text-[10px] line-through text-slate-400 font-mono block">
                          {p.price.toLocaleString("fa-IR")}
                        </span>
                        <span className="font-mono font-black text-emerald-500">
                          {p.discount_price.toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono font-black text-emerald-500">
                        {p.price.toLocaleString("fa-IR")} تومان
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button"
                      onClick={() => window.open("https://axoncore.ir/products/" + p.id, "_blank")}
                      className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer"
                      title="مشاهده در سایت">👁️</button>
                    <button type="button"
                      onClick={() => handleOpenEditProduct(p)}
                      className="p-2 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 hover:bg-[var(--accent-blue)]/30 transition cursor-pointer"
                      title="ویرایش">✏️</button>
                    <button type="button"
                      onClick={() => handleDeleteProduct(p.id, p.title)}
                      className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition cursor-pointer"
                      title="حذف">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* مودال ویرایش/افزودن محصول */}
      {isModalOpen && editingProd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <form
            onSubmit={handleSaveProduct}
            className="w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-[var(--modal-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] p-5 sm:p-7 space-y-5 text-xs"
            dir="rtl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm text-[var(--accent-blue)]">
                {editingProd.id ? "✏️ ویرایش محصول" : "➕ افزودن محصول جدید"}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-rose-500/15 text-rose-400 cursor-pointer">✕</button>
            </div>

            {/* تصویر اصلی */}
            <div className="space-y-2">
              <label className="font-bold text-[var(--text-secondary)] block">🖼️ تصویر اصلی محصول</label>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <img
                  src={editingProd.image && !editingProd.image.startsWith("data:")
                    ? editingProd.image : "/placeholder.png"}
                  alt="preview"
                  className="w-24 h-24 rounded-2xl object-contain border border-[var(--card-border)] bg-white dark:bg-slate-900 p-1 shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editingProd.image && !editingProd.image.startsWith("data:") ? editingProd.image : ""}
                    onChange={(e) => setEditingProd({ ...editingProd, image: e.target.value })}
                    placeholder="https://... آدرس تصویر"
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none focus:border-[var(--accent-blue)]"
                  />
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex-1 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black cursor-pointer disabled:opacity-50">
                      {uploading ? "⏳ در حال آپلود..." : "📁 آپلود از رایانه"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUpload(f, editingProd.id || undefined);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* گالری تصاویر */}
            {editingProd.images && editingProd.images.filter(u => !u.startsWith("data:")).length > 0 && (
              <div className="space-y-2">
                <label className="font-bold text-[var(--text-secondary)] block">🖼️ گالری تصاویر</label>
                <div className="flex flex-wrap gap-2">
                  {editingProd.images.filter(u => !u.startsWith("data:")).map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={"gallery-" + i}
                        className="w-16 h-16 rounded-xl object-contain border border-[var(--card-border)] bg-white p-1"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                      />
                      <button type="button"
                        onClick={() => setEditingProd({
                          ...editingProd,
                          images: editingProd.images!.filter((_, idx) => idx !== i)
                        })}
                        className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input type="text" value={galleryUrlInput}
                onChange={(e) => setGalleryUrlInput(e.target.value)}
                placeholder="https://... اضافه کردن URL به گالری"
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]"
              />
              <button type="button"
                onClick={() => {
                  const url = galleryUrlInput.trim();
                  if (url && !url.startsWith("data:")) {
                    setEditingProd({
                      ...editingProd,
                      images: [...(editingProd.images || []).filter(u => !u.startsWith("data:")), url],
                    });
                    setGalleryUrlInput("");
                  }
                }}
                className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 font-bold cursor-pointer">
                ➕
              </button>
            </div>

            {/* اطلاعات اصلی */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">عنوان محصول *</label>
                <input required value={editingProd.title}
                  onChange={(e) => setEditingProd({ ...editingProd, title: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
              </div>
              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">دسته‌بندی</label>
                <select value={editingProd.category}
                  onChange={(e) => setEditingProd({ ...editingProd, category: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none cursor-pointer">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">برند</label>
                <input value={editingProd.brand || ""}
                  onChange={(e) => setEditingProd({ ...editingProd, brand: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
              </div>
              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">کد SKU</label>
                <input value={editingProd.sku || ""}
                  onChange={(e) => setEditingProd({ ...editingProd, sku: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
              </div>
              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">قیمت پایه (تومان)</label>
                <input type="number" min="0" value={editingProd.price}
                  onChange={(e) => setEditingProd({ ...editingProd, price: Number(e.target.value) })}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-mono" />
              </div>
              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">قیمت با تخفیف (تومان)</label>
                <input type="number" min="0" value={editingProd.discount_price || ""}
                  onChange={(e) => setEditingProd({ ...editingProd, discount_price: e.target.value ? Number(e.target.value) : null })}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-mono" />
              </div>
              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">قیمت خرید (تومان)</label>
                <input type="number" min="0" value={editingProd.purchase_price || 0}
                  onChange={(e) => setEditingProd({ ...editingProd, purchase_price: Number(e.target.value) })}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-mono" />
              </div>
              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">موجودی انبار</label>
                <input type="number" min="0" value={editingProd.stock}
                  onChange={(e) => setEditingProd({ ...editingProd, stock: Number(e.target.value) })}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-mono" />
              </div>
            </div>

            {/* گارانتی */}
            <div>
              <label className="font-bold text-[var(--text-secondary)] block mb-1">گارانتی</label>
              <input value={editingProd.warranty || ""}
                onChange={(e) => setEditingProd({ ...editingProd, warranty: e.target.value })}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
            </div>

            {/* توضیحات */}
            <div>
              <label className="font-bold text-[var(--text-secondary)] block mb-1">توضیحات محصول</label>
              <textarea rows={3} value={editingProd.description || ""}
                onChange={(e) => setEditingProd({ ...editingProd, description: e.target.value })}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] resize-y" />
            </div>

            {/* مشخصات فنی */}
            <div className="space-y-2">
              <label className="font-bold text-[var(--text-secondary)] block">⚙️ مشخصات فنی</label>
              {Object.entries(editingProd.specs || {}).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="flex-1 p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[10px]">{k}: {String(v)}</span>
                  <button type="button"
                    onClick={() => {
                      const s = { ...editingProd.specs };
                      delete s[k];
                      setEditingProd({ ...editingProd, specs: s });
                    }}
                    className="p-2 rounded-xl bg-rose-500/15 text-rose-400 cursor-pointer">🗑️</button>
                </div>
              ))}
              <div className="flex gap-2">
                <input placeholder="کلید (مثلا: RAM)"
                  value={specKeyInput} onChange={(e) => setSpecKeyInput(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
                <input placeholder="مقدار (مثلا: 8GB)"
                  value={specValInput} onChange={(e) => setSpecValInput(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
                <button type="button"
                  onClick={() => {
                    if (specKeyInput.trim() && specValInput.trim()) {
                      setEditingProd({ ...editingProd, specs: { ...(editingProd.specs || {}), [specKeyInput.trim()]: specValInput.trim() } });
                      setSpecKeyInput(""); setSpecValInput("");
                    }
                  }}
                  className="px-4 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer">+</button>
              </div>
            </div>

            {/* سئو */}
            <div className="space-y-2">
              <label className="font-bold text-[var(--text-secondary)] block">🔍 متاتگ‌های سئو</label>
              <input placeholder="meta title"
                value={editingProd.meta_title || ""}
                onChange={(e) => setEditingProd({ ...editingProd, meta_title: e.target.value })}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
              <textarea rows={2} placeholder="meta description"
                value={editingProd.meta_description || ""}
                onChange={(e) => setEditingProd({ ...editingProd, meta_description: e.target.value })}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] resize-y" />
            </div>

            {/* وضعیت موجودی */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={editingProd.is_available}
                onChange={(e) => setEditingProd({ ...editingProd, is_available: e.target.checked })}
                className="w-5 h-5 rounded-lg cursor-pointer" />
              <span className="font-bold">موجود و قابل سفارش است</span>
            </label>

            {/* دکمه‌های عمل */}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving || uploading}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black cursor-pointer disabled:opacity-50">
                {saving ? "⏳ در حال ذخیره..." : "✓ ذخیره محصول"}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="px-6 py-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer">
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* hidden input */}
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" />
    </div>
  );
}

export default AdminProducts;
