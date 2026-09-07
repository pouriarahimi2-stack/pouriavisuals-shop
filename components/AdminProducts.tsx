"use client";

import React, { useState, useEffect, useRef } from "react";
import { productService, Product, ProductVariant } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";
import ProductExplodedView from "@/components/ProductExplodedView";
import { formatPrice } from "@/lib/formatters";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<
    "general" | "pricing" | "gallery" | "variants" | "specs" | "seo"
  >("general");

  const [title, setTitle] = useState("");
  const [titleFa, setTitleFa] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("Apple");
  const [category, setCategory] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [editCatName, setEditCatName] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [showEditCat, setShowEditCat] = useState(false);
  const [description, setDescription] = useState("");

  const [priceRaw, setPriceRaw] = useState<number | "">("");
  const [discountPriceRaw, setDiscountPriceRaw] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">(10);
  const [warranty, setWarranty] = useState("۱۸ ماه گارانتی معتبر شرکتی");
  const [isAvailable, setIsAvailable] = useState(true);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([]);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [explodedPreviewOpen, setExplodedPreviewOpen] = useState(false);

  const loadData = async () => {
    const [prods, cats] = await Promise.all([
      productService.getAll(),
      categoryService.getAll(),
    ]);
    setProducts(prods || []);
    setCategories(cats || []);
    if (cats && cats.length > 0 && !category) {
      setCategory(cats[0].name);
    }
  };

  useEffect(() => {
    loadData();

    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };
    const handleCategoriesUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setCategories(e.detail);
    };

    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("categories_updated", handleCategoriesUpdate);

    return () => {
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("categories_updated", handleCategoriesUpdate);
    };
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!selectedProduct || metaTitle === title) {
      setMetaTitle(val ? val + " | خرید و بررسی تخصصی" : "");
    }
  };

  const handleDescChange = (val: string) => {
    setDescription(val);
    if (!selectedProduct || metaDescription.startsWith(description.slice(0, 30))) {
      setMetaDescription(val.replace(/<[^>]*>/g, "").slice(0, 150));
    }
  };

  const handleSelectProduct = (p: Product) => {
    soundEngine.playClick();
    setSelectedProduct(p);
    setTitle(p.title || p.name || "");
    setTitleFa(p.title_fa || "");
    setSku(p.sku || "");
    setBrand(p.brand || "Apple");
    setCategory(p.category || (categories[0]?.name || "عمومی"));
    setDescription(p.description || "");

    setPriceRaw(p.price || "");
    setDiscountPriceRaw(p.discountPrice || p.discount_price || "");
    setStock(p.stock !== undefined ? p.stock : 10);
    setWarranty(p.warranty || "۱۸ ماه گارانتی معتبر شرکتی");
    setIsAvailable(p.isAvailable !== false && p.is_available !== false);

    setImageUrls(p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []));
    setVariants(p.variants || []);

    if (p.specs && typeof p.specs === "object") {
      const parsed = Object.entries(p.specs).map(([key, value]) => ({ key, value: String(value) }));
      setSpecs(parsed);
    } else {
      setSpecs([]);
    }

    setMetaTitle(p.meta_title || p.title || "");
    setMetaDescription(p.meta_description || p.description?.slice(0, 150) || "");
  };

  const handleCreateNew = () => {
    soundEngine.playClick();
    setSelectedProduct(null);
    setTitle("");
    setTitleFa("");
    setSku("");
    setBrand("Apple");
    setCategory(categories[0]?.name || "تجهیزات");
    setDescription("");
    setPriceRaw("");
    setDiscountPriceRaw("");
    setStock(10);
    setWarranty("۱۸ ماه گارانتی اصالت طلایی");
    setIsAvailable(true);
    setImageUrls([]);
    setVariants([]);
    setSpecs([]);
    setMetaTitle("");
    setMetaDescription("");
    setActiveFormTab("general");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    soundEngine.playClick();
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/webp", 0.85);
          setImageUrls((prev) => [...prev, compressedDataUrl]);
        };
      };
      reader.readAsDataURL(file);
    });
  };

  // افزودن سریع دسته‌بندی جدید
  const handleAddCategoryQuick = async () => {
    if (!newCatName.trim()) return;
    soundEngine.playClick();
    const created = await categoryService.addCategory({ name: newCatName.trim() });
    if (created) {
      soundEngine.playSuccess();
      setCategories((prev) => [...prev, created]);
      setCategory(created.name);
      setNewCatName("");
      setShowAddCat(false);
      setStatusMessage({ type: "success", text: "✓ دسته‌بندی «" + created.name + "» ایجاد گردید." });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // ویرایش سریع نام دسته‌بندی جاری
  const handleEditCategoryQuick = async () => {
    if (!editCatName.trim() || !category) return;
    soundEngine.playClick();
    const currentCatObj = categories.find((c) => c.name === category);
    if (!currentCatObj) return;

    const updated = await categoryService.updateCategory(currentCatObj.id, editCatName.trim());
    if (updated) {
      soundEngine.playSuccess();
      setCategories((prev) => prev.map((c) => (c.id === currentCatObj.id ? updated : c)));
      setCategory(updated.name);
      setEditCatName("");
      setShowEditCat(false);
      setStatusMessage({ type: "success", text: "✓ نام دسته‌بندی به «" + updated.name + "» تغییر یافت." });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // حذف سریع دسته‌بندی جاری از دیتابیس
  const handleDeleteCategoryQuick = async () => {
    if (!category) return;
    const currentCatObj = categories.find((c) => c.name === category);
    if (!currentCatObj) return;

    if (!confirm("آیا از حذف کامل دسته‌بندی «" + category + "» از پایگاه داده اطمینان دارید؟")) return;

    soundEngine.playClick();
    const ok = await categoryService.deleteCategory(currentCatObj.id, category);
    if (ok) {
      soundEngine.playSuccess();
      const updatedCats = categories.filter((c) => c.id !== currentCatObj.id);
      setCategories(updatedCats);
      setCategory(updatedCats[0]?.name || "");
      setStatusMessage({ type: "success", text: "دسته‌بندی «" + category + "» با موفقیت حذف گردید." });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleDeleteProduct = async (id: string, prodTitle: string) => {
    if (!confirm("آیا از حذف کامل محصول «" + prodTitle + "» اطمینان دارید؟")) return;
    soundEngine.playClick();
    const ok = await productService.deleteProduct(id);
    if (ok) {
      soundEngine.playSuccess();
      setStatusMessage({ type: "success", text: "محصول با موفقیت از دیتابیس حذف شد." });
      loadData();
      if (selectedProduct?.id === id) handleCreateNew();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || priceRaw === "") {
      setStatusMessage({ type: "error", text: "عنوان کالا و قیمت پایه الزامی هستند." });
      return;
    }

    soundEngine.playClick();
    setSaving(true);
    setStatusMessage(null);

    const specsMap: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specsMap[s.key.trim()] = s.value.trim();
      }
    });

    const validImages = imageUrls.map((u) => u.trim()).filter(Boolean);
    const productId = selectedProduct?.id || ("prod_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7));

    const payload: Partial<Product> = {
      id: productId,
      title: title.trim(),
      name: title.trim(),
      title_fa: titleFa.trim() || undefined,
      sku: sku.trim() || ("SKU-" + productId.slice(-6).toUpperCase()),
      brand: brand.trim() || "Apple",
      category: category || "تجهیزات تخصصی",
      price: Number(priceRaw),
      discountPrice: discountPriceRaw !== "" ? Number(discountPriceRaw) : undefined,
      discount_price: discountPriceRaw !== "" ? Number(discountPriceRaw) : undefined,
      stock: stock !== "" ? Number(stock) : 10,
      warranty: warranty.trim(),
      images: validImages,
      image: validImages[0] || "",
      variants: variants.filter((v) => v.name.trim().length > 0),
      specs: specsMap,
      description: description.trim(),
      meta_title: metaTitle.trim() || title.trim(),
      meta_description: metaDescription.trim() || description.slice(0, 150),
      isAvailable,
      is_available: isAvailable,
    };

    const result = await productService.saveProduct(payload);
    setSaving(false);

    if (result) {
      soundEngine.playSuccess();
      setStatusMessage({ type: "success", text: "✓ کالا با موفقیت در دیتابیس ذخیره و منتشر شد." });
      loadData();
      if (!selectedProduct) setSelectedProduct(result);
    } else {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی محصول در پایگاه داده." });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>💎</span> مرکز جامع مدیریت کاتالوگ کالا و مشخصات مهندسی
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            مدیریت دسته‌ها، آپلود تصویر از سیستم و موبایل، سئو خودکار و اتصال ۱۰۰٪ به دیتابیس
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedProduct && (
            <button
              type="button"
              onClick={() => setExplodedPreviewOpen(true)}
              className="px-5 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-black text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🧬</span>
              <span>تست نمای انفجاری ۳D</span>
            </button>
          )}

          <button
            onClick={handleCreateNew}
            className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer"
          >
            + محصول جدید
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={"p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " + (statusMessage.type === "success" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400")}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* کاتالوگ سمت راست */}
        <div className="lg:col-span-4 bg-[var(--modal-bg)] p-4 sm:p-5 rounded-3xl border border-[var(--card-border)] space-y-3 shadow-xl h-fit">
          <div className="border-b border-[var(--card-border)] pb-3 flex justify-between items-center">
            <span className="text-xs font-black">📦 کاتالوگ کالاها ({products.length})</span>
            <button onClick={handleCreateNew} className="text-[11px] text-[var(--accent-blue)] font-bold hover:underline cursor-pointer">
              + ایجاد جدید
            </button>
          </div>
          
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {products.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)] font-bold">
                هنوز کالایی در دیتابیس ثبت نشده است. با دکمه «محصول جدید» کالا اضافه کنید.
              </div>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className={"p-3 rounded-2xl border transition flex items-center justify-between gap-2 " + (
                    selectedProduct?.id === p.id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-sm"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                  )}
                >
                  <div
                    onClick={() => handleSelectProduct(p)}
                    className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
                  >
                    <img
                      src={p.images?.[0] || p.image || "/placeholder.png"}
                      alt=""
                      className="w-12 h-12 object-contain rounded-xl bg-white/5 p-1 border border-[var(--card-border)] shrink-0"
                    />
                    <div className="overflow-hidden space-y-1">
                      <h4 className="text-xs font-black truncate">{p.title || p.name}</h4>
                      <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold block" suppressHydrationWarning>
                        {formatPrice(p.discountPrice || p.price || 0)} تومان
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(p.id, p.title || p.name || "کالا");
                    }}
                    className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 transition flex items-center justify-center text-xs cursor-pointer shrink-0"
                    title="حذف از دیتابیس"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* فرم ادیتور سمت چپ */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
            
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[var(--card-border)]">
              {[
                { id: "general", label: "اطلاعات پایه", icon: "📝" },
                { id: "pricing", label: "قیمت و انبار", icon: "💰" },
                { id: "gallery", label: "گالری تصاویر", icon: "🖼️" },
                { id: "variants", label: "تنوع و رنگ‌ها", icon: "🎨" },
                { id: "specs", label: "مشخصات فنی", icon: "⚙️" },
                { id: "seo", label: "سئو و تگ‌ها", icon: "🌐" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveFormTab(tab.id as any);
                  }}
                  className={"px-4 py-2.5 rounded-2xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 " + (
                    activeFormTab === tab.id
                      ? "bg-[var(--accent-blue)] text-white shadow-md scale-105"
                      : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--card-border)]"
                  )}
                >
                  <span>{tab.icon}</span><span>{tab.label}</span>
                </button>
              ))}
            </div>

            {activeFormTab === "general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان اصلی کالا *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="مثال: Apple Studio Display 27 5K"
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان فارسی / مدل دقیق</label>
                    <input
                      type="text"
                      value={titleFa}
                      onChange={(e) => setTitleFa(e.target.value)}
                      placeholder="نمایشگر استودیو اپل ۲۷ اینچ"
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none"
                    />
                  </div>

                  {/* بخش دسته‌بندی با امکان افزودن، ویرایش نام و حذف مستقیم */}
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">دسته‌بندی کالا در فروشگاه</label>
                    <div className="flex gap-1.5 items-center">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="flex-1 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] cursor-pointer outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.id || c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => { setShowAddCat(!showAddCat); setShowEditCat(false); }}
                        className="px-3 py-3 rounded-2xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold cursor-pointer whitespace-nowrap"
                        title="افزودن دسته‌بندی جدید"
                      >
                        + دسته
                      </button>

                      {category && (
                        <>
                          <button
                            type="button"
                            onClick={() => { setShowEditCat(!showEditCat); setEditCatName(category); setShowAddCat(false); }}
                            className="p-3 rounded-2xl bg-[var(--input-bg)] hover:border-amber-500 border border-[var(--card-border)] text-xs font-bold cursor-pointer"
                            title="ویرایش نام این دسته"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteCategoryQuick}
                            className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 text-xs font-bold cursor-pointer"
                            title="حذف این دسته از دیتابیس"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>

                    {/* پنل افزودن دسته */}
                    {showAddCat && (
                      <div className="flex gap-2 mt-2 animate-fadeIn">
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="نام دسته‌بندی جدید..."
                          className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddCategoryQuick}
                          className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer"
                        >
                          ثبت
                        </button>
                      </div>
                    )}

                    {/* پنل ویرایش نام دسته جاری */}
                    {showEditCat && (
                      <div className="flex gap-2 mt-2 animate-fadeIn">
                        <input
                          type="text"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          placeholder="نام جدید دسته‌بندی..."
                          className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-amber-500 font-bold text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleEditCategoryQuick}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black cursor-pointer"
                        >
                          ذخیره نام
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">توضیحات تخصصی و مشخصات کالا</label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => handleDescChange(e.target.value)}
                    placeholder="مشخصات و ویژگی‌های کالا..."
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium leading-relaxed outline-none"
                  />
                </div>
              </div>
            )}

            {activeFormTab === "pricing" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">قیمت پایه (تومان) *</label>
                    <input
                      type="number"
                      required
                      value={priceRaw}
                      onChange={(e) => setPriceRaw(e.target.value ? Number(e.target.value) : "")}
                      placeholder="۱۰۰۰۰۰۰"
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">قیمت با تخفیف (تومان)</label>
                    <input
                      type="number"
                      value={discountPriceRaw}
                      onChange={(e) => setDiscountPriceRaw(e.target.value ? Number(e.target.value) : "")}
                      placeholder="اختیاری"
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">موجودی در انبار</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value ? Number(e.target.value) : "")}
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-[var(--text-primary)] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">شرایط گارانتی و خدمات پس از فروش</label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>
            )}

            {activeFormTab === "gallery" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <span>📁</span>
                    <span>انتخاب عکس از کامپیوتر یا موبایل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrls([...imageUrls, ""])}
                    className="px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
                  >
                    + افزودن آدرس اینترنتی (URL)
                  </button>
                </div>

                {imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--card-border)] bg-black/10 group">
                        <img src={url || "/placeholder.png"} alt="" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {imageUrls.map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        const arr = [...imageUrls];
                        arr[idx] = e.target.value;
                        setImageUrls(arr);
                      }}
                      placeholder="https://... یا تصویر آپلود شده"
                      className="flex-1 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs text-[var(--text-primary)] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                      className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeFormTab === "variants" && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setVariants([...variants, { id: "var_" + Date.now(), name: "رنگ جدید", colorHex: "#000000" }])}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer"
                >
                  + افزودن رنگ و تنوع کالا
                </button>
                {variants.map((v, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-center p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => {
                        const arr = [...variants];
                        arr[idx].name = e.target.value;
                        setVariants(arr);
                      }}
                      placeholder="نام رنگ (مثال: نقره‌ای استودیو)"
                      className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs flex-1"
                    />
                    <input
                      type="color"
                      value={v.colorHex || "#000000"}
                      onChange={(e) => {
                        const arr = [...variants];
                        arr[idx].colorHex = e.target.value;
                        setVariants(arr);
                      }}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                      className="p-2 px-3 rounded-xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeFormTab === "specs" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[var(--text-secondary)]">مشخصات فنی و پارامترهای مهندسی کالا:</span>
                  <button
                    type="button"
                    onClick={() => setSpecs([...specs, { key: "", value: "" }])}
                    className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer"
                  >
                    + افزودن مشخصه فنی
                  </button>
                </div>
                
                {specs.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center text-[var(--text-secondary)]">
                    مشخصه‌ای تعریف نشده است. با دکمه بالا مشخصات دلخواه را وارد کنید.
                  </div>
                ) : (
                  specs.map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={s.key}
                        onChange={(e) => {
                          const arr = [...specs];
                          arr[idx].key = e.target.value;
                          setSpecs(arr);
                        }}
                        placeholder="پارامتر (مثال: رزولوشن تصویر)"
                        className="w-1/3 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                      />
                      <input
                        type="text"
                        value={s.value}
                        onChange={(e) => {
                          const arr = [...specs];
                          arr[idx].value = e.target.value;
                          setSpecs(arr);
                        }}
                        placeholder="مقدار (مثال: 5K Retina)"
                        className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                        className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeFormTab === "seo" && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان سئو گوگل (Meta Title)</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="عنوان سئو به صورت خودکار از عنوان کالا تولید می‌شود..."
                    className="w-full p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">توضیحات متای گوگل (Meta Description)</label>
                  <textarea
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="توضیحات متا به صورت خودکار از توضیحات کالا تنظیم می‌شود..."
                    className="w-full p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium outline-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>{saving ? "در حال ذخیره‌سازی در دیتابیس..." : "ذخیره و انتشار کالا"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {selectedProduct && (
        <ProductExplodedView
          productId={selectedProduct.id}
          productTitle={selectedProduct.title}
          category={selectedProduct.category}
          isOpen={explodedPreviewOpen}
          onClose={() => setExplodedPreviewOpen(false)}
        />
      )}
    </div>
  );
}
