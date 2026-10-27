"use client";
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { soundEngine } from "@/lib/soundEngine";

const normalizeStr = (s: string) => String(s || "").replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim().toLowerCase();

export default function TelegramImporterModal({ onClose, onImportComplete }: any) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [excelFiles, setExcelFiles] = useState<FileList | null>(null);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);

  const [profitMargin, setProfitMargin] = useState(25);
  const [defaultStock, setDefaultStock] = useState(10);
  const [globalCategory, setGlobalCategory] = useState("");
  const [shippingType, setShippingType] = useState("auto");
  
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [skipExisting, setSkipExisting] = useState(false);

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [photoFilesArr, setPhotoFilesArr] = useState<File[]>([]);
  const [galleryOpenFor, setGalleryOpenFor] = useState<number | null>(null);
  
  // 🌟 استیت جدید برای جستجو در گالری
  const [gallerySearch, setGallerySearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, step: "آماده شروع..." });
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const cancelRef = useRef(false);

  const handlePrepareData = async () => {
    if (!excelFiles || excelFiles.length === 0 || !photoFiles || photoFiles.length === 0) {
       setMessage({ text: "⚠️ لطفاً حداقل فایل اکسل و پوشه عکس‌ها را انتخاب کنید.", type: "error" });
       return;
    }
    
    setLoading(true); setMessage(null); soundEngine?.playClick?.();
    
    try {
       setProgress({ current: 0, step: "در حال پردازش فایل‌ها برای پیش‌نمایش..." });
       const photosArray = Array.from(photoFiles);
       setPhotoFilesArr(photosArray);

       let tgProducts: any[] = [];
       if (jsonFile) {
           try {
               const jsonText = await jsonFile.text();
               const tgData = JSON.parse(jsonText);
               let currentProduct: any = null;
               for (const msg of (tgData.messages || [])) {
                   if (msg.type !== "message") continue;
                   let textContent = Array.isArray(msg.text) ? msg.text.map((t:any) => typeof t === "string" ? t : t.text).join("") : (msg.text || "");
                   if (textContent.length > 5) {
                       currentProduct = { description: textContent, photos: msg.photo ? [msg.photo] : [], date: msg.date_unixtime };
                       tgProducts.push(currentProduct);
                   } else if (msg.photo && currentProduct && Math.abs(msg.date_unixtime - currentProduct.date) < 120) {
                       currentProduct.photos.push(msg.photo);
                   }
               }
           } catch (e) {}
       }

       let allExtractedRows: any[] = [];

       for (let e = 0; e < excelFiles.length; e++) {
           const file = excelFiles[e];
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
                   colMap.buyPrice = headers.findIndex((h:any) => h.includes("دراپ") || h.includes("خرید"));
                   if(colMap.buyPrice === -1) colMap.buyPrice = headers.findIndex((h:any) => h.includes("قیمت"));
                   colMap.stock = headers.findIndex((h:any) => h.includes("موجود"));
                   colMap.shipping = headers.findIndex((h:any) => h.includes("ارسال"));
                   break;
               }
           }

           if (headerRowIndex === -1) continue;

           for (let i = headerRowIndex + 1; i < rawData.length; i++) {
               const row = rawData[i];
               if (!row || !row[colMap.name]) continue;

               const productName = String(row[colMap.name]).trim();
               const buyPrice = Number(String(row[colMap.buyPrice] || "0").replace(/\D/g, ""));
               
               let stock = defaultStock;
               if (colMap.stock !== -1 && row[colMap.stock] !== undefined) {
                   const sStr = String(row[colMap.stock]).trim();
                   if (sStr.includes("ناموجود") || sStr.includes("اتمام") || sStr === "0") {
                       stock = 0;
                   } else {
                       const parsed = Number(sStr.replace(/\D/g, ""));
                       if (!isNaN(parsed) && parsed > 0) stock = parsed;
                   }
               }

               if (buyPrice === 0) continue;
               if (onlyAvailable && stock <= 0) continue;

               const priceWithProfit = buyPrice * (1 + (profitMargin / 100));
               const finalPrice = Math.ceil(priceWithProfit / 1000) * 1000; 

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

               let guessedFile: File | null = null;
               let guessedDesc = productName;
               
               if (tgProducts.length > 0) {
                   const exClean = normalizeStr(productName);
                   let bestMatch = null;
                   let maxScore = 0;
                   for (const tg of tgProducts) {
                       const tgDesc = normalizeStr(tg.description);
                       if (tgDesc.includes(exClean)) { bestMatch = tg; break; }
                       const words = exClean.split(/\s+/).filter(w => w.length > 2);
                       let hits = 0;
                       for (const w of words) { if (tgDesc.includes(w)) hits++; }
                       if (hits > maxScore) { maxScore = hits; bestMatch = tg; }
                   }

                   if (bestMatch && maxScore >= 2) {
                       guessedDesc = bestMatch.description || productName;
                       if (bestMatch.photos && bestMatch.photos.length > 0) {
                           const pPath = bestMatch.photos[0];
                           const bName = (pPath.split("/").pop() || pPath.split("\\").pop() || "").toLowerCase();
                           
                           guessedFile = photosArray.find(f => f.name.toLowerCase() === bName) || null;
                           if (!guessedFile) {
                               const matchId = bName.match(/(photo_\d+)/);
                               if (matchId) {
                                   guessedFile = photosArray.find(f => f.name.toLowerCase().includes(matchId[1]) && !f.name.toLowerCase().includes("thumb")) || null;
                               }
                           }
                       }
                   }
               }

               allExtractedRows.push({
                   title: productName,
                   price: finalPrice,
                   stock: stock,
                   shipping_type: finalShipping,
                   category: globalCategory || file.name.split("-")[0].split("_")[0].trim() || "عمومی",
                   description: guessedDesc,
                   matchedFile: guessedFile 
               });
           }
       }

       setParsedRows(allExtractedRows);
       setStep(2); 
       soundEngine?.playSuccess?.();

    } catch (err: any) {
       setMessage({ text: "❌ خطا در پردازش فایل‌ها: " + err.message, type: "error" });
    } finally {
       setLoading(false);
    }
  };

  const handleFinalImport = async () => {
      setLoading(true);
      setStep(3);
      cancelRef.current = false;
      let successCount = 0;
      let skippedCount = 0;

      try {
          setProgress({ current: 0, step: "دریافت دیتابیس برای جلوگیری از تکرار..." });
          let existingProductsMap = new Map<string, string>();
          try {
              const resExisting = await fetch("/api/products", { cache: "no-store" });
              if (resExisting.ok) {
                  const existingJson = await resExisting.json();
                  (existingJson.data || []).forEach((p: any) => {
                      existingProductsMap.set(normalizeStr(p.title), String(p.id));
                  });
              }
          } catch (err) {}

          for (let i = 0; i < parsedRows.length; i++) {
              if (cancelRef.current) break;
              const row = parsedRows[i];
              
              const cleanProdName = normalizeStr(row.title);
              const existingId = existingProductsMap.get(cleanProdName);
              
              if (skipExisting && existingId) {
                  skippedCount++; continue;
              }

              setProgress({ current: successCount, step: "در حال آپلود: " + row.title.slice(0, 25) + "..." });

              let finalImageUrl = "/placeholder.png";
              let imagesArr = ["/placeholder.png"];

              if (row.matchedFile) {
                  const formData = new FormData();
                  formData.append("file", row.matchedFile);
                  await new Promise(resolve => setTimeout(resolve, 200));
                  try {
                      const upRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
                      if (upRes.ok) {
                          const upJson = await upRes.json();
                          if (upJson.success && (upJson.rawUrl || upJson.url)) {
                              finalImageUrl = upJson.rawUrl || upJson.url;
                              imagesArr = [finalImageUrl];
                          }
                      }
                  } catch (err) {}
              }

              const productPayload: any = {
                  title: row.title,
                  brand: "\u200B", 
                  category: row.category,
                  price: row.price,
                  stock: row.stock,
                  is_available: row.stock > 0,
                  description: row.description,
                  shipping_type: row.shipping_type,
                  image: finalImageUrl,
                  images: imagesArr
              };

              if (existingId) productPayload.id = existingId;

              await new Promise(resolve => setTimeout(resolve, 200));
              if (cancelRef.current) break;

              try {
                  const pRes = await fetch("/api/admin/products", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(productPayload)
                  });
                  if (pRes.ok) successCount++;
              } catch (err) {}
          }

          if (!cancelRef.current) {
              soundEngine?.playSuccess?.();
              setProgress({ current: successCount, step: "عملیات پایان یافت!" });
              setMessage({ text: "🎉 عالی! " + successCount + " کالا ثبت شد. (" + skippedCount + " رد شد)", type: "success" });
              if (onImportComplete) setTimeout(() => { window.location.reload(); }, 2500);
          }
      } catch (err: any) {
          if (!cancelRef.current) setMessage({ text: "❌ خطای شبکه: " + err.message, type: "error" });
      } finally {
          setLoading(false);
      }
  };

  const handleCancel = () => {
      cancelRef.current = true;
      setMessage({ text: "⚠️ عملیات متوقف شد.", type: "error" });
      setLoading(false);
      setIsMinimized(false);
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
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-pulse w-full"></div>
              </div>
              <div className="text-xs font-black text-center text-[var(--accent-blue)]">
                 انجام شده: {progress.current} کالا
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans select-text dir-rtl transition-all">
      
      {/* 👑 گالری انتخاب دستی عکس (Visual Mapper Picker) اصلاح شده */}
      {galleryOpenFor !== null && (
          <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col p-4 sm:p-8 animate-fadeIn" onClick={() => setGalleryOpenFor(null)}>
              
              {/* هدر گالری به همراه سرچ */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4" onClick={e => e.stopPropagation()}>
                  <h3 className="text-white font-black text-sm sm:text-base">انتخاب دستی تصویر:</h3>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                      <input 
                          type="text" 
                          placeholder="🔍 جستجوی نام عکس..." 
                          value={gallerySearch}
                          onChange={e => setGallerySearch(e.target.value)}
                          className="flex-1 sm:w-72 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 outline-none font-mono text-xs focus:border-sky-500 transition"
                      />
                      <button onClick={() => setGalleryOpenFor(null)} className="text-rose-500 font-black p-3 bg-white/10 rounded-xl hover:bg-white/20 transition whitespace-nowrap cursor-pointer">انصراف ✕</button>
                  </div>
              </div>
              
              {/* بدنه گالری - اصلاح شده برای جلوگیری از له‌شدگی عکس‌ها */}
              <div className="flex-1 overflow-y-auto pr-2" onClick={e => e.stopPropagation()}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-10 auto-rows-max">
                      
                      {/* دکمه بدون عکس */}
                      <div 
                         onClick={() => {
                             setParsedRows(prev => { const arr = [...prev]; arr[galleryOpenFor].matchedFile = null; return arr; });
                             setGalleryOpenFor(null);
                         }}
                         className="h-32 sm:h-40 bg-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer border-2 border-transparent hover:border-slate-500 transition text-slate-400">
                         <span className="text-3xl mb-2">🚫</span>
                         <span className="text-[10px] font-bold">بدون عکس</span>
                      </div>

                      {/* رندر عکس‌های فیلتر شده - با محدودیت 200 تایی برای جلوگیری از کرش مرورگر */}
                      {photoFilesArr
                          .filter(f => f.name.toLowerCase().includes(gallerySearch.toLowerCase()))
                          .slice(0, 200)
                          .map((f, idx) => (
                          <div key={idx} 
                              onClick={() => {
                                  setParsedRows(prev => { const arr = [...prev]; arr[galleryOpenFor].matchedFile = f; return arr; });
                                  setGalleryOpenFor(null);
                              }}
                              className="relative h-32 sm:h-40 rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-emerald-500 transition group bg-white p-1">
                              <img 
                                  src={URL.createObjectURL(f)} 
                                  loading="lazy"
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                                  alt="تصویر" 
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-black/75 p-1.5 text-[9px] text-white truncate text-center font-mono backdrop-blur-md" dir="ltr">
                                  {f.name}
                              </div>
                          </div>
                      ))}
                  </div>
                  
                  {photoFilesArr.filter(f => f.name.toLowerCase().includes(gallerySearch.toLowerCase())).length > 200 && (
                      <p className="text-center text-white/50 font-bold text-xs mt-6 mb-10 bg-white/5 p-4 rounded-xl">
                          ⚠️ بیش از ۲۰۰ عکس پیدا شد. برای مشاهده سایر عکس‌ها، نام آن‌ها را در کادر بالا جستجو کنید.
                      </p>
                  )}
              </div>
          </div>
      )}

      <div className="w-full max-w-4xl bg-[var(--modal-bg)] rounded-[2rem] shadow-2xl border border-[var(--card-border)] flex flex-col max-h-[96vh]">
        <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)] bg-[var(--modal-bg)] z-10 rounded-t-[2rem]">
          <h2 className="font-black text-sm text-emerald-500">
              {step === 1 ? "🤖 مرحله ۱: انتخاب فایل‌ها و تنظیمات" : step === 2 ? "👀 مرحله ۲: تایید و اصلاح چشمی عکس‌ها (Visual Mapper)" : "⏳ مرحله ۳: در حال ایمپورت..."}
          </h2>
          <div className="flex gap-2">
            {step === 3 && loading && <button type="button" onClick={() => setIsMinimized(true)} className="px-4 py-2 rounded-xl bg-[var(--input-bg)] font-black cursor-pointer transition text-slate-600">➖ مینیمایز</button>}
            {step === 3 && loading && <button type="button" onClick={handleCancel} className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-black cursor-pointer transition">⏹ توقف</button>}
            {!loading && <button type="button" onClick={onClose} className="p-2 rounded-xl bg-[var(--input-bg)] font-black cursor-pointer hover:bg-rose-500 hover:text-white transition">✕</button>}
          </div>
        </div>
        
        <div className="p-6 space-y-6 text-xs overflow-y-auto flex-1 relative">
          {message && (
            <div className={"p-4 rounded-2xl font-bold border " + (message.type === "error" ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30")}>
              {message.text}
            </div>
          )}

          {/* ══════════ گام ۱: تنظیمات ══════════ */}
          {step === 1 && (
              <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div><label className="block font-bold mb-1.5">موجودی پیش‌فرض:</label><input type="number" value={defaultStock} onChange={e=>setDefaultStock(Number(e.target.value))} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--accent-blue)]" /></div>
                    <div><label className="block font-bold mb-1.5">درصد سود (+مالیات):</label><input type="number" value={profitMargin} onChange={e=>setProfitMargin(Number(e.target.value))} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-emerald-500" /></div>
                    <div><label className="block font-bold mb-1.5">دسته‌بندی کلی (اختیاری):</label><input type="text" value={globalCategory} onChange={e=>setGlobalCategory(e.target.value)} placeholder="مثال: روشنایی" className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                         اگر محصول در سایت هست، skip کن (برای آپدیت تنظیمات، خاموش بماند)
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3">
                     <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5">
                        <label className="block font-black mb-2 text-sky-500">۱. انتخاب فایل JSON تلگرام (اختیاری جهت حدس اولیه)</label>
                        <input type="file" accept=".json" onChange={e => setJsonFile(e.target.files?.[0] || null)} className="w-full font-mono text-[10px]" />
                     </div>
                     <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                        <label className="block font-black mb-2 text-amber-500">۲. انتخاب فایل‌های اکسل *</label>
                        <input type="file" multiple accept=".xlsx,.xls" onChange={e => setExcelFiles(e.target.files)} className="w-full font-mono text-[10px]" />
                     </div>
                     <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                        <label className="block font-black mb-2 text-emerald-500">۳. انتخاب پوشه عکس‌ها *</label>
                        <input type="file" {...{ webkitdirectory: "", directory: "" } as any} multiple onChange={e => setPhotoFiles(e.target.files)} className="w-full font-mono text-[10px]" />
                     </div>
                  </div>

                  <button onClick={handlePrepareData} disabled={loading} className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black shadow-xl transition cursor-pointer disabled:opacity-50">
                    {loading ? "در حال استخراج لیست..." : "➡️ رفتن به مرحله بررسی چشمی عکس‌ها"}
                  </button>
              </>
          )}

          {/* ══════════ گام ۲: Visual Mapper (تطبیق چشمی) ══════════ */}
          {step === 2 && (
              <div className="space-y-4">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                      <h3 className="font-black text-amber-600 mb-2">👀 لطفاً عکس‌ها را چک کنید</h3>
                      <p className="text-[10px] text-amber-600/80 leading-relaxed">
                          سیستم سعی کرده عکس‌ها را متصل کند. اگر عکسی اشتباه است یا خالی مانده، کافیست روی دکمه <b>«تغییر عکس»</b> کلیک کنید و از گالری، تصویر درست را انتخاب کنید. پس از اطمینان، دکمه ایمپورت نهایی در پایین صفحه را بزنید.
                      </p>
                  </div>

                  <div className="space-y-3">
                      {parsedRows.map((row, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-3 border border-[var(--card-border)] bg-[var(--input-bg)] rounded-2xl">
                              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
                                  {row.matchedFile ? (
                                      <img src={URL.createObjectURL(row.matchedFile)} alt="Preview" className="w-full h-full object-contain" />
                                  ) : (
                                      <span className="text-xl opacity-50">🚫</span>
                                  )}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-xs text-[var(--text-primary)] truncate" title={row.title}>{row.title}</h4>
                                  <div className="text-[10px] font-mono text-emerald-500 font-bold mt-1">{row.price.toLocaleString("fa-IR")} تومان | موجودی: {row.stock}</div>
                              </div>
                              <button 
                                  type="button" 
                                  onClick={() => setGalleryOpenFor(idx)}
                                  className="px-4 py-2 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-black text-[10px] rounded-xl hover:bg-[var(--accent-blue)]/20 transition whitespace-nowrap">
                                  ✏️ تغییر عکس
                              </button>
                          </div>
                      ))}
                  </div>

                  <div className="sticky bottom-0 p-4 bg-[var(--modal-bg)] border-t border-[var(--card-border)] rounded-b-[2rem] -mx-6 mt-6">
                      <div className="flex gap-3">
                          <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl bg-[var(--input-bg)] text-slate-600 font-black shadow-sm hover:bg-slate-200 transition">
                              بازگشت
                          </button>
                          <button onClick={handleFinalImport} className="flex-[2] py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xl transition cursor-pointer">
                              ✅ عکس‌ها تایید شد، ایمپورت را شروع کن
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* ══════════ گام ۳: آپلود ══════════ */}
          {step === 3 && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                 <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 <div className="text-center">
                     <p className="font-black text-lg text-emerald-500 mb-2">{progress.step}</p>
                     <p className="font-mono text-slate-500 font-black">ردیف پردازش شده: <span className="text-[var(--accent-blue)] text-xl">{progress.current}</span></p>
                 </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
}