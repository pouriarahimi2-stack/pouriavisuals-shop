// File Path: components/admin/PageBuilder.tsx
"use client";

import React, { useState, useEffect } from "react";
import { pageService, CustomPage, PageBlock } from "@/services/pageService";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export default function PageBuilder() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPages = async () => {
    const data = await pageService.getAll();
    setPages(data || []);
  };

  useEffect(() => {
    fetchPages();

    const pageChannel = supabase
      .channel("pagebuilder-realtime-master-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_pages" }, () => fetchPages())
      .subscribe();

    return () => {
      supabase.removeChannel(pageChannel);
    };
  }, []);

  const handleSelectPage = (page: CustomPage) => {
    soundEngine.playClick();
    setSelectedPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setMetaDescription(page.meta_description || "");
    setBlocks(page.content || []);
    setIsPublished(page.is_published !== false);
  };

  const handleCreateNew = () => {
    soundEngine.playClick();
    setSelectedPage(null);
    setTitle("");
    setSlug("");
    setMetaDescription("");
    setBlocks([]);
    setIsPublished(true);
  };

  const addBlock = (type: PageBlock["type"]) => {
    soundEngine.playClick();
    const newBlock: PageBlock = {
      id: "block_" + Date.now(),
      type,
      data: getDefaultDataForBlock(type),
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlockData = (id: string, key: string, value: any) => {
    setBlocks(
      blocks.map((b) => (b.id === id ? { ...b, data: { ...b.data, [key]: value } } : b))
    );
  };

  const removeBlock = (id: string) => {
    soundEngine.playClick();
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    soundEngine.playClick();
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [temp] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, temp);
    setBlocks(newBlocks);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setStatusMessage({ type: "error", text: "عنوان و نامک صفحه الزامی هستند." });
      return;
    }

    soundEngine.playClick();
    setSaving(true);
    const payload: CustomPage = {
      id: selectedPage?.id,
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      meta_description: metaDescription.trim() || undefined,
      content: blocks,
      is_published: isPublished,
    };

    const result = await pageService.savePage(payload);
    setSaving(false);

    if (result) {
      soundEngine.playSuccess();
      setStatusMessage({ type: "success", text: "⚡ صفحه فرود با موفقیت در دیتابیس ذخیره و منتشر شد." });
      setSelectedPage(result);
      fetchPages();
    } else {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی صفحه." });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این صفحه اطمینان دارید؟")) return;
    soundEngine.playClick();
    const ok = await pageService.deletePage(id);
    if (ok) {
      handleCreateNew();
      fetchPages();
      setStatusMessage({ type: "success", text: "صفحه حذف گردید." });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🏗️</span> صفحه‌ساز ماژولار و لندینگ‌پیس (Page Builder Engine)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ساخت صفحات فرود اختصاصی با ۱۰ بلاک پیشرفته (Hero, Products, FAQ, CTA, Video, Features)
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer flex items-center gap-1.5"
        >
          <span>➕</span>
          <span>ایجاد صفحه جدید</span>
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-3 shadow-xl h-fit">
          <h3 className="text-xs font-black border-b border-[var(--card-border)] pb-3">
            📑 صفحات ثبت‌شده ({pages.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {pages.length === 0 ? (
              <p className="text-xs text-center py-8 text-[var(--text-secondary)]">صفحه‌ای ایجاد نشده است.</p>
            ) : (
              pages.map((p) => (
                <div
                  key={p.id || p.slug}
                  onClick={() => handleSelectPage(p)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex justify-between items-center ${
                    selectedPage?.slug === p.slug
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 shadow-sm"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                  }`}
                >
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black truncate">{p.title}</h4>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">/{p.slug}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${p.is_published ? "bg-emerald-500" : "bg-slate-400"}`} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">عنوان صفحه *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: جشنواره مانیتورهای ۵K"
                  required
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نامک آدرس صفحه (Slug) *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="studio-monitors-sale"
                  required
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">توضیحات سئو (Meta Description)</label>
                <input
                  type="text"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="توضیحات خلاصه برای گوگل..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div className="border-t border-[var(--card-border)] pt-6 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-xs font-black">🧱 افزودن بخش ساختاری جدید:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { type: "hero", label: "هیرو بنر", icon: "🌟" },
                    { type: "products", label: "ویترین کالاها", icon: "📦" },
                    { type: "features", label: "مزایا و ویژگی‌ها", icon: "⚡" },
                    { type: "faq", label: "پرسش و پاسخ (FAQ)", icon: "❓" },
                    { type: "cta", label: "دعوت به اقدام (CTA)", icon: "🎯" },
                    { type: "text", label: "بلوک متن آزاد", icon: "📝" },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => addBlock(t.type as any)}
                      className="px-3 py-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--accent-blue)] hover:text-white border border-[var(--card-border)] font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                    >
                      <span>{t.icon}</span>
                      <span>+ {t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="p-4 sm:p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 shadow-sm">
                    <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
                      <div className="flex items-center gap-2 font-bold">
                        <span className="w-6 h-6 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center font-mono text-xs">
                          {idx + 1}
                        </span>
                        <span>نوع بخش: <strong className="text-[var(--accent-blue)] uppercase font-mono">{block.type}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveBlock(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlock(idx, "down")}
                          disabled={idx === blocks.length - 1}
                          className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBlock(block.id)}
                          className="p-1 px-2 rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {block.type === "hero" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="عنوان اصلی هیرو"
                          value={block.data.title || ""}
                          onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                          className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
                        />
                        <input
                          type="text"
                          placeholder="زیرعنوان و توضیحات هیرو"
                          value={block.data.subtitle || ""}
                          onChange={(e) => updateBlockData(block.id, "subtitle", e.target.value)}
                          className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs"
                        />
                      </div>
                    )}

                    {block.type === "products" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="عنوان ویترین (مثلا: پرفروش‌ترین مانیتورها)"
                          value={block.data.heading || ""}
                          onChange={(e) => updateBlockData(block.id, "heading", e.target.value)}
                          className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
                        />
                        <input
                          type="number"
                          placeholder="تعداد کالای نمایشی (پیش‌فرض: ۶)"
                          value={block.data.limit || 6}
                          onChange={(e) => updateBlockData(block.id, "limit", Number(e.target.value))}
                          className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
                        />
                      </div>
                    )}

                    {block.type === "text" && (
                      <textarea
                        rows={3}
                        placeholder="متن دلخواه خود را در این قسمت وارد نمایید..."
                        value={block.data.text || ""}
                        onChange={(e) => updateBlockData(block.id, "text", e.target.value)}
                        className="w-full p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] leading-relaxed text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? "در حال ذخیره صفحه..." : "💾 ذخیره و انتشار صفحه"}
              </button>
              {selectedPage?.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedPage.id!)}
                  className="px-6 py-4 rounded-2xl bg-rose-500/15 text-rose-600 font-bold text-xs"
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

function getDefaultDataForBlock(type: PageBlock["type"]): Record<string, any> {
  switch (type) {
    case "hero":
      return { title: "عنوان اصلی هیرو بنر", subtitle: "توضیحات تکمیلی و معرفی پیشنهاد ویژه" };
    case "products":
      return { heading: "محصولات منتخب استودیو", limit: 6 };
    case "faq":
      return { question: "شرایط گارانتی محصولات چگونه است؟", answer: "تمامی کالاها با ۱۸ ماه گارانتی اصالت عرضه می‌شوند." };
    case "cta":
      return { title: "مشاوره رایگان خرید با کارشناسان", buttonText: "تماس با ما", link: "/contact" };
    default:
      return { text: "محتوای متنی دلخواه..." };
  }
}