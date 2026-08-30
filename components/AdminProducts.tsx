// File Path: components/AdminProducts.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { productService, Product, ProductVariant, MarketBenchmark } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";
import ProductExplodedView from "@/components/ProductExplodedView";

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

  // قیمت‌گذاری با قابلیت جداسازی ۳ رقمی ارقام
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
    { key: "درگاه‌های اتصال", value: "یک تاندربولت ۳ و ۳ عدد USB-C" },
  ]);

  // سامانه پایش و تحلیل هوشمند قیمت رقبای بازار (ترب، ایمالز، دیجی‌کالا، باسلام و دیوار)
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmark[]>([
    { storeName: "متوسط ترب و ایمالز", price: 0, minPrice: 0, maxPrice: 0, warranty: "گارانتی متفرقه", isOurStore: false, deliveryTime: "۳ الی ۵ روز" },
    { storeName: "دیجی‌کالا / باسلام", price: 0, minPrice: 0, maxPrice: 0, warranty: "گارانتی شرکتی", isOurStore: false, deliveryTime: "۲ الی ۴ روز" },
    { storeName: "فروشگاه مستقیم ما (تضمین کمترین نرخ)", price: 0, minPrice: 0, maxPrice: 0, warranty: "گارانتی طلایی ۱۸ ماهه", isOurStore: true, deliveryTime: "ارسال فوری پیشتاز" },
  ]);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [isAiGenerating, setIsAiGenerating] = useState(false);
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
      else categoryService.getAll().then((c) => c && setCategories(c));
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
    } else {
      setSpecs([{ key: "", value: "" }]);
    }

    if (p.market_comparison && p.market_comparison.length > 0) {
      setMarketBenchmarks(p.market_comparison);
    } else {
      setMarketBenchmarks([
        { storeName: "متوسط ترب و ایمالز", price: Number(p.price || 0) + 1500000, minPrice: Number(p.price || 0) + 1000000, maxPrice: Number(p.price || 0) + 2500000, warranty: "گارانتی معمولی", isOurStore: false, deliveryTime: "۳ الی ۵ روز" },
        { storeName: "دیجی‌کالا / باسلام", price: Number(p.price || 0) + 2000000, minPrice: Number(p.price || 0) + 1800000, maxPrice: Number(p.price || 0) + 3000000, warranty: "گارانتی شرکتی", isOurStore: false, deliveryTime: "۲ الی ۴ روز" },
        { storeName: "فروشگاه مستقیم ما (تضمین کمترین نرخ)", price: Number(p.discountPrice || p.price || 0), minPrice: Number(p.discountPrice || p.price || 0), maxPrice: Number(p.discountPrice || p.price || 0), warranty: p.warranty || "گارانتی طلایی ۱۸ ماهه", isOurStore: true, deliveryTime: "ارسال فوری پیشتاز" },
      ]);
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
    setHighlights(["کیفیت ساخت فوق‌العاده و پنل رتینا", "کالیبراسیون سخت‌افزاری کارخانه", "پشتیبانی کامل از استاندارد DCI-P3"]);

    setPriceRaw("");
    setDiscountPriceRaw("");
    setStock(10);
    setWarranty("۱۸ ماه گارانتی معتبر شرکتی + ۷ روز ضمانت بازگشت");
    setIsAvailable(true);
    setIsFeatured(false);

    setImageUrls([""]);
    setVariants([
      { id: "v1", name: "خاکستری فضایی", modelType: "بی‌سیم بلوتوث ۵.۳", colorHex: "#4b5563", priceDelta: 0, stock: 5 },
      { id: "v2", name: "نقره‌ای مات", modelType: "پرو با کابل تاندربولت", colorHex: "#e5e7eb", priceDelta: 0, stock: 5 },
    ]);

    setSpecs([
      { key: "رزولوشن تصویر", value: "5120x2880 (5K)" },
      { key: "نوع پنل", value: "IPS با زاویه دید ۱۷۸ درجه" },
      { key: "پورت‌های ارتباطی", value: "Thunderbolt 3 + 3x USB-C" },
      { key: "اسپیکر و وب‌کم", value: "دوربین ۱۲ مگاپیکسل + ۶ اسپیکر استودیو" },
    ]);

    setMarketBenchmarks([
      { storeName: "متوسط ترب و ایمالز", price: 0, minPrice: 0, maxPrice: 0, warranty: "گارانتی معمولی", isOurStore: false, deliveryTime: "۳ الی ۵ روز" },
      { storeName: "دیجی‌کالا / باسلام", price: 0, minPrice: 0, maxPrice: 0, warranty: "گارانتی شرکتی", isOurStore: false, deliveryTime: "۲ الی ۴ روز" },
      { storeName: "فروشگاه مستقیم ما (تضمین کمترین نرخ)", price: 0, minPrice: 0, maxPrice: 0, warranty: "گارانتی طلایی ۱۸ ماهه", isOurStore: true, deliveryTime: "ارسال فوری پیشتاز" },
    ]);

    setMetaTitle("");
    setMetaDescription("");
    setActiveFormTab("general");
  };

  const handleAiAutoFill = async () => {
    if (!title.trim()) {
      alert("لطفاً ابتدا عنوان کالا را وارد نمایید.");
      return;
    }

    soundEngine.playClick();
    setIsAiGenerating(true);

    try {
      const prompt = `به عنوان مهندس ارشد سخت‌افزار، مشخصات فنی دقیق، توضیحات تبلیغاتی، نکات برجسته، مدل‌ها و سئو برای کالای «${title.trim()}» در دسته «${category}» تولید کن.
خروجی فقط یک JSON معتبر:
{
  "titleFa": "عنوان فارسی جذاب",
  "shortDesc": "خلاصه دو خطی جذاب",
  "description": "توضیحات کامل و تخصصی فنی با تاکید بر مزایا و گارانتی",
  "highlights": ["مزیت ۱", "مزیت ۲", "مزیت ۳", "مزیت ۴"],
  "specs": {
    "رزولوشن": "...",
    "روشنایی": "...",
    "پوشش رنگ": "...",
    "درگاه‌ها": "..."
  },
  "metaTitle": "عنوان سئو مناسب گوگل",
  "metaDescription": "توضیحات متا ۱۶۰ کاراکتری"
}`;

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, role: "admin" }),
      });

      const json = await res.json();
      const rawText = json.response || json.reply || "";
      const match = rawText.match(/\{[\s\S]*\}/);

      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.titleFa) setTitleFa(parsed.titleFa);
        if (parsed.shortDesc) setShortDesc(parsed.shortDesc);
        if (parsed.description) setDescription(parsed.description);
        if (Array.isArray(parsed.highlights)) setHighlights(parsed.highlights);
        if (parsed.specs) {
          const specArr = Object.entries(parsed.specs).map(([key, value]) => ({ key, value: String(value) }));
          setSpecs(specArr);
        }
        if (parsed.metaTitle) setMetaTitle(parsed.metaTitle);
        if (parsed.metaDescription) setMetaDescription(parsed.metaDescription);

        soundEngine.playSuccess();
        setStatusMessage({ type: "success", text: "✨ مشخصات فنی و محتوای سئو با هوش مصنوعی تکمیل شد." });
      }
    } catch {
      alert("خطا در ارتباط با هوش مصنوعی.");
    } finally {
      setIsAiGenerating(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  // فشرده‌سازی خودکار تصویر در مرورگر قبل از آپلود
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
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
          const compressedDataUrl = canvas.toDataURL("image/webp", 0.82);
          resolve(compressedDataUrl);
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const optimizedUrl = await compressImage(file);
      setImageUrls((prev) => {
        const filtered = prev.filter((u) => u.trim().length > 0);
        return [...filtered, optimizedUrl];
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addImageField = () => setImageUrls([...imageUrls, ""]);
  const updateImageUrl = (idx: number, val: string) => {
    const arr = [...imageUrls];
    arr[idx] = val;
    setImageUrls(arr);
  };
  const removeImageField = (idx: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== idx));
  };

  const addVariant = () => {
    setVariants([...variants, { id: `var_${Date.now()}`, name: "رنگ جدید", modelType: "مدل استاندارد", colorHex: "#000000", priceDelta: 0, stock: 5 }]);
  };
  const updateVariant = (idx: number, field: keyof ProductVariant, val: any) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: val };
    setVariants(updated);
  };
  const removeVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const addSpecField = () => setSpecs([...specs, { key: "", value: "" }]);
  const updateSpecField = (idx: number, field: "key" | "value", val: string) => {
    const arr = [...specs];
    arr[idx][field] = val;
    setSpecs(arr);
  };
  const removeSpecField = (idx: number) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const addBenchmark = () => {
    setMarketBenchmarks([...marketBenchmarks, { storeName: "فروشگاه رقیب", price: Number(priceRaw || 0), minPrice: Number(priceRaw || 0), maxPrice: Number(priceRaw || 0), warranty: "شرکتی", isOurStore: false, deliveryTime: "۲ روزه" }]);
  };
  const updateBenchmark = (idx: number, field: keyof MarketBenchmark, val: any) => {
    const arr = [...marketBenchmarks];
    arr[idx] = { ...arr[idx], [field]: val };
    setMarketBenchmarks(arr);
  };
  const removeBenchmark = (idx: number) => {
    setMarketBenchmarks(marketBenchmarks.filter((_, i) => i !== idx));
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
      brand: brand.trim() || undefined,
      category,
      price: Number(priceRaw),
      discountPrice: discountPriceRaw !== "" ? Number(discountPriceRaw) : undefined,
      stock: stock !== "" ? Number(stock) : 10,
      badge: badge.trim() || undefined,
      short_description: shortDesc.trim() || undefined,
      description: description.trim(),
      highlights: validHighlights,
      warranty: warranty.trim(),
      images: validImages.length > 0 ? validImages : ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600"],
      image: validImages[0] || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600",
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
      setStatusMessage({ type: "success", text: "⚡ کالا با موفقیت ذخیره و در ویترین فروشگاه منتشر شد." });
      loadData();
      if (!selectedProduct) setSelectedProduct(result);
    } else {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی محصول در پایگاه داده." });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف کامل این کالا از دیتابیس اطمینان دارید؟")) return;
    soundEngine.playClick();
    const ok = await productService.deleteProduct(id);
    if (ok) {
      handleCreateNew();
      loadData();
      setStatusMessage({ type: "success", text: "محصول حذف گردید." });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>💎</span> مرکز جامع مدیریت کاتالوگ کالا و مشخصات مهندسی
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تولید مشخصات هوشمند با AI، تنوع رنگ و مدل، مشخصات متالورژی، مقایسه قیمت بازار و کالبدشکافی ۳D
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAiAutoFill}
            disabled={isAiGenerating || !title.trim()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>✨</span>
            <span>{isAiGenerating ? "در حال پردازش AI..." : "تولید مشخصات با هوش مصنوعی"}</span>
          </button>

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* لیست محصولات */}
        <div className="lg:col-span-1 bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-3 shadow-xl h-fit">
          <h3 className="text-xs font-black border-b border-[var(--card-border)] pb-3">
            📦 کاتالوگ کالاها ({products.length})
          </h3>
          <div className="space-y-2 max-h-[680px] overflow-y-auto">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                  selectedProduct?.id === p.id
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                    : "border-[var(--card-border)] bg-[var(--input-bg)]"
                }`}
              >
                <img src={p.images?.[0] || p.image || "/placeholder.png"} alt="" className="w-11 h-11 object-contain rounded-xl bg-white/5 p-1 border border-[var(--card-border)]" />
                <div className="overflow-hidden flex-1">
                  <h4 className="text-xs font-black truncate">{p.title || p.name}</h4>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {Number(p.discountPrice || p.price || 0).toLocaleString("fa-IR")} ت
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* فرم ۷ تب تنظیمات کالا */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[var(--card-border)] scrollbar-none">
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
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeFormTab === tab.id
                      ? "bg-[var(--accent-blue)] text-white shadow-md"
                      : "bg-[var(--input-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]"
                  }`}
                >
                  <span>{tab.icon}</span><span>{tab.label}</span>
                </button>
              ))}
            </div>

            {activeFormTab === "general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان اصلی کالا *</label>
                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)]" />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان فارسی / مدل دقیق</label>
                    <input type="text" value={titleFa} onChange={(e) => setTitleFa(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)]" />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">برند سازنده</label>
                    <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)]" />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">دسته‌بندی فروشگاه</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] cursor-pointer">
                      {categories.map((c) => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                      <option value="کالای دیجیتال">کالای دیجیتال</option>
                      <option value="مانیتور و استودیو">مانیتور و استودیو</option>
                      <option value="لوازم جانبی">لوازم جانبی</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">توضیحات تخصصی و معرفی کالا</label>
                  <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium leading-relaxed" />
                </div>
              </div>
            )}

            {activeFormTab === "pricing" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">قیمت پایه (تومان) *</label>
                    <input
                      type="text"
                      required
                      value={priceRaw !== "" ? Number(priceRaw).toLocaleString("fa-IR") : ""}
                      onChange={(e) => {
                        const numeric = e.target.value.replace(/\D/g, "");
                        setPriceRaw(numeric ? Number(numeric) : "");
                      }}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-[var(--text-primary)] text-left"
                      placeholder="مثال: ۲۵,۰۰۰,۰۰۰"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">قیمت با تخفیف ویژه (تومان)</label>
                    <input
                      type="text"
                      value={discountPriceRaw !== "" ? Number(discountPriceRaw).toLocaleString("fa-IR") : ""}
                      onChange={(e) => {
                        const numeric = e.target.value.replace(/\D/g, "");
                        setDiscountPriceRaw(numeric ? Number(numeric) : "");
                      }}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-emerald-600 text-left"
                      placeholder="مثال: ۲۲,۵۰۰,۰۰۰"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">تعداد موجود در انبار</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value ? Number(e.target.value) : "")}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">شرایط گارانتی و خدمات پس از فروش</label>
                  <input type="text" value={warranty} onChange={(e) => setWarranty(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)]" />
                </div>
              </div>
            )}

            {activeFormTab === "gallery" && (
              <div className="space-y-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple className="hidden" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5">
                    <span>📁</span>
                    <span>آپلود عکس فشرده‌شده از دستگاه</span>
                  </button>
                  <button type="button" onClick={addImageField} className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer">
                    + لینک عکس
                  </button>
                </div>
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" value={url} onChange={(e) => updateImageUrl(idx, e.target.value)} placeholder="https://..." className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs text-[var(--text-primary)]" />
                    <button type="button" onClick={() => removeImageField(idx)} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer">✕</button>
                  </div>
                ))}
              </div>
            )}

            {activeFormTab === "variants" && (
              <div className="space-y-3">
                <button type="button" onClick={addVariant} className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer">
                  + افزودن رنگ و مدل کالا
                </button>
                {variants.map((v, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-center p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                    <input type="text" value={v.name} onChange={(e) => updateVariant(idx, "name", e.target.value)} placeholder="نام رنگ (مثلا: تیتانیوم مشکی)" className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs flex-1" />
                    <input type="text" value={v.modelType || ""} onChange={(e) => updateVariant(idx, "modelType", e.target.value)} placeholder="نوع مدل (مثلا: بی‌سیم)" className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs flex-1" />
                    <input type="color" value={v.colorHex || "#000"} onChange={(e) => updateVariant(idx, "colorHex", e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer bg-transparent" />
                    <button type="button" onClick={() => removeVariant(idx)} className="p-2 px-3 rounded-xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer">🗑️</button>
                  </div>
                ))}
              </div>
            )}

            {activeFormTab === "specs" && (
              <div className="space-y-3">
                <button type="button" onClick={addSpecField} className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer">
                  + افزودن ویژگی فنی
                </button>
                {specs.map((s, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" value={s.key} onChange={(e) => updateSpecField(idx, "key", e.target.value)} placeholder="عنوان پارامتر" className="w-1/3 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs" />
                    <input type="text" value={s.value} onChange={(e) => updateSpecField(idx, "value", e.target.value)} placeholder="مقدار فنی" className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs" />
                    <button type="button" onClick={() => removeSpecField(idx)} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer">✕</button>
                  </div>
                ))}
              </div>
            )}

            {activeFormTab === "comparison" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[var(--text-secondary)]">پایش و مقایسه هوشمند با رقبای بازار (ترب، ایمالز، دیجی‌کالا، باسلام و دیوار):</span>
                  <button type="button" onClick={addBenchmark} className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer">
                    + رقیب جدید
                  </button>
                </div>
                {marketBenchmarks.map((bm, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <input type="text" value={bm.storeName} onChange={(e) => updateBenchmark(idx, "storeName", e.target.value)} placeholder="نام فروشگاه / پلتفرم" className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs" />
                    <input type="number" value={bm.minPrice || bm.price} onChange={(e) => updateBenchmark(idx, "minPrice", Number(e.target.value))} placeholder="کف قیمت بازار" className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs" />
                    <input type="number" value={bm.maxPrice || bm.price} onChange={(e) => updateBenchmark(idx, "maxPrice", Number(e.target.value))} placeholder="سقف قیمت بازار" className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs" />
                    <button type="button" onClick={() => removeBenchmark(idx)} className="p-2 rounded-xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer">حذف ✕</button>
                  </div>
                ))}
              </div>
            )}

            {activeFormTab === "seo" && (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان سئو گوگل (Meta Title)</label>
                  <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)]" />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">توضیحات متای گوگل (Meta Description)</label>
                  <input type="text" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium" />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button type="submit" disabled={saving} className="flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50">
                {saving ? "در حال ذخیره..." : "💾 ذخیره و انتشار کالا"}
              </button>
              {selectedProduct?.id && (
                <button type="button" onClick={() => handleDelete(selectedProduct.id)} className="px-6 py-4 rounded-2xl bg-rose-500/15 text-rose-600 font-bold cursor-pointer">
                  حذف کالا ✕
                </button>
              )}
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