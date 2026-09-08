"use client";

import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { fontEngine, CustomFontItem } from "@/lib/fontEngine";
import { productService, Product } from "@/services/productService";
import { supabase } from "@/lib/supabase";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  category?: string;
  imageUrl?: string;
  image_url?: string;
  metaDescription?: string;
  meta_description?: string;
  isPublished?: boolean;
  is_published?: boolean;
  createdAt?: string;
  created_at?: string;
}

export default function AdminBlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("راهنمای خرید و بررسی");
  const [imageUrl, setImageUrl] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [availableFonts, setAvailableFonts] = useState<CustomFontItem[]>([]);
  const [selectedFontFamily, setSelectedFontFamily] = useState("Vazirmatn");
  const [selectedFontWeight, setSelectedFontWeight] = useState(400);

  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readTime, setReadTime] = useState(1);

  // بخش دستیار هوش مصنوعی
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiCustomTopic, setAiCustomTopic] = useState("");
  const [aiTargetKeyword, setAiTargetKeyword] = useState("");
  const [aiSelectedProductId, setAiSelectedProductId] = useState<string>("all");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const fontUploadInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    try {
      const [res, prods] = await Promise.all([
        fetch("/api/blogs", { cache: "no-store" }),
        productService.getAll(),
      ]);
      const data = await res.json();
      if (data.data || data.posts) {
        setPosts(data.data || data.posts || []);
      }
      if (prods) setProducts(prods);
    } catch (e) {
      console.error("Error loading blog posts:", e);
    }
  };

  useEffect(() => {
    fetchPosts();
    setAvailableFonts(fontEngine.getAllFonts());

    // اتصال بلادرنگ به تغییرات مقالات در دیتابیس
    const channel = supabase
      .channel("realtime-blog-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    setWordCount(words);
    setCharCount(chars);
    setReadTime(Math.max(1, Math.ceil(words / 220)));
  };

  const handleSelectPost = (p: BlogPost) => {
    soundEngine.playClick();
    setSelectedPost(p);
    setTitle(p.title);
    setSlug(p.slug);
    setCategory(p.category || "راهنمای خرید و بررسی");
    setImageUrl(p.imageUrl || p.image_url || "");
    setMetaDescription(p.metaDescription || p.meta_description || "");
    setIsPublished(p.isPublished !== false && p.is_published !== false);

    if (editorRef.current) {
      editorRef.current.innerHTML = p.content || "";
      setTimeout(updateStats, 100);
    }
  };

  const handleCreateNew = () => {
    soundEngine.playClick();
    setSelectedPost(null);
    setTitle("");
    setSlug("");
    setCategory("راهنمای خرید و بررسی");
    setImageUrl("");
    setMetaDescription("");
    setIsPublished(true);

    if (editorRef.current) {
      editorRef.current.innerHTML = "<h2>مقدمه و بررسی تخصصی</h2><p>متن تحلیل خود را اینجا آغاز کنید یا از دکمه «تولید مقاله با هوش مصنوعی» استفاده نمایید...</p>";
      setTimeout(updateStats, 100);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    soundEngine.playClick();
    document.execCommand(command, false, value);
    updateStats();
  };

  const handleFontChange = (fontFamily: string) => {
    soundEngine.playClick();
    setSelectedFontFamily(fontFamily);
    if (editorRef.current) {
      editorRef.current.style.fontFamily = `'${fontFamily}', sans-serif`;
    }
  };

  const handleWeightChange = (weight: number) => {
    soundEngine.playClick();
    setSelectedFontWeight(weight);
    if (editorRef.current) {
      editorRef.current.style.fontWeight = String(weight);
    }
  };

  // حذف مستقیم مقاله از دیتابیس
  const handleDeletePost = async (id: string, postTitle: string) => {
    if (!confirm(`آیا از حذف کامل مقاله «${postTitle}» از پایگاه داده اطمینان دارید؟`)) return;
    soundEngine.playClick();
    try {
      const res = await fetch(`/api/blogs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setStatusMessage({ type: "success", text: "✓ مقاله با موفقیت از سیستم حذف گردید." });
        if (selectedPost?.id === id) handleCreateNew();
        fetchPosts();
      } else {
        alert(json.message || "خطا در حذف مقاله.");
      }
    } catch {
      alert("خطا در برقراری ارتباط با سرور.");
    } finally {
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // تولید مقاله سئو رنک ۱ با هوش مصنوعی و تزریق دکمه‌های خرید
  const handleGenerateAiSeoArticle = async () => {
    soundEngine.playClick();
    setIsAiGenerating(true);

    let targetProducts = products;
    if (aiSelectedProductId !== "all") {
      targetProducts = products.filter((p) => String(p.id) === String(aiSelectedProductId));
    }

    try {
      const prompt = `به عنوان متخصص ارشد سئو فنی و تولید محتوا برای فروشگاه تخصصی آکسون (مرجع مانیتورهای 5K و سخت‌افزار استودیو):
موضوع: ${aiCustomTopic || "بررسی و راهنمای خرید مانیتورهای حرفه‌ای تدوین"}
کلمه کلیدی هدف سئو: ${aiTargetKeyword || "خرید مانیتور 5K"}
محصولات مرتبط برای لینک‌دهی: ${targetProducts.map(p => p.title).join(", ")}

یک مقاله ۲۵۰۰ کلمه‌ای، فوق تخصصی با ساختار تمیز HTML (شامل H2, H3, پاراگراف‌های جاستیفای، جدول مقایسه مشخصات فنی و کال تو اکشن خرید) بنویس.
همچنین یک عنوان جذاب H1 و یک متادسکریپشن ۱۵۰ کاراکتری ارائه بده.`;

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "admin",
          prompt,
          targetTopic: aiCustomTopic,
          productsData: targetProducts,
        }),
      });

      const data = await res.json();
      if (data.success && data.response) {
        soundEngine.playSuccess();
        const raw = data.response;

        const generatedTitle = aiCustomTopic.trim() || (targetProducts[0]?.title ? `راهنمای خرید و بررسی تخصصی ${targetProducts[0].title}` : "راهنمای جامع تجهیزات استودیویی");
        setTitle(generatedTitle);
        setSlug(generatedTitle.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-"));
        setMetaDescription(`بررسی تخصصی، مقایسه گاموت رنگی و راهنمای خرید ${generatedTitle} با ضمانت اصالت طلایی و ارسال سریع در فروشگاه آکسون.`);

        if (editorRef.current) {
          editorRef.current.innerHTML = raw;
          updateStats();
        }

        setIsAiModalOpen(false);
        setStatusMessage({ type: "success", text: "✓ مقاله رنک ۱ گوگل با استانداردهای کامل سئو و متادیتا در ویراستار بارگذاری شد." });
      }
    } catch {
      alert("خطا در ارتباط با هوش مصنوعی.");
    } finally {
      setIsAiGenerating(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const contentHtml = editorRef.current?.innerHTML || "";

    if (!title.trim() || !contentHtml.trim()) {
      setStatusMessage({ type: "error", text: "عنوان و محتوای مقاله الزامی هستند." });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const cleanSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/\s+/g, "-")
      : title.trim().toLowerCase().replace(/\s+/g, "-");

    const payload = {
      id: selectedPost?.id,
      title: title.trim(),
      slug: cleanSlug,
      content: contentHtml,
      category,
      imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      image_url: imageUrl.trim() || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      metaDescription: metaDescription.trim() || title.trim(),
      meta_description: metaDescription.trim() || title.trim(),
      isPublished,
      is_published: isPublished,
    };

    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setStatusMessage({ type: "success", text: "✓ مقاله با موفقیت در دیتابیس ذخیره و در مجله سایت منتشر شد." });
        fetchPosts();
        if (!selectedPost && data.data) {
          setSelectedPost(data.data);
        }
      } else {
        setStatusMessage({ type: "error", text: data.message || "خطا در ذخیره‌سازی مقاله." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "خطا در برقراری ارتباط با سرور." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <input type="file" ref={fontUploadInputRef} accept=".woff2,.woff,.ttf,.otf" className="hidden" />

      {/* سربرگ بخش نگارش مقالات */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📚</span> ویراستار مقالات سئو با هوش مصنوعی و تایپوگرافی جهانی
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تولید خودکار مقالات رنک ۱ گوگل با لینک‌دهی داخلی، اسکیما مارک‌آپ، مدیریت مستقیم و ذخیره در دیتابیس
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { soundEngine.playClick(); setIsAiModalOpen(true); }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <span>🤖</span>
            <span>تولید مقاله با هوش مصنوعی (رنک ۱ گوگل)</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="px-5 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer"
          >
            + نگارش دستی
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={"p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " + (statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-rose-500/15 text-rose-600 border border-rose-500/30")}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ستون سمت راست: لیست مقالات با دکمه‌های مستقیم ویرایش (✏️) و حذف (🗑️) */}
        <div className="lg:col-span-4 bg-[var(--modal-bg)] p-4 sm:p-5 rounded-3xl border border-[var(--card-border)] space-y-3 shadow-xl h-fit">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <h3 className="text-xs font-black">
              📑 مقالات منتشر شده ({posts.length})
            </h3>
            <button onClick={handleCreateNew} className="text-[11px] text-[var(--accent-blue)] font-bold hover:underline cursor-pointer">
              + مقاله جدید
            </button>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {posts.length === 0 ? (
              <p className="text-xs text-center py-12 text-slate-400 font-bold">هنوز مقاله‌ای ثبت نشده است.</p>
            ) : (
              posts.map((p) => (
                <div
                  key={p.id}
                  className={"p-3 rounded-2xl border transition flex items-center justify-between gap-2 " + (
                    selectedPost?.id === p.id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-sm"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                  )}
                >
                  <div
                    onClick={() => handleSelectPost(p)}
                    className="overflow-hidden flex-1 cursor-pointer space-y-1"
                  >
                    <h4 className="text-xs font-black truncate">{p.title}</h4>
                    <span className="text-[10px] text-[var(--accent-blue)] font-bold block">{p.category || "مقاله تخصصی"}</span>
                  </div>

                  {/* دکمه‌های مستقیم ویرایش و حذف در کارت */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectPost(p)}
                      className="p-1.5 px-2 rounded-xl bg-[var(--modal-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold transition cursor-pointer"
                      title="ویرایش مقاله"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(p.id, p.title);
                      }}
                      className="p-1.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 text-xs font-bold transition cursor-pointer"
                      title="حذف کامل از دیتابیس"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ستون سمت چپ: بوم نگارش، ویرایش و نوار ابزار پیشرفته */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] space-y-6 shadow-xl text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">عنوان اصلی مقاله (H1) *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مقایسه جامع مانیتورهای ۵K و ۴K برای تدوین"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">دسته‌بندی موضوعی</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="مثال: راهنمای خرید و بررسی تخصصی"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نامک انگلیسی آدرس (Slug)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="5k-vs-4k-monitors-editing"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">تصویر شاخص مقاله (URL)</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1.5">توضیحات متای سئو (Meta Description)</label>
              <input
                type="text"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="خلاصه جذاب برای گوگل (حداکثر ۱۶۰ کاراکتر)..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            {/* نوار ابزار پیشرفته */}
            <div className="space-y-3 border-t border-[var(--card-border)] pt-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="font-bold text-[var(--text-secondary)]">🎛️ نوار ابزار پیشرفته و تایپوگرافی لایو:</span>
                <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-secondary)]">
                  <span>کلمات: <strong>{wordCount}</strong></span>
                  <span>کاراکترها: <strong>{charCount}</strong></span>
                  <span>زمان مطالعه: <strong>~{readTime} دقیقه</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-inner">
                <select
                  value={selectedFontFamily}
                  onChange={(e) => handleFontChange(e.target.value)}
                  className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer outline-none"
                >
                  {availableFonts.map((f) => (
                    <option key={f.id} value={f.fontFamily}>
                      {f.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedFontWeight}
                  onChange={(e) => handleWeightChange(Number(e.target.value))}
                  className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer outline-none font-mono"
                >
                  <option value={100}>100 - نازک (Thin)</option>
                  <option value={300}>300 - روشن (Light)</option>
                  <option value={400}>400 - عادی (Regular)</option>
                  <option value={500}>500 - متوسط (Medium)</option>
                  <option value={600}>600 - نیمه‌ضخیم (SemiBold)</option>
                  <option value={700}>700 - ضخیم (Bold)</option>
                  <option value={800}>800 - خیلی ضخیم (ExtraBold)</option>
                  <option value={900}>900 - توپر (Black)</option>
                </select>

                <div className="w-[1px] h-6 bg-[var(--card-border)] mx-1" />

                <button type="button" onClick={() => exec("bold")} className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-black text-xs" title="Bold"><b>B</b></button>
                <button type="button" onClick={() => exec("italic")} className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] italic text-xs" title="Italic"><i>I</i></button>
                <button type="button" onClick={() => exec("underline")} className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] underline text-xs" title="Underline"><u>U</u></button>

                <div className="w-[1px] h-6 bg-[var(--card-border)] mx-1" />

                <div className="flex items-center gap-1 bg-[var(--modal-bg)] p-1 rounded-xl border border-[var(--card-border)]">
                  <span className="text-[10px] font-bold px-1">رنگ:</span>
                  <input type="color" onChange={(e) => exec("foreColor", e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none" />
                </div>

                <button type="button" onClick={() => exec("justifyRight")} className="p-2 px-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs" title="راست‌چین">👉</button>
                <button type="button" onClick={() => exec("justifyFull")} className="p-2 px-3 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs" title="Justify">≡ جاستیفای</button>
              </div>
            </div>

            {/* بوم نگارش مقاله */}
            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)] block">محیط نگارش زنده سند (WYSIWYG Live Canvas):</label>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={updateStats}
                className="w-full min-h-[420px] max-h-[600px] overflow-y-auto p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-loose text-xs focus:border-[var(--accent-blue)] shadow-inner text-[var(--text-primary)] transition-all"
                style={{
                  textAlign: "justify",
                  fontFamily: `'${selectedFontFamily}', sans-serif`,
                  fontWeight: selectedFontWeight,
                }}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="blogPublishedCheckbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5 rounded-lg text-[var(--accent-blue)] cursor-pointer"
              />
              <label htmlFor="blogPublishedCheckbox" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                مقاله فعال و در مجله تخصصی سایت منتشر شود
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 shadow-xl shadow-blue-500/25 disabled:opacity-50"
              >
                {saving ? "در حال ذخیره‌سازی در دیتابیس..." : "💾 ذخیره و انتشار کامل مقاله در مجله"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* مدال هوش مصنوعی تولید مقالات رنک ۱ گوگل با کلمات کلیدی */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-xl w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 sm:p-8 space-y-5 text-xs shadow-2xl text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                <h3 className="font-black text-sm text-[var(--accent-blue)]">دستیار فوق هوشمند نگارش مقاله رنک ۱ گوگل</h3>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">
                  کالای هدف جهت تزریق دکمه خرید مستقیم و مشخصات فنی:
                </label>
                <select
                  value={aiSelectedProductId}
                  onChange={(e) => setAiSelectedProductId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="all">🌟 تمامی محصولات فروشگاه (مقاله جامع مقایسه‌ای)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      📦 {p.title || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">
                  موضوع و سرفصل مقاله:
                </label>
                <input
                  type="text"
                  value={aiCustomTopic}
                  onChange={(e) => setAiCustomTopic(e.target.value)}
                  placeholder="مثال: مقایسه جامع مانیتورهای ۵K و ۴K برای ادیتورها و کالریست‌ها در سال ۲۰۲۶"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">
                  کلمه کلیدی اصلی سئو (Focus Keyword):
                </label>
                <input
                  type="text"
                  value={aiTargetKeyword}
                  onChange={(e) => setAiTargetKeyword(e.target.value)}
                  placeholder="مثال: خرید مانیتور تدوین رنگ 5K"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 leading-relaxed font-medium">
                ⚡ هوش مصنوعی مقاله را با چگالی استاندارد کلمات کلیدی، عناوین جذاب، اسلاگ، تگ‌های معنایی و جدول مقایسه تولید و در ویراستار قرار خواهد داد.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] font-bold text-[var(--text-secondary)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isAiGenerating}
                onClick={handleGenerateAiSeoArticle}
                className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isAiGenerating ? "در حال تولید مهندسی‌شده مقاله..." : "نگارش هوشمند سئو 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
