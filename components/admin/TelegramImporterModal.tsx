"use client";
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { soundEngine } from "@/lib/soundEngine";

const normalizeStr = (s: string) => String(s || "").replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim().toLowerCase();

const normalizeToWords = (str: string) => {
    let s = String(str || "").toLowerCase();
    s = s.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));
    s = s.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632));
    s = s.replace(/[^a-z0-9\u0600-\u06FF]/ig, ' ');
    s = s.replace(/([0-9]+)/g, ' $1 '); 
    return s.split(/\s+/).filter(w => w.length > 1 || /^[0-9]$/.test(w));
};

const findBestMatch = (excelName: string, tgProducts: any[]) => {
    const exWords = normalizeToWords(excelName);
    const exNumbers = exWords.filter(w => /^[0-9]+$/.test(w));
    const mainNoun = exWords.find(w => /^[\u0600-\u06FF]+$/.test(w)); 

    let bestTg = null;
    let maxScore = 0;

    for (const tg of tgProducts) {
        const tgWords = normalizeToWords(tg.description);
        
        let missingNum = false;
        for (const num of exNumbers) {
            if (!tgWords.includes(num)) {
                missingNum = true; 
                break;
            }
        }
        if (missingNum) continue; 

        if (mainNoun && !tgWords.includes(mainNoun)) continue; 

        const exStr = exWords.join(" ");
        const tgStr = tgWords.join(" ");
        if (tgStr.includes(exStr)) return tg;

        let matchCount = 0;
        for (const w of exWords) {
            if (tgWords.includes(w)) matchCount++;
        }
        const coverage = matchCount / exWords.length;
        
        let penalty = 0;
        if (exWords.includes("تک") && !tgWords.includes("تک")) penalty += 0.5;
        if (exWords.includes("دو") && !tgWords.includes("دو")) penalty += 0.5;
        
        const finalScore = coverage - penalty;

        if (finalScore > maxScore && finalScore >= 0.5) {
            maxScore = finalScore;
            bestTg = tg;
        }
    }
    return bestTg;
};

const findPhotoFile = (photoPath: string, filesArr: File[]) => {
    if (!photoPath) return null;
    const baseName = (photoPath.split("/").pop() || photoPath.split("\\").pop() || "").toLowerCase();
    
    let found = filesArr.find(f => f.name.toLowerCase() === baseName);
    if (found) return found;
    
    const match = baseName.match(/(photo_\d+)/);
    if (match) {
        const coreId = match[1];
        found = filesArr.find(f => f.name.toLowerCase().includes(coreId) && !f.name.toLowerCase().includes("thumb"));
        if (found) return found;
        found = filesArr.find(f => f.name.toLowerCase().includes(coreId));
        return found;
    }
    return null;
};

