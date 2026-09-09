"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { BlockType, PageBlock, ModularPageDocument } from "@/lib/modularBuilderTypes";
import { supabase } from "@/lib/supabase";

export default function AdminModularPages() {
  const [mainTab, setMainTab] = useState<"pages" | "theme_builder">("pages");

  // استیت‌های صفحات و بلوک‌ها
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string; is_published: boolean }>>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [activeEditingBlockId, setActiveEditingBlockId] = useState<string | null>(null);

  // استیت‌های حالت نمایش و ریسپانسیو (Desktop / Tablet / Mobile)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);

  // استیت‌های Theme Builder سراسری
  const [themeConfig, setThemeConfig] = useState<any>({
    globalHeader: { brandName: "AXON CORE", logoText: "آکسون استودیو", ctaText: "کاتالوگ محصولات", ctaUrl: "/products", bgColor: "#0f172a", textColor: "#ffffff" },
    globalFooter: { copyright: "تمامی حقوق محفوظ است © 2026 آکسون استودیو", supportPhone: "09376110200", bgColor: "#020617", textColor: "#94a3b8" },
    designTokens: { accentColor: "#0284c7", borderRadius: "2xl", containerWidth: "7xl" }
  });

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPagesList = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
        if (json.pages.length > 0 && !selectedPageId) {
          const homePage = json.pages.find((p: any) => p.slug === "home") || json.pages[0];
          loadPageDetails(homePage.slug);
        }
      }
    } catch {}
  };

  const fetchThemeConfig = async () => {
    try {
      const res = await fetch("/api/theme-builder", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.config) {
        setThemeConfig(json.config);
      }
    } catch {}
  };

  const loadPageDetails = async (slug: string) => {
    try {
      const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page) {
        const p: ModularPageDocument = json.page;
        setSelectedPageId(p.id);
        setPageTitle(p.title);
        setPageSlug(p.slug);
        setMetaDescription(p.meta_description || "");
        setIsPublished(p.is_published !== false);
        setBlocks(Array.isArray(p.blocks) ? p.blocks : []);
        if (p.blocks && p.blocks.length > 0) {
          setActiveEditingBlockId(p.blocks[0].id);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchPagesList();
    fetchThemeConfig();

    const channel = supabase
      .channel("realtime-modular-pages-admin-suite")
      .on("postgres_changes", { event: "*", schema: "public", table: "modular_pages" }, () => {
        fetchPagesList();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateNewPage = () => {
    soundEngine.playClick();
    setSelectedPageId("");
    setPageTitle("صفحه لندینگ جدید");
    setPageSlug("page-" + Math.random().toString(36).substring(2, 6));
    setMetaDescription("توضیحات سئو برای رتبه‌بندی در نتایج گوگل...");
    setIsPublished(true);
    setBlocks([
      createDefaultBlock("hero_banner"),
      createDefaultBlock("features_grid"),
      createDefaultBlock("cta_banner")
    ]);
  };

  function createDefaultBlock(type: BlockType): PageBlock {
    const id = "blk_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    switch (type) {
      case "header_nav":
        return {
          id, type, title: "هدر و نوبار اختصاصی", isVisible: true,
          styles: { paddingY: 4, maxWidth: "7xl", bgColor: "#0f172a", textColor: "#ffffff" },
          data: { brandName: "AXON CORE", logoText: "آکسون استودیو", navLinks: [{ label: "صفحه اصلی", url: "/" }, { label: "محصولات", url: "/products" }, { label: "تماس", url: "/contact" }], ctaButtonText: "کاتالوگ محصولات", ctaButtonUrl: "/products" }
        };
      case "hero_banner":
        return {
          id, type, title: "هیرو بنر اصلی", isVisible: true,
          styles: { paddingY: 16, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff", textAlign: "center" },
          data: { badge: "🚀 مرجع مانیتورهای ۵K", headline: "دیدن واقعیت رنگ‌ها بدون مصالحه", subheadline: "تأمین، کالیبراسیون سخت‌افزاری و واردات مانیتورهای مرجع رنگ با ضمانت اصالت.", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200", primaryBtnText: "کاتالوگ مانیتورها", primaryBtnUrl: "/products", secondaryBtnText: "استعلام مشاوره فنی", secondaryBtnUrl: "/contact" }
        };
      case "features_grid":
        return {
          id, type, title: "مزایا و ویژگی‌ها", isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#090d16", textColor: "#ffffff" },
          data: { heading: "استانداردهای مهندسی آکسون", items: [{ icon: "🛡️", title: "گارانتی طلایی تعویض", desc: "۱۸ ماه پوشش جامع تعویض بی قید و شرط." }, { icon: "⚡", title: "کالیبراسیون ۳D LUT", desc: "تنظیم تراز رنگ‌ها بر مبنای استانداردهای سینمایی." }, { icon: "🚀", title: "ارسال سریع سراسری", desc: "بسته‌بندی ضربه‌گیر ویژه تجهیزات حساس با بیمه کامل." }] }
        };
      case "product_showcase":
        return {
          id, type, title: "ویترین کالاهای منتخب", isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff" },
          data: { heading: "پرفروش‌ترین تجهیزات استودیو", viewAllText: "مشاهده همه کالاها ←", viewAllUrl: "/products" }
        };
      case "accordion_faq":
        return {
          id, type, title: "پرسش و پاسخ متداول (FAQ)", isVisible: true,
          styles: { paddingY: 12, maxWidth: "5xl", bgColor: "#0b0f19", textColor: "#ffffff" },
          data: { heading: "پرسش‌های متداول مشتریان", questions: [{ q: "آیا مانیتورها گارانتی تعویض دارند؟", a: "بله، تمام مانیتورهای ۵K دارای ۱۸ ماه گارانتی طلایی تعویض می‌باشند." }, { q: "امکان تست حضوری رنگ وجود دارد؟", a: "بله، در استودیوی شیراز با هماهنگی قبلی تست میدانی انجام می‌شود." }] }
        };
      case "cta_banner":
        return {
          id, type, title: "فراخوان عمل (CTA)", isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#1e1b4b", textColor: "#ffffff", textAlign: "center" },
          data: { title: "نیاز به مشاوره انتخاب مانیتور دارید؟", subtitle: "کارشناسان آکسون متناسب با نرم‌افزارهای کاری شما بهترین مانیتور را پیشنهاد می‌دهند.", btnText: "ثبت تیکت مشاوره", btnUrl: "/contact" }
        };
      case "rich_text":
        return {
          id, type, title: "متن آزاد سئو", isVisible: true,
          styles: { paddingY: 8, maxWidth: "5xl", bgColor: "#020617", textColor: "#ffffff" },
          data: { htmlContent: "<p>متن تخصصی سئو جهت بهینه‌سازی رتبه در نتایج موتورهای جستجو...</p>" }
        };
      case "footer_block":
        return {
          id, type, title: "فوتر اختصاصی", isVisible: true,
          styles: { paddingY: 10, maxWidth: "7xl", bgColor: "#020617", textColor: "#94a3b8" },
          data: { copyrightText: "تمامی حقوق برای آکسون محفوظ است © 2026", supportPhone: "09376110200" }
        };
    }
  }

  const handleAddBlock = (type: BlockType) => {
    soundEngine.playClick();
    const newBlock = createDefaultBlock(type);
    setBlocks([...blocks, newBlock]);
    setActiveEditingBlockId(newBlock.id);
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    soundEngine.playClick();
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const updated = [...blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setBlocks(updated);
  };

  // هندلینگ درگ اند دراپ بصری بلوک‌ها
  const handleDragStart = (idx: number) => {
    setDraggedBlockIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedBlockIndex === null || draggedBlockIndex === idx) return;
    const updated = [...blocks];
    const [dragged] = updated.splice(draggedBlockIndex, 1);
    updated.splice(idx, 0, dragged);
    setDraggedBlockIndex(idx);
    setBlocks(updated);
  };

  const handleSavePage = async () => {
    if (!pageTitle.trim() || !pageSlug.trim()) {
      alert("عنوان و نامک آدرس صفحه الزامی است.");
      return;
    }

    soundEngine.playClick();
    setSaving(true);
    setToastMessage(null);

    const payload: Partial<ModularPageDocument> = {
      id: selectedPageId || undefined,
      title: pageTitle.trim(),
      slug: pageSlug.trim().toLowerCase(),
      meta_description: metaDescription.trim(),
      blocks,
      is_published: isPublished
    };

    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setToastMessage({ type: "success", text: "✓ تغییرات با موفقیت ذخیره و در کسری از ثانیه روی سایت منتشر شد." });
        fetchPagesList();
        if (!selectedPageId && json.page) setSelectedPageId(json.page.id);
      } else {
        setToastMessage({ type: "error", text: json.message || "خطا در ذخیره‌سازی." });
      }
    } catch {
      setToastMessage({ type: "error", text: "خطای ارتباط با سرور." });
    } finally {
      setSaving(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleSaveThemeBuilder = async () => {
    soundEngine.playClick();
    setSaving(true);
    setToastMessage(null);

    try {
      const res = await fetch("/api/theme-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: themeConfig })
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setToastMessage({ type: "success", text: json.message });
      } else {
        setToastMessage({ type: "error", text: json.message || "خطا در ذخیره تم." });
      }
    } catch {
      setToastMessage({ type: "error", text: "خطای ارتباط با سرور." });
    } finally {
      setSaving(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const activeBlock = blocks.find(b => b.id === activeEditingBlockId);

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ استودیوی صفحه ساز و Theme Builder */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-sky-500/25">
            🏗️
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black">استودیوی صفحه ساز و Theme Builder آکسون</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
              ویرایشگر کامل المنتوری، کنترل سراسری هدر/فوتر و مدیریت لندینگ‌ها بدون کدنویسی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mainTab === "pages" ? (
            <>
              <button
                type="button"
                onClick={handleCreateNewPage}
                className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-black transition cursor-pointer"
              >
                + ساخت لندینگ جدید
              </button>
              <button
                type="button"
                onClick={handleSavePage}
                disabled={saving}
                className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {saving ? "در حال انتشار..." : "💾 ذخیره و انتشار سراسری"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSaveThemeBuilder}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              {saving ? "در حال ذخیره..." : "💾 انتشار تم سراسری سایت"}
            </button>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className={"p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " + (
          toastMessage.type === "success" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 border border-rose-500/30 text-rose-600"
        )}>
          {toastMessage.text}
        </div>
      )}

      {/* تب‌های کلان: ویرایشگر صفحات در برابر Theme Builder سراسری */}
      <div className="flex gap-2 p-1.5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs">
        <button
          type="button"
          onClick={() => { soundEngine.playClick(); setMainTab("pages"); }}
          className={"px-6 py-3 rounded-2xl font-black transition cursor-pointer " + (
            mainTab === "pages" ? "bg-[var(--accent-blue)] text-white shadow-md scale-105" : "text-[var(--text-secondary)] hover:text-white"
          )}
        >
          📄 ویرایشگر صفحات و لندینگ‌ها
        </button>
        <button
          type="button"
          onClick={() => { soundEngine.playClick(); setMainTab("theme_builder"); }}
          className={"px-6 py-3 rounded-2xl font-black transition cursor-pointer " + (
            mainTab === "theme_builder" ? "bg-indigo-600 text-white shadow-md scale-105" : "text-[var(--text-secondary)] hover:text-white"
          )}
        >
          🎨 قالب و استایل سراسری سایت (Theme Builder)
        </button>
      </div>

      {/* حالت ۱: ویرایشگر بلوکی صفحات */}
      {mainTab === "pages" && (
        <div className="space-y-6">
          {/* نوار تنظیمات صفحه و انتخاب پیش‌نمایش ریسپانسیو */}
          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-end">
            <div className="sm:col-span-3">
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">انتخاب صفحه جهت ویرایش:</label>
              <select
                value={pageSlug}
                onChange={(e) => loadPageDetails(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none cursor-pointer"
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.slug}>📄 {p.title} ({p.slug === "home" ? "صفحه اصلی /" : "/" + p.slug})</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان صفحه (Title):</label>
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نامک آدرس (Slug):</label>
              <input
                type="text"
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-1.5 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--card-border)]">
              {[
                { id: "desktop" as const, icon: "🖥️", label: "دسکتاپ" },
                { id: "tablet" as const, icon: "📱", label: "تبلت" },
                { id: "mobile" as const, icon: "📲", label: "موبایل" },
              ].map((dev) => (
                <button
                  key={dev.id}
                  type="button"
                  onClick={() => setPreviewDevice(dev.id)}
                  className={"px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1 " + (
                    previewDevice === dev.id ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-slate-400"
                  )}
                >
                  <span>{dev.icon}</span>
                  <span className="hidden md:inline">{dev.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* جعبه‌ابزار افزودن بلوک‌ها */}
          <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-2">
            <span className="text-xs font-black text-[var(--text-secondary)] block">➕ افزودن بخش ساختاری جدید به صفحه:</span>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { type: "header_nav" as const, label: "هدر ناوبری", icon: "🧭" },
                { type: "hero_banner" as const, label: "هیرو بنر بزرگ", icon: "🌟" },
                { type: "product_showcase" as const, label: "ویترین کالاها", icon: "🛍️" },
                { type: "features_grid" as const, label: "مزایا و ویژگی‌ها", icon: "⚡" },
                { type: "accordion_faq" as const, label: "پرسش و پاسخ (FAQ)", icon: "❓" },
                { type: "cta_banner" as const, label: "فراخوان عمل (CTA)", icon: "🎯" },
                { type: "rich_text" as const, label: "بلوک متن آزاد سئو", icon: "📝" },
                { type: "footer_block" as const, label: "فوتر اختصاصی", icon: "🔻" },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleAddBlock(item.type)}
                  className="p-2 px-3.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>{item.icon}</span>
                  <span>+ {item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* محیط کاربری: ستون لایه‌ها با درگ اند دراپ + ستون اینسپکتور */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-[var(--modal-bg)] p-5 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-3 h-fit">
              <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
                <h3 className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>📑</span>
                  <span>لایه‌ها ({blocks.length} بخش - قابلیت کشیدن و رها کردن)</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Drag & Drop</span>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {blocks.map((b, idx) => {
                  const isActive = activeEditingBlockId === b.id;
                  return (
                    <div
                      key={b.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onClick={() => { soundEngine.playClick(); setActiveEditingBlockId(b.id); }}
                      className={`p-3.5 rounded-2xl border transition cursor-grab active:cursor-grabbing flex items-center justify-between gap-2 ${
                        isActive ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-md" : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                      } ${!b.isVisible ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-slate-400 text-xs">⋮⋮</span>
                        <div>
                          <span className="font-mono text-[9px] text-[var(--accent-blue)] font-bold block uppercase">{b.type}</span>
                          <h4 className="font-black text-xs text-[var(--text-primary)] truncate">{b.title}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, "up"); }} disabled={idx === 0} className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs">▲</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, "down"); }} disabled={idx === blocks.length - 1} className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs">▼</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setBlocks(blocks.map(it => it.id === b.id ? { ...it, isVisible: !it.isVisible } : it)); }} className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs">{b.isVisible ? "👁️" : "🙈"}</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setBlocks(blocks.filter(it => it.id !== b.id)); }} className="p-1 px-2 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-bold">🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ستون اینسپکتور */}
            <div className="lg:col-span-7">
              {activeBlock ? (
                <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
                  <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
                    <h3 className="font-black text-sm text-[var(--accent-blue)]">تنظیمات: {activeBlock.title}</h3>
                    <span className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-bold">نوع: {activeBlock.type}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                    <span className="font-black text-[11px] text-[var(--text-primary)] block">🎨 ابعاد و استایل چیدمان:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-400">رنگ پس‌زمینه:</label>
                        <input
                          type="text"
                          value={activeBlock.styles.bgColor || "#020617"}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, styles: { ...b.styles, bgColor: e.target.value } } : b))}
                          className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-400">رنگ متن:</label>
                        <input
                          type="text"
                          value={activeBlock.styles.textColor || "#ffffff"}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, styles: { ...b.styles, textColor: e.target.value } } : b))}
                          className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-400">پدینگ عمودی (Y):</label>
                        <input
                          type="number"
                          value={activeBlock.styles.paddingY || 12}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, styles: { ...b.styles, paddingY: Number(e.target.value) } } : b))}
                          className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-400">عرض کانتینر:</label>
                        <select
                          value={activeBlock.styles.maxWidth || "7xl"}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, styles: { ...b.styles, maxWidth: e.target.value as any } } : b))}
                          className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-[10px]"
                        >
                          <option value="full">تمام‌عرض</option>
                          <option value="7xl">استاندارد (7XL)</option>
                          <option value="5xl">جمع‌وجور (5XL)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ویرایش محتوای بلوک هیرو */}
                  {activeBlock.type === "hero_banner" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block mb-1 font-bold text-slate-400">تیتر اصلی هیرو:</label>
                        <input
                          type="text"
                          value={activeBlock.data.headline || ""}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, headline: e.target.value } } : b))}
                          className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-black text-xs"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-bold text-slate-400">توضیحات زیرعنوان:</label>
                        <textarea
                          rows={2}
                          value={activeBlock.data.subheadline || ""}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, subheadline: e.target.value } } : b))}
                          className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs leading-relaxed"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-bold text-slate-400">تصویر شاخص (URL):</label>
                        <input
                          type="text"
                          value={activeBlock.data.imageUrl || ""}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, imageUrl: e.target.value } } : b))}
                          className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[var(--card-border)] flex justify-end">
                    <button
                      type="button"
                      onClick={handleSavePage}
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer shadow-md"
                    >
                      {saving ? "در حال ذخیره..." : "💾 ذخیره و انتشار سراسری"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-slate-400">
                  بخشی را از ستون لایه‌ها انتخاب کنید تا اینسپکتور باز شود.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* حالت ۲: سازنده قالب سراسری (Global Theme Builder) */}
      {mainTab === "theme_builder" && (
        <div className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl p-6 md:p-8 space-y-6 text-xs">
          <div className="border-b border-[var(--card-border)] pb-4">
            <h3 className="font-black text-sm text-indigo-400 flex items-center gap-2">
              <span>🎨</span>
              <span>تنظیمات یکپارچه قالب و استایل سراسری سایت (Site-wide Theme Settings)</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              تغییرات اعمال‌شده در این بخش فوراً روی هدر، فوتر و استایل تمام صفحات فعال سایت منعکس خواهد شد.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* هدر سراسری */}
            <div className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
              <span className="font-black text-xs text-[var(--accent-blue)] block">🧭 هدر ناوبری سراسری سایت:</span>
              <div>
                <label className="block mb-1 font-bold text-slate-400">نام برند (لوگو لاتین):</label>
                <input
                  type="text"
                  value={themeConfig.globalHeader.brandName}
                  onChange={(e) => setThemeConfig({ ...themeConfig, globalHeader: { ...themeConfig.globalHeader, brandName: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-400">عنوان فرعی لوگو (فارسی):</label>
                <input
                  type="text"
                  value={themeConfig.globalHeader.logoText}
                  onChange={(e) => setThemeConfig({ ...themeConfig, globalHeader: { ...themeConfig.globalHeader, logoText: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-400">متن دکمه اکشن هدر:</label>
                <input
                  type="text"
                  value={themeConfig.globalHeader.ctaText}
                  onChange={(e) => setThemeConfig({ ...themeConfig, globalHeader: { ...themeConfig.globalHeader, ctaText: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>
            </div>

            {/* فوتر سراسری */}
            <div className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
              <span className="font-black text-xs text-indigo-400 block">🔻 فوتر سراسری سایت:</span>
              <div>
                <label className="block mb-1 font-bold text-slate-400">متن کپی‌رایت:</label>
                <input
                  type="text"
                  value={themeConfig.globalFooter.copyright}
                  onChange={(e) => setThemeConfig({ ...themeConfig, globalFooter: { ...themeConfig.globalFooter, copyright: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-400">شماره پشتیبانی:</label>
                <input
                  type="text"
                  value={themeConfig.globalFooter.supportPhone}
                  onChange={(e) => setThemeConfig({ ...themeConfig, globalFooter: { ...themeConfig.globalFooter, supportPhone: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-400">رنگ برند سراسری (Accent Color):</label>
                <input
                  type="text"
                  value={themeConfig.designTokens.accentColor}
                  onChange={(e) => setThemeConfig({ ...themeConfig, designTokens: { ...themeConfig.designTokens, accentColor: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--card-border)] flex justify-end">
            <button
              type="button"
              onClick={handleSaveThemeBuilder}
              disabled={saving}
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xl transition cursor-pointer disabled:opacity-50"
            >
              {saving ? "در حال انتشار..." : "💾 ذخیره و انتشار تم سراسری سایت"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
