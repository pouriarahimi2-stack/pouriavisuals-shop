"use client";

import React, { useState, useEffect } from "react";
import {
  siteInfoService,
  SiteInfo,
  HomepageLayoutConfig,
  DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
  HeaderMenuItem,
  FooterLinkItem,
  FooterContactItem,
  FooterCertificateItem,
} from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

export default function StorefrontLayoutStudio() {
  const [activeTab, setActiveTab] = useState<"header" | "footer" | "sections" | "media" | "preview">("header");
  const [config, setConfig] = useState<HomepageLayoutConfig>(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveCounter, setSaveCounter] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // مدال انتخاب رسانه
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
  const [newServiceTitle, setNewServiceTitle] = useState("");
  const [newServiceUrl, setNewServiceUrl] = useState("");

  // فیلدهای نماد جدید
  const [newCertTitle, setNewCertTitle] = useState("");
  const [newCertLink, setNewCertLink] = useState("");
  const [newCertImage, setNewCertImage] = useState("");

  const loadData = async () => {
    const info = await siteInfoService.getSiteInfo();
    if (info) {
      setSiteInfo(info);
      if (info.homepage_layout_config) {
        const loadedCfg = {
          ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
          ...info.homepage_layout_config,
          header: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.header, ...(info.homepage_layout_config.header || {}) },
          footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...(info.homepage_layout_config.footer || {}) },
          aiChat: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.aiChat, ...(info.homepage_layout_config.aiChat || {}) },
        };

        // تضمین نمایش لوگوها از ستون‌های اصلی در صورت خالی بودن کانفیگ
        if (!loadedCfg.header.brand.logoUrl && info.logo_url) {
          loadedCfg.header.brand.logoUrl = info.logo_url;
        }
        if (!loadedCfg.footer.logoUrl && info.footer_logo_url) {
          loadedCfg.footer.logoUrl = info.footer_logo_url;
        }

        setConfig(loadedCfg);
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
        setSaveCounter((prev) => prev + 1);
        setStatusMessage({
          type: "success",
          text: "⚡ تمامی تنظیمات هدر، فوتر، منوها، سکشن‌ها و لوگوها با موفقیت در دیتابیس ثبت و به صورت دائمی ذخیره شدند.",
        });
      }
    } catch {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی اطلاعات." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleResetDefaults = () => {
    if (!confirm("آیا مایلید تمامی تنظیمات ویترین را به مقادیر پیش‌فرض بازگردانید؟")) return;
    soundEngine.playSuccess();
    setConfig(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
    handleSave(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  };

  // عملیات منوهای هدر
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

  const moveMenuItem = (index: number, direction: "up" | "down") => {
    soundEngine.playClick();
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= config.header.menu.items.length) return;
    const list = [...config.header.menu.items];
    const [temp] = list.splice(index, 1);
    list.splice(target, 0, temp);
    setConfig({
      ...config,
      header: {
        ...config.header,
        menu: { ...config.header.menu, items: list.map((item, idx) => ({ ...item, order: idx + 1 })) },
      },
    });
  };

  // عملیات لینک‌های فوتر
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

  const addServiceLink = () => {
    if (!newServiceTitle.trim() || !newServiceUrl.trim()) return;
    soundEngine.playClick();
    const newItem: FooterLinkItem = { id: `sl_${Date.now()}`, title: newServiceTitle.trim(), url: newServiceUrl.trim() };
    const updated = [...config.footer.customerServices.links, newItem];
    setConfig({ ...config, footer: { ...config.footer, customerServices: { ...config.footer.customerServices, links: updated } } });
    setNewServiceTitle("");
    setNewServiceUrl("");
  };

  const removeServiceLink = (id: string) => {
    soundEngine.playClick();
    const updated = config.footer.customerServices.links.filter((l) => l.id !== id);
    setConfig({ ...config, footer: { ...config.footer, customerServices: { ...config.footer.customerServices, links: updated } } });
  };

  // عملیات نمادها و اینماد
  const addCert = () => {
    if (!newCertTitle.trim()) return;
    soundEngine.playClick();
    const newCert: FooterCertificateItem = {
      id: `cert_${Date.now()}`,
      title: newCertTitle.trim(),
      link: newCertLink.trim() || undefined,
      imageUrl: newCertImage.trim() || undefined,
      show: true,
    };
    const updated = [...config.footer.certificates.items, newCert];
    setConfig({ ...config, footer: { ...config.footer, certificates: { ...config.footer.certificates, items: updated } } });
    setNewCertTitle("");
    setNewCertLink("");
    setNewCertImage("");
  };

  const removeCert = (id: string) => {
    soundEngine.playClick();
    const updated = config.footer.certificates.items.filter((c) => c.id !== id);
    setConfig({ ...config, footer: { ...config.footer, certificates: { ...config.footer.certificates, items: updated } } });
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* هدر استودیو ظاهر */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🎨</span> استودیوی چیدمان و کنترل بصری کامل ویترین (Storefront Studio)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            مدیریت بلادرنگ هدر، فوتر ۱۲ ستونه، متون برند، کاتالوگ محصولات، نشان‌های اعتماد و نماد اینماد
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-amber-500 text-xs font-bold transition cursor-pointer"
          >
            🔄 بازگردانی به پیش‌فرض
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار سراسری"}
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

      {/* تب‌های پنج‌گانه استودیو */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold overflow-x-auto scrollbar-none">
        {[
          { id: "header", label: "۱. هدر و منوها", icon: "🧭" },
          { id: "footer", label: "۲. فوتر، ستون‌ها و اینماد", icon: "⚓" },
          { id: "sections", label: "۳. سکشن‌های صفحه اصلی", icon: "📐" },
          { id: "media", label: "۴. لوگوها و فاوآیکون", icon: "🖼️" },
          { id: "preview", label: "۵. پیش‌نمایش زنده", icon: "👁️" },
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
            <h3 className="font-black text-sm text-[var(--accent-blue)]">⚙️ ابعاد، استایل و رفتار هدر:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">نام برند در هدر:</label>
                <input
                  type="text"
                  value={config.header.brand.name}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, brand: { ...config.header.brand, name: e.target.value } } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">شعار برند (Tagline):</label>
                <input
                  type="text"
                  value={config.header.brand.tagline}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, brand: { ...config.header.brand, tagline: e.target.value } } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
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
                  checked={config.header.actions.themeToggle.show}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, actions: { ...config.header.actions, themeToggle: { ...config.header.actions.themeToggle, show: e.target.checked } } } })}
                  className="w-4 h-4 rounded text-[var(--accent-blue)]"
                />
                نمایش دکمه تغییر تم تاریک/روشن در هدر
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.header.actions.search.show}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, actions: { ...config.header.actions, search: { ...config.header.actions.search, show: e.target.checked } } } })}
                  className="w-4 h-4 rounded text-[var(--accent-blue)]"
                />
                نمایش دکمه جستجو (⌘K)
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
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.header.brand.showTagline}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, brand: { ...config.header.brand, showTagline: e.target.checked } } })}
                  className="w-4 h-4 rounded text-[var(--accent-blue)]"
                />
                نمایش زیرعنوان در کنار لوگو
              </label>
            </div>
          </div>

          {/* مدیریت منوها */}
          <div className="space-y-4">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">📋 آیتم‌های منوی بالای سایت (Header Navigation):</h3>
            
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {config.header.menu.items.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center font-mono font-bold text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold block text-[var(--text-primary)]">{item.title}</span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">{item.url}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => moveMenuItem(idx, "up")} disabled={idx === 0} className="p-1 px-2.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer">▲</button>
                    <button type="button" onClick={() => moveMenuItem(idx, "down")} disabled={idx === config.header.menu.items.length - 1} className="p-1 px-2.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer">▼</button>
                    <button type="button" onClick={() => removeMenuItem(item.id)} className="p-1 px-2.5 rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition font-bold cursor-pointer">✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row gap-2">
              <input type="text" placeholder="عنوان منو" value={newMenuTitle} onChange={(e) => setNewMenuTitle(e.target.value)} className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold" />
              <input type="text" placeholder="آدرس لینک (/about)" value={newMenuUrl} onChange={(e) => setNewMenuUrl(e.target.value)} className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-mono" />
              <input type="text" placeholder="برچسب اختیاری" value={newMenuBadge} onChange={(e) => setNewMenuBadge(e.target.value)} className="w-28 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs" />
              <button type="button" onClick={addMenuItem} className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow">+ افزودن منو</button>
            </div>
          </div>
        </div>
      )}

      {/* تب ۲: فوتر */}
      {activeTab === "footer" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          <div className="border-b border-[var(--card-border)] pb-4 space-y-3">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">⚓ متون ستون اصلی فوتر:</h3>
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
                <label className="block font-bold text-[var(--text-secondary)] mb-1">زیرعنوان برند فوتر:</label>
                <input
                  type="text"
                  value={config.footer.brandSubtitle}
                  onChange={(e) => setConfig({ ...config, footer: { ...config.footer, brandSubtitle: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-[var(--text-secondary)] mb-1">متن معرفی و تعهدات استودیو:</label>
                <textarea
                  rows={2}
                  value={config.footer.description}
                  onChange={(e) => setConfig({ ...config, footer: { ...config.footer, description: e.target.value } })}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* دسترسی سریع */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <span className="font-black text-[var(--text-primary)] block">🔗 لینک‌های دسترسی سریع:</span>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {config.footer.quickLinks.links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                    <span className="font-bold">{link.title} ({link.url})</span>
                    <button type="button" onClick={() => removeQuickLink(link.id)} className="text-rose-500 font-bold px-2">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-[var(--card-border)]">
                <input type="text" placeholder="عنوان" value={newQuickTitle} onChange={(e) => setNewQuickTitle(e.target.value)} className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold" />
                <input type="text" placeholder="/url" value={newQuickUrl} onChange={(e) => setNewQuickUrl(e.target.value)} className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-mono" />
                <button type="button" onClick={addQuickLink} className="px-3 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black">+</button>
              </div>
            </div>

            {/* خدمات مشتریان */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <span className="font-black text-[var(--text-primary)] block">🛡️ لینک‌های خدمات مشتریان:</span>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {config.footer.customerServices.links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                    <span className="font-bold">{link.title} ({link.url})</span>
                    <button type="button" onClick={() => removeServiceLink(link.id)} className="text-rose-500 font-bold px-2">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-[var(--card-border)]">
                <input type="text" placeholder="عنوان" value={newServiceTitle} onChange={(e) => setNewServiceTitle(e.target.value)} className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold" />
                <input type="text" placeholder="/url" value={newServiceUrl} onChange={(e) => setNewServiceUrl(e.target.value)} className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-mono" />
                <button type="button" onClick={addServiceLink} className="px-3 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black">+</button>
              </div>
            </div>
          </div>

          {/* مدیریت نماد اعتماد */}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
            <span className="font-black text-[var(--text-primary)] block">📜 نماد اعتماد الکترونیکی (اینماد) و مجوزها:</span>
            <div className="space-y-2">
              {config.footer.certificates.items.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                  <div>
                    <span className="font-bold block">{cert.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{cert.link || "بدون لینک"}</span>
                  </div>
                  <button type="button" onClick={() => removeCert(cert.id)} className="px-3 py-1 bg-rose-500/15 text-rose-500 rounded-xl font-bold">حذف ✕</button>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[var(--card-border)]">
              <input type="text" placeholder="عنوان نماد" value={newCertTitle} onChange={(e) => setNewCertTitle(e.target.value)} className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold" />
              <input type="text" placeholder="لینک تاییدیه" value={newCertLink} onChange={(e) => setNewCertLink(e.target.value)} className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-mono" />
              <input type="text" placeholder="آدرس لوگو" value={newCertImage} onChange={(e) => setNewCertImage(e.target.value)} className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-mono" />
              <button type="button" onClick={addCert} className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black">+ ثبت نماد</button>
            </div>
          </div>
        </div>
      )}

      {/* تب ۳: کنترل سکشن‌های صفحه اصلی */}
      {activeTab === "sections" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
          <h3 className="font-black text-sm text-[var(--accent-blue)]">کنترل نمایش بخش‌های صفحه اصلی:</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۱. بخش هیرو و بنر اصلی (Hero Banner)</span>
              <input type="checkbox" checked={config.hero.show} onChange={(e) => setConfig({ ...config, hero: { ...config.hero, show: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۲. نوار فیلتر دسته‌بندی بالای کاتالوگ محصولات</span>
              <input type="checkbox" checked={config.productsSection.showCategoryFilter} onChange={(e) => setConfig({ ...config, productsSection: { ...config.productsSection, showCategoryFilter: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۳. سه کارت اعتماد (گارانتی / کالیبراسیون / ارسال)</span>
              <input type="checkbox" checked={config.trustBadges.show} onChange={(e) => setConfig({ ...config, trustBadges: { ...config.trustBadges, show: e.target.checked } })} className="w-4 h-4 rounded" />
            </label>
          </div>
        </div>
      )}

      {/* تب ۴: رسانه و لوگوها (با پیش‌نمایش شفاف و ورودی متن زنده) */}
      {activeTab === "media" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* ۱. لوگوی هدر */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[var(--text-primary)]">لوگوی هدر (Header):</span>
                <button
                  type="button"
                  onClick={() => setMediaModal({ open: true, target: "headerLogo" })}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px] cursor-pointer shadow"
                >
                  انتخاب / آپلود
                </button>
              </div>

              <div className="h-28 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center p-2 relative overflow-hidden">
                {config.header.brand.logoUrl ? (
                  <img src={config.header.brand.logoUrl} alt="Header Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-slate-400 font-bold">لوگو انتخاب نشده است</span>
                )}
              </div>

              <input
                type="text"
                dir="ltr"
                placeholder="https://... یا تصویر آپلود شده"
                value={config.header.brand.logoUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = { ...config, header: { ...config.header, brand: { ...config.header.brand, logoUrl: val } } };
                  setConfig(updated);
                  siteInfoService.updateSiteInfo({ logo_url: val, homepage_layout_config: updated });
                }}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[11px] outline-none"
              />
            </div>

            {/* ۲. لوگوی فوتر */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[var(--text-primary)]">لوگوی فوتر (Footer):</span>
                <button
                  type="button"
                  onClick={() => setMediaModal({ open: true, target: "footerLogo" })}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px] cursor-pointer shadow"
                >
                  انتخاب / آپلود
                </button>
              </div>

              <div className="h-28 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center p-2 relative overflow-hidden">
                {config.footer.logoUrl ? (
                  <img src={config.footer.logoUrl} alt="Footer Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-slate-400 font-bold">لوگو انتخاب نشده است</span>
                )}
              </div>

              <input
                type="text"
                dir="ltr"
                placeholder="https://... یا تصویر آپلود شده"
                value={config.footer.logoUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = { ...config, footer: { ...config.footer, logoUrl: val } };
                  setConfig(updated);
                  siteInfoService.updateSiteInfo({ footer_logo_url: val, homepage_layout_config: updated });
                }}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[11px] outline-none"
              />
            </div>

            {/* ۳. فاوآیکون */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[var(--text-primary)]">فاوآیکون (Favicon):</span>
                <button
                  type="button"
                  onClick={() => setMediaModal({ open: true, target: "favicon" })}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px] cursor-pointer shadow"
                >
                  انتخاب / آپلود
                </button>
              </div>

              <div className="h-28 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center p-2 relative overflow-hidden">
                {siteInfo?.favicon_url ? (
                  <img src={siteInfo.favicon_url} alt="Favicon" className="w-10 h-10 object-contain" />
                ) : (
                  <span className="text-2xl">🌟</span>
                )}
              </div>

              <input
                type="text"
                dir="ltr"
                placeholder="https://... یا فایل .ico / .png"
                value={siteInfo?.favicon_url || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSiteInfo((prev) => prev ? { ...prev, favicon_url: val } : null);
                  siteInfoService.updateSiteInfo({ favicon_url: val });
                }}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[11px] outline-none"
              />
            </div>

          </div>
        </div>
      )}

      {/* تب ۵: پیش‌نمایش زنده */}
      {activeTab === "preview" && (
        <div className="bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] shadow-xl overflow-hidden space-y-3">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">پیش‌نمایش بلادرنگ صفحه اصلی:</span>
            <button
              type="button"
              onClick={() => setSaveCounter((c) => c + 1)}
              className="px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold"
            >
              🔄 تازه‌سازی کادر
            </button>
          </div>
          <iframe
            key={saveCounter}
            src="/"
            className="w-full h-[650px] rounded-2xl border border-[var(--card-border)]"
            title="Live Storefront Preview"
          />
        </div>
      )}

      {/* مدال انتخاب مدیا با ذخیره آنی */}
      {mediaModal.open && (
        <MediaUploadModal
          isOpen={mediaModal.open}
          onClose={() => setMediaModal({ open: false, target: null })}
          currentValue={
            mediaModal.target === "headerLogo"
              ? config.header.brand.logoUrl
              : mediaModal.target === "footerLogo"
              ? config.footer.logoUrl
              : siteInfo?.favicon_url || ""
          }
          onUploadSuccess={(url) => {
            if (mediaModal.target === "headerLogo") {
              const updated = {
                ...config,
                header: { ...config.header, brand: { ...config.header.brand, logoUrl: url } },
              };
              setConfig(updated);
              handleSave(updated);
            } else if (mediaModal.target === "footerLogo") {
              const updated = {
                ...config,
                footer: { ...config.footer, logoUrl: url },
              };
              setConfig(updated);
              handleSave(updated);
            } else if (mediaModal.target === "favicon") {
              setSiteInfo((prev) => (prev ? { ...prev, favicon_url: url } : null));
              siteInfoService.updateSiteInfo({ favicon_url: url });
            }
            setMediaModal({ open: false, target: null });
          }}
        />
      )}

    </div>
  );
}
