"use client";
import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export interface FullCatalogProduct {
  id: string; title: string; sku?: string; brand?: string; category: string;
  price: number; discount_price?: number | null; purchase_price?: number; stock: number;
  is_available: boolean; image?: string; images?: string[]; description?: string;
  meta_title?: string; specs?: Record<string, any>;
}

function isRealUrl(s: string) { return s && !s.startsWith("data:") && s.length < 2000; }

export function AdminProducts(_props: any = {}) {
  const [products, setProducts]   = useState<FullCatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [feedback, setFeedback]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [searchQuery, setSearchQuery]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importImages, setImportImages] = useState<File[]>([]);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const bulkImagesRef = useRef<HTMLInputElement>(null);

  const notify = (text: string, type: "success"|"error" = "success") => {
    setFeedback({ type, text }); setTimeout(() => setFeedback(null), 4500);
  };

  const fetchCatalog = async () => {
    try {
      const pRes = await fetch("/api/products?t=" + Date.now(), { cache: "no-store" });
      const pJson = await pRes.json();
      const list = (pJson.data || pJson.products || []).map((p: any) => ({
        ...p, price: Number(p.price || 0), stock: p.stock !== undefined ? Number(p.stock) : 10, is_available: p.is_available !== false,
      }));
      setProducts(list);
      setCategories(Array.from(new Set<string>(list.map((x:any) => x.category).filter(Boolean))));
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCatalog();
    const ch = supabase.channel("rt-catalog").on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchCatalog).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const compressImageLocal = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image(); img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width, h = img.height;
          if (w > 1000) { h = Math.round((h * 1000) / w); w = 1000; }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => { resolve(blob ? new File([blob], file.name, { type: "image/webp" }) : file); }, "image/webp", 0.85);
        };
      };
    });
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setImportLogs(["⏳ در حال پردازش فایل اکسل..."]);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      const parsed = json.map((row: any) => {
        const rawDropStr = String(row["قیمت دراپ"] || row["Drop Price"] || row["قیمت"] || "0").replace(/[,.]/g, "");
        const dropPrice = Number(rawDropStr) || 0;
        const finalPrice = Math.round(dropPrice * 1.25); 

        let stockVal = 10;
        const rawStock = String(row["موجودی"] || row["Stock"] || "");
        if (rawStock.includes("موجود") && !rawStock.includes("نا")) stockVal = 50;
        else if (Number(rawStock)) stockVal = Number(rawStock);
        else if (rawStock.includes("ناموجود")) stockVal = 0;

        // پشتیبانی از چند عکس با کاما
        const photoStr = row["Photo_Filename"] || row["Photo Filename"] || row["photo"] || "";
        const photoArray = photoStr.split(",").map((s:string) => s.trim()).filter(Boolean);

        return {
          title: row["نام محصول"] || row["عنوان"] || "بدون عنوان",
          sku: row["کد محصول"] || row["SKU"] || "",
          purchase_price: dropPrice,
          price: finalPrice,
          category: row["دسته بندی"] || "تجهیزات ورزشی",
          photos: photoArray, // آرایه عکس‌ها
          description: row["Telegram_Description"] || "",
          stock: stockVal,
          brand: row["برند"] || "متفرقه",
        };
      });
      
      setImportRows(parsed);
      setImportLogs([`✅ ${parsed.length} محصول پیدا شد. (محصولات بدون عکس با رنگ قرمز مشخص شده‌اند و آپلود نمی‌شوند)`]);
      setImportStep(2);
    } catch (err) { alert("خطا در پردازش."); }
    e.target.value = "";
  };

  const handleSmartImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // پیدا کردن تمام اسم عکس‌های مورد نیاز از تمام ردیف‌ها
    const allowedNames = new Set<string>();
    importRows.forEach(r => { r.photos.forEach((p:string) => allowedNames.add(p)); });
    
    const filtered = files.filter((f) => allowedNames.has(f.name));
    setImportImages(filtered);
    setImportLogs((prev) => [`📸 ${filtered.length} عکس معتبر برای محصولات استخراج شد.`, ...prev]);
    e.target.value = "";
  };

  const executeBulkImport = async () => {
    soundEngine.playClick(); setImporting(true); setImportStep(3);
    let successCount = 0; let updateCount = 0; let failCount = 0; let skippedCount = 0;

    for (let i = 0; i < importRows.length; i++) {
      const row = importRows[i];
      try {
        // جلوگیری از آپلود محصولات بدون عکس
        if (!row.photos || row.photos.length === 0) {
          skippedCount++;
          setImportLogs((prev) => [`⚠️ رد شد (بدون عکس): ${row.title}`, ...prev]);
          continue;
        }

        const existing = products.find(p => (row.sku && p.sku === row.sku) || p.title === row.title);
        const isUpdate = !!existing;

        setImportLogs((prev) => [`⏳ ${isUpdate ? 'آپدیت' : 'ثبت'}: ${row.title}...`, ...prev]);

        let uploadedImages: string[] = existing?.images || [];
        
        // آپلود تمام عکس‌های مربوط به این محصول
        if (!isUpdate) {
          const matchedFiles = importImages.filter(f => row.photos.includes(f.name));
          for (const mFile of matchedFiles) {
             const compressed = await compressImageLocal(mFile);
             const fd = new FormData(); fd.append("file", compressed);
             const upRes = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
             const upJson = await upRes.json();
             if (upJson.success && upJson.url) uploadedImages.push(upJson.url);
          }
        }

        // اگر هیچ عکسی با موفقیت آپلود نشد، محصول را نساز!
        if (uploadedImages.length === 0 && !isUpdate) {
          failCount++;
          setImportLogs((prev) => [`❌ خطا: عکسی برای ${row.title} آپلود نشد.`, ...prev]);
          continue;
        }

        const mainImg = uploadedImages[0] || "/placeholder.png";

        const payload = {
          id: existing?.id,
          title: row.title, name: row.title,
          category: row.category || existing?.category,
          price: row.price, purchase_price: row.purchase_price,
          stock: row.stock, is_available: row.stock > 0,
          image: mainImg, image_url: mainImg,
          images: Array.from(new Set(uploadedImages)),
          description: row.description || existing?.description || "",
          brand: row.brand || existing?.brand, sku: row.sku || existing?.sku,
        };

        const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) { isUpdate ? updateCount++ : successCount++; } else { failCount++; }
      } catch (err) { failCount++; }
    }
    soundEngine.playSuccess();
    setImportLogs((prev) => [`🎉 اتمام! (${successCount} ثبت، ${updateCount} آپدیت، ${skippedCount} فاقدعکس، ${failCount} خطا)`, ...prev]);
    setImporting(false); fetchCatalog();
  };

  const filtered = products.filter((p) => categoryFilter === "all" || p.category === categoryFilter);

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)]">🛍️ مدیریت کاتالوگ محصولات</h1>
        </div>
        <button type="button" onClick={() => { setIsImportOpen(true); setImportStep(1); setImportRows([]); setImportImages([]); setImportLogs([]); }}
          className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-lg hover:bg-emerald-500 transition cursor-pointer">
          📥 ایمپورت هوشمند (چندعکسی)
        </button>
      </div>

      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] grid grid-cols-2 gap-3 text-xs">
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 جستجو..." className="p-3 rounded-2xl bg-[var(--input-bg)] outline-none border" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-3 rounded-2xl bg-[var(--input-bg)] outline-none border font-bold">
          <option value="all">📁 همه دسته‌ها</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-xs">
        {loading ? <div className="py-16 text-center text-slate-400 font-bold">⏳ در حال بارگذاری...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.slice(0, 50).map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-[var(--input-bg)] border flex gap-3">
                <img src={p.image || "/placeholder.png"} className="w-16 h-16 rounded-2xl object-cover" />
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] text-[var(--accent-blue)] font-bold">{p.category}</span>
                  <h3 className="font-black text-xs line-clamp-2">{p.title}</h3>
                  <div className="font-mono text-emerald-500 font-bold">{p.price.toLocaleString("fa-IR")} تومان</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget && !importing) setIsImportOpen(false); }}>
          <div className="w-full max-w-4xl max-h-[96vh] overflow-y-auto bg-[var(--modal-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] flex flex-col" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)] sticky top-0 bg-[var(--modal-bg)] z-10 rounded-t-3xl">
              <h2 className="font-black text-sm text-emerald-500">📥 ایمپورت گروهی و هوشمند (پشتیبانی از چند عکس)</h2>
              {!importing && <button type="button" onClick={() => setIsImportOpen(false)} className="p-2 rounded-xl bg-[var(--input-bg)] font-black">✕</button>}
            </div>
            
            <div className="p-6 space-y-6 text-xs flex-1">
              <div className={"p-5 rounded-3xl border transition " + (importStep === 1 ? "bg-[var(--accent-blue)]/5 border-[var(--accent-blue)]" : "bg-[var(--input-bg)] border-[var(--card-border)] opacity-60")}>
                <h3 className="font-black text-sm mb-3">گام ۱: آپلود فایل اکسل</h3>
                <p className="text-slate-500 mb-3 leading-relaxed">اسامی عکس‌ها را در ستون Photo_Filename بنویسید. برای اختصاص چند عکس به یک محصول، اسم آن‌ها را با کاما جدا کنید (مثال: img1.jpg, img2.jpg).</p>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => docInputRef.current?.click()} disabled={importStep !== 1} className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg disabled:opacity-50">📁 انتخاب اکسل</button>
                  <input ref={docInputRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleDocumentUpload} />
                </div>
              </div>

              {importRows.length > 0 && importStep >= 2 && (
                <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-sm text-[var(--accent-blue)]">پیش‌نمایش محصولات</h3>
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-500 rounded-lg font-bold">{importRows.length} محصول یافت شد</span>
                  </div>
                  <div className="overflow-x-auto max-h-48 border rounded-2xl">
                    <table className="w-full text-right">
                      <thead className="bg-[var(--input-bg)] text-[var(--text-secondary)] sticky top-0">
                        <tr><th className="p-3">عنوان محصول / کد</th><th className="p-3">قیمت نهایی (+25٪)</th><th className="p-3">تعداد عکس ارجاعی</th></tr>
                      </thead>
                      <tbody className="divide-y font-bold">
                        {importRows.map((r, idx) => (
                          <tr key={idx} className={r.photos.length === 0 ? "bg-rose-500/10 text-rose-500" : ""}>
                            <td className="p-3 truncate max-w-[200px]">{r.title}</td>
                            <td className="p-3 font-mono">{r.price.toLocaleString("fa-IR")}</td>
                            <td className="p-3 font-mono" dir="ltr">{r.photos.length === 0 ? "بدون عکس ❌" : `${r.photos.length} عکس`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className={"p-5 rounded-3xl border transition " + (importStep === 2 ? "bg-emerald-500/5 border-emerald-500" : "bg-[var(--input-bg)] border-[var(--card-border)] opacity-60")}>
                <h3 className="font-black text-sm mb-3">گام ۲: انتخاب تمام تصاویر گالری</h3>
                <button type="button" onClick={() => bulkImagesRef.current?.click()} disabled={importStep !== 2} className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black shadow-lg disabled:opacity-50">🖼️ انتخاب تصاویر محصولات</button>
                <input ref={bulkImagesRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSmartImageSelection} />
              </div>

              {importLogs.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] max-h-48 overflow-y-auto space-y-1.5 font-mono">
                  {importLogs.map((log, i) => (<div key={i} className={"text-[10px] " + (log.includes("❌") || log.includes("⚠️") ? "text-rose-500" : "text-emerald-500")}>{log}</div>))}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t sticky bottom-0 bg-[var(--modal-bg)] rounded-b-3xl">
              <button type="button" disabled={importStep < 2 || importing} onClick={executeBulkImport} className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black cursor-pointer disabled:opacity-50 text-sm shadow-xl flex items-center justify-center gap-2">
                {importing ? "⏳ در حال آپدیت و ثبت..." : "🚀 شروع آپلود امن محصولات"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
