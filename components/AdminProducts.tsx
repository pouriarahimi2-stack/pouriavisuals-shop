"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { supabase } from "@/lib/supabase";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [title, setTitle] = useState("");
  const [titleFa, setTitleFa] = useState("");
  const [category, setCategory] = useState("کالای دیجیتال");
  const [price, setPrice] = useState<number | "">("");
  const [discountPrice, setDiscountPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">(10);
  const [description, setDescription] = useState("");
  const [warranty, setWarranty] = useState("۱۸ ماه گارانتی معتبر شرکتی");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: "رزولوشن", value: "" },
    { key: "پنل", value: "" },
  ]);
  const [isAvailable, setIsAvailable] = useState(true);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    const [prods, cats] = await Promise.all([
      productService.getAll(),
      categoryService.getAll(),
    ]);
    setProducts(prods);
    setCategories(cats);
  };

  useEffect(() => {
    loadData();

    // همگام‌سازی بلادرنگ محصولات با وب‌سوکت
    const channel = supabase
      .channel("admin-products-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setTitle(p.title || p.name || "");
    setTitleFa(p.title_fa || "");
    setCategory(p.category || "کالای دیجیتال");
    setPrice(p.price || "");
    setDiscountPrice(p.discountPrice || p.discount_price || "");
    setStock(p.stock !== undefined ? p.stock : 10);
    setDescription(p.description || "");
    setWarranty(p.warranty || "۱۸ ماه گارانتی معتبر شرکتی");
    setImageUrls(p.images && p.images.length > 0 ? p.images : [p.image || ""]);
    
    if (p.specs && typeof p.specs === "object") {
      const parsed = Object.entries(p.specs).map(([key, value]) => ({ key, value: String(value) }));
      setSpecs(parsed.length > 0 ? parsed : [{ key: "", value: "" }]);
    } else {
      setSpecs([{ key: "", value: "" }]);
    }
    setIsAvailable(p.isAvailable !== false && p.is_available !== false);
  };

  const handleCreateNew = () => {
    setSelectedProduct(null);
    setTitle("");
    setTitleFa("");
    setCategory(categories[0]?.name || "کالای دیجیتال");
    setPrice("");
    setDiscountPrice("");
    setStock(10);
    setDescription("");
    setWarranty("۱۸ ماه گارانتی معتبر شرکتی");
    setImageUrls([""]);
    setSpecs([
      { key: "رزولوشن", value: "" },
      { key: "نوع پنل", value: "" },
    ]);
    setIsAvailable(true);
  };

  const addImageField = () => setImageUrls([...imageUrls, ""]);
  const updateImageUrl = (index: number, val: string) => {
    const updated = [...imageUrls];
    updated[index] = val;
    setImageUrls(updated);
  };
  const removeImageField = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const addSpecField = () => setSpecs([...specs, { key: "", value: "" }]);
  const updateSpecField = (index: number, field: "key" | "value", val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };
  const removeSpecField = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || price === "") {
      setStatusMessage({ type: "error", text: "نام محصول و قیمت الزامی هستند." });
      return;
    }

    setSaving(true);
    const specsObject = specs.reduce((acc, curr) => {
      if (curr.key.trim() && curr.value.trim()) {
        acc[curr.key.trim()] = curr.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    const validImages = imageUrls.map((i) => i.trim()).filter(Boolean);

    const payload: Partial<Product> = {
      id: selectedProduct?.id,
      title: title.trim(),
      name: title.trim(),
      title_fa: titleFa.trim() || undefined,
      category,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stock: stock !== "" ? Number(stock) : 10,
      description,
      warranty,
      images: validImages,
      image: validImages[0] || "",
      specs: specsObject,
      isAvailable,
      is_available: isAvailable,
    };

    const result = await productService.saveProduct(payload);
    setSaving(false);

    if (result) {
      setStatusMessage({ type: "success", text: "⚡ محصول با موفقیت در دیتابیس ثبت و در سایت منتشر شد." });
      loadData();
      if (!selectedProduct && result) setSelectedProduct(result);
    } else {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی محصول." });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این محصول اطمینان دارید؟")) return;
    const ok = await productService.deleteProduct(id);
    if (ok) {
      handleCreateNew();
      loadData();
      setStatusMessage({ type: "success", text: "محصول با موفقیت حذف گردید." });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">🛍️ کاتالوگ محصولات و مشخصات فنی</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">مدیریت قیمت‌ها، تصاویر چندگانه و مشخصات به صورت ابری و وب‌سوکت</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition shadow-md cursor-pointer"
        >
          + افزودن محصول جدید
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* لیست محصولات */}
        <div className="lg:col-span-1 bg-[var(--modal-bg)] p-5 rounded-3xl border border-[var(--card-border)] space-y-3 shadow-sm h-fit">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📦 لیست محصولات ({products.length})
          </h3>
          <div className="space-y-2 max-h-[540px] overflow-y-auto">
            {products.length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)] font-medium text-center py-6">هیچ محصولی ثبت نشده است.</p>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                    selectedProduct?.id === p.id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                  }`}
                >
                  <img
                    src={p.images?.[0] || p.image || "/placeholder.png"}
                    alt=""
                    className="w-10 h-10 object-contain rounded-xl bg-white/5 p-1 border border-[var(--card-border)] shrink-0"
                  />
                  <div className="overflow-hidden flex-1">
                    <h4 className="text-xs font-black text-[var(--text-primary)] truncate">{p.title || p.name}</h4>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(p.discountPrice || p.price || 0).toLocaleString("fa-IR")} ت
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* فرم ویرایشگر کالا */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">عنوان کالا (لاتین یا اصلی) *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: Apple Studio Display 27-inch 5K"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">عنوان فارسی کالا</label>
                <input
                  type="text"
                  value={titleFa}
                  onChange={(e) => setTitleFa(e.target.value)}
                  placeholder="مثال: مانیتور ۲۷ اینچ اپل استودیو دیسپلی ۵K"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">دسته‌بندی</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="مانیتور تدوین">مانیتور تدوین</option>
                  <option value="کالیبراتور رنگ">کالیبراتور رنگ</option>
                  <option value="کارت کپچر">کارت کپچر</option>
                  <option value="نورپردازی استودیو">نورپردازی استودیو</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">گارانتی و ضمانت</label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">قیمت اصلی (تومان) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="مثال: 95000000"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-black text-[var(--text-primary)] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">قیمت با تخفیف (اختیاری)</label>
                <input
                  type="number"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="مثال: 89000000"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-black text-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">موجودی در انبار</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value ? Number(e.target.value) : "")}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="prodAvail"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
                />
                <label htmlFor="prodAvail" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                  کالا موجود و آماده سفارش‌گذاری است
                </label>
              </div>
            </div>

            {/* تصاویر چندگانه کالا */}
            <div className="space-y-2 border-t border-[var(--card-border)] pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-secondary)]">گالری تصاویر کالا (URLها)</label>
                <button type="button" onClick={addImageField} className="text-[11px] font-bold text-[var(--accent-blue)] hover:underline cursor-pointer">
                  + افزودن عکس دیگر
                </button>
              </div>
              <div className="space-y-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`آدرس اینترنتی تصویر ${idx + 1}...`}
                      value={url}
                      onChange={(e) => updateImageUrl(idx, e.target.value)}
                      className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono"
                    />
                    {imageUrls.length > 1 && (
                      <button type="button" onClick={() => removeImageField(idx)} className="px-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold cursor-pointer">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* مشخصات فنی */}
            <div className="space-y-2 border-t border-[var(--card-border)] pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-secondary)]">مشخصات فنی و جدول ویژگی‌ها</label>
                <button type="button" onClick={addSpecField} className="text-[11px] font-bold text-[var(--accent-blue)] hover:underline cursor-pointer">
                  + ویژگی جدید
                </button>
              </div>
              <div className="space-y-2">
                {specs.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="عنوان (مثال: درگاه‌ها)"
                      value={item.key}
                      onChange={(e) => updateSpecField(idx, "key", e.target.value)}
                      className="w-1/3 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="مقدار (مثال: ۳x Thunderbolt 3)"
                      value={item.value}
                      onChange={(e) => updateSpecField(idx, "value", e.target.value)}
                      className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs"
                    />
                    <button type="button" onClick={() => removeSpecField(idx)} className="px-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold cursor-pointer">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* توضیحات */}
            <div className="space-y-1.5 border-t border-[var(--card-border)] pt-4">
              <label className="block text-xs font-bold text-[var(--text-secondary)]">توضیحات و نقد و بررسی محصول</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیحات کامل درباره کارایی و ویژگی‌های متمایز این کالا..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs leading-relaxed outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs cursor-pointer hover:opacity-90 transition shadow-lg disabled:opacity-50"
              >
                {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار کالا در فروشگاه"}
              </button>
              {selectedProduct?.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedProduct.id)}
                  className="px-5 py-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 font-bold text-xs hover:bg-rose-500 hover:text-white transition cursor-pointer"
                >
                  حذف کالا ✕
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}