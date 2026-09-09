"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { BlockType, PageBlock, ModularPageDocument } from "@/lib/modularBuilderTypes";
import { supabase } from "@/lib/supabase";

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string; is_published: boolean }>>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);

  const [activeEditingBlockId, setActiveEditingBlockId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPagesList = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
        if (json.pages.length > 0 && !selectedPageId) {
          loadPageDetails(json.pages[0].slug);
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
          setActiveEditingBlockId(p.blocks[0].id);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchPagesList();

    // همگام‌سازی بلادرنگ با کانال وب‌سوکت
    const channel = supabase
      .channel("realtime-modular-pages-admin")
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
    setPageSlug("landing-" + Math.random().toString(36).substring(2, 6));
    setMetaDescription("توضیحات سئو جهت رتبه‌بندی در نتایج گوگل...");
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
          id,
          type,
          title: "هدر و نوبار اختصاصی",
          isVisible: true,
          styles: { paddingY: 4, maxWidth: "7xl", bgColor: "#0f172a", textColor: "#ffffff" },
          data: {
            brandName: "AXON CORE",
            logoText: "آکسون استودیو",
            navLinks: [
              { label: "صفحه اصلی", url: "/" },
              { label: "محصولات", url: "/products" },
              { label: "اخبار", url: "/news" },
              { label: "تماس", url: "/contact" }
            ],
            ctaButtonText: "ورود به فروشگاه",
            ctaButtonUrl: "/products"
          }
        };

      case "hero_banner":
        return {
          id,
          type,
          title: "هیرو بنر اصلی (Hero Banner)",
          isVisible: true,
          styles: { paddingY: 16, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff", textAlign: "center" },
          data: {
            badge: "🚀 مرجع تخصصی کالیبراسیون و مانیتورهای ۵K",
            headline: "کیفیت دیداری بدون مصالحه برای حرفه‌ای‌ها",
            subheadline: "تأمین، کالیبراسیون سخت‌افزاری و واردات مانیتورهای استودیویی با ۱۸ ماه گارانتی طلایی اصالت.",
            imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
            primaryBtnText: "مشاهده کاتالوگ مانیتورها",
            primaryBtnUrl: "/products",
            secondaryBtnText: "استعلام مشاوره فنی",
            secondaryBtnUrl: "/contact"
          }
        };

      case "features_grid":
        return {
          id,
          type,
          title: "گرید مزایا و ویژگی‌ها (Features)",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#090d16", textColor: "#ffffff" },
          data: {
            heading: "چرا تدوین‌گران برجسته آکسون را انتخاب می‌کنند؟",
            items: [
              { icon: "🛡️", title: "ضمانت ۱۰۰٪ اصالت فیزیکی", desc: "واردات مستقیم قطعات اورجینال بدون واسطه و با تست سلامت کارخانه." },
              { icon: "⚡", title: "کالیبراسیون سخت‌افزاری ۳D LUT", desc: "تنظیم تراز دقیق رنگ‌ها بر اساس فضاهای رنگی استانداردهای سینمایی." },
              { icon: "🚀", title: "ارسال پیشتاز سراسری", desc: "بسته‌بندی ضربه‌گیر ویژه تجهیزات گران‌قیمت با بیمه کامل مرسوله." }
            ]
          }
        };

      case "product_showcase":
        return {
          id,
          type,
          title: "ویترین کالاهای منتخب",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff" },
          data: {
            heading: "پرفروش‌ترین مانیتورها و تجهیزات استودیو",
            categoryFilter: "all",
            limit: 4,
            viewAllText: "مشاهده همه کالاها ←",
            viewAllUrl: "/products"
          }
        };

      case "accordion_faq":
        return {
          id,
          type,
          title: "پرسش و پاسخ متداول (FAQ)",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "5xl", bgColor: "#0b0f19", textColor: "#ffffff" },
          data: {
            heading: "پرسش‌های پرتکرار مشتریان",
            questions: [
              { q: "آیا مانیتورها دارای گارانتی تعویض هستند؟", a: "بله، تمام مانیتورهای ۵K دارای ۱۸ ماه گارانتی طلایی تعویض بی قید و شرط می‌باشند." },
              { q: "امکان خرید حضوری و تست تصویر وجود دارد؟", a: "بله، در دفتر شیراز با هماهنگی قبلی می‌توانید کالیبراسیون رنگ را از نزدیک بررسی فرمایید." }
            ]
          }
        };

      case "cta_banner":
        return {
          id,
          type,
          title: "فراخوان عمل و کمپین (CTA)",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#1e1b4b", textColor: "#ffffff", textAlign: "center" },
          data: {
            title: "به یک مشاوره تخصصی برای استودیوی خود نیاز دارید؟",
            subtitle: "کارشناسان فنی آکسون شما را در انتخاب کابل مناسب، پایه و مانیتور یاری می‌کنند.",
            btnText: "ثبت تیکت مشاوره آنلاین",
            btnUrl: "/contact"
          }
        };

      case "rich_text":
        return {
          id,
          type,
          title: "بلوک متن آزاد و سئو (Rich Text)",
          isVisible: true,
          styles: { paddingY: 8, maxWidth: "5xl", bgColor: "#020617", textColor: "#ffffff" },
          data: {
            htmlContent: "<p>متن تخصصی سئو جهت افزایش رتبه سایت در موتورهای جستجو...</p>"
          }
        };

      case "footer_block":
        return {
          id,
          type,
          title: "فوتر اختصاصی صفحه",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#020617", textColor: "#94a3b8" },
          data: {
            copyrightText: "تمامی حقوق مادی و معنوی برای آکسون محفوظ است © 2026",
            supportPhone: "09376110200"
          }
        };
    }
  }

  const handleAddBlock = (type: BlockType) => {
    soundEngine.playClick();
    const newBlock = createDefaultBlock(type);
    const updated = [...blocks, newBlock];
    setBlocks(updated);
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

  const handleToggleVisibility = (id: string) => {
    soundEngine.playClick();
    setBlocks(blocks.map(b => b.id === id ? { ...b, isVisible: !b.isVisible } : b));
  };

  const handleDeleteBlock = (id: string) => {
    if (!confirm("آیا از حذف این بلوک اطمینان دارید؟")) return;
    soundEngine.playClick();
    setBlocks(blocks.filter(b => b.id !== id));
    if (activeEditingBlockId === id) setActiveEditingBlockId(null);
  };

  const handleSavePage = async () => {
    if (!pageTitle.trim() || !pageSlug.trim()) {
      alert("عنوان صفحه و آدرس (Slug) الزامی است.");
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
        setToastMessage({ type: "success", text: "✓ صفحه ماژولار با موفقیت در دیتابیس ذخیره و بلادرنگ منتشر گردید." });
        fetchPagesList();
        if (!selectedPageId && json.page) {
          setSelectedPageId(json.page.id);
        }
      } else {
        setToastMessage({ type: "error", text: json.message || "خطا در ذخیره‌سازی صفحه." });
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
      
      {/* سربرگ ویرایشگر صفحه ساز */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-sky-500/25">
            🏗️
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black">صفحه ساز ماژولار و بصری آکسون (Modular Visual Builder)</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
              ویرایش جزء‌به‌جزء هدر، فوتر، بنرها و سکشن‌های صفحه اصلی و لندینگ‌ها بدون یک خط کدنویسی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNewPage}
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-black transition cursor-pointer"
          >
            + ایجاد صفحه جدید
          </button>
          <button
            type="button"
            onClick={handleSavePage}
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال انتشار..." : "💾 ذخیره و انتشار سراسری"}
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className={"p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " + (
          toastMessage.type === "success" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 border border-rose-500/30 text-rose-600"
        )}>
          {toastMessage.text}
        </div>
      )}

      {/* نوار تنظیمات کلی صفحه (عنوان، اسلاگ، سئو) */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block mb-1 font-bold text-[var(--text-secondary)]">انتخاب صفحه جهت ویرایش:</label>
          <select
            value={pageSlug}
            onChange={(e) => loadPageDetails(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none cursor-pointer text-[var(--text-primary)]"
          >
            {pages.map((p) => (
              <option key={p.id} value={p.slug}>📄 {p.title} ({p.slug === "home" ? "/" : "/" + p.slug})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان صفحه (Title):</label>
          <input
            type="text"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="block mb-1 font-bold text-[var(--text-secondary)]">نامک آدرس (Slug):</label>
          <input
            type="text"
            value={pageSlug}
            onChange={(e) => setPageSlug(e.target.value)}
            placeholder="home یا جشنواره-تخفیف"
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs outline-none text-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="block mb-1 font-bold text-[var(--text-secondary)]">توضیحات سئو (Meta Description):</label>
          <input
            type="text"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="توضیحات اختصاصی جهت ایندکس گوگل..."
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none text-[var(--text-primary)]"
          />
        </div>
      </div>

      {/* جعبه‌ابزار افزودن بلوک‌های جدید (سبک المنتور) */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-2">
        <span className="text-xs font-black text-[var(--text-secondary)] block">
          ➕ افزودن بخش ساختاری جدید به صفحه:
        </span>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { type: "header_nav" as const, label: "هدر و نوبار", icon: "🧭" },
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
              className="p-2 px-3 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>{item.icon}</span>
              <span>+ {item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* فضای کاری: ستون راست ساختار بلوک‌ها + ستون چپ تنظیمات بصری بلوک فعال */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ستون ساختار لایه‌ها و بلوک‌ها (Reorder / Toggle / Delete) */}
        <div className="lg:col-span-5 bg-[var(--modal-bg)] p-5 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-3 h-fit">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <h3 className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <span>📑</span>
              <span>لایه‌های ساختاری صفحه ({blocks.length} بخش)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">چیدمان از بالا به پایین</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {blocks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">هیچ بخشی اضافه نشده است. از جعبه‌ابزار بالا بخش اضافه کنید.</div>
            ) : (
              blocks.map((b, idx) => {
                const isActive = activeEditingBlockId === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => { soundEngine.playClick(); setActiveEditingBlockId(b.id); }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                      isActive
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-md"
                        : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                    } ${!b.isVisible ? "opacity-50" : ""}`}
                  >
                    <div className="space-y-0.5 overflow-hidden">
                      <span className="font-mono text-[9px] text-[var(--accent-blue)] font-bold block uppercase">{b.type}</span>
                      <h4 className="font-black text-xs text-[var(--text-primary)] truncate">{b.title}</h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, "up"); }}
                        disabled={idx === 0}
                        className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer text-xs"
                        title="انتقال به بالاتر"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, "down"); }}
                        disabled={idx === blocks.length - 1}
                        className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer text-xs"
                        title="انتقال به پایین‌تر"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleToggleVisibility(b.id); }}
                        className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] cursor-pointer text-xs"
                        title={b.isVisible ? "مخفی کردن" : "نمایان کردن"}
                      >
                        {b.isVisible ? "👁️" : "🙈"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(b.id); }}
                        className="p-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition cursor-pointer text-xs font-bold"
                        title="حذف بلوک"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ستون چپ: پنل بازرسی و ویرایش ویژگی‌های بلوک فعال (Visual Inspector) */}
        <div className="lg:col-span-7">
          {activeBlock ? (
            <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
              <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
                <div>
                  <h3 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-1.5">
                    <span>🎛️</span>
                    <span>تنظیمات و ابعاد: {activeBlock.title}</span>
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400">شناسه لایه: {activeBlock.id}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-bold">
                  نوع: {activeBlock.type}
                </span>
              </div>

              {/* تنظیمات استایل بصری و ابعاد (رنگ، پدینگ، عرض کانتینر) */}
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                <span className="font-black text-[11px] text-[var(--text-primary)] block">🎨 استایل بصری و چیدمان:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block mb-1 text-[10px] font-bold text-slate-400">رنگ پس‌زمینه:</label>
                    <input
                      type="text"
                      value={activeBlock.styles.bgColor || "#020617"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, styles: { ...b.styles, bgColor: val } } : b));
                      }}
                      className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[10px]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-[10px] font-bold text-slate-400">رنگ متن:</label>
                    <input
                      type="text"
                      value={activeBlock.styles.textColor || "#ffffff"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, styles: { ...b.styles, textColor: val } } : b));
                      }}
                      className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[10px]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-[10px] font-bold text-slate-400">پدینگ عمودی (Y):</label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={activeBlock.styles.paddingY || 12}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, styles: { ...b.styles, paddingY: val } } : b));
                      }}
                      className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[10px]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-[10px] font-bold text-slate-400">عرض کانتینر:</label>
                    <select
                      value={activeBlock.styles.maxWidth || "7xl"}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, styles: { ...b.styles, maxWidth: val } } : b));
                      }}
                      className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-[10px] cursor-pointer"
                    >
                      <option value="full">تمام‌عرض (Full Width)</option>
                      <option value="7xl">استاندارد (7XL Container)</option>
                      <option value="5xl">جمع‌وجور (5XL Container)</option>
                      <option value="3xl">باریک (3XL Container)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ویرایش محتوای متنی و داده‌های بلوک هیرو بنر */}
              {activeBlock.type === "hero_banner" && (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">بج نشانگر بالا (Badge):</label>
                    <input
                      type="text"
                      value={activeBlock.data.badge || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, badge: val } } : b));
                      }}
                      className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-slate-400">تیتر اصلی هیرو (Headline):</label>
                    <input
                      type="text"
                      value={activeBlock.data.headline || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, headline: val } } : b));
                      }}
                      className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-black text-xs"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-slate-400">زیرعنوان توضیحات (Subheadline):</label>
                    <textarea
                      rows={2}
                      value={activeBlock.data.subheadline || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, subheadline: val } } : b));
                      }}
                      className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 font-bold text-slate-400">متن دکمه اصلی:</label>
                      <input
                        type="text"
                        value={activeBlock.data.primaryBtnText || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, primaryBtnText: val } } : b));
                        }}
                        className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-400">لینک دکمه اصلی:</label>
                      <input
                        type="text"
                        value={activeBlock.data.primaryBtnUrl || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, primaryBtnUrl: val } } : b));
                        }}
                        className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-slate-400">آدرس تصویر شاخص هیرو (Image URL):</label>
                    <input
                      type="text"
                      value={activeBlock.data.imageUrl || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, imageUrl: val } } : b));
                      }}
                      className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* ویرایش محتوای بلوک هدر ناوبری */}
              {activeBlock.type === "header_nav" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 font-bold text-slate-400">نام برند (لاتین):</label>
                      <input
                        type="text"
                        value={activeBlock.data.brandName || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, brandName: val } } : b));
                        }}
                        className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-black text-xs uppercase"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-400">عنوان لوگو (فارسی):</label>
                      <input
                        type="text"
                        value={activeBlock.data.logoText || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, logoText: val } } : b));
                        }}
                        className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ویرایش محتوای بلوک فراخوان عمل CTA */}
              {activeBlock.type === "cta_banner" && (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">تیتر کمپین فراخوان عمل:</label>
                    <input
                      type="text"
                      value={activeBlock.data.title || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, title: val } } : b));
                      }}
                      className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-black text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">توضیحات زیرعنوان کمپین:</label>
                    <textarea
                      rows={2}
                      value={activeBlock.data.subtitle || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, subtitle: val } } : b));
                      }}
                      className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs leading-relaxed"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 font-bold text-slate-400">متن دکمه اقدام:</label>
                      <input
                        type="text"
                        value={activeBlock.data.btnText || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, btnText: val } } : b));
                        }}
                        className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-400">آدرس پیوند (URL):</label>
                      <input
                        type="text"
                        value={activeBlock.data.btnUrl || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlocks(blocks.map(b => b.id === activeBlock.id ? { ...b, data: { ...b.data, btnUrl: val } } : b));
                        }}
                        className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* دکمه ذخیره تغییرات همین صفحه */}
              <div className="pt-2 border-t border-[var(--card-border)] flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePage}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer shadow-md"
                >
                  {saving ? "در حال ذخیره..." : "💾 ذخیره فوری تغییرات در دیتابیس"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-slate-400">
              یک بخش را از ستون لایه‌ها انتخاب کنید تا تنظیمات و ابعاد آن در اینجا باز شود.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
