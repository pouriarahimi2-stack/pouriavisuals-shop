// File Path: components/AdminProducts.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

export interface FullCatalogProduct {
  id: string;
  title: string;
  name?: string;
  sku?: string;
  brand?: string;
  category: string;
  price: number;
  discount_price?: number | null;
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
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // فیلترهای حرفه‌ای کاتالوگ محصولات
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "instock" | "lowstock" | "outofstock">("all");
  const [discountFilter, setDiscountFilter] = useState<"all" | "discounted">("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "stock_asc">("newest");

  // فرم ویرایش ۱۰۰٪ کامل محصول
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<FullCatalogProduct | null>(null);
  const [specKeyInput, setSpecKeyInput] = useState("");
  const [specValInput, setSpecValInput] = useState("");

  const notify = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchCatalog = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }).catch(() => null),
      ]);
      const pJson = await pRes.json();
      const list: FullCatalogProduct[] = (pJson.data || pJson.products || []).map((p: any) => ({
        id: String(p.id),
        title: p.title || p.name || "کالای دیجیتال",
        sku: p.sku || ("SKU-" + String(p.id).slice(-6).toUpperCase()),
        brand: p.brand || "Axon",
        category: p.category || "کالای دیجیتال",
        price: Number(p.price || 0),
        discount_price: p.discount_price ? Number(p.discount_price) : null,
        stock: p.stock !== undefined ? Number(p.stock) : 10,
        is_available: p.is_available !== false,
        image: p.image || (Array.isArray(p.images) && p.images[0]) || "/placeholder.png",
        images: Array.isArray(p.images) ? p.images : p.image ? [p.image] : [],
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
        (cJson.categories || []).forEach((c: any) => {
          if (c.name) catSet.add(c.name);
        });
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

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const handleOpenNewProduct = () => {
    soundEngine.playClick();
    setEditingProd({
      id: "",
      title: "",
      sku: "SKU-" + Math.floor(100000 + Math.random() * 900000),
      brand: "Apple",
      category: categories[0] || "کالای دیجیتال",
      price: 0,
      discount_price: null,
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
    setIsModalOpen(true);
  };

  const handleOpenEditProduct = (p: FullCatalogProduct) => {
    soundEngine.playClick();
    setEditingProd({ ...p, specs: { ...(p.specs || {}) } });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProd || !editingProd.title.trim()) return;

    soundEngine.playClick();
    setSaving(true);
    try {
      const payload = {
        ...editingProd,
        id: editingProd.id || undefined,
        name: editingProd.title.trim(),
        title: editingProd.title.trim(),
        images: editingProd.image
          ? Array.from(new Set([editingProd.image, ...(editingProd.images || [])]))
          : editingProd.images || [],
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify("✓ تمامی اطلاعات و مشخصات محصول با موفقیت در دیتابیس ذخیره شد.");
        setIsModalOpen(false);
        fetchCatalog();
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
      const res = await fetch("/api/products?id=" + encodeURIComponent(id), {
        method: "DELETE",
      });
      if (res.ok) {
        soundEngine.playSuccess();
        notify("محصول با موفقیت از کاتالوگ حذف گردید.");
        fetchCatalog();
      }
    } catch {}
  };

  // اعمال فیلترهای حرفه‌ای چندگانه و مرتب‌سازی
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
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🛍️</span> مدیریت پیشرفته کاتالوگ محصولات (مجهز به فیلترهای حرفه‌ای و ویرایش ۱۰۰٪)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            فیلتر چندبعدی کاتالوگ، ویرایش کامل مشخصات فنی، تصاویر، گارانتی، سئو و قیمت‌ها با وب‌سوکت زنده
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewProduct}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg hover:opacity-90 transition cursor-pointer"
        >
          ➕ افزودن محصول جدید به کاتالوگ
        </button>
      </div>

      {feedback && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (feedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-400")
          }
        >
          {feedback.text}
        </div>
      )}

      {/* نوار فیلترهای حرفه‌ای کاتالوگ */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 جستجو در نام، برند، کد SKU..."
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
        >
          <option value="all">📁 همه دسته‌بندی‌ها ({categories.length})</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as any)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
        >
          <option value="all">📦 همه وضعیت‌های موجودی</option>
          <option value="instock">🟢 فقط کالاهای موجود</option>
          <option value="lowstock">⚠️ موجودی رو به اتمام (کمتر از ۳)</option>
          <option value="outofstock">🔴 ناموجودها</option>
        </select>

        <select
          value={discountFilter}
          onChange={(e) => setDiscountFilter(e.target.value as any)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
        >
          <option value="all">🏷️ همه قیمت‌ها</option>
          <option value="discounted">🔥 فقط کالاهای تخفیف‌دار</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
        >
          <option value="newest">🕒 مرتب‌سازی: جدیدترین</option>
          <option value="price_desc">💎 گران‌ترین به ارزان‌ترین</option>
          <option value="price_asc">💰 ارزان‌ترین به گران‌ترین</option>
          <option value="stock_asc">📉 کمترین موجودی انبار</option>
        </select>
      </div>

      {/* لیست کارت‌های کاتالوگ محصولات */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-xs">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold">در حال بارگذاری کاتالوگ...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold">
            محصولی مطابق با فیلترهای انتخابی یافت نشد.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={p.image || "/placeholder.png"}
                    alt={p.title}
                    className="w-20 h-20 rounded-2xl object-cover border border-[var(--card-border)] shrink-0 bg-black/20"
                  />
                  <div className="space-y-1 overflow-hidden flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                      <span
                        className={
                          "px-2 py-0.5 rounded-md text-[9px] font-bold " +
                          (p.stock > 0 && p.is_available
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-rose-500/15 text-rose-400")
                        }
                      >
                        {p.stock > 0 && p.is_available ? p.stock + " موجود" : "ناموجود"}
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
                        <span className="text-[10px] line-through text-slate-500 font-mono block">
                          {p.price.toLocaleString("fa-IR")}
                        </span>
                        <span className="font-mono font-black text-emerald-400">
                          {p.discount_price.toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono font-black text-emerald-400">
                        {p.price.toLocaleString("fa-IR")} تومان
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProduct(p)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-black cursor-pointer"
                    >
                      ✏️ ویرایش ۱۰۰٪
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id, p.title)}
                      className="p-1.5 px-2.5 rounded-xl bg-rose-500/15 text-rose-400 font-bold cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* مودال ویرایش ۱۰۰٪ تمام فیلدهای محصول */}
      {isModalOpen && editingProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 shadow-2xl text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--accent-blue)]">
                {editingProd.id ? "✏️ ویرایش ۱۰۰٪ کامل محصول کاتالوگ" : "➕ ثبت محصول جدید در کاتالوگ"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان کامل محصول *</label>
                  <input
                    type="text"
                    required
                    value={editingProd.title}
                    onChange={(e) => setEditingProd({ ...editingProd, title: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">دسته‌بندی:</label>
                  <input
                    type="text"
                    value={editingProd.category}
                    onChange={(e) => setEditingProd({ ...editingProd, category: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">برند سازنده:</label>
                  <input
                    type="text"
                    value={editingProd.brand || ""}
                    onChange={(e) => setEditingProd({ ...editingProd, brand: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">قیمت اصلی فروش (تومان) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingProd.price}
                    onChange={(e) => setEditingProd({ ...editingProd, price: Number(e.target.value) })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">قیمت جشنواره / تخفیف (اختیاری):</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProd.discount_price || ""}
                    onChange={(e) =>
                      setEditingProd({
                        ...editingProd,
                        discount_price: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">موجودی انبار:</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProd.stock}
                    onChange={(e) => setEditingProd({ ...editingProd, stock: Number(e.target.value) })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">کد SKU و گارانتی:</label>
                  <input
                    type="text"
                    value={editingProd.warranty || ""}
                    onChange={(e) => setEditingProd({ ...editingProd, warranty: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">تصویر اصلی محصول:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={editingProd.image || ""}
                      onChange={(e) => setEditingProd({ ...editingProd, image: e.target.value })}
                      className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsUploadOpen(true)}
                      className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shrink-0"
                    >
                      ☁️ آپلود تصویر
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">توضیحات کامل و نقد و بررسی محصول:</label>
                  <textarea
                    rows={4}
                    value={editingProd.description || ""}
                    onChange={(e) => setEditingProd({ ...editingProd, description: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed"
                  />
                </div>

                {/* جدول مشخصات فنی داینامیک */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                  <span className="font-black text-[var(--accent-blue)] block">⚙️ ویژگی‌ها و مشخصات فنی (Specs):</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={specKeyInput}
                      onChange={(e) => setSpecKeyInput(e.target.value)}
                      placeholder="نام ویژگی (مثلاً: رزولوشن)"
                      className="flex-1 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none"
                    />
                    <input
                      type="text"
                      value={specValInput}
                      onChange={(e) => setSpecValInput(e.target.value)}
                      placeholder="مقدار (مثلاً: 5K Retina)"
                      className="flex-1 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!specKeyInput.trim()) return;
                        setEditingProd({
                          ...editingProd,
                          specs: {
                            ...(editingProd.specs || {}),
                            [specKeyInput.trim()]: specValInput.trim(),
                          },
                        });
                        setSpecKeyInput("");
                        setSpecValInput("");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer"
                    >
                      + افزودن
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(editingProd.specs || {})
                      .filter(([k]) => k !== "teardown_data")
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="px-2.5 py-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] flex items-center gap-1.5"
                        >
                          <strong>{k}:</strong> {String(v)}
                          <button
                            type="button"
                            onClick={() => {
                              const nextSpecs = { ...(editingProd.specs || {}) };
                              delete nextSpecs[k];
                              setEditingProd({ ...editingProd, specs: nextSpecs });
                            }}
                            className="text-rose-400 cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {saving ? "در حال ذخیره..." : "💾 ذخیره کامل محصول"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaUploadModal
        isOpen={isUploadOpen}
        bucket="products"
        title="آپلود تصویر محصول کاتالوگ"
        currentValue={editingProd?.image || ""}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(url) => {
          if (editingProd) setEditingProd({ ...editingProd, image: url });
        }}
      />
    </div>
  );
}

export default AdminProducts;
