"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Save, X, Image as ImageIcon, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SpecItem {
  key: string;
  value: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // استیت‌های فرم
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priceToman, setPriceToman] = useState<string>("");
  const [discountToman, setDiscountToman] = useState<string>("");
  const [stock, setStock] = useState<number>(10);
  const [description, setDescription] = useState("");
  
  // مدیریت چند عکس
  const [images, setImages] = useState<string[]>([]);
  const [imgInput, setImgInput] = useState("");

  // رنگ‌بندی
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");

  // مشخصات فنی پویا
  const [specsList, setSpecsList] = useState<SpecItem[]>([
    { key: "توان مصرفی", value: "" },
    { key: "ظرفیت مخزن", value: "" },
  ]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatNumber = (val: string) => {
    const raw = String(val || "").replace(/\D/g, "");
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    setter(formatNumber(e.target.value));
  };

  const parseRawNumber = (formatted: string) => {
    return Number(String(formatted || "").replace(/,/g, "")) || 0;
  };

  // مدیریت تصاویر
  const addImage = () => {
    const url = imgInput.trim();
    if (url && !images.includes(url)) {
      setImages([...images, url]);
      setImgInput("");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // تبدیل فایل آپلودی به Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === "string") {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // مدیریت رنگ‌ها
  const addColor = () => {
    const trimmed = colorInput.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors([...colors, trimmed]);
      setColorInput("");
    }
  };

  const removeColor = (col: string) => {
    setColors(colors.filter((c) => c !== col));
  };

  // مدیریت مشخصات
  const addSpecField = () => {
    setSpecsList([...specsList, { key: "", value: "" }]);
  };

  const updateSpecField = (index: number, field: "key" | "value", val: string) => {
    const updated = [...specsList];
    updated[index][field] = val;
    setSpecsList(updated);
  };

  const removeSpecField = (index: number) => {
    setSpecsList(specsList.filter((_, i) => i !== index));
  };

  // باز کردن مدال در حالت ویرایش
  const handleEditClick = (p: any) => {
    setEditingId(p.id);
    setTitle(p.title || p.name || "");
    setCategory(p.category || "");
    setPriceToman(formatNumber(String(p.price || "")));
    setDiscountToman(p.discount_price ? formatNumber(String(p.discount_price)) : "");
    setStock(p.stock !== undefined ? p.stock : 10);
    setDescription(p.description || "");

    const loadedImgs = Array.isArray(p.images) && p.images.length > 0 
      ? p.images 
      : (p.image_url ? [p.image_url] : []);
    setImages(loadedImgs);

    setColors(Array.isArray(p.colors) ? p.colors : []);

    if (p.specs && typeof p.specs === "object") {
      const sp = Object.entries(p.specs).map(([key, value]) => ({ key, value: String(value) }));
      setSpecsList(sp.length > 0 ? sp : [{ key: "توان مصرفی", value: "" }, { key: "ظرفیت مخزن", value: "" }]);
    } else {
      setSpecsList([{ key: "توان مصرفی", value: "" }, { key: "ظرفیت مخزن", value: "" }]);
    }

    setIsModalOpen(true);
  };

  // ذخیره فرم
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("نام محصول الزامی است.");
      return;
    }

    const specsObject: Record<string, string> = {};
    specsList.forEach((item) => {
      if (item.key.trim() && item.value.trim()) {
        specsObject[item.key.trim()] = item.value.trim();
      }
    });

    const payload = {
      id: editingId || undefined,
      title: title.trim(),
      category: category.trim() || "تجهیزات هوشمند",
      price: parseRawNumber(priceToman),
      discount_price: discountToman ? parseRawNumber(discountToman) : null,
      stock: Number(stock),
      description,
      images,
      image_url: images[0] || "/placeholder.png",
      colors,
      specs: specsObject,
    };

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در ارتباط با سرور");
      }

      alert("کالا با موفقیت ذخیره گردید!");
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      alert("خطا در ذخیره کالا: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCategory("");
    setPriceToman("");
    setDiscountToman("");
    setStock(10);
    setDescription("");
    setImages([]);
    setImgInput("");
    setColors([]);
    setSpecsList([
      { key: "توان مصرفی", value: "" },
      { key: "ظرفیت مخزن", value: "" },
    ]);
  };

  const rawPrice = parseRawNumber(priceToman);
  const rawDiscount = parseRawNumber(discountToman);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 lg:p-10 dir-rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[var(--card-border)]">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-hover)] text-sm font-bold flex items-center gap-2">
              <ArrowRight size={18} />
              پیشخوان
            </Link>
            <h1 className="text-2xl font-black">مدیریت کاتالوگ و انبار کالاها</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            تعریف و ویرایش مشخصات فنی، چند تصویر، رنگ‌بندی و قیمت‌گذاری به تومان و ریال
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-6 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          افزودن محصول جدید
        </button>
      </div>

      {/* لیست کارت‌های محصولات */}
      <div className="mt-8">
        {loading ? (
          <div className="text-center py-20 text-sm font-bold text-[var(--text-secondary)]">
            در حال بارگذاری اطلاعات از دیتابیس...
          </div>
        ) : products.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center">
            <p className="text-sm font-bold text-[var(--text-secondary)]">
              هنوز کالایی ثبت نشده است.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const displayImg = (Array.isArray(p.images) && p.images[0]) || p.image_url || "/placeholder.png";
              return (
                <div key={p.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="w-full h-44 rounded-2xl bg-zinc-900/50 overflow-hidden mb-4 relative flex items-center justify-center border border-[var(--card-border)]">
                      <img src={displayImg} alt={p.title || p.name} className="w-full h-full object-contain p-2" />
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-3 py-1 rounded-full bg-blue-500/80 text-white backdrop-blur-md">
                        {p.category || "عمومی"}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm line-clamp-2 leading-relaxed">{p.title || p.name}</h3>
                    
                    <div className="mt-4 pt-3 border-t border-[var(--card-border)] flex justify-between items-center text-xs">
                      <span className="text-[var(--text-secondary)]">قیمت:</span>
                      <div className="text-left font-bold">
                        <div>{Number(p.price || 0).toLocaleString("fa-IR")} تومان</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">
                          {(Number(p.price || 0) * 10).toLocaleString("fa-IR")} ریال
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex justify-between items-center text-xs">
                      <span className="text-[var(--text-secondary)]">موجودی انبار:</span>
                      <span className="font-bold">{p.stock} عدد</span>
                    </div>
                  </div>

                  {/* دکمه‌های ویرایش و حذف */}
                  <div className="mt-6 pt-3 border-t border-[var(--card-border)] flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(p)}
                      className="p-2.5 text-blue-400 hover:bg-blue-500/10 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
                      title="ویرایش کالا"
                    >
                      <Edit size={16} />
                      ویرایش
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("آیا از حذف این کالا از دیتابیس مطمئن هستید؟")) {
                          await fetch(`/api/admin/products?id=${p.id}`, { method: "DELETE" });
                          fetchProducts();
                        }
                      }}
                      className="p-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      title="حذف کالا"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* مدال ایجاد و ویرایش */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121214] border border-[#27272a] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
              <h2 className="text-lg font-black flex items-center gap-2 text-white">
                {editingId ? <Edit size={20} className="text-[#0071e3]" /> : <Plus size={20} className="text-[#0071e3]" />}
                {editingId ? "ویرایش مشخصات کالا" : "ایجاد کالای جدید"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* نام و دسته‌بندی */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">نام و مدل کالا *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثلاً: اتوبخار پرتابل هوشمند با چرخش ۱۸۰ درجه"
                    className="w-full p-3 rounded-2xl bg-[#1c1c1f] border border-[#27272a] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">دسته‌بندی کالا *</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="مثلاً: اتوبخار و مراقبت از لباس"
                    className="w-full p-3 rounded-2xl bg-[#1c1c1f] border border-[#27272a] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
                  />
                </div>
              </div>

              {/* قیمت‌گذاری */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">قیمت اصلی (تومان) *</label>
                  <input
                    type="text"
                    required
                    value={priceToman}
                    onChange={(e) => handlePriceChange(e, setPriceToman)}
                    placeholder="مثلاً: 4,000,000"
                    className="w-full p-3 rounded-2xl bg-[#1c1c1f] border border-[#27272a] text-xs font-bold text-white outline-none focus:border-[#0071e3] text-left"
                  />
                  {rawPrice > 0 && (
                    <div className="text-[11px] text-zinc-400 mt-1.5 flex justify-between">
                      <span>معادل به ریال:</span>
                      <span className="font-bold text-emerald-400">{(rawPrice * 10).toLocaleString("fa-IR")} ریال</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">قیمت با تخفیف (تومان)</label>
                  <input
                    type="text"
                    value={discountToman}
                    onChange={(e) => handlePriceChange(e, setDiscountToman)}
                    placeholder="مثلاً: 3,900,000"
                    className="w-full p-3 rounded-2xl bg-[#1c1c1f] border border-[#27272a] text-xs font-bold text-white outline-none focus:border-[#0071e3] text-left"
                  />
                  {rawDiscount > 0 && (
                    <div className="text-[11px] text-zinc-400 mt-1.5 flex justify-between">
                      <span>معادل تخفیف ریال:</span>
                      <span className="font-bold text-emerald-400">{(rawDiscount * 10).toLocaleString("fa-IR")} ریال</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">موجودی انبار *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl bg-[#1c1c1f] border border-[#27272a] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
                  />
                </div>
              </div>

              {/* مدیریت گالری تصاویر چندگانه */}
              <div className="p-4 rounded-2xl bg-[#161618] border border-[#27272a]">
                <label className="block text-xs font-black text-white mb-2">گالری تصاویر کالا (افزودن چند تصویر)</label>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="text"
                    value={imgInput}
                    onChange={(e) => setImgInput(e.target.value)}
                    placeholder="آدرس اینترنتی تصویر (URL)"
                    className="flex-1 p-2.5 rounded-xl bg-[#1c1c1f] border border-[#27272a] text-xs text-white outline-none focus:border-[#0071e3]"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white"
                  >
                    افزودن لینک
                  </button>
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-xs font-bold text-white flex items-center justify-center gap-2">
                    <ImageIcon size={14} />
                    آپلود از دستگاه
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-700 group bg-black">
                        <img src={img} alt="preview" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-90 hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* رنگ‌بندی‌های مجاز */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">رنگ‌بندی‌های مجاز</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addColor();
                      }
                    }}
                    placeholder="مثلاً: بژ متالیک، سفید صدفی، مشکی..."
                    className="flex-1 p-3 rounded-2xl bg-[#1c1c1f] border border-[#27272a] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
                  />
                  <button
                    type="button"
                    onClick={addColor}
                    className="px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white"
                  >
                    افزودن رنگ
                  </button>
                </div>
                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {colors.map((c) => (
                      <span key={c} className="px-3 py-1.5 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-200 flex items-center gap-2">
                        {c}
                        <button type="button" onClick={() => removeColor(c)} className="text-zinc-400 hover:text-rose-400">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* مشخصات فنی تفکیک‌شده */}
              <div className="p-4 rounded-2xl bg-[#161618] border border-[#27272a]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-black text-white">مشخصات فنی و ویژگی‌های تفکیک‌شده</label>
                  <button
                    type="button"
                    onClick={addSpecField}
                    className="text-xs font-bold text-[#0071e3] hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} />
                    افزودن ویژگی جدید
                  </button>
                </div>

                <div className="space-y-3">
                  {specsList.map((spec, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => updateSpecField(index, "key", e.target.value)}
                        placeholder="عنوان ویژگی (مثلاً توان مصرفی)"
                        className="w-1/3 p-2.5 rounded-xl bg-[#1c1c1f] border border-[#27272a] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => updateSpecField(index, "value", e.target.value)}
                        placeholder="مقدار ویژگی (مثلاً 1200W)"
                        className="flex-1 p-2.5 rounded-xl bg-[#1c1c1f] border border-[#27272a] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecField(index)}
                        className="p-2 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* توضیحات */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">توضیحات کلی محصول</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات معرفی دستگاه، موارد استفاده و نکات کلیدی..."
                  className="w-full p-3 rounded-2xl bg-[#1c1c1f] border border-[#27272a] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
                />
              </div>

              {/* دکمه‌ها */}
              <div className="pt-4 border-t border-[#27272a] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "در حال ذخیره‌سازی..." : (editingId ? "ذخیره تغییرات" : "ثبت نهایی کالا")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
