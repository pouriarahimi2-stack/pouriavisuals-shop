"use client";

import React, { useState, useEffect } from "react";
import {
  siteInfoService,
  SiteInfo,
  HomepageLayoutConfig,
  DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
  HeaderMenuItem,
  FooterLinkItem,
  FooterCertificateItem,
} from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

export default function StorefrontLayoutStudio() {
  const [activeTab, setActiveTab] = useState<"header" | "sections" | "footer" | "responsive" | "media">("header");
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [config, setConfig] = useState<HomepageLayoutConfig>(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [mediaModal, setMediaModal] = useState<{
    open: boolean;
    target: "headerLogo" | "footerLogo" | "favicon" | null;
  }>({ open: false, target: null });

  // فیلدهای لینک جدید هدر
  const [newMenuTitle, setNewMenuTitle] = useState("");
  const [newMenuUrl, setNewMenuUrl] = useState("");
  const [newMenuBadge, setNewMenuBadge] = useState("");

  // فیلدهای لینک جدید فوتر
  const [newQuickTitle, setNewQuickTitle] = useState("");
  const [newQuickUrl, setNewQuickUrl] = useState("");

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
          text: "⚡ کلیه تغییرات با موفقیت در دیتابیس ذخیره و بلادرنگ در کل سایت و تمامی دستگاه‌ها اعمال گردید.",
        });
      }
    } catch {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی اطلاعات در دیتابیس." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
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

  const addQuickLink = () => {
    if (!newQuickTitle.trim() || !newQuickUrl.trim()) return;
    soundEngine.playClick();
    const newItem: FooterLinkItem = { id: `ql_${Date.now()}`, title: newQuickTitle.trim(), url: newQuickUrl.trim() };
    const updated = [...config.footer.quickLinks.links, newItem];
    setConfig({ ...config, footer: { ...config.footer, quickLinks: { ...config.footer.quickLinks, links: updated } } });
    setNewQuickTitle("");
    setNewQuickUrl("");
  };

  const removeQuickLink = (id: string) => {
    soundEngine.playClick();
    const updated = config.footer.quickLinks.links.filter((l) => l.id !== id);
    setConfig({ ...config, footer: { ...config.footer, quickLinks: { ...config.footer.quickLinks, links: updated } } });
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ استودیو */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🎨</span> استودیوی مدیریت کامل ویترین و کنترل بصری سایت (Storefront Master Studio)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            شخصی‌سازی هدر، اسکرول، فوتر، لوگوها، سکشن‌ها، اینماد و پیش‌نمایش بلادرنگ ریسپانسیو (موبایل، تبلت و دسکتاپ)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار بلادرنگ"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${
          statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-rose-500/15 text-rose-600 border border-rose-500/30"
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* تب‌های تنظیمات */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold overflow-x-auto scrollbar-none">
        {[
          { id: "header", label: "۱. هدر و منوها", icon: "🧭" },
          { id: "sections", label: "۲. سکشن‌های ویترین", icon: "📐" },
          { id: "footer", label: "۳. فوتر و اینماد", icon: "⚓" },
          { id: "media", label: "۴. لوگوها و فاوآیکون", icon: "🖼️" },
          { id: "responsive", label: "۵. پیش‌نمایش ریسپانسیو زنده", icon: "📱" },
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

      {/* تب ۱: هدر */}
      {activeTab === "header" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          <div className="border-b border-[var(--card-border)] pb-4 space-y-4">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">⚙️ حالت و رفتار هدر با اسکرول:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">استایل ظاهری هدر:</label>
                <select
                  value={config.header.variant}
                  onChange={(e: any) => setConfig({ ...config, header: { ...config.header, variant: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none"
                >
                  <option value="capsule">کپسولی شناور (اپلی مدرن)</option>
                  <option value="full-width">تمام‌عرض چسبیده</option>
                  <option value="bordered">نوار با خط حاشیه</option>
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
                <label className="block font-bold text-[var(--text-secondary)] mb-1">حداکثر عرض هدر (px):</label>
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
                کوچک‌شدن نرم هدر هنگام اسکرول صفحه به پایین (Shrink on Scroll)
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.header.actions.themeToggle.show}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, actions: { ...config.header.actions, themeToggle: { ...config.header.actions.themeToggle, show: e.target.checked } } } })}
                  className="w-4 h-4 rounded text-[var(--accent-blue)]"
                />
                نمایش دکمه تم تاریک/روشن
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.header.actions.cart.show}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, actions: { ...config.header.actions, cart: { ...config.header.actions.cart, show: e.target.checked } } } })}
                  className="w-4 h-4 rounded text-[var(--accent-blue)]"
                />
                نمایش دکمه سبد خرید
              </label>
            </div>
          </div>

          {/* منوهای هدر */}
          <div className="space-y-4">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">📋 آیتم‌های ناوبری هدر:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {config.header.menu.items.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[var(--modal-bg)] border text-[10px] font-mono flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-bold">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({item.url})</span>
                    {item.badge && <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white text-[9px]">{item.badge}</span>}
                  </div>
                  <button type="button" onClick={() => removeMenuItem(item.id)} className="text-rose-500 font-bold px-2">✕</button>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row gap-2">
              <input type="text" placeholder="عنوان منو" value={newMenuTitle} onChange={(e) => setNewMenuTitle(e.target.value)} className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold" />
              <input type="text" placeholder="لینک (/products)" value={newMenuUrl} onChange={(e) => setNewMenuUrl(e.target.value)} className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-mono" />
              <input type="text" placeholder="برچسب اختیاری" value={newMenuBadge} onChange={(e) => setNewMenuBadge(e.target.value)} className="w-28 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs" />
              <button type="button" onClick={addMenuItem} className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer">+ افزودن</button>
            </div>
          </div>
        </div>
      )}

      {/* تب ۲: سکشن‌ها */}
      {activeTab === "sections" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
          <h3 className="font-black text-sm text-[var(--accent-blue)]">مدیریت و چینش سکشن‌های صفحه اصلی:</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۱. بخش هیرو اصلی و معرفی برند</span>
              <input type="checkbox" checked={config.hero.show} onChange={(e) => setConfig({ ...config, hero: { ...config.hero, show: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۲. کاتالوگ محصولات با فیلتر دسته‌بندی</span>
              <input type="checkbox" checked={config.productsSection.show} onChange={(e) => setConfig({ ...config, productsSection: { ...config.productsSection, show: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۳. نمایشگاه سه‌بعدی تعاملی کالاها (Perspective 3D)</span>
              <input type="checkbox" checked={config.showcase3D.show} onChange={(e) => setConfig({ ...config, showcase3D: { ...config.showcase3D, show: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۴. نوار رادار اخبار فناوری و گجت‌ها</span>
              <input type="checkbox" checked={config.newsTicker.show} onChange={(e) => setConfig({ ...config, newsTicker: { ...config.newsTicker, show: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۵. بخش مقالات و وبلاگ تخصصی سئو</span>
              <input type="checkbox" checked={config.blogSection.show} onChange={(e) => setConfig({ ...config, blogSection: { ...config.blogSection, show: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
          </div>
        </div>
      )}

      {/* تب ۳: فوتر و اینماد */}
      {activeTab === "footer" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          <div className="border-b border-[var(--card-border)] pb-4 space-y-3">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">متون و تعهدات برند در فوتر:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان برند در فوتر:</label>
                <input
                  type="text"
                  value={config.footer.brandTitle}
                  onChange={(e) => setConfig({ ...config, footer: { ...config.footer, brandTitle: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">زیرعنوان برند:</label>
                <input
                  type="text"
                  value={config.footer.brandSubtitle}
                  onChange={(e) => setConfig({ ...config, footer: { ...config.footer, brandSubtitle: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">متن توضیحات فوتر:</label>
                <textarea
                  rows={3}
                  value={config.footer.description}
                  onChange={(e) => setConfig({ ...config, footer: { ...config.footer, description: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed text-xs"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
            <span className="font-black text-[var(--text-primary)] block">📜 نماد اعتماد الکترونیکی (اینماد) و درگاه‌ها:</span>
            <p className="text-[11px] text-slate-400">کد رسمی اینماد ۷۴۳۴۴۰۴ و نشان امنیتی شاپرک در فوتر سایت فعال و لینک‌شده هستند.</p>
          </div>
        </div>
      )}

      {/* تب ۴: رسانه و لوگوها */}
      {activeTab === "media" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold">لوگوی هدر:</span>
                <button
                  type="button"
                  onClick={() => setMediaModal({ open: true, target: "headerLogo" })}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px]"
                >
                  آپلود
                </button>
              </div>
              <div className="h-24 rounded-xl bg-[var(--modal-bg)] border flex items-center justify-center p-2">
                {config.header.brand.logoUrl ? (
                  <img src={config.header.brand.logoUrl} alt="Header Logo" className="max-h-full object-contain" />
                ) : (
                  <span className="text-slate-400 font-bold">بدون لوگو</span>
                )}
              </div>
              <input
                type="text"
                value={config.header.brand.logoUrl}
                onChange={(e) => setConfig({ ...config, header: { ...config.header, brand: { ...config.header.brand, logoUrl: e.target.value } } })}
                placeholder="آدرس اینترنتی یا آپلود..."
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border font-mono text-[11px] outline-none"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold">لوگوی فوتر:</span>
                <button
                  type="button"
                  onClick={() => setMediaModal({ open: true, target: "footerLogo" })}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px]"
                >
                  آپلود
                </button>
              </div>
              <div className="h-24 rounded-xl bg-[var(--modal-bg)] border flex items-center justify-center p-2">
                {config.footer.logoUrl ? (
                  <img src={config.footer.logoUrl} alt="Footer Logo" className="max-h-full object-contain" />
                ) : (
                  <span className="text-slate-400 font-bold">بدون لوگو</span>
                )}
              </div>
              <input
                type="text"
                value={config.footer.logoUrl}
                onChange={(e) => setConfig({ ...config, footer: { ...config.footer, logoUrl: e.target.value } })}
                placeholder="آدرس اینترنتی یا آپلود..."
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border font-mono text-[11px] outline-none"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold">فاوآیکون تب مرورگر:</span>
                <button
                  type="button"
                  onClick={() => setMediaModal({ open: true, target: "favicon" })}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px]"
                >
                  آپلود
                </button>
              </div>
              <div className="h-24 rounded-xl bg-[var(--modal-bg)] border flex items-center justify-center p-2">
                {siteInfo?.favicon_url ? (
                  <img src={siteInfo.favicon_url} alt="Favicon" className="w-10 h-10 object-contain" />
                ) : (
                  <span className="text-2xl">🌟</span>
                )}
              </div>
              <input
                type="text"
                value={siteInfo?.favicon_url || ""}
                onChange={(e) => setSiteInfo((prev) => (prev ? { ...prev, favicon_url: e.target.value } : null))}
                placeholder="آدرس آیکون..."
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border font-mono text-[11px] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* تب ۵: پیش‌نمایش ریسپانسیو با سوئیچر دیوایس (Desktop, Tablet, Mobile) */}
      {activeTab === "responsive" && (
        <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
            <span className="font-bold text-[var(--text-secondary)]">پیش‌نمایش زنده در سایزهای استاندارد مخاطبان:</span>
            <div className="flex gap-2 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setDeviceView("desktop")}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  deviceView === "desktop" ? "bg-[var(--accent-blue)] text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>💻</span>
                <span>دسکتاپ (100%)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceView("tablet")}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  deviceView === "tablet" ? "bg-[var(--accent-blue)] text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>📟</span>
                <span>تبلت (768px)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceView("mobile")}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  deviceView === "mobile" ? "bg-[var(--accent-blue)] text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>📱</span>
                <span>موبایل (390px)</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center bg-black/40 p-4 rounded-3xl overflow-x-auto min-h-[600px]">
            <div
              style={{
                width: deviceView === "mobile" ? "390px" : deviceView === "tablet" ? "768px" : "100%",
                transition: "width 0.3s ease",
              }}
              className="rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-[var(--bg-primary)]"
            >
              <iframe src="/" className="w-full h-[650px] border-0" title="Live Preview" />
            </div>
          </div>
        </div>
      )}

      {/* مدال انتخاب مدیا */}
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
