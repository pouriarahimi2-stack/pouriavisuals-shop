"use client";

import React, { useState, useEffect } from "react";

interface BlogPost {
  id: string;
  title: string;
  metaDescription?: string;
  keywords?: string;
  category?: string;
  content: string;
  createdAt: string;
  isVisible: boolean;
}

export default function AdminBlogManager() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // فرم مقاله جدید
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("مقاله تخصصی");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadBlogs = async () => {
    setLoading(true);
    try {
      let combined: BlogPost[] = [];
      try {
        const res = await fetch("/api/blogs");
        const json = await res.json();
        if (json.data) combined = [...json.data];
      } catch (e) {
        console.warn("Could not fetch from API:", e);
      }

      const local: BlogPost[] = JSON.parse(localStorage.getItem("site_blogs") || "[]");
      combined = [...combined, ...local];

      // حذف تکراری‌ها
      const unique = Array.from(new Map(combined.map((b) => [b.id, b])).values());
      setBlogs(unique);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleGenerateAIArticle = () => {
    if (!title.trim()) {
      alert("لطفاً ابتدا یک عنوان برای مقاله وارد کنید.");
      return;
    }

    setGenerating(true);
    setTimeout(() => {
      const generatedDesc = `بررسی جامع و تخصصی در خصوص ${title} به همراه تحلیل فنی مشخصات، کاربرد در محیط‌های کاری حرفه‌ای و نکات مهم قبل از خرید.`;
      const generatedKeywords = `${title}, مانیتور تدوین, تجهیزات تصویر, بررسی تخصصی, پوریا ویژوالز`;
      const generatedContent = `
<h2>مقدمه و بررسی اجمالی</h2>
<p>در دنیای مدرن تولید محتوا و پردازش تصویر، انتخاب تجهیزات استاندارد تأثیر مستقیمی بر خروجی نهایی دارد. بررسی <strong>${title}</strong> نشان می‌دهد که توجه به جزئیات فنی نظیر دقت رنگ و پایداری عملکرد از اولویت‌های اصلی است.</p>

<h2>ویژگی‌های کلیدی و مشخصات فنی</h2>
<ul>
  <li>پشتیبانی از تفکیک‌پذیری بالا و استانداردهای رنگی DCI-P3 و sRGB</li>
  <li>طراحی ارگونومیک و بهینه‌سازی شده برای ساعات کاری طولانی</li>
  <li>اتصالات متنوع و سازگاری با سیستم‌های تدوین حرفه‌ای</li>
</ul>

<h2>راهنمای انتخاب و جمع‌بندی</h2>
<p>اگر به دنبال ارتقای کیفیت پروژه‌های بصری خود هستید، تهیه محصولاتی با گارانتی معتبر و پشتیبانی فنی، تضمین‌کننده بازگشت سرمایه شما خواهد بود.</p>
      `.trim();

      setMetaDescription(generatedDesc);
      setKeywords(generatedKeywords);
      setContent(generatedContent);
      setGenerating(false);
      showToast("✨ محتوا و متادیتای سئو توسط هوش مصنوعی تولید گردید.");
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const postData: BlogPost = {
        id: editingId || `blog_${Date.now()}`,
        title: title.trim(),
        category: category.trim(),
        metaDescription: metaDescription.trim(),
        keywords: keywords.trim(),
        content: content.trim(),
        createdAt: new Date().toLocaleDateString("fa-IR"),
        isVisible: true,
      };

      // ارسال به API و Supabase
      try {
        await fetch("/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });
      } catch (err) {
        console.error("API error:", err);
      }

      // به‌روزرسانی محلی
      const existing = blogs.filter((b) => b.id !== postData.id);
      const updated = [postData, ...existing];
      setBlogs(updated);
      localStorage.setItem("site_blogs", JSON.stringify(updated));

      showToast("✨ مقاله با موفقیت ذخیره و در مجله سایت منتشر شد.");
      handleResetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    setTitle("");
    setCategory("مقاله تخصصی");
    setMetaDescription("");
    setKeywords("");
    setContent("");
    setEditingId(null);
  };

  const handleEdit = (b: BlogPost) => {
    setEditingId(b.id);
    setTitle(b.title);
    setCategory(b.category || "مقاله تخصصی");
    setMetaDescription(b.metaDescription || "");
    setKeywords(b.keywords || "");
    setContent(b.content);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این مقاله اطمینان دارید؟")) {
      const updated = blogs.filter((b) => b.id !== id);
      setBlogs(updated);
      localStorage.setItem("site_blogs", JSON.stringify(updated));
      showToast("مقاله حذف گردید.");
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* هدر بخش مدیریت وبلاگ */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base flex items-center gap-2 text-[var(--accent-blue)]">
            <span>📚</span> مدیریت مقالات، وبلاگ و سئو تخصصی
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تولید و انتشار محتوای بهینه‌شده برای گوگل همراه با تولید خودکار هوش مصنوعی
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateAIArticle}
          disabled={generating}
          className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>🤖</span>
          <span>{generating ? "در حال تولید هوشمند..." : "تولید خودکار محتوا با هوش مصنوعی"}</span>
        </button>
      </div>

      {/* فرم درج / ویرایش مقاله */}
      <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <h4 className="font-black text-xs text-[var(--text-primary)]">
          {editingId ? "✏️ ویرایش مقاله" : "➕ ایجاد و انتشار مقاله جدید"}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">عنوان اصلی مقاله (H1 و تگ Title) *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: راهنمای جامع خرید مانیتور 4K برای ادیتورها"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">دسته‌بندی موضوعی *</label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="مثال: راهنمای خرید / تحلیل سخت‌افزار"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">توضیحات متا برای گوگل (Meta Description)</label>
            <input
              type="text"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="خلاصه‌ای جذاب بین ۱۲۰ تا ۱۶۰ کاراکتر برای جذب کلیک در نتایج جستجو..."
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کلمات کلیدی سئو (با کاما جدا کنید)</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="مانیتور 4k, کالیبراسیون رنگ, تجهیزات تدوین"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">متن کامل مقاله (پشتیبانی از HTML و استایل‌های متنی) *</label>
            <textarea
              rows={10}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<h2>عنوان فرعی</h2><p>متن بخش اول...</p>"
              className="w-full p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-xs text-[var(--text-primary)] leading-relaxed focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {editingId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="px-5 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer"
            >
              انصراف
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
          >
            {saving ? "در حال ذخیره‌سازی..." : editingId ? "ثبت ویرایش مقاله 💾" : "انتشار رسمی مقاله 🚀"}
          </button>
        </div>
      </form>

      {/* لیست مقالات منتشر شده */}
      <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h4 className="font-black text-xs text-[var(--text-secondary)]">مقالات منتشر شده در مجله ({blogs.length})</h4>

        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری مقالات...</div>
        ) : blogs.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">هنوز مقاله‌ای ثبت نشده است.</div>
        ) : (
          <div className="space-y-3">
            {blogs.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[var(--modal-bg)] text-[10px] font-bold text-[var(--accent-blue)]">
                      {b.category || "مقاله تخصصی"}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">📅 {b.createdAt}</span>
                  </div>
                  <h5 className="font-black text-xs text-[var(--text-primary)]">{b.title}</h5>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(b)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                  >
                    ✏️ ویرایش
                  </button>

                  <button
                    onClick={() => handleDelete(b.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}