"use client";

import React, { useState, useEffect } from "react";
import {
  siteInfoService,
  SiteInfo,
  HomepageLayoutConfig,
  DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
  HeaderMenuItem,
  FooterLinkItem,
} from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

export default function StorefrontLayoutStudio() {
  const [activeTab, setActiveTab] = useState<"header" | "sections" | "footer" | "media" | "responsive">("header");
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [config, setConfig] = useState<HomepageLayoutConfig>(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // حالت‌های ویرایش درجا برای منوی هدر
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editMenuTitle, setEditMenuTitle] = useState("");
  const [editMenuUrl, setEditMenuUrl] = useState("");
  const [editMenuBadge, setEditMenuBadge] = useState("");

  // فیلدهای لینک جدید
  const [newMenuTitle, setNewMenuTitle] = useState("");
  const [newMenuUrl, setNewMenuUrl] = useState("");
  const [newMenuBadge, setNewMenuBadge] = useState("");
  // state های مدیریت لینک‌های فوتر
  const [editingQuickId,   setEditingQuickId]   = useState<string|null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string|null>(null);
  const [newQuickTitle,    setNewQuickTitle]    = useState("");
  const [newQuickUrl,      setNewQuickUrl]      = useState("");
  const [newServiceTitle,  setNewServiceTitle]  = useState("");
  const [newServiceUrl,    setNewServiceUrl]    = useState("");
  const [editQuickTitle,   setEditQuickTitle]   = useState("");
  const [editQuickUrl,     setEditQuickUrl]     = useState("");
  const [editServiceTitle, setEditServiceTitle] = useState("");
  const [editServiceUrl,   setEditServiceUrl]   = useState("");

  const [mediaModal, setMediaModal] = useState<{
    open: boolean;
    target: "headerLogo" | "footerLogo" | "favicon" | null;
  }>({ open: false, target: null });

  const loadData = async () => {
    const info = await siteInfoService.getSiteInfo();
    if (info) {
      setSiteInfo(info);
      if (info.homepage_layout_config) {
        setConfig({
          ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
          ...info.homepage_layout_config,
          header: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.header, ...(info.homepage_layout_config.header || {}) },
          footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...(info.homepage_layout_config.footer || {}) },
        });
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (customConfig?: HomepageLayoutConfig) => {
    soundEngine.playClick();
    setSaving(true);
    setStatusMessage(null);

    const configToSave = customConfig || config;

    try {
      const updated = await siteInfoService.updateSiteInfo({
        homepage_layout_config: configToSave,
        logo_url: configToSave.header.brand.logoUrl,
        footer_logo_url: configToSave.footer.logoUrl,
        site_name: configToSave.header.brand.name,
        tagline: configToSave.header.brand.tagline,
        description: configToSave.footer.description,
      });

      if (updated) {
        soundEngine.playSuccess();
        setStatusMessage({
          type: "success",
          text: "⚡ تمامی تغییرات در دیتابیس ثبت و بلادرنگ در کل سایت و تمام پلتفرم‌ها اعمال گردید.",
        });
      }
    } catch {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی اطلاعات." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  // شروع ویرایش یک منو
  const startEditMenu = (item: HeaderMenuItem) => {
    soundEngine.playClick();
    setEditingMenuId(item.id);
    setEditMenuTitle(item.title);
    setEditMenuUrl(item.url);
    setEditMenuBadge(item.badge || "");
  };

  // ذخیره ویرایش نام و لینک منو
  const saveEditMenu = () => {
    if (!editMenuTitle.trim() || !editMenuUrl.trim() || !editingMenuId) return;
    soundEngine.playClick();
    const updatedItems = config.header.menu.items.map((item) =>
      item.id === editingMenuId
        ? { ...item, title: editMenuTitle.trim(), url: editMenuUrl.trim(), badge: editMenuBadge.trim() || undefined }
        : item
    );
    const updated = {
      ...config,
      header: { ...config.header, menu: { ...config.header.menu, items: updatedItems } },
    };
    setConfig(updated);
    setEditingMenuId(null);
  };

  const addMenuItem = () => {
    if (!newMenuTitle.trim() || !newMenuUrl.trim()) return;
    soundEngine.playClick();
    const newItem: HeaderMenuItem = {
      id: `menu_${Date.now()}`,
      title: newMenuTitle.trim(),
      url: newMenuUrl.trim(),
      badge: newMenuBadge.trim() || undefined,
      order: config.header.menu.items.length + 1,
      show: true,
    };
    const updated = {
      ...config,
      header: {
        ...config.header,
        menu: { ...config.header.menu, items: [...config.header.menu.items, newItem] },
      },
    };
    setConfig(updated);
    setNewMenuTitle("");
    setNewMenuUrl("");
    setNewMenuBadge("");
  };

  const removeMenuItem = (id: string) => {
    soundEngine.playClick();
    const updated = config.header.menu.items.filter((i) => i.id !== id);
    setConfig({ ...config, header: { ...config.header, menu: { ...config.header.menu, items: updated } } });
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ استودیو */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🎨</span> استودیوی کنترل دیداری ۱۰۰٪ ویترین (Storefront Studio)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            شخصی‌سازی هدر، ویرایش متن تک‌تک منوها، فوتر، لوگوها، سکشن‌ها و داک هوش مصنوعی
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار سراسری"}
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${
          statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-rose-500/15 text-rose-600 border border-rose-500/30"
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* تب‌های استودیو */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold overflow-x-auto scrollbar-none">
        {[
          { id: "header", label: "۱. هدر و ویرایش منوها", icon: "🧭" },
          { id: "sections", label: "۲. چینش سکشن‌ها", icon: "📐" },
          { id: "footer", label: "۳. فوتر و اینماد", icon: "⚓" },
          { id: "media", label: "۴. لوگوها و فاوآیکون", icon: "🖼️" },
          { id: "responsive", label: "۵. پیش‌نمایش ریسپانسیو", icon: "📱" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab(t.id as any);
            }}
            className={`flex-1 min-w-[130px] py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === t.id ? "bg-[var(--accent-blue)] text-white shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* تب ۱: هدر و قابلیت ویرایش متن منوها */}
      {activeTab === "header" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          <div className="border-b border-[var(--card-border)] pb-4 space-y-4">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">⚙️ استایل و رفتار هدر با اسکرول:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">استایل هدر:</label>
                <select
                  value={config.header.variant}
                  onChange={(e: any) => setConfig({ ...config, header: { ...config.header, variant: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none"
                >
                  <option value="capsule">کپسولی شناور (اپلی)</option>
                  <option value="full-width">تمام‌عرض چسبیده</option>
                  <option value="bordered">نوار حاشیه‌دار</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">موقعیت در صفحه:</label>
                <select
                  value={config.header.position}
                  onChange={(e: any) => setConfig({ ...config, header: { ...config.header, position: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none"
                >
                  <option value="fixed">ثابت بالای صفحه (Fixed)</option>
                  <option value="sticky">چسبان با اسکرول (Sticky)</option>
                  <option value="static">معمولی (Static)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">حداکثر عرض (px):</label>
                <input
                  type="number"
                  value={config.header.maxWidth}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, maxWidth: Number(e.target.value) } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">ارتفاع هدر (px):</label>
                <input
                  type="number"
                  value={config.header.height}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, height: Number(e.target.value) } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.header.shrinkOnScroll}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, shrinkOnScroll: e.target.checked } })}
                  className="w-4 h-4 rounded text-[var(--accent-blue)]"
                />
                کوچک‌شدن نرم با اسکرول (Shrink on Scroll)
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.header.actions.themeToggle.show}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, actions: { ...config.header.actions, themeToggle: { ...config.header.actions.themeToggle, show: e.target.checked } } } })}
                  className="w-4 h-4 rounded text-[var(--accent-blue)]"
                />
                دکمه تغییر تم
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.header.actions.cart.show}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, actions: { ...config.header.actions, cart: { ...config.header.actions.cart, show: e.target.checked } } } })}
                  className="w-4 h-4 rounded text-[var(--accent-blue)]"
                />
                دکمه سبد خرید
              </label>
            </div>
          </div>

          {/* لیست منوها با قابلیت ویرایش نام تک‌تک آن‌ها */}
          <div className="space-y-4">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">📋 ویرایش نام و آدرس آیتم‌های منو:</h3>
            
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {config.header.menu.items.map((item, idx) => {
                const isEditing = editingMenuId === item.id;

                return (
                  <div key={item.id} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    {isEditing ? (
                      <div className="flex-1 flex flex-wrap gap-2 w-full items-center">
                        <input
                          type="text"
                          value={editMenuTitle}
                          onChange={(e) => setEditMenuTitle(e.target.value)}
                          placeholder="عنوان منو"
                          className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--accent-blue)] font-bold text-xs flex-1"
                        />
                        <input
                          type="text"
                          value={editMenuUrl}
                          onChange={(e) => setEditMenuUrl(e.target.value)}
                          placeholder="لینک (/news)"
                          className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs flex-1"
                        />
                        <input
                          type="text"
                          value={editMenuBadge}
                          onChange={(e) => setEditMenuBadge(e.target.value)}
                          placeholder="برچسب"
                          className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs w-20"
                        />
                        <button type="button" onClick={saveEditMenu} className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">ثبت ✓</button>
                        <button type="button" onClick={() => setEditingMenuId(null)} className="px-3 py-2 rounded-xl bg-slate-700 text-white font-bold text-xs">انصراف</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[var(--modal-bg)] border text-[10px] font-mono flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-bold">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({item.url})</span>
                          {item.badge && <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white text-[9px]">{item.badge}</span>}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditMenu(item)}
                            className="px-3 py-1 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold cursor-pointer"
                          >
                            ویرایش نام ✏️
                          </button>
                          <button type="button" onClick={() => removeMenuItem(item.id)} className="text-rose-500 font-bold px-2 cursor-pointer">✕</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* افزودن منوی جدید */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row gap-2">
              <input type="text" placeholder="عنوان جدید (مثال: اخبار)" value={newMenuTitle} onChange={(e) => setNewMenuTitle(e.target.value)} className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold" />
              <input type="text" placeholder="لینک مقصد (/news)" value={newMenuUrl} onChange={(e) => setNewMenuUrl(e.target.value)} className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-mono" />
              <input type="text" placeholder="برچسب (اختیاری)" value={newMenuBadge} onChange={(e) => setNewMenuBadge(e.target.value)} className="w-28 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs" />
              <button type="button" onClick={addMenuItem} className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow">+ افزودن منو</button>
            </div>
          </div>
        </div>
      )}

      {/* تب ۲: سکشن‌های صفحه اصلی + ویرایش متن هیرو */}
      {activeTab === "sections" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          
          {/* نمایش/مخفی بخش‌ها */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">🔀 نمایش/مخفی‌کردن بخش‌های صفحه اصلی:</h3>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۱. بخش هیرو و بنر اصلی</span>
              <input type="checkbox" checked={config.hero.show} onChange={(e) => setConfig({ ...config, hero: { ...config.hero, show: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۲. کاتالوگ محصولات</span>
              <input type="checkbox" checked={config.productsSection.show} onChange={(e) => setConfig({ ...config, productsSection: { ...config.productsSection, show: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۳. نمایشگاه سه‌بعدی کالاها</span>
              <input type="checkbox" checked={config.showcase3D.show} onChange={(e) => setConfig({ ...config, showcase3D: { ...config.showcase3D, show: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۴. آیکون شناور دستیار هوشمند</span>
              <input type="checkbox" checked={config.aiChat?.autoHideNearFooter !== false} onChange={(e) => setConfig({ ...config, aiChat: { ...config.aiChat, autoHideNearFooter: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
          </div>

          {/* ── ویرایش متن بخش هیرو ── */}
          <div className="border-t border-[var(--card-border)] pt-5 space-y-4">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">✍️ ویرایش متن بخش هیرو (صفحه اصلی):</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان اصلی هیرو:</label>
                <input
                  type="text"
                  value={config.hero.title}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })}
                  placeholder="عنوان جذاب برای صفحه اصلی..."
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">متن دکمه اصلی:</label>
                <input
                  type="text"
                  value={config.hero.buttonText}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, buttonText: e.target.value } })}
                  placeholder="مشاهده کاتالوگ..."
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">زیرعنوان هیرو (توضیح کوتاه):</label>
              <textarea
                rows={2}
                value={config.hero.subtitle}
                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                placeholder="توضیح کوتاهی درباره محصولات و خدمات..."
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs leading-relaxed outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">لینک دکمه هیرو:</label>
                <input
                  type="text"
                  dir="ltr"
                  value={config.hero.buttonLink}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, buttonLink: e.target.value } })}
                  placeholder="/products"
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── ویرایش عنوان بخش محصولات ── */}
          <div className="border-t border-[var(--card-border)] pt-5 space-y-3">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">📦 ویرایش عنوان بخش محصولات:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان بخش:</label>
                <input
                  type="text"
                  value={config.productsSection.title}
                  onChange={(e) => setConfig({ ...config, productsSection: { ...config.productsSection, title: e.target.value } })}
                  placeholder="محصولات منتخب..."
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">زیرعنوان:</label>
                <input
                  type="text"
                  value={config.productsSection.subtitle}
                  onChange={(e) => setConfig({ ...config, productsSection: { ...config.productsSection, subtitle: e.target.value } })}
                  placeholder="ارسال سریع..."
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* تب ۳: فوتر کامل — متن، لینک‌های دسترسی سریع و خدمات مشتریان */}
      {activeTab === "footer" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">

          {/* عنوان برند و توضیح */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[var(--card-border)] pb-5">
            <div className="space-y-2">
              <h3 className="font-black text-sm text-[var(--accent-blue)]">🏷️ نام برند در فوتر:</h3>
              <input
                type="text"
                value={config.footer.brandTitle}
                onChange={(e) => setConfig({ ...config, footer: { ...config.footer, brandTitle: e.target.value } })}
                placeholder="آکسون کور | Axon Core"
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-sm text-[var(--accent-blue)]">📝 معرفی‌نامه کوتاه فوتر:</h3>
              <textarea
                rows={3}
                value={config.footer.description}
                onChange={(e) => setConfig({ ...config, footer: { ...config.footer, description: e.target.value } })}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed outline-none"
              />
            </div>
          </div>

          {/* ── مدیریت لینک‌های دسترسی سریع ── */}
          <div className="space-y-3 border-b border-[var(--card-border)] pb-5">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">⚡ لینک‌های دسترسی سریع (ستون ۲ فوتر):</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {(config.footer.quickLinks?.links || []).map((lnk: any) => (
                <div key={lnk.id} className="flex items-center gap-2 p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  {editingQuickId === lnk.id ? (
                    <>
                      <input value={editQuickTitle} onChange={(e) => setEditQuickTitle(e.target.value)} className="flex-1 p-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--accent-blue)] text-xs font-bold" />
                      <input value={editQuickUrl} onChange={(e) => setEditQuickUrl(e.target.value)} dir="ltr" className="w-28 p-1.5 rounded-lg bg-[var(--modal-bg)] border text-xs font-mono" />
                      <button type="button" onClick={() => {
                        const updated = (config.footer.quickLinks?.links || []).map((l: any) => l.id === lnk.id ? { ...l, title: editQuickTitle, url: editQuickUrl } : l);
                        setConfig({ ...config, footer: { ...config.footer, quickLinks: { ...config.footer.quickLinks, links: updated } } });
                        setEditingQuickId(null);
                      }} className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">✓</button>
                      <button type="button" onClick={() => setEditingQuickId(null)} className="px-2 py-1 rounded-lg bg-slate-600 text-white text-[10px]">✕</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-bold truncate">{lnk.title}</span>
                      <span className="text-slate-400 font-mono text-[10px] w-20 truncate" dir="ltr">{lnk.url}</span>
                      <button type="button" onClick={() => { setEditingQuickId(lnk.id); setEditQuickTitle(lnk.title); setEditQuickUrl(lnk.url); }} className="px-2 py-1 rounded-lg bg-[var(--modal-bg)] border text-[10px] font-bold hover:border-[var(--accent-blue)]">✏️</button>
                      <button type="button" onClick={() => {
                        const updated = (config.footer.quickLinks?.links || []).filter((l: any) => l.id !== lnk.id);
                        setConfig({ ...config, footer: { ...config.footer, quickLinks: { ...config.footer.quickLinks, links: updated } } });
                      }} className="text-rose-500 font-bold px-1.5 text-xs">✕</button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input value={newQuickTitle} onChange={(e) => setNewQuickTitle(e.target.value)} placeholder="عنوان لینک جدید..." className="flex-1 p-2 rounded-xl bg-[var(--input-bg)] border text-xs font-bold outline-none" />
              <input value={newQuickUrl}   onChange={(e) => setNewQuickUrl(e.target.value)}   placeholder="/products" dir="ltr" className="w-28 p-2 rounded-xl bg-[var(--input-bg)] border text-xs font-mono outline-none" />
              <button type="button" onClick={() => {
                if (!newQuickTitle.trim() || !newQuickUrl.trim()) return;
                const newLink = { id: `q_${Date.now()}`, title: newQuickTitle.trim(), url: newQuickUrl.trim() };
                const updated = [...(config.footer.quickLinks?.links || []), newLink];
                setConfig({ ...config, footer: { ...config.footer, quickLinks: { ...config.footer.quickLinks, links: updated } } });
                setNewQuickTitle(""); setNewQuickUrl("");
              }} className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs cursor-pointer">+ افزودن</button>
            </div>
          </div>

          {/* ── مدیریت لینک‌های خدمات مشتریان ── */}
          <div className="space-y-3 border-b border-[var(--card-border)] pb-5">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">🛎️ لینک‌های خدمات مشتریان (ستون ۳ فوتر):</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {(config.footer.customerServices?.links || []).map((lnk: any) => (
                <div key={lnk.id} className="flex items-center gap-2 p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  {editingServiceId === lnk.id ? (
                    <>
                      <input value={editServiceTitle} onChange={(e) => setEditServiceTitle(e.target.value)} className="flex-1 p-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--accent-blue)] text-xs font-bold" />
                      <input value={editServiceUrl}   onChange={(e) => setEditServiceUrl(e.target.value)}   dir="ltr" className="w-28 p-1.5 rounded-lg bg-[var(--modal-bg)] border text-xs font-mono" />
                      <button type="button" onClick={() => {
                        const updated = (config.footer.customerServices?.links || []).map((l: any) => l.id === lnk.id ? { ...l, title: editServiceTitle, url: editServiceUrl } : l);
                        setConfig({ ...config, footer: { ...config.footer, customerServices: { ...config.footer.customerServices, links: updated } } });
                        setEditingServiceId(null);
                      }} className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">✓</button>
                      <button type="button" onClick={() => setEditingServiceId(null)} className="px-2 py-1 rounded-lg bg-slate-600 text-white text-[10px]">✕</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-bold truncate">{lnk.title}</span>
                      <span className="text-slate-400 font-mono text-[10px] w-20 truncate" dir="ltr">{lnk.url}</span>
                      <button type="button" onClick={() => { setEditingServiceId(lnk.id); setEditServiceTitle(lnk.title); setEditServiceUrl(lnk.url); }} className="px-2 py-1 rounded-lg bg-[var(--modal-bg)] border text-[10px] font-bold hover:border-[var(--accent-blue)]">✏️</button>
                      <button type="button" onClick={() => {
                        const updated = (config.footer.customerServices?.links || []).filter((l: any) => l.id !== lnk.id);
                        setConfig({ ...config, footer: { ...config.footer, customerServices: { ...config.footer.customerServices, links: updated } } });
                      }} className="text-rose-500 font-bold px-1.5 text-xs">✕</button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input value={newServiceTitle} onChange={(e) => setNewServiceTitle(e.target.value)} placeholder="عنوان خدمت جدید..." className="flex-1 p-2 rounded-xl bg-[var(--input-bg)] border text-xs font-bold outline-none" />
              <input value={newServiceUrl}   onChange={(e) => setNewServiceUrl(e.target.value)}   placeholder="/contact"  dir="ltr" className="w-28 p-2 rounded-xl bg-[var(--input-bg)] border text-xs font-mono outline-none" />
              <button type="button" onClick={() => {
                if (!newServiceTitle.trim() || !newServiceUrl.trim()) return;
                const newLink = { id: `s_${Date.now()}`, title: newServiceTitle.trim(), url: newServiceUrl.trim() };
                const updated = [...(config.footer.customerServices?.links || []), newLink];
                setConfig({ ...config, footer: { ...config.footer, customerServices: { ...config.footer.customerServices, links: updated } } });
                setNewServiceTitle(""); setNewServiceUrl("");
              }} className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs cursor-pointer">+ افزودن</button>
            </div>
          </div>

          {/* اینماد */}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
            <span className="font-black text-[var(--text-primary)] block">📜 نماد اعتماد الکترونیکی (اینماد) و درگاه پرداخت:</span>
            <p className="text-[11px] text-slate-400">کد رسمی اینماد و نشان زرین‌پال در فوتر سایت فعال هستند و از ادمین مدیریت می‌شوند.</p>
          </div>
        </div>
      )}

      {/* تب ۴: مدیا و لوگوها */}
      {activeTab === "media" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold">لوگوی هدر:</span>
                <button type="button" onClick={() => setMediaModal({ open: true, target: "headerLogo" })} className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px]">آپلود</button>
              </div>
              <div className="h-24 rounded-xl bg-[var(--modal-bg)] border flex items-center justify-center p-2">
                {config.header.brand.logoUrl ? <img src={config.header.brand.logoUrl} alt="Header Logo" className="max-h-full object-contain" /> : <span className="text-slate-400 font-bold">بدون لوگو</span>}
              </div>
              <input type="text" value={config.header.brand.logoUrl} onChange={(e) => setConfig({ ...config, header: { ...config.header, brand: { ...config.header.brand, logoUrl: e.target.value } } })} placeholder="آدرس تصویر..." className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border font-mono text-[11px]" />
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold">لوگوی فوتر:</span>
                <button type="button" onClick={() => setMediaModal({ open: true, target: "footerLogo" })} className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px]">آپلود</button>
              </div>
              <div className="h-24 rounded-xl bg-[var(--modal-bg)] border flex items-center justify-center p-2">
                {config.footer.logoUrl ? <img src={config.footer.logoUrl} alt="Footer Logo" className="max-h-full object-contain" /> : <span className="text-slate-400 font-bold">بدون لوگو</span>}
              </div>
              <input type="text" value={config.footer.logoUrl} onChange={(e) => setConfig({ ...config, footer: { ...config.footer, logoUrl: e.target.value } })} placeholder="آدرس تصویر..." className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border font-mono text-[11px]" />
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold">فاوآیکون (Favicon):</span>
                <button type="button" onClick={() => setMediaModal({ open: true, target: "favicon" })} className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px]">آپلود</button>
              </div>
              <div className="h-24 rounded-xl bg-[var(--modal-bg)] border flex items-center justify-center p-2">
                {siteInfo?.favicon_url ? <img src={siteInfo.favicon_url} alt="Favicon" className="w-10 h-10 object-contain" /> : <span className="text-2xl">🌟</span>}
              </div>
              <input type="text" value={siteInfo?.favicon_url || ""} onChange={(e) => setSiteInfo((prev) => (prev ? { ...prev, favicon_url: e.target.value } : null))} placeholder="آدرس آیکون..." className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border font-mono text-[11px]" />
            </div>
          </div>
        </div>
      )}

      {/* تب ۵: پیش‌نمایش ریسپانسیو ۳ حالته */}
      {activeTab === "responsive" && (
        <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
            <span className="font-bold text-[var(--text-secondary)]">پیش‌نمایش زنده در سایزهای استاندارد:</span>
            <div className="flex gap-2 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <button type="button" onClick={() => setDeviceView("desktop")} className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${deviceView === "desktop" ? "bg-[var(--accent-blue)] text-white shadow" : "text-slate-400 hover:text-white"}`}><span>💻</span><span>دسکتاپ (100%)</span></button>
              <button type="button" onClick={() => setDeviceView("tablet")} className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${deviceView === "tablet" ? "bg-[var(--accent-blue)] text-white shadow" : "text-slate-400 hover:text-white"}`}><span>📟</span><span>تبلت (768px)</span></button>
              <button type="button" onClick={() => setDeviceView("mobile")} className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${deviceView === "mobile" ? "bg-[var(--accent-blue)] text-white shadow" : "text-slate-400 hover:text-white"}`}><span>📱</span><span>موبایل (390px)</span></button>
            </div>
          </div>

          <div className="flex justify-center bg-black/40 p-4 rounded-3xl overflow-x-auto min-h-[600px]">
            <div
              style={{ width: deviceView === "mobile" ? "390px" : deviceView === "tablet" ? "768px" : "100%", transition: "width 0.3s ease" }}
              className="rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-[var(--bg-primary)]"
            >
              <iframe src="/" className="w-full h-[650px] border-0" title="Live Preview" />
            </div>
          </div>
        </div>
      )}

      {mediaModal.open && (
        <MediaUploadModal
          isOpen={mediaModal.open}
          onClose={() => setMediaModal({ open: false, target: null })}
          onUploadSuccess={(url) => {
            if (mediaModal.target === "headerLogo") {
              setConfig((prev) => ({ ...prev, header: { ...prev.header, brand: { ...prev.header.brand, logoUrl: url } } }));
            } else if (mediaModal.target === "footerLogo") {
              setConfig((prev) => ({ ...prev, footer: { ...prev.footer, logoUrl: url } }));
            } else if (mediaModal.target === "favicon") {
              setSiteInfo((prev) => (prev ? { ...prev, favicon_url: url } : null));
            }
            setMediaModal({ open: false, target: null });
          }}
        />
      )}
    </div>
  );
}