export default function TelegramImporterModal({ onClose, onImportComplete }: any) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
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

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [photoFilesArr, setPhotoFilesArr] = useState<File[]>([]);
  
  const [galleryOpenFor, setGalleryOpenFor] = useState<number | null>(null);
  const [gallerySearch, setGallerySearch] = useState("");
  const [visiblePhotos, setVisiblePhotos] = useState(50);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  
  // 🌟 استیت مربوط به انتخاب چندگانه عکس‌ها در یک مرحله
  const [tempSelectedFiles, setTempSelectedFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, step: "آماده شروع..." });
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const cancelRef = useRef(false);
  const pauseRef = useRef(false);

  const togglePause = () => {
      pauseRef.current = !pauseRef.current;
      setIsPaused(pauseRef.current);
      if (pauseRef.current) setProgress(p => ({ ...p, step: "⏸️ عملیات متوقف شد (Paused)..." }));
      else setProgress(p => ({ ...p, step: "▶️ عملیات از سر گرفته شد..." }));
  };

  const handleCancel = () => {
      cancelRef.current = true;
      pauseRef.current = false;
      setIsPaused(false);
      setMessage({ text: "⚠️ عملیات ایمپورت توسط شما به طور کامل لغو شد.", type: "error" });
      setLoading(false);
      setIsMinimized(false);
  };

  const handlePrepareData = async () => {
    if (!excelFiles || excelFiles.length === 0) {
       setMessage({ text: "⚠️ لطفاً حداقل فایل اکسل را انتخاب کنید.", type: "error" });
       return;
    }
    
    setLoading(true); setMessage(null); soundEngine?.playClick?.();
    
    try {
       setProgress({ current: 0, step: "در حال تحلیل دیتابیس فعلی..." });
       
       let existingProductsMap = new Map<string, any>();
       try {
           const resExisting = await fetch("/api/products", { cache: "no-store" });
           if (resExisting.ok) {
               const existingJson = await resExisting.json();
               (existingJson.data || []).forEach((p: any) => {
                   existingProductsMap.set(normalizeStr(p.title), p);
               });
           }
       } catch (err) {}

       if (cancelRef.current) return;

       setProgress({ current: 0, step: "در حال تحلیل فایل تلگرام و عکس‌ها..." });
       
       const photosArray = photoFiles ? Array.from(photoFiles) : [];
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
           if (cancelRef.current) break;
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
               if (cancelRef.current) break;

               const row = rawData[i];
               if (!row || !row[colMap.name]) continue;

               const productName = String(row[colMap.name]).trim();
               const exactProdName = normalizeStr(productName);
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
               } else if (stockMode === "force_default") {
                   stock = defaultStock;
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

               const existingProduct = existingProductsMap.get(exactProdName);
               
               if (existingProduct) {
                   allExtractedRows.push({
                       action: "update",
                       id: existingProduct.id,
                       title: productName,
                       price: finalPrice,
                       stock: stock,
                       shipping_type: finalShipping,
                       category: existingProduct.category, 
                       description: existingProduct.description, 
                       existingImage: existingProduct.image, 
                       existingImages: existingProduct.images, 
                       matchedFiles: [] // 🌟 تبدیل به آرایه تصاویر
                   });
               } else {
                   let guessedFiles: File[] = [];
                   let guessedDesc = productName;
                   
                   if (tgProducts.length > 0) {
                       const matchedTg = findBestMatch(productName, tgProducts);
                       if (matchedTg) {
                           guessedDesc = matchedTg.description || productName;
                           if (matchedTg.photos && matchedTg.photos.length > 0) {
                               for (const photoPath of matchedTg.photos) {
                                   const pFile = findPhotoFile(photoPath, photosArray);
                                   // 🌟 تمام عکس‌های تلگرام مربوط به این کالا را به عنوان حدس اولیه می‌گیرد
                                   if (pFile && !guessedFiles.some(f => f.name === pFile.name)) {
                                       guessedFiles.push(pFile);
                                   }
                               }
                           }
                       }
                   }

                   allExtractedRows.push({
                       action: "new",
                       title: productName,
                       price: finalPrice,
                       stock: stock,
                       shipping_type: finalShipping,
                       category: globalCategory || file.name.split("-")[0].split("_")[0].trim() || "عمومی",
                       description: guessedDesc,
                       matchedFiles: guessedFiles // 🌟 ذخیره به صورت آرایه
                   });
               }
           }
       }

       setParsedRows(allExtractedRows);
       const hasNewProducts = allExtractedRows.some(r => r.action === "new");
       if (hasNewProducts) {
           setStep(2);
       } else {
           handleFinalImport(allExtractedRows);
       }
       soundEngine?.playSuccess?.();

    } catch (err: any) {
       setMessage({ text: "❌ خطا در پردازش فایل‌ها: " + err.message, type: "error" });
       setLoading(false);
    }
  };

  const handleFinalImport = async (rowsToProcess = parsedRows) => {
      setLoading(true);
      setStep(3);
      cancelRef.current = false;
      pauseRef.current = false;
      setIsPaused(false);
      
      let newCount = 0;
      let updateCount = 0;
      let skippedCount = 0;

      try {
          for (let i = 0; i < rowsToProcess.length; i++) {
              
              while (pauseRef.current) {
                  if (cancelRef.current) break;
                  await new Promise(resolve => setTimeout(resolve, 500));
              }
              if (cancelRef.current) break;

              const row = rowsToProcess[i];
              
              if (skipExisting && row.action === "update") {
                  skippedCount++; continue;
              }

              setProgress({ current: newCount + updateCount, step: (row.action === "update" ? "🔄 آپدیت سریع: " : "🆕 آپلود محصول جدید: ") + row.title.slice(0, 25) + "..." });

              let finalImageUrl = "/placeholder.png";
              let imagesArr = ["/placeholder.png"];

              if (row.action === "update") {
                  finalImageUrl = row.existingImage || "/placeholder.png";
                  imagesArr = row.existingImages || [finalImageUrl];
              } 
              // 🌟 آپلود گروهی تمام عکس‌های انتخاب شده برای محصول
              else if (row.matchedFiles && row.matchedFiles.length > 0) {
                  let uploadedUrls: string[] = [];
                  for (const f of row.matchedFiles) {
                      if (cancelRef.current) break;
                      const formData = new FormData();
                      formData.append("file", f);
                      await new Promise(resolve => setTimeout(resolve, 100)); // وقفه کوتاه‌تر
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
                  if (uploadedUrls.length > 0) {
                      finalImageUrl = uploadedUrls[0]; // اولین عکس به عنوان اصلی (کاور)
                      imagesArr = uploadedUrls; // بقیه در گالری
                  }
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

              if (row.action === "update") {
                  productPayload.id = row.id;
              }

              await new Promise(resolve => setTimeout(resolve, 200));
              if (cancelRef.current) break;

              try {
                  const pRes = await fetch("/api/admin/products", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(productPayload)
                  });
                  if (pRes.ok) {
                      if (row.action === "update") updateCount++;
                      else newCount++;
                  }
              } catch (err) {}
          }

          if (!cancelRef.current) {
              soundEngine?.playSuccess?.();
              setProgress({ current: newCount + updateCount, step: "عملیات با موفقیت پایان یافت!" });
              setMessage({ text: `🎉 عالی! ${newCount} کالای جدید اضافه شد، ${updateCount} کالا آپدیت قیمت شد. (${skippedCount} رد شد)`, type: "success" });
              if (onImportComplete) setTimeout(() => { window.location.reload(); }, 3000);
          }
      } catch (err: any) {
          if (!cancelRef.current) setMessage({ text: "❌ خطای شبکه: " + err.message, type: "error" });
      } finally {
          setLoading(false);
      }
  };

  const toggleImageSelection = (f: File) => {
      setTempSelectedFiles(prev => {
          const isSelected = prev.some(tf => tf.name === f.name);
          if (isSelected) {
              return prev.filter(tf => tf.name !== f.name); // حذف از لیست
          } else {
              return [...prev, f]; // اضافه به لیست
          }
      });
  };

  const setAsMainImage = (e: React.MouseEvent, f: File) => {
      e.stopPropagation();
      setTempSelectedFiles(prev => {
          const others = prev.filter(tf => tf.name !== f.name);
          return [f, ...others]; // آوردن به جایگاه ایندکس صفر (اولین عکس)
      });
  };

  const confirmGallerySelection = () => {
      if (galleryOpenFor !== null) {
          const originalIndex = parsedRows.findIndex(r => r === newProductsOnly[galleryOpenFor]);
          setParsedRows(prev => { 
              const arr = [...prev]; 
              arr[originalIndex].matchedFiles = tempSelectedFiles; 
              return arr; 
          });
      }
      setGalleryOpenFor(null);
  };

  if (isMinimized) {
      return (
          <div className="fixed bottom-6 right-6 z-[9999] w-80 bg-[var(--modal-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] p-5 flex flex-col gap-4 font-sans select-none dir-rtl transition-all" dir="rtl">
              <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-emerald-500">🤖 در حال پردازش...</h3>
                  <div className="flex gap-2">
                      <button type="button" onClick={() => setIsMinimized(false)} className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-slate-200 text-slate-600 font-black transition cursor-pointer" title="بزرگنمایی">🔼</button>
                      <button type="button" onClick={togglePause} className="p-2 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white font-black transition cursor-pointer" title={isPaused ? "ادامه" : "توقف موقت"}>
                          {isPaused ? "▶️" : "⏸️"}
                      </button>
                      <button type="button" onClick={handleCancel} className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-black transition cursor-pointer" title="لغو کامل">⏹</button>
                  </div>
              </div>
              <div className="text-[10px] font-bold text-[var(--text-secondary)] truncate">{progress.step}</div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-emerald-500 w-full ${isPaused ? 'opacity-50' : 'animate-pulse'}`}></div>
              </div>
              <div className="text-xs font-black text-center text-[var(--accent-blue)]">
                 انجام شده: {progress.current} ردیف
              </div>
          </div>
      );
  }

  const newProductsOnly = parsedRows.filter(r => r.action === "new");
  const updatingProductsCount = parsedRows.filter(r => r.action === "update").length;
  const filteredPhotos = photoFilesArr.filter(f => f.name.toLowerCase().includes(gallerySearch.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans select-text dir-rtl transition-all">
      
      {/* 👑 لایت‌باکس بزرگنمایی عکس */}
      {previewFile && (
          <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-4 animate-fadeIn" onClick={() => setPreviewFile(null)}>
              <div className="absolute top-4 right-4 flex gap-3" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setPreviewFile(null)} className="px-6 py-2 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition cursor-pointer shadow-lg">
                      ✕ بازگشت به گالری
                  </button>
              </div>
              
              <img src={URL.createObjectURL(previewFile)} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl mb-4" alt="Preview" onClick={e => e.stopPropagation()} />
              
              <div className="bg-white/10 px-6 py-3 rounded-2xl flex items-center gap-4 backdrop-blur-md" onClick={e => e.stopPropagation()}>
                  <p className="text-white font-mono text-sm max-w-xs truncate" dir="ltr">{previewFile.name}</p>
              </div>
          </div>
      )}

      {/* 👑 گالری Visual Mapper (با حفظ موقعیت اسکرول) */}
      {galleryOpenFor !== null && (
          <div className={`fixed inset-0 z-[60] bg-black/95 flex-col p-4 sm:p-8 animate-fadeIn ${previewFile ? "hidden" : "flex"}`} onClick={() => confirmGallerySelection()}>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4" onClick={e => e.stopPropagation()}>
                  <div className="text-white">
                     <h3 className="font-black text-lg mb-1">انتخاب تصاویر برای:</h3>
                     <p className="text-sky-400 font-bold text-sm">{newProductsOnly[galleryOpenFor].title}</p>
                     <p className="text-slate-400 text-xs mt-1">تعداد {tempSelectedFiles.length} عکس انتخاب شده است. اولین عکس، کاور اصلی سایت خواهد بود.</p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                      <input 
                          type="text" 
                          placeholder="🔍 جستجوی نام عکس..." 
                          value={gallerySearch}
                          onChange={e => { setGallerySearch(e.target.value); setVisiblePhotos(50); }}
                          className="flex-1 sm:w-72 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 outline-none font-mono text-xs focus:border-sky-500 transition"
                      />
                      <button onClick={() => confirmGallerySelection()} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl shadow-lg transition cursor-pointer text-sm whitespace-nowrap">
                          ✅ تایید عکس‌های انتخاب شده
                      </button>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 pb-10 custom-scrollbar" onClick={e => e.stopPropagation()}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                      
                      <div 
                         onClick={() => setTempSelectedFiles([])}
                         className="aspect-square bg-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer border-2 border-transparent hover:border-rose-500 transition text-slate-400">
                         <span className="text-3xl mb-2">🚫</span>
                         <span className="text-[10px] font-bold text-center">حذف همه عکس‌ها<br/>(بدون عکس)</span>
                      </div>

                      {filteredPhotos.slice(0, visiblePhotos).map((f, idx) => {
                          const selIndex = tempSelectedFiles.findIndex(tf => tf.name === f.name);
                          const isSelected = selIndex !== -1;
                          const isMain = selIndex === 0;

                          return (
                              <div key={idx} 
                                  onClick={() => toggleImageSelection(f)} 
                                  className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all group p-1 ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-white hover:border-slate-300'}`}>
                                  
                                  <img 
                                      src={URL.createObjectURL(f)} 
                                      loading="lazy"
                                      className="w-full h-full object-contain transition-transform duration-300" 
                                      alt="تصویر" 
                                  />
                                  
                                  {/* دکمه ذره‌بین برای پیش‌نمایش */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); setPreviewFile(f); }}
                                          className="text-white font-black text-xs bg-black/70 px-4 py-2 rounded-xl border border-white/20 hover:scale-110 transition-transform shadow-xl">
                                          🔍 بزرگنمایی
                                      </button>
                                  </div>

                                  {/* لیبل وضعیت انتخاب و عکس اصلی */}
                                  {isSelected && (
                                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                                          <span className={`text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-md ${isMain ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                              {isMain ? "👑 اصلی" : `✓ انتخاب (${selIndex + 1})`}
                                          </span>
                                          {!isMain && (
                                              <button 
                                                  onClick={(e) => setAsMainImage(e, f)}
                                                  className="text-[9px] bg-slate-800/80 hover:bg-black text-white px-2 py-1 rounded-lg shadow-md transition backdrop-blur-sm opacity-0 group-hover:opacity-100">
                                                  ⭐ کاور شود
                                              </button>
                                          )}
                                      </div>
                                  )}

                                  <div className="absolute bottom-0 inset-x-0 bg-black/80 p-1.5 text-[8px] text-white truncate text-center font-mono" dir="ltr">
                                      {f.name}
                                  </div>
                              </div>
                          );
                      })}
                  </div>

                  {visiblePhotos < filteredPhotos.length && (
                      <div className="flex justify-center mt-10 mb-6">
                          <button 
                              onClick={() => setVisiblePhotos(prev => prev + 50)}
                              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl border border-white/20 transition cursor-pointer shadow-lg">
                              نمایش عکس‌های بیشتر ⬇️ (مانده: {filteredPhotos.length - visiblePhotos})
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}

      <div className="w-full max-w-4xl bg-[var(--modal-bg)] rounded-[2rem] shadow-2xl border border-[var(--card-border)] flex flex-col max-h-[96vh]">
        <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)] bg-[var(--modal-bg)] z-10 rounded-t-[2rem]">
          <h2 className="font-black text-sm text-emerald-500">
              {step === 1 ? "🤖 مرحله ۱: انتخاب فایل‌ها و تنظیمات" : step === 2 ? "👀 مرحله ۲: تایید گالری عکس محصولات جدید" : "⏳ مرحله ۳: در حال همگام‌سازی..."}
          </h2>
          <div className="flex gap-2">
            {step === 3 && loading && (
                <>
                    <button type="button" onClick={() => setIsMinimized(true)} className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] font-black cursor-pointer transition text-slate-600 hover:bg-slate-200" title="مینیمایز">➖</button>
                    <button type="button" onClick={togglePause} className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white font-black cursor-pointer transition" title={isPaused ? "ادامه عملیات" : "توقف موقت (Pause)"}>
                        {isPaused ? "▶️ ادامه" : "⏸️ توقف"}
                    </button>
                    <button type="button" onClick={handleCancel} className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-black cursor-pointer transition" title="لغو کامل">⏹ لغو</button>
                </>
            )}
            {(!loading || step !== 3) && (
                <button type="button" onClick={onClose} className="p-2 rounded-xl bg-[var(--input-bg)] font-black cursor-pointer hover:bg-rose-500 hover:text-white transition">✕</button>
            )}
          </div>
        </div>
        
        <div className="p-6 space-y-6 text-xs overflow-y-auto flex-1 relative">
          {message && (
            <div className={"p-4 rounded-2xl font-bold border " + (message.type === "error" ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30")}>
              {message.text}
            </div>
          )}

          {step === 1 && (
              <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div><label className="block font-bold mb-1.5">موجودی پیش‌فرض:</label><input type="number" value={defaultStock} onChange={e=>setDefaultStock(Number(e.target.value))} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--accent-blue)]" /></div>
                    <div><label className="block font-bold mb-1.5">درصد سود (+مالیات):</label><input type="number" value={profitMargin} onChange={e=>setProfitMargin(Number(e.target.value))} className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-emerald-500" /></div>
                    <div><label className="block font-bold mb-1.5">دسته‌بندی کلی (اختیاری):</label><input type="text" value={globalCategory} onChange={e=>setGlobalCategory(e.target.value)} placeholder="مثال: روشنایی" className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" /></div>
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
                         نادیده گرفتن محصولات تکراری 
                         <span className="text-rose-500 mr-1 block sm:inline mt-1 sm:mt-0 bg-rose-500/10 px-2 py-0.5 rounded-lg">(برای آپدیتِ سریع قیمت‌ها، این تیک حتماً باید خاموش باشد)</span>
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3">
                     <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5">
                        <label className="block font-black mb-2 text-sky-500">۱. انتخاب فایل JSON تلگرام (اختیاری جهت حدس اولیه کالای جدید)</label>
                        <input type="file" accept=".json" onChange={e => setJsonFile(e.target.files?.[0] || null)} className="w-full font-mono text-[10px]" />
                     </div>
                     <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                        <label className="block font-black mb-2 text-amber-500">۲. انتخاب فایل‌های اکسل *</label>
                        <input type="file" multiple accept=".xlsx,.xls" onChange={e => setExcelFiles(e.target.files)} className="w-full font-mono text-[10px]" />
                     </div>
                     <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                        <label className="block font-black mb-2 text-emerald-500">۳. انتخاب پوشه عکس‌ها (اختیاری برای آپدیت قیمت)</label>
                        <input type="file" {...{ webkitdirectory: "", directory: "" } as any} multiple onChange={e => setPhotoFiles(e.target.files)} className="w-full font-mono text-[10px]" />
                     </div>
                  </div>

                  <button onClick={handlePrepareData} disabled={loading} className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black shadow-xl transition cursor-pointer disabled:opacity-50">
                    {loading ? "در حال استخراج لیست..." : "➡️ استارت عملیات همگام‌سازی"}
                  </button>
              </>
          )}

          {step === 2 && (
              <div className="space-y-4">
                  <div className="flex gap-4">
                     {updatingProductsCount > 0 && (
                         <div className="flex-1 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                             <h3 className="font-black text-emerald-600 mb-1">⚡ آپدیت فوق‌سریع</h3>
                             <p className="text-[10px] text-emerald-600/80"><b>{updatingProductsCount} کالا</b> از قبل در سایت وجود دارند. فقط قیمت و موجودی آن‌ها آپدیت خواهد شد.</p>
                         </div>
                     )}
                     {newProductsOnly.length > 0 && (
                         <div className="flex-1 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                             <h3 className="font-black text-amber-600 mb-1">🆕 کالاهای کاملاً جدید</h3>
                             <p className="text-[10px] text-amber-600/80">این <b>{newProductsOnly.length} کالا</b> جدید هستند. لطفاً عکس‌های گالری و کاور آن‌ها را تایید کنید.</p>
                         </div>
                     )}
                  </div>

                  {newProductsOnly.length === 0 ? (
                      <div className="py-10 text-center text-slate-500 font-bold">هیچ کالای جدیدی برای تایید عکس وجود ندارد. آماده آپدیت سریع قیمت‌ها!</div>
                  ) : (
                      <div className="space-y-3">
                          {newProductsOnly.map((row, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-[var(--card-border)] bg-[var(--input-bg)] rounded-2xl">
                                  <div className="flex gap-2 items-center">
                                      <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center p-1 relative">
                                          {row.matchedFiles && row.matchedFiles.length > 0 ? (
                                              <>
                                                  <img src={URL.createObjectURL(row.matchedFiles[0])} alt="Main" className="w-full h-full object-contain" />
                                                  <span className="absolute top-1 right-1 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow">کاور</span>
                                              </>
                                          ) : (
                                              <span className="text-xl opacity-50">🚫</span>
                                          )}
                                      </div>
                                      {row.matchedFiles && row.matchedFiles.length > 1 && (
                                          <div className="flex flex-col gap-1">
                                              {row.matchedFiles.slice(1, 3).map((f: File, i: number) => (
                                                  <img key={i} src={URL.createObjectURL(f)} className="w-9 h-9 rounded-lg border bg-white object-contain" alt="gallery" />
                                              ))}
                                              {row.matchedFiles.length > 3 && (
                                                  <span className="text-[10px] font-bold text-slate-400 text-center">+{row.matchedFiles.length - 3}</span>
                                              )}
                                          </div>
                                      )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <h4 className="font-black text-xs text-[var(--text-primary)] truncate" title={row.title}>{row.title}</h4>
                                      <div className="text-[10px] font-mono text-emerald-500 font-bold mt-1">{row.price.toLocaleString("fa-IR")} تومان</div>
                                      <div className="text-[10px] text-slate-500 mt-1">تعداد عکس: {row.matchedFiles?.length || 0} مورد</div>
                                  </div>
                                  <button 
                                      type="button" 
                                      onClick={() => { 
                                          setGalleryOpenFor(idx); 
                                          setTempSelectedFiles(row.matchedFiles || []);
                                          setVisiblePhotos(50); 
                                      }}
                                      className="px-4 py-2 bg-[var(--accent-blue)] text-white font-black text-[10px] rounded-xl hover:bg-sky-500 shadow-md transition whitespace-nowrap cursor-pointer">
                                      {row.matchedFiles?.length > 0 ? "✏️ ویرایش گالری محصول" : "🖼️ انتخاب عکس‌ها"}
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}

                  <div className="sticky bottom-0 p-4 bg-[var(--modal-bg)] border-t border-[var(--card-border)] rounded-b-[2rem] -mx-6 mt-6">
                      <div className="flex gap-3">
                          <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl bg-[var(--input-bg)] text-slate-600 font-black shadow-sm hover:bg-slate-200 transition cursor-pointer">
                              بازگشت
                          </button>
                          <button onClick={() => handleFinalImport()} className="flex-[2] py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xl transition cursor-pointer">
                              ✅ تایید و شروع آپلود نهایی
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {step === 3 && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                 {isPaused ? (
                     <div className="w-16 h-16 flex items-center justify-center text-4xl">⏸️</div>
                 ) : (
                     <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 )}
                 <div className="text-center">
                     <p className={`font-black text-lg mb-2 ${isPaused ? 'text-amber-500' : 'text-emerald-500'}`}>{progress.step}</p>
                     <p className="font-mono text-slate-500 font-black">ردیف پردازش شده: <span className="text-[var(--accent-blue)] text-xl">{progress.current}</span></p>
                 </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
}