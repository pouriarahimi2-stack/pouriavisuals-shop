import TelegramImporterModal from "@/components/admin/TelegramImporterModal";
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export interface FullCatalogProduct {
  id: string; title: string; name?: string; sku?: string; brand?: string; category: string;
  price: number; discount_price?: number | null; purchase_price?: number; stock: number;
  is_available: boolean; image?: string; images?: string[]; description?: string;
  warranty?: string; meta_title?: string; meta_description?: string; specs?: Record<string, any>;
  shipping_type?: "post" | "tipax" | "both";
  color_options?: { name: string; hex: string }[];
}

function isRealUrl(s: string) { return !!(s && !s.startsWith("data:") && s.length < 2000); }

const COL_MAP: Record<string, string[]> = {
  title:         ["نام محصول","عنوان","title","product name","product_name","اسم محصول","نام"],
  sku:           ["کد محصول","sku","code","product code","product_code","کد","شناسه"],
  drop_price:    ["قیمت دراپ","drop price","drop_price","قیمت","price","قیمت خرید","buying price"],
  stock:         ["موجودی","stock","quantity","تعداد","qty"],
  category:      ["دسته بندی","دسته‌بندی","category","cat","دسته","گروه"],
  brand:         ["برند","brand","manufacturer","سازنده"],
  photo:         ["photo_filename","photo filename","photo","تصویر","عکس","image","img","filename"],
  description:   ["telegram_description","telegram description","توضیحات","description","desc","متن"],
  discount_price:["قیمت تخفیف","قیمت فروش","discount","sale price","discount_price","قیمت ویژه"],
  warranty:      ["گارانتی","warranty","ضمانت"],
  shipping_type: ["نوع ارسال","shipping_type","shipping","ارسال","روش ارسال","delivery","نحوه ارسال"],
};

function fuzzyGet(row: Record<string,any>, col: string): any {
  const aliases = COL_MAP[col] || [col];
  const rowLower = Object.fromEntries(Object.entries(row).map(([k,v]) => [k.trim().toLowerCase(), v]));
  for (const a of aliases) {
    if (rowLower[a.toLowerCase()] !== undefined) return rowLower[a.toLowerCase()];
  }
  for (const a of aliases) {
    const found = Object.keys(rowLower).find(k => k.includes(a.toLowerCase()) || a.toLowerCase().includes(k));
    if (found) return rowLower[found];
  }
  return undefined;
}

function fuzzyMatchImages(allFiles: File[], photoField: string | null, sku: string): File[] {
  // فیلتر: فایل‌های thumb را حذف کن (photo_60@...thumb.jpg)
  const mainFiles = allFiles.filter(f =>
    !f.name.toLowerCase().includes(".thumb.") &&
    !f.name.toLowerCase().endsWith(".thumb")
  );
  const result: File[] = [];
  const seen = new Set<string>();
  const addFile = (f: File) => { if (!seen.has(f.name)) { seen.add(f.name); result.push(f); } };

  if (photoField) {
    const names = photoField.split(/[,،;]/).map((s: string) => s.trim()).filter(Boolean);
    for (const name of names) {
      const nl = name.toLowerCase();
      const noExt = nl.replace(/\.[^.]+$/, "");
      // استخراج شماره photo از الگوی photo_60@تاریخ
      const photoNumMatch = noExt.match(/^(photo_)(\d+)/);
      const photoNum = photoNumMatch ? photoNumMatch[2] : null;

      const found =
        // ۱. تطابق دقیق
        mainFiles.find(f => f.name === name) ||
        // ۲. تطابق بدون حساسیت به کوچک/بزرگ
        mainFiles.find(f => f.name.toLowerCase() === nl) ||
        // ۳. تطابق بدون پسوند
        mainFiles.find(f => f.name.toLowerCase().replace(/\.[^.]+$/, "") === noExt) ||
        // ۴. تطابق بر اساس شماره photo (photo_60@هر تاریخی)
        (photoNum ? mainFiles.find(f => {
          const fn = f.name.toLowerCase().replace(/\.[^.]+$/, "");
          const m = fn.match(/^photo_(\d+)/);
          return m && m[1] === photoNum;
        }) : undefined);

      if (found) addFile(found);
    }
  }

  if (sku) {
    const skuL = sku.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (skuL.length >= 3) {
      mainFiles.forEach(f => {
        const fnl = f.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (fnl.startsWith(skuL)) addFile(f);
      });
    }
  }
  return result;
}

function parsePrice(val: any): number {
  if (!val) return 0;
  let s = String(val).trim()
    // ارقام فارسی/عربی به انگلیسی
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1632))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632))
    // حذف کاما و فاصله
    .replace(/[,،٬\s]/g, "");
  // نقطه به عنوان جداکننده هزارگان فارسی (مثل 2.800.000)
  const dotCount = (s.match(/\./g) || []).length;
  if (dotCount > 1) {
    // چند نقطه → همه جداکننده هزارگان هستن
    s = s.replace(/\./g, "");
  } else if (dotCount === 1 && /\.\d{3}$/.test(s)) {
    // یه نقطه + دقیقاً ۳ رقم بعدش → جداکننده هزارگان (مثل 2.800)
    s = s.replace(".", "");
  }
  return Number(s) || 0;
}

function parseStock(val: any, fallback: number): number {
  if (val === undefined || val === null || val === "") return fallback;
  const s = String(val).trim();
  if (s.includes("ناموجود") || s.includes("اتمام") || s === "0") return 0;
  if (s.includes("موجود")) return fallback > 0 ? fallback : 10;
  const n = parsePrice(s);
  return n > 0 ? n : fallback;
}

function parseShippingType(val: any): "post" | "tipax" | "both" {
  if (!val) return "both";
  const s = String(val).trim().toLowerCase();
  if (s.includes("پست") || s === "post") return "post";
  if (s.includes("تیپاکس") || s.includes("tipax") || s.includes("پیک")) return "tipax";
  return "both";
}

const EMPTY_FORM = (): Partial<FullCatalogProduct> => ({
  title:"", sku:"", brand:"", category:"", warranty:"",
  price:0, discount_price:null, purchase_price:0, stock:10,
  is_available:true, image:"", images:[], description:"",
  shipping_type:"both",
});

export function AdminProducts(_props: any = {}) {
  const [products, setProducts]   = useState<FullCatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isTelegramImportOpen, setIsTelegramImportOpen] = useState(false);
    const [feedback, setFeedback]   = useState<{type:"success"|"error";text:string}|null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<FullCatalogProduct|null>(null);
  const [editForm, setEditForm]       = useState<Partial<FullCatalogProduct>>(EMPTY_FORM());
  const [editSaving, setEditSaving]   = useState(false);
  const [activeTab, setActiveTab]     = useState<"basic"|"images">("basic");
  // درصد سود برای محاسبه قیمت از روی قیمت خرید
  const [profitPctLocal, setProfitPctLocal] = useState<number>(25);

  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageDragOver, setImageDragOver]     = useState(false);
  const multiImgRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<FullCatalogProduct|null>(null);
  const [deleting, setDeleting]         = useState(false);

  const [bulkMode, setBulkMode]             = useState(false);
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting]     = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [renameOld, setRenameOld] = useState("");
  const [renameNew, setRenameNew] = useState("");
  const [renaming, setRenaming]   = useState(false);

  const [isImportOpen, setIsImportOpen]   = useState(false);
  const [importStep, setImportStep]       = useState<1|2|3>(1);
  const [importRows, setImportRows]       = useState<any[]>([]);
  const [importImages, setImportImages]   = useState<File[]>([]);
  const [importLogs, setImportLogs]       = useState<string[]>([]);
  const [importing, setImporting]         = useState(false);
  const [importSummary, setImportSummary] = useState<{success:number;updated:number;skipped:number;failed:number;details:{title:string;status:"new"|"update"|"skip"|"fail";reason?:string}[]}|null>(null);
  const [imagePreviewMap, setImagePreviewMap] = useState<Record<string,string>>({});
  const [globalStock, setGlobalStock]     = useState<number>(10);
  const [globalCategory, setGlobalCategory] = useState<string>("");
  const [profitMargin, setProfitMargin]   = useState<number>(25);
  const [importOnlyAvailable, setImportOnlyAvailable] = useState<boolean>(true);
  const [importSkipExisting, setImportSkipExisting]   = useState<boolean>(false);
  const [importShippingOverride, setImportShippingOverride] = useState<"auto"|"post"|"tipax"|"both">("auto");
  const [localColors, setLocalColors] = useState<{ name: string; hex: string }[]>([]);
  const [newColorHex, setNewColorHex] = useState<string>("#000000");
  const [newColorName, setNewColorName] = useState<string>("");
  const docInputRef    = useRef<HTMLInputElement>(null);
  const bulkImagesRef  = useRef<HTMLInputElement>(null);

  const notify = (text: string, type: "success"|"error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/products?t="+Date.now(), { cache:"no-store" });
      const json = await res.json();
      const list: FullCatalogProduct[] = (json.data || json.products || []).map((p: any) => ({
        ...p,
        price: Number(p.price||0),
        purchase_price: Number(p.purchase_price||0),
        stock: p.stock !== undefined ? Number(p.stock) : 10,
        is_available: p.is_available !== false,
        images: Array.isArray(p.images) ? p.images.filter(isRealUrl) : [],
        shipping_type: p.shipping_type || "both",
      }));
      setProducts(list);
      setCategories(Array.from(new Set<string>(list.map(x=>x.category).filter(Boolean))));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchCatalog();
    const ch = supabase.channel("rt-catalog")
      .on("postgres_changes",{event:"*",schema:"public",table:"products"},fetchCatalog)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchCatalog]);

  const filtered = products.filter(p => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  const openAdd  = () => { setEditingProd(null); setEditForm(EMPTY_FORM()); setActiveTab("basic"); setProfitPctLocal(25); setLocalColors([]); setIsModalOpen(true); };
  const openEdit = (p: FullCatalogProduct) => {
    setEditingProd(p);
    setEditForm({...p, images:[...(p.images||[])]});
    setActiveTab("basic");
    setLocalColors(Array.isArray(p.color_options) ? p.color_options : []);
    // محاسبه درصد سود از روی قیمت موجود
    if (p.purchase_price && p.purchase_price > 0 && p.price > 0) {
      setProfitPctLocal(Math.round(((p.price / p.purchase_price) - 1) * 100));
    } else {
      setProfitPctLocal(25);
    }
    setIsModalOpen(true);
  };

  // آپدیت قیمت وقتی درصد سود عوض میشه
  const handleProfitPctChange = (pct: number) => {
    setProfitPctLocal(pct);
    const pp = Number(editForm.purchase_price || 0);
    if (pp > 0) {
      setEditForm(f => ({ ...f, price: Math.round(pp * (1 + pct / 100)) }));
    }
  };

  // آپدیت قیمت وقتی قیمت خرید عوض میشه
  const handlePurchasePriceChange = (pp: number) => {
    setEditForm(f => ({ ...f, purchase_price: pp }));
    if (pp > 0 && profitPctLocal > 0) {
      setEditForm(f => ({ ...f, purchase_price: pp, price: Math.round(pp * (1 + profitPctLocal / 100)) }));
    }
  };

  const uploadImageFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!arr.length) return;
    setUploadingImages(true);
    const newUrls: string[] = [];
    for (const f of arr) {
      try {
        const fd = new FormData(); fd.append("file", f);
        const res = await fetch("/api/admin/upload-image", { method:"POST", body:fd });
        const j = await res.json();
        if (j.url) newUrls.push(j.url);
      } catch {}
    }
    setEditForm(prev => {
      const existing = (prev.images || []).filter(isRealUrl);
      const merged   = Array.from(new Set([...existing, ...newUrls]));
      const main     = prev.image && isRealUrl(prev.image) ? prev.image : (merged[0] || "");
      return { ...prev, image: main, images: merged };
    });
    setUploadingImages(false);
    notify(`✅ ${newUrls.length} تصویر آپلود شد.`);
  };

  const handleMultiImgInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadImageFiles(e.target.files);
    e.target.value = "";
  };

  const handleImgDrop = (e: React.DragEvent) => {
    e.preventDefault(); setImageDragOver(false);
    if (e.dataTransfer.files?.length) uploadImageFiles(e.dataTransfer.files);
  };

  const removeImage = (url: string) => {
    setEditForm(prev => {
      const imgs = (prev.images||[]).filter(u => u !== url);
      const main = prev.image === url ? (imgs[0]||"") : prev.image;
      return { ...prev, image: main, images: imgs };
    });
  };

  const setMainImage = (url: string) => setEditForm(prev => ({ ...prev, image: url }));

  const saveProduct = async () => {
    if (!editForm.title?.trim()) { notify("❌ عنوان محصول الزامی است.", "error"); return; }
    soundEngine.playClick(); setEditSaving(true);
    try {
      const payload = {
        ...editForm,
        id: editingProd?.id,
        price: Number(editForm.price||0),
        purchase_price: Number(editForm.purchase_price||0),
        discount_price: editForm.discount_price ? Number(editForm.discount_price) : null,
        stock: Number(editForm.stock||0),
        is_available: Number(editForm.stock||0) > 0,
        images: (editForm.images||[]).filter(isRealUrl),
        image: editForm.image && isRealUrl(editForm.image) ? editForm.image : ((editForm.images||[]).filter(isRealUrl)[0]||"/placeholder.png"),
        shipping_type: editForm.shipping_type || "both",
        color_options: localColors,
      };
      const res = await fetch("/api/products", {
        method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)
      });
      if (res.ok) {
        soundEngine.playSuccess();
        notify(editingProd ? "✅ محصول ذخیره شد." : "✅ محصول جدید اضافه شد.");
        setIsModalOpen(false); fetchCatalog();
      } else {
        const j = await res.json().catch(()=>({}));
        notify("❌ " + (j.message||"خطا در ذخیره"), "error");
      }
    } catch { notify("❌ خطای اتصال", "error"); }
    finally { setEditSaving(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const selectAll = () => setSelectedIds(new Set(filtered.map(p=>p.id)));
  const selectByCategory = (cat: string) => setSelectedIds(new Set(products.filter(p=>p.category===cat).map(p=>p.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const executeBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    soundEngine.playClick();
    setBulkDeleting(true); setBulkDeleteProgress(0);
    let done = 0;
    for (const id of ids) {
      try { await fetch(`/api/products?id=${id}`, { method: "DELETE" }); } catch {}
      done++;
      setBulkDeleteProgress(Math.round((done/ids.length)*100));
    }
    soundEngine.playSuccess();
    notify(`🗑️ ${ids.length} محصول حذف شد.`);
    setBulkDeleting(false); setBulkDeleteProgress(0);
    setIsBulkDeleteOpen(false); setBulkMode(false);
    setSelectedIds(new Set()); fetchCatalog();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    soundEngine.playClick(); setDeleting(true);
    try {
      const res = await fetch(`/api/products?id=${deleteTarget.id}`, { method:"DELETE" });
      if (res.ok) {
        soundEngine.playSuccess();
        notify(`🗑️ محصول "${deleteTarget.title}" حذف شد.`);
        setDeleteTarget(null); fetchCatalog();
      } else {
        const j = await res.json().catch(()=>({}));
        notify("❌ " + (j.message||"خطا در حذف"), "error");
      }
    } catch { notify("❌ خطای اتصال", "error"); }
    finally { setDeleting(false); }
  };

  const handleRenameCategory = async () => {
    if (!renameOld || !renameNew.trim()) return;
    soundEngine.playClick(); setRenaming(true);
    try {
      const res = await fetch("/api/admin/categories/rename", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ oldName:renameOld, newName:renameNew }),
      });
      const j = await res.json();
      if (j.success) {
        soundEngine.playSuccess(); notify("✓ نام دسته‌بندی تغییر کرد.");
        setIsCatModalOpen(false); fetchCatalog(); setRenameOld(""); setRenameNew("");
      } else alert(j.message);
    } catch { alert("خطای سرور."); }
    finally { setRenaming(false); }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setImportLogs(["⏳ در حال خواندن فایل..."]); setImportSummary(null);
      const name = file.name.toLowerCase();
      let json: any[] = [];

      if (name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".doc")) {
        // ارسال به API سرور‌ساید برای پارس PDF / Word
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/admin/parse-document", { method: "POST", body: fd });
        const result = await res.json();
        if (!res.ok) { notify("❌ " + (result.error || "خطا در پارس فایل"), "error"); e.target.value = ""; return; }
        if (result.warning) { setImportLogs([result.warning]); }
        json = result.rows || [];
      } else {
        // XLSX / CSV — پارس کلاینت‌ساید
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type:"array" });
        json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      }

      const mult = 1 + profitMargin/100;
      const parsed = (json as any[]).map(row => {
        const drop = parsePrice(fuzzyGet(row,"drop_price"));
        const disc = parsePrice(fuzzyGet(row,"discount_price"));
        return {
          title:         String(fuzzyGet(row,"title")||"بدون عنوان").trim(),
          sku:           String(fuzzyGet(row,"sku")||"").trim(),
          purchase_price:drop,
          price:         disc > 0 ? disc : Math.round(drop * mult),
          category:      String(fuzzyGet(row,"category")||globalCategory||"عمومی").trim(),
          photo:         String(fuzzyGet(row,"photo")||"").trim()||null,
          description:   String(fuzzyGet(row,"description")||"").trim(),
          stock:         parseStock(fuzzyGet(row,"stock"), globalStock),
          brand:         String(fuzzyGet(row,"brand")||"متفرقه").trim(),
          warranty:      String(fuzzyGet(row,"warranty")||"").trim(),
          shipping_type: parseShippingType(fuzzyGet(row,"shipping_type")),
        };
      }).filter((r:any) => r.title && r.title !== "بدون عنوان");
      // اعمال override نوع ارسال اگر ادمین انتخاب کرده باشه
      const withShipping = importShippingOverride !== "auto"
        ? parsed.map((r:any) => ({ ...r, shipping_type: importShippingOverride }))
        : parsed;
      const afterAvail = importOnlyAvailable ? withShipping.filter((r:any) => r.stock > 0) : withShipping;
      const skippedAvail = parsed.length - afterAvail.length;
      setImportRows(afterAvail);
      setImportLogs(["✅ فایل خوانده شد. "+afterAvail.length+" محصول"+(skippedAvail>0?" (⏭️ "+skippedAvail+" ناموجود حذف شد)":"")]);
      setImportStep(2);
    } catch { notify("❌ خطا در پردازش فایل.", "error"); }
    e.target.value = "";
  };

  const handleSmartImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files||[]);
    setImportImages(files);
    const prev: Record<string,string> = {};
    files.forEach(f => { prev[f.name] = URL.createObjectURL(f); });
    setImagePreviewMap(prev);
    let matchCount = 0;
    importRows.forEach(r => { const m = fuzzyMatchImages(files, r.photo, r.sku||""); if (m.length > 0) matchCount++; });
    setImportLogs(p => [`📸 ${files.length} فایل انتخاب شد — ${matchCount} از ${importRows.length} محصول تصویر پیدا کرد.`, ...p]);
  };

  const executeBulkImport = async () => {
    soundEngine.playClick(); setImporting(true); setImportStep(3);
    let sc=0, uc=0, skc=0, fc=0;
    const details: {title:string;status:"new"|"update"|"skip"|"fail";reason?:string}[] = [];
    for (let i=0; i<importRows.length; i++) {
      const row = importRows[i];
      try {
        const ex = products.find(p=>(row.sku && p.sku===row.sku)||p.title.trim().toLowerCase()===row.title.trim().toLowerCase());
        // اگر skip-existing فعاله و محصول وجود داشت، رد کن
        if (importSkipExisting && ex) {
          skc++;
          details.push({title:row.title, status:"skip"});
          setImportLogs(p => [`⏭️ [${i+1}/${importRows.length}] skip: ${row.title}`, ...p.slice(0,29)]);
          continue;
        }
        const matchedFiles = fuzzyMatchImages(importImages, row.photo, row.sku||"");
        const imgCount = matchedFiles.length;
        setImportLogs(p => [`⏳ [${i+1}/${importRows.length}] ${row.title} ${imgCount>0?"(📸 "+imgCount+" عکس)":"(بدون عکس)"}`, ...p.slice(0,29)]);
        const uploadedUrls: string[] = [];
        for (const mf of matchedFiles) {
          try {
            const fd=new FormData(); fd.append("file",mf);
            const r=await fetch("/api/admin/upload-image",{method:"POST",body:fd});
            const j=await r.json(); if(j.url) uploadedUrls.push(j.url);
          } catch {}
        }
        let imgUrl = uploadedUrls[0] || ex?.image || "/placeholder.png";
        const allImages = uploadedUrls.length > 0 ? uploadedUrls : (ex?.images?.filter(isRealUrl) || [imgUrl]);
        const payload:any = {
          id:ex?.id, title:row.title, category:row.category||ex?.category||"عمومی",
          price:row.price, purchase_price:row.purchase_price, stock:row.stock,
          is_available:row.stock>0,
          image:imgUrl, image_url:imgUrl,
          images: allImages,
          description:row.description||ex?.description||"",
          brand:row.brand||ex?.brand||"متفرقه",
          sku:row.sku||ex?.sku||"",
          warranty:row.warranty||ex?.warranty||"",
          shipping_type:row.shipping_type||ex?.shipping_type||"both",
        };
        const res=await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        if (res.ok) { ex?(uc++,details.push({title:row.title,status:"update"})):(sc++,details.push({title:row.title,status:"new"})); }
        else { const j=await res.json().catch(()=>({})); fc++; details.push({title:row.title,status:"fail",reason:j.message||`HTTP ${res.status}`}); }
      } catch(e) { const err = e as any; fc++; details.push({title:row.title,status:"fail",reason:err?.message||"خطای ناشناخته"}); }
    }
    soundEngine.playSuccess();
    setImportSummary({success:sc,updated:uc,skipped:skc,failed:fc,details});
    setImportLogs(p=>[`🎉 پایان: ${sc} جدید، ${uc} آپدیت، ${skc} skip، ${fc} خطا`,...p]);
    setImporting(false); fetchCatalog();
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">

      {/* هدر */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-4">
        <div>
          <h1 className="text-base sm:text-sm md:text-xl font-black text-[var(--accent-blue)]">🛍️ مدیریت کاتالوگ محصولات</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{products.length} محصول ثبت شده</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button type="button" onClick={() => setIsCatModalOpen(true)}
            className="px-4 py-3 rounded-2xl bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/30 text-xs">
            ✏️ ویرایش نام دسته‌ها
          </button>
          <button type="button" onClick={() => { setIsImportOpen(true); setImportStep(1); setImportRows([]); setImportImages([]); setImportLogs([]); setImportSummary(null); setImagePreviewMap({}); }}
            className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-lg flex gap-2">
            <span>📥</span> ایمپورت اکسل
          </button>
            <button type="button" onClick={() => setIsTelegramImportOpen(true)} className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black shadow-md transition flex items-center gap-2">🤖 ایمپورت تلگرامی</button>
          <button type="button" onClick={openAdd}
            className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg flex gap-2">
            <span>➕</span> افزودن محصول
          </button>
          <button type="button" onClick={() => { setBulkMode(m=>!m); clearSelection(); }}
            className={`px-4 py-3 rounded-2xl font-black text-xs border flex gap-2 transition-colors ${bulkMode?"bg-rose-500 text-white border-rose-600":"bg-rose-500/10 text-rose-500 border-rose-500/30"}`}>
            <span>🗑️</span> {bulkMode ? "خروج از حذف گروهی" : "حذف گروهی"}
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${feedback.type==="success"?"bg-emerald-500/15 text-emerald-500":"bg-rose-500/15 text-rose-500"}`}>
          {feedback.text}
        </div>
      )}

      {/* جستجو و فیلتر */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] grid grid-cols-2 gap-3 text-xs">
        <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
          placeholder="🔍 جستجو در عنوان، برند، SKU..."
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" />
        <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}
          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold">
          <option value="all">📁 همه دسته‌ها</option>
          {categories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {bulkMode && (
        <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs" dir="rtl">
          <span className="font-black text-rose-500">🗑️ حالت حذف گروهی فعال — {selectedIds.size} محصول انتخاب شده</span>
          <div className="flex flex-wrap gap-2 sm:mr-auto">
            <button type="button" onClick={selectAll} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 font-bold hover:bg-rose-500/25 transition-colors">
              انتخاب همه ({filtered.length})
            </button>
            {categories.map(cat=>(
              <button key={cat} type="button" onClick={()=>selectByCategory(cat)}
                className="px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold hover:border-rose-500/40 transition-colors">
                {cat} ({products.filter(p=>p.category===cat).length})
              </button>
            ))}
            <button type="button" onClick={clearSelection} className="px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold hover:border-rose-500/40 transition-colors">
              لغو انتخاب
            </button>
          </div>
          {selectedIds.size > 0 && (
            <button type="button" onClick={()=>setIsBulkDeleteOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-black shadow-lg hover:bg-rose-700 transition-colors">
              🗑️ حذف {selectedIds.size} محصول
            </button>
          )}
        </div>
      )}

      {/* کارت‌های محصولات */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400 font-bold">⏳ در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="text-4xl">{searchQuery?"🔍":"📭"}</div>
            <p className="text-slate-400 font-bold">{searchQuery?"نتیجه‌ای یافت نشد.":"هنوز محصولی ثبت نشده."}</p>
            {!searchQuery && (
              <button type="button" onClick={openAdd} className="mx-auto flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg">
                ➕ اولین محصول را اضافه کنید
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-4">
            {filtered.slice(0,60).map(p=>(
              <div key={p.id}
                onClick={()=>bulkMode&&toggleSelect(p.id)}
                className={`p-4 rounded-2xl bg-[var(--input-bg)] border flex flex-col gap-3 transition-colors ${
                  bulkMode
                    ? selectedIds.has(p.id) ? "border-rose-500 bg-rose-500/5 cursor-pointer" : "border-[var(--card-border)] hover:border-rose-400/40 cursor-pointer"
                    : "border-[var(--card-border)] hover:border-[var(--accent-blue)]/40"
                }`}>
                {bulkMode && (
                  <div className="flex items-center gap-2 pb-1 border-b border-[var(--card-border)]">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${selectedIds.has(p.id)?"bg-rose-500 border-rose-500":"border-[var(--card-border)]"}`}>
                      {selectedIds.has(p.id)&&<span className="text-white text-[10px] font-black">✓</span>}
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] truncate">{p.title}</span>
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <img src={p.image||"/placeholder.png"} className="w-16 h-16 rounded-2xl object-contain border bg-white p-1" alt={p.title} />
                    {(p.images||[]).filter(isRealUrl).length > 1 && (
                      <div className="flex gap-1 mt-1">
                        {(p.images||[]).filter(isRealUrl).slice(1,4).map((u,i)=>(
                          <img key={i} src={u} className="w-4 h-4 rounded object-contain border bg-white" alt="" />
                        ))}
                        {(p.images||[]).filter(isRealUrl).length > 4 && (
                          <span className="text-[9px] text-[var(--text-secondary)] self-center">+{(p.images||[]).filter(isRealUrl).length-4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <span className="text-[10px] text-[var(--accent-blue)] font-bold">{p.category}</span>
                    <h3 className="font-black text-xs line-clamp-2">{p.title}</h3>
                    {p.brand && p.brand!=="متفرقه" && <span className="text-[10px] text-[var(--text-secondary)]">{p.brand}</span>}
                    <div className="font-mono text-emerald-500 font-bold">{p.price.toLocaleString("fa-IR")} تومان</div>
                    {p.shipping_type && p.shipping_type !== "both" && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${p.shipping_type==="post"?"bg-blue-500/15 text-blue-500":"bg-amber-500/15 text-amber-500"}`}>
                        {p.shipping_type==="post"?"📮 پست":"🚚 تیپاکس"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[var(--card-border)]">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${p.is_available&&p.stock>0?"bg-emerald-500/15 text-emerald-500":"bg-rose-500/15 text-rose-500"}`}>
                    {p.is_available&&p.stock>0?`موجود (${p.stock})`:"ناموجود"}
                  </span>
                  {!bulkMode && (
                    <div className="flex gap-2">
                      <button type="button" onClick={()=>openEdit(p)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-bold text-[10px] hover:bg-[var(--accent-blue)]/20 transition-colors">
                        ✏️ ویرایش
                      </button>
                      <button type="button" onClick={()=>setDeleteTarget(p)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 font-bold text-[10px] hover:bg-rose-500/20 transition-colors">
                        🗑️ حذف
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {filtered.length>60&&(
          <p className="text-center text-xs text-[var(--text-secondary)] mt-4 font-bold">
            نمایش ۶۰ مورد از {filtered.length}. برای مشاهده بیشتر جستجو کنید.
          </p>
        )}
      </div>

      {/* ══════ مودال افزودن/ویرایش محصول ══════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 animate-fadeIn"
          onClick={e=>{if(e.target===e.currentTarget&&!editSaving)setIsModalOpen(false);}}>
          <div className="w-full max-w-2xl max-h-[94vh] overflow-y-auto bg-[var(--modal-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] flex flex-col" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)] sticky top-0 bg-[var(--modal-bg)] z-10 rounded-t-3xl">
              <h2 className="font-black text-sm text-[var(--accent-blue)]">
                {editingProd?"✏️ ویرایش محصول":"➕ افزودن محصول جدید"}
              </h2>
              {!editSaving&&<button type="button" onClick={()=>setIsModalOpen(false)} className="p-2 rounded-xl bg-[var(--input-bg)] font-black">✕</button>}
            </div>
            <div className="flex border-b border-[var(--card-border)] px-5 sticky top-[61px] bg-[var(--modal-bg)] z-10">
              {(["basic","images"] as const).map(tab=>(
                <button key={tab} type="button" onClick={()=>setActiveTab(tab)}
                  className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab===tab?"border-[var(--accent-blue)] text-[var(--accent-blue)]":"border-transparent text-[var(--text-secondary)]"}`}>
                  {tab==="basic"?"📋 اطلاعات پایه":"🖼️ تصاویر"}
                </button>
              ))}
            </div>
            <div className="p-5 space-y-4 flex-1 text-xs">
              {activeTab==="basic"&&(
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:grid-cols-2 gap-2 md:gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">عنوان محصول *</label>
                    <input type="text" value={editForm.title||""} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">برند</label>
                    <input type="text" value={editForm.brand||""} onChange={e=>setEditForm(f=>({...f,brand:e.target.value}))}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">SKU / کد محصول</label>
                    <input type="text" value={editForm.sku||""} onChange={e=>setEditForm(f=>({...f,sku:e.target.value}))}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">دسته‌بندی *</label>
                    <input type="text" list="modal-cats" value={editForm.category||""} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold" />
                    <datalist id="modal-cats">{categories.map(c=><option key={c} value={c}/>)}</datalist>
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">گارانتی</label>
                    <input type="text" value={editForm.warranty||""} onChange={e=>setEditForm(f=>({...f,warranty:e.target.value}))}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none" />
                  </div>
                  {/* نوع ارسال */}
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">نوع ارسال</label>
                    <select value={editForm.shipping_type||"both"} onChange={e=>setEditForm(f=>({...f,shipping_type:e.target.value as any}))}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold cursor-pointer">
                      <option value="both">📦 هر دو (پست و تیپاکس)</option>
                      <option value="post">📮 فقط پست پیشتاز</option>
                      <option value="tipax">🚚 فقط تیپاکس</option>
                    </select>
                  </div>
                  {/* قیمت خرید */}
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">قیمت خرید (تومان)</label>
                    <input type="number" value={editForm.purchase_price||0}
                      onChange={e=>handlePurchasePriceChange(Number(e.target.value))}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" />
                  </div>
                  {/* درصد سود */}
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">درصد سود (٪) — قیمت فروش را محاسبه می‌کند</label>
                    <div className="relative">
                      <input type="number" min={0} max={500} value={profitPctLocal}
                        onChange={e=>handleProfitPctChange(Number(e.target.value))}
                        className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono pl-8" />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">٪</span>
                    </div>
                  </div>
                  {/* قیمت فروش */}
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">قیمت فروش (تومان) *</label>
                    <input type="number" value={editForm.price||0} onChange={e=>setEditForm(f=>({...f,price:Number(e.target.value)}))}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" />
                  </div>
                  {/* قیمت تخفیف */}
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">قیمت تخفیف‌خورده (اختیاری)</label>
                    <input type="number" value={editForm.discount_price||""} onChange={e=>setEditForm(f=>({...f,discount_price:e.target.value?Number(e.target.value):null}))}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" />
                  </div>
                  {/* موجودی */}
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">موجودی</label>
                    <input type="number" min={0} value={editForm.stock||0} onChange={e=>setEditForm(f=>({...f,stock:Number(e.target.value),is_available:Number(e.target.value)>0}))}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" />
                  </div>

              {/* ══ color_options_admin_section ══ */}
              <div className="md:col-span-2 space-y-3">
                <label className="block text-xs font-black text-[var(--text-secondary)]">🎨 رنگ‌های موجود محصول</label>

                {/* نمایش رنگ‌های اضافه‌شده */}
                {Array.isArray(localColors) && localColors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {localColors.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--card-border)] bg-[var(--input-bg)] text-xs font-bold">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = localColors.filter((_, i) => i !== idx);
                            setLocalColors(updated);
                          }}
                          className="text-rose-400 hover:text-rose-600 font-black ml-0.5 leading-none text-sm"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* افزودن رنگ جدید */}
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={e => setNewColorHex(e.target.value)}
                    className="w-10 h-9 rounded-xl border border-[var(--card-border)] cursor-pointer p-0.5 bg-[var(--input-bg)] flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={newColorName}
                    onChange={e => setNewColorName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newColorName.trim()) {
                          setLocalColors(prev => [...prev, { hex: newColorHex, name: newColorName.trim() }]);
                          setNewColorName("");
                        }
                      }
                    }}
                    placeholder="نام رنگ (مثلاً: مشکی)"
                    className="flex-1 min-w-[120px] px-3 py-2 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newColorName.trim()) return;
                      setLocalColors(prev => [...prev, { hex: newColorHex, name: newColorName.trim() }]);
                      setNewColorName("");
                    }}
                    className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 flex-shrink-0"
                  >+ افزودن رنگ</button>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  ایمپورت Excel: ستون <code className="bg-black/10 px-1 rounded">Color_Options</code> — فرمت: <code className="bg-black/10 px-1 rounded">#HEX:نام,#HEX:نام</code> — مثال: <code className="bg-black/10 px-1 rounded">#000000:مشکی,#FFFFFF:سفید</code>
                </p>
              </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">توضیحات</label>
                    <textarea rows={4} value={editForm.description||""} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none resize-none" />
                  </div>
                </div>
              )}
              {activeTab==="images"&&(
                <div className="space-y-5">
                  <div onDragOver={e=>{e.preventDefault();setImageDragOver(true);}}
                    onDragLeave={()=>setImageDragOver(false)}
                    onDrop={handleImgDrop}
                    onClick={()=>multiImgRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-colors ${imageDragOver?"border-[var(--accent-blue)] bg-[var(--accent-blue)]/5":"border-[var(--card-border)] hover:border-[var(--accent-blue)]/50"}`}>
                    <input ref={multiImgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMultiImgInput} />
                    {uploadingImages?(
                      <div className="space-y-2"><div className="text-2xl animate-spin">⏳</div><p className="font-bold text-[var(--text-secondary)]">در حال آپلود...</p></div>
                    ):(
                      <div className="space-y-2"><div className="text-3xl">🖼️</div><p className="font-bold text-[var(--text-secondary)]">کلیک کنید یا تصاویر را اینجا بکشید</p></div>
                    )}
                  </div>
                  {(editForm.images||[]).filter(isRealUrl).length > 0 && (
                    <div className="space-y-2">
                      <p className="font-bold text-[var(--text-secondary)]">تصاویر ({(editForm.images||[]).filter(isRealUrl).length} عدد) — تصویر اصلی را انتخاب کنید:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {(editForm.images||[]).filter(isRealUrl).map((url,i)=>(
                          <div key={i} className="relative group">
                            <img src={url}
                              className={`w-full aspect-square object-contain rounded-2xl border-2 bg-white p-1 cursor-pointer transition-all ${editForm.image===url?"border-[var(--accent-blue)] shadow-lg scale-[1.02]":"border-[var(--card-border)] hover:border-[var(--accent-blue)]/50"}`}
                              onClick={()=>setMainImage(url)} alt={`img-${i}`} />
                            {editForm.image===url&&<span className="absolute top-1 right-1 bg-[var(--accent-blue)] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">اصلی</span>}
                            <button type="button" onClick={()=>removeImage(url)}
                              className="absolute top-1 left-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">یا URL تصویر را وارد کنید:</label>
                    <div className="flex gap-2">
                      <input type="text" id="manual-img-url" placeholder="https://..."
                        className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-[10px]" />
                      <button type="button" onClick={()=>{
                        const inp = document.getElementById("manual-img-url") as HTMLInputElement;
                        const url = inp?.value?.trim();
                        if (url && isRealUrl(url)) {
                          setEditForm(f=>({...f, images:Array.from(new Set([...(f.images||[]),url])), image:f.image&&isRealUrl(f.image)?f.image:url}));
                          inp.value="";
                        }
                      }} className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs whitespace-nowrap">
                        افزودن
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-[var(--card-border)] sticky bottom-0 bg-[var(--modal-bg)] rounded-b-3xl">
              <button type="button" onClick={()=>setIsModalOpen(false)} disabled={editSaving}
                className="flex-1 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs disabled:opacity-50">انصراف</button>
              <button type="button" onClick={saveProduct} disabled={editSaving||uploadingImages}
                className="flex-1 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg disabled:opacity-50">
                {editSaving?"⏳ در حال ذخیره...":editingProd?"💾 ذخیره تغییرات":"✅ افزودن محصول"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* حذف گروهی */}
      {isBulkDeleteOpen&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn"
          onClick={e=>{if(e.target===e.currentTarget&&!bulkDeleting)setIsBulkDeleteOpen(false);}}>
          <div className="w-full max-w-sm bg-[var(--modal-bg)] rounded-3xl p-6 shadow-2xl border border-rose-500/30 space-y-5" dir="rtl">
            <div className="text-center">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="font-black text-sm text-rose-500">حذف دسته‌جمعی</h3>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
              <div className="text-3xl font-black text-rose-500">{selectedIds.size}</div>
              <div className="text-xs font-bold text-rose-400">محصول انتخاب شده برای حذف</div>
            </div>
            {bulkDeleting && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-[var(--text-secondary)]"><span>در حال حذف...</span><span>{bulkDeleteProgress}٪</span></div>
                <div className="w-full bg-[var(--input-bg)] rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-500 h-2 rounded-full transition-all" style={{width:`${bulkDeleteProgress}%`}}/>
                </div>
              </div>
            )}
            {!bulkDeleting && (
              <div className="flex gap-3">
                <button type="button" onClick={()=>setIsBulkDeleteOpen(false)} className="flex-1 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs">انصراف</button>
                <button type="button" onClick={executeBulkDelete} className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-black text-xs shadow-lg">✅ بله، همه حذف شوند</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* حذف تکی */}
      {deleteTarget&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn"
          onClick={e=>{if(e.target===e.currentTarget&&!deleting)setDeleteTarget(null);}}>
          <div className="w-full max-w-sm bg-[var(--modal-bg)] rounded-3xl p-6 shadow-2xl border border-rose-500/30 space-y-5" dir="rtl">
            <div className="text-center"><div className="text-5xl mb-3">🗑️</div><h3 className="font-black text-sm text-rose-500">حذف محصول</h3></div>
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="font-black text-xs text-rose-500">{deleteTarget.title}</span>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={()=>setDeleteTarget(null)} disabled={deleting} className="flex-1 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs">انصراف</button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-black text-xs shadow-lg disabled:opacity-50">
                {deleting?"⏳ حذف...":"✅ بله، حذف شود"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* تغییر نام دسته‌بندی */}
      {isCatModalOpen&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn" onClick={()=>setIsCatModalOpen(false)}>
          <div className="w-full max-w-md bg-[var(--modal-bg)] rounded-3xl p-6 shadow-2xl space-y-5 border border-[var(--card-border)]" onClick={e=>e.stopPropagation()} dir="rtl">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">✏️ ویرایش دسته‌بندی‌ها</h3>
            <div>
              <label className="block text-xs font-bold mb-1.5">دسته فعلی:</label>
              <select value={renameOld} onChange={e=>setRenameOld(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold">
                <option value="">انتخاب...</option>
                {categories.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">نام جدید:</label>
              <input type="text" value={renameNew} onChange={e=>setRenameNew(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={()=>setIsCatModalOpen(false)} className="flex-1 px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs">انصراف</button>
              <button type="button" disabled={renaming||!renameOld||!renameNew} onClick={handleRenameCategory} className="flex-1 px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg disabled:opacity-50">
                {renaming?"در حال انتقال...":"تغییر نام"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ مودال ایمپورت هوشمند ══════ */}
      {isImportOpen&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 animate-fadeIn"
          onClick={e=>{if(e.target===e.currentTarget&&!importing)setIsImportOpen(false);}}>
          <div className="w-full max-w-4xl max-h-[96vh] overflow-y-auto bg-[var(--modal-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] flex flex-col" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)] sticky top-0 bg-[var(--modal-bg)] z-10 rounded-t-3xl">
              <h2 className="font-black text-sm text-emerald-500">📥 سیستم هوشمند ایمپورت گروهی</h2>
              {!importing&&<button type="button" onClick={()=>setIsImportOpen(false)} className="p-2 rounded-xl bg-[var(--input-bg)] font-black cursor-pointer">✕</button>}
            </div>
            <div className="p-6 space-y-6 text-xs flex-1">

              {/* گام ۱ */}
              <div className={`p-5 rounded-3xl border transition ${importStep===1?"bg-[var(--accent-blue)]/5 border-[var(--accent-blue)]":"bg-[var(--input-bg)] border-[var(--card-border)] opacity-60"}`}>
                <h3 className="font-black text-sm mb-4">گام اول: تنظیمات و آپلود فایل</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:grid-cols-3 gap-2 md:gap-4 mb-5">
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">موجودی پیش‌فرض:</label>
                    <input type="number" min={0} value={globalStock} onChange={e=>setGlobalStock(Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-[var(--input-bg)] border outline-none font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">درصد سود (+مالیات):</label>
                    <div className="relative">
                      <input type="number" min={0} max={200} value={profitMargin} onChange={e=>setProfitMargin(Number(e.target.value))}
                        className="w-full p-3 rounded-xl bg-[var(--input-bg)] border outline-none font-mono font-bold pl-8" />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">٪</span>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">دسته‌بندی کلی (اختیاری):</label>
                    <input type="text" value={globalCategory} onChange={e=>setGlobalCategory(e.target.value)} placeholder="مثال: لوازم جانبی"
                      className="w-full p-3 rounded-xl bg-[var(--input-bg)] border outline-none font-bold" />
                  </div>
                </div>

                {/* ══ انتخاب نوع ارسال برای همه محصولات ══ */}
                <div className="mb-5 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  <label className="block font-black text-xs mb-2 text-[var(--text-secondary)]">🚚 نوع ارسال (برای همه محصولات این فایل):</label>
                  <select
                    value={importShippingOverride}
                    onChange={e => setImportShippingOverride(e.target.value as any)}
                    className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-bold text-xs cursor-pointer"
                  >
                    <option value="auto">📋 خودکار — از ستون نوع ارسال فایل بخوان</option>
                    <option value="post">📮 پست — همه محصولات فقط پست</option>
                    <option value="tipax">🚚 تیپاکس (پس‌کرایه) — همه محصولات فقط تیپاکس</option>
                    <option value="both">📦 هر دو روش — مشتری انتخاب کند</option>
                  </select>
                  {importShippingOverride !== "auto" && (
                    <p className="mt-1.5 text-[10px] text-amber-500 font-bold">
                      ⚠️ این انتخاب، ستون نوع ارسال فایل را نادیده می‌گیرد و برای همه محصولات اعمال می‌شود.
                    </p>
                  )}
                </div>

                {/* toggle فقط موجود — کل ردیف کلیکپذیره */}
                <div role="button" tabIndex={0}
                  onClick={()=>setImportOnlyAvailable(v=>!v)}
                  onKeyDown={e=>(e.key===" "||e.key==="Enter")&&setImportOnlyAvailable(v=>!v)}
                  className="flex items-center gap-3 cursor-pointer select-none mb-3 group">
                  <div className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 ${importOnlyAvailable?"bg-emerald-500":"bg-slate-300 dark:bg-slate-600"}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${importOnlyAvailable?"translate-x-5":"translate-x-0"}`}/>
                  </div>
                  <span className="font-bold text-xs group-hover:text-[var(--accent-blue)] transition-colors">
                    فقط محصولات موجود را وارد کن
                    <span className="text-[var(--text-secondary)] font-normal"> (ناموجودها skip می‌شن)</span>
                  </span>
                </div>

                {/* toggle skip تکراری — کل ردیف کلیکپذیره */}
                <div role="button" tabIndex={0}
                  onClick={()=>setImportSkipExisting(v=>!v)}
                  onKeyDown={e=>(e.key===" "||e.key==="Enter")&&setImportSkipExisting(v=>!v)}
                  className="flex items-center gap-3 cursor-pointer select-none mb-5 group">
                  <div className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 ${importSkipExisting?"bg-amber-500":"bg-slate-300 dark:bg-slate-600"}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${importSkipExisting?"translate-x-5":"translate-x-0"}`}/>
                  </div>
                  <span className="font-bold text-xs group-hover:text-[var(--accent-blue)] transition-colors">
                    اگر محصول از قبل در سایت هست، skip کن
                    <span className="text-[var(--text-secondary)] font-normal"> (محصولات تکراری آپدیت نمی‌شن)</span>
                  </span>
                </div>

                <button type="button" onClick={()=>docInputRef.current?.click()} disabled={importStep!==1}
                  className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shadow-lg disabled:opacity-50">
                  📁 انتخاب فایل (Excel/CSV/PDF/Word)
                </button>
                <input ref={docInputRef} type="file" accept=".xlsx,.xls,.csv,.pdf,.doc,.docx" className="hidden" onChange={handleDocumentUpload} />
                <p className="mt-3 text-[10px] text-[var(--text-secondary)]">فرمت‌های پشتیبانی‌شده: Excel ، CSV ، PDF ، Word — ستون‌ها: نام محصول · قیمت دراپ · دسته بندی · برند · Photo_Filename · Telegram_Description · موجودی · نوع ارسال · Color_Options</p>
              </div>

              {/* Dry-Run */}
              {importRows.length>0&&importStep>=2&&(
                <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-sm text-[var(--accent-blue)]">پیش‌نمایش (Dry-Run)</h3>
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-500 rounded-lg font-bold">{importRows.length} محصول</span>
                  </div>
                  <div className="overflow-x-auto max-h-56 border border-[var(--card-border)] rounded-2xl">
                    <table className="w-full text-right min-w-[580px]">
                      <thead className="bg-[var(--input-bg)] text-[var(--text-secondary)] sticky top-0 text-[10px]">
                        <tr>
                          <th className="p-2">تصویر</th>
                          <th className="p-2">عنوان</th>
                          <th className="p-2">دسته</th>
                          <th className="p-2">موجودی</th>
                          <th className="p-2">قیمت نهایی</th>
                          <th className="p-2">ارسال</th>
                          <th className="p-2">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--card-border)] font-bold text-[10px]">
                        {importRows.map((r,idx)=>{
                          const ex=products.find(p=>(r.sku&&p.sku===r.sku)||p.title.trim().toLowerCase()===r.title.trim().toLowerCase());
                          const willSkip = importSkipExisting && ex;
                          return (
                            <tr key={idx} className={willSkip?"opacity-40":ex?"bg-amber-500/5":""}>
                              <td className="p-2">
                                {imagePreviewMap[r.photo]
                                  ?<img src={imagePreviewMap[r.photo]} className="w-10 h-10 rounded-lg object-contain border bg-white" alt=""/>
                                  :<span className="text-[9px] text-[var(--text-secondary)]">{r.photo||"—"}</span>}
                              </td>
                              <td className="p-2 truncate max-w-[150px]">{r.title}</td>
                              <td className="p-2 text-[var(--text-secondary)]">{r.category}</td>
                              <td className="p-2 text-indigo-500">{r.stock}</td>
                              <td className="p-2 font-mono text-emerald-500">{r.price.toLocaleString("fa-IR")}</td>
                              <td className="p-2 text-[var(--text-secondary)]">{r.shipping_type==="post"?"📮 پست":r.shipping_type==="tipax"?"🚚 تیپاکس":"📦 هر دو"}</td>
                              <td className="p-2">
                                {/* هشدار: توضیحات با عنوان تناقض داره */}
                                {(()=>{
                                  if (!r.description || !r.title) return null;
                                  const titleWords = r.title.split(/\s+/).filter((w:string)=>w.length>2).slice(0,3);
                                  const descLower = r.description.toLowerCase();
                                  const titleLower = r.title.toLowerCase();
                                  const hasMatch = titleWords.some((w:string)=>descLower.includes(w.toLowerCase()));
                                  if (!hasMatch && r.description.length > 30)
                                    return <span title="توضیحات با عنوان محصول مطابقت ندارد — احتمالاً خطای داده در فایل اکسل" className="text-orange-500 text-[11px] cursor-help">⚠️</span>;
                                  return null;
                                })()}
                              </td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${willSkip?"bg-slate-500/15 text-slate-500":ex?"bg-amber-500/15 text-amber-500":"bg-emerald-500/15 text-emerald-500"}`}>
                                  {willSkip?"⏭️ skip":ex?"📝 آپدیت":"🆕 جدید"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* گام ۲ */}
              <div className={`p-5 rounded-3xl border transition ${importStep===2?"bg-emerald-500/5 border-emerald-500":"bg-[var(--input-bg)] border-[var(--card-border)] opacity-60"}`}>
                <h3 className="font-black text-sm mb-3">گام دوم: انتخاب تصاویر</h3>
                <div className="flex items-center gap-2 md:gap-4">
                  <button type="button" onClick={()=>bulkImagesRef.current?.click()} disabled={importStep!==2}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black cursor-pointer shadow-lg disabled:opacity-50">
                    🖼️ انتخاب تصاویر محصولات
                  </button>
                  <input ref={bulkImagesRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSmartImageSelection} />
                  {importImages.length>0&&<span className="text-emerald-500 font-bold">{importImages.length} تصویر ✅</span>}
                </div>
                {importImages.length>0&&(
                  <div className="mt-4 flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                    {importImages.slice(0,24).map(f=>(
                      <img key={f.name} src={URL.createObjectURL(f)} className="w-12 h-12 rounded-xl object-contain border bg-white" title={f.name} alt={f.name}/>
                    ))}
                    {importImages.length>24&&<span className="text-[10px] text-[var(--text-secondary)] self-center">+{importImages.length-24} دیگر</span>}
                  </div>
                )}
              </div>

              {/* لاگ */}
              {importLogs.length>0&&(
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-sky-500/30 max-h-48 overflow-y-auto space-y-1.5 font-mono">
                  {importLogs.map((log,i)=>(
                    <div key={i} className={`text-[10px] ${log.includes("❌")||log.includes("خطا")?"text-rose-500":log.includes("آپدیت")?"text-amber-400":log.includes("skip")?"text-slate-400":"text-emerald-500"}`}>{log}</div>
                  ))}
                </div>
              )}

              {/* گزارش نهایی */}
              {importSummary&&(
                <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-emerald-500/30 space-y-4">
                  <h3 className="font-black text-sm text-emerald-500">📊 گزارش کامل ایمپورت</h3>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-2xl font-black text-emerald-500">{importSummary.success}</div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-1">🆕 جدید</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <div className="text-2xl font-black text-amber-500">{importSummary.updated}</div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-1">📝 آپدیت</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20">
                      <div className="text-2xl font-black text-slate-400">{importSummary.skipped}</div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-1">⏭️ skip</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                      <div className="text-2xl font-black text-rose-500">{importSummary.failed}</div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-1">❌ خطا</div>
                    </div>
                  </div>
                  {importSummary.details.filter(d=>d.status==="fail").length>0&&(
                    <div className="space-y-1">
                      <p className="font-bold text-rose-500 text-[11px]">موارد ناموفق:</p>
                      {importSummary.details.filter(d=>d.status==="fail").map((d,i)=>(
                        <div key={i} className="text-[10px] text-rose-400 font-mono bg-rose-500/5 p-2 rounded-xl">❌ {d.title} — {d.reason}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-[var(--card-border)] sticky bottom-0 bg-[var(--modal-bg)] rounded-b-3xl">
              <button type="button" disabled={importStep<2||importing} onClick={executeBulkImport}
                className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black cursor-pointer disabled:opacity-50 text-sm shadow-xl flex justify-center gap-2">
                {importing?"⏳ در حال ثبت...":"🚀 تایید نهایی و ایمپورت محصولات"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
