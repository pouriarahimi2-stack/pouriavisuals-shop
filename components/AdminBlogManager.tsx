
// components/AdminBlogManager.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const [category, setCategory] = useState("راهنمای خرید و بررسی");
  const [imageUrl, setImageUrl] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      if (data.posts || data.data) {
        setPosts(data.posts || data.data || []);
      }
    } catch (e) {
      console.error("Error loading blog posts:", e);
    }
  };

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("posts-realtime-master-v5")
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
    setCategory(p.category || "راهنمای خرید و بررسی");
    setImageUrl(p.imageUrl || p.image_url || "");
    setMetaDescription(p.metaDescription || p.meta_description || "");
    setIsPublished(p.isPublished !== false && p.is_published !== false);

    if (editorRef.current) {
      editorRef.current.innerHTML = p.content || "";
    }
  };

  const handleCreateNew = () => {
    setSelectedPost(null);
    setTitle("");
    setSlug("");
    setCategory("راهنمای خرید و بررسی");
    setImageUrl("");
    setMetaDescription("");
    setIsPublished(true);

    if (editorRef.current) {
      editorRef.current.innerHTML = "<h2>مقدمه و بررسی تخصصی</h2><p>متن خود را با ابزارهای نوار بالا ویرایش کنید...</p>";
    }
  };

  // دستورات نوار ابزار Word-Like
  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  const insertHeading = (tag: string) => {
    exec("formatBlock", `<${tag}>`);
  };

  const insertTable = () => {
    const rows = prompt("تعداد سطرها:", "3") || "3";
    const cols = prompt("تعداد ستون‌ها:", "3") || "3";
    let tableHtml = `<table border="1" style="width:100%; border-collapse:collapse; margin:16px 0; border:1px solid var(--card-border);"><thead><tr style="background:var(--input-bg);">`;
    for (let c = 0; c < Number(cols); c++) {
      tableHtml += `<th style="padding:10px; border:1px solid var(--card-border); font-weight:bold;">سرستون ${c + 1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < Number(rows) - 1; r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < Number(cols); c++) {
        tableHtml += `<td style="padding:10px; border:1px solid var(--card-border);">متن سطر ${r + 1}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;
    exec("insertHTML", tableHtml);
  };

  const insertQuote = () => {
    const quoteHtml = `<blockquote style="border-right:4px solid var(--accent-blue); padding:12px 18px; margin:14px 0; background:rgba(0,113,227,0.08); border-radius:12px; font-style:italic;">نقل قول یا نکته مهم را اینجا بنویسید...</blockquote><p><br></p>`;
    exec("insertHTML", quoteHtml);
  };

  const insertLink = () => {
    const url = prompt("آدرس اینترنتی پیوند (URL):", "https://");
    if (url) exec("createLink", url);
  };

  const handleImageUploadToEditor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const imgHtml = `<img src="${reader.result}" alt="Blog Image" style="max-width:100%; height:auto; border-radius:16px; margin:16px 0; border:1px solid var(--card-border);" /><p><br></p>`;
          exec("insertHTML", imgHtml);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const contentHtml = editorRef.current?.innerHTML || "";

    if (!title.trim() || !contentHtml.trim()) {
      setStatusMessage({ type: "error", text: "عنوان و متن مقاله الزامی هستند." });
      return;
    }

    setSaving(true);
    const cleanSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/\s+/g, "-")
      : title.trim().toLowerCase().replace(/\s+/g, "-");

    const payload = {
      id: selectedPost?.id,
      title: title.trim(),
      slug: cleanSlug,
      content: contentHtml,
      category,
      imageUrl,
      image_url: imageUrl,
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

      if (data.success) {
        setStatusMessage({ type: "success", text: "⚡ مقاله سئو با موفقیت ذخیره و در مجله سایت منتشر شد." });
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
    if (!confirm("آیا از حذف کامل این مقاله اطمینان دارید؟")) return;
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
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <input type="file" ref={imageUploadInputRef} onChange={handleImageUploadToEditor} accept="image/*" className="hidden" />

      {/* سربرگ مدیریت مقالات */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📚</span> ویراستار پیشرفته اسناد، مقالات و پایگاه دانش سئو (WYSIWYG Pro)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">نگارش محتوای غنی با نوار ابزار کامل مایکروسافت ورد، جداول پیشرفته، فونت‌ها و پیش‌نمایش در گوگل</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer flex items-center gap-2"
        >
          <span>➕</span>
          <span>نگارش مقاله جدید</span>
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* لیست مقالات سایدبار */}
        <div className="lg:col-span-1 bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-3 shadow-xl h-fit">
          <h3 className="text-xs font-black border-b border-[var(--card-border)] pb-3">
            📑 مقالات منتشر شده ({posts.length})
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {posts.length === 0 ? (
              <p className="text-xs text-center py-10 text-[var(--text-secondary)]">هنوز مقاله‌ای ثبت نشده است.</p>
            ) : (
              posts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPost(p)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    selectedPost?.id === p.id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 shadow-sm"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                  }`}
                >
                  <div className="overflow-hidden flex-1">
                    <h4 className="text-xs font-black truncate">{p.title}</h4>
                    <span className="text-[10px] text-[var(--accent-blue)] font-bold">{p.category || "مقاله"}</span>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${p.isPublished !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ویرایشگر کامل متن و سئو */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] space-y-6 shadow-xl text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">عنوان اصلی مقاله (H1) *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مقایسه مانیتورهای ۴K و ۸K برای تدوین و کالرگریدینگ"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">دسته‌بندی موضوعی</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="مثال: راهنمای خرید مانیتور"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نامک انگلیسی آدرس (Slug)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="4k-vs-8k-video-editing-monitors"
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
                placeholder="خلاصه مقاله جهت نمایش در نتایج موتورهای جستجو..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            {/* نوار ابزار کامل مشابه مایکروسافت ورد */}
            <div className="space-y-2 border-t border-[var(--card-border)] pt-4">
              <label className="font-bold text-[var(--text-secondary)] block">نوار ابزار حرفه‌ای ویرایش متن:</label>
              <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-inner">
                <select onChange={(e) => insertHeading(e.target.value)} className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer outline-none">
                  <option value="p">پاراگراف (متن عادی)</option>
                  <option value="h1">تیتر ۱ (H1)</option>
                  <option value="h2">تیتر ۲ (H2)</option>
                  <option value="h3">تیتر ۳ (H3)</option>
                  <option value="h4">تیتر ۴ (H4)</option>
                </select>

                <div className="w-[1px] h-6 bg-[var(--card-border)] mx-1" />

                <button type="button" onClick={() => exec("bold")} className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-black text-xs hover:border-[var(--accent-blue)]" title="Bold"><b>B</b></button>
                <button type="button" onClick={() => exec("italic")} className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] italic text-xs hover:border-[var(--accent-blue)]" title="Italic"><i>I</i></button>
                <button type="button" onClick={() => exec("underline")} className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] underline text-xs hover:border-[var(--accent-blue)]" title="Underline"><u>U</u></button>
                <button type="button" onClick={() => exec("strikeThrough")} className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] line-through text-xs hover:border-[var(--accent-blue)]" title="Strike">S</button>

                <div className="w-[1px] h-6 bg-[var(--card-border)] mx-1" />

                <button type="button" onClick={() => exec("justifyRight")} className="p-2 px-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs" title="راست‌چین">👉</button>
                <button type="button" onClick={() => exec("justifyCenter")} className="p-2 px-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs" title="وسط‌چین">↔️</button>
                <button type="button" onClick={() => exec("justifyLeft")} className="p-2 px-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs" title="چپ‌چین">👈</button>
                <button type="button" onClick={() => exec("justifyFull")} className="p-2 px-3 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs" title="Justify">≡ جاستیفای</button>

                <div className="w-[1px] h-6 bg-[var(--card-border)] mx-1" />

                <button type="button" onClick={() => exec("insertUnorderedList")} className="p-2 px-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs" title="لیست نقطه‌ای">• لیست</button>
                <button type="button" onClick={() => exec("insertOrderedList")} className="p-2 px-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs" title="لیست شماره‌دار">۱. لیست</button>

                <div className="w-[1px] h-6 bg-[var(--card-border)] mx-1" />

                <button type="button" onClick={insertTable} className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)]">📊 ساخت جدول</button>
                <button type="button" onClick={insertQuote} className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)]">💬 نقل قول</button>
                <button type="button" onClick={insertLink} className="p-2 px-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)]">🔗 درج لینک</button>
                <button type="button" onClick={() => imageUploadInputRef.current?.click()} className="p-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-sm flex items-center gap-1">
                  <span>📁</span>
                  <span>آپلود عکس در متن</span>
                </button>
              </div>
            </div>

            {/* بدنه ویرایشگر سند */}
            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)] block">محیط نگارش مقاله (WYSIWYG Canvas):</label>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="w-full min-h-[380px] max-h-[550px] overflow-y-auto p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-loose text-xs focus:border-[var(--accent-blue)] font-sans shadow-inner text-[var(--text-primary)]"
                style={{ textAlign: "justify" }}
              />
            </div>

            {/* پیش‌نمایش در نتایج گوگل (Google SERP Snippet) */}
            <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
              <span className="text-[11px] font-black text-[var(--accent-blue)] block">🌐 پیش‌نمایش در نتایج جستجوی گوگل (SERP):</span>
              <div className="space-y-1 bg-[var(--modal-bg)] p-4 rounded-xl border border-[var(--card-border)]">
                <span className="text-[10px] text-emerald-600 block font-mono">https://axoncore.ir/blog/{slug || "post-slug"}</span>
                <h4 className="text-sm font-black text-blue-600 hover:underline cursor-pointer">{title || "عنوان مقاله"}</h4>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{metaDescription || "توضیحات خلاصه متای سئو در این قسمت قرار می‌گیرد..."}</p>
              </div>
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
                {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار کامل مقاله"}
              </button>
              {selectedPost?.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedPost.id!)}
                  className="px-6 py-4 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500 hover:text-white transition cursor-pointer"
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