"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { BlockType, PageBlock, ModularPageDocument } from "@/lib/modularBuilderTypes";
import { supabase } from "@/lib/supabase";

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string; is_published: boolean }>>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("home");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);

  // استیت‌های پنل بازرسی المنتور
  const [activeEditingBlockId, setActiveEditingBlockId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"content" | "style" | "advanced">("content");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isWidgetsDrawerOpen, setIsWidgetsDrawerOpen] = useState(true);

  // استیت‌های باکس‌مدل و تایپوگرافی موضعی
  const [paddingTop, setPaddingTop] = useState<number>(40);
  const [paddingBottom, setPaddingBottom] = useState<number>(40);
  const [paddingX, setPaddingX] = useState<number>(20);
  const [marginTop, setMarginTop] = useState<number>(0);
  const [marginBottom, setMarginBottom] = useState<number>(0);
  const [borderRadius, setBorderRadius] = useState<number>(24);
  const [fontSize, setFontSize] = useState<number>(16);
  const [customCssBlock, setCustomCssBlock] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPagesList = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
        if (json.pages.length > 0 && !selectedPageId) {
          const home = json.pages.find((p: any) => p.slug === "home") || json.pages[0];
          loadPageDetails(home.slug);
        }
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
          selectBlockForInspect(p.blocks[0]);
        }
      }
    } catch {}
  };

  const selectBlockForInspect = (b: PageBlock) => {
    setActiveEditingBlockId(b.id);
    const s = b.styles as any || {};
    setPaddingTop(s.paddingTop ?? 40);
    setPaddingBottom(s.paddingBottom ?? 40);
    setPaddingX(s.paddingX ?? 20);
    setMarginTop(s.marginTop ?? 0);
    setMarginBottom(s.marginBottom ?? 0);
    setBorderRadius(s.borderRadiusNum ?? 24);
    setFontSize(s.fontSize ?? 16);
    setCustomCssBlock(b.data?.customCss || "");
  };

  useEffect(() => {
    fetchPagesList();

    const channel = supabase
      .channel("realtime-elementor-pro-studio")
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
    const newSlug = "landing-" + Math.random().toString(36).substring(2, 6);
    setSelectedPageId("");
    setPageTitle("صفحه جدید");
    setPageSlug(newSlug);
    setMetaDescription("");
    setIsPublished(true);
    const initialList = [
      createDefaultBlock("hero_banner"),
      createDefaultBlock("features_grid"),
      createDefaultBlock("cta_banner")
    ];
    setBlocks(initialList);
    selectBlockForInspect(initialList[0]);
  };

  function createDefaultBlock(type: BlockType): PageBlock {
    const id = "blk_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    switch (type) {
      case "header_nav":
        return {
          id, type, title: "هدر ناوبری", isVisible: true,
          styles: { paddingY: 4, maxWidth: "7xl", bgColor: "#0f172a", textColor: "#ffffff" },
          data: { brandName: "AXON CORE", logoText: "آکسون استودیو", navLinks: [{ label: "صفحه اصلی", url: "/" }, { label: "محصولات", url: "/products" }, { label: "تماس", url: "/contact" }], ctaButtonText: "ورود به کاتالوگ", ctaButtonUrl: "/products" }
        };
      case "hero_banner":
        return {
          id, type, title: "هیرو بنر بزرگ", isVisible: true,
          styles: { paddingY: 14, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff", textAlign: "center" },
          data: { badge: "🚀 مرجع مانیتورهای ۵K", headline: "دیدن واقعیت رنگ‌ها بدون مصالحه", subheadline: "تأمین، کالیبراسیون و واردات مانیتورهای استودیویی Apple و LG.", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200", primaryBtnText: "خرید مانیتورها", primaryBtnUrl: "/products", secondaryBtnText: "مشاوره فنی", secondaryBtnUrl: "/contact" }
        };
      case "features_grid":
        return {
          id, type, title: "مزایا و ویژگی‌ها", isVisible: true,
          styles: { paddingY: 10, maxWidth: "7xl", bgColor: "#090d16", textColor: "#ffffff" },
          data: { heading: "استانداردهای مهندسی آکسون", items: [{ icon: "🛡️", title: "گارانتی طلایی ۱۸ ماهه", desc: "تعویض بی قید و شرط." }, { icon: "⚡", title: "کالیبراسیون ۳D LUT", desc: "تراز رنگ‌های سینمایی." }, { icon: "🚀", title: "ارسال پیشتاز", desc: "بسته‌بندی ضربه‌گیر ویژه." }] }
        };
      case "product_showcase":
        return {
          id, type, title: "ویترین محصولات", isVisible: true,
          styles: { paddingY: 10, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff" },
          data: { heading: "پرفروش‌ترین تجهیزات استودیو", viewAllText: "مشاهده همه کالاها ←", viewAllUrl: "/products" }
        };
      case "accordion_faq":
        return {
          id, type, title: "پرسش و پاسخ (FAQ)", isVisible: true,
          styles: { paddingY: 10, maxWidth: "5xl", bgColor: "#0b0f19", textColor: "#ffffff" },
          data: { heading: "پرسش‌های پرتکرار", questions: [{ q: "آیا مانیتورها دارای گارانتی هستند؟", a: "بله، دارای ۱۸ ماه گارانتی طلایی تعویض می‌باشند." }] }
        };
      case "cta_banner":
        return {
          id, type, title: "فراخوان عمل (CTA)", isVisible: true,
          styles: { paddingY: 10, maxWidth: "7xl", bgColor: "#1e1b4b", textColor: "#ffffff", textAlign: "center" },
          data: { title: "نیاز به مشاوره اختصاصی چیدمان دارید؟", subtitle: "کارشناسان آکسون شما را در انتخاب مانیتور راهنمایی می‌کنند.", btnText: "شروع مشاوره آنلاین", btnUrl: "/contact" }
        };
      case "rich_text":
        return {
          id, type, title: "کد اختصاصی / متن سئو", isVisible: true,
          styles: { paddingY: 6, maxWidth: "5xl", bgColor: "#020617", textColor: "#ffffff" },
          data: { htmlContent: "<div class='p-4 border border-sky-500/30 rounded-2xl'>کد HTML یا استایل اختصاصی شما...</div>" }
        };
      case "footer_block":
        return {
          id, type, title: "فوتر صفحه", isVisible: true,
          styles: { paddingY: 8, maxWidth: "7xl", bgColor: "#020617", textColor: "#94a3b8" },
          data: { copyrightText: "تمامی حقوق برای آکسون محفوظ است © 2026", supportPhone: "09376110200" }
        };
    }
  }

  const handleAddBlock = (type: BlockType) => {
    soundEngine.playClick();
    const newBlock = createDefaultBlock(type);
    setBlocks([...blocks, newBlock]);
    selectBlockForInspect(newBlock);
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    soundEngine.playClick();
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;
    const list = [...blocks];
    const [item] = list.splice(index, 1);
    list.splice(target, 0, item);
    setBlocks(list);
  };

  // به‌روزرسانی مستقیم استایل‌ها و باکس‌مدل
  const updateActiveBlockStyles = (key: string, value: any) => {
    if (!activeEditingBlockId) return;
    setBlocks(blocks.map(b => {
      if (b.id === activeEditingBlockId) {
        return {
          ...b,
          styles: { ...b.styles, [key]: value }
        };
      }
      return b;
    }));
  };

  // به‌روزرسانی محتوای متنی مستقیم در بوم
  const handleInlineTextEdit = (blockId: string, dataKey: string, newText: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          data: { ...b.data, [dataKey]: newText }
        };
      }
      return b;
    }));
  };

  const handleSavePage = async () => {
    if (!pageTitle.trim() || !pageSlug.trim()) {
      alert("عنوان و نامک آدرس (Slug) الزامی است.");
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
        setToastMessage({ type: "success", text: "✓ تغییرات با موفقیت در دیتابیس ذخیره شد و روی ویترین سایت اعمال گردید." });
        fetchPagesList();
        if (!selectedPageId && json.page) setSelectedPageId(json.page.id);
      } else {
        setToastMessage({ type: "error", text: json.message || "خطا در ذخیره." });
      }
    } catch {
      setToastMessage({ type: "error", text: "خطای ارتباط با سرور." });
    } finally {
      setSaving(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const activeBlock = blocks.find(b => b.id === activeEditingBlockId);

  return (
    <div className="min-h-screen flex flex-col font-sans select-none text-[var(--text-primary)] space-y-4" dir="rtl">
      
      {/* نوار فرمان بالای استودیوی المنتور */}
      <header className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md">
            🏗️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-sky-400 font-bold uppercase">Elementor Pro Studio</span>
              <span className="text-[10px] text-slate-400">• مسیر لایو: /{pageSlug === "home" ? "" : pageSlug}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={pageSlug}
                onChange={(e) => loadPageDetails(e.target.value)}
                className="p-1.5 px-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black text-[var(--text-primary)] outline-none cursor-pointer"
              >
                {pages.map((p) => {
    const isSys = ["home", "products", "news", "blog", "about", "contact", "track-order"].includes(p.slug);
    return (
      <option key={p.id} value={p.slug}>
        {isSys ? "⭐ [صفحه اصلی سایت] " : "📄 [لندینگ سفارشی] "} {p.title} (/{p.slug === "home" ? "" : p.slug})
      </option>
    );
  })}
              </select>

              <button
                type="button"
                onClick={handleCreateNewPage}
                className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-[11px] font-bold text-[var(--accent-blue)] cursor-pointer"
              >
                + ساخت صفحه جدید
              </button>
            </div>
          </div>
        </div>

        {/* سوییچر دیوایس‌ها */}
        <div className="flex items-center gap-1.5 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--card-border)]">
          {[
            { id: "desktop" as const, icon: "🖥️", label: "دسکتاپ" },
            { id: "tablet" as const, icon: "📱", label: "تبلت" },
            { id: "mobile" as const, icon: "📲", label: "موبایل" },
          ].map((dev) => (
            <button
              key={dev.id}
              type="button"
              onClick={() => setPreviewDevice(dev.id)}
              className={"px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1 cursor-pointer " + (
                previewDevice === dev.id ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-slate-400"
              )}
            >
              <span>{dev.icon}</span>
              <span className="hidden md:inline">{dev.label}</span>
            </button>
          ))}
        </div>

        {/* دکمه‌های انتشار و مشاهده زنده */}
        <div className="flex items-center gap-2">
          <Link
            href={pageSlug === "home" ? "/" : `/${pageSlug}`}
            target="_blank"
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده در سایت</span>
            <span>🔗</span>
          </Link>

          <button
            type="button"
            onClick={handleSavePage}
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-xl transition cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال انتشار..." : "💾 ذخیره و انتشار سراسری"}
          </button>
        </div>
      </header>

      {toastMessage && (
        <div className={"p-3.5 rounded-2xl text-xs font-bold transition animate-fadeIn " + (
          toastMessage.type === "success" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 border border-rose-500/30 text-rose-600"
        )}>
          {toastMessage.text}
        </div>
      )}

      {/* محیط کاربری ۲ پنله المنتور */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        
        {/* پنل اینسپکتور و ویجت‌ها (سایدبار راست) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* جعبه ویجت‌ها */}
          <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
              <span className="font-black text-xs text-[var(--accent-blue)]">📦 مخزن ویجت‌ها:</span>
              <button
                type="button"
                onClick={() => setIsWidgetsDrawerOpen(!isWidgetsDrawerOpen)}
                className="text-[10px] text-slate-400 font-bold"
              >
                {isWidgetsDrawerOpen ? "بستن مخزن ▲" : "نمایش مخزن ▼"}
              </button>
            </div>

            {isWidgetsDrawerOpen && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { type: "header_nav" as const, label: "هدر ناوبری", icon: "🧭" },
                  { type: "hero_banner" as const, label: "هیرو بنر", icon: "🌟" },
                  { type: "product_showcase" as const, label: "ویترین کالا", icon: "🛍️" },
                  { type: "features_grid" as const, label: "مزایا و فیچرها", icon: "⚡" },
                  { type: "accordion_faq" as const, label: "پرسش‌ها (FAQ)", icon: "❓" },
                  { type: "cta_banner" as const, label: "فراخوان (CTA)", icon: "🎯" },
                  { type: "rich_text" as const, label: "کد اختصاصی / متن", icon: "💻" },
                  { type: "footer_block" as const, label: "فوتر", icon: "🔻" },
                ].map((w) => (
                  <button
                    key={w.type}
                    type="button"
                    onClick={() => handleAddBlock(w.type)}
                    className="p-2.5 rounded-2xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm hover:scale-102"
                  >
                    <span>{w.icon}</span>
                    <span>+ {w.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ناوبر ساختار لایه‌ها */}
          <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
              <span className="font-black text-xs text-[var(--text-primary)]">📑 ناوبر لایه‌ها ({blocks.length} بلوک):</span>
              <span className="text-[10px] text-slate-400 font-mono">Reorder</span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {blocks.map((b, idx) => (
                <div
                  key={b.id}
                  onClick={() => { soundEngine.playClick(); selectBlockForInspect(b); }}
                  className={"p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 " + (
                    activeEditingBlockId === b.id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 font-black shadow-sm"
                      : "border-[var(--card-border)] bg-[var(--input-bg)]"
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{idx + 1}.</span>
                    <span className="text-xs truncate">{b.title}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, "up"); }} disabled={idx === 0} className="p-1 px-1.5 rounded-lg bg-[var(--modal-bg)] text-[10px]">▲</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, "down"); }} disabled={idx === blocks.length - 1} className="p-1 px-1.5 rounded-lg bg-[var(--modal-bg)] text-[10px]">▼</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setBlocks(blocks.filter(x => x.id !== b.id)); }} className="p-1 px-1.5 rounded-lg text-rose-500 text-[10px]">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* پنل بازرسی ۳ تب المنتور (Content / Style / Advanced) */}
          {activeBlock && (
            <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
                <span className="font-black text-xs text-[var(--accent-blue)]">🎛️ اینسپکتور: {activeBlock.title}</span>
                <div className="flex gap-1 bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--card-border)]">
                  {[
                    { id: "content" as const, label: "محتوا" },
                    { id: "style" as const, label: "استایل و فواصل" },
                    { id: "advanced" as const, label: "کد CSS زنده" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInspectorTab(tab.id)}
                      className={"px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer " + (
                        inspectorTab === tab.id ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-slate-400"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* تب محتوا */}
              {inspectorTab === "content" && (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-400">نام این بلوک در پنل:</label>
                    <input
                      type="text"
                      value={activeBlock.title}
                      onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, title: e.target.value } : b))}
                      className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold"
                    />
                  </div>

                  {activeBlock.type === "hero_banner" && (
                    <>
                      <div>
                        <label className="block mb-1 text-[11px] font-bold text-slate-400">بج بالای تیتر:</label>
                        <input
                          type="text"
                          value={activeBlock.data.badge || ""}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, badge: e.target.value } } : b))}
                          className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] font-bold text-slate-400">تیتر اصلی هیرو (Headline):</label>
                        <input
                          type="text"
                          value={activeBlock.data.headline || ""}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, headline: e.target.value } } : b))}
                          className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] font-bold text-slate-400">زیرعنوان توضیحات:</label>
                        <textarea
                          rows={2}
                          value={activeBlock.data.subheadline || ""}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, subheadline: e.target.value } } : b))}
                          className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] font-bold text-slate-400">آدرس تصویر (URL):</label>
                        <input
                          type="text"
                          value={activeBlock.data.imageUrl || ""}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, imageUrl: e.target.value } } : b))}
                          className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
                        />
                      </div>
                    </>
                  )}

                  {activeBlock.type === "cta_banner" && (
                    <>
                      <div>
                        <label className="block mb-1 text-[11px] font-bold text-slate-400">عنوان کمپین:</label>
                        <input
                          type="text"
                          value={activeBlock.data.title || ""}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, title: e.target.value } } : b))}
                          className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="متن دکمه"
                          value={activeBlock.data.btnText || ""}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, btnText: e.target.value } } : b))}
                          className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs"
                        />
                        <input
                          type="text"
                          placeholder="لینک دکمه"
                          value={activeBlock.data.btnUrl || ""}
                          onChange={(e) => setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, btnUrl: e.target.value } } : b))}
                          className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* تب استایل، فاصله‌گذاری جعبه‌ای (Box Model) و ابعاد */}
              {inspectorTab === "style" && (
                <div className="space-y-4">
                  {/* باکس‌مدل فاصله‌گذاری ۴ جهته المنتور */}
                  <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                    <span className="font-bold text-[10px] text-slate-400 block">فاصله‌گذاری داخلی پدینگ (Padding - px):</span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <label className="text-[9px] text-slate-500 block">بالا (Top)</label>
                        <input
                          type="number"
                          value={paddingTop}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setPaddingTop(v);
                            updateActiveBlockStyles("paddingTop", v);
                          }}
                          className="w-full p-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block">پایین (Bottom)</label>
                        <input
                          type="number"
                          value={paddingBottom}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setPaddingBottom(v);
                            updateActiveBlockStyles("paddingBottom", v);
                          }}
                          className="w-full p-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block">افقی (Sides)</label>
                        <input
                          type="number"
                          value={paddingX}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setPaddingX(v);
                            updateActiveBlockStyles("paddingX", v);
                          }}
                          className="w-full p-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* کنترل شعاع گوشه‌ها و رنگ‌ها */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-slate-400">انحنای گوشه (Radius):</label>
                      <input
                        type="number"
                        value={borderRadius}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setBorderRadius(v);
                          updateActiveBlockStyles("borderRadiusNum", v);
                        }}
                        className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-slate-400">رنگ پس‌زمینه:</label>
                      <input
                        type="text"
                        value={activeBlock.styles.bgColor || "#020617"}
                        onChange={(e) => updateActiveBlockStyles("bgColor", e.target.value)}
                        className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* تب کد اختصاصی CSS / HTML */}
              {inspectorTab === "advanced" && (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-400">کدهای سفارشی CSS برای این بلوک:</label>
                    <textarea
                      rows={5}
                      value={customCssBlock}
                      onChange={(e) => {
                        setCustomCssBlock(e.target.value);
                        setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, customCss: e.target.value } } : b));
                      }}
                      placeholder="selector { box-shadow: 0 0 30px #0284c7; }"
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[11px] leading-relaxed text-sky-400"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* بوم پیش‌نمایش زنده و تعاملی المنتور (WYSIWYG Live Canvas) */}
        <div className="lg:col-span-8 flex justify-center w-full">
          <div
            className={"transition-all duration-300 rounded-[2.5rem] bg-[var(--modal-bg)] border-2 border-[var(--card-border)] shadow-2xl overflow-hidden min-h-[700px] w-full " + (
              previewDevice === "mobile"
                ? "max-w-[390px] border-sky-500/50 shadow-sky-500/10"
                : previewDevice === "tablet"
                ? "max-w-[768px] border-indigo-500/50"
                : "max-w-full"
            )}
          >
            {/* سربرگ استاتوس بوم زنده */}
            <div className="p-3.5 bg-[var(--input-bg)] border-b border-[var(--card-border)] flex justify-between items-center text-xs px-6">
              <span className="font-mono text-[10px] text-slate-400">شبیه‌ساز المنتور: {previewDevice.toUpperCase()}</span>
              <span className="font-bold text-xs text-sky-400">● ویرایش درجا (Inline Editing) فعال است</span>
            </div>

            {/* محتوای زنده روی بوم با قابلیت کلیک و تایپ مستقیم در متن */}
            <div className="p-6 space-y-6">
              {blocks.length === 0 ? (
                <div className="py-24 text-center text-slate-400 font-bold text-xs">
                  بوم خالی است. از پنل سمت راست بلوک اضافه کنید.
                </div>
              ) : (
                blocks.map((b) => {
                  const s = b.styles as any || {};
                  return (
                    <div
                      key={b.id}
                      onClick={() => { soundEngine.playClick(); selectBlockForInspect(b); }}
                      className={"rounded-3xl transition border-2 cursor-pointer relative group " + (
                        activeEditingBlockId === b.id
                          ? "border-[var(--accent-blue)] bg-sky-500/5 shadow-xl"
                          : "border-transparent hover:border-sky-500/30 bg-[var(--input-bg)]"
                      )}
                      style={{
                        backgroundColor: s.bgColor || "transparent",
                        color: s.textColor || "inherit",
                        paddingTop: `${s.paddingTop ?? 32}px`,
                        paddingBottom: `${s.paddingBottom ?? 32}px`,
                        paddingLeft: `${s.paddingX ?? 16}px`,
                        paddingRight: `${s.paddingX ?? 16}px`,
                        borderRadius: `${s.borderRadiusNum ?? 24}px`,
                      }}
                    >
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-white font-mono text-[9px] opacity-0 group-hover:opacity-100 transition">
                        {b.type}
                      </span>

                      {/* هیرو بنر با قابلیت ویرایش زنده تیتر روی بوم */}
                      {b.type === "hero_banner" && (
                        <div className="text-center space-y-3">
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleInlineTextEdit(b.id, "badge", e.currentTarget.textContent || "")}
                            className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-bold outline-none border border-transparent hover:border-sky-500/40 inline-block"
                          >
                            {b.data.badge || "بج هیرو"}
                          </span>

                          <h2
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleInlineTextEdit(b.id, "headline", e.currentTarget.textContent || "")}
                            className="text-xl sm:text-3xl font-black outline-none border border-transparent hover:border-sky-500/40 rounded-xl p-1"
                          >
                            {b.data.headline || "تیتر اصلی"}
                          </h2>

                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleInlineTextEdit(b.id, "subheadline", e.currentTarget.textContent || "")}
                            className="text-xs opacity-80 max-w-lg mx-auto outline-none border border-transparent hover:border-sky-500/40 rounded-xl p-1 leading-relaxed"
                          >
                            {b.data.subheadline || "توضیحات هیرو"}
                          </p>

                          {b.data.imageUrl && (
                            <div className="w-full h-44 rounded-2xl overflow-hidden mt-3 shadow-md">
                              <img src={b.data.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* فراخوان عمل */}
                      {b.type === "cta_banner" && (
                        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 text-center space-y-2 border border-blue-500/20">
                          <h3
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleInlineTextEdit(b.id, "title", e.currentTarget.textContent || "")}
                            className="font-black text-sm outline-none"
                          >
                            {b.data.title}
                          </h3>
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleInlineTextEdit(b.id, "subtitle", e.currentTarget.textContent || "")}
                            className="text-xs opacity-80 outline-none"
                          >
                            {b.data.subtitle}
                          </p>
                        </div>
                      )}

                      {/* متن آزاد یا کد اختصاصی */}
                      {b.type === "rich_text" && (
                        <div
                          dangerouslySetInnerHTML={{ __html: b.data.htmlContent || "محتوای سفارشی..." }}
                          className="prose dark:prose-invert max-w-none text-xs"
                        />
                      )}

                      {/* سایر بلوک‌ها */}
                      {b.type !== "hero_banner" && b.type !== "cta_banner" && b.type !== "rich_text" && (
                        <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center text-xs">
                          {b.title} ({b.type})
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
