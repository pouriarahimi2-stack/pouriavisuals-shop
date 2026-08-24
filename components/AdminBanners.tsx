"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface BannerItem {
  id?: string;
  title: string;
  subtitle?: string;
  badge_text?: string;
  image_url: string;
  link_url?: string;
  button_text?: string;
  order_index?: number;
  is_active?: boolean;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<BannerItem | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("/#products");
  const [buttonText, setButtonText] = useState("مشاهده و بررسی");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setBanners((data as BannerItem[]) || []);
    } catch (e) {
      console.error("Error fetching banners:", e);
    }
  };

  useEffect(() => {
    fetchBanners();

    const channel = supabase
      .channel("banners-admin-realtime-master")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        fetchBanners();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectBanner = (b: BannerItem) => {
    setSelectedBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || "");
    setBadgeText(b.badge_text || "");
    setImageUrl(b.image_url);
    setLinkUrl(b.link_url || "/#products");
    setButtonText(b.button_text || "مشاهده و بررسی");
    setIsActive(b.is_active !== false);
  };

  const handleCreateNew = () => {
    setSelectedBanner(null);
    setTitle("");
    setSubtitle("");
    setBadgeText("");
    setImageUrl("");
    setLinkUrl("/#products");
    setButtonText("مشاهده و بررسی");
    setIsActive(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      setStatusMessage({ type: "error", text: "عنوان بنر و آدرس تصویر الزامی هستند." });
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      badge_text: badgeText.trim() || null,
      image_url: imageUrl.trim(),
      link_url: linkUrl.trim() || "/#products",
      button_text: buttonText.trim() || "مشاهده و بررسی",
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    try {
      if (selectedBanner?.id) {
        const { error } = await supabase.from("banners").update(payload).eq("id", selectedBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert([payload]);
        if (error) throw error;
      }

      setStatusMessage({ type: "success", text: "⚡ بنر با موفقیت ذخیره و در صفحه اصلی منتشر شد." });
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
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      handleCreateNew();
      fetchBanners();
      setStatusMessage({ type: "success", text: "بنر حذف گردید." });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert("خطا در حذف: " + err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🖼️</span> مدیریت بنرهای تبلیغاتی و اسلایدر صفحه اصلی
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">طراحی، ویرایش و تنظیم اولویت بنرهای ویترین اصلی سایت به صورت بلادرنگ</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition shadow-md cursor-pointer"
        >
          + ایجاد بنر جدید
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-[var(--modal-bg)] p-5 rounded-3xl border border-[var(--card-border)] space-y-3 shadow-sm h-fit">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📋 بنرهای ثبت‌شده ({banners.length})
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {banners.length === 0 ? (
              <p className="text-[11px] text-[var(--text-secondary)] font-medium text-center py-6">هنوز بنری ثبت نشده است.</p>
            ) : (
              banners.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleSelectBanner(b)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    selectedBanner?.id === b.id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                  }`}
                >
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black text-[var(--text-primary)] truncate">{b.title}</h4>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate block">{b.link_url}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${b.is_active !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] space-y-5 shadow-sm text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">عنوان اصلی بنر *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مانیتورهای تخصصی تدوین و رنگ ۵K"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">نشان یا برچسب کوچک (Badge)</label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="مثال: تخفیف ویژه نوروز"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">توضیح تکمیلی یا زیرعنوان</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="مثال: پوشش رنگ ۱۰۰٪ DCI-P3 و کالیبراسیون سخت‌افزاری کارخانه‌ای"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">آدرس تصویر بنر (URL) *</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">لینک مقصد هنگام کلیک</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/products یا /#products"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">متن روی دکمه بنر</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="مشاهده و خرید"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isBanActAdmin"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
                />
                <label htmlFor="isBanActAdmin" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                  بنر فعال و در اسلایدر صفحه اصلی نمایش داده شود
                </label>
              </div>
            </div>

            {imageUrl && (
              <div className="space-y-2 border-t border-[var(--card-border)] pt-4">
                <span className="text-[11px] font-bold text-[var(--text-secondary)]">پیش‌نمایش بصری لایو:</span>
                <div
                  className="w-full h-40 rounded-2xl bg-cover bg-center border border-[var(--card-border)] p-6 flex items-center shadow-inner"
                  style={{
                    backgroundImage: `linear-gradient(to left, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.3)), url(${imageUrl})`,
                  }}
                >
                  <div className="text-white space-y-1.5">
                    {badgeText && <span className="px-2 py-0.5 rounded bg-white/20 text-[9px] font-black">{badgeText}</span>}
                    <h4 className="font-black text-sm">{title || "عنوان پیش‌نمایش بنر"}</h4>
                    <p className="text-[10px] text-slate-300">{subtitle || "زیرعنوان تستی بنر"}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 transition shadow-lg disabled:opacity-50"
              >
                {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار بنر در سایت"}
              </button>
              {selectedBanner?.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedBanner.id!)}
                  className="px-5 py-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500 hover:text-white transition cursor-pointer"
                >
                  حذف بنر ✕
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}