/**
 * AXON CORE - Upgrade Admin News Management Page (fix.js)
 * Integrates MediaUploadModal for cover images and connects with secured /api/admin/news.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

function writeFile(relPath, content) {
  const fullPath = path.join(ROOT, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ارتقا یافت: ${relPath}\x1b[0m`);
}

console.log("\x1b[35m[NEWS-UI-UPGRADE]\x1b[0m ادغام مودال بارگذاری تصویر شاخص با صفحه مدیریت مقالات...");

const newsPagePath = 'app/admin/news/page.tsx';

const upgradedNewsPageCode = `"use client";

import React, { useEffect, useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image?: string | null;
  tags?: string[];
  is_published: boolean;
  created_at?: string;
}

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState<{
    id?: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    cover_image: string;
    tags: string[];
    is_published: boolean;
  }>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    tags: [],
    is_published: true,
  });

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/news");
      const json = await res.json();
      if (res.ok && json.success) {
        setArticles(json.news || []);
      }
    } catch {
      console.error("خطا در واکشی اخبار و مقالات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleOpenCreate = () => {
    soundEngine.playClick();
    setEditingArticle(null);
    setForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image: "",
      tags: ["فناوری", "آکسون کور"],
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (art: Article) => {
    soundEngine.playClick();
    setEditingArticle(art);
    setForm({
      id: art.id,
      title: art.title,
      slug: art.slug,
      excerpt: art.excerpt || "",
      content: art.content || "",
      cover_image: art.cover_image || "",
      tags: Array.isArray(art.tags) ? art.tags : [],
      is_published: art.is_published !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این مقاله اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch(\`/api/admin/news?id=\${id}\`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        fetchArticles();
      } else {
        alert(json.message || "خطا در حذف مقاله.");
      }
    } catch {
      alert("ارتباط با سرور برقرار نشد.");
    }
  };

  const handleTitleChange = (val: string) => {
    const slug = val
      .trim()
      .toLowerCase()
      .replace(/[^\\u0600-\\u06FFa-z0-9\\s-]/g, "")
      .replace(/\\s+/g, "-");
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: editingArticle ? prev.slug : slug,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    try {
      const method = editingArticle ? "PUT" : "POST";
      const res = await fetch("/api/admin/news", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setIsModalOpen(false);
        fetchArticles();
      } else {
        alert(json.message || "خطا در ذخیره‌سازی مقاله.");
      }
    } catch {
      alert("خطا در ارتباط با سرور.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      {/* هدر صفحه */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📰</span> مدیریت مقالات، وبلاگ و اخبار
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تولید و ویرایش محتوا، مدیریت تگ‌ها، سئو و تصاویر شاخص
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span> انتشار مقاله جدید
        </button>
      </div>

      {/* فهرست مقالات */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">در حال دریافت مقالات...</div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">هیچ مقاله‌ای منتشر نشده است.</div>
        ) : (
          <div className="space-y-3">
            {articles.map((art) => (
              <div
                key={art.id}
                className="p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[var(--accent-blue)] transition"
              >
                <div className="flex items-center gap-3">
                  {art.cover_image ? (
                    <img
                      src={art.cover_image}
                      alt={art.title}
                      className="w-16 h-12 object-cover rounded-xl border border-[var(--card-border)] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xs shrink-0">
                      📄
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">{art.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-mono text-slate-400">/{art.slug}</span>
                      <span
                        className={\`px-2 py-0.5 rounded-md text-[10px] font-bold border \${
                          art.is_published
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        }\`}
                      >
                        {art.is_published ? "منتشر شده" : "پیش‌نویس"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(art)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--card-border)] text-xs font-bold hover:bg-slate-700 transition"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(art.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs transition"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* مودال ایجاد و ویرایش مقاله */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--text-primary)]">
                {editingArticle ? "✏️ ویرایش مقاله" : "➕ انتشار مقاله جدید"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">عنوان مقاله:</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">نامک (Slug):</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* تصویر شاخص با مودال بارگذاری */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">تصویر شاخص (Cover Image):</label>
                {form.cover_image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[var(--card-border)] aspect-[16/7] max-h-48">
                    <img src={form.cover_image} alt="Cover Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, cover_image: "" })}
                      className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[10px] font-bold shadow"
                    >
                      تغییر تصویر
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="w-full py-5 rounded-2xl border-2 border-dashed border-[var(--card-border)] bg-[var(--input-bg)] text-xs font-bold text-[var(--accent-blue)] hover:border-[var(--accent-blue)] transition flex items-center justify-center gap-2"
                  >
                    <span>☁️</span> بارگذاری تصویر شاخص مقاله
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">خلاصه مقاله (Excerpt):</label>
                <textarea
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="چکیده کوتاه جهت نمایش در پیش‌نمایش کارت‌ها و موتورهای جستجو"
                  className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">متن کامل محتوا:</label>
                <textarea
                  rows={6}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              {/* مدیریت تگ‌ها */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">برچسب‌ها (Tags):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="مثال: آیفون"
                    className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tagInput.trim()) {
                        setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
                        setTagInput("");
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[var(--card-border)] text-xs font-bold"
                  >
                    افزودن
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {form.tags.map((t, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-[var(--card-border)] text-xs flex items-center gap-1">
                      #{t}
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, tags: form.tags.filter((_, i) => i !== idx) })}
                        className="text-rose-400 text-[10px]"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="rounded accent-[var(--accent-blue)]"
                />
                وضعیت انتشار فعال در وبلاگ
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-md hover:opacity-90 transition"
                >
                  ذخیره و انتشار 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaUploadModal
        isOpen={isUploadOpen}
        bucket="news"
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(url) => {
          setForm((prev) => ({ ...prev, cover_image: url }));
        }}
      />
    </div>
  );
}
`;

writeFile(newsPagePath, upgradedNewsPageCode);

// تست کامپایل
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ کامپایل با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

// ارسال تغییرات به مخزن
console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "feat(admin): upgrade news management page with cover image upload and auto-slug generation"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ صفحه مقالات با موفقیت روی سرور ورسل مستقر گردید!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}