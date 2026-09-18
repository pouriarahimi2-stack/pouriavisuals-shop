"use client";

import React, { useEffect, useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  discount_price?: number | null;
  stock: number;
  images: string[];
  description?: string;
  colors?: string[];
  storage_options?: string[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [colorInput, setColorInput] = useState("");
  const [storageInput, setStorageInput] = useState("");

  const [form, setForm] = useState<{
    id?: string;
    title: string;
    category: string;
    price: number | "";
    discount_price: number | "";
    stock: number | "";
    images: string[];
    description: string;
    colors: string[];
    storage_options: string[];
  }>({
    title: "",
    category: "smartphones",
    price: "",
    discount_price: "",
    stock: "",
    images: [],
    description: "",
    colors: [],
    storage_options: [],
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reports");
      const prodRes = await fetch("/api/products?limit=100").catch(() => null);
      if (prodRes && prodRes.ok) {
        const json = await prodRes.json();
        setProducts(json.products || []);
      } else {
        const repJson = await res.json();
        if (repJson.report?.low_stock_items) {
          setProducts(repJson.report.low_stock_items);
        }
      }
    } catch {
      console.error("خطا در واکشی کاتالوگ محصولات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    soundEngine.playClick();
    setEditingProduct(null);
    setForm({
      title: "",
      category: "smartphones",
      price: "",
      discount_price: "",
      stock: 10,
      images: [],
      description: "",
      colors: ["مشکی", "تیتانیوم"],
      storage_options: ["256GB", "512GB"],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    soundEngine.playClick();
    setEditingProduct(p);
    setForm({
      id: p.id,
      title: p.title,
      category: p.category || "smartphones",
      price: p.price,
      discount_price: p.discount_price ?? "",
      stock: p.stock,
      images: Array.isArray(p.images) ? p.images : [],
      description: p.description || "",
      colors: Array.isArray(p.colors) ? p.colors : [],
      storage_options: Array.isArray(p.storage_options) ? p.storage_options : [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این محصول از کاتالوگ اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        fetchProducts();
      } else {
        alert(json.message || "خطا در حذف محصول.");
      }
    } catch {
      alert("ارتباط با سرور برقرار نشد.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    if (Number(form.price) < 0 || Number(form.stock) < 0) {
      alert("قیمت یا موجودی نمی‌تواند منفی باشد.");
      return;
    }

    if (form.discount_price && Number(form.discount_price) > Number(form.price)) {
      alert("قیمت با تخفیف نمی‌تواند بیشتر از قیمت اصلی باشد.");
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      stock: Number(form.stock),
    };

    try {
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setIsModalOpen(false);
        fetchProducts();
      } else {
        alert(json.message || "خطا در ذخیره‌سازی مشخصات محصول.");
      }
    } catch {
      alert("خطا در ارسال اطلاعات به سرور.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>💻</span> مدیریت کاتالوگ و انبار کالاها
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تعریف محصولات، مدیریت گالری تصاویر، قیمت‌گذاری و متغیرهای رنگ و حافظه
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span> افزودن محصول جدید
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">در حال دریافت محصولات...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">محصولی در کاتالوگ یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                  <th className="pb-3 px-3">تصویر</th>
                  <th className="pb-3 px-3">عنوان محصول</th>
                  <th className="pb-3 px-3">قیمت اصلی</th>
                  <th className="pb-3 px-3">قیمت تخفیف</th>
                  <th className="pb-3 px-3">موجودی انبار</th>
                  <th className="pb-3 px-3 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--input-bg)]/40 transition">
                    <td className="py-3 px-3">
                      {p.images && p.images[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-10 h-10 object-cover rounded-xl border border-[var(--card-border)]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs">
                          📦
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-[var(--text-primary)]">{p.title}</td>
                    <td className="py-3 px-3 font-mono">
                      {Number(p.price).toLocaleString("fa-IR")} تومان
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-400">
                      {p.discount_price ? `${Number(p.discount_price).toLocaleString("fa-IR")} تومان` : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-xl font-mono text-xs font-bold ${
                          p.stock < 5
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {p.stock} عدد
                      </span>
                    </td>
                    <td className="py-3 px-3 text-left space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-border)] transition"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--text-primary)]">
                {editingProduct ? "✏️ ویرایش مشخصات کالا" : "➕ ایجاد کالای جدید"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">نام و مدل کالا:</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">دسته‌بندی:</label>
                  <input
              type="text"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="دسته‌بندی (مثلاً: اتوبخار و لوازم خانگی)"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
            />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">قیمت اصلی (تومان):</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">قیمت با تخفیف (اختیاری):</label>
                  <input
                    type="number"
                    min={0}
                    value={form.discount_price}
                    onChange={(e) => setForm({ ...form, discount_price: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">موجودی انبار:</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">گالری تصاویر کالا:</label>
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="px-3 py-1 rounded-xl bg-[var(--accent-blue)] text-white text-[11px] font-bold hover:opacity-90 transition"
                  >
                    ☁️ بارگذاری تصویر جدید
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap min-h-[60px] p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt="Product visual"
                        className="w-14 h-14 object-cover rounded-xl border border-[var(--card-border)]"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center shadow"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {form.images.length === 0 && (
                    <span className="text-slate-400 text-xs">هنوز تصویری اضافه نشده است.</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">رنگ‌بندی‌های مجاز:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    placeholder="مثال: نقره‌ای"
                    className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (colorInput.trim()) {
                        setForm({ ...form, colors: [...form.colors, colorInput.trim()] });
                        setColorInput("");
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[var(--card-border)] text-xs font-bold"
                  >
                    افزودن رنگ
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {form.colors.map((c, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-lg bg-[var(--card-border)] text-xs flex items-center gap-1">
                      {c}
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, colors: form.colors.filter((_, idx) => idx !== i) })}
                        className="text-rose-400 text-[10px]"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">توضیحات و مشخصات فنی:</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-md hover:opacity-90 transition"
                >
                  ذخیره کالا 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaUploadModal
        isOpen={isUploadOpen}
        bucket="products"
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(url) => {
          setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
        }}
      />
    </div>
  );
}
