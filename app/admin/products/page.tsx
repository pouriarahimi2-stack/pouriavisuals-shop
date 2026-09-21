"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Edit, ArrowRight, Search, SlidersHorizontal,
  X, Image as ImageIcon, Video, CheckCircle, LayoutGrid, List,
  Package, ChevronDown, ChevronUp
} from "lucide-react";
import Link from "next/link";

interface SpecItem { key: string; value: string; }

type SortKey = "newest" | "oldest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc";
type ViewMode = "grid" | "table";

export default function AdminProductsPage() {
  // ── محصولات ───────────────────────────────────────────────────
  const [products,  setProducts]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [viewMode,  setViewMode]  = useState<ViewMode>("table");

  // ── جستجو / فیلتر ─────────────────────────────────────────────
  const [searchQuery,        setSearchQuery]        = useState("");
  const [filterCategory,     setFilterCategory]     = useState("all");
  const [filterAvailability, setFilterAvailability] = useState<"all"|"in_stock"|"out_of_stock">("all");
  const [filterSort,         setFilterSort]         = useState<SortKey>("newest");
  const [showFilters,        setShowFilters]        = useState(false);

  // ── فرم افزودن / ویرایش ────────────────────────────────────────
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [title,         setTitle]         = useState("");
  const [category,      setCategory]      = useState("");
  const [priceToman,    setPriceToman]    = useState("");
  const [discountToman, setDiscountToman] = useState("");
  const [stock,         setStock]         = useState<number>(10);
  const [warranty,      setWarranty]      = useState("");
  const [videoUrl,      setVideoUrl]      = useState("");
  const [description,   setDescription]   = useState("");
  const [images,        setImages]        = useState<string[]>([]);
  const [imgInput,      setImgInput]      = useState("");
  const [specsList,     setSpecsList]     = useState<SpecItem[]>([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  // ── دسته‌های منحصربه‌فرد از محصولات بارگذاری‌شده ────────────────
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => String(p.category || "عمومی").trim()).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  // ── لیست فیلترشده و مرتب‌شده ─────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // جستجو در نام، دسته و توضیحات
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((p) =>
        (p.title || p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }

    // فیلتر دسته
    if (filterCategory !== "all") {
      list = list.filter((p) => (p.category || "عمومی") === filterCategory);
    }

    // فیلتر موجودی
    if (filterAvailability === "in_stock")    list = list.filter((p) => Number(p.stock) > 0);
    if (filterAvailability === "out_of_stock") list = list.filter((p) => Number(p.stock) <= 0);

    // مرتب‌سازی
    list.sort((a, b) => {
      switch (filterSort) {
        case "oldest":     return new Date(a.created_at||0).getTime() - new Date(b.created_at||0).getTime();
        case "price_asc":  return Number(a.price||0) - Number(b.price||0);
        case "price_desc": return Number(b.price||0) - Number(a.price||0);
        case "stock_asc":  return Number(a.stock||0) - Number(b.stock||0);
        case "stock_desc": return Number(b.stock||0) - Number(a.stock||0);
        default:           return new Date(b.created_at||0).getTime() - new Date(a.created_at||0).getTime();
      }
    });

    return list;
  }, [products, searchQuery, filterCategory, filterAvailability, filterSort]);

  const activeFiltersCount = [
    searchQuery.trim() ? 1 : 0,
    filterCategory     !== "all" ? 1 : 0,
    filterAvailability !== "all" ? 1 : 0,
    filterSort         !== "newest" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const resetFilters = () => {
    setSearchQuery(""); setFilterCategory("all");
    setFilterAvailability("all"); setFilterSort("newest");
  };

  // ── آپلود تصویر ───────────────────────────────────────────────
  const compressImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const img = new Image(); const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1200; const scale = Math.min(1, MAX / img.width);
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", 0.82));
    };
    img.onerror = reject; reader.readAsDataURL(file);
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file);
        setImages((prev) => [...prev, compressed]);
      } catch {}
    }
  };

  const addImageByUrl = () => {
    const url = imgInput.trim();
    if (url && !images.includes(url)) { setImages([...images, url]); setImgInput(""); }
  };

  const formatNumber  = (v: string) => String(v||"").replace(/\D/g,"").replace(/\B(?=(\d{3})+(?!\d))/g,",");
  const parseRawNumber = (v: string) => Number(String(v||"").replace(/,/g,"")) || 0;

  // ── ویرایش محصول ──────────────────────────────────────────────
  const handleEditClick = (p: any) => {
    setEditingId(p.id);
    setTitle(p.title || p.name || "");
    setCategory(p.category || "");
    setPriceToman(formatNumber(String(p.price || "")));
    setDiscountToman(p.discount_price ? formatNumber(String(p.discount_price)) : "");
    setStock(p.stock ?? 10);

    let rawDesc = p.description || "";
    let extractedImages: string[] = [];
    let extractedWarranty = p.warranty || "";
    let extractedVideo = "";
    let extractedSpecs: Record<string, string> = {};

    const metaMatch = rawDesc.match(/<!--MEDIA_METADATA:([\s\S]*?)-->/);
    if (metaMatch) {
      try {
        const meta = JSON.parse(metaMatch[1]);
        if (Array.isArray(meta.images)) extractedImages = meta.images;
        if (meta.warranty)  extractedWarranty = meta.warranty;
        if (meta.video_url) extractedVideo    = meta.video_url;
        if (meta.specs)     extractedSpecs    = meta.specs;
        rawDesc = rawDesc.replace(metaMatch[0], "").trim();
      } catch {}
    }
    if (extractedImages.length === 0 && p.image_url) extractedImages = [p.image_url];

    setImages(extractedImages); setWarranty(extractedWarranty);
    setVideoUrl(extractedVideo); setDescription(rawDesc);
    const sp = Object.entries(extractedSpecs).map(([key, value]) => ({ key, value: String(value) }));
    setSpecsList(sp.length > 0 ? sp : [{ key: "توان مصرفی", value: "" }, { key: "ظرفیت مخزن", value: "" }]);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null); setTitle(""); setCategory(""); setPriceToman("");
    setDiscountToman(""); setStock(10); setWarranty(""); setVideoUrl("");
    setDescription(""); setImages([]); setImgInput("");
    setSpecsList([{ key: "توان مصرفی", value: "" }, { key: "ظرفیت مخزن", value: "" }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { alert("نام محصول الزامی است."); return; }

    const specsObject: Record<string, string> = {};
    specsList.forEach((item) => {
      if (item.key.trim() && item.value.trim()) specsObject[item.key.trim()] = item.value.trim();
    });

    const payload = {
      id: editingId || undefined,
      title: title.trim(),
      category: category.trim() || "عمومی",
      price: parseRawNumber(priceToman),
      discount_price: discountToman ? parseRawNumber(discountToman) : null,
      stock: Number(stock), warranty: warranty.trim() || null,
      video_url: videoUrl.trim() || null, description, images, specs: specsObject,
    };

    setSaving(true);
    try {
      const res  = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "خطا در ارتباط با سرور");
      alert("کالا با موفقیت ذخیره گردید!"); setIsModalOpen(false); fetchProducts();
    } catch (err: any) { alert("خطا: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این کالا مطمئن هستید؟")) return;
    try {
      const res  = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { setProducts((prev) => prev.filter((p) => p.id !== id)); }
      else alert("خطا در حذف: " + data.message);
    } catch (err: any) { alert("خطا: " + err.message); }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-10 dir-rtl">

      {/* ── هدر صفحه ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-hover)] text-sm font-bold flex items-center gap-2">
            <ArrowRight size={18} /> پیشخوان
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
              <Package size={24} className="text-[var(--accent-blue)]" />
              مدیریت کاتالوگ و انبار کالاها
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {products.length} محصول ثبت‌شده · نمایش {filteredProducts.length} مورد
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(v => v === "table" ? "grid" : "table")}
            className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-[var(--card-hover)] transition"
            title={viewMode === "table" ? "نمای کارتی" : "نمای جدول"}
          >
            {viewMode === "table" ? <LayoutGrid size={18} /> : <List size={18} />}
          </button>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-5 py-2.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold text-sm shadow-lg flex items-center gap-2"
          >
            <Plus size={18} /> افزودن محصول
          </button>
        </div>
      </div>

      {/* ── نوار جستجو و فیلتر ──────────────────────────────────── */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-2">
          {/* جستجو */}
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام، دسته‌بندی یا توضیحات محصول..."
              className="w-full py-2.5 pr-10 pl-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-sm font-bold outline-none focus:border-[var(--accent-blue)] transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400">
                <X size={15} />
              </button>
            )}
          </div>

          {/* دکمه نمایش/مخفی فیلترها */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`px-4 py-2.5 rounded-2xl border font-bold text-sm flex items-center gap-2 transition ${
              showFilters || activeFiltersCount > 0
                ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white"
                : "bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-[var(--card-hover)]"
            }`}
          >
            <SlidersHorizontal size={16} />
            فیلتر
            {activeFiltersCount > 0 && (
              <span className="bg-white text-[var(--accent-blue)] rounded-full w-5 h-5 text-[11px] flex items-center justify-center font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* پنل فیلترها */}
        {showFilters && (
          <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-fadeIn">
            {/* دسته‌بندی */}
            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">دسته‌بندی:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                <option value="all">همه دسته‌ها</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* موجودی */}
            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">وضعیت موجودی:</label>
              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                <option value="all">همه</option>
                <option value="in_stock">موجود (stock &gt; 0)</option>
                <option value="out_of_stock">ناموجود (stock = 0)</option>
              </select>
            </div>

            {/* مرتب‌سازی */}
            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">مرتب‌سازی:</label>
              <select
                value={filterSort}
                onChange={(e) => setFilterSort(e.target.value as SortKey)}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="price_asc">ارزان‌ترین</option>
                <option value="price_desc">گران‌ترین</option>
                <option value="stock_asc">کمترین موجودی</option>
                <option value="stock_desc">بیشترین موجودی</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="sm:col-span-3 py-2 rounded-xl border border-rose-500/30 text-rose-500 font-bold hover:bg-rose-500/10 transition"
              >
                پاک‌کردن همه فیلترها ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── نتایج ──────────────────────────────────────────────── */}
      <div className="mt-5">
        {loading ? (
          <div className="text-center py-20 text-sm font-bold text-[var(--text-secondary)]">
            <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent animate-spin rounded-full mx-auto mb-3" />
            در حال بارگذاری کاتالوگ...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center space-y-3">
            <Search size={40} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-[var(--text-secondary)]">
              {searchQuery || activeFiltersCount > 0
                ? "محصولی با این مشخصات یافت نشد."
                : "هنوز کالایی ثبت نشده است."}
            </p>
            {activeFiltersCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-[var(--accent-blue)] underline font-bold">
                حذف فیلترها
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          /* ── نمای جدول ─── */
          <div className="overflow-x-auto rounded-3xl border border-[var(--card-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--card-bg)] border-b border-[var(--card-border)] text-[var(--text-secondary)] font-bold">
                  <th className="py-3 px-4 text-right">تصویر</th>
                  <th className="py-3 px-4 text-right">نام محصول</th>
                  <th className="py-3 px-4 text-right">دسته</th>
                  <th className="py-3 px-4 text-right">قیمت (تومان)</th>
                  <th className="py-3 px-4 text-right">تخفیف</th>
                  <th className="py-3 px-4 text-right">موجودی</th>
                  <th className="py-3 px-4 text-right">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--card-hover)] transition group">
                    <td className="py-2.5 px-4">
                      <img
                        src={p.image_url || "/placeholder.png"}
                        alt={p.title || p.name}
                        className="w-12 h-12 object-contain rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] p-1"
                      />
                    </td>
                    <td className="py-2.5 px-4 max-w-[200px]">
                      <p className="font-bold line-clamp-2 leading-relaxed">{p.title || p.name}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 font-bold whitespace-nowrap">
                        {p.category || "عمومی"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                      {Number(p.price||0).toLocaleString("fa-IR")}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">
                      {p.discount_price ? Number(p.discount_price).toLocaleString("fa-IR") : "—"}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`font-bold ${Number(p.stock) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {Number(p.stock)} عدد
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-blue-400 text-blue-400 font-bold flex items-center gap-1.5 transition"
                        >
                          <Edit size={13} /> ویرایش
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-rose-400 text-rose-400 font-bold flex items-center gap-1.5 transition"
                        >
                          <Trash2 size={13} /> حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── نمای کارتی ─── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-4 flex flex-col shadow-sm hover:shadow-md transition">
                <div className="w-full h-40 rounded-2xl bg-zinc-900/50 overflow-hidden mb-3 relative flex items-center justify-center border border-[var(--card-border)]">
                  <img src={p.image_url || "/placeholder.png"} alt={p.title||p.name} className="w-full h-full object-contain p-2" />
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/90 text-white">
                    {p.category || "عمومی"}
                  </span>
                  <span className={`absolute top-2 left-2 text-[10px] font-bold px-2.5 py-1 rounded-full ${Number(p.stock) > 0 ? "bg-emerald-500/90 text-white" : "bg-rose-500/90 text-white"}`}>
                    {Number(p.stock) > 0 ? `${p.stock} عدد` : "ناموجود"}
                  </span>
                </div>
                <h3 className="font-bold text-xs line-clamp-2 flex-1">{p.title || p.name}</h3>
                <div className="mt-3 pt-3 border-t border-[var(--card-border)] space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">قیمت:</span>
                    <span className="font-mono font-bold text-emerald-400">{Number(p.price||0).toLocaleString("fa-IR")} ت</span>
                  </div>
                  {p.discount_price && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">قیمت تخفیف:</span>
                      <span className="font-mono font-bold text-amber-400">{Number(p.discount_price).toLocaleString("fa-IR")} ت</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleEditClick(p)} className="flex-1 py-1.5 rounded-xl border border-[var(--card-border)] hover:border-blue-400 text-blue-400 font-bold text-[11px] flex items-center justify-center gap-1 transition">
                    <Edit size={12} /> ویرایش
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="flex-1 py-1.5 rounded-xl border border-[var(--card-border)] hover:border-rose-400 text-rose-400 font-bold text-[11px] flex items-center justify-center gap-1 transition">
                    <Trash2 size={12} /> حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal افزودن / ویرایش (دست‌نخورده از نسخه قبل) ─────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
          <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--modal-bg)] border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-black text-base">{editingId ? "ویرایش کالا" : "افزودن کالای جدید"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--card-hover)] transition"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">نام محصول *</label>
                  <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="نام کامل محصول..." className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]" />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">دسته‌بندی</label>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} list="category-list" placeholder="مثال: لپ‌تاپ / موبایل..." className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" />
                  <datalist id="category-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">موجودی انبار</label>
                  <input type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">قیمت (تومان)</label>
                  <input value={priceToman} onChange={(e) => setPriceToman(formatNumber(e.target.value))} placeholder="مثال: 5,000,000" dir="ltr" className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">قیمت تخفیف (تومان)</label>
                  <input value={discountToman} onChange={(e) => setDiscountToman(formatNumber(e.target.value))} placeholder="در صورت وجود..." dir="ltr" className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">گارانتی</label>
                  <input value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="مثال: ۱۸ ماه شرکتی..." className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">آدرس ویدیو (اختیاری)</label>
                  <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." dir="ltr" className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">توضیحات محصول</label>
                  <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضیحات کامل..." className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed outline-none" />
                </div>

                {/* تصاویر */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block font-bold text-[var(--text-secondary)]">تصاویر محصول</label>
                  <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-[var(--card-border)] cursor-pointer hover:border-[var(--accent-blue)] transition font-bold text-[var(--text-secondary)]">
                    <ImageIcon size={18} /> انتخاب تصویر از دستگاه
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                  <div className="flex gap-2">
                    <input value={imgInput} onChange={(e) => setImgInput(e.target.value)} placeholder="یا آدرس URL تصویر..." dir="ltr" className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none" />
                    <button type="button" onClick={addImageByUrl} className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold">افزودن</button>
                  </div>
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((img, i) => (
                        <div key={i} className="relative group">
                          <img src={img} alt="" className={`w-full aspect-square object-contain rounded-xl border-2 ${i===0?"border-[var(--accent-blue)]":"border-[var(--card-border)]"} bg-black/5 p-1`} />
                          {i === 0 && <span className="absolute top-1 right-1 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">شاخص</span>}
                          <button type="button" onClick={() => setImages(images.filter((_,j)=>j!==i))} className="absolute top-1 left-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* مشخصات فنی */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[var(--text-secondary)]">مشخصات فنی</label>
                    <button type="button" onClick={() => setSpecsList([...specsList, { key: "", value: "" }])} className="text-[var(--accent-blue)] font-bold text-[11px] flex items-center gap-1">
                      <Plus size={13} /> افزودن ردیف
                    </button>
                  </div>
                  {specsList.map((spec, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input value={spec.key} onChange={(e) => { const n=[...specsList]; n[idx]={...n[idx],key:e.target.value}; setSpecsList(n); }} placeholder="نام مشخصه..." className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none" />
                      <input value={spec.value} onChange={(e) => { const n=[...specsList]; n[idx]={...n[idx],value:e.target.value}; setSpecsList(n); }} placeholder="مقدار..." className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" />
                      <button type="button" onClick={() => setSpecsList(specsList.filter((_,i)=>i!==idx))} className="text-rose-400 px-2 font-bold">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-[var(--card-border)]">
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <CheckCircle size={18} />}
                  {saving ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "ثبت محصول جدید"}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] font-bold hover:bg-[var(--card-hover)] transition">
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
