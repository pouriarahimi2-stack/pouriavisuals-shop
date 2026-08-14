"use client";

import React, { useState, useEffect } from "react";
import { productService, Product, Category } from "@/services/productService";

const DRAFT_KEY = "admin_product_draft_v2";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    price: string;
    discountPrice: string;
    category: string;
    subCategory: string;
    stock: string;
    image: string;
    description: string;
    isSpecial: boolean;
  }>({
    name: "",
    price: "",
    discountPrice: "",
    category: "",
    subCategory: "",
    stock: "10",
    image: "",
    description: "",
    isSpecial: false,
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [selectedCatForSub, setSelectedCatForSub] = useState<string>("");
  const [newSubCatName, setNewSubCatName] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    setProducts(productService.getProducts());
    const cats = productService.getCategories();
    setCategories(cats);
    if (cats.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: cats[0].name }));
    }
  };

  useEffect(() => {
    loadData();
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) setHasDraft(true);
  }, []);

  // 🔄 ذخیره خودکار پیش‌نویس (Auto-Save)
  useEffect(() => {
    if (isFormOpen && !editingProduct) {
      const timer = setTimeout(() => {
        if (formData.name || formData.price || formData.description) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
          setHasDraft(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [formData, isFormOpen, editingProduct]);

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      setFormData(JSON.parse(savedDraft));
      setIsFormOpen(true);
      showToast("📥 پیش‌نویس ذخیره‌شده بازیابی شد.");
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  // 🖼️ الگوریتم هوشمند فشرده‌سازی تصویر روی کلاینت (جلوگیری از لود سنگین سایت)
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
        const MAX_WIDTH = 800; // حداکثر عرض استاندارد
        const scaleFactor = MAX_WIDTH / img.width;
        
        canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        canvas.height = img.width > MAX_WIDTH ? img.height * scaleFactor : img.height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // فشرده‌سازی با کیفیت بهینه WebP/JPEG
        const compressedBase64 = canvas.toDataURL("image/webp", 0.75);
        setFormData((prev) => ({ ...prev, image: compressedBase64 }));
        showToast("⚡ تصویر با موفقیت فشرده‌سازی و بارگذاری شد.");
      };
    };
  };

  const handleCategoryChange = (catName: string) => {
    const selectedCat = categories.find((c) => c.name === catName);
    const firstSub = selectedCat?.subcategories[0]?.name || "";
    setFormData((prev) => ({
      ...prev,
      category: catName,
      subCategory: firstSub,
    }));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCategory: Category = {
      id: "cat-" + Date.now(),
      name: newCatName.trim(),
      subcategories: [],
    };
    const updated = [...categories, newCategory];
    setCategories(updated);
    productService.saveCategories(updated);
    setNewCatName("");
    showToast(`✅ دسته‌بندی "${newCategory.name}" اضافه شد.`);
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm("آیا از حذف این دسته‌بندی اطمینان دارید؟")) {
      const updated = categories.filter((c) => c.id !== catId);
      setCategories(updated);
      productService.saveCategories(updated);
      showToast("🗑️ دسته‌بندی حذف شد.");
    }
  };

  const handleAddSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatForSub || !newSubCatName.trim()) return;

    const updated = categories.map((cat) => {
      if (cat.id === selectedCatForSub) {
        return {
          ...cat,
          subcategories: [
            ...cat.subcategories,
            { id: "sub-" + Date.now(), name: newSubCatName.trim() },
          ],
        };
      }
      return cat;
    });

    setCategories(updated);
    productService.saveCategories(updated);
    setNewSubCatName("");
    showToast("✨ زیردسته‌بندی جدید ثبت شد.");
  };

  const handleDeleteSubCategory = (catId: string, subId: string) => {
    const updated = categories.map((cat) => {
      if (cat.id === catId) {
        return {
          ...cat,
          subcategories: cat.subcategories.filter((s) => s.id !== subId),
        };
      }
      return cat;
    });
    setCategories(updated);
    productService.saveCategories(updated);
    showToast("🗑️ زیردسته حذف شد.");
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      showToast("⚠️ لطفاً نام و قیمت محصول را وارد کنید.");
      return;
    }

    const productPayload = {
      name: formData.name.trim(),
      price: Number(formData.price),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
      category: formData.category || (categories[0]?.name ?? "عمومی"),
      subCategory: formData.subCategory || undefined,
      stock: Number(formData.stock || 0),
      image: formData.image,
      description: formData.description,
      isSpecial: formData.isSpecial,
    };

    if (editingProduct) {
      productService.updateProduct(editingProduct.id, productPayload);
      showToast("✅ تغییرات محصول با موفقیت ذخیره شد!");
    } else {
      productService.addProduct(productPayload);
      showToast("🎉 محصول جدید به انبار اضافه شد!");
      clearDraft();
    }

    resetForm();
    loadData();
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      price: prod.price.toString(),
      discountPrice: prod.discountPrice ? prod.discountPrice.toString() : "",
      category: prod.category || (categories[0]?.name ?? "عمومی"),
      subCategory: prod.subCategory || "",
      stock: (prod.stock ?? 10).toString(),
      image: prod.image || "",
      description: prod.description || "",
      isSpecial: prod.isSpecial || false,
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      discountPrice: "",
      category: categories[0]?.name || "عمومی",
      subCategory: "",
      stock: "10",
      image: "",
      description: "",
      isSpecial: false,
    });
    setIsFormOpen(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`آیا از حذف محصول "${name}" اطمینان دارید؟`)) {
      productService.deleteProduct(id);
      loadData();
      showToast("🗑️ محصول با موفقیت حذف شد.");
    }
  };

  const currentCategoryObj = categories.find((c) => c.name === formData.category);

  return (
    <div className="space-y-6 select-none text-xs font-sans">
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold shadow-2xl border border-white/20 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* هدر کنترل انبار */}
      <div className="liquid-glass-card p-5 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2">
            <span>📦</span> انبارداری و مدیریت هوشمند محصولات
          </h3>
          <p className="opacity-60 text-[11px] mt-0.5">کنترل موجودی، قیمت‌گذاری، دسته‌بندی و آپلود تصویر</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasDraft && !isFormOpen && (
            <button
              onClick={restoreDraft}
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold hover:bg-amber-500/30 transition cursor-pointer flex items-center gap-1"
            >
              📥 بازیابی پیش‌نویس خودکار
            </button>
          )}

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600 font-bold transition cursor-pointer flex items-center gap-1"
          >
            📂 مدیریت دسته‌بندی‌ها
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(!isFormOpen);
            }}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold hover:opacity-90 transition cursor-pointer flex items-center gap-1 shadow-md"
          >
            {isFormOpen ? "✕ بستن فرم" : "➕ افزودن محصول جدید"}
          </button>
        </div>
      </div>

      {/* فرم کالا با Auto-Save و آپلود فشرده */}
      {isFormOpen && (
        <form onSubmit={handleSubmitProduct} className="liquid-glass-card p-6 space-y-4 border-white/20 shadow-2xl animate-fadeIn">
          <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-3">
            <h4 className="font-extrabold text-sm text-[var(--accent-blue)]">
              {editingProduct ? `✏️ ویرایش محصول: ${editingProduct.name}` : "➕ ثبت کالا و محصول جدید در انبار"}
            </h4>
            <span className="text-[10px] opacity-70 text-emerald-400 font-bold">
              ⚡ پیش‌نویس به‌صورت خودکار ذخیره می‌شود
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold opacity-70">نام محصول *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="نام کامل کالا..."
                className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">قیمت اصلی (تومان) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="60000000"
                className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">قیمت با تخفیف (اختیاری)</label>
              <input
                type="number"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                placeholder="55000000"
                className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">دسته‌بندی اصلی *</label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/10 dark:bg-slate-900 border border-[var(--glass-border)] outline-none font-bold cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    📂 {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">زیردسته‌بندی</label>
              <select
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/10 dark:bg-slate-900 border border-[var(--glass-border)] outline-none font-bold cursor-pointer"
              >
                <option value="">بدون زیردسته</option>
                {currentCategoryObj?.subcategories.map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    └ {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">موجودی انبار</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none font-mono"
              />
            </div>
          </div>

          {/* نوار تصویر: لینک مستقیم یا انتخاب و فشرده‌سازی خودکار عکس */}
          <div className="space-y-2">
            <label className="block font-bold opacity-70">تصویر محصول (آدرس URL یا آپلود عکس با فشرده‌سازی هوشمند)</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="https://... یا آپلود عکس"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="flex-1 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none font-mono text-[11px]"
              />
              <label className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer hover:bg-indigo-500 transition shrink-0">
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

          <div>
            <label className="block mb-1 font-bold opacity-70">توضیحات و مشخصات کالا</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={formData.isSpecial}
                onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
                className="w-4 h-4 rounded accent-[var(--accent-blue)]"
              />
              <span>⭐ افزودن به ویترین پیشنهاد ویژه صفحه اصلی</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold hover:opacity-90 shadow-md cursor-pointer"
              >
                {editingProduct ? "ذخیره تغییرات 💾" : "انتشار محصول 🚀"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* لیست کالاهای انبار */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.length === 0 ? (
          <div className="col-span-full liquid-glass-card p-12 text-center opacity-60">
            هنوز هیچ محصولی در انبار ثبت نشده است.
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="liquid-glass-card p-4 rounded-3xl space-y-3 flex flex-col justify-between border border-[var(--glass-border)] hover:border-[var(--accent-blue)] transition relative overflow-hidden"
            >
              <div className="space-y-2">
                <div className="w-full h-36 rounded-2xl bg-black/20 relative overflow-hidden flex items-center justify-center">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-3xl opacity-30">🖼️</span>
                  )}
                  {p.isSpecial && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-amber-500 text-black font-extrabold text-[9px]">
                      پیشنهاد ویژه ⭐
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] opacity-70 font-bold mb-0.5">
                    <span className="text-indigo-300">📁 {p.category}</span>
                    {p.subCategory && <span>└ {p.subCategory}</span>}
                  </div>
                  <h4 className="font-extrabold text-xs line-clamp-1">{p.name}</h4>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--glass-border)] space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="opacity-60 text-[10px]">موجودی: {p.stock || 0} عدد</span>
                  <div className="text-right">
                    {p.discountPrice && (
                      <span className="line-through opacity-50 block text-[10px]">
                        {p.price.toLocaleString("fa-IR")}
                      </span>
                    )}
                    <span className="text-[var(--accent-blue)] font-mono text-xs">
                      {(p.discountPrice || p.price).toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => startEditProduct(p)}
                    className="flex-1 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-bold transition cursor-pointer"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id, p.name)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-bold transition cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* مدال مدیریت دسته‌بندی‌ها */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="liquid-glass-card max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 border-white/20 shadow-2xl bg-slate-950 text-white rounded-3xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-black text-sm text-indigo-300 flex items-center gap-2">
                <span>📁</span> مدیریت هوشمند دسته‌بندی‌ها و زیردسته‌بندی‌ها
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
              >
                ✕ بستن
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="font-extrabold text-xs text-indigo-200 block">۱. ساخت دسته‌بندی اصلی جدید:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثلاً: لوازم خانگی"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 font-bold hover:bg-indigo-500 cursor-pointer shadow-md"
                >
                  ➕ ساخت دسته
                </button>
              </div>
            </form>

            <form onSubmit={handleAddSubCategory} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="font-extrabold text-xs text-indigo-200 block">۲. افزودن زیردسته‌بندی به دسته اصلی:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={selectedCatForSub}
                  onChange={(e) => setSelectedCatForSub(e.target.value)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-white/10 font-bold outline-none cursor-pointer"
                >
                  <option value="">انتخاب دسته اصلی...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      📂 {c.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="مثلاً: یخچال و فریزر"
                  value={newSubCatName}
                  onChange={(e) => setNewSubCatName(e.target.value)}
                  className="p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500 cursor-pointer shadow-md"
              >
                ➕ ثبت زیردسته
              </button>
            </form>

            <div className="space-y-3 pt-2">
              <span className="font-extrabold text-xs opacity-70 block">لیست ساختار دسته‌بندی‌های فعال:</span>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="font-extrabold text-indigo-300 text-xs">📂 {cat.name}</span>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-rose-400 hover:text-rose-600 font-bold text-[11px] cursor-pointer"
                      >
                        🗑️ حذف دسته
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {cat.subcategories.length === 0 ? (
                        <span className="text-[10px] opacity-50">بدون زیردسته</span>
                      ) : (
                        cat.subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="px-2.5 py-1 rounded-xl bg-black/30 border border-white/10 flex items-center gap-2 text-[11px]"
                          >
                            <span>└ {sub.name}</span>
                            <button
                              onClick={() => handleDeleteSubCategory(cat.id, sub.id)}
                              className="text-rose-400 font-bold hover:text-rose-600 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}