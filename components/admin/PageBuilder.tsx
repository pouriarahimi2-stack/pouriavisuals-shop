// File Path: components/admin/PageBuilder.tsx
"use client";

import React, { useState, useEffect } from "react";
import { pageService, CustomPage, PageBlock } from "@/services/pageService";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

function getDefaultDataForBlock(type: PageBlock["type"]): Record<string, any> {
  switch (type) {
    case "hero":
      return {
        title: "تجربه نسل جدید تکنولوژی با آکسون",
        subtitle: "مرجع تخصصی سخت‌افزار و کالای دیجیتال اورجینال با گارانتی طلایی",
        buttonText: "مشاهده کاتالوگ",
        buttonLink: "/products",
        showOnDesktop: true,
        showOnMobile: true,
        showOnTablet: true,
      };
    case "products":
      return {
        heading: "محصولات منتخب دیجیتال",
        category: "all",
        limit: 8,
        mobileColumns: 1,
        tabletColumns: 2,
        desktopColumns: 4,
        showOnDesktop: true,
        showOnMobile: true,
        showOnTablet: true,
      };
    case "features":
      return {
        heading: "مزایای خرید از فروشگاه آکسون",
        subtitle: "ضمانت اصالت، ارسال سریع و پشتیبانی تخصصی",
        showOnDesktop: true,
        showOnMobile: true,
        showOnTablet: true,
      };
    case "faq":
      return {
        heading: "پرسش‌های متداول خریداران",
        question1: "شرایط گارانتی محصولات چگونه است؟",
        answer1: "تمامی محصولات دارای ۱۸ ماه گارانتی معتبر اصالت و سلامت فیزیکی هستند.",
        showOnDesktop: true,
        showOnMobile: true,
        showOnTablet: true,
      };
    case "cta":
      return {
        title: "نیاز به مشاوره تخصصی خرید دارید؟",
        buttonText: "ارتباط با کارشناسان",
        buttonLink: "/contact",
        showOnDesktop: true,
        showOnMobile: true,
        showOnTablet: true,
      };
    default:
      return {
        title: "بلوک محتوایی جدید",
        description: "متن یا لینک ویدیو را در این بخش وارد نمایید.",
        showOnDesktop: true,
        showOnMobile: true,
        showOnTablet: true,
      };
  }
}

