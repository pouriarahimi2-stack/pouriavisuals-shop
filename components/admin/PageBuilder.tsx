"use client";

import React, { useState, useEffect } from "react";
import { pageService, CustomPage, PageBlock } from "@/services/pageService";
import { supabase } from "@/lib/supabase";

export default function PageBuilder() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPages = async () => {
    const data = await pageService.getAll();
    setPages(data);
  };

  useEffect(() => {
    fetchPages();

    // همگام‌سازی بلادرنگ وب‌سوکت روی جدول صفحات
    const pageChannel = supabase
      .channel("pagebuilder-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pages" }, () => {
        fetchPages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pageChannel);
    };
  }, []);

  const handleSelectPage = (page: CustomPage) => {
    setSelectedPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setBlocks(page.content || []);
    setIsPublished(page.is_published !== false);
  };

  const handleCreateNew = () => {
    setSelectedPage(null);
    setTitle("");
    setSlug("");
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
      setStatusMessage({ type: "error", text: "عنوان و نامک (Slug) الزامی هستند." });
      return;
    }

    setSaving(true);
    const payload: CustomPage = {
      id: selectedPage?.id,
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      content: blocks,
      is_published: isPublished,
    };

    const result = await pageService.savePage(payload);
    setSaving(false);

    if (result) {
      setStatusMessage({ type: "success", text: "⚡ صفحه با موفقیت در دیتابیس ذخیره و منتشر شد." });
      setSelectedPage(result);
      fetchPages();
    } else {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی صفحه در دیتابیس." });
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
    <div className="space-y-8 font-sans" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">🎨 صفحه‌ساز پیشرفته و لایو</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">ساخت و چیدمان صفحات فرود و اختصاصی با ذخیره‌سازی ابری Realtime</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition shadow-md cursor-pointer"
        >
          + ایجاد صفحه جدید
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
        {/* سایدبار لیست صفحات موجود */}
        <div className="lg:col-span-1 bg-[var(--modal-bg)] p-5 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm h-fit">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📑 صفحات ثبت‌شده ({pages.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pages.length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)] font-medium text-center py-4">هنوز صفحه‌ای ثبت نشده است.</p>
            ) : (
              pages.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPage(p)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    selectedPage?.id === p.id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                  }`}
                >
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black text-[var(--text-primary)] truncate">{p.title}</h4>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">/{p.slug}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${p.is_published ? "bg-emerald-500" : "bg-slate-400"}`} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* بخش ویرایشگر چیدمان صفحه */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">عنوان صفحه *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: لندینگ مانیتورهای تدوین"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نامک انگلیسی (Slug) *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="editing-monitors"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPub"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
              />
              <label htmlFor="isPub" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                صفحه فعال و برای عموم کاربران منتشر شود
              </label>
            </div>

            {/* جعبه‌ابزار بلاک‌ها */}
            <div className="border-t border-[var(--card-border)] pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[var(--text-primary)]">🧱 افزودن بخش (بلاک ساختمانی):</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => addBlock("hero")} className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] font-bold transition cursor-pointer">
                    + بخش هدر و شعار (Hero)
                  </button>
                  <button type="button" onClick={() => addBlock("text")} className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] font-bold transition cursor-pointer">
                    + بلوک متن و محتوا
                  </button>
                  <button type="button" onClick={() => addBlock("banner")} className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] font-bold transition cursor-pointer">
                    + بنر تصویری و لینک
                  </button>
                  <button type="button" onClick={() => addBlock("products")} className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] font-bold transition cursor-pointer">
                    + ردیف محصولات ویژه
                  </button>
                </div>
              </div>

              {/* لیست بلاک‌های ایجادشده */}
              <div className="space-y-4 pt-2">
                {blocks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--text-muted)] border-2 border-dashed border-[var(--card-border)] rounded-2xl font-medium">
                    هیچ بلاکی به این صفحه اضافه نشده است. از دکمه‌های بالا بخش‌های مورد نظرتان را اضافه کنید.
                  </div>
                ) : (
                  blocks.map((block, idx) => (
                    <div key={block.id} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 shadow-inner">
                      <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2 text-xs font-bold text-[var(--text-primary)]">
                        <span>
                          بخش {idx + 1}: <strong className="text-[var(--accent-blue)] uppercase">{block.type}</strong>
                        </span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveBlock(idx, "up")} disabled={idx === 0} className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer">▲</button>
                          <button type="button" onClick={() => moveBlock(idx, "down")} disabled={idx === blocks.length - 1} className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer">▼</button>
                          <button type="button" onClick={() => removeBlock(block.id)} className="p-1 px-2 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition cursor-pointer">✕</button>
                        </div>
                      </div>

                      {/* فیلدهای اختصاصی بر اساس نوع بلاک */}
                      {block.type === "hero" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <input
                            type="text"
                            placeholder="عنوان هیرو..."
                            value={block.data.title || ""}
                            onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                            className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold"
                          />
                          <input
                            type="text"
                            placeholder="زیرعنوان / متن تکمیلی..."
                            value={block.data.subtitle || ""}
                            onChange={(e) => updateBlockData(block.id, "subtitle", e.target.value)}
                            className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs"
                          />
                        </div>
                      )}

                      {block.type === "text" && (
                        <textarea
                          rows={3}
                          placeholder="متن محتوای این بخش..."
                          value={block.data.text || ""}
                          onChange={(e) => updateBlockData(block.id, "text", e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs"
                        />
                      )}

                      {block.type === "banner" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <input
                            type="text"
                            placeholder="آدرس اینترنتی عکس بنر (Image URL)..."
                            value={block.data.imageUrl || ""}
                            onChange={(e) => updateBlockData(block.id, "imageUrl", e.target.value)}
                            className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-mono"
                          />
                          <input
                            type="text"
                            placeholder="لینک مقصد هنگام کلیک (Link URL)..."
                            value={block.data.linkUrl || ""}
                            onChange={(e) => updateBlockData(block.id, "linkUrl", e.target.value)}
                            className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-mono"
                          />
                        </div>
                      )}

                      {block.type === "products" && (
                        <div className="text-xs space-y-2">
                          <input
                            type="text"
                            placeholder="عنوان بخش کالاها (مثال: منتخب مانیتورهای استودیویی)..."
                            value={block.data.heading || ""}
                            onChange={(e) => updateBlockData(block.id, "heading", e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold"
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* دکمه‌های ذخیره‌سازی */}
            <div className="flex gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs cursor-pointer hover:opacity-90 transition shadow-lg disabled:opacity-50"
              >
                {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار در دیتابیس"}
              </button>
              {selectedPage?.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedPage.id!)}
                  className="px-5 py-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500 hover:text-white transition cursor-pointer"
                >
                  حذف صفحه ✕
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
      return { title: "عنوان اصلی صفحه", subtitle: "توضیحات و راهنمای خرید" };
    case "text":
      return { text: "محتوای متنی سفارشی را اینجا وارد کنید..." };
    case "banner":
      return { imageUrl: "", linkUrl: "/products" };
    case "products":
      return { heading: "محصولات برگزیده" };
    default:
      return {};
  }
}