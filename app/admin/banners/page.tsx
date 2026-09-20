"use client";

import React, { useEffect, useState, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string | null;
  is_active: boolean;
  created_at?: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{
    id?: string;
    title: string;
    image_url: string;
    link_url: string;
    is_active: boolean;
  }>({
    title: "",
    image_url: "",
    link_url: "/products",
    is_active: true,
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/banners", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.banners)) {
        setBanners(json.banners);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenCreate = () => {
    soundEngine.playClick();
    setForm({
      title: "",
      image_url: "",
      link_url: "/products",
      is_active: true,
    });
    setStatusMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Banner) => {
    soundEngine.playClick();
    setForm({
      id: b.id,
      title: b.title,
      image_url: b.image_url,
      link_url: b.link_url || "/products",
      is_active: b.is_active,
    });
    setStatusMsg(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این بنر اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        if (Array.isArray(json.banners)) setBanners(json.banners);
        else fetchBanners();
      }
    } catch {}
  };

  // آپلود مستقیم عکس و فشرده‌سازی خودکار در کلاینت بدون نیاز به باکت ابری
  const handleDirectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1280;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const webpDataUrl = canvas.toDataURL("image/webp", 0.85);
        setForm((prev) => ({ ...prev, image_url: webpDataUrl }));
        soundEngine.playSuccess();
      };
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image_url.trim()) {
      setStatusMsg({ type: "error", text: "عنوان و تصویر بنر الزامی هستند." });
      return;
    }

    soundEngine.playClick();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setStatusMsg({ type: "success", text: "✓ بنر با موفقیت ذخیره شد." });
        if (Array.isArray(json.banners)) {
          setBanners(json.banners);
        }
        setTimeout(() => {
          setIsModalOpen(false);
          fetchBanners();
        }, 600);
      } else {
        setStatusMsg({ type: "error", text: json.message || "خطا در ثبت بنر." });
      }
    } catch {
      setStatusMsg({ type: "error", text: "خطا در اتصال به سرور." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] select-none" dir="rtl">
      <input type="file" ref={fileInputRef} onChange={handleDirectImageUpload} accept="image/*" className="hidden" />

      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🖼️</span> مدیریت بنرها و اسلایدرهای صفحه اصلی
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ایجاد، ویرایش، حذف و تنظیم بنرهای تصویری ویترین فروشگاه
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span> افزودن بنر جدید
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">در حال بارگذاری بنرها...</div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">هیچ بنری ثبت نشده است. با دکمه بالا بنر اضافه کنید.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {banners.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] overflow-hidden flex flex-col justify-between shadow-sm group hover:border-[var(--accent-blue)] transition"
              >
                <div className="relative aspect-[16/8] bg-black/20 overflow-hidden">
                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                      b.is_active ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {b.is_active ? "فعال در ویترین" : "غیرفعال"}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-xs font-black truncate">{b.title}</h3>
                  {b.link_url && (
                    <span className="text-[11px] font-mono text-slate-400 block truncate" dir="ltr">
                      🔗 {b.link_url}
                    </span>
                  )}

                  <div className="pt-2 flex justify-between items-center border-t border-[var(--card-border)]">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer"
                    >
                      ویرایش ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer"
                    >
                      حذف 🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* فرم ایجاد / ویرایش بنر */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black">{form.id ? "✏️ ویرایش بنر" : "➕ ثبت بنر جدید"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white font-mono">✕</button>
            </div>

            {statusMsg && (
              <div className={`p-3 rounded-xl font-bold ${statusMsg.type === "success" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان بنر *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: جشنواره عیدانه آکسون کور"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-[var(--text-secondary)]">تصویر بنر *</label>
                {form.image_url ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[var(--card-border)] aspect-[16/8]">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: "" })}
                      className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[10px] font-bold"
                    >
                      تغییر عکس
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-5 rounded-2xl border-2 border-dashed border-[var(--card-border)] bg-[var(--input-bg)] text-xs font-bold text-[var(--accent-blue)] hover:border-[var(--accent-blue)] transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>📁</span>
                      <span>انتخاب عکس از سیستم یا گوشی</span>
                    </button>
                    <input
                      type="text"
                      placeholder="یا وارد کردن آدرس مستقیم اینترنتی عکس (URL)"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">لینک کلیک روی بنر:</label>
                <input
                  type="text"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  placeholder="/products"
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <label className="flex items-center gap-2 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded accent-[var(--accent-blue)]"
                />
                نمایش فعال در ویترین سایت
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-[var(--input-bg)] font-bold">انصراف</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold shadow hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "در حال ذخیره..." : "ذخیره بنر 💾"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