export function PageBuilder() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  // اولویت پلتفرم‌ها طبق قوانین: دسکتاپ، سپس موبایل، و در نهایت تبلت
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile" | "tablet">("desktop");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPages = async () => {
    try {
      const data = await pageService.getAll();
      setPages(data || []);
    } catch {}
  };

  useEffect(() => {
    fetchPages();

    const handlePagesUpdate = () => fetchPages();
    window.addEventListener("page_structure_updated", handlePagesUpdate);
    window.addEventListener("page_deleted", handlePagesUpdate);

    const channel = supabase
      .channel("realtime-page-builder")
      .on("postgres_changes", { event: "*", schema: "public", table: "modular_pages" }, () => {
        fetchPages();
      })
      .subscribe();

    return () => {
      window.removeEventListener("page_structure_updated", handlePagesUpdate);
      window.removeEventListener("page_deleted", handlePagesUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectPage = (page: CustomPage) => {
    soundEngine.playClick();
    setSelectedPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setMetaDescription(page.meta_description || "");
    setBlocks(Array.isArray(page.content) ? page.content : []);
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
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    const payload: CustomPage = {
      id: selectedPage?.id,
      title: title.trim(),
      slug: cleanSlug,
      meta_description: metaDescription.trim() || undefined,
      content: blocks,
      is_published: isPublished,
    };

    const result = await pageService.savePage(payload);
    setSaving(false);

    if (result) {
      soundEngine.playSuccess();
      setStatusMessage({
        type: "success",
        text: "⚡ صفحه و تنظیمات ریسپانسیو (دسکتاپ، موبایل و تبلت) با موفقیت در دیتابیس ذخیره و منتشر شد.",
      });
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
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--modal-bg)] p-5 sm:p-6 rounded-3xl border border-[var(--card-border)] shadow-xl">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🏗️</span> صفحه‌ساز ماژولار و مدیریت چیدمان ریسپانسیو (دسکتاپ، موبایل و تبلت)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ساخت و ویرایش صفحات با کنترل نمایش مستقل در دسکتاپ، موبایل و تبلت و اتصال وب‌سوکت بلادرنگ
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateNew}
          className="w-full sm:w-auto justify-center px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer flex items-center gap-1.5"
        >
          <span>➕</span>
          <span>ایجاد صفحه جدید</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " +
            (statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        <div className="lg:col-span-3 bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-3 shadow-xl h-fit">
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
                  className={
                    "p-3 rounded-2xl border transition cursor-pointer flex justify-between items-center gap-2 " +
                    (selectedPage?.slug === p.slug
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 font-black"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50")
                  }
                >
                  <div className="overflow-hidden">
                    <div className="truncate">{p.title}</div>
                    <span className="text-[10px] font-mono text-slate-400">/{p.slug}</span>
                  </div>
                  {p.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id!);
                      }}
                      className="text-rose-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="lg:col-span-9 bg-[var(--modal-bg)] p-5 sm:p-6 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setDeviceView("desktop")}
                className={
                  "px-3 py-1.5 rounded-xl font-bold transition cursor-pointer " +
                  (deviceView === "desktop" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
                }
              >
                🖥️ ۱. دسکتاپ
              </button>
              <button
                type="button"
                onClick={() => setDeviceView("mobile")}
                className={
                  "px-3 py-1.5 rounded-xl font-bold transition cursor-pointer " +
                  (deviceView === "mobile" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
                }
              >
                📱 ۲. موبایل
              </button>
              <button
                type="button"
                onClick={() => setDeviceView("tablet")}
                className={
                  "px-3 py-1.5 rounded-xl font-bold transition cursor-pointer " +
                  (deviceView === "tablet" ? "bg-[var(--accent-blue)] text-white" : "text-slate-400")
                }
              >
                📟 ۳. تبلت
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer disabled:opacity-50"
            >
              {saving ? "در حال ذخیره..." : "💾 ذخیره و انتشار صفحه"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان صفحه *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: جشنواره فروش ویژه"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نامک (Slug) *</label>
              <input
                type="text"
                required
                dir="ltr"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="special-sale"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">توضیحات سئو (Meta)</label>
              <input
                type="text"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="توضیح کوتاه برای گوگل..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {(["hero", "products", "features", "faq", "cta", "video"] as Array<PageBlock["type"]>).map(
              (bType) => (
                <button
                  key={bType}
                  type="button"
                  onClick={() => addBlock(bType)}
                  className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold cursor-pointer transition"
                >
                  + بلوک {bType.toUpperCase()}
                </button>
              )
            )}
          </div>

          <div
            className={
              "mx-auto transition-all duration-300 space-y-3 p-4 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] " +
              (deviceView === "mobile"
                ? "max-w-[360px]"
                : deviceView === "tablet"
                ? "max-w-[640px]"
                : "w-full")
            }
          >
            {blocks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold">
                از دکمه‌های بالا یک بلوک به صفحه اضافه کنید.
              </div>
            ) : (
              blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
                    <span className="font-mono font-black text-[var(--accent-blue)] uppercase">
                      #{index + 1} - {block.type}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, "up")}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-[var(--input-bg)] disabled:opacity-30 cursor-pointer"
                      >
                        ⬆️
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, "down")}
                        disabled={index === blocks.length - 1}
                        className="p-1.5 rounded-lg bg-[var(--input-bg)] disabled:opacity-30 cursor-pointer"
                      >
                        ⬇️
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={block.data.title || block.data.heading || ""}
                      onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                      placeholder="عنوان اصلی بلوک"
                      className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                    <input
                      type="text"
                      value={block.data.subtitle || block.data.description || ""}
                      onChange={(e) => updateBlockData(block.id, "subtitle", e.target.value)}
                      placeholder="زیرعنوان / توضیحات بلوک"
                      className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-bold text-[var(--text-secondary)]">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={block.data.showOnDesktop !== false}
                        onChange={(e) => updateBlockData(block.id, "showOnDesktop", e.target.checked)}
                      />
                      <span>نمایش در دسکتاپ</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={block.data.showOnMobile !== false}
                        onChange={(e) => updateBlockData(block.id, "showOnMobile", e.target.checked)}
                      />
                      <span>نمایش در موبایل</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={block.data.showOnTablet !== false}
                        onChange={(e) => updateBlockData(block.id, "showOnTablet", e.target.checked)}
                      />
                      <span>نمایش در تبلت</span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default PageBuilder;
