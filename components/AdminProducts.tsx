"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  // استیت‌های فرم ایجاد/ویرایش کالا
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [category, setCategory] = useState("مانیتور");
  const [stock, setStock] = useState<number>(10);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [newGalleryInput, setNewGalleryInput] = useState("");
  const [isSpecialOffer, setIsSpecialOffer] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();

    const handleUpdate = (e: any) => {
      if (e.detail) setProducts(e.detail);
      else loadProducts();
    };
    window.addEventListener("products_updated", handleUpdate);
    return () => window.removeEventListener("products_updated", handleUpdate);
  }, []);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setPrice(0);
    setOriginalPrice(0);
    setCategory("مانیتور");
    setStock(10);
    setDescription("");
    setImageUrl("");
    setGalleryUrls([]);
    setIsSpecialOffer(false);
    setIsAvailable(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price || 0);
    setOriginalPrice(p.originalPrice || p.price || 0);
    setCategory(p.category || "عمومی");
    setStock(p.stock ?? 10);
    setDescription(p.description || "");
    setImageUrl(p.images?.[0] || p.image || "");
    setGalleryUrls(p.images || (p.image ? [p.image] : []));
    setIsSpecialOffer(p.isSpecialOffer ?? false);
    setIsAvailable(p.is_available ?? true);
    setIsModalOpen(true);
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryInput.trim()) return;
    setGalleryUrls([...galleryUrls, newGalleryInput.trim()]);
    setNewGalleryInput("");
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) return;

    setSaving(true);
    try {
      const finalImages = galleryUrls.length > 0 ? galleryUrls : imageUrl ? [imageUrl] : [];
      const productPayload = {
        name: name.trim(),
        price: Number(price),
        originalPrice: originalPrice > price ? Number(originalPrice) : undefined,
        category: category.trim(),
        stock: Number(stock),
        description: description.trim(),
        image: imageUrl.trim() || finalImages[0] || "",
        images: finalImages,
        isSpecialOffer,
        is_available: isAvailable && stock > 0,
      };

      if (editingProduct) {
        const updated = await productService.update(editingProduct.id, productPayload);
        if (updated) {
          showToast(`محصول «${name}» با موفقیت ویرایش شد.`);
          setIsModalOpen(false);
        }
      } else {
        const created = await productService.create(productPayload);
        if (created) {
          showToast(`محصول جدید «${name}» در فروشگاه و دیتابیس ثبت گردید.`);
          setIsModalOpen(false);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (confirm(`آیا از حذف محصول «${prodName}» از فروشگاه اطمینان دارید؟`)) {
      await productService.delete(id);
      showToast("محصول حذف گردید.");
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category || "عمومی"))).filter(Boolean);

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCat === "all" || (p.category || "عمومی") === selectedCat;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* هدر بخش محصولات */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base flex items-center gap-2 text-[var(--accent-blue)]">
            <span>📦</span> مدیریت کاتالوگ و محصولات فروشگاه
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تعریف کالای جدید، قیمت‌گذاری، گالری چندتصویره، موجودی انبار و برچسب‌های فروش ویژه
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer flex items-center gap-1.5"
        >
          <span>➕</span>
          <span>افزودن محصول جدید</span>
        </button>
      </div>

      {/* فیلتر و جستجو */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-4 py-2 rounded-xl font-black transition cursor-pointer ${
              selectedCat === "all"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
            }`}
          >
            همه دسته‌ها ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-xl font-black transition cursor-pointer ${
                selectedCat === cat
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در نام و مشخصات کالا..."
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {/* جدول نمایش لیست محصولات */}
      <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری کاتالوگ محصولات...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-[var(--text-secondary)]">محصولی با این مشخصات یافت نشد.</div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                <th className="pb-3 px-2">تصویر و نام کالا</th>
                <th className="pb-3 px-2">دسته‌بندی</th>
                <th className="pb-3 px-2">قیمت نهایی</th>
                <th className="pb-3 px-2">موجودی</th>
                <th className="pb-3 px-2">برچسب‌ها</th>
                <th className="pb-3 px-2 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images?.[0] || p.image || ""}
                        alt={p.name}
                        className="w-11 h-11 rounded-xl object-contain bg-[var(--input-bg)] p-1 border border-[var(--card-border)]"
                      />
                      <span className="font-extrabold text-xs text-[var(--text-primary)]">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-bold text-[var(--text-secondary)]">{p.category || "عمومی"}</td>
                  <td className="py-3 px-2 font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {(p.price || 0).toLocaleString("fa-IR")} تومان
                  </td>
                  <td className="py-3 px-2 font-mono font-bold">
                    <span className={(p.stock ?? 0) <= 3 ? "text-rose-500 font-black" : ""}>
                      {p.stock ?? 0} عدد
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {p.isSpecialOffer && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-500/30">
                        🔥 ویژه
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                    >
                      🗑️ حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* مدال ساخت / ویرایش کالا */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleFormSubmit}
            className="max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-7 space-y-4 shadow-2xl text-[var(--text-primary)] text-xs"
          >
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h4 className="font-black text-sm text-[var(--accent-blue)]">
                {editingProduct ? `✏️ ویرایش محصول «${editingProduct.name}»` : "➕ ثبت محصول جدید"}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام کامل کالا *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مانیتور ۲۷ اینچ 4K مخصوص تدوین"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">قیمت نهایی فروش (تومان) *</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">قیمت قبلی (جهت نمایش خط‌خورده)</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">دسته‌بندی کالا *</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="مانیتور، سخت‌افزار، تجهیزات تصویر"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">موجودی انبار *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">آدرس اینترنتی تصویر اصلی (Image URL) *</label>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... یا /products/item.png"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              {/* گالری چند تصویره */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block font-bold text-[var(--text-secondary)]">تصاویر آلبوم و گالری کالا:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGalleryInput}
                    onChange={(e) => setNewGalleryInput(e.target.value)}
                    placeholder="URL تصویر گالری..."
                    className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-xs text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryImage}
                    className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold cursor-pointer"
                  >
                    + افزودن به گالری
                  </button>
                </div>

                {galleryUrls.length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-1">
                    {galleryUrls.map((url, i) => (
                      <div key={i} className="relative group w-14 h-14 rounded-xl border border-[var(--card-border)] overflow-hidden bg-black/5 p-1">
                        <img src={url} alt="" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(i)}
                          className="absolute inset-0 bg-rose-600/80 text-white font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">توضیحات و نقد و بررسی تخصصی</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مشخصات پنل، نرخ تازه‌سازی، پورت‌ها و ویژگی‌های کلیدی..."
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium leading-relaxed text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="flex items-center gap-4 sm:col-span-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={isSpecialOffer}
                    onChange={(e) => setIsSpecialOffer(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent-blue)]"
                  />
                  <span>نمایش در بخش پیشنهاد شگفت‌انگیز 🔥</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent-blue)]"
                  />
                  <span>قابل خرید و فعال در ویترین</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold text-[var(--text-secondary)]"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                {saving ? "در حال ذخیره‌سازی..." : "ذخیره در دیتابیس 💾"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}