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
import MediaUploadModal from "@/components/admin/MediaUploadModal";

export default function StorefrontLayoutStudio() {
  const [activeTab, setActiveTab] = useState<"header" | "footer" | "sections" | "media" | "preview">("header");
  const [config, setConfig] = useState<HomepageLayoutConfig>(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // مدال انتخاب رسانه
  const [mediaModal, setMediaModal] = useState<{
    open: boolean;
    target: "headerLogo" | "footerLogo" | "favicon" | null;
  }>({ open: false, target: null });

  // فیلدهای لینک جدید
  const [newMenuTitle, setNewMenuTitle] = useState("");
  const [newMenuUrl, setNewMenuUrl] = useState("");
  const [newQuickLinkTitle, setNewQuickLinkTitle] = useState("");
  const [newQuickLinkUrl, setNewQuickLinkUrl] = useState("");
  const [newServiceLinkTitle, setNewServiceLinkTitle] = useState("");
  const [newServiceLinkUrl, setNewServiceLinkUrl] = useState("");

  const loadData = async () => {
    const info = await siteInfoService.getSiteInfo();
    if (info?.homepage_layout_config) {
      setConfig({
        ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
        ...info.homepage_layout_config,
        header: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.header, ...(info.homepage_layout_config.header || {}) },
        footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...(info.homepage_layout_config.footer || {}) },
      });
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
      });

      if (updated) {
        soundEngine.playSuccess();
        setStatusMessage({ type: "success", text: "⚡ تنظیمات چیدمان و ظاهر ویترین با موفقیت در دیتابیس ذخیره و بلادرنگ منتشر گردید." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی اطلاعات." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleResetDefaults = () => {
    if (!confirm("آیا مایلید تمام تنظیمات هدر، فوتر و صفحه اصلی را به مقادیر اولیه بازگردانید؟")) return;
    soundEngine.playSuccess();
    setConfig(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
    handleSave(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* هدر ماژول */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🎨</span> استودیوی چیدمان و کنترل بصری ویترین فروشگاه
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            شخصی‌سازی هدر کپسولی، فوتر ۱۲ ستونه، متون برند، نماد اینماد و پیش‌نمایش زنده
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
          { id: "footer", label: "۲. فوتر و ستون‌ها", icon: "⚓" },
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
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">نام برند در هدر:</label>
              <input
                type="text"
                value={config.header.brand.name}
                onChange={(e) => setConfig({ ...config, header: { ...config.header, brand: { ...config.header.brand, name: e.target.value } } })}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">عرض لوگو (پیکسل):</label>
              <input
                type="number"
                value={config.header.brand.logoWidth}
                onChange={(e) => setConfig({ ...config, header: { ...config.header, brand: { ...config.header.brand, logoWidth: Number(e.target.value) } } })}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">ارتفاع لوگو (پیکسل):</label>
              <input
                type="number"
                value={config.header.brand.logoHeight}
                onChange={(e) => setConfig({ ...config, header: { ...config.header, brand: { ...config.header.brand, logoHeight: Number(e.target.value) } } })}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 border-t border-[var(--card-border)]">
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
                checked={config.header.brand.showTagline}
                onChange={(e) => setConfig({ ...config, header: { ...config.header, brand: { ...config.header.brand, showTagline: e.target.checked } } })}
                className="w-4 h-4 rounded text-[var(--accent-blue)]"
              />
              نمایش زیرعنوان در کنار لوگو
            </label>
          </div>
        </div>
      )}

      {/* تب ۲: فوتر */}
      {activeTab === "footer" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">عنوان برند فوتر:</label>
              <input
                type="text"
                value={config.footer.brandTitle}
                onChange={(e) => setConfig({ ...config, footer: { ...config.footer, brandTitle: e.target.value } })}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">زیرعنوان برند فوتر:</label>
              <input
                type="text"
                value={config.footer.brandSubtitle}
                onChange={(e) => setConfig({ ...config, footer: { ...config.footer, brandSubtitle: e.target.value } })}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-[var(--text-secondary)] mb-1">متن معرفی و تعهدات فوتر:</label>
              <textarea
                rows={3}
                value={config.footer.description}
                onChange={(e) => setConfig({ ...config, footer: { ...config.footer, description: e.target.value } })}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* تب ۳: سکشن‌های صفحه اصلی */}
      {activeTab === "sections" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h3 className="font-black text-sm text-[var(--accent-blue)]">کنترل نمایش بخش‌های صفحه اصلی:</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۱. بخش هیرو و بنر اصلی (Hero Banner)</span>
              <input
                type="checkbox"
                checked={config.hero.show}
                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, show: e.target.checked } })}
                className="w-4 h-4 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۲. نوار فیلتر دسته‌بندی بالای محصولات</span>
              <input
                type="checkbox"
                checked={config.productsSection.showCategoryFilter}
                onChange={(e) => setConfig({ ...config, productsSection: { ...config.productsSection, showCategoryFilter: e.target.checked } })}
                className="w-4 h-4 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
              <span className="font-bold">۳. سه کارت اعتماد (گارانتی / کالیبراسیون / ارسال)</span>
              <input
                type="checkbox"
                checked={config.trustBadges.show}
                onChange={(e) => setConfig({ ...config, trustBadges: { ...config.trustBadges, show: e.target.checked } })}
                className="w-4 h-4 rounded"
              />
            </label>
          </div>
        </div>
      )}

      {/* تب ۴: رسانه و لوگوها */}
      {activeTab === "media" && (
        <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold">لوگوی هدر:</span>
                <button
                  type="button"
                  onClick={() => setMediaModal({ open: true, target: "headerLogo" })}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px]"
                >
                  انتخاب تصویر
                </button>
              </div>
              <div className="h-20 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center p-2">
                {config.header.brand.logoUrl ? (
                  <img src={config.header.brand.logoUrl} alt="" className="max-h-full object-contain" />
                ) : (
                  <span className="text-slate-400">بدون لوگو</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold">لوگوی فوتر:</span>
                <button
                  type="button"
                  onClick={() => setMediaModal({ open: true, target: "footerLogo" })}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px]"
                >
                  انتخاب تصویر
                </button>
              </div>
              <div className="h-20 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center p-2">
                {config.footer.logoUrl ? (
                  <img src={config.footer.logoUrl} alt="" className="max-h-full object-contain" />
                ) : (
                  <span className="text-slate-400">بدون لوگو</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* تب ۵: پیش‌نمایش زنده */}
      {activeTab === "preview" && (
        <div className="bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] shadow-xl overflow-hidden">
          <iframe
            src="/"
            className="w-full h-[650px] rounded-2xl border border-[var(--card-border)]"
            title="Storefront Preview"
          />
        </div>
      )}

      {/* مدال انتخاب رسانه */}
      {mediaModal.open && (
        <MediaUploadModal
          isOpen={mediaModal.open}
          onClose={() => setMediaModal({ open: false, target: null })}
          onUploadSuccess={(url) => {
            if (mediaModal.target === "headerLogo") {
              setConfig({ ...config, header: { ...config.header, brand: { ...config.header.brand, logoUrl: url } } });
            } else if (mediaModal.target === "footerLogo") {
              setConfig({ ...config, footer: { ...config.footer, logoUrl: url } });
            }
          }}
        />
      )}

    </div>
  );
}
