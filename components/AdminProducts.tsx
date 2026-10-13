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

function formatPrice(n: number) {
  return n > 0 ? n.toLocaleString("fa-IR") + " تومان" : "—";
}

function isRealUrl(s: string) {
  return s && !s.startsWith("data:") && s.length < 2000;
}

export function AdminProducts(_props: any = {}) {
  const [products, setProducts]   = useState<FullCatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [searchQuery, setSearchQuery]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter]   = useState<"all"|"instock"|"lowstock"|"outofstock">("all");
  const [discountFilter, setDiscountFilter] = useState<"all"|"discounted">("all");
  const [sortBy, setSortBy]             = useState<"newest"|"price_asc"|"price_desc"|"stock_asc">("newest");

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingProd, setEditingProd]   = useState<FullCatalogProduct | null>(null);
  const [activeTab, setActiveTab]       = useState<"basic"|"images"|"specs"|"seo">("basic");
  const [specKeyInput, setSpecKeyInput] = useState("");
  const [specValInput, setSpecValInput] = useState("");
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const multiFileRef  = useRef<HTMLInputElement>(null);

  const notify = (text: string, type: "success"|"error" = "success") => {
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
        purchase_price: Number(p.purchase_price ?? Math.round(Number(p.discount_price || p.price || 0) * 0.7)),
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
      if (cRes?.ok) {
        const cJson = await cRes.json();
        (cJson.categories || cJson.data || []).forEach((c: any) => { if (c.name) catSet.add(c.name); });
      }
      if (catSet.size === 0) { catSet.add("کالای دیجیتال"); catSet.add("گجت هوشمند"); catSet.add("لوازم جانبی"); }
      setCategories(Array.from(catSet));
    } catch (e) { console.error("Catalog load error:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCatalog();
    const ch = supabase
      .channel("realtime-admin-catalog-v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchCatalog)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  /** آپلود یک یا چند فایل */
  const uploadFiles = async (files: FileList | File[], productId?: string) => {
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        if (productId) fd.append("product_id", productId);
        const res  = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
        const json = await res.json();
        if (res.ok && json.success && json.url) urls.push(json.url);
        else notify(json.message || "خطا در آپلود: " + file.name, "error");
      }
      if (urls.length > 0) {
        setEditingProd((prev) => {
          if (!prev) return prev;
          const existing = (prev.images || []).filter(isRealUrl);
          const merged   = Array.from(new Set([...urls, ...existing]));
          // اولین آپلود = تصویر شاخص (اگر تصویری نداشت)
          const mainImg  = isRealUrl(prev.image || "") ? prev.image! : merged[0];
          return { ...prev, image: mainImg, images: merged };
        });
        notify("✓ " + urls.length + " تصویر آپلود شد.");
      }
    } finally { setUploading(false); }
  };

  /** تنظیم تصویر شاخص از گالری */
  const setAsMain = (url: string) => {
    setEditingProd((prev) => {
      if (!prev) return prev;
      const rest = (prev.images || []).filter((u) => u !== url);
      return { ...prev, image: url, images: [url, ...rest] };
    });
    notify("✓ تصویر شاخص تغییر کرد.");
  };

  const removeImage = (url: string) => {
    setEditingProd((prev) => {
      if (!prev) return prev;
      const newImages = (prev.images || []).filter((u) => u !== url);
      const newMain   = prev.image === url ? (newImages[0] || "/placeholder.png") : prev.image;
      return { ...prev, image: newMain, images: newImages };
    });
  };

  const openNew = () => {
    soundEngine.playClick();
    setEditingProd({
      id: "", title: "", sku: "AXN-" + Math.floor(100000 + Math.random() * 900000),
      brand: "Axon", category: categories[0] || "کالای دیجیتال",
      price: 0, discount_price: null, purchase_price: 0, stock: 10,
      is_available: true, image: "", images: [],
      description: "", warranty: "۱۸ ماه گارانتی اصالت طلایی",
      meta_title: "", meta_description: "", specs: {},
    });
    setActiveTab("basic");
    setSpecKeyInput(""); setSpecValInput(""); setGalleryUrlInput("");
    setIsModalOpen(true);
  };

  const openEdit = (p: FullCatalogProduct) => {
    soundEngine.playClick();
    setEditingProd({ ...p, images: Array.isArray(p.images) ? [...p.images] : p.image ? [p.image] : [], specs: { ...(p.specs || {}) } });
    setActiveTab("basic");
    setSpecKeyInput(""); setSpecValInput(""); setGalleryUrlInput("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProd || !editingProd.title.trim()) return;
    soundEngine.playClick();
    setSaving(true);
    try {
      const realImages = (editingProd.images || []).filter(isRealUrl);
      const mainImg    = isRealUrl(editingProd.image || "") ? editingProd.image! : (realImages[0] || "/placeholder.png");
      const allImgs    = Array.from(new Set([mainImg, ...realImages]));

      const payload = {
        id: editingProd.id || undefined,
        title: editingProd.title.trim(),
        name: editingProd.title.trim(),
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
        meta_title: editingProd.meta_title || editingProd.title.trim(),
        meta_description: editingProd.meta_description,
        specs: editingProd.specs || {},
        sku: editingProd.sku,
        brand: editingProd.brand,
      };

      const res  = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify("✓ محصول با موفقیت ذخیره شد.");
        setIsModalOpen(false);
        fetchCatalog();
        window.dispatchEvent(new CustomEvent("products_updated"));
      } else {
        notify(json.message || "خطا در ذخیره محصول.", "error");
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm("آیا از حذف «" + title + "» اطمینان دارید؟")) return;
    soundEngine.playClick();
    const res = await fetch("/api/products?id=" + encodeURIComponent(id), { method: "DELETE" });
    if (res.ok) { soundEngine.playSuccess(); notify("محصول حذف شد."); fetchCatalog(); window.dispatchEvent(new CustomEvent("products_updated")); }
  };

  const filtered = products
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const ms = !q || p.title.toLowerCase().includes(q) || (p.sku||"").toLowerCase().includes(q) || (p.brand||"").toLowerCase().includes(q);
      const mc = categoryFilter === "all" || p.category === categoryFilter;
      const mk = stockFilter === "all" ? true : stockFilter === "instock" ? p.stock > 0 && p.is_available : stockFilter === "lowstock" ? p.stock > 0 && p.stock <= 3 : p.stock === 0 || !p.is_available;
      const md = discountFilter === "all" ? true : Boolean(p.discount_price && p.discount_price < p.price);
      return ms && mc && mk && md;
    })
    .sort((a, b) => sortBy === "price_asc" ? a.price - b.price : sortBy === "price_desc" ? b.price - a.price : sortBy === "stock_asc" ? a.stock - b.stock : 0);

  const galleryImages = (editingProd?.images || []).filter(isRealUrl);
  const mainImage     = editingProd?.image && isRealUrl(editingProd.image) ? editingProd.image : (galleryImages[0] || "");

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">

      {/* هدر */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            🛍️ مدیریت کاتالوگ محصولات
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {products.length} محصول · {products.filter(p => p.is_available && p.stock > 0).length} موجود · {products.filter(p => p.discount_price && p.discount_price < p.price).length} تخفیف‌دار
          </p>
        </div>
        <button type="button" onClick={openNew}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg hover:opacity-90 transition cursor-pointer">
          ➕ افزودن محصول جدید
        </button>
      </div>

      {feedback && (
        <div className={"p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
          (feedback.type === "success" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500" : "bg-rose-500/15 border border-rose-500/30 text-rose-500")}>
          {feedback.text}
        </div>
      )}

      {/* فیلترها */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 نام، برند، SKU..."
          className="col-span-2 lg:col-span-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none cursor-pointer font-bold">
          <option value="all">📁 همه دسته‌ها</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none cursor-pointer font-bold">
          <option value="all">📦 همه موجودی‌ها</option>
          <option value="instock">🟢 موجود</option>
          <option value="lowstock">⚠️ کم‌موجود (زیر ۳)</option>
          <option value="outofstock">🔴 ناموجود</option>
        </select>
        <select value={discountFilter} onChange={(e) => setDiscountFilter(e.target.value as any)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none cursor-pointer font-bold">
          <option value="all">🏷️ همه قیمت‌ها</option>
          <option value="discounted">🔥 تخفیف‌دار</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none cursor-pointer font-bold">
          <option value="newest">🕒 جدیدترین</option>
          <option value="price_desc">💎 گران‌ترین</option>
          <option value="price_asc">💰 ارزان‌ترین</option>
          <option value="stock_asc">📉 کمترین موجودی</option>
        </select>
      </div>

      {/* گرید محصولات */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400 font-bold">⏳ در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-bold">محصولی یافت نشد.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)]/50 transition flex flex-col gap-3">
                <div className="flex gap-3">
                  <img src={p.image || "/placeholder.png"} alt={p.title}
                    className="w-20 h-20 rounded-2xl object-contain border border-[var(--card-border)] bg-white dark:bg-slate-900 p-1 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-slate-500">{p.sku}</span>
                      <span className={"px-2 py-0.5 rounded-lg text-[9px] font-black " +
                        (p.stock > 0 && p.is_available ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400")}>
                        {p.stock > 0 && p.is_available ? p.stock + " موجود" : "ناموجود"}
                      </span>
                    </div>
                    <h3 className="font-black text-xs line-clamp-2 leading-relaxed">{p.title}</h3>
                    <span className="text-[10px] text-[var(--accent-blue)] font-bold">{p.category} · {p.brand}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
                  <div>
                    {p.discount_price && p.discount_price < p.price ? (
                      <>
                        <span className="text-[10px] line-through text-slate-400 block">{p.price.toLocaleString("fa-IR")}</span>
                        <span className="font-black text-emerald-400 font-mono">{p.discount_price.toLocaleString("fa-IR")} ت</span>
                      </>
                    ) : (
                      <span className="font-black text-emerald-400 font-mono">{p.price.toLocaleString("fa-IR")} ت</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" title="مشاهده" onClick={() => window.open("/products/" + p.id, "_blank")}
                      className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-sky-500/50 cursor-pointer">👁️</button>
                    <button type="button" title="ویرایش" onClick={() => openEdit(p)}
                      className="p-2 rounded-xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 hover:bg-[var(--accent-blue)]/25 cursor-pointer">✏️</button>
                    <button type="button" title="حذف" onClick={() => handleDelete(p.id, p.title)}
                      className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 cursor-pointer">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ━━━ مودال ویرایش/افزودن ━━━ */}
      {isModalOpen && editingProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <form onSubmit={handleSave}
            className="w-full max-w-2xl max-h-[96vh] overflow-y-auto bg-[var(--modal-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] flex flex-col"
            dir="rtl">

            {/* هدر مودال */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)] sticky top-0 bg-[var(--modal-bg)] z-10 rounded-t-3xl">
              <h2 className="font-black text-sm text-[var(--accent-blue)]">
                {editingProd.id ? "✏️ ویرایش: " + editingProd.title.slice(0,30) : "➕ افزودن محصول جدید"}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-rose-500/15 text-rose-400 font-black cursor-pointer text-lg leading-none">✕</button>
            </div>

            {/* تب‌ها */}
            <div className="flex gap-1 p-3 border-b border-[var(--card-border)] text-[11px] font-black overflow-x-auto">
              {([
                { key: "basic",  label: "📋 اطلاعات اصلی" },
                { key: "images", label: "🖼️ تصاویر" + (galleryImages.length > 0 ? " (" + galleryImages.length + ")" : "") },
                { key: "specs",  label: "⚙️ مشخصات فنی" + (Object.keys(editingProd.specs||{}).length > 0 ? " (" + Object.keys(editingProd.specs||{}).length + ")" : "") },
                { key: "seo",    label: "🔍 سئو" },
              ] as const).map((t) => (
                <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                  className={"px-4 py-2 rounded-xl whitespace-nowrap transition cursor-pointer " +
                    (activeTab === t.key
                      ? "bg-[var(--accent-blue)] text-white shadow"
                      : "bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)]/50")}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4 text-xs flex-1">

              {/* ── تب: اطلاعات اصلی ── */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  {/* عنوان */}
                  <div>
                    <label className="block font-black mb-1.5 text-[var(--text-secondary)]">عنوان محصول <span className="text-rose-400">*</span></label>
                    <input required value={editingProd.title}
                      onChange={(e) => setEditingProd({ ...editingProd, title: e.target.value })}
                      placeholder="مثلاً: آویزخار پرتابل هوشمند ۱۸۰ درجه"
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-bold text-sm" />
                  </div>

                  {/* دسته + برند */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black mb-1.5 text-[var(--text-secondary)]">دسته‌بندی</label>
                      <select value={editingProd.category}
                        onChange={(e) => setEditingProd({ ...editingProd, category: e.target.value })}
                        className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none cursor-pointer font-bold">
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-black mb-1.5 text-[var(--text-secondary)]">برند</label>
                      <input value={editingProd.brand || ""}
                        onChange={(e) => setEditingProd({ ...editingProd, brand: e.target.value })}
                        className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-bold" />
                    </div>
                  </div>

                  {/* SKU + گارانتی */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black mb-1.5 text-[var(--text-secondary)]">کد SKU</label>
                      <input value={editingProd.sku || ""}
                        onChange={(e) => setEditingProd({ ...editingProd, sku: e.target.value })}
                        className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-mono" />
                    </div>
                    <div>
                      <label className="block font-black mb-1.5 text-[var(--text-secondary)]">گارانتی</label>
                      <input value={editingProd.warranty || ""}
                        onChange={(e) => setEditingProd({ ...editingProd, warranty: e.target.value })}
                        className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-bold" />
                    </div>
                  </div>

                  {/* قیمت‌ها */}
                  <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                    <p className="font-black text-[var(--text-secondary)] text-[11px]">💰 قیمت‌گذاری</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-[var(--text-secondary)]">قیمت پایه (تومان)</label>
                        <input type="number" min="0" value={editingProd.price}
                          onChange={(e) => setEditingProd({ ...editingProd, price: Number(e.target.value) })}
                          className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-mono text-center" />
                        {editingProd.price > 0 && <p className="text-center mt-1 text-slate-400">{editingProd.price.toLocaleString("fa-IR")}</p>}
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-[var(--text-secondary)]">قیمت با تخفیف</label>
                        <input type="number" min="0" value={editingProd.discount_price || ""}
                          onChange={(e) => setEditingProd({ ...editingProd, discount_price: e.target.value ? Number(e.target.value) : null })}
                          className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none focus:border-emerald-500 font-mono text-center" />
                        {editingProd.discount_price && editingProd.discount_price > 0 && (
                          <p className="text-center mt-1 text-emerald-400">
                            {editingProd.price > 0 && editingProd.discount_price < editingProd.price
                              ? Math.round((1 - editingProd.discount_price / editingProd.price) * 100) + "٪ تخفیف"
                              : editingProd.discount_price.toLocaleString("fa-IR")}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-[var(--text-secondary)]">قیمت خرید (حسابداری)</label>
                        <input type="number" min="0" value={editingProd.purchase_price || 0}
                          onChange={(e) => setEditingProd({ ...editingProd, purchase_price: Number(e.target.value) })}
                          className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none focus:border-amber-500 font-mono text-center" />
                        {(editingProd.purchase_price || 0) > 0 && editingProd.price > 0 && (
                          <p className="text-center mt-1 text-amber-400">
                            سود: {Math.round(((editingProd.discount_price || editingProd.price) - editingProd.purchase_price!) / editingProd.price * 100)}٪
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* موجودی */}
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="block font-black mb-1.5 text-[var(--text-secondary)]">موجودی انبار</label>
                      <input type="number" min="0" value={editingProd.stock}
                        onChange={(e) => setEditingProd({ ...editingProd, stock: Number(e.target.value) })}
                        className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-mono text-center" />
                    </div>
                    <label className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
                      <input type="checkbox" checked={editingProd.is_available}
                        onChange={(e) => setEditingProd({ ...editingProd, is_available: e.target.checked })}
                        className="w-5 h-5 rounded-lg cursor-pointer accent-[var(--accent-blue)]" />
                      <span className="font-black">قابل سفارش است</span>
                    </label>
                  </div>

                  {/* توضیحات */}
                  <div>
                    <label className="block font-black mb-1.5 text-[var(--text-secondary)]">توضیحات محصول</label>
                    <textarea rows={4} value={editingProd.description || ""}
                      onChange={(e) => setEditingProd({ ...editingProd, description: e.target.value })}
                      placeholder="توضیحات کامل محصول را اینجا بنویسید..."
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] resize-y leading-relaxed" />
                  </div>
                </div>
              )}

              {/* ── تب: تصاویر ── */}
              {activeTab === "images" && (
                <div className="space-y-5">

                  {/* تصویر شاخص فعلی */}
                  <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                    <div className="relative shrink-0">
                      <img src={mainImage || "/placeholder.png"} alt="تصویر شاخص"
                        className="w-28 h-28 rounded-2xl object-contain border-2 border-[var(--accent-blue)] bg-white dark:bg-slate-900 p-1"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }} />
                      <span className="absolute -top-2 -right-2 bg-[var(--accent-blue)] text-white text-[9px] font-black px-2 py-0.5 rounded-full">شاخص</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-black text-[var(--text-secondary)]">تصویر شاخص محصول</p>
                      <input type="text"
                        value={mainImage}
                        onChange={(e) => setEditingProd({ ...editingProd!, image: e.target.value })}
                        placeholder="https://... آدرس تصویر شاخص"
                        className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-mono text-[10px]" />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                          className="flex-1 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer disabled:opacity-50 text-[11px]">
                          {uploading ? "⏳ آپلود..." : "📁 آپلود تصویر شاخص"}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFiles([f], editingProd?.id); e.target.value = ""; }} />
                      </div>
                    </div>
                  </div>

                  {/* گالری */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-black text-[var(--text-secondary)]">گالری تصاویر
                        <span className="text-[10px] text-slate-400 font-normal mr-2">روی هر تصویر کلیک کنید تا شاخص شود</span>
                      </p>
                      <button type="button" onClick={() => multiFileRef.current?.click()} disabled={uploading}
                        className="px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] font-black cursor-pointer disabled:opacity-50">
                        {uploading ? "⏳" : "➕ آپلود چند تصویر"}
                      </button>
                      <input ref={multiFileRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files, editingProd?.id); e.target.value = ""; }} />
                    </div>

                    {galleryImages.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {galleryImages.map((url, i) => {
                          const isMain = url === mainImage;
                          return (
                            <div key={i} className="relative group cursor-pointer" onClick={() => setAsMain(url)}>
                              <img src={url} alt={"img-" + i}
                                className={"w-full aspect-square rounded-2xl object-contain p-1 border-2 transition " +
                                  (isMain ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10" : "border-[var(--card-border)] bg-white dark:bg-slate-900 hover:border-[var(--accent-blue)]/50")}
                                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }} />
                              {isMain && (
                                <span className="absolute top-1 right-1 bg-[var(--accent-blue)] text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg">★ شاخص</span>
                              )}
                              {!isMain && (
                                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 rounded-2xl text-white text-[10px] font-black">
                                  کلیک = شاخص
                                </span>
                              )}
                              <button type="button"
                                onClick={(e) => { e.stopPropagation(); removeImage(url); }}
                                className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-rose-500 text-white font-black text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer shadow">
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-slate-400 border-2 border-dashed border-[var(--card-border)] rounded-2xl">
                        <p className="font-bold">هنوز تصویری اضافه نشده</p>
                        <p className="text-[10px] mt-1">از دکمه «آپلود» یا URL زیر استفاده کنید</p>
                      </div>
                    )}

                    {/* اضافه کردن URL */}
                    <div className="flex gap-2 mt-3">
                      <input type="text" value={galleryUrlInput} onChange={(e) => setGalleryUrlInput(e.target.value)}
                        placeholder="https://... اضافه کردن تصویر از URL"
                        className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-mono text-[10px]" />
                      <button type="button"
                        onClick={() => {
                          const url = galleryUrlInput.trim();
                          if (url && isRealUrl(url)) {
                            const imgs = [...(editingProd.images || []).filter(isRealUrl), url];
                            setEditingProd({ ...editingProd, images: Array.from(new Set(imgs)) });
                            setGalleryUrlInput("");
                          }
                        }}
                        className="px-4 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer">➕</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── تب: مشخصات فنی ── */}
              {activeTab === "specs" && (
                <div className="space-y-3">
                  {Object.keys(editingProd.specs || {}).length === 0 ? (
                    <div className="py-8 text-center text-slate-400 border-2 border-dashed border-[var(--card-border)] rounded-2xl">
                      هنوز مشخصاتی اضافه نشده
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(editingProd.specs || {}).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                          <span className="text-[var(--accent-blue)] font-black w-1/3 truncate">{k}</span>
                          <span className="flex-1 text-[var(--text-primary)] truncate">{String(v)}</span>
                          <button type="button"
                            onClick={() => { const s = { ...editingProd.specs }; delete s[k]; setEditingProd({ ...editingProd, specs: s }); }}
                            className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 cursor-pointer hover:bg-rose-500/30">🗑️</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <input placeholder="کلید — مثلاً: RAM"
                      value={specKeyInput} onChange={(e) => setSpecKeyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                      className="flex-1 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
                    <input placeholder="مقدار — مثلاً: 8GB"
                      value={specValInput} onChange={(e) => setSpecValInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                      className="flex-1 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
                    <button type="button"
                      onClick={() => {
                        if (specKeyInput.trim() && specValInput.trim()) {
                          setEditingProd({ ...editingProd, specs: { ...(editingProd.specs || {}), [specKeyInput.trim()]: specValInput.trim() } });
                          setSpecKeyInput(""); setSpecValInput("");
                        }
                      }}
                      className="px-5 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer">+</button>
                  </div>
                </div>
              )}

              {/* ── تب: سئو ── */}
              {activeTab === "seo" && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-black mb-1.5 text-[var(--text-secondary)]">
                      Meta Title
                      <span className={"mr-2 text-[10px] font-normal " + ((editingProd.meta_title||"").length > 60 ? "text-rose-400" : "text-slate-400")}>
                        {(editingProd.meta_title||"").length}/60
                      </span>
                    </label>
                    <input value={editingProd.meta_title || ""}
                      onChange={(e) => setEditingProd({ ...editingProd, meta_title: e.target.value })}
                      placeholder={editingProd.title || "عنوان صفحه در گوگل"}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
                  </div>
                  <div>
                    <label className="block font-black mb-1.5 text-[var(--text-secondary)]">
                      Meta Description
                      <span className={"mr-2 text-[10px] font-normal " + ((editingProd.meta_description||"").length > 155 ? "text-rose-400" : "text-slate-400")}>
                        {(editingProd.meta_description||"").length}/155
                      </span>
                    </label>
                    <textarea rows={3} value={editingProd.meta_description || ""}
                      onChange={(e) => setEditingProd({ ...editingProd, meta_description: e.target.value })}
                      placeholder="توضیح مختصر محصول برای نمایش در نتایج گوگل"
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] resize-y" />
                  </div>
                  {/* پیش‌نمایش گوگل */}
                  <div className="p-4 rounded-2xl border border-[var(--card-border)] bg-white dark:bg-slate-900 space-y-1" dir="ltr">
                    <p className="text-[11px] text-slate-400 font-bold mb-2" dir="rtl">پیش‌نمایش در گوگل:</p>
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-sm truncate">
                      {editingProd.meta_title || editingProd.title || "عنوان محصول"}
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-500 text-[11px]">axoncore.ir/products/{editingProd.id || "..."}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2">
                      {editingProd.meta_description || editingProd.description?.slice(0, 155) || "توضیحات محصول..."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* فوتر مودال */}
            <div className="flex gap-3 p-5 border-t border-[var(--card-border)] sticky bottom-0 bg-[var(--modal-bg)] rounded-b-3xl">
              <button type="submit" disabled={saving || uploading}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black cursor-pointer disabled:opacity-50 text-sm shadow-lg">
                {saving ? "⏳ در حال ذخیره..." : uploading ? "⏳ آپلود در جریان..." : "✓ ذخیره محصول"}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="px-6 py-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer hover:border-rose-500/50 text-sm">
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
