// File Path: components/AdminBlogManager.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  specs?: Record<string, any>;
}

export function AdminBlogManager() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [products, setProducts] = useState<CatalogProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const notify = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4500);
  };

  const fetchPostsAndProducts = useCallback(async () => {
    try {
      const [postsRes, prodsRes] = await Promise.all([
        fetch("/api/blogs?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
        fetch("/api/products?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
      ]);

      if (postsRes && postsRes.ok) {
        const bJson = await postsRes.json();
        const list = bJson.posts || bJson.data || [];
        setPosts(Array.isArray(list) ? list : []);
      }

      if (prodsRes && prodsRes.ok) {
        const pJson = await prodsRes.json();
        const pList = pJson.data || pJson.products || [];
        const mapped: CatalogProductItem[] = (Array.isArray(pList) ? pList : []).map(
          (p: any) => ({
            id: String(p.id),
            title: p.title || p.name || "کالای دیجیتال",
            category: p.category || "کالای دیجیتال و تکنولوژی",
            price: Number(p.discount_price || p.price || 0),
            image:
              p.image || (Array.isArray(p.images) && p.images[0]) || "/placeholder.png",
            warranty: p.warranty || "۱۸ ماه گارانتی اصالت طلایی",
            specs: p.specs || {},
          })
        );
        setProducts(mapped);
      }
    } catch (e) {
      console.error("Blog manager load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

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
      supabase.removeChannel(chProducts);
      supabase.removeChannel(chPosts);
    };
  }, [fetchPostsAndProducts]);

  const makeSlug = (val: string) =>
    val
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // پر شدن هوشمند و خودکار موضوع، کلمه کلیدی، متا و ساختار مقاله با انتخاب محصول از کاتالوگ
  const handleSelectProductAutoFill = (prodId: string) => {
    soundEngine.playClick();
    setSelectedProductId(prodId);
    if (!prodId) return;

    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const autoKey = "خرید و قیمت " + prod.title;
    const autoTitle = "بررسی تخصصی، مشخصات فنی و راهنمای خرید " + prod.title;
    const autoSlug = makeSlug(prod.title) + "-review";
    const autoMeta =
      `بررسی تخصصی ${prod.title} در دسته ${prod.category} به همراه جدول مشخصات فنی، ارزش خرید و سفارش آنلاین با بهترین قیمت (${prod.price.toLocaleString("fa-IR")} تومان) و ${prod.warranty} در آکسون کور.`.slice(
        0,
        160
      );

    const autoContent = [
      `<h2>معرفی و بررسی تخصصی ${prod.title}</h2>`,
      `<p>اگر به دنبال <strong>${autoKey}</strong> با تضمین اصالت و بالاترین استاندارد ساخت هستید، <strong>${prod.title}</strong> یکی از بهترین انتخاب‌های موجود در دسته <strong>${prod.category}</strong> به شمار می‌رود که تعادل فوق‌العاده‌ای میان کارایی، دوام و ارزش خرید ارائه می‌دهد.</p>`,
      `<h3>مهم‌ترین ویژگی‌ها و مزایای رقابتی ${prod.title}</h3>`,
      `<ul>`,
      `  <li><strong>کیفیت ساخت ممتاز:</strong> بهره‌گیری از متریال اورجینال و تست سلامت فیزیکی پیش از ارسال</li>`,
      `  <li><strong>سازگاری و پایداری بالا:</strong> عملکرد مطمئن در استفاده‌های روزمره و تخصصی</li>`,
      `  <li><strong>گارانتی معتبر:</strong> عرضه رسمی همراه با ${prod.warranty}</li>`,
      `</ul>`,
      `<h3>جدول مشخصات و استانداردهای کیفی ${prod.title}</h3>`,
      `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">`,
      `  <thead><tr style="background:rgba(2,132,199,0.15);"><th style="padding:10px;border:1px solid rgba(148,163,184,0.3);text-align:right;">شاخص بررسی</th><th style="padding:10px;border:1px solid rgba(148,163,184,0.3);text-align:right;">وضعیت در ${prod.title}</th></tr></thead>`,
      `  <tbody>`,
      `    <tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">دسته‌بندی تخصصی</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">${prod.category}</td></tr>`,
      `    <tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">پوشش گارانتی</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">${prod.warranty}</td></tr>`,
      `    <tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">قیمت روز در آکسون کور</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">${prod.price.toLocaleString("fa-IR")} تومان</td></tr>`,
      `  </tbody>`,
      `</table>`,
      `<h3>سوالات متداول خریداران درباره ${prod.title}</h3>`,
      `<p><strong>۱. آیا ${prod.title} با ضمانت اصالت عرضه می‌شود؟</strong><br/>بله، تمامی کالاهای آکسون کور همراه با ${prod.warranty} و تضمین سلامت فیزیکی ارسال می‌گردند.</p>`,
      `<h3>خرید مستقیم از کاتالوگ رسمی آکسون کور</h3>`,
      `<p>شما می‌توانید همین حالا <strong>${prod.title}</strong> را با قیمت ویژه <strong>${prod.price.toLocaleString("fa-IR")} تومان</strong> از طریق لینک زیر سفارش دهید:</p>`,
      `<p><a href="/products/${prod.id}"><strong>🛍️ مشاهده مشخصات کامل و خرید آنلاین ${prod.title} در فروشگاه آکسون کور ←</strong></a></p>`,
    ].join("\n\n");

    setTargetKeyword(autoKey);
    setTitle(autoTitle);
    setSlug(autoSlug);
    setCategory(prod.category || "راهنمای خرید و بررسی تخصصی");
    setMetaDescription(autoMeta);
    if (prod.image) setImageUrl(prod.image);
    if (!editingId || !content.trim()) setContent(autoContent);

    notify(
      `✓ ساختار مقاله، جدول مشخصات، متاتگ‌ها و لینک خرید بر اساس محصول «${prod.title}» تکمیل شد.`
    );
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
          targetProductId: selectedProductId || undefined,
          productId: selectedProductId || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message || "✓ مقاله سئو با هوش مصنوعی تولید و در مجله منتشر شد.");
        await fetchPostsAndProducts();
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
    soundEngine.playClick();
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
    setPreviewMode(false);
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
    setPreviewMode(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleTogglePublishQuick = async (post: BlogPostItem) => {
    soundEngine.playClick();
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_publish",
          id: post.id,
          is_published: !post.is_published,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        await fetchPostsAndProducts();
      }
    } catch {}
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
        await fetchPostsAndProducts();
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
      const res = await fetch("/api/blogs?id=" + encodeURIComponent(id), {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify("✓ مقاله با موفقیت حذف شد.");
        if (editingId === id) resetForm();
        await fetchPostsAndProducts();
      }
    } catch {
      notify("خطا در حذف مقاله.", "error");
    }
  };

  // ابزارهای درج سریع بلوک‌های HTML سئو
  const appendHtmlSnippet = (snippet: string) => {
    soundEngine.playClick();
    setContent((prev) => (prev.trim() ? prev + "\n\n" + snippet : snippet));
  };

  const injectComparisonTableSnippet = () => {
    const selProd = products.find((p) => p.id === selectedProductId) || products[0];
    const pName = selProd ? selProd.title : "محصول منتخب آکسون کور";
    const pHref = selProd ? "/products/" + selProd.id : "/products";
    const snippet = [
      `<h3>جدول مقایسه فنی و ارزش خرید ${pName}</h3>`,
      `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">`,
      `  <thead><tr style="background:rgba(2,132,199,0.15);"><th style="padding:10px;border:1px solid rgba(148,163,184,0.3);text-align:right;">ویژگی تخصصی</th><th style="padding:10px;border:1px solid rgba(148,163,184,0.3);text-align:right;">نسخه‌های متداول بازار</th><th style="padding:10px;border:1px solid rgba(148,163,184,0.3);text-align:right;">${pName} در آکسون کور</th></tr></thead>`,
      `  <tbody>`,
      `    <tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">کیفیت ساخت و اصالت</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">متغیر و بدون تست</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">اورجینال با تضمین ۱۰۰٪ سلامت فیزیکی</td></tr>`,
      `    <tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">گارانتی و پشتیبانی</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">فاقد ضمانت معتبر</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">۱۸ ماه گارانتی اصالت طلایی آکسون</td></tr>`,
      `  </tbody>`,
      `</table>`,
      `<p><a href="${pHref}"><strong>🛒 مشاهده قیمت روز و خرید مستقیم ${pName} ←</strong></a></p>`,
    ].join("\n");
    appendHtmlSnippet(snippet);
  };

  const injectFaqSnippet = () => {
    const selProd = products.find((p) => p.id === selectedProductId);
    const pName = selProd ? selProd.title : title || "این محصول";
    const snippet = [
      `<h3>سوالات متداول خریداران درباره ${pName}</h3>`,
      `<p><strong>۱. آیا ${pName} دارای گارانتی و ضمانت اصالت است؟</strong><br/>بله، تمامی محصولات عرضه‌شده در آکسون کور با تضمین ۱۰۰٪ اصالت فیزیکی و گارانتی معتبر ارائه می‌شوند.</p>`,
      `<p><strong>۲. نحوه ارسال سفارش به شهرستان‌ها چگونه است؟</strong><br/>تمامی سفارش‌ها در بسته‌بندی ایمن و ضدضربه از طریق پست پیشتاز به سراسر ایران ارسال شده و کد رهگیری پیامک می‌گردد.</p>`,
    ].join("\n");
    appendHtmlSnippet(snippet);
  };

  const injectProductCtaBox = () => {
    const selProd = products.find((p) => p.id === selectedProductId) || products[0];
    if (!selProd) return;
    const snippet = `<div style="margin:20px 0;padding:18px;border-radius:18px;background:rgba(2,132,199,0.12);border:1px solid rgba(56,189,248,0.35);"><h4>🛍️ سفارش آنلاین ${selProd.title}</h4><p>هم‌اکنون می‌توانید <strong>${selProd.title}</strong> را با قیمت <strong>${selProd.price.toLocaleString("fa-IR")} تومان</strong> و ${selProd.warranty} از آکسون کور تهیه کنید:</p><p><a href="/products/${selProd.id}"><strong>🔗 مشاهده مشخصات و خرید مستقیم ${selProd.title} ←</strong></a></p></div>`;
    appendHtmlSnippet(snippet);
  };

  const wordCount = content
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const hasH2 = /<h2/i.test(content);
  const hasProductLink = /\/products\//i.test(content);
  const hasTable = /<table/i.test(content);
  const hasStandardTitle = title.trim().length >= 20;
  const hasStandardMeta = metaDescription.trim().length >= 50;

  const liveBlogSeoScore = Math.min(
    100,
    20 +
      (hasStandardTitle ? 15 : 0) +
      (hasStandardMeta ? 15 : 0) +
      (wordCount >= 120 ? 20 : Math.round((wordCount / 120) * 20)) +
      (hasH2 ? 10 : 0) +
      (hasProductLink ? 10 : 0) +
      (hasTable ? 10 : 0)
  );

  const filteredPosts = posts.filter((p) => {
    if (statusFilter === "published" && p.is_published === false) return false;
    if (statusFilter === "draft" && p.is_published !== false) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.slug || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📚</span> مدیریت هوشمند مجله، وبلاگ و مقالات سئو (مجهز به اتصال خودکار کاتالوگ)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            با انتخاب هر محصول، موضوع، کلمه کلیدی، متا دیسکریپشن، جدول مشخصات و لینک خرید مستقیم به صورت خودکار پر می‌شود
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={generatingAi}
            onClick={handleGenerateAiSeoPost}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-black text-xs shadow-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {generatingAi ? "⏳ در حال نگارش هوشمند..." : "🤖 تولید و انتشار فوری مقاله با AI"}
          </button>
          <Link
            href="/blog"
            target="_blank"
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-sky-500 text-xs font-bold flex items-center gap-1.5"
          >
            <span>مشاهده مجله سایت</span>
            <span>🔗</span>
          </Link>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-black cursor-pointer"
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

      {/* گرید استاندارد ۱۲ ستونی: ۷ ستون فرم ویرایشگر و ۵ ستون آرشیو مقالات */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
        <form
          onSubmit={handleSavePost}
          className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4"
        >
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/40 space-y-2">
            <label className="block font-black text-[var(--accent-blue)]">
              🎯 گام ۱: انتخاب محصول از کاتالوگ (پر شدن خودکار موضوع، کلمه کلیدی، جدول و کارت خرید):
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleSelectProductAutoFill(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer text-[var(--text-primary)]"
            >
              <option value="">
                -- انتخاب محصول از کاتالوگ برای پر کردن خودکار فرم مقاله --
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  📦 {p.title} ({p.price.toLocaleString("fa-IR")} تومان)
                </option>
              ))}
            </select>
          </div>

          {/* گرید ۲ ستونه تمیز و متقارن برای فیلدهای فرم */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
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
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                دسته‌بندی مقاله:
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                عنوان مقاله *
              </label>
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
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                نامک (Slug):
              </label>
              <input
                type="text"
                dir="ltr"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article-slug"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                تصویر شاخص مقاله:
              </label>
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
              <div className="flex justify-between mb-1.5">
                <label className="font-bold text-[var(--text-secondary)]">
                  توضیحات متا سئو (Meta Description):
                </label>
                <span className="font-mono text-[10px] text-slate-400">
                  {metaDescription.length} / 160 کاراکتر
                </span>
              </div>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="خلاصه سئو برای نمایش در نتایج گوگل..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed"
              />
            </div>

            {/* چک‌لیست زنده سئو و ویرایشگر محتوای کامل */}
            <div className="sm:col-span-2 space-y-2.5">
              <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black text-[var(--accent-blue)]">
                    📊 رادار زنده کیفیت سئوی مقاله:
                  </span>
                  <span
                    className={
                      "px-3 py-1 rounded-xl font-mono font-black text-[11px] " +
                      (liveBlogSeoScore >= 85
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400")
                    }
                  >
                    امتیاز زنده سئو: {liveBlogSeoScore}/100 ({wordCount} کلمه)
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                  <span
                    className={
                      "px-2 py-1 rounded-lg " +
                      (hasStandardTitle
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-slate-500/15 text-slate-400")
                    }
                  >
                    {hasStandardTitle ? "✓" : "○"} طول عنوان استاندارد
                  </span>
                  <span
                    className={
                      "px-2 py-1 rounded-lg " +
                      (hasStandardMeta
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-slate-500/15 text-slate-400")
                    }
                  >
                    {hasStandardMeta ? "✓" : "○"} متا دیسکریپشن
                  </span>
                  <span
                    className={
                      "px-2 py-1 rounded-lg " +
                      (hasH2
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-slate-500/15 text-slate-400")
                    }
                  >
                    {hasH2 ? "✓" : "○"} زیرعنوان H2
                  </span>
                  <span
                    className={
                      "px-2 py-1 rounded-lg " +
                      (hasTable
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-slate-500/15 text-slate-400")
                    }
                  >
                    {hasTable ? "✓" : "○"} جدول مقایسه
                  </span>
                  <span
                    className={
                      "px-2 py-1 rounded-lg " +
                      (hasProductLink
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-slate-500/15 text-slate-400")
                    }
                  >
                    {hasProductLink ? "✓" : "○"} لینک داخلی محصول
                  </span>
                </div>
              </div>

              {/* نوار ابزار درج سریع تگ‌های HTML و بلوک‌های فروش */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => appendHtmlSnippet("<h2>عنوان بخش جدید</h2>\n<p>متن توضیح این بخش...</p>")}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-[11px] cursor-pointer"
                  >
                    + تیتر H2
                  </button>
                  <button
                    type="button"
                    onClick={() => appendHtmlSnippet("<h3>زیرعنوان تخصصی</h3>\n<p>توضیحات تکمیلی...</p>")}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-[11px] cursor-pointer"
                  >
                    + زیرتیتر H3
                  </button>
                  <button
                    type="button"
                    onClick={injectComparisonTableSnippet}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--accent-blue)] text-[var(--accent-blue)] font-black text-[11px] cursor-pointer"
                  >
                    + جدول مقایسه فنی
                  </button>
                  <button
                    type="button"
                    onClick={injectFaqSnippet}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-emerald-500 font-bold text-[11px] cursor-pointer"
                  >
                    + سوالات متداول (FAQ)
                  </button>
                  <button
                    type="button"
                    onClick={injectProductCtaBox}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[11px] cursor-pointer"
                  >
                    + باکس خرید کالا
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={
                    "px-3 py-1.5 rounded-xl font-black text-[11px] cursor-pointer border " +
                    (previewMode
                      ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                      : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]")
                  }
                >
                  {previewMode ? "✏️ بازگشت به ویرایشگر کد" : "👁️ پیش‌نمایش زنده مقاله"}
                </button>
              </div>

              {previewMode ? (
                <div
                  className="w-full min-h-[260px] p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/50 leading-loose space-y-3 overflow-y-auto max-h-[420px]"
                  dangerouslySetInnerHTML={{
                    __html: content || "<p>هنوز محتوایی وارد نشده است...</p>",
                  }}
                />
              ) : (
                <textarea
                  rows={10}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="محتوای کامل مقاله (پشتیبانی از تگ‌های HTML، جدول و لینک خرید)..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-loose focus:border-[var(--accent-blue)]"
                />
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 font-bold cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--accent-blue)] cursor-pointer"
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
              ? "💾 بروزرسانی و ذخیره تغییرات مقاله"
              : "💾 ذخیره و انتشار مقاله سئو"}
          </button>
        </form>

        {/* ستون چپ (۵ ستون): آرشیو مقالات منتشرشده */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 h-fit">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <h3 className="font-black text-sm">
              آرشیو مقالات مجله ({posts.length})
            </h3>
            <div className="flex gap-1 text-[10px] font-bold">
              {[
                { id: "all", label: "همه" },
                { id: "published", label: "منتشرشده" },
                { id: "draft", label: "پیش‌نویس" },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id as any)}
                  className={
                    "px-2.5 py-1 rounded-lg cursor-pointer " +
                    (statusFilter === st.id
                      ? "bg-[var(--accent-blue)] text-white"
                      : "bg-[var(--input-bg)] text-[var(--text-secondary)]")
                  }
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 جستجو در عنوان یا دسته‌بندی مقالات..."
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />

          {loading ? (
            <div className="py-12 text-center text-slate-400 font-bold">
              در حال بارگذاری مقالات...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <p className="font-bold">هنوز مقاله‌ای در این بخش ثبت نشده است.</p>
              <button
                type="button"
                disabled={generatingAi}
                onClick={handleGenerateAiSeoPost}
                className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer"
              >
                🤖 تولید اولین مقاله سئو با ۱ کلیک
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={
                    "p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition " +
                    (editingId === post.id
                      ? "bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]"
                      : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--accent-blue)]/50")
                  }
                >
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-14 h-12 rounded-xl object-cover shrink-0 border border-[var(--card-border)]"
                      />
                    )}
                    <div className="overflow-hidden space-y-0.5 min-w-0">
                      <h4 className="font-black text-xs truncate">{post.title}</h4>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleTogglePublishQuick(post)}
                          className={
                            "px-2 py-0.5 rounded font-bold cursor-pointer " +
                            (post.is_published !== false
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400")
                          }
                        >
                          {post.is_published !== false ? "منتشرشده ✓" : "پیش‌نویس"}
                        </button>
                        <span className="font-mono text-slate-400 truncate" dir="ltr">
                          /blog/{post.slug || post.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/blog/${encodeURIComponent(post.slug || post.id)}`}
                      target="_blank"
                      className="px-2.5 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-sky-500 font-bold"
                      title="مشاهده مقاله در سایت"
                    >
                      🔗
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleEditPost(post)}
                      className="px-2.5 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold cursor-pointer"
                      title="ویرایش مقاله"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold cursor-pointer transition"
                      title="حذف مقاله"
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