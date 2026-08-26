// components/AdminBanners.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { bannerService, Banner } from "@/services/bannerService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("/products");
  const [buttonText, setButtonText] = useState("مشاهده و بررسی کالا");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    try {
      const data = await bannerService.getAll();
      setBanners(data || []);
    } catch (e) {
      console.error("Error fetching banners:", e);
    }
  };

  useEffect(() => {
    fetchBanners();

    const channel = supabase
      .channel("banners-admin-realtime-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        fetchBanners();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectBanner = (b: Banner) => {
    soundEngine.playClick();
    setSelectedBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || "");
    setBadgeText(b.badge || b.badge_text || "");
    setImageUrl(b.image || b.image_url || "");
    setLinkUrl(b.link || b.link_url || "/products");
    setButtonText(b.button_text || b.buttonText || "مشاهده و بررسی کالا");
    setIsActive(b.is_active !== false);
  };

  const handleCreateNew = () => {
    soundEngine.playClick();
    if (banners.length >= 10) {
      alert("حداکثر ۱۰ اسلاید فعال برای اسلایدر صفحه اصلی مجاز است.");
      return;
    }
    setSelectedBanner(null);
    setTitle("");
    setSubtitle("");
    setBadgeText("");
    setImageUrl("");
    setLinkUrl("/products");
    setButtonText("مشاهده و بررسی کالا");
    setIsActive(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      setStatusMessage({ type: "error", text: "عنوان بنر و تصویر الزامی هستند." });
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      badge: badgeText.trim() || null,
      badge_text: badgeText.trim() || null,
      image: imageUrl.trim(),
      image_url: imageUrl.trim(),
      link: linkUrl.trim() || "/products",
      link_url: linkUrl.trim() || "/products",
      button_text: buttonText.trim() || "مشاهده و بررسی کالا",
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    try {
      if (selectedBanner?.id && !selectedBanner.id.startsWith("default-")) {
        const { error } = await supabase.from("banners").update(payload).eq("id", selectedBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert([payload]);
        if (error) throw error;
      }

      soundEngine.playSuccess();
      setStatusMessage({ type: "success", text: "⚡ بنر با موفقیت در دیتابیس ذخیره و در اسلایدر فعال شد." });
      fetchBanners();
      if (!selectedBanner) handleCreateNew();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "خطا در ذخیره‌سازی بنر." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این بنر اطمینان دارید؟")) return;
    try {
      soundEngine.playClick();
      if (!id.startsWith("default-")) {
        const { error } = await supabase.from("banners").delete().eq("id", id);
        if (error) throw error;
      }
      handleCreateNew();
      fetchBanners();
      setStatusMessage({ type: "success", text: "بنر با موفقیت حذف گردید." });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert("خطا در حذف: " + err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🖼️</span> مدیریت اسلایدر صفحه اصلی (تا ۱۰ اسلاید متحرک)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            طراحی، تغییر اسلایدها و بارگذاری تصویر از گوشی و سیستم با انیمیشن روان
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer"
        >
          + ایجاد اسلاید جدید ({banners.length}/10)
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-3 shadow-xl h-fit">
          <h3 className="text-xs font-black border-b border-[var(--card-border)] pb-3">
            📋 اسلایدهای فعال ({banners.length})
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {banners.map((b) => (
              <div
                key={b.id}
                onClick={() => handleSelectBanner(b)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  selectedBanner?.id === b.id
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 shadow-sm"
                    : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                }`}
              >
                <div className="overflow-hidden">
                  <h4 className="text-xs font-black truncate">{b.title}</h4>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate block">{b.link || b.link_url}</span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${b.is_active !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] space-y-5 shadow-xl text-xs">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">عنوان اصلی اسلاید *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مانیتورهای تدوین و تصحیح رنگ ۵K"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">برچسب کوچک نئونی (Badge)</label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="مثال: پیشنهاد ویژه نوروز"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">زیرعنوان و توضیحات اسلاید</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="توضیحات کوتاه برای معرفی مزیت محصول در اسلایدر..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-[var(--text-secondary)]">تصویر عریض اسلایدر (URL یا فایل) *</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <span>📁</span>
                    <span>انتخاب عکس از دستگاه</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">لینک مقصد هنگام کلیک</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/products"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">متن دکمه روی بنر</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="مشاهده و بررسی کالا"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bannerActiveCheckbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-[var(--accent-blue)] cursor-pointer"
                />
                <label htmlFor="bannerActiveCheckbox" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                  اسلاید فعال و در چرخه اسلایدر صفحه نخست نمایش داده شود
                </label>
              </div>
            </div>

            {/* پیش‌نمایش لایو بنر */}
            {imageUrl && (
              <div className="space-y-2 border-t border-[var(--card-border)] pt-4">
                <span className="text-[11px] font-bold text-[var(--text-secondary)]">پیش‌نمایش لایو بنر:</span>
                <div
                  className="w-full h-44 rounded-2xl bg-cover bg-center border border-[var(--card-border)] p-6 flex items-center shadow-inner relative overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(to left, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.3)), url(${imageUrl})`,
                  }}
                >
                  <div className="text-white space-y-1.5 z-10">
                    {badgeText && <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black">{badgeText}</span>}
                    <h4 className="font-black text-base">{title || "عنوان پیش‌نمایش"}</h4>
                    <p className="text-xs text-slate-300">{subtitle || "توضیحات پیش‌نمایش"}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 shadow-lg disabled:opacity-50"
              >
                {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و فعال‌سازی در اسلایدر"}
              </button>
              {selectedBanner?.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedBanner.id)}
                  className="px-6 py-4 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500 hover:text-white transition cursor-pointer"
                >
                  حذف اسلاید ✕
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}