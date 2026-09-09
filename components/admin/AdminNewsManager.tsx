"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

export interface TechNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: "hardware" | "gadgets" | "ai" | "gaming";
  source_name: string;
  image_url: string;
  tags: string[];
  is_published: boolean;
  trending_score?: number;
  published_at?: string;
}

export default function AdminNewsManager() {
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<TechNewsItem | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<TechNewsItem["category"]>("hardware");
  const [sourceName, setSourceName] = useState("Global Tech Wire");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("تکنولوژی, سخت افزار, مانیتور 5K");
  const [isPublished, setIsPublished] = useState(true);

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchNews = async () => {
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        setNews(json.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNews();

    const channel = supabase
      .channel("realtime-tech-news")
      .on("postgres_changes", { event: "*", schema: "public", table: "tech_news" }, () => {
        fetchNews();
      })
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
    setCategory("hardware");
    setSourceName("آکسون تک");
    setImageUrl("");
    setTags("مانیتور, سخت افزار, استودیو");
    setIsPublished(true);
  };

  // فعال‌سازی ربات خزش و ترجمه فوری اخبار ترند
  const handleSyncWorldNews = async () => {
    soundEngine.playClick();
    setSyncing(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/news/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        soundEngine.playSuccess();
        setStatusMsg({ type: "success", text: "⚡ " + data.message });
        fetchNews();
      }
    } catch {
      setStatusMsg({ type: "error", text: "خطا در خزش و ترجمه اخبار جهانی." });
    } finally {
      setSyncing(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEngine.playClick();
    setSaving(true);
    const payload = {
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

    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setStatusMsg({ type: "success", text: "✓ خبر با موفقیت در دیتابیس ثبت و در سایت منتشر شد." });
        fetchNews();
        if (!selectedNews && data.data) setSelectedNews(data.data);
      }
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMsg(null), 3500);
    }
  };

  const handleDelete = async (id: string, newsTitle: string) => {
    if (!confirm(`آیا از حذف کامل خبر «${newsTitle}» از پایگاه داده اطمینان دارید؟`)) return;
    soundEngine.playClick();
    try {
      const res = await fetch(`/api/news?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setStatusMsg({ type: "success", text: "✓ خبر با موفقیت از سیستم حذف شد." });
        if (selectedNews?.id === id) handleCreateNew();
        fetchNews();
      }
    } catch {
      alert("خطا در حذف خبر.");
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* هدر بخش مدیریت اخبار */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📡</span> ربات هوشمند رادار اخبار تکنولوژی و سئو
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پایش خودکار ترندهای جهان، ترجمه هوشمند، انقضای ۷ روزه و مدیریت دستی کامل
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleSyncWorldNews}
            disabled={syncing}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>🤖</span>
            <span>{syncing ? "در حال دریافت و ترجمه ترندها..." : "پایش و ترجمه فوری اخبار جهان"}</span>
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
        <div className={"p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " + (statusMsg.type === "success" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 border border-rose-500/30 text-rose-600")}>
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ستون راست: لیست اخبار با دکمه‌های مستقیم ویرایش و حذف */}
        <div className="lg:col-span-4 bg-[var(--modal-bg)] p-4 sm:p-5 rounded-3xl border border-[var(--card-border)] space-y-3 h-fit shadow-xl">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <h3 className="text-xs font-black">
              📰 اخبار فعال ({news.length})
            </h3>
            <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg">
              انقضای ۷ روزه ✓
            </span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {news.length === 0 ? (
              <p className="text-xs text-center py-12 text-slate-400 font-bold">اخباری یافت نشد. دکمه پایش را بزنید.</p>
            ) : (
              news.map((item) => (
                <div
                  key={item.id}
                  className={"p-3 rounded-2xl border transition flex items-center justify-between gap-2 " + (
                    selectedNews?.id === item.id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-sm"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                  )}
                >
                  <div
                    onClick={() => handleSelectNews(item)}
                    className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
                  >
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-12 h-12 object-cover rounded-xl shrink-0 border border-[var(--card-border)]"
                    />
                    <div className="overflow-hidden space-y-1">
                      <h4 className="font-bold text-xs truncate">{item.title}</h4>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-[var(--accent-blue)] font-bold">{item.category}</span>
                        <span className="text-slate-400 font-mono">({item.source_name})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectNews(item)}
                      className="p-1.5 px-2 rounded-xl bg-[var(--modal-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold transition cursor-pointer"
                      title="ویرایش خبر"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.title);
                      }}
                      className="p-1.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 text-xs font-bold transition cursor-pointer"
                      title="حذف از دیتابیس"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ستون چپ: فرم ادیتور کامل خبر */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] space-y-5 shadow-xl text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">تیتر خبر *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">دسته‌بندی موضوعی</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] cursor-pointer outline-none"
                >
                  <option value="hardware">سخت‌افزار و مانیتور</option>
                  <option value="gadgets">گجت‌ها و تجهیزات استودیو</option>
                  <option value="ai">هوش مصنوعی و پردازش</option>
                  <option value="gaming">گیمینگ و تصویر</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">نام منبع خبر</label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">آدرس تصویر شاخص خبر (URL)</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">خلاصه گزارش (Meta Description سئو)</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium outline-none leading-relaxed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">متن کامل خبر (پشتیبانی از تگ‌های HTML)</label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium leading-loose outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">برچسب‌ها و کلمات کلیدی (با کاما جدا کنید)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار خبر در سایت"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
