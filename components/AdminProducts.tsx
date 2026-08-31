"use client";

import React, { useState, useEffect, useRef } from "react";
import { productService, Product, ProductVariant, MarketBenchmark } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";
import ProductExplodedView from "@/components/ProductExplodedView";
import { formatPrice } from "@/lib/formatters";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<
    "general" | "pricing" | "gallery" | "variants" | "specs" | "comparison" | "seo"
  >("general");

  const [title, setTitle] = useState("");
  const [titleFa, setTitleFa] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("Apple");
  const [category, setCategory] = useState("کالای دیجیتال");
  const [badge, setBadge] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState<string[]>([""]);

  const [priceRaw, setPriceRaw] = useState<number | "">("");
  const [discountPriceRaw, setDiscountPriceRaw] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">(10);
  const [warranty, setWarranty] = useState("۱۸ ماه گارانتی معتبر شرکتی + ۷ روز ضمانت بازگشت وجه");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: "ابعاد نمایشگر", value: "۲۷ اینچ 5K Retina" },
    { key: "شدت روشنایی", value: "۶۰۰ نیت (Nit)" },
    { key: "پوشش رنگ", value: "۱۰۰٪ sRGB و DCI-P3" },
  ]);

  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmark[]>([
    { storeName: "ترب (Torob)", price: 0, minPrice: 0, maxPrice: 0, warranty: "گارانتی معمولی", isOurStore: false, deliveryTime: "۳ روز" },
    { storeName: "دیجی‌کالا (Digikala)", price: 0, minPrice: 0, maxPrice: 0, warranty: "گارانتی شرکتی", isOurStore: false, deliveryTime: "۲ روز" },
    { storeName: "فروشگاه مستقیم ما (تضمین کمترین نرخ)", price: 0, minPrice: 0, maxPrice: 0, warranty: "گارانتی طلایی ۱۸ ماهه", isOurStore: true, deliveryTime: "ارسال فوری پیشتاز" },
  ]);

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

  const handleSelectProduct = (p: Product) => {
    soundEngine.playClick();
    setSelectedProduct(p);
    setTitle(p.title || p.name || "");
    setTitleFa(p.title_fa || "");
    setSku(p.sku || `SKU-${p.id.slice(-6)}`);
    setBrand(p.brand || "Apple");
    setCategory(p.category || "کالای دیجیتال");
    setBadge(p.badge || "");
    setShortDesc(p.short_description || "");
    setDescription(p.description || "");
    setHighlights(p.highlights && p.highlights.length > 0 ? p.highlights : [""]);

    setPriceRaw(p.price || "");
    setDiscountPriceRaw(p.discountPrice || p.discount_price || "");
    setStock(p.stock !== undefined ? p.stock : 10);
    setWarranty(p.warranty || "۱۸ ماه گارانتی معتبر شرکتی");
    setIsAvailable(p.isAvailable !== false && p.is_available !== false);
    setIsFeatured(Boolean(p.is_featured));

    setImageUrls(p.images && p.images.length > 0 ? p.images : [p.image || ""]);
    setVariants(p.variants || []);

    if (p.specs && typeof p.specs === "object") {
      const parsed = Object.entries(p.specs).map(([key, value]) => ({ key, value: String(value) }));
      setSpecs(parsed.length > 0 ? parsed : [{ key: "", value: "" }]);
    }

    if (p.market_comparison && p.market_comparison.length > 0) {
      setMarketBenchmarks(p.market_comparison);
    }

    setMetaTitle(p.meta_title || p.title);
    setMetaDescription(p.meta_description || p.description?.slice(0, 140) || "");
  };

  const handleCreateNew = () => {
    soundEngine.playClick();
    setSelectedProduct(null);
    setTitle("");
    setTitleFa("");
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setBrand("Apple");
    setCategory(categories[0]?.name || "کالای دیجیتال");
    setBadge("");
    setShortDesc("");
    setDescription("");
    setHighlights(["کیفیت ساخت فوق‌العاده", "کالیبراسیون دقیق کارخانه"]);
    setPriceRaw("");
    setDiscountPriceRaw("");
    setStock(10);
    setWarranty("۱۸ ماه گارانتی اصالت طلایی آکسون");
    setIsAvailable(true);
    setIsFeatured(false);
    setImageUrls([""]);
    setVariants([]);
    setSpecs([
      { key: "رزولوشن تصویر", value: "5K Retina" },
      { key: "درگاه‌های اتصال", value: "Thunderbolt 4 + USB-C" },
    ]);
    setActiveFormTab("general");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || priceRaw === "") {
      setStatusMessage({ type: "error", text: "عنوان کالا و قیمت پایه الزامی هستند." });
      return;
    }

    soundEngine.playClick();
    setSaving(true);

    const specsMap: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specsMap[s.key.trim()] = s.value.trim();
      }
    });

    const validImages = imageUrls.map((u) => u.trim()).filter(Boolean);
    const validHighlights = highlights.map((h) => h.trim()).filter(Boolean);

    const payload: Partial<Product> = {
      id: selectedProduct?.id,
      title: title.trim(),
      name: title.trim(),
      title_fa: titleFa.trim() || undefined,
      sku: sku.trim() || undefined,
      brand: brand.trim() || "Apple",
      category,
      price: Number(priceRaw),
      discountPrice: discountPriceRaw !== "" ? Number(discountPriceRaw) : undefined,
      stock: stock !== "" ? Number(stock) : 10,
      badge: badge.trim() || undefined,
      short_description: shortDesc.trim() || undefined,
      description: description.trim(),
      highlights: validHighlights,
      warranty: warranty.trim(),
      images: validImages.length > 0 ? validImages : ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"],
      image: validImages[0] || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
      variants: variants.filter((v) => v.name.trim().length > 0),
      specs: specsMap,
      market_comparison: marketBenchmarks,
      meta_title: metaTitle.trim() || title.trim(),
      meta_description: metaDescription.trim() || shortDesc.trim() || description.slice(0, 140),
      isAvailable,
      is_available: isAvailable,
      is_featured: isFeatured,
    };

    const result = await productService.saveProduct(payload);
    setSaving(false);

    if (result) {
      soundEngine.playSuccess();
      setStatusMessage({ type: "success", text: "⚡ کالا با موفقیت ذخیره و در ویترین منتشر شد." });
      loadData();
      if (!selectedProduct) setSelectedProduct(result);
    } else {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی محصول." });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>💎</span> مرکز جامع مدیریت کاتالوگ کالا و مشخصات مهندسی
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تولید مشخصات هوشمند، تنوع رنگ، مشخصات متالورژی، مقایسه قیمت بازار و کالبدشکافی ۳D
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
        <div className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* کاتالوگ سمت راست */}
        <div className="lg:col-span-4 bg-[var(--modal-bg)] p-4 sm:p-5 rounded-3xl border border-[var(--card-border)] space-y-3 shadow-xl h-fit">
          <h3 className="text-xs font-black border-b border-[var(--card-border)] pb-3 flex justify-between items-center">
            <span>📦 کاتالوگ کالاها ({products.length})</span>
            <span className="text-[10px] text-[var(--accent-blue)] font-bold">کلیک جهت ویرایش</span>
          </h3>
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                  selectedProduct?.id === p.id
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-sm"
                    : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                }`}
              >
                <img src={p.images?.[0] || p.image || "/placeholder.png"} alt="" className="w-12 h-12 object-contain rounded-xl bg-white/5 p-1 border border-[var(--card-border)] shrink-0" />
                <div className="overflow-hidden flex-1 space-y-1">
                  <h4 className="text-xs font-black truncate">{p.title || p.name}</h4>
                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold block" suppressHydrationWarning>
                    {formatPrice(p.discountPrice || p.price || 0)} تومان
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* فرم ادیتور سمت چپ با تب‌های منظم Wrap شده */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
            
            {/* تب‌های منظم و بدون بریدگی */}
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[var(--card-border)]">
              {[
                { id: "general", label: "اطلاعات پایه", icon: "📝" },
                { id: "pricing", label: "قیمت و انبار", icon: "💰" },
                { id: "gallery", label: "گالری تصاویر", icon: "🖼️" },
                { id: "variants", label: "تنوع و رنگ‌ها", icon: "🎨" },
                { id: "specs", label: "مشخصات فنی", icon: "⚙️" },
                { id: "comparison", label: "مقایسه قیمت بازار", icon: "📊" },
                { id: "seo", label: "سئو و تگ‌ها", icon: "🌐" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveFormTab(tab.id as any);
                  }}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activeFormTab === tab.id
                      ? "bg-[var(--accent-blue)] text-white shadow-md scale-105"
                      : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--card-border)]"
                  }`}
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
                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]" />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان فارسی / مدل دقیق</label>
                    <input type="text" value={titleFa} onChange={(e) => setTitleFa(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">دسته‌بندی فروشگاه</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] cursor-pointer outline-none">
                      {categories.map((c) => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                      <option value="کالای دیجیتال">کالای دیجیتال</option>
                      <option value="لپ‌تاپ و ورک‌استیشن">لپ‌تاپ و ورک‌استیشن</option>
                      <option value="مانیتور و استودیو">مانیتور و استودیو</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">توضیحات تخصصی و معرفی کالا</label>
                  <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium leading-relaxed outline-none" />
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
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">قیمت با تخفیف (تومان)</label>
                    <input
                      type="number"
                      value={discountPriceRaw}
                      onChange={(e) => setDiscountPriceRaw(e.target.value ? Number(e.target.value) : "")}
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
                  <input type="text" value={warranty} onChange={(e) => setWarranty(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none" />
                </div>
              </div>
            )}

            {activeFormTab === "gallery" && (
              <div className="space-y-3">
                <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden" />
                <button type="button" onClick={() => setImageUrls([...imageUrls, ""])} className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer">
                  + افزودن لینک عکس
                </button>
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" value={url} onChange={(e) => {
                      const arr = [...imageUrls];
                      arr[idx] = e.target.value;
                      setImageUrls(arr);
                    }} placeholder="https://..." className="flex-1 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs text-[var(--text-primary)] outline-none" />
                    <button type="button" onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer">✕</button>
                  </div>
                ))}
              </div>
            )}

            {activeFormTab === "variants" && (
              <div className="space-y-3">
                <button type="button" onClick={() => setVariants([...variants, { id: `var_${Date.now()}`, name: "رنگ جدید", colorHex: "#000000" }])} className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer">
                  + افزودن رنگ و مدل کالا
                </button>
                {variants.map((v, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-center p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                    <input type="text" value={v.name} onChange={(e) => {
                      const arr = [...variants];
                      arr[idx].name = e.target.value;
                      setVariants(arr);
                    }} placeholder="نام رنگ" className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs flex-1" />
                    <input type="color" value={v.colorHex || "#000"} onChange={(e) => {
                      const arr = [...variants];
                      arr[idx].colorHex = e.target.value;
                      setVariants(arr);
                    }} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent" />
                    <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== idx))} className="p-2 px-3 rounded-xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer">🗑️</button>
                  </div>
                ))}
              </div>
            )}

            {activeFormTab === "specs" && (
              <div className="space-y-3">
                <button type="button" onClick={() => setSpecs([...specs, { key: "", value: "" }])} className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer">
                  + افزودن مشخصه فنی
                </button>
                {specs.map((s, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" value={s.key} onChange={(e) => {
                      const arr = [...specs];
                      arr[idx].key = e.target.value;
                      setSpecs(arr);
                    }} placeholder="پارامتر" className="w-1/3 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs" />
                    <input type="text" value={s.value} onChange={(e) => {
                      const arr = [...specs];
                      arr[idx].value = e.target.value;
                      setSpecs(arr);
                    }} placeholder="مقدار" className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs" />
                    <button type="button" onClick={() => setSpecs(specs.filter((_, i) => i !== idx))} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer">✕</button>
                  </div>
                ))}
              </div>
            )}

            {activeFormTab === "comparison" && (
              <div className="space-y-3">
                <span className="font-bold text-[var(--text-secondary)] block">پلتفرم‌های مقایسه قیمت بازار (ترب، ایمالز، دیجی‌کالا):</span>
                {marketBenchmarks.map((bm, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <span className="font-bold text-xs">{bm.storeName}</span>
                    <input type="number" value={bm.minPrice || bm.price} onChange={(e) => {
                      const arr = [...marketBenchmarks];
                      arr[idx].minPrice = Number(e.target.value);
                      setMarketBenchmarks(arr);
                    }} placeholder="کف قیمت" className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs" />
                    <input type="number" value={bm.maxPrice || bm.price} onChange={(e) => {
                      const arr = [...marketBenchmarks];
                      arr[idx].maxPrice = Number(e.target.value);
                      setMarketBenchmarks(arr);
                    }} placeholder="سقف قیمت" className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs" />
                  </div>
                ))}
              </div>
            )}

            {activeFormTab === "seo" && (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان سئو گوگل (Meta Title)</label>
                  <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">توضیحات متای گوگل (Meta Description)</label>
                  <input type="text" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium outline-none" />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button type="submit" disabled={saving} className="flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50">
                {saving ? "در حال ذخیره..." : "💾 ذخیره و انتشار کالا"}
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
