"use client";
import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export interface FullCatalogProduct {
  id: string; title: string; name?: string; sku?: string; brand?: string; category: string;
  price: number; discount_price?: number | null; purchase_price?: number; stock: number;
  is_available: boolean; image?: string; images?: string[]; description?: string;
  warranty?: string; meta_title?: string; meta_description?: string; specs?: Record<string, any>;
}

function isRealUrl(s: string) { return s && !s.startsWith("data:") && s.length < 2000; }

export function AdminProducts(_props: any = {}) {
  const [products, setProducts]   = useState<FullCatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [searchQuery, setSearchQuery]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingProd, setEditingProd]   = useState<FullCatalogProduct | null>(null);
  const [activeTab, setActiveTab]       = useState<"basic"|"images">("basic");
  
  // سیستم تغییر نام دسته‌بندی
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [renameOld, setRenameOld] = useState("");
  const [renameNew, setRenameNew] = useState("");
  const [renaming, setRenaming] = useState(false);

  // سیستم ایمپورت هوشمند
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importImages, setImportImages] = useState<File[]>([]);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const bulkImagesRef = useRef<HTMLInputElement>(null);

  // مقادیر دیفالت
  const [globalStock, setGlobalStock] = useState<number>(10);
  const [globalCategory, setGlobalCategory] = useState<string>("");

  const notify = (text: string, type: "success"|"error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchCatalog = async () => {
    try {
      const pRes = await fetch("/api/products?t=" + Date.now(), { cache: "no-store" });
      const pJson = await pRes.json();
      const list: FullCatalogProduct[] = (pJson.data || pJson.products || []).map((p: any) => ({
        ...p,
        price: Number(p.price || 0),
        purchase_price: Number(p.purchase_price || 0),
        stock: p.stock !== undefined ? Number(p.stock) : 10,
        is_available: p.is_available !== false,
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

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setImportLogs(["⏳ در حال خواندن فایل..."]);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      const parsed = json.map((row: any) => {
        const rawDropStr = String(row["قیمت دراپ"] || row["Drop Price"] || row["قیمت"] || "0").replace(/[,.]/g, "");
        const dropPrice = Number(rawDropStr) || 0;
        const finalPrice = Math.round(dropPrice * 1.25); // +25% سود و مالیات

        let stockVal = globalStock; // استفاده از موجودی دیفالت
        const rawStock = String(row["موجودی"] || row["Stock"] || "");
        if (rawStock.includes("موجود") && !rawStock.includes("نا")) stockVal = globalStock > 0 ? globalStock : 10;
        else if (Number(rawStock)) stockVal = Number(rawStock);
        else if (rawStock.includes("ناموجود")) stockVal = 0;

        return {
          title: row["نام محصول"] || row["عنوان"] || "بدون عنوان",
          sku: row["کد محصول"] || row["SKU"] || "",
          purchase_price: dropPrice,
          price: finalPrice,
          category: row["دسته بندی"] || globalCategory || "کالای ورزشی", // استفاده از دسته‌بندی دیفالت
          photo: row["Photo_Filename"] || null,
          description: row["Telegram_Description"] || "",
          stock: stockVal,
          brand: row["برند"] || "متفرقه",
        };
      });
      
      setImportRows(parsed);
      setImportLogs([`✅ فایل خوانده شد. (${parsed.length} محصول پیدا شد)`]);
      setImportStep(2);
    } catch (err) { alert("خطا در پردازش فایل."); }
    e.target.value = "";
  };

  const handleSmartImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedNames = new Set(importRows.map((r) => r.photo).filter(Boolean));
    const filtered = files.filter((f) => allowedNames.has(f.name));
    setImportImages(filtered);
    setImportLogs((prev) => [`📸 از ${files.length} فایل، ${filtered.length} عکس مربوطه پیدا شد.`, ...prev]);
  };

  const executeBulkImport = async () => {
    soundEngine.playClick();
    setImporting(true); setImportStep(3);
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
          id: existing?.id,
          title: row.title,
          category: row.category || existing?.category,
          price: row.price,
          purchase_price: row.purchase_price,
          stock: row.stock,
          is_available: row.stock > 0,
          image: imageUrl,
          image_url: imageUrl,
          description: row.description || existing?.description || "",
          brand: row.brand || existing?.brand,
          sku: row.sku || existing?.sku,
        };

        const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) { isUpdate ? updateCount++ : successCount++; } else { failCount++; }
      } catch (err) { failCount++; }
    }
    soundEngine.playSuccess();
    setImportLogs((prev) => [`🎉 پایان. (${successCount} جدید، ${updateCount} آپدیت، ${failCount} خطا)`, ...prev]);
    setImporting(false); fetchCatalog();
  };

  const handleRenameCategory = async () => {
    if (!renameOld || !renameNew.trim()) return;
    soundEngine.playClick(); setRenaming(true);
    try {
      const res = await fetch("/api/admin/categories/rename", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: renameOld, newName: renameNew }),
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess(); notify("✓ نام دسته‌بندی با موفقیت تغییر کرد.");
        setIsCatModalOpen(false); fetchCatalog(); setRenameOld(""); setRenameNew("");
      } else alert(json.message);
    } catch { alert("خطای سرور."); }
    finally { setRenaming(false); }
  };

  const filtered = products.filter((p) => categoryFilter === "all" || p.category === categoryFilter);

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)]">🛍️ مدیریت کاتالوگ محصولات</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{products.length} محصول ثبت شده</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button type="button" onClick={() => setIsCatModalOpen(true)} className="px-4 py-3 rounded-2xl bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/30 text-xs">✏️ ویرایش نام دسته‌ها</button>
          <button type="button" onClick={() => { setIsImportOpen(true); setImportStep(1); setImportRows([]); setImportImages([]); setImportLogs([]); }} className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-lg flex gap-2"><span>📥</span> ایمپورت اکسل</button>
        </div>
      </div>

      {feedback && <div className="p-4 rounded-2xl text-xs font-bold bg-emerald-500/15 text-emerald-500">{feedback.text}</div>}

      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] grid grid-cols-2 gap-3 text-xs">
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 جستجو..." className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold">
          <option value="all">📁 همه دسته‌ها</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-xs">
        {loading ? <div className="py-16 text-center text-slate-400 font-bold">⏳ در حال بارگذاری...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.slice(0, 50).map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col gap-3">
                <div className="flex gap-3">
                  <img src={p.image || "/placeholder.png"} className="w-16 h-16 rounded-2xl object-contain border bg-white p-1" />
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-[var(--accent-blue)] font-bold">{p.category}</span>
                    <h3 className="font-black text-xs line-clamp-2">{p.title}</h3>
                    <div className="font-mono text-emerald-500 font-bold">{p.price.toLocaleString("fa-IR")} تومان</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* مودال تغییر نام دسته‌بندی */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn" onClick={() => setIsCatModalOpen(false)}>
          <div className="w-full max-w-md bg-[var(--modal-bg)] rounded-3xl p-6 shadow-2xl space-y-5 border border-[var(--card-border)]" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-sm text-[var(--accent-blue)]">✏️ ویرایش و یکپارچه‌سازی دسته‌بندی‌ها</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">با تغییر نام دسته، تمام محصولات داخل آن به صورت خودکار به نام جدید منتقل می‌شوند.</p>
            <div>
              <label className="block text-xs font-bold mb-1.5">دسته فعلی (مبدأ):</label>
              <select value={renameOld} onChange={e => setRenameOld(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold">
                <option value="">انتخاب دسته فعلی...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">نام جدید (مقصد):</label>
              <input type="text" value={renameNew} onChange={e => setRenameNew(e.target.value)} placeholder="مثال: ست ورزشی زنانه" className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs flex-1">انصراف</button>
              <button type="button" disabled={renaming || !renameOld || !renameNew} onClick={handleRenameCategory} className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs flex-1 shadow-lg disabled:opacity-50">
                {renaming ? "در حال انتقال دیتابیس..." : "تغییر نام"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال ایمپورت هوشمند */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget && !importing) setIsImportOpen(false); }}>
          <div className="w-full max-w-4xl max-h-[96vh] overflow-y-auto bg-[var(--modal-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] flex flex-col" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)] sticky top-0 bg-[var(--modal-bg)] z-10 rounded-t-3xl">
              <h2 className="font-black text-sm text-emerald-500">📥 سیستم هوشمند بروزرسانی و ایمپورت گروهی</h2>
              {!importing && <button type="button" onClick={() => setIsImportOpen(false)} className="p-2 rounded-xl bg-[var(--input-bg)] font-black cursor-pointer">✕</button>}
            </div>
            <div className="p-6 space-y-6 text-xs flex-1">
              <div className={"p-5 rounded-3xl border transition " + (importStep === 1 ? "bg-[var(--accent-blue)]/5 border-[var(--accent-blue)]" : "bg-[var(--input-bg)] border-[var(--card-border)] opacity-60")}>
                <h3 className="font-black text-sm mb-3">گام اول: تنظیمات پیش‌فرض و آپلود فایل (Excel/CSV)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-4 rounded-2xl bg-[var(--modal-bg)] shadow-sm">
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">موجودی پیش‌فرض (در صورت خالی بودن):</label>
                    <input type="number" value={globalStock} onChange={e => setGlobalStock(Number(e.target.value))} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border outline-none font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">دسته‌بندی کلی (اختیاری):</label>
                    <input type="text" value={globalCategory} onChange={e => setGlobalCategory(e.target.value)} placeholder="مثال: ملزومات باشگاه" className="w-full p-3 rounded-xl bg-[var(--input-bg)] border outline-none font-bold" />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => docInputRef.current?.click()} disabled={importStep !== 1} className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shadow-lg disabled:opacity-50">📁 انتخاب فایل و خواندن محصولات</button>
                  <input ref={docInputRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleDocumentUpload} />
                </div>
              </div>

              {importRows.length > 0 && importStep >= 2 && (
                <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-sm text-[var(--accent-blue)]">پیش‌نمایش محصولات (Dry-Run)</h3>
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-500 rounded-lg font-bold">{importRows.length} محصول یافت شد</span>
                  </div>
                  <div className="overflow-x-auto max-h-48 border border-[var(--card-border)] rounded-2xl">
                    <table className="w-full text-right">
                      <thead className="bg-[var(--input-bg)] text-[var(--text-secondary)] sticky top-0">
                        <tr>
                          <th className="p-3">عنوان محصول</th>
                          <th className="p-3">دسته‌بندی (اعمال شده)</th>
                          <th className="p-3">موجودی (اعمال شده)</th>
                          <th className="p-3">قیمت نهایی (+25٪)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--card-border)] font-bold">
                        {importRows.map((r, idx) => (
                          <tr key={idx}>
                            <td className="p-3 truncate max-w-[200px]">{r.title}</td>
                            <td className="p-3 text-[var(--text-secondary)]">{r.category}</td>
                            <td className="p-3 text-indigo-500">{r.stock} عدد</td>
                            <td className="p-3 font-mono text-emerald-500">{r.price.toLocaleString("fa-IR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className={"p-5 rounded-3xl border transition " + (importStep === 2 ? "bg-emerald-500/5 border-emerald-500" : "bg-[var(--input-bg)] border-[var(--card-border)] opacity-60")}>
                <h3 className="font-black text-sm mb-3">گام دوم: انتخاب تصاویر (برای محصولات جدید)</h3>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => bulkImagesRef.current?.click()} disabled={importStep !== 2} className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black cursor-pointer shadow-lg disabled:opacity-50">🖼️ انتخاب تصاویر محصولات</button>
                  <input ref={bulkImagesRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSmartImageSelection} />
                </div>
              </div>

              {importLogs.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-sky-500/30 max-h-48 overflow-y-auto space-y-1.5 font-mono">
                  {importLogs.map((log, i) => (<div key={i} className={"text-[10px] " + (log.includes("❌") ? "text-rose-500" : "text-emerald-500")}>{log}</div>))}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-[var(--card-border)] sticky bottom-0 bg-[var(--modal-bg)] rounded-b-3xl">
              <button type="button" disabled={importStep < 2 || importing} onClick={executeBulkImport} className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black cursor-pointer disabled:opacity-50 text-sm shadow-xl flex justify-center gap-2">
                {importing ? "⏳ در حال آپدیت و ثبت..." : "🚀 تایید نهایی و ایمپورت/آپدیت محصولات"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
