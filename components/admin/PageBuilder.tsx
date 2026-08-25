"use client";

import React, { useState, useEffect } from "react";
import { pageService, CustomPage, PageBlock } from "@/services/pageService";
import { supabase } from "@/lib/supabase";

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
      .channel("pagebuilder-realtime-master-v3")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_pages" }, () => fetchPages())
      .subscribe();

    return () => {
      supabase.removeChannel(pageChannel);
    };
  }, []);

  const handleSelectPage = (page: CustomPage) => {
    setSelectedPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setMetaDescription(page.meta_description || "");
    setBlocks(page.content || []);
    setIsPublished(page.is_published !== false);
  };

  const handleCreateNew = () => {
    setSelectedPage(null);
    setTitle("");
    setSlug("");
    setMetaDescription("");
    setBlocks([]);
    setIsPublished(true);
  };

  const addBlock = (type: PageBlock["type"]) => {
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
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
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
      setStatusMessage({ type: "success", text: "⚡ صفحه با موفقیت ذخیره شد." });
      setSelectedPage(result);
      fetchPages();
    } else {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی صفحه." });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این صفحه اطمینان دارید؟")) return;
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
      <div className="flex justify-between items-center bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)]">🏗️ صفحه‌ساز ماژولار و ساخت لندینگ (Page Builder)</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">ساخت صفحات فرود با ۱۰ بلاک پیشرفته (Hero, FAQ, Testimonials, CTA, Products)</p>
        </div>
        <button onClick={handleCreateNew} className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs cursor-pointer">+ ایجاد صفحه جدید</button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-[var(--modal-bg)] p-5 rounded-3xl border border-[var(--card-border)] space-y-4 h-fit">
          <h3 className="text-xs font-black border-b border-[var(--card-border)] pb-3">📑 صفحات ثبت‌شده ({pages.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pages.map((p) => (
              <div key={p.id || p.slug} onClick={() => handleSelectPage(p)} className={`p-3 rounded-2xl border cursor-pointer flex justify-between ${selectedPage?.slug === p.slug ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10" : "border-[var(--card-border)] bg-[var(--input-bg)]"}`}>
                <h4 className="text-xs font-black truncate">{p.title}</h4>
                <span className={`w-2 h-2 rounded-full ${p.is_published ? "bg-emerald-500" : "bg-slate-400"}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-sm space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-2">عنوان صفحه *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold" />
              </div>
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-2">نامک (Slug) *</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold" />
              </div>
            </div>

            <div className="border-t border-[var(--card-border)] pt-6 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-xs font-black">🧱 افزودن بخش ساختمانی:</span>
                <div className="flex flex-wrap gap-2">
                  {["hero", "products", "faq", "cta", "banner", "text"].map((t: any) => (
                    <button key={t} type="button" onClick={() => addBlock(t)} className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer uppercase text-[10px]">+ {t}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="p-4 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                    <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2 font-bold">
                      <span>بخش {idx + 1}: <strong className="text-[var(--accent-blue)] uppercase">{block.type}</strong></span>
                      <button type="button" onClick={() => removeBlock(block.id)} className="text-rose-500 cursor-pointer font-bold">✕</button>
                    </div>

                    {block.type === "hero" && (
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="عنوان" value={block.data.title || ""} onChange={(e) => updateBlockData(block.id, "title", e.target.value)} className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold" />
                        <input type="text" placeholder="زیرعنوان" value={block.data.subtitle || ""} onChange={(e) => updateBlockData(block.id, "subtitle", e.target.value)} className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]" />
                      </div>
                    )}
                    {block.type === "text" && (
                      <textarea rows={2} placeholder="متن" value={block.data.text || ""} onChange={(e) => updateBlockData(block.id, "text", e.target.value)} className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button type="submit" disabled={saving} className="flex-1 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-lg">{saving ? "در حال ذخیره..." : "💾 ذخیره و انتشار صفحه"}</button>
              {selectedPage?.id && <button type="button" onClick={() => handleDelete(selectedPage.id!)} className="px-5 py-3.5 rounded-2xl bg-rose-500/15 text-rose-600 font-bold">حذف</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getDefaultDataForBlock(type: PageBlock["type"]): Record<string, any> {
  switch (type) {
    case "hero": return { title: "عنوان اصلی هیرو", subtitle: "توضیحات تکمیلی" };
    case "products": return { heading: "محصولات منتخب", limit: 6 };
    default: return {};
  }
}