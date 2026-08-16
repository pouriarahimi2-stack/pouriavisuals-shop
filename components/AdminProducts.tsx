"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // جستجو و فیلتر دسته‌بندی
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // وضعیت مدال افزودن / ویرایش
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // فیلدهای فرم
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // افزودن دسته‌بندی جدید
  const [newCatInput, setNewCatInput] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
      ]);
      setProducts(prods || []);
      const uniqueCats = Array.from(new Set((cats || []).filter(Boolean)));
      setCategories(uniqueCats);
    } catch (err) {
      console.error("Error loading products data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setCategory(categories[0] || "عمومی");
    setPrice("");
    setOriginalPrice("");
    setStock("10");
    setImage("");
    setDescription("");
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name || "");
    setCategory(p.category || p.category_id || categories[0] || "عمومی");
    setPrice(String(p.price || ""));
    setOriginalPrice(String(p.original_price || p.originalPrice || ""));
    setStock(String(p.stock ?? 10));
    setImage(p.image || p.images?.[0] || "");
    setDescription(p.description || "");
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    setSubmitting(true);
    const prodData: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      category: category.trim() || "عمومی",
      category_id: category.trim() || "عمومی",
      price: Number(price),
      original_price: originalPrice ? Number(originalPrice) : undefined,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stock: stock ? Number(stock) : 0,
      image: image.trim() || "/placeholder.png",
      images: [image.trim() || "/placeholder.png"],
      description: description.trim(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, prodData);
      } else {
        prodData.created_at = new Date().toISOString();
        await productService.create(prodData);
      }

      await loadData();
      setShowModal(false);
    } catch (err) {
      console.error("Save product failed:", err);
      alert("خطا در ذخیره‌سازی در دیتابیس.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف دائمی این محصول از پایگاه داده اطمینان دارید؟")) return;
    await productService.delete(id);
    await loadData();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    await productService.addCategory(newCatInput.trim());
    setNewCatInput("");
    await loadData();
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategoryFilter === "all" ||
      p.category === selectedCategoryFilter ||
      p.category_id === selectedCategoryFilter;
    const matchesQuery =
      (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]">
      {/* سربرگ مدیریت کاتالوگ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📦</span> مدیریت کاتالوگ و محصولات (Database Live)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ثبت، ویرایش و حذف دائمی کالاها بدون بازگشت به حالت دیفالت پس از رفرش
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white font-black text-xs transition flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
        >
          <span>➕</span>
          <span>افزودن محصول جدید</span>
        </button>
      </div>

      {/* جستجو و ثبت دسته‌بندی جدید */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 shadow-xl text-xs">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 جستجوی نام یا مشخصات کالا..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs focus:border-[var(--accent-blue)]"
          />

          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              placeholder="نام دسته جدید..."
              className="px-3.5 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs focus:border-[var(--accent-blue)]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] font-bold text-xs transition cursor-pointer"
            >
              + ثبت دسته
            </button>
          </form>
        </div>

        {/* نوار دسته‌بندی‌های فعال با key کاملاً یکتا */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            key="cat-pill-all"
            onClick={() => setSelectedCategoryFilter("all")}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition cursor-pointer flex-shrink-0 ${
              selectedCategoryFilter === "all"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            همه محصولات ({products.length})
          </button>

          {categories.map((cat, idx) => (
            <button
              key={`cat-pill-${cat}-${idx}`}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-4 py-2 rounded-2xl font-bold text-xs transition cursor-pointer flex-shrink-0 ${
                selectedCategoryFilter === cat
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* شبکه نمایش محصولات با key یکتا */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl text-xs text-[var(--text-secondary)] font-bold shadow-xl">
          هیچ محصولی در این دسته‌بندی یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p, idx) => {
            const itemKey = p.id ? `product-${p.id}` : `product-idx-${idx}`;
            const displayImg = p.image || p.images?.[0] || "/placeholder.png";

            return (
              <div
                key={itemKey}
                className="group rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 space-y-3 shadow-xl hover:border-[var(--accent-blue)] transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-full h-40 bg-[var(--input-bg)] rounded-2xl overflow-hidden flex items-center justify-center p-3">
                    <img
                      src={displayImg}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--accent-blue)] font-bold block mb-1">
                      {p.category || p.category_id || "عمومی"}
                    </span>
                    <h4 className="font-extrabold text-xs text-[var(--text-primary)] line-clamp-2 leading-snug">
                      {p.name}
                    </h4>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium">قیمت:</span>
                    <span className="font-mono font-bold text-[var(--accent-blue)]">
                      {Number(p.price || 0).toLocaleString("fa-IR")} تومان
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="flex-1 py-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[11px] hover:bg-amber-500 hover:text-white transition cursor-pointer"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[11px] hover:bg-rose-500 hover:text-white transition cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مدال ساخت / ویرایش کالا */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm text-[var(--accent-blue)]">
                {editingProduct ? "✏️ ویرایش مشخصات محصول" : "➕ افزودن محصول جدید به دیتابیس"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-right">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام کامل محصول *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: iPhone 16 Pro Max 256GB"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)] text-right"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">دسته‌بندی *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs cursor-pointer text-right"
                  >
                    {categories.map((c, i) => (
                      <option key={`cat-select-opt-${c}-${i}`} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">موجودی انبار (تعداد)</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-center focus:border-[var(--accent-blue)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">قیمت فروش (تومان) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="مثال: 95000000"
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">قیمت قبل از تخفیف (اختیاری)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="مثال: 105000000"
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-center focus:border-[var(--accent-blue)]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">آدرس لینک تصویر محصول (URL)</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://... یا /iphone.png"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-left focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">توضیحات و مشخصات کوتاه</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات فنی و ویژگی‌های شاخص..."
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed text-right focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-secondary)] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting ? "در حال ثبت..." : "ذخیره در دیتابیس 💾"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}