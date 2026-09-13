"use client";

import React, { useEffect, useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

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
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    image_url: "",
    link_url: "",
    is_active: true,
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/banners");
      const json = await res.json();
      if (res.ok && json.success) {
        setBanners(json.banners || []);
      }
    } catch {
      console.error("خطا در دریافت بنرهای ویترین.");
    } finally {
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
      link_url: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این بنر از اسلایدر ویترین اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        fetchBanners();
      } else {
        alert(json.message || "خطا در حذف بنر.");
      }
    } catch {
      alert("ارتباط با سرور برقرار نشد.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    if (!form.image_url) {
      alert("لطفاً ابتدا تصویر بنر را بارگذاری کنید.");
      return;
    }

    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setIsModalOpen(false);
        fetchBanners();
      } else {
        alert(json.message || "خطا در ایجاد بنر جدید.");
      }
    } catch {
      alert("خطا در ارسال اطلاعات به سرور.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      {/* هدر صفحه */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🖼️</span> مدیریت بنرهای تبلیغاتی و اسلایدرها
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پیکربندی بنرهای پویا در صفحه اصلی، اسلایدر ویژه تخفیف‌ها و کمپین‌ها
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span> افزودن بنر جدید
        </button>
      </div>

      {/* گرید کارت‌های بنر */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">در حال دریافت بنرها...</div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">هیچ بنری ثبت نشده است.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {banners.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] overflow-hidden flex flex-col justify-between shadow-sm group hover:border-[var(--accent-blue)] transition"
              >
                <div className="relative aspect-[16/8] bg-black/20 overflow-hidden">
                  <img
                    src={b.image_url}
                    alt={b.title || "Banner visual"}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                      b.is_active
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {b.is_active ? "فعال در ویترین" : "غیرفعال"}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {b.title || "بدون عنوان"}
                  </h3>
                  {b.link_url && (
                    <span className="text-[11px] font-mono text-slate-400 block truncate" dir="ltr">
                      🔗 {b.link_url}
                    </span>
                  )}

                  <div className="pt-2 flex justify-end border-t border-[var(--card-border)]">
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs transition"
                    >
                      حذف بنر
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* مودال ایجاد بنر */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--text-primary)]">➕ ثبت بنر تبلیغاتی جدید</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  عنوان یا توضیح کوتاه بنر:
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: جشنواره ویژه عیدانه آکسون کور"
                  className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">تصویر بنر:</label>
                {form.image_url ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[var(--card-border)] aspect-[16/8]">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: "" })}
                      className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[10px] font-bold shadow"
                    >
                      تغییر تصویر
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="w-full py-6 rounded-2xl border-2 border-dashed border-[var(--card-border)] bg-[var(--input-bg)] text-xs font-bold text-[var(--accent-blue)] hover:border-[var(--accent-blue)] transition flex flex-col items-center justify-center gap-1"
                  >
                    <span>☁️</span>
                    انتخاب یا آپلود تصویر بنر
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  لینک مقصد (اختیاری):
                </label>
                <input
                  type="text"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  placeholder="/products یا https://..."
                  dir="ltr"
                  className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded accent-[var(--accent-blue)]"
                />
                نمایش فعال در ویترین سایت
              </label>

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
                  ذخیره بنر 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال بارگذاری تصویر */}
      <MediaUploadModal
        isOpen={isUploadOpen}
        bucket="banners"
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(url) => {
          setForm((prev) => ({ ...prev, image_url: url }));
        }}
      />
    </div>
  );
}
