// File Path: components/AdminBlogManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  category?: string;
  image_url?: string;
  meta_description?: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CatalogProductItem {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  warranty: string;
}

export function AdminBlogManager() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [products, setProducts] = useState<CatalogProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("راهنمای خرید و بررسی تخصصی");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const notify = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const fetchPostsAndProducts = async () => {
    try {
      const [postsRes, prodsRes] = await Promise.all([
        fetch("/api/blogs", { cache: "no-store" }).catch(() => null),
        fetch("/api/products", { cache: "no-store" }).catch(() => null),
      ]);

      if (postsRes && postsRes.ok) {
        const bJson = await postsRes.json();
        const list = bJson.posts || bJson.data || [];
        setPosts(Array.isArray(list) ? list : []);
      }

      if (prodsRes && prodsRes.ok) {
        const pJson = await prodsRes.json();
        const pList = pJson.data || pJson.products || [];
        const mapped: CatalogProductItem[] = (Array.isArray(pList) ? pList : []).map((p: any) => ({
          id: String(p.id),
          title: p.title || p.name || "کالای دیجیتال",
          category: p.category || "کالای دیجیتال و تکنولوژی",
          price: Number(p.discount_price || p.price || 0),
          image: p.image || (Array.isArray(p.images) && p.images[0]) || "/placeholder.png",
          warranty: p.warranty || "۱۸ ماه گارانتی اصالت طلایی",
        }));
        setProducts(mapped);
      }
    } catch (e) {
      console.error("Blog manager load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsAndProducts();

    const chPosts = supabase
      .channel("realtime-admin-blog-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        fetchPostsAndProducts();
      })
      .subscribe();

    const chProducts = supabase
      .channel("realtime-admin-blog-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchPostsAndProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chPosts);
      supabase.removeChannel(chProducts);
    };
  }, []);

  const makeSlug = (val: string) =>
    val
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // پر شدن هوشمند و خودکار موضوع، کلمه کلیدی، متا و محتوا با انتخاب محصول از کاتالوگ
  const handleSelectProductAutoFill = (prodId: string) => {
    soundEngine.playClick();
    setSelectedProductId(prodId);
    if (!prodId) return;

    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const autoKey = "خرید و قیمت " + prod.title;
    const autoTitle = "بررسی تخصصی، مشخصات و راهنمای خرید " + prod.title;
    const autoSlug = makeSlug(prod.title) + "-review";
    const autoMeta =
      "بررسی تخصصی " +
      prod.title +
      " در دسته " +
      prod.category +
      " به همراه جدول ارزش خرید، مشخصات فنی و خرید مستقیم با " +
      prod.warranty +
      " در فروشگاه آکسون.";

    const autoContent = [
      "<h2>معرفی و بررسی تخصصی " + prod.title + "</h2>",
      "<p>اگر به دنبال <strong>" +
        autoKey +
        "</strong> با تضمین اصالت و بالاترین کیفیت ساخت هستید، " +
        prod.title +
        " یکی از بهترین گزینه‌های موجود در دسته " +
        prod.category +
        " به شمار می‌رود.</p>",
      "<h3>ویژگی‌های برجسته و ارزش خرید</h3>",
      "<ul>",
      "  <li>کیفیت ساخت ممتاز و بهره‌گیری از قطعات اورجینال نسل جدید</li>",
      "  <li>سازگاری کامل با اکوسیستم‌های مدرن دیجیتال و درگاه‌های پرسرعت</li>",
      "  <li>عرضه رسمی همراه با " + prod.warranty + "</li>",
      "</ul>",
      "<h3>خرید مستقیم از کاتالوگ آکسون</h3>",
      "<p>شما می‌توانید همین حالا <strong>" +
        prod.title +
        "</strong> را با قیمت رقابتی " +
        prod.price.toLocaleString("fa-IR") +
        " تومان از طریق لینک مستقیم زیر سفارش دهید:</p>",
      '<p><a href="/products/' +
        prod.id +
        '"><strong>🔗 مشاهده و خرید مستقیم ' +
        prod.title +
        " در فروشگاه آکسون</strong></a></p>",
    ].join("\n\n");

    setTargetKeyword(autoKey);
    setTitle(autoTitle);
    setSlug(autoSlug);
    setCategory(prod.category || "راهنمای خرید و بررسی تخصصی");
    setMetaDescription(autoMeta);
    if (prod.image) setImageUrl(prod.image);
    if (!editingId) setContent(autoContent);

    notify("✓ اطلاعات سئو، کلمه کلیدی و ساختار مقاله بر اساس محصول «" + prod.title + "» به صورت خودکار تکمیل شد.");
  };

  const handleGenerateAiSeoPost = async () => {
    const kw = targetKeyword.trim() || title.trim() || "تجهیزات دیجیتال پرچمدار";
    soundEngine.playClick();
    setGeneratingAi(true);
    try {
      const res = await fetch("/api/ai-seo-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: kw,
          productId: selectedProductId || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message || "✓ مقاله سئو با هوش مصنوعی تولید و در مجله منتشر شد.");
        fetchPostsAndProducts();
      } else {
        notify(json.message || "خطا در تولید خودکار مقاله.", "error");
      }
    } catch {
      notify("خطا در ارتباط با موتور هوش مصنوعی.", "error");
    } finally {
      setGeneratingAi(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedProductId("");
    setTitle("");
    setSlug("");
    setTargetKeyword("");
    setCategory("راهنمای خرید و بررسی تخصصی");
    setMetaDescription("");
    setImageUrl("");
    setContent("");
    setIsPublished(true);
  };

  const handleEditPost = (post: BlogPostItem) => {
    soundEngine.playClick();
    setEditingId(post.id);
    setTitle(post.title || "");
    setSlug(post.slug || "");
    setCategory(post.category || "راهنمای خرید و بررسی تخصصی");
    setMetaDescription(post.meta_description || "");
    setImageUrl(post.image_url || "");
    setContent(post.content || "");
    setIsPublished(post.is_published !== false);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      notify("عنوان و متن مقاله الزامی هستند.", "error");
      return;
    }

    soundEngine.playClick();
    setSaving(true);

    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          title: title.trim(),
          slug: slug.trim() || makeSlug(title),
          category: category.trim() || "راهنمای خرید و بررسی تخصصی",
          image_url: imageUrl.trim() || "/placeholder.png",
          meta_description: metaDescription.trim() || title.trim(),
          content: content.trim(),
          is_published: isPublished,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message || "✓ مقاله با موفقیت در دیتابیس ذخیره و منتشر شد.");
        resetForm();
        fetchPostsAndProducts();
      } else {
        notify(json.message || "خطا در ذخیره‌سازی مقاله.", "error");
      }
    } catch {
      notify("خطا در ارتباط با سرور.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("آیا از حذف این مقاله اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/blogs?id=" + encodeURIComponent(id), { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify("مقاله با موفقیت حذف شد.");
        if (editingId === id) resetForm();
        fetchPostsAndProducts();
      }
    } catch {
      notify("خطا در حذف مقاله.", "error");
    }
  };

  const filteredPosts = posts.filter((p) =>
    (p.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📚</span> مدیریت هوشمند مجله، وبلاگ و مقالات سئو (مجهز به اتصال خودکار کاتالوگ)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            با انتخاب هر محصول، موضوع، کلمه کلیدی، متا دیسکریپشن و لینک خرید مستقیم به صورت خودکار پر می‌شود
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={generatingAi}
            onClick={handleGenerateAiSeoPost}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-black text-xs shadow-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {generatingAi ? "در حال نگارش هوشمند..." : "🤖 تولید و انتشار فوری مقاله با AI"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer"
            >
              + مقاله جدید
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (statusMsg.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        <form
          onSubmit={handleSavePost}
          className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4"
        >
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/40 space-y-2">
            <label className="block font-black text-[var(--accent-blue)]">
              🎯 گام ۱: انتخاب محصول از کاتالوگ (پر شدن خودکار موضوع، کلمه کلیدی و کارت خرید):
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleSelectProductAutoFill(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer text-[var(--text-primary)]"
            >
              <option value="">-- انتخاب محصول از کاتالوگ برای پر کردن خودکار فرم مقاله --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  📦 {p.title} ({p.price.toLocaleString("fa-IR")} تومان)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                کلمه کلیدی هدف سئو (Target Keyword):
              </label>
              <input
                type="text"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="مثال: خرید و قیمت ..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">دسته‌بندی مقاله:</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان مقاله *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingId) setSlug(makeSlug(e.target.value));
                }}
                placeholder="عنوان جامع مقاله..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نامک (Slug):</label>
              <input
                type="text"
                dir="ltr"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">تصویر شاخص:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="px-3.5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer shrink-0"
                >
                  ☁️ آپلود
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                توضیحات متا سئو (Meta Description):
              </label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                محتوای کامل مقاله (پشتیبانی از تگ‌های HTML و لینک خرید) *
              </label>
              <textarea
                rows={8}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-loose"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded accent-[var(--accent-blue)]"
            />
            <span>انتشار مستقیم در مجله سایت و نقشه سایت گوگل (Sitemap)</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl cursor-pointer disabled:opacity-50"
          >
            {saving
              ? "در حال ذخیره در دیتابیس..."
              : editingId
              ? "💾 بروزرسانی مقاله"
              : "💾 ذخیره و انتشار مقاله سئو"}
          </button>
        </form>

        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 h-fit">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <h3 className="font-black text-sm">آرشیو مقالات منتشرشده ({posts.length})</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 جستجو در مقالات..."
              className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">در حال بارگذاری مقالات...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">مقاله‌ای یافت نشد.</div>
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 hover:border-[var(--accent-blue)] transition"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-14 h-12 rounded-xl object-cover shrink-0 border border-[var(--card-border)]"
                      />
                    )}
                    <div className="overflow-hidden space-y-0.5">
                      <h4 className="font-black text-xs truncate">{post.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400 block truncate">
                        /blog/{post.slug || post.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditPost(post)}
                      className="px-2.5 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold cursor-pointer"
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

      <MediaUploadModal
        isOpen={isUploadOpen}
        bucket="blog"
        title="آپلود تصویر شاخص مقاله سئو"
        currentValue={imageUrl}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(url) => setImageUrl(url)}
      />
    </div>
  );
}

export default AdminBlogManager;
