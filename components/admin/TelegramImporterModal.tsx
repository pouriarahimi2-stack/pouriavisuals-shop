"use client";
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { soundEngine } from "@/lib/soundEngine";

// تمیز کردن فاصله و حروف برای تطبیق قطعی (Exact Match)
const exactNormalize = (s: string) => String(s || "").replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim().toLowerCase();

export default function TelegramImporterModal({ onClose, onImportComplete }: any) {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [excelFiles, setExcelFiles] = useState<FileList | null>(null);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);

  const [profitMargin, setProfitMargin] = useState(25);
  const [defaultStock, setDefaultStock] = useState(10);
  const [globalCategory, setGlobalCategory] = useState("");
  
  const [stockMode, setStockMode] = useState("from_file");
  const [shippingType, setShippingType] = useState("auto");
  
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [skipExisting, setSkipExisting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, step: "آماده شروع..." });
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const cancelRef = useRef(false);

  const handleCancel = () => {
      cancelRef.current = true;
      setMessage({ text: "⚠️ عملیات ایمپورت متوقف شد.", type: "error" });
      setLoading(false);
      setIsMinimized(false);
  };

  const handleRunImport = async () => {
    if (!jsonFile || !excelFiles || excelFiles.length === 0 || !photoFiles || photoFiles.length === 0) {
       setMessage({ text: "⚠️ لطفاً فایل تلگرام، فایل‌های اکسل و پوشه عکس‌ها را انتخاب کنید.", type: "error" });
       return;
    }
    
    setLoading(true);
    setMessage(null);
    cancelRef.current = false;
    soundEngine?.playClick?.();
    
    try {
       setProgress({ current: 0, step: "دریافت اطلاعات دیتابیس..." });
       
       let existingProductsMap = new Map<string, string>();
       try {
           const resExisting = await fetch("/api/products", { cache: "no-store", headers: { "Connection": "keep-alive" } });
           if (resExisting.ok) {
               const existingJson = await resExisting.json();
               (existingJson.data || []).forEach((p: any) => {
                   existingProductsMap.set(exactNormalize(p.title), String(p.id));
               });
           }
       } catch (err) {}

       if (cancelRef.current) return;

       setProgress({ current: 0, step: "پردازش فایل تلگرام..." });
       const jsonText = await jsonFile.text();
       const tgData = JSON.parse(jsonText);
       
       const productsMap: any[] = [];
       let currentProduct: any = null;
       for (const msg of (tgData.messages || [])) {
           if (msg.type !== "message") continue;
           let textContent = Array.isArray(msg.text) ? msg.text.map((t:any) => typeof t === "string" ? t : t.text).join("") : (msg.text || "");
           if (textContent.length > 5) {
               currentProduct = { description: textContent, photos: msg.photo ? [msg.photo] : [], date: msg.date_unixtime };
               productsMap.push(currentProduct);
           } else if (msg.photo && currentProduct && Math.abs(msg.date_unixtime - currentProduct.date) < 120) {
               currentProduct.photos.push(msg.photo);
           }
       }

       const photoFilesArr = Array.from(photoFiles);
       const photoMap = new Map<string, File>();
       photoFilesArr.forEach(f => {
           photoMap.set(f.name.toLowerCase(), f);
       });

       let successCount = 0;
       let skippedCount = 0;

       for (let e=0; e<excelFiles.length; e++) {
           if (cancelRef.current) break;

           const file = excelFiles[e];
           const fallbackCategory = globalCategory || file.name.split("-")[0].split("_")[0].trim() || "عمومی";
           
           setProgress({ current: successCount, step: "پردازش اکسل: " + file.name });
           
           const buffer = await file.arrayBuffer();
           const workbook = XLSX.read(buffer, { type: "array" });
           const sheet = workbook.Sheets[workbook.SheetNames[0]];
           const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

           let headerRowIndex = -1;
           let colMap = { name: -1, buyPrice: -1, stock: -1, shipping: -1, photo: -1 };

           for (let i = 0; i < Math.min(100, rawData.length); i++) {
               if (!rawData[i]) continue;
               const rowStr = rawData[i].map(String).join(" ").toLowerCase();
               if ((rowStr.includes("نام") || rowStr.includes("کالا") || rowStr.includes("محصول")) &&
                   (rowStr.includes("قیمت") || rowStr.includes("دراپ") || rowStr.includes("خرید"))) {
                   headerRowIndex = i;
                   const headers = rawData[i].map((h:any) => String(h || "").toLowerCase().trim());
                   colMap.name = headers.findIndex((h:any) => h.includes("نام") || h.includes("کالا") || h.includes("محصول"));
                   colMap.buyPrice = headers.findIndex((h:any) => h.includes("دراپ") || h.includes("خرید"));
                   if(colMap.buyPrice === -1) colMap.buyPrice = headers.findIndex((h:any) => h.includes("قیمت"));
                   colMap.stock = headers.findIndex((h:any) => h.includes("موجود"));
                   colMap.shipping = headers.findIndex((h:any) => h.includes("ارسال"));
                   colMap.photo = headers.findIndex((h:any) => h.includes("عکس") || h.includes("تصویر") || h.includes("photo") || h.includes("image"));
                   break;
               }
           }

           if (headerRowIndex === -1 || colMap.name === -1 || colMap.buyPrice === -1) continue;

           for (let i = headerRowIndex + 1; i < rawData.length; i++) {
               if (cancelRef.current) break;

               const row = rawData[i];
               if (!row || !row[colMap.name]) continue;

               const productName = String(row[colMap.name]).trim();
               const exactProdName = exactNormalize(productName);
               const buyPrice = Number(String(row[colMap.buyPrice] || "0").replace(/\D/g, ""));
               
               let stock = defaultStock;
               if (stockMode === "from_file" && colMap.stock !== -1) {
                   const rawStock = row[colMap.stock];
                   if (rawStock !== undefined && rawStock !== null) {
                       const sStr = String(rawStock).trim();
                       if (sStr.includes("ناموجود") || sStr.includes("اتمام") || sStr === "0") {
                           stock = 0;
                       } else {
                           const parsed = Number(sStr.replace(/\D/g, ""));
                           if (!isNaN(parsed) && parsed > 0) stock = parsed;
                       }
                   }
               }

               if (buyPrice === 0) continue;
               if (onlyAvailable && stock <= 0) { skippedCount++; continue; }
               
               const existingId = existingProductsMap.get(exactProdName);
               if (skipExisting && existingId) { skippedCount++; continue; }

               setProgress({ current: successCount, step: (existingId ? "آپدیت: " : "ثبت: ") + productName.slice(0,25) + "..." });
               
               let uploadedUrls: string[] = [];
               let descriptionToUse = productName; 
               let filesToUpload: File[] = [];

               // 🌟 روش 1 (استاندارد جهانی): استفاده از ستون عکس در اکسل
               if (colMap.photo !== -1 && row[colMap.photo]) {
                   const explicitPhotoName = String(row[colMap.photo]).trim().toLowerCase();
                   const matchedFile = photoMap.get(explicitPhotoName) || photoMap.get(explicitPhotoName + ".jpg");
                   if (matchedFile) filesToUpload.push(matchedFile);
               }
               
               // 🌟 روش 2 (تطبیق قطعی از تلگرام): اگر در اکسل ستون عکس نبود، فقط و فقط تطبیق 100 درصدی پذیرفته است
               if (filesToUpload.length === 0) {
                   const exactTgMatch = productsMap.find(p => {
                       const tgDesc = exactNormalize(p.description);
                       // شرط تطابق قطعی: نام محصول باید عیناً در متن تلگرام باشد
                       return tgDesc.includes(exactProdName); 
                   });

                   if (exactTgMatch) {
                       descriptionToUse = exactTgMatch.description || productName;
                       if (exactTgMatch.photos && exactTgMatch.photos.length > 0) {
                           for (const photoPath of exactTgMatch.photos) {
                               const baseName = (photoPath.split("/").pop() || photoPath.split("\\").pop() || "").toLowerCase();
                               let foundFile = photoMap.get(baseName);
                               // اگر با نام مستقیم پیدا نشد، از طریق photo_id جستجو میکنیم
                               if (!foundFile) {
                                   const matchId = baseName.match(/(photo_\d+)/);
                                   if (matchId) {
                                       foundFile = photoFilesArr.find(f => f.name.toLowerCase().includes(matchId[1]) && !f.name.toLowerCase().includes("thumb"));
                                   }
                               }
                               if (foundFile) filesToUpload.push(foundFile);
                           }
                       }
                   }
               }

               // 🌟 آپلود تصاویر پیدا شده
               for (const f of filesToUpload) {
                   if (cancelRef.current) break;
                   const formData = new FormData();
                   formData.append("file", f);
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

               if (uploadedUrls.length === 0) uploadedUrls.push("/placeholder.png");

               const finalPrice = Math.ceil((buyPrice * (1 + (profitMargin / 100))) / 1000) * 1000; 

               let finalShipping = shippingType;
               if (shippingType === "auto") {
                   if (colMap.shipping !== -1 && row[colMap.shipping] !== undefined) {
                       const strShip = String(row[colMap.shipping]).trim();
                       if (strShip.includes("پست") && strShip.includes("تیپاکس")) finalShipping = "both";
                       else if (strShip.includes("پست")) finalShipping = "post";
                       else if (strShip.includes("تیپاکس")) finalShipping = "tipax";
                       else finalShipping = "both";
                   } else {
                       finalShipping = "both";
                   }
               }

               const productPayload: any = {
                   title: productName,
                   brand: "\u200B", // جایگزین قطعی کلمه Apple
                   category: fallbackCategory,
                   price: finalPrice,
                   stock: stock,
                   is_available: stock > 0,
                   description: descriptionToUse,
                   shipping_type: finalShipping
               };
               
               if (uploadedUrls.length > 0) {
                   productPayload.image = uploadedUrls[0];
                   productPayload.images = uploadedUrls;
               } else if (!existingId) {
                   productPayload.image = "/placeholder.png";
                   productPayload.images = ["/placeholder.png"];
               }

               if (existingId) productPayload.id = existingId;

               await new Promise(resolve => setTimeout(resolve, 300));
               if (cancelRef.current) break;

               try {
                   const pRes = await fetch("/api/admin/products", {
                       method: "POST",
                       headers: { "Content-Type": "application/json" },
                       body: JSON.stringify(productPayload)
                   });
                   if (pRes.ok) {
                       if(!existingId) existingProductsMap.set(exactProdName, "saved"); 
                       successCount++;
                   }
               } catch (err) {}
           }
       }

       if (!cancelRef.current) {
           soundEngine?.playSuccess?.();
           setProgress({ current: successCount, step: "عملیات پایان یافت!" });
           setMessage({ text: "🎉 تمام! " + successCount + " کالا ثبت یا آپدیت شد. (" + skippedCount + " رد شد)", type: "success" });
           if (onImportComplete) setTimeout(() => { window.location.reload(); }, 2500);
       }

    } catch (err: any) {
       if (!cancelRef.current) setMessage({ text: "❌ خطای شبکه: " + err.message, type: "error" });
    } finally {
       setLoading(false);
    }
  };

  if (isMinimized) {
      return (
          <div className="fixed bottom-6 right-6 z-[9999] w-80 bg-[var(--modal-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] p-5 flex flex-col gap-4 font-sans select-none dir-rtl transition-all" dir="rtl">
              <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-emerald-500">🤖 ایمپورت در حال اجرا...</h3>
                  <div className="flex gap-2">
                      <button type="button" onClick={() => setIsMinimized(false)} className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-slate-200 text-slate-600 font-black transition cursor-pointer">🔼</button>
                      <button type="button" onClick={handleCancel} className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-black transition cursor-pointer">⏹</button>
                  </div>
              </div>
              <div className="text-[10px] font-bold text-[var(--text-secondary)] truncate">{progress.step}</div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-pulse w-full"></div>
              </div>
              <div className="text-xs font-black text-center text-[var(--accent-blue)]">
                 انجام شده: {progress.current} کالا
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans select-text dir-rtl">
      <div className="w-full max-w-4xl bg-[var(--modal-bg)] rounded-[2rem] shadow-2xl border border-[var(--card-border)] flex flex-col max-h-[96vh]">
        <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)] bg-[var(--modal-bg)] z-10 rounded-t-[2rem]">
          <h2 className="font-black text-sm text-emerald-500">🤖 ایمپورت قطعی و استاندارد (Strict Match)</h2>
          <div className="flex gap-2">
            {loading && <button type="button" onClick={() => setIsMinimized(true)} className="px-4 py-2 rounded-xl bg-[var(--input-bg)] hover:bg-slate-200 font-black cursor-pointer transition text-slate-600 flex items-center gap-1">➖ مینیمایز</button>}
            {loading && <button type="button" onClick={handleCancel} className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-black cursor-pointer transition flex items-center gap-1">⏹ توقف</button>}
            {!loading && <button type="button" onClick={onClose} className="p-2 rounded-xl bg-[var(--input-bg)] font-black cursor-pointer hover:bg-rose-500 hover:text-white transition">✕</button>}
          </div>
        </div>
        
        <div className="p-6 space-y-6 text-xs overflow-y-auto flex-1">
          {message && (
            <div className={"p-4 rounded-2xl font-bold border " + (message.type === "error" ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30")}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div><label className="block font-bold mb-1.5">موجودی پیش‌فرض:</label><input type="number" value={defaultStock} onChange={e=>setDefaultStock(Number(e.target.value))} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--accent-blue)]" /></div>
            <div><label className="block font-bold mb-1.5">درصد سود (+مالیات):</label><input type="number" value={profitMargin} onChange={e=>setProfitMargin(Number(e.target.value))} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-emerald-500" /></div>
            <div><label className="block font-bold mb-1.5">دسته‌بندی کلی (اختیاری):</label><input type="text" value={globalCategory} onChange={e=>setGlobalCategory(e.target.value)} placeholder="مثال: کمپینگ" className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <label className="block font-black text-xs mb-2 text-[var(--text-secondary)]">📦 نحوه اعمال موجودی:</label>
              <select value={stockMode} onChange={e=>setStockMode(e.target.value)} className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-bold text-xs cursor-pointer">
                <option value="from_file">📊 اولویت با فایل اکسل (استفاده از پیش‌فرض برای خالی‌ها)</option>
                <option value="force_default">⚡ اعمال اجباری موجودی پیش‌فرض بالا به تمام محصولات</option>
              </select>
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
          </div>

          <div className="space-y-4 border-b border-[var(--card-border)] pb-6 mt-4">
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div className={"relative w-11 h-6 rounded-full transition-colors " + (onlyAvailable ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}>
                <div className={"absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform " + (onlyAvailable ? "translate-x-5" : "translate-x-0")} />
              </div>
              <input type="checkbox" className="hidden" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} />
              <span className="font-bold text-xs">فقط محصولات موجود در فایل را وارد کن</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div className={"relative w-11 h-6 rounded-full transition-colors " + (skipExisting ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600")}>
                <div className={"absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform " + (skipExisting ? "translate-x-5" : "translate-x-0")} />
              </div>
              <input type="checkbox" className="hidden" checked={skipExisting} onChange={e => setSkipExisting(e.target.checked)} />
              <span className="font-bold text-xs text-[var(--text-primary)]">
                 اگر محصول در سایت هست، skip کن 
                 <span className="text-rose-500 mr-1 block sm:inline mt-1 sm:mt-0 bg-rose-500/10 px-2 py-0.5 rounded-lg">(برای آپدیت تنظیمات، خاموش بماند)</span>
              </span>
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
                <p className="font-mono text-slate-500 font-black text-sm">تعداد قطعی: <span className="text-[var(--accent-blue)]">{progress.current}</span> کالا</p>
             </div>
          )}

          <button onClick={handleRunImport} disabled={loading} className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xl transition cursor-pointer disabled:opacity-50">
            {loading ? "در حال پردازش..." : "🚀 شروع ایمپورت هوشمند"}
          </button>
        </div>
      </div>
    </div>
  );
}