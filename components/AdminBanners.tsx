"use client";

import React, { useState, useEffect } from "react";
import { bannerService, BannerItem } from "@/services/bannerService";

export default function AdminBanners() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // فرم ساخت/ویرایش بنر
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState<BannerItem["position"]>("main_slider");
  const [editingId, setEditingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await bannerService.getAll();
      setBanners(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();

    const handleUpdate = (e: any) => {
      if (e.detail) setBanners(e.detail);
      else loadBanners();
    };
    window.addEventListener("banners_updated", handleUpdate);
    return () => window.removeEventListener("banners_updated", handleUpdate);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim() || !linkUrl.trim()) return;

    if (editingId) {
      const updated = banners.map((b) =>
        b.id === editingId
          ? {
              ...b,
              title: title.trim(),
              subtitle: subtitle.trim() || undefined,
              imageUrl,
              linkUrl: linkUrl.trim(),
              position,
            }
          : b
      );
      setBanners(updated);
      setEditingId(null);
      showToast("بنر ویرایش شد. جهت اعمال نهایی روی دکمه ذخیره کلیک کنید.");
    } else {
      const newBanner: BannerItem = {
        id: `ban_${Date.now()}`,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        imageUrl,
        linkUrl: linkUrl.trim(),
        position,
        order: banners.length + 1,
        isActive: true,
      };
      setBanners([...banners, newBanner]);
      showToast("بنر به لیست اضافه شد.");
    }

    // ریست فرم
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setLinkUrl("");
    setPosition("main_slider");
  };

  const handleStartEdit = (b: BannerItem) => {
    setEditingId(b.id);
    setTitle(b.title);
    setSubtitle(b.subtitle || "");
    setImageUrl(b.imageUrl);
    setLinkUrl(b.linkUrl);
    setPosition(b.position);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActive = (id: string) => {
    const updated = banners.map((b) =>
      b.id === id ? { ...b, isActive: !b.isActive } : b
    );
    setBanners(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این بنر اطمینان دارید؟")) {
      const updated = banners.filter((b) => b.id !== id);
      setBanners(updated);
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setBanners(reordered);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const success = await bannerService.saveAll(banners);
      if (success) {
        showToast("✨ تغییرات اسلایدر و بنرها با موفقیت در دیتابیس ثبت و اعمال شد.");
      } else {
        showToast("خطا در ذخیره‌سازی بنرها.");
      }
    } finally {
      setSaving(false);
    }
  };

  const getPositionLabel = (pos: BannerItem["position"]) => {
    switch (pos) {
      case "main_slider":
        return "اسلایدر اصلی بالای سایت";
      case "grid_top":
        return "بنر عریض ردیف اول";
      case "grid_bottom":
        return "بنر دوتایی ردیف دوم";
      case "sidebar":
        return "سایدبار تبلیغاتی";
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* هدر بخش بنرها */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base flex items-center gap-2 text-[var(--accent-blue)]">
            <span>🖼️</span> مدیریت اسلایدرها و بنرهای تبلیغاتی صفحه اول
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تنظیم اسلایدهای بالای صفحه، بنرهای عریض کمپین‌ها، لینک‌های مقصد و چینش نمایش
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>💾</span>
          <span>{saving ? "در حال ذخیره‌سازی..." : "انتشار و ذخیره تغییرات بنرها"}</span>
        </button>
      </div>

      {/* فرم افزودن/ویرایش بنر */}
      <form onSubmit={handleFormSubmit} className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <h4 className="font-black text-xs text-[var(--text-primary)]">
          {editingId ? "✏️ ویرایش مشخصات بنر" : "➕ ایجاد بنر یا اسلایدر جدید"}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">عنوان اصلی بنر *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: جشنواره مانیتورهای تدوین"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">زیرعنوان یا متن توضیحی</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="مثال: تخفیف ویژه تا پایان هفته"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">موقعیت نمایش در سایت *</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as any)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer"
            >
              <option value="main_slider">اسلایدر اصلی بالای سایت</option>
              <option value="grid_top">بنر عریض ردیف اول</option>
              <option value="grid_bottom">بنر دوتایی ردیف دوم</option>
              <option value="sidebar">سایدبار تبلیغاتی</option>
            </select>
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">آدرس لینک مقصد (URL) *</label>
            <input
              type="text"
              required
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="مثال: /#products یا /blog"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تصویر بنر (URL یا آپلود مستقیم) *</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... یا آپلود از سیستم"
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
              <label className="px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold cursor-pointer transition flex items-center gap-1">
                <span>📁 آپلود</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setSubtitle("");
                setImageUrl("");
                setLinkUrl("");
              }}
              className="px-5 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer"
            >
              انصراف از ویرایش
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-md"
          >
            {editingId ? "ثبت تغییرات بنر ✏️" : "+ درج در لیست بنرها"}
          </button>
        </div>
      </form>

      {/* لیست بنرهای ثبت‌شده */}
      <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h4 className="font-black text-xs text-[var(--text-secondary)]">لیست بنرها و ترتیب نمایش ({banners.length})</h4>

        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">در حال دریافت بنرها...</div>
        ) : banners.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">هیچ بنری ثبت نشده است.</div>
        ) : (
          <div className="space-y-3">
            {banners.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-4">
                  <span className="w-7 h-7 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center font-mono font-black text-xs text-[var(--text-secondary)]">
                    {index + 1}
                  </span>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-20 h-12 object-cover rounded-xl border border-[var(--card-border)]"
                  />
                  <div>
                    <h5 className="font-black text-xs text-[var(--text-primary)]">{item.title}</h5>
                    {item.subtitle && <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{item.subtitle}</p>}
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-[var(--modal-bg)] text-[10px] font-bold text-[var(--accent-blue)]">
                      {getPositionLabel(item.position)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl p-1">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="px-2 py-1 hover:text-[var(--accent-blue)] disabled:opacity-30 cursor-pointer font-bold"
                    >
                      ▲
                    </button>
                    <button
                      disabled={index === banners.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="px-2 py-1 hover:text-[var(--accent-blue)] disabled:opacity-30 cursor-pointer font-bold"
                    >
                      ▼
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleActive(item.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer ${
                      item.isActive
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-gray-500/15 text-gray-500 border border-gray-500/30"
                    }`}
                  >
                    {item.isActive ? "فعال در سایت" : "غیرفعال"}
                  </button>

                  <button
                    onClick={() => handleStartEdit(item)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}