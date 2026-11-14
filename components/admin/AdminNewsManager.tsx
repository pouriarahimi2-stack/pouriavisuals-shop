// File Path: components/admin/AdminNewsManager.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

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
  published_at?: string;
  created_at?: string;
}

interface CatalogProductOption {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string;
}

const CATEGORY_LABELS: Record<TechNewsItem["category"], string> = {
  hardware: "💻 سخت‌افزار و نمایشگر",
  gadgets: "⌚ گجت‌ها و تجهیزات هوشمند",
  ai: "🤖 هوش مصنوعی و پردازش",
  gaming: "🎮 گیمینگ و تصویر",
};

export default function AdminNewsManager() {
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [products, setProducts] = useState<CatalogProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedNews, setSelectedNews] = useState<TechNewsItem | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<TechNewsItem["category"]>("hardware");
  const [sourceName, setSourceName] = useState("Global Tech Wire");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("تکنولوژی, سخت افزار, کالای دیجیتال");
  const [isPublished, setIsPublished] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [previewMode, setPreviewMode] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deduplicating, setDeduplicating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const fetchNewsAndProducts = useCallback(async () => {
    try {
      const [newsRes, prodsRes] = await Promise.all([
        fetch("/api/news?includeDrafts=true&t=" + Date.now(), { cache: "no-store" }).catch(
          () => null
        ),
        fetch("/api/products?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
      ]);

      if (newsRes && newsRes.ok) {
        const json = await newsRes.json();
        if (json.success && Array.isArray(json.data)) {
          setNews(json.data);
        }
      }

      if (prodsRes && prodsRes.ok) {
        const pJson = await prodsRes.json();
        const pList = pJson.data || pJson.products || [];
        if (Array.isArray(pList)) {
          setProducts(
            pList.map((p: any) => ({
              id: String(p.id),
              title: p.title || p.name || "کالای دیجیتال",
              price: Number(p.discount_price || p.price || 0),
              category: p.category || "کالای دیجیتال",
              image: p.image || "/placeholder.png",
            }))
          );
        }
      }
    } catch (e) {
      console.error("Fetch news error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewsAndProducts();

    const channel = supabase
      .channel("realtime-admin-news-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "tech_news" }, () => {
        fetchNewsAndProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNewsAndProducts]);

  const makeSlug = (val: string) =>
    val
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleSelectNews = (n: TechNewsItem) => {
    soundEngine.playClick();
    setSelectedNews(n);
    setTitle(n.title || "");
    setSlug(n.slug || "");
    setSummary(n.summary || "");
    setContent(n.content || "");
    setCategory(n.category || "hardware");
    setSourceName(n.source_name || "Global Tech Wire");
    setImageUrl(n.image_url || "");
    setTags(Array.isArray(n.tags) ? n.tags.join(", ") : "تکنولوژی");
    setIsPublished(n.is_published !== false);
    setPreviewMode(false);
  };

  const handleCreateNew = () => {
    soundEngine.playClick();
    setSelectedNews(null);
    setSelectedProductId("");
    setTitle("");
    setSlug("");
    setSummary("");
    setContent("");
    setCategory("hardware");
    setSourceName("رادار فناوری آکسون");
    setImageUrl("");
    setTags("تکنولوژی, سخت افزار, گجت هوشمند");
    setIsPublished(true);
    setPreviewMode(false);
  };

  const handleDeduplicateNews = async () => {
    soundEngine.playClick();
    setDeduplicating(true);
    try {
      const res = await fetch("/api/news/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deduplicate_news" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        await fetchNewsAndProducts();
      }
    } finally {
      setDeduplicating(false);
    }
  };

  const handleUpgradeAllShortNews = async () => {
    soundEngine.playClick();
    setSyncing(true);
    try {
      const res = await fetch("/api/news/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upgrade_all_short_news" }),
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        await fetchNewsAndProducts();
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleTriggerAutonomousSync = async () => {
    soundEngine.playClick();
    setSyncing(true);
    try {
      const res = await fetch("/api/news/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId || undefined,
          category,
        }),
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        notify("⚡ " + json.message);
        await fetchNewsAndProducts();
        if (json.data) handleSelectNews(json.data);
      } else {
        notify("خطا در تولید خبر تحلیلی.", "error");
      }
    } catch {
      notify("خطای ارتباط با سرور.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleTogglePublishQuick = async (item: TechNewsItem) => {
    soundEngine.playClick();
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_publish",
          id: item.id,
          is_published: !item.is_published,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        await fetchNewsAndProducts();
      }
    } catch {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEngine.playClick();
    setSaving(true);

    const payload = {
      id: selectedNews?.id,
      title: title.trim(),
      slug: slug.trim() || makeSlug(title),
      summary: summary.trim() || title.trim(),
      content: content.trim(),
      category,
      source_name: sourceName.trim() || "رادار فناوری آکسون",
      image_url:
        imageUrl.trim() || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      is_published: isPublished,
    };

    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify("✓ خبر با موفقیت در دیتابیس ثبت و بلادرنگ منتشر گردید.");
        await fetchNewsAndProducts();
        if (!selectedNews && json.data) setSelectedNews(json.data);
      } else {
        notify(json.message || "خطا در ذخیره خبر.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, newsTitle: string) => {
    if (!confirm("آیا از حذف کامل خبر «" + newsTitle + "» از دیتابیس اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/news?id=" + encodeURIComponent(id), { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify("✓ خبر با موفقیت از دیتابیس حذف گردید.");
        if (selectedNews?.id === id) handleCreateNew();
        await fetchNewsAndProducts();
      }
    } catch {
      notify("خطا در حذف خبر.", "error");
    }
  };

  const appendHtmlSnippet = (snippet: string) => {
    soundEngine.playClick();
    setContent((prev) => (prev.trim() ? prev + "\n\n" + snippet : snippet));
  };

  const injectProductMentionBox = () => {
    const prod = products.find((p) => p.id === selectedProductId) || products[0];
    if (!prod) return;
    const snippet = `<div style="padding:18px;border-radius:18px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);margin:18px 0;"><h3>🛍️ پیشنهاد ویژه کاتالوگ رسمی آکسون کور: ${prod.title}</h3><p>هم‌اکنون می‌توانید نسخه اورجینال <strong>${prod.title}</strong> را با قیمت <strong>${prod.price.toLocaleString("fa-IR")} تومان</strong> و ضمانت سلامت فیزیکی از آکسون کور تهیه فرمایید:</p><p><a href="/products/${prod.id}"><strong>🔗 مشاهده مشخصات و خرید آنلاین ${prod.title} ←</strong></a></p></div>`;
    appendHtmlSnippet(snippet);
  };

  // شمارش تعداد تیترهای تکراری در لیست فعلی برای اطلاع ادمین
  const uniqueTitlesCount = new Set(
    news.map((n) => String(n.title || "").trim().toLowerCase())
  ).size;
  const duplicatesCount = Math.max(0, news.length - uniqueTitlesCount);

  const filteredNews = news.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.title || "").toLowerCase().includes(q) ||
      (item.source_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-5 sm:p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📡</span> ربات هوشمند رادار اخبار تکنولوژی و تقویت سئو
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پایش خودکار ترندهای فناوری، تولید گزارش‌های تحلیلی متصل به کاتالوگ و حذف هوشمند خبرهای تکراری
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {duplicatesCount > 0 && (
            <button
              type="button"
              onClick={handleDeduplicateNews}
              disabled={deduplicating}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition cursor-pointer shadow-lg disabled:opacity-50"
            >
              {deduplicating
                ? "در حال پاک‌سازی..."
                : `🧹 حذف خودکار ${duplicatesCount} خبر تکراری`}
            </button>
          )}
          <button
            type="button"
            onClick={handleTriggerAutonomousSync}
            disabled={syncing}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>{syncing ? "⏳ در حال پردازش..." : "🤖 تولید خبر تحلیلی عمیق جدید"}</span>
          </button>
          <button
            type="button"
            onClick={handleUpgradeAllShortNews}
            disabled={syncing}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer shadow-lg disabled:opacity-50"
          >
            ⚡ ارتقای اخبار کوتاه به مقالات جامع سئو
          </button>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer"
          >
            + نگارش دستی خبر
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " +
            (statusMsg.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {statusMsg.text}
        </div>
      )}

      {/* گرید ۱۲ ستونی استاندارد: ۴ ستون لیست اخبار فعال و ۸ ستون فرم ویرایشگر */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-[var(--modal-bg)] p-4 sm:p-5 rounded-3xl border border-[var(--card-border)] space-y-3.5 h-fit shadow-xl text-xs">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <h3 className="text-xs font-black">
              📰 اخبار ثبت‌شده ({news.length})
            </h3>
            <Link
              href="/news"
              target="_blank"
              className="text-[10px] font-bold text-[var(--accent-blue)] hover:underline"
            >
              مشاهده رادار سایت 🔗
            </Link>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 جستجو در تیتر اخبار..."
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />

          <div className="flex flex-wrap gap-1 text-[10px] font-bold">
            {[
              { id: "all", label: "همه" },
              { id: "hardware", label: "سخت‌افزار" },
              { id: "gadgets", label: "گجت‌ها" },
              { id: "ai", label: "هوش مصنوعی" },
              { id: "gaming", label: "گیمینگ" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(c.id)}
                className={
                  "px-2.5 py-1 rounded-lg cursor-pointer " +
                  (categoryFilter === c.id
                    ? "bg-[var(--accent-blue)] text-white"
                    : "bg-[var(--input-bg)] text-[var(--text-secondary)]")
                }
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-xs text-center py-12 text-slate-400 font-bold">
                در حال استعلام لحظه‌ای دیتابیس...
              </p>
            ) : filteredNews.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold space-y-3">
                <p>خبری در این بخش یافت نشد.</p>
                <button
                  type="button"
                  onClick={handleTriggerAutonomousSync}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                >
                  تولید خبر تحلیلی الان
                </button>
              </div>
            ) : (
              filteredNews.map((item) => (
                <div
                  key={item.id}
                  className={
                    "p-3 rounded-2xl border transition flex items-center justify-between gap-2 " +
                    (selectedNews?.id === item.id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-sm"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50")
                  }
                >
                  <div
                    onClick={() => handleSelectNews(item)}
                    className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer min-w-0"
                  >
                    <img
                      src={item.image_url || "/placeholder.png"}
                      alt=""
                      className="w-12 h-12 object-cover rounded-xl shrink-0 border border-[var(--card-border)] bg-black/10"
                    />
                    <div className="overflow-hidden space-y-1 min-w-0">
                      <h4 className="font-bold text-xs truncate">{item.title}</h4>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePublishQuick(item);
                          }}
                          className={
                            "px-1.5 py-0.5 rounded font-bold cursor-pointer " +
                            (item.is_published !== false
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400")
                          }
                        >
                          {item.is_published !== false ? "منتشرشده" : "پیش‌نویس"}
                        </button>
                        <span className="text-[var(--accent-blue)] font-bold">{item.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/news/${encodeURIComponent(item.slug || item.id)}`}
                      target="_blank"
                      className="p-1.5 px-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-sky-500 text-xs font-bold"
                      title="مشاهده خبر در سایت"
                    >
                      🔗
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleSelectNews(item)}
                      className="p-1.5 px-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer"
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
                      title="حذف خبر"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ستون چپ (۸ ستون): فرم ویرایشگر کامل خبر فناوری */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSave}
            className="bg-[var(--modal-bg)] p-5 sm:p-7 rounded-3xl border border-[var(--card-border)] space-y-5 shadow-xl text-xs"
          >
            {/* انتخابگر محصول جهت اتصال خبر به کاتالوگ */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/40 space-y-2">
              <label className="block font-black text-[var(--accent-blue)]">
                🎯 اتصال هوشمند خبر به کالای کاتالوگ (اختیاری - جهت درج خودکار باکس خرید و تصویر کالا):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setSelectedProductId(pid);
                    const found = products.find((p) => p.id === pid);
                    if (found && !imageUrl) setImageUrl(found.image);
                  }}
                  className="flex-1 p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer text-[var(--text-primary)]"
                >
                  <option value="">-- انتخاب کالا از کاتالوگ برای پیوند دادن به این خبر --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      📦 {p.title} ({p.price.toLocaleString("fa-IR")} تومان)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={injectProductMentionBox}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer shrink-0 transition"
                >
                  + درج باکس خرید این کالا در متن خبر
                </button>
              </div>
            </div>

            {/* گرید ۲ ستونه استاندارد و متقارن */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                  تیتر خبر *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!selectedNews) setSlug(makeSlug(e.target.value));
                  }}
                  placeholder="مثال: رونمایی از نمایشگر جدید 5K با درگاه تاندربولت ۵"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                  دسته‌بندی موضوعی
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] cursor-pointer outline-none"
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, lbl]) => (
                    <option key={k} value={k}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                  نام منبع خبر
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                  نامک (Slug) در آدرس URL:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="tech-news-slug"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[var(--text-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                  تصویر شاخص خبر (URL یا آپلود مستقیم)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                  />
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="px-4 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shrink-0"
                  >
                    ☁️ آپلود
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                  خلاصه گزارش (Meta Description سئو)
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="خلاصه جذاب خبر جهت نمایش در کارت‌های رادار و نتایج گوگل..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium outline-none leading-relaxed"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="font-bold text-[var(--text-secondary)]">
                    متن کامل خبر (پشتیبانی از تگ‌های HTML، جدول و لینک محصول)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        appendHtmlSnippet("<h2>سرفصل تحلیلی جدید</h2>\n<p>متن تحلیل فنی...</p>")
                      }
                      className="px-2.5 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[11px] cursor-pointer"
                    >
                      + تیتر H2
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      className={
                        "px-3 py-1 rounded-xl font-black text-[11px] cursor-pointer border " +
                        (previewMode
                          ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                          : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]")
                      }
                    >
                      {previewMode ? "✏️ ویرایشگر کد" : "👁️ پیش‌نمایش زنده"}
                    </button>
                  </div>
                </div>

                {previewMode ? (
                  <div
                    className="w-full min-h-[220px] max-h-[400px] overflow-y-auto p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/50 leading-loose space-y-3"
                    dangerouslySetInnerHTML={{
                      __html: content || "<p>هنوز متنی برای پیش‌نمایش وارد نشده است...</p>",
                    }}
                  />
                ) : (
                  <textarea
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium leading-loose outline-none focus:border-[var(--accent-blue)]"
                  />
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                  برچسب‌ها و کلمات کلیدی (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--accent-blue)] cursor-pointer"
              />
              <span>انتشار مستقیم در رادار فناوری سایت و نقشه سایت گوگل (Sitemap)</span>
            </label>

            <div className="flex gap-3 pt-3 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50"
              >
                {saving
                  ? "در حال ذخیره‌سازی..."
                  : selectedNews
                  ? "💾 بروزرسانی و ذخیره تغییرات خبر"
                  : "💾 ذخیره و انتشار خبر در دیتابیس"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <MediaUploadModal
        isOpen={isUploadOpen}
        bucket="banners"
        title="آپلود تصویر شاخص خبر فناوری"
        currentValue={imageUrl}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(url) => setImageUrl(url)}
      />
    </div>
  );
}