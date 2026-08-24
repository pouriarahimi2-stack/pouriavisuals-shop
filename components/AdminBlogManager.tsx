"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  category?: string;
  imageUrl?: string;
  image_url?: string;
  metaDescription?: string;
  meta_description?: string;
  metaKeywords?: string;
  isPublished?: boolean;
  is_published?: boolean;
  createdAt?: string;
}

export default function AdminBlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("راهنمای خرید");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("Error loading blog posts:", e);
    }
  };

  useEffect(() => {
    fetchPosts();

    // همگام‌سازی بلادرنگ مقالات با وب‌سوکت
    const channel = supabase
      .channel("posts-realtime-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectPost = (p: BlogPost) => {
    setSelectedPost(p);
    setTitle(p.title);
    setSlug(p.slug);
    setCategory(p.category || "راهنمای خرید");
    setContent(p.content);
    setImageUrl(p.imageUrl || p.image_url || "");
    setMetaDescription(p.metaDescription || p.meta_description || "");
    setIsPublished(p.isPublished !== false && p.is_published !== false);
  };

  const handleCreateNew = () => {
    setSelectedPost(null);
    setTitle("");
    setSlug("");
    setCategory("راهنمای خرید");
    setContent("");
    setImageUrl("");
    setMetaDescription("");
    setIsPublished(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setStatusMessage({ type: "error", text: "عنوان و محتوای مقاله الزامی هستند." });
      return;
    }

    setSaving(true);
    const payload = {
      id: selectedPost?.id,
      title: title.trim(),
      slug: slug.trim() ? slug.trim().toLowerCase().replace(/\s+/g, "-") : title.trim().toLowerCase().replace(/\s+/g, "-"),
      content,
      category,
      imageUrl,
      metaDescription,
      isPublished,
    };

    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({ type: "success", text: "⚡ مقاله با موفقیت در دیتابیس ثبت و منتشر شد." });
        fetchPosts();
        if (!selectedPost && data.post) {
          setSelectedPost(data.post);
        }
      } else {
        setStatusMessage({ type: "error", text: data.error || "خطا در ذخیره‌سازی مقاله." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "خطا در برقراری ارتباط با سرور." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این مقاله اطمینان دارید؟")) return;
    try {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
      handleCreateNew();
      fetchPosts();
      setStatusMessage({ type: "success", text: "مقاله حذف گردید." });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert("خطا در حذف: " + err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">📚 مدیریت مقالات، مجله تخصصی و سئو</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">انتشار مقالات آموزشی و تحلیل با ذخیره‌سازی ابری و وب‌سوکت</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition shadow-md cursor-pointer"
        >
          + نوشتن مقاله جدید
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
        {/* سایدبار لیست مقالات */}
        <div className="lg:col-span-1 bg-[var(--modal-bg)] p-5 rounded-3xl border border-[var(--card-border)] space-y-3 shadow-sm h-fit">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📑 مقالات منتشر شده ({posts.length})
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {posts.length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)] font-medium text-center py-6">هنوز مقاله‌ای ثبت نشده است.</p>
            ) : (
              posts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPost(p)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    selectedPost?.id === p.id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                  }`}
                >
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black text-[var(--text-primary)] truncate">{p.title}</h4>
                    <span className="text-[10px] text-[var(--accent-blue)] font-bold">{p.category || "مقاله"}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${p.isPublished !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* فرم ویرایشگر مقاله */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">عنوان مقاله *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مقایسه مانیتورهای ۴K و ۸K برای تدوین"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">دسته‌بندی موضوعی</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="مثال: راهنمای خرید، مانیتورینگ"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نامک انگلیسی (Slug)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="4k-vs-8k-monitors"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">آدرس تصویر شاخص (URL)</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">توضیحات متای سئو (خلاصه مقاله)</label>
              <input
                type="text"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="توضیح کوتاه جهت نمایش در نتایج گوگل..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">محتوای کامل مقاله *</label>
              <textarea
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="متن کامل تحلیل، مشخصات و راهنما را اینجا وارد کنید..."
                className="w-full p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] leading-relaxed outline-none focus:border-[var(--accent-blue)] font-medium"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPubPost"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
              />
              <label htmlFor="isPubPost" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                مقاله فوراً در مجله سایت منتشر شود
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs cursor-pointer hover:opacity-90 transition shadow-lg disabled:opacity-50"
              >
                {saving ? "در حال انتشار..." : "💾 ذخیره و انتشار در دیتابیس"}
              </button>
              {selectedPost?.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedPost.id!)}
                  className="px-5 py-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500 hover:text-white transition cursor-pointer"
                >
                  حذف مقاله ✕
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}