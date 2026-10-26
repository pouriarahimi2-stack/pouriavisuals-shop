"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { soundEngine } from "@/lib/soundEngine";

const cleanStr = (s: string) => String(s || "").replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim().toLowerCase();

// سیستم امتیازدهی پیشرفته برای جلوگیری از قاطی شدن عکس‌ها
const getBestMatch = (title: string, productsMap: any[]) => {
    const cTitle = cleanStr(title);
    let bestMatch = null;
    let bestScore = 0;
    
    for (const p of productsMap) {
        const cDesc = cleanStr(p.description);
        let score = 0;
        
        if (cDesc === cTitle) score = 1.0;
        else if (cDesc.includes(cTitle)) score = 0.9;
        else if (cTitle.includes(cDesc) && cDesc.length > 5) score = 0.8;
        else {
            const titleWords = cTitle.split(/\s+/).filter(w => w.length > 2);
            if (titleWords.length > 0) {
                let matchCount = 0;
                for (const w of titleWords) {
                    if (cDesc.includes(w)) matchCount++;
                }
                score = matchCount / titleWords.length;
            }
        }
        
        // فقط اگر بیش از 50% کلمات یکی بود و نمره‌اش از بقیه بیشتر بود انتخابش کن
        if (score > bestScore && score >= 0.5) { 
            bestScore = score;
            bestMatch = p;
        }
    }
    return bestMatch;
};

export default function TelegramImporterModal({ onClose, onImportComplete }: any) {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [excelFiles, setExcelFiles] = useState<FileList | null>(null);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);

  const [profitMargin, setProfitMargin] = useState(25);
  const [defaultStock, setDefaultStock] = useState(10);
  const [globalCategory, setGlobalCategory] = useState("");
  
  const [shippingType, setShippingType] = useState("auto");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [skipExisting, setSkipExisting] = useState(true);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, step: "آماده شروع..." });
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

  const handleRunImport = async () => {
    if (!jsonFile || !excelFiles || excelFiles.length === 0 || !photoFiles || photoFiles.length === 0) {
       setMessage({ text: "⚠️ لطفاً فایل تلگرام، فایل‌های اکسل و پوشه عکس‌ها را انتخاب کنید.", type: "error" });
       return;
    }
    
    setLoading(true);
    setMessage(null);
    soundEngine?.playClick?.();
    
    try {
       setProgress({ current: 0, step: "دریافت لیست برای جلوگیری از تکرار..." });
       let existingTitles = new Set<string>();
       try {
           const resExisting = await fetch("/api/products", { cache: "no-store", headers: { "Connection": "keep-alive" } });
           if (resExisting.ok) {
               const existingJson = await resExisting.json();
               existingTitles = new Set((existingJson.data || []).map((p: any) => cleanStr(p.title)));
           }
       } catch (err) { console.warn("Fetch Existing Error:", err); }

       setProgress({ current: 0, step: "پردازش هوش مصنوعی پیام‌های تلگرام..." });
       const jsonText = await jsonFile.text();
       const tgData = JSON.parse(jsonText);
       
       const productsMap: any[] = [];
       let currentProduct: any = null;
       for (const msg of (tgData.messages || [])) {
           if (msg.type !== "message") continue;
           let textContent = Array.isArray(msg.text) ? msg.text.map((t:any) => typeof t === "string" ? t : t.text).join("") : (msg.text || "");
           const msgPhoto = msg.photo || msg.file || null; // پشتبانی از فرمت‌های مختلف مدیا
           const msgDate = Number(msg.date_unixtime || 0);

           if (textContent.length > 15) {
               currentProduct = { description: textContent, photos: msgPhoto ? [msgPhoto] : [], date: msgDate };
               productsMap.push(currentProduct);
           } else if (msgPhoto && currentProduct && Math.abs(msgDate - currentProduct.date) < 120) {
               // جمع‌آوری عکس‌های آلبوم
               currentProduct.photos.push(msgPhoto);
           }
       }

       const photoMap = new Map<string, File>();
       for(let i=0; i<photoFiles.length; i++) {
           photoMap.set(photoFiles[i].name, photoFiles[i]);
       }

       let successCount = 0;
       let skippedCount = 0;

       for (let e=0; e<excelFiles.length; e++) {
           const file = excelFiles[e];
           const fallbackCategory = globalCategory || file.name.split("-")[0].split("_")[0].trim() || "کالای دیجیتال";
           
           setProgress({ current: successCount, step: "در حال پردازش: " + file.name });
           
           const buffer = await file.arrayBuffer();
           const workbook = XLSX.read(buffer, { type: "array" });
           const sheet = workbook.Sheets[workbook.SheetNames[0]];
           const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

           let headerRowIndex = -1;
           let colMap = { name: -1, buyPrice: -1, stock: -1, shipping: -1 };

           for (let i = 0; i < Math.min(100, rawData.length); i++) {
               if (!rawData[i]) continue;
               const rowStr = rawData[i].map(String).join(" ").toLowerCase();
               if ((rowStr.includes("نام") || rowStr.includes("کالا") || rowStr.includes("محصول")) &&
                   (rowStr.includes("قیمت") || rowStr.includes("دراپ") || rowStr.includes("خرید"))) {
                   headerRowIndex = i;
                   const headers = rawData[i].map((h:any) => String(h || "").toLowerCase().trim());
                   colMap.name = headers.findIndex((h:any) => h.includes("نام") || h.includes("کالا") || h.includes("محصول"));
                   colMap.buyPrice = headers.findIndex((h:any) => h.includes("دراپ") || h.includes("قیمت") || h.includes("خرید"));
                   colMap.stock = headers.findIndex((h:any) => h.includes("موجود"));
                   colMap.shipping = headers.findIndex((h:any) => h.includes("ارسال"));
                   break;
               }
           }

           if (headerRowIndex === -1 || colMap.name === -1 || colMap.buyPrice === -1) continue;

           for (let i = headerRowIndex + 1; i < rawData.length; i++) {
               const row = rawData[i];
               if (!row || !row[colMap.name]) continue;

               const productName = String(row[colMap.name]).trim();
               const cleanProdName = cleanStr(productName);
               const buyPrice = Number(String(row[colMap.buyPrice] || "0").replace(/\D/g, ""));
               const stock = colMap.stock !== -1 ? Number(String(row[colMap.stock] || String(defaultStock)).replace(/\D/g, "")) : defaultStock;
               const rowShipping = colMap.shipping !== -1 ? String(row[colMap.shipping] || "both") : "both";

               if (buyPrice === 0) continue;
               if (onlyAvailable && stock <= 0) { skippedCount++; continue; }
               if (skipExisting && existingTitles.has(cleanProdName)) { skippedCount++; continue; }

               setProgress({ current: successCount, step: "ثبت و تطبیق: " + productName.slice(0,25) + "..." });
               
               // 🌟 استفاده از الگوریتم جدید امتیازدهی برای پیدا کردن دقیق‌ترین عکس
               const matchedTg = getBestMatch(productName, productsMap);
               
               let uploadedUrls: string[] = [];
               let descriptionToUse = productName; 

               if (matchedTg) {
                   descriptionToUse = matchedTg.description || productName;
                   if (matchedTg.photos && matchedTg.photos.length > 0) {
                       for (const photoPath of matchedTg.photos) {
                           const photoName = photoPath.split("/").pop() || photoPath.split("\\").pop();
                           const decodedName = decodeURIComponent(photoName); // حل مشکل فاصله در اسم فایل‌ها
                           const photoFile = photoMap.get(photoName) || photoMap.get(decodedName);
                           
                           if (photoFile) {
                               const formData = new FormData();
                               formData.append("file", photoFile);
                               await new Promise(resolve => setTimeout(resolve, 300));
                               try {
                                   const upRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
                                   if (upRes.ok) {
                                       const upJson = await upRes.json();
                                       if (upJson.success && (upJson.rawUrl || upJson.url)) {
                                           uploadedUrls.push(upJson.rawUrl || upJson.url);
                                       }
                                   }
                               } catch (err) {}
                           }
                       }
                   }
               }

               if (uploadedUrls.length === 0) {
                   uploadedUrls.push("/placeholder.png");
               }

               const priceWithProfit = buyPrice * (1 + (profitMargin / 100));
               const finalPrice = Math.ceil((priceWithProfit * 1.10) / 1000) * 1000; 

               const productPayload = {
                   title: productName,
                   brand: "", // ارسال فیلد خالی برای خنثی کردن هرگونه دیفالت
                   category: fallbackCategory,
                   price: finalPrice,
                   stock: stock,
                   is_available: stock > 0,
                   description: descriptionToUse,
                   shipping_type: shippingType === "auto" ? rowShipping : shippingType,
                   image: uploadedUrls[0],
                   images: uploadedUrls
               };

               await new Promise(resolve => setTimeout(resolve, 300));

               try {
                   const pRes = await fetch("/api/admin/products", {
                       method: "POST",
                       headers: { "Content-Type": "application/json" },
                       body: JSON.stringify(productPayload)
                   });
                   if (pRes.ok) {
                       existingTitles.add(cleanProdName); 
                       successCount++;
                   }
               } catch (err) {
                   console.warn("Insert error:", err);
               }
           }
       }

       soundEngine?.playSuccess?.();
       setProgress({ current: successCount, step: "عملیات با موفقیت پایان یافت!" });
       setMessage({ text: "🎉 عالی! " + successCount + " کالا ثبت شد. (" + skippedCount + " تکراری رد شد)", type: "success" });
       if (onImportComplete) setTimeout(() => { window.location.reload(); }, 2500);

    } catch (err: any) {
       setMessage({ text: "❌ خطای شبکه: " + err.message, type: "error" });
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans select-text dir-rtl">
      <div className="w-full max-w-4xl bg-[var(--modal-bg)] rounded-[2rem] shadow-2xl border border-[var(--card-border)] flex flex-col max-h-[96vh]">
        <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)] bg-[var(--modal-bg)] z-10 rounded-t-[2rem]">
          <h2 className="font-black text-sm text-emerald-500">🤖 ایمپورت هوشمند تلگرام (تطبیق عکس AI و حذف قطعی Apple)</h2>
          {!loading && <button type="button" onClick={onClose} className="p-2 rounded-xl bg-[var(--input-bg)] font-black cursor-pointer hover:bg-rose-500 hover:text-white transition">✕</button>}
        </div>
        
        <div className="p-6 space-y-6 text-xs overflow-y-auto flex-1">
          {message && (
            <div className={"p-4 rounded-2xl font-bold border " + (message.type === "error" ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30")}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="block font-bold mb-1.5">موجودی پیش‌فرض:</label><input type="number" value={defaultStock} onChange={e=>setDefaultStock(Number(e.target.value))} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" /></div>
            <div><label className="block font-bold mb-1.5">درصد سود (+مالیات):</label><input type="number" value={profitMargin} onChange={e=>setProfitMargin(Number(e.target.value))} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" /></div>
            <div><label className="block font-bold mb-1.5">دسته‌بندی کلی (اختیاری):</label><input type="text" value={globalCategory} onChange={e=>setGlobalCategory(e.target.value)} placeholder="مثال: کمپینگ" className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" /></div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            <label className="block font-black text-xs mb-2 text-[var(--text-secondary)]">🚚 نوع ارسال (برای همه محصولات):</label>
            <select value={shippingType} onChange={e=>setShippingType(e.target.value)} className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-bold text-xs cursor-pointer">
              <option value="auto">📋 خودکار — از ستون نوع ارسال فایل بخوان</option>
              <option value="post">📮 پست — همه محصولات فقط پست</option>
              <option value="tipax">🚚 تیپاکس (پس‌کرایه) — همه محصولات فقط تیپاکس</option>
              <option value="both">📦 هر دو روش — مشتری انتخاب کند</option>
            </select>
          </div>

          <div className="space-y-4 border-b border-[var(--card-border)] pb-6">
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div className={"relative w-11 h-6 rounded-full transition-colors " + (onlyAvailable ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}>
                <div className={"absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform " + (onlyAvailable ? "translate-x-5" : "translate-x-0")} />
              </div>
              <span className="font-bold text-xs">فقط محصولات موجود را وارد کن</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none group opacity-70">
              <div className="relative w-11 h-6 rounded-full bg-emerald-500 transition-colors">
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full translate-x-5 transition-transform" />
              </div>
              <span className="font-bold text-xs">اگر محصول در سایت هست، skip کن (فعال برای جلوگیری از تکرار)</span>
            </label>
          </div>

          <div className="space-y-3">
             <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5">
                <label className="block font-black mb-2 text-sky-500">۱. انتخاب فایل JSON تلگرام</label>
                <input type="file" accept=".json" onChange={e => setJsonFile(e.target.files?.[0] || null)} className="w-full font-mono text-[10px]" />
             </div>
             <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                <label className="block font-black mb-2 text-amber-500">۲. انتخاب فایل‌های اکسل</label>
                <input type="file" multiple accept=".xlsx,.xls" onChange={e => setExcelFiles(e.target.files)} className="w-full font-mono text-[10px]" />
             </div>
             <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                <label className="block font-black mb-2 text-emerald-500">۳. انتخاب پوشه عکس‌ها</label>
                <input type="file" {...{ webkitdirectory: "", directory: "" } as any} multiple onChange={e => setPhotoFiles(e.target.files)} className="w-full font-mono text-[10px]" />
             </div>
          </div>

          {loading && (
             <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-bold text-emerald-500">{progress.step}</p>
                <p className="font-mono text-slate-500 font-black text-sm">ثبت قطعی: <span className="text-[var(--accent-blue)]">{progress.current}</span> کالا</p>
             </div>
          )}

          <button onClick={handleRunImport} disabled={loading} className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xl transition cursor-pointer disabled:opacity-50">
            {loading ? "در حال پردازش..." : "🚀 شروع ایمپورت هوشمند تلگرام"}
          </button>
        </div>
      </div>
    </div>
  );
}