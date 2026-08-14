"use client";

import React, { useState, useEffect } from "react";

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: "slider" | "top_double" | "footer_banner";
  isActive: boolean;
  createdAt: string;
}

const BANNERS_KEY = "site_banners";

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // استیت فرم ثبت / ویرایش بنر
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState<Banner["position"]>("slider");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = () => {
    const data = localStorage.getItem(BANNERS_KEY);
    if (data) {
      setBanners(JSON.parse(data));
    } else {
      // داده‌های اولیه نمونه
      const defaultBanners: Banner[] = [
        {
          id: "banner-1",
          title: "جشنواره فروش ویژه تابستانه",
          imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000",
          linkUrl: "/products",
          position: "slider",
          isActive: true,
          createdAt: new Date().toLocaleDateString("fa-IR"),
        },
      ];
      localStorage.setItem(BANNERS_KEY, JSON.stringify(defaultBanners));
      setBanners(defaultBanners);
    }
  };

  const saveBanners = (updated: Banner[]) => {
    localStorage.setItem(BANNERS_KEY, JSON.stringify(updated));
    setBanners(updated);
  };

  // 🖼️ آپلود و فشرده‌سازی تصویر روی مرورگر
  const handleCompressAndUploadImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("⚠️ لطفاً یک فایل تصویری معتبر انتخاب کنید.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200; // حداکثر عرض بنر
        const scaleFactor = MAX_WIDTH / img.width;

        canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        canvas.height = img.width > MAX_WIDTH ? img.height * scaleFactor : img.height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL("image/webp", 0.8);
        setImageUrl(compressedBase64);
        showToast("⚡ تصویر بنر با موفقیت فشرده‌سازی و قرار داده شد.");
      };
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      showToast("⚠️ لطفاً عنوان و تصویر بنر را مشخص کنید.");
      return;
    }

    if (editingBanner) {
      const updated = banners.map((b) =>
        b.id === editingBanner.id
          ? {
              ...b,
              title: title.trim(),
              imageUrl: imageUrl.trim(),
              linkUrl: linkUrl.trim(),
              position,
            }
          : b
      );
      saveBanners(updated);
      showToast("✅ بنر با موفقیت به‌روزرسانی شد.");
    } else {
      const newBanner: Banner = {
        id: "banner-" + Date.now(),
        title: title.trim(),
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim() || "#",
        position,
        isActive: true,
        createdAt: new Date().toLocaleDateString("fa-IR"),
      };
      saveBanners([newBanner, ...banners]);
      showToast("🎉 بنر جدید با موفقیت منتشر شد.");
    }

    resetForm();
  };

  const startEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setImageUrl(banner.imageUrl);
    setLinkUrl(banner.linkUrl);
    setPosition(banner.position);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setTitle("");
    setImageUrl("");
    setLinkUrl("");
    setPosition("slider");
  };

  const toggleStatus = (id: string) => {
    const updated = banners.map((b) =>
      b.id === id ? { ...b, isActive: !b.isActive } : b
    );
    saveBanners(updated);
    showToast("🔄 وضعیت بنر تغییر کرد.");
  };

  const handleDelete = (id: string, bannerTitle: string) => {
    if (confirm(`آیا از حذف بنر "${bannerTitle}" اطمینان دارید؟`)) {
      const updated = banners.filter((b) => b.id !== id);
      saveBanners(updated);
      showToast("🗑️ بنر با موفقیت حذف شد.");
    }
  };

  const getPositionLabel = (pos: Banner["position"]) => {
    switch (pos) {
      case "slider":
        return "🎠 اسلایدر اصلی صفحه اول";
      case "top_double":
        return "🖼️ بنر دوتایی بالای صفحه";
      case "footer_banner":
        return "📌 بنر عریض انتهای صفحه (فوتر)";
      default:
        return pos;
    }
  };

  return (
    <div className="space-y-6 select-none text-xs font-sans text-white">
      {/* پیام نوتیفیکیشن */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold shadow-2xl border border-white/20 animate-bounce">
          {toastMessage}
        </div>
      )}

      <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-black text-indigo-300 flex items-center gap-2">
              <span>🖼️</span> مدیریت بنرهای تبلیغاتی و اسلایدرها
            </h3>
            <p className="text-xs opacity-60 mt-1">مدیریت تصاویر اسلایدر اصلی، بنرهای پیشنهادی و لینک‌های هدایت خریدار</p>
          </div>

          <span className="px-3 py-1 bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-bold">
            {banners.length} بنر ثبت شده
          </span>
        </div>

        {/* فرم ساخت / ویرایش بنر */}
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <span className="font-extrabold text-xs text-indigo-200 block">
            {editingBanner ? `✏️ ویرایش بنر: ${editingBanner.title}` : "➕ ثبت بنر یا اسلایدر جدید:"}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold opacity-70">عنوان بنر *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: تخفیف‌های ویژه جمعه سیاه"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">موقعیت نمایش در سایت *</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Banner["position"])}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 outline-none font-bold cursor-pointer"
              >
                <option value="slider">🎠 اسلایدر اصلی صفحه اول</option>
                <option value="top_double">🖼️ بنر دوتایی بالای صفحه</option>
                <option value="footer_banner">📌 بنر عریض انتهای صفحه (فوتر)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold opacity-70">تصویر بنر (لینک مستقیم یا آپلود مستقیم عکس)</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                required
                placeholder="https://... یا آپلود عکس از دکمه روبرو"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono text-[11px]"
              />
              <label className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer hover:bg-indigo-500 transition shrink-0">
                📁 آپلود تصویر
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleCompressAndUploadImage(e.target.files[0]);
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold opacity-70">لینک مقصد هنگام کلیک (اختیاری)</label>
            <input
              type="text"
              placeholder="مثلاً: /products یا https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono text-[11px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingBanner && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold cursor-pointer"
              >
                انصراف
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold transition cursor-pointer shadow-md"
            >
              {editingBanner ? "ذخیره تغییرات بنر 💾" : "ثبت و انتشار بنر 🚀"}
            </button>
          </div>
        </form>

        {/* لیست بنرها */}
        <div className="space-y-3 pt-2">
          <span className="font-bold opacity-70 block">بنرهای فعال و ثبت‌شده:</span>

          {banners.length === 0 ? (
            <div className="text-center py-8 text-white/50">هنوز هیچ بنری ثبت نشده است.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-indigo-400 transition"
                >
                  <div className="w-full h-36 rounded-xl bg-black/30 overflow-hidden relative border border-white/10 flex items-center justify-center">
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-30">🖼️</span>
                    )}
                    <span
                      className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        b.isActive
                          ? "bg-emerald-500/80 text-white"
                          : "bg-rose-500/80 text-white"
                      }`}
                    >
                      {b.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-300 font-bold block">
                      {getPositionLabel(b.position)}
                    </span>
                    <h4 className="font-extrabold text-xs">{b.title}</h4>
                    {b.linkUrl && (
                      <p className="text-[10px] opacity-60 font-mono truncate">🔗 {b.linkUrl}</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => startEdit(b)}
                      className="flex-1 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold transition text-[11px] cursor-pointer"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => toggleStatus(b.id)}
                      className={`flex-1 py-1.5 rounded-xl font-bold transition text-[11px] cursor-pointer ${
                        b.isActive
                          ? "bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600"
                          : "bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600"
                      }`}
                    >
                      {b.isActive ? "👁️ مخفی‌سازی" : "✅ نمایش"}
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.title)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/30 text-rose-200 hover:bg-rose-600 font-bold transition text-[11px] cursor-pointer"
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
    </div>
  );
}