// File Path: components/admin/AdminNewsManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { newsService, TechNewsItem } from "@/services/newsService";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminNewsManager() {
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<TechNewsItem | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<TechNewsItem["category"]>("gadgets");
  const [sourceName, setSourceName] = useState("Global Tech Wire");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("تکنولوژی, سخت افزار, مانیتور");
  const [isPublished, setIsPublished] = useState(true);

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchNews = async () => {
    const data = await newsService.getAll();
    setNews(data || []);
  };

  useEffect(() => {
    fetchNews();

    const channel = supabase
      .channel("admin-news-realtime-master-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "tech_news" }, () => fetchNews())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectNews = (n: TechNewsItem) => {
    soundEngine.playClick();
    setSelectedNews(n);
    setTitle(n.title);
    setSlug(n.slug);
    setSummary(n.summary);
    setContent(n.content);
    setCategory(n.category);
    setSourceName(n.source_name);
    setImageUrl(n.image_url);
    setTags((n.tags || []).join(", "));
    setIsPublished(n.is_published !== false);
  };

  const handleCreateNew = () => {
    soundEngine.playClick();
    setSelectedNews(null);
    setTitle("");
    setSlug("");
    setSummary("");
    setContent("");
    setCategory("gadgets");
    setSourceName("Global Tech Wire");
    setImageUrl("");
    setTags("گجت, سخت افزار, مانیتور");
    setIsPublished(true);
  };

  const handleSyncWorldNews = async () => {
    soundEngine.playClick();
    setSyncing(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/news/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        soundEngine.playSuccess();
        setStatusMsg("⚡ همگام‌سازی ترندهای جهانی و پاکسازی اخبار قدیمی‌تر از ۷ روز انجام شد.");
        fetchNews();
      }
    } catch {
      setStatusMsg("خطا در همگام‌سازی اخبار.");
    } finally {
      setSyncing(false);
      setTimeout(() => setStatusMsg(null), 3500);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEngine.playClick();
    setSaving(true);
    const payload: Partial<TechNewsItem> = {
      id: selectedNews?.id,
      title: title.trim(),
      slug: slug.trim() || undefined,
      summary: summary.trim(),
      content: content.trim(),
      category,
      source_name: sourceName.trim(),
      image_url: imageUrl.trim() || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      is_published: isPublished,
    };

    const res = await newsService.saveNewsItem(payload);
    setSaving(false);

    if (res) {
      soundEngine.playSuccess();
      setStatusMsg("✅ خبر با موفقیت ذخیره و در بخش «جدیدترین اخبار حوزه تکنولوژی» منتشر شد.");
      fetchNews();
      if (!selectedNews) setSelectedNews(res);
    }
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این خبر اطمینان دارید؟")) return;
    soundEngine.playClick();
    await newsService.deleteNewsItem(id);
    handleCreateNew();
    fetchNews();
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📡</span> مرکز مدیریت جدیدترین اخبار حوزه تکنولوژی
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پایش خودکار هر ۶ ساعت، پاکسازی هفتگی خودکار و دسته‌بندی هوشمند بر اساس رفتار کاربر
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSyncWorldNews}
            disabled={syncing}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>{syncing ? "در حال دریافت ترندها..." : "پایش فوری اخبار جهان"}</span>
          </button>
          <button
            onClick={handleCreateNew}
            className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer"
          >
            + نگارش دستی خبر
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-2 h-[640px] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <h3 className="text-xs font-black">
              📰 اخبار فعال ({news.length})
            </h3>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">
              ۷ روز اعتبار خودکار
            </span>
          </div>
          {news.map((item) => (
            <div
              key={item.id || item.slug}
              onClick={() => handleSelectNews(item)}
              className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                selectedNews?.id === item.id
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                  : "border-[var(--card-border)] bg-[var(--input-bg)]"
              }`}
            >
              <img src={item.image_url} alt="" className="w-12 h-12 object-cover rounded-xl shrink-0 border border-[var(--card-border)]" />
              <div className="overflow-hidden flex-1 space-y-1">
                <h4 className="font-bold text-xs truncate">{item.title}</h4>
                <span className="text-[10px] text-[var(--accent-blue)] font-bold block">{item.category}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-xl text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">تیتر خبر *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">دسته‌بندی موضوعی</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="hardware">سخت‌افزار و مانیتور</option>
                  <option value="gadgets">گجت‌ها و دیوایس‌ها</option>
                  <option value="ai">هوش مصنوعی</option>
                  <option value="gaming">گیمینگ و کنسول</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">نام منبع خبر</label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">آدرس تصویر خبر (URL)</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[var(--text-primary)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">خلاصه گزارش (Meta Description)</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">متن کامل خبر (پشتیبانی از HTML)</label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium leading-relaxed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">برچسب‌ها (با کاما جدا کنید)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-lg disabled:opacity-50"
              >
                {saving ? "در حال ذخیره..." : "💾 ذخیره و انتشار خبر"}
              </button>
              {selectedNews?.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedNews.id)}
                  className="px-5 py-3.5 rounded-2xl bg-rose-500/15 text-rose-600 font-bold cursor-pointer"
                >
                  حذف ✕
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}