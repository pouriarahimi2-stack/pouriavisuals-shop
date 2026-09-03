// File Path: components/admin/StorefrontLayoutStudio.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  siteInfoService,
  SiteInfo,
  HomepageLayoutConfig,
  DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
  FooterLinkItem,
  FooterCertificateItem,
} from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";

export default function StorefrontLayoutStudio() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [config, setConfig] = useState<HomepageLayoutConfig>(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // استیت‌های افزودن پیوند جدید به دسترسی سریع
  const [newQuickLinkTitle, setNewQuickLinkTitle] = useState("");
  const [newQuickLinkUrl, setNewQuickLinkUrl] = useState("");

  // استیت‌های افزودن پیوند جدید به خدمات مشتریان
  const [newServiceLinkTitle, setNewServiceLinkTitle] = useState("");
  const [newServiceLinkUrl, setNewServiceLinkUrl] = useState("");

  // استیت‌های افزودن گواهی/اینماد جدید
  const [newCertTitle, setNewCertTitle] = useState("");
  const [newCertLink, setNewCertLink] = useState("");
  const [newCertImageUrl, setNewCertImageUrl] = useState("");

  const loadCurrentSettings = async () => {
    try {
      const info = await siteInfoService.getSiteInfo();
      if (info) {
        setSiteInfo(info);
        if (info.homepage_layout_config) {
          setConfig({
            ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
            ...info.homepage_layout_config,
            hero: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.hero, ...(info.homepage_layout_config.hero || {}) },
            showcase3D: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.showcase3D, ...(info.homepage_layout_config.showcase3D || {}) },
            newsTicker: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.newsTicker, ...(info.homepage_layout_config.newsTicker || {}) },
            blogSection: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.blogSection, ...(info.homepage_layout_config.blogSection || {}) },
            contactDock: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.contactDock, ...(info.homepage_layout_config.contactDock || {}) },
            footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...(info.homepage_layout_config.footer || {}) },
            aiChat: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.aiChat, ...(info.homepage_layout_config.aiChat || {}) },
          });
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadCurrentSettings();
    const handleUpdate = (e: any) => {
      if (e.detail?.homepage_layout_config) {
        setConfig(e.detail.homepage_layout_config);
      }
    };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const updateSection = <K extends keyof HomepageLayoutConfig>(section: K, values: Partial<HomepageLayoutConfig[K]>) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...values,
      },
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setStatusMessage(null);

    try {
      const updated = await siteInfoService.updateSiteInfo({
        homepage_layout_config: config,
      });

      if (updated) {
        soundEngine.playSuccess();
        setStatusMessage({
          type: "success",
          text: "⚡ تمامی تنظیمات چیدمان، فوتر، مجوزها و دکمه هوش مصنوعی در دیتابیس ثبت و به صورت بلادرنگ اعمال شد.",
        });
      } else {
        throw new Error("خطا در ثبت پایگاه داده");
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "خطا در ذخیره‌سازی تنظیمات." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // عملیات روی لینک‌های فوتر
  const addQuickLink = () => {
    if (!newQuickLinkTitle.trim() || !newQuickLinkUrl.trim()) return;
    soundEngine.playClick();
    const newItem: FooterLinkItem = {
      id: `ql_${Date.now()}`,
      title: newQuickLinkTitle.trim(),
      url: newQuickLinkUrl.trim(),
    };
    const updated = [...config.footer.quickLinks.links, newItem];
    updateSection("footer", {
      quickLinks: { ...config.footer.quickLinks, links: updated },
    });
    setNewQuickLinkTitle("");
    setNewQuickLinkUrl("");
  };

  const removeQuickLink = (id: string) => {
    soundEngine.playClick();
    const updated = config.footer.quickLinks.links.filter((l) => l.id !== id);
    updateSection("footer", {
      quickLinks: { ...config.footer.quickLinks, links: updated },
    });
  };

  const addServiceLink = () => {
    if (!newServiceLinkTitle.trim() || !newServiceLinkUrl.trim()) return;
    soundEngine.playClick();
    const newItem: FooterLinkItem = {
      id: `sl_${Date.now()}`,
      title: newServiceLinkTitle.trim(),
      url: newServiceLinkUrl.trim(),
    };
    const updated = [...config.footer.customerServices.links, newItem];
    updateSection("footer", {
      customerServices: { ...config.footer.customerServices, links: updated },
    });
    setNewServiceLinkTitle("");
    setNewServiceLinkUrl("");
  };

  const removeServiceLink = (id: string) => {
    soundEngine.playClick();
    const updated = config.footer.customerServices.links.filter((l) => l.id !== id);
    updateSection("footer", {
      customerServices: { ...config.footer.customerServices, links: updated },
    });
  };

  // عملیات روی اینماد و مجوزها
  const addCertificate = () => {
    if (!newCertTitle.trim()) return;
    soundEngine.playClick();
    const newCert: FooterCertificateItem = {
      id: `cert_${Date.now()}`,
      title: newCertTitle.trim(),
      link: newCertLink.trim() || undefined,
      imageUrl: newCertImageUrl.trim() || undefined,
      show: true,
    };
    const updated = [...config.footer.certificates.items, newCert];
    updateSection("footer", {
      certificates: { ...config.footer.certificates, items: updated },
    });
    setNewCertTitle("");
    setNewCertLink("");
    setNewCertImageUrl("");
  };

  const removeCertificate = (id: string) => {
    soundEngine.playClick();
    const updated = config.footer.certificates.items.filter((c) => c.id !== id);
    updateSection("footer", {
      certificates: { ...config.footer.certificates, items: updated },
    });
  };

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* سربرگ استودیو چیدمان */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📐</span>
            <h2 className="text-lg font-black text-[var(--accent-blue)]">
              استودیوی مدیریت بصری لایه‌بندی ویترین، فوتر، اینماد و هوش مصنوعی
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            کنترل بلادرنگ تمامی ستون‌های فوتر، ویرایش و افزودن مجوزها و گواهی‌ها و رفتار هوشمند دکمه چت
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-7 py-3 bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white rounded-2xl text-xs font-black transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <span>💾</span>
          <span>{saving ? "در حال ذخیره‌سازی..." : "ذخیره و انتشار بلادرنگ"}</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-600"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* ۱. بخش جامع کنترل فوتر و ستون‌ها */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-lg font-black">
            ⚓
          </span>
          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">
              ۱. مدیریت جامع فوتر، مقیاس‌ها و محتوا (Footer Master Controller)
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">کنترل کامل متون برند، ستون‌های پیوند، کارت‌های تماس و داک کلیدها</p>
          </div>
        </div>

        {/* تنظیمات کلی فوتر */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1">مقیاس و اندازه متون فوتر:</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "compact", label: "کوچک" },
                { id: "normal", label: "استاندارد" },
                { id: "large", label: "بزرگ" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { soundEngine.playClick(); updateSection("footer", { scaleMode: m.id as any }); }}
                  className={`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                    config.footer.scaleMode === m.id
                      ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                      : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1">پدینگ و فواصل عمودی فوتر:</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "compact", label: "فشرده" },
                { id: "normal", label: "معمولی" },
                { id: "relaxed", label: "باز و جادار" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { soundEngine.playClick(); updateSection("footer", { paddingMode: m.id as any }); }}
                  className={`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                    config.footer.paddingMode === m.id
                      ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                      : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1">نمایش نشان‌های گارانتی و ارسال:</label>
            <button
              type="button"
              onClick={() => { soundEngine.playClick(); updateSection("footer", { showBadges: !config.footer.showBadges }); }}
              className={`w-full py-2.5 rounded-xl font-bold transition cursor-pointer border ${
                config.footer.showBadges
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-500"
              }`}
            >
              {config.footer.showBadges ? "نشان‌های گارانتی فعال هستند ✓" : "مخفی‌سازی نشان‌ها"}
            </button>
          </div>
        </div>

        {/* ویرایش متون برند و نشان‌های گارانتی */}
        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 text-xs">
          <span className="font-black text-[var(--accent-blue)] block">ویرایش متون ستون برند:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] mb-1">نام برند در فوتر:</label>
              <input
                type="text"
                value={config.footer.brandTitle || ""}
                onChange={(e) => updateSection("footer", { brandTitle: e.target.value })}
                placeholder="آکسون | Axon"
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] mb-1">زیرعنوان برند:</label>
              <input
                type="text"
                value={config.footer.brandSubtitle || ""}
                onChange={(e) => updateSection("footer", { brandSubtitle: e.target.value })}
                placeholder="مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو"
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] mb-1">متن نشان گارانتی ۱:</label>
              <input
                type="text"
                value={config.footer.badge1Text || ""}
                onChange={(e) => updateSection("footer", { badge1Text: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] mb-1">متن نشان ارسال ۲:</label>
              <input
                type="text"
                value={config.footer.badge2Text || ""}
                onChange={(e) => updateSection("footer", { badge2Text: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-[var(--text-secondary)] mb-1">شرح فعالیت استودیو در فوتر:</label>
              <textarea
                rows={2}
                value={config.footer.description || ""}
                onChange={(e) => updateSection("footer", { description: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-medium text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* مدیریت پیوندهای دسترسی سریع و خدمات مشتریان */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* ستون دسترسی سریع */}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2">
              <span className="font-black text-[var(--text-primary)]">🔗 پیوندهای دسترسی سریع</span>
              <input
                type="text"
                value={config.footer.quickLinks.title}
                onChange={(e) =>
                  updateSection("footer", {
                    quickLinks: { ...config.footer.quickLinks, title: e.target.value },
                  })
                }
                className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-[11px] w-32"
              />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {config.footer.quickLinks.links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                  <div className="overflow-hidden">
                    <span className="font-bold block truncate">{link.title}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate block">{link.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuickLink(link.id)}
                    className="p-1 px-2 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white transition font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--card-border)] flex gap-2">
              <input
                type="text"
                placeholder="عنوان لینک"
                value={newQuickLinkTitle}
                onChange={(e) => setNewQuickLinkTitle(e.target.value)}
                className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold"
              />
              <input
                type="text"
                placeholder="آدرس /..."
                value={newQuickLinkUrl}
                onChange={(e) => setNewQuickLinkUrl(e.target.value)}
                className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
              />
              <button
                type="button"
                onClick={addQuickLink}
                className="px-3 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs shrink-0"
              >
                +
              </button>
            </div>
          </div>

          {/* ستون خدمات مشتریان */}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2">
              <span className="font-black text-[var(--text-primary)]">🛡️ پیوندهای خدمات مشتریان</span>
              <input
                type="text"
                value={config.footer.customerServices.title}
                onChange={(e) =>
                  updateSection("footer", {
                    customerServices: { ...config.footer.customerServices, title: e.target.value },
                  })
                }
                className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-[11px] w-32"
              />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {config.footer.customerServices.links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                  <div className="overflow-hidden">
                    <span className="font-bold block truncate">{link.title}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate block">{link.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeServiceLink(link.id)}
                    className="p-1 px-2 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white transition font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--card-border)] flex gap-2">
              <input
                type="text"
                placeholder="عنوان خدمت"
                value={newServiceLinkTitle}
                onChange={(e) => setNewServiceLinkTitle(e.target.value)}
                className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold"
              />
              <input
                type="text"
                placeholder="آدرس /..."
                value={newServiceLinkUrl}
                onChange={(e) => setNewServiceLinkUrl(e.target.value)}
                className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
              />
              <button
                type="button"
                onClick={addServiceLink}
                className="px-3 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs shrink-0"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* ویرایش کارت‌های تماس دفتر */}
        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 text-xs">
          <span className="font-black text-[var(--text-primary)] block">📞 ویرایش مستقیم اطلاعات تماس و دفتر در فوتر:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {config.footer.contactInfo.items.map((it, idx) => (
              <div key={it.id} className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[11px]">{it.title}</span>
                  <input
                    type="checkbox"
                    checked={it.show !== false}
                    onChange={(e) => {
                      const arr = [...config.footer.contactInfo.items];
                      arr[idx] = { ...arr[idx], show: e.target.checked };
                      updateSection("footer", { contactInfo: { ...config.footer.contactInfo, items: arr } });
                    }}
                    className="w-3.5 h-3.5"
                  />
                </div>
                <input
                  type="text"
                  value={it.value}
                  onChange={(e) => {
                    const arr = [...config.footer.contactInfo.items];
                    arr[idx] = { ...arr[idx], value: e.target.value, link: it.type === "phone" ? `tel:${e.target.value.replace(/\s+/g, "")}` : it.type === "email" ? `mailto:${e.target.value}` : undefined };
                    updateSection("footer", { contactInfo: { ...config.footer.contactInfo, items: arr } });
                  }}
                  className="w-full p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ۲. بخش مدیریت اختصاصی اینماد و سایر مجوزها (Certificates & Trust Badges) */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-lg font-black">
              📜
            </span>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">
                ۲. مدیریت نماد اعتماد الکترونیکی (اینماد)، ساماندهی و گواهی‌های رسمی
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">افزودن، ویرایش و کنترل نمادهای اعتماد و مجوزهای رسمی با تصویر یا لینک دلخواه</p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-[var(--input-bg)] px-3.5 py-2 rounded-2xl border border-[var(--card-border)]">
            <input
              type="checkbox"
              checked={config.footer.certificates.show}
              onChange={(e) =>
                updateSection("footer", {
                  certificates: { ...config.footer.certificates, show: e.target.checked },
                })
              }
              className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
            />
            <span className="text-xs font-black">نمایش بخش مجوزها در فوتر</span>
          </label>
        </div>

        {config.footer.certificates.show && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.footer.certificates.items.map((cert) => (
                <div key={cert.id} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {cert.imageUrl ? (
                      <img src={cert.imageUrl} alt="" className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1 shrink-0" />
                    ) : (
                      <span className="w-10 h-10 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center text-lg">
                        📜
                      </span>
                    )}
                    <div className="overflow-hidden">
                      <h5 className="font-black text-xs text-[var(--text-primary)] truncate">{cert.title}</h5>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate block">{cert.link || "بدون لینک"}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCertificate(cert.id)}
                    className="p-1.5 px-2.5 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer shrink-0"
                  >
                    حذف ✕
                  </button>
                </div>
              ))}
            </div>

            {/* فرم افزودن نماد / مجوز جدید */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <span className="font-bold text-[var(--text-primary)] block">+ افزودن مجوز یا نماد جدید به فوتر:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="عنوان نماد (مثال: ستاد ساماندهی)"
                  value={newCertTitle}
                  onChange={(e) => setNewCertTitle(e.target.value)}
                  className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
                <input
                  type="text"
                  placeholder="لینک تاییدیه (https://...)"
                  value={newCertLink}
                  onChange={(e) => setNewCertLink(e.target.value)}
                  className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
                />
                <input
                  type="text"
                  placeholder="آدرس لوگوی نماد (URL تصویر)"
                  value={newCertImageUrl}
                  onChange={(e) => setNewCertImageUrl(e.target.value)}
                  className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
                />
              </div>
              <button
                type="button"
                onClick={addCertificate}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer"
              >
                + ثبت نماد در فوتر
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ۳. تنظیمات دکمه شناور چت هوش مصنوعی و سنسور هوشمند عدم تداخل */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-md">
            🤖
          </span>
          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">
              ۳. استایل و رفتار دکمه چت هوش مصنوعی (AIAssistantChat)
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">تنظیم فاصله از پایین و سنسور خودکار جمع‌شدن در نزدیکی فوتر برای جلوگیری از مزاحمت</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <span className="font-bold text-[var(--text-primary)] block">عدم تداخل هوشمند با فوتر:</span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                updateSection("aiChat", { autoHideNearFooter: !config.aiChat.autoHideNearFooter });
              }}
              className={`w-full py-2.5 rounded-xl font-bold transition cursor-pointer border ${
                config.aiChat.autoHideNearFooter
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-600"
              }`}
            >
              {config.aiChat.autoHideNearFooter ? "سنسور هوشمند فعال است (جمع شدن در فوتر ✓)" : "غیرفعال (ثابت)"}
            </button>
            <span className="text-[10px] text-[var(--text-secondary)] block">
              در زمان اسکرول به انتهای صفحه، دکمه به گوی فشرده تبدیل می‌شود تا جلوی هیچ کارتی را نگیرد.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-primary)]">فاصله دسکتاپ:</span>
              <span className="font-mono font-black text-[var(--accent-blue)]">{config.aiChat.bottomDesktop}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="160"
              value={config.aiChat.bottomDesktop}
              onChange={(e) => updateSection("aiChat", { bottomDesktop: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-primary)]">فاصله موبایل:</span>
              <span className="font-mono font-black text-emerald-500">{config.aiChat.bottomMobile}px</span>
            </div>
            <input
              type="range"
              min="40"
              max="180"
              value={config.aiChat.bottomMobile}
              onChange={(e) => updateSection("aiChat", { bottomMobile: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
