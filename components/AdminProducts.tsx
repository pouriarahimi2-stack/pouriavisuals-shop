"use client";
import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export interface FullCatalogProduct {
  id: string; title: string; name?: string; sku?: string; brand?: string; category: string;
  price: number; discount_price?: number | null; purchase_price?: number; stock: number;
  is_available: boolean; image?: string; images?: string[]; description?: string;
}

export default function AdminProducts(_props: any = {}) {
  const [products, setProducts]   = useState<FullCatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [feedback, setFeedback]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [searchQuery, setSearchQuery]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // ── States ویرایش و افزودن (گالری چند عکسی) ──
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingProd, setEditingProd]   = useState<FullCatalogProduct | null>(null);
  const [saving, setSaving]             = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const multiImageInputRef = useRef<HTMLInputElement>(null);
  
  // ── States استودیوی پاکسازی ──
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<"hide" | "delete">("delete");
  const [bulkTargetCategory, setBulkTargetCategory] = useState("all");
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // ── States ویرایش دسته‌بندی ──
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [renameOld, setRenameOld] = useState("");
  const [renameNew, setRenameNew] = useState("");
  const [renaming, setRenaming] = useState(false);

  // ── States ایمپورت هوشمند ──
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importImages, setImportImages] = useState<File[]>([]);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const bulkImagesRef = useRef<HTMLInputElement>(null);
  const [globalStock, setGlobalStock] = useState<number>(10);
  const [globalCategory, setGlobalCategory] = useState<string>("");

  const notify = (text: string, type: "success"|"error" = "success") => {
    setFeedback({ type, text }); setTimeout(() => setFeedback(null), 4500);
  };

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const pRes = await fetch("/api/products?t=" + Date.now(), { cache: "no-store" });
      const pJson = await pRes.json();
      const list: FullCatalogProduct[] = (pJson.data || pJson.products || []).map((p: any) => ({
        ...p, price: Number(p.price || 0), purchase_price: Number(p.purchase_price || 0), stock: p.stock !== undefined ? Number(p.stock) : 10, is_available: p.is_available !== false,
      }));
      setProducts(list);
      const catSet = new Set<string>(list.map((x) => x.category).filter(Boolean));
      setCategories(Array.from(catSet));
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCatalog();
    const ch = supabase.channel("rt-catalog").on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchCatalog).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── منطق پاک‌سازی پیشرفته ──
  const executeBulkAction = async () => {
    const isDelete = bulkActionType === "delete";
    const msg = isDelete 
      ? `هشدار: با این کار تمام اطلاعات و عکس‌های فیزیکی "${bulkTargetCategory === "all" ? "تمام محصولات سایت" : `محصولات دسته ${bulkTargetCategory}`}" برای همیشه از سرور پاک می‌شود. آیا مطمئن هستید؟`
      : `آیا می‌خواهید "${bulkTargetCategory === "all" ? "تمام محصولات" : `محصولات دسته ${bulkTargetCategory}`}" را مخفی کنید؟`;
    
    if (!confirm(msg)) return;
    
    setBulkProcessing(true); soundEngine.playClick();
    try {
      const res = await fetch("/api/admin/products/bulk-delete", {
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ action: bulkActionType, category: bulkTargetCategory })
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess(); notify(json.message, "success"); setIsBulkDeleteOpen(false); fetchCatalog();
      } else throw new Error(json.message);
    } catch (err: any) { notify(err.message || "خطا در انجام عملیات", "error"); } finally { setBulkProcessing(false); }
  };

  // ── منطق ویرایش و حذف تکی ──
  const handleOpenEdit = (p?: FullCatalogProduct) => {
    soundEngine.playClick();
    if (p) {
      let parsedImgs: string[] = [];
      const pImgs = p.images as any;
      if (Array.isArray(pImgs)) parsedImgs = [...pImgs];
      else if (typeof pImgs === 'string' && pImgs.length > 5) {
        try { parsedImgs = JSON.parse(pImgs); } catch(e){}
      }
      if (p.image && !parsedImgs.includes(p.image)) parsedImgs.unshift(p.image);
      setEditingProd({ ...p, images: parsedImgs });
    } else {
      setEditingProd({ id: "", title: "", sku: "", brand: "", category: "", price: 0, purchase_price: 0, stock: 10, is_available: true, description: "", image: "", images: [] } as any);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این محصول اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      notify("محصول با موفقیت حذف شد.", "success"); fetchCatalog();
    } catch { notify("خطا در حذف محصول", "error"); }
  };

  // ── منطق آپلود گالری چند عکسی ──
  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); 
    if (files.length === 0 || !editingProd) return;
    setUploadingImage(true);
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
        const json = await res.json();
        if (json.url) newUrls.push(json.url);
      }
      const updatedImages = [...(editingProd.images || []), ...newUrls];
      setEditingProd({ ...editingProd, images: updatedImages, image: updatedImages.length > 0 ? updatedImages[0] : editingProd.image });
      notify(`✓ ${newUrls.length} عکس به گالری اضافه شد.`, "success");
    } catch (err) { notify("❌ خطا در آپلود عکس‌ها", "error"); } 
    finally { setUploadingImage(false); e.target.value = ""; }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingProd) return;
    setSaving(true);
    try {
      const payload = { 
        ...editingProd, 
        image: (editingProd.images && editingProd.images.length > 0) ? editingProd.images[0] : editingProd.image,
        is_available: editingProd.stock > 0 
      };
      const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { soundEngine.playSuccess(); notify("محصول با موفقیت ذخیره شد.", "success"); setIsModalOpen(false); fetchCatalog(); } 
      else throw new Error();
    } catch { notify("خطا در ذخیره سازی", "error"); } finally { setSaving(false); }
  };

  // ── منطق ایمپورت ──
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setImportLogs(["⏳ در حال خواندن فایل..."]);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      const parsed = json.map((row: any) => {
        const rawDropStr = String(row["قیمت دراپ"] || row["Drop Price"] || row["قیمت"] || "0").replace(/[,.]/g, "");
        const dropPrice = Number(rawDropStr) || 0;
        const finalPrice = Math.round(dropPrice * 1.25);

        let stockVal = globalStock;
        const rawStock = String(row["موجودی"] || row["Stock"] || "");
        if (rawStock.includes("موجود") && !rawStock.includes("نا")) stockVal = globalStock > 0 ? globalStock : 10;
        else if (Number(rawStock)) stockVal = Number(rawStock);
        else if (rawStock.includes("ناموجود")) stockVal = 0;

        return {
          title: row["نام محصول"] || row["عنوان"] || "بدون عنوان", sku: row["کد محصول"] || row["SKU"] || "",
          purchase_price: dropPrice, price: finalPrice, category: row["دسته بندی"] || globalCategory || "کالای عمومی",
          photo: row["Photo_Filename"] || null, description: row["Telegram_Description"] || "",
          stock: stockVal, brand: row["برند"] || "متفرقه",
        };
      });
      setImportRows(parsed); setImportLogs([`✅ فایل خوانده شد. (${parsed.length} محصول پیدا شد)`]); setImportStep(2);
    } catch (err) { alert("خطا در پردازش فایل."); } e.target.value = "";
  };

  const handleSmartImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedNames = new Set(importRows.map((r) => r.photo).filter(Boolean));
    const filtered = files.filter((f) => allowedNames.has(f.name));
    setImportImages(filtered);
    setImportLogs((prev) => [`📸 از ${files.length} فایل، ${filtered.length} عکس مربوطه پیدا شد.`, ...prev]);
  };

  const executeBulkImport = async () => {
    soundEngine.playClick(); setImporting(true); setImportStep(3);
    let successCount = 0; let updateCount = 0; let failCount = 0;

    for (let i = 0; i < importRows.length; i++) {
      const row = importRows[i];
      try {
        const existing = products.find(p => (row.sku && p.sku === row.sku) || p.title === row.title);
        const isUpdate = !!existing;
        setImportLogs((prev) => [`⏳ پردازش: ${row.title}...`, ...prev]);

        let imageUrl = existing?.image || "/placeholder.png";
        if (row.photo && !isUpdate) {
          const mFile = importImages.find((f) => f.name === row.photo);
          if (mFile) {
            const fd = new FormData(); fd.append("file", mFile);
            const upRes = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
            const upJson = await upRes.json();
            if (upJson.url) imageUrl = upJson.url;
          }
        }

        const payload = {
          id: existing?.id, title: row.title, category: row.category || existing?.category,
          price: row.price, purchase_price: row.purchase_price, stock: row.stock, is_available: row.stock > 0,
          image: imageUrl, image_url: imageUrl, description: row.description || existing?.description || "",
          brand: row.brand || existing?.brand, sku: row.sku || existing?.sku,
        };

        const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) { isUpdate ? updateCount++ : successCount++; } else { failCount++; }
      } catch (err) { failCount++; }
    }
    soundEngine.playSuccess(); setImportLogs((prev) => [`🎉 پایان. (${successCount} جدید، ${updateCount} آپدیت، ${failCount} خطا)`, ...prev]);
    setImporting(false); fetchCatalog();
  };

  const handleRenameCategory = async () => {
    if (!renameOld || !renameNew.trim()) return;
    soundEngine.playClick(); setRenaming(true);
    try {
      const res = await fetch("/api/admin/categories/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oldName: renameOld, newName: renameNew }) });
      const json = await res.json();
      if (json.success) { soundEngine.playSuccess(); notify("✓ نام دسته‌بندی تغییر کرد.", "success"); setIsCatModalOpen(false); fetchCatalog(); setRenameOld(""); setRenameNew(""); } 
      else alert(json.message);
    } catch { alert("خطای سرور."); } finally { setRenaming(false); }
  };

  const filtered = products.filter((p) => {
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      
      {/* ── هدر ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)]">🛍️ مدیریت کاتالوگ محصولات</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{products.length} محصول ثبت شده</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button type="button" onClick={() => setIsBulkDeleteOpen(true)} className="px-4 py-2.5 rounded-2xl bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20 text-xs cursor-pointer hover:bg-rose-500 hover:text-white transition">پاکسازی پیشرفته 🧹</button>
          <div className="w-px bg-[var(--card-border)] mx-1"></div>
          <button type="button" onClick={() => setIsCatModalOpen(true)} className="px-4 py-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/30 text-xs cursor-pointer hover:bg-indigo-500 hover:text-white transition">✏️ ویرایش دسته‌ها</button>
          <button type="button" onClick={() => { setIsImportOpen(true); setImportStep(1); setImportRows([]); setImportImages([]); setImportLogs([]); }} className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-lg cursor-pointer hover:bg-emerald-500 transition">📥 ایمپورت اکسل</button>
          <button type="button" onClick={() => handleOpenEdit()} className="px-4 py-2.5 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-lg cursor-pointer hover:bg-blue-500 transition">➕ افزودن محصول</button>
        </div>
      </div>

      {feedback && <div className={"p-4 rounded-2xl text-xs font-bold " + (feedback.type === "success" ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500")}>{feedback.text}</div>}

      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 جستجو بر اساس نام یا کد کالا..." className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)]" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold cursor-pointer">
          <option value="all">📁 همه دسته‌ها</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-xs">
        {loading ? <div className="py-16 text-center text-slate-400 font-bold">⏳ در حال بارگذاری...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.slice(0, 50).map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col gap-3 relative group hover:border-[var(--accent-blue)] transition-colors">
                <div className="flex gap-3">
                  <img src={p.image || "/placeholder.png"} className="w-16 h-16 rounded-2xl object-contain border bg-white p-1" />
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-[var(--accent-blue)] font-bold">{p.category}</span>
                    <h3 className="font-black text-xs line-clamp-2">{p.title}</h3>
                    <div className="font-mono text-emerald-500 font-bold">{p.price.toLocaleString("fa-IR")} تومان</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-auto pt-3 border-t border-[var(--card-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEdit(p)} className="flex-1 py-1.5 bg-blue-500/10 text-blue-500 rounded-xl font-bold hover:bg-blue-500 hover:text-white transition text-[10px] cursor-pointer">✏️ ویرایش</button>
                  <button onClick={() => handleDelete(p.id)} className="flex-1 py-1.5 bg-rose-500/10 text-rose-500 rounded-xl font-bold hover:bg-rose-500 hover:text-white transition text-[10px] cursor-pointer">🗑️ حذف</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 font-bold">هیچ محصولی با این مشخصات یافت نشد.</div>}
          </div>
        )}
      </div>

      {/* ── مودال استودیوی پاکسازی ── */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--modal-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--card-border)] bg-rose-50 dark:bg-rose-950/20 flex justify-between items-center">
              <h3 className="font-black text-rose-500 text-sm">🧹 استودیوی پاکسازی پیشرفته</h3>
              <button onClick={() => setIsBulkDeleteOpen(false)} className="text-rose-500 font-black p-1 hover:bg-rose-100 rounded-lg cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-5 text-xs">
              <div>
                <label className="block font-bold mb-2">نوع عملیات:</label>
                <select value={bulkActionType} onChange={e => setBulkActionType(e.target.value as any)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer">
                  <option value="delete">حذف کامل دیتابیس + پاک کردن عکس‌های فیزیکی از سرور (دائمی) ⚠️</option>
                  <option value="hide">فقط مخفی‌سازی / ناموجود کردن (قابل بازگشت) 👁️‍🗨️</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-2">هدف عملیات (دسته‌بندی):</label>
                <select value={bulkTargetCategory} onChange={e => setBulkTargetCategory(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer">
                  <option value="all">📁 همه محصولات سایت</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {bulkActionType === "delete" && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 leading-relaxed font-bold">
                  ⚠️ هشدار: با اجرای این دستور، علاوه بر پاک شدن اطلاعات محصولات از دیتابیس، سیستم به صورت هوشمند **تمامی عکس‌های متصل به آن‌ها را نیز از فضای هاست ابری (Supabase Storage) پاک می‌کند** تا فضای سرور شما آزاد شود.
                </div>
              )}
            </div>
            <div className="p-5 border-t border-[var(--card-border)] bg-[var(--modal-bg)] flex gap-3">
              <button onClick={() => setIsBulkDeleteOpen(false)} className="px-6 py-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs cursor-pointer hover:bg-rose-50 hover:text-rose-500 transition">انصراف</button>
              <button onClick={executeBulkAction} disabled={bulkProcessing} className="flex-1 py-4 rounded-2xl bg-rose-600 text-white font-black shadow-lg cursor-pointer disabled:opacity-50 hover:bg-rose-500 transition">
                {bulkProcessing ? "⏳ در حال پاکسازی..." : "🚀 تایید و اجرای عملیات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── فرم گالری دار ویرایش/افزودن محصول ── */}
      {isModalOpen && editingProd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[96vh] overflow-hidden bg-[var(--modal-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-[var(--card-border)] bg-[var(--modal-bg)] shrink-0">
              <h3 className="font-black text-sm sm:text-base text-[var(--accent-blue)]">{editingProd.id ? "✏️ استودیوی ویرایش محصول" : "➕ ساخت محصول جدید"}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-[var(--input-bg)] rounded-xl font-black cursor-pointer hover:bg-rose-500 hover:text-white transition">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* بخش گالری تصاویر */}
                <div className="w-full md:w-1/3 space-y-4">
                  <div className="bg-[var(--input-bg)] rounded-2xl border border-[var(--card-border)] p-4 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs text-[var(--text-secondary)]">گالری تصاویر</span>
                      <button type="button" onClick={() => multiImageInputRef.current?.click()} disabled={uploadingImage} className="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition shadow-md cursor-pointer">
                        {uploadingImage ? "⏳..." : "➕ انتخاب عکس"}
                      </button>
                    </div>
                    
                    <div className="aspect-square rounded-xl border-2 border-dashed border-[var(--card-border)] flex items-center justify-center bg-white overflow-hidden relative">
                      {(editingProd.images && editingProd.images.length > 0) ? (
                        <img src={editingProd.images[0]} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                      ) : editingProd.image ? (
                        <img src={editingProd.image} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                      ) : (
                        <div className="text-4xl opacity-30">🖼️</div>
                      )}
                    </div>

                    {(editingProd.images && editingProd.images.length > 0) && (
                      <div className="flex gap-2 overflow-x-auto scrollbar-none snap-x py-1">
                        {editingProd.images.map((img: string, idx: number) => (
                          <div key={idx} className="relative w-16 h-16 rounded-lg border border-[var(--card-border)] shrink-0 bg-white group/thumb snap-start shadow-sm">
                            <img src={img} className="w-full h-full object-contain rounded-lg p-1 mix-blend-multiply" />
                            <button type="button" onClick={() => {
                              const newImages = [...editingProd.images!];
                              newImages.splice(idx, 1);
                              setEditingProd({ ...editingProd, images: newImages, image: newImages.length > 0 ? newImages[0] : "" });
                            }} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-md cursor-pointer">✕</button>
                            {idx === 0 && <span className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[8px] text-center py-0.5 rounded-b-lg font-black backdrop-blur-sm">اصلی</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <input ref={multiImageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMultiImageUpload} />
                  
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-secondary)]">لینک مستقیم عکس (URL):</label>
                    <div className="flex gap-2 mt-1">
                      <input id="directUrlInput" dir="ltr" placeholder="https://..." className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-[10px] text-slate-500 focus:border-[var(--accent-blue)]" />
                      <button type="button" onClick={() => {
                         const input = document.getElementById("directUrlInput") as HTMLInputElement;
                         if (input && input.value) {
                             const newImgs = [...(editingProd.images || []), input.value];
                             setEditingProd({ ...editingProd, images: newImgs, image: newImgs[0] });
                             input.value = "";
                         }
                      }} className="px-3 bg-slate-200 dark:bg-slate-800 rounded-xl text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer text-slate-700 dark:text-slate-200">افزودن</button>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-2/3 space-y-5 text-xs">
                  <div><label className="block font-bold mb-1.5 text-[var(--text-secondary)]">نام کامل محصول *</label><input required value={editingProd.title} onChange={e=>setEditingProd({...editingProd, title: e.target.value})} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-bold" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block font-bold mb-1.5 text-[var(--text-secondary)]">دسته‌بندی *</label><input required value={editingProd.category} onChange={e=>setEditingProd({...editingProd, category: e.target.value})} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" /></div>
                    <div><label className="block font-bold mb-1.5 text-[var(--text-secondary)]">موجودی انبار *</label><input type="number" required value={editingProd.stock} onChange={e=>setEditingProd({...editingProd, stock: Number(e.target.value)})} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold focus:border-[var(--accent-blue)]" /></div>
                    <div><label className="block font-bold mb-1.5 text-rose-500">قیمت خرید (مبنای حسابداری)</label><input type="number" value={editingProd.purchase_price} onChange={e=>setEditingProd({...editingProd, purchase_price: Number(e.target.value)})} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-rose-500/30 outline-none font-mono text-rose-500 focus:border-rose-500" /></div>
                    <div><label className="block font-bold mb-1.5 text-emerald-500">قیمت نهایی فروش (در سایت) *</label><input type="number" required value={editingProd.price} onChange={e=>setEditingProd({...editingProd, price: Number(e.target.value)})} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-emerald-500/30 outline-none font-mono text-emerald-500 font-black focus:border-emerald-500" /></div>
                    <div><label className="block font-bold mb-1.5 text-[var(--text-secondary)]">کد محصول (SKU)</label><input value={editingProd.sku || ""} onChange={e=>setEditingProd({...editingProd, sku: e.target.value})} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono focus:border-[var(--accent-blue)]" /></div>
                    <div><label className="block font-bold mb-1.5 text-[var(--text-secondary)]">برند</label><input value={editingProd.brand || ""} onChange={e=>setEditingProd({...editingProd, brand: e.target.value})} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" /></div>
                  </div>
                  <div><label className="block font-bold mb-1.5 text-[var(--text-secondary)]">توضیحات کوتاه محصول</label><textarea rows={3} value={editingProd.description || ""} onChange={e=>setEditingProd({...editingProd, description: e.target.value})} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] resize-none leading-relaxed" /></div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[var(--card-border)] bg-[var(--modal-bg)] shrink-0 flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs cursor-pointer hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition">انصراف</button>
              <button type="button" onClick={handleSaveProduct} disabled={saving || uploadingImage} className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-black shadow-lg cursor-pointer disabled:opacity-50 hover:bg-blue-500 transition">
                {saving ? "⏳ در حال ذخیره‌سازی..." : "💾 ذخیره اطلاعات محصول"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── مودال ایمپورت اکسل ── */}
      {isImportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-4 animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget && !importing) setIsImportOpen(false); }}>
          <div className="w-full max-w-4xl max-h-[96vh] overflow-y-auto bg-[var(--modal-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] flex flex-col" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)] sticky top-0 bg-[var(--modal-bg)] z-10 rounded-t-3xl">
              <h2 className="font-black text-sm text-emerald-500">📥 ایمپورت گروهی با اکسل</h2>
              {!importing && <button type="button" onClick={() => setIsImportOpen(false)} className="p-2 bg-[var(--input-bg)] rounded-xl font-black cursor-pointer hover:bg-rose-500 hover:text-white transition">✕</button>}
            </div>
            <div className="p-6 space-y-6 text-xs flex-1">
              
              <div className={"p-5 rounded-3xl border transition " + (importStep === 1 ? "bg-[var(--accent-blue)]/5 border-[var(--accent-blue)]" : "bg-[var(--input-bg)] border-[var(--card-border)] opacity-60")}>
                <h3 className="font-black text-sm mb-3 text-[var(--accent-blue)]">گام اول: فایل اکسل</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">موجودی پیش‌فرض:</label>
                    <input type="number" value={globalStock} onChange={e => setGlobalStock(Number(e.target.value))} className="w-full p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono focus:border-[var(--accent-blue)]" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">دسته‌بندی پیش‌فرض:</label>
                    <input type="text" value={globalCategory} onChange={e => setGlobalCategory(e.target.value)} placeholder="مثال: لوازم ورزشی" className="w-full p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] font-bold" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => docInputRef.current?.click()} disabled={importStep !== 1} className="px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shadow-lg disabled:opacity-50 hover:bg-blue-600 transition">📁 انتخاب فایل اکسل</button>
                  <input ref={docInputRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleDocumentUpload} />
                </div>
              </div>

              {importRows.length > 0 && importStep >= 2 && (
                <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
                  <div className="flex items-center justify-between mb-3"><h3 className="font-black text-sm text-[var(--accent-blue)]">پیش‌نمایش محصولات</h3><span className="px-3 py-1 bg-emerald-500/15 text-emerald-500 rounded-lg font-bold">{importRows.length} کالا</span></div>
                  <div className="overflow-x-auto max-h-48 border border-[var(--card-border)] rounded-2xl">
                    <table className="w-full text-right"><thead className="bg-[var(--input-bg)] sticky top-0"><tr><th className="p-3">عنوان</th><th className="p-3">دسته‌بندی</th><th className="p-3">موجودی</th><th className="p-3">قیمت (+25٪)</th></tr></thead>
                      <tbody className="divide-y divide-[var(--card-border)] font-bold">{importRows.map((r, idx) => (<tr key={idx}><td className="p-3 truncate max-w-[200px]">{r.title}</td><td className="p-3 text-[var(--text-secondary)] font-normal">{r.category}</td><td className="p-3 text-indigo-500">{r.stock}</td><td className="p-3 font-mono text-emerald-500">{r.price.toLocaleString("fa-IR")}</td></tr>))}</tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className={"p-5 rounded-3xl border transition " + (importStep === 2 ? "bg-emerald-500/5 border-emerald-500" : "bg-[var(--input-bg)] border-[var(--card-border)] opacity-60")}>
                <h3 className="font-black text-sm mb-3 text-emerald-500">گام دوم: تصاویر</h3>
                <div className="flex gap-4"><button type="button" onClick={() => bulkImagesRef.current?.click()} disabled={importStep !== 2} className="px-6 py-3.5 rounded-2xl bg-emerald-600 text-white font-black cursor-pointer shadow-lg disabled:opacity-50 hover:bg-emerald-500 transition">🖼️ انتخاب تصاویر متناظر</button><input ref={bulkImagesRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSmartImageSelection} /></div>
              </div>

              {importLogs.length > 0 && (<div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] max-h-48 overflow-y-auto space-y-1.5 font-mono">{importLogs.map((log, i) => (<div key={i} className={"text-[10px] " + (log.includes("❌") ? "text-rose-500" : "text-emerald-500")}>{log}</div>))}</div>)}
            </div>

            <div className="flex gap-3 p-5 border-t border-[var(--card-border)] sticky bottom-0 bg-[var(--modal-bg)] rounded-b-3xl">
              <button type="button" disabled={importStep < 2 || importing} onClick={executeBulkImport} className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black cursor-pointer disabled:opacity-50 text-sm shadow-xl hover:bg-emerald-500 transition">
                {importing ? "⏳ در حال پردازش و ثبت..." : "🚀 تایید نهایی و ایمپورت محصولات"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* مودال تغییر نام دسته */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 animate-fadeIn" onClick={() => setIsCatModalOpen(false)}>
          <div className="bg-[var(--modal-bg)] rounded-3xl p-6 shadow-2xl space-y-4 w-full max-w-sm border border-[var(--card-border)]" onClick={e=>e.stopPropagation()}>
            <h3 className="font-black text-sm text-[var(--accent-blue)]">✏️ ویرایش دسته‌بندی</h3>
            <select value={renameOld} onChange={e=>setRenameOld(e.target.value)} className="w-full p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"><option value="">دسته مبدا</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <input type="text" value={renameNew} onChange={e=>setRenameNew(e.target.value)} placeholder="نام جدید" className="w-full p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" />
            <button onClick={handleRenameCategory} className="w-full py-3.5 bg-blue-600 text-white font-black rounded-xl cursor-pointer hover:bg-blue-500 transition shadow-lg">ذخیره و انتقال</button>
          </div>
        </div>
      )}
    </div>
  );
}
