// File Path: components/admin/StorefrontLayoutStudio.tsx
"use client";

import React, { useState, useEffect } from "react";
import { siteInfoService, SiteInfo, HomepageLayoutConfig, DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";

export default function StorefrontLayoutStudio() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [config, setConfig] = useState<HomepageLayoutConfig>(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
          text: "⚡ تغییرات چیدمان ویترین و مقیاس‌ها با موفقیت در دیتابیس ثبت و به صورت بلادرنگ در سایت اعمال شد.",
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

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* سربرگ استودیو چیدمان */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📐</span>
            <h2 className="text-lg font-black text-[var(--accent-blue)]">
              استودیوی کنترل بصری و تنظیم مقیاس‌های صفحه اصلی (Storefront Master Controller)
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تغییر آنی ابعاد هیرو، فعال/غیرفعال‌سازی بخش‌ها، کنترل اسلایدر ۳D و فواصل عمودی با همگام‌سازی بلادرنگ
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-7 py-3 bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white rounded-2xl text-xs font-black transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <span>💾</span>
          <span>{saving ? "در حال اعمال سراسری..." : "ذخیره و انتشار بلادرنگ"}</span>
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

      {/* ۱. تنظیمات بخش هیرو اصلی */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center text-lg font-black">
              🌟
            </span>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">۱. بخش هیرو اصلی صفحه نخست (Hero Section)</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">کنترل ارتفاع، فواصل پدینگ، متون و پس‌زمینه سه‌بعدی Three.js</p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-[var(--input-bg)] px-3.5 py-2 rounded-2xl border border-[var(--card-border)]">
            <input
              type="checkbox"
              checked={config.hero.show}
              onChange={(e) => updateSection("hero", { show: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
            />
            <span className="text-xs font-black">نمایش بخش هیرو در صفحه</span>
          </label>
        </div>

        {config.hero.show && (
          <div className="space-y-4 text-xs animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-[var(--text-secondary)]">حالت ارتفاع هیرو:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "compact", label: "بسیار فشرده" },
                    { id: "standard", label: "استاندارد" },
                    { id: "cinematic", label: "سینمایی" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { soundEngine.playClick(); updateSection("hero", { heightMode: m.id as any }); }}
                      className={`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                        config.hero.heightMode === m.id
                          ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md"
                          : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-[var(--text-secondary)]">تراکم فواصل عمودی (پدینگ):</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "compact", label: "کمترین پدینگ" },
                    { id: "normal", label: "معمولی" },
                    { id: "relaxed", label: "باز و جادار" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { soundEngine.playClick(); updateSection("hero", { verticalPadding: m.id as any }); }}
                      className={`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                        config.hero.verticalPadding === m.id
                          ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md"
                          : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-[var(--text-secondary)]">بوم سه‌بعدی Three.js در پس‌زمینه:</label>
                <button
                  type="button"
                  onClick={() => { soundEngine.playClick(); updateSection("hero", { show3DCanvas: !config.hero.show3DCanvas }); }}
                  className={`w-full py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                    config.hero.show3DCanvas
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {config.hero.show3DCanvas ? "فعال (کره نوری اپتیکال ✓)" : "غیرفعال"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">تیتر اصلی هیرو:</label>
                <input
                  type="text"
                  value={config.hero.title}
                  onChange={(e) => updateSection("hero", { title: e.target.value })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">متن دکمه اکشن (CTA):</label>
                <input
                  type="text"
                  value={config.hero.buttonText}
                  onChange={(e) => updateSection("hero", { buttonText: e.target.value })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">زیرعنوان و توضیحات هیرو:</label>
                <textarea
                  rows={2}
                  value={config.hero.subtitle}
                  onChange={(e) => updateSection("hero", { subtitle: e.target.value })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-medium text-xs outline-none leading-relaxed focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ۲. تنظیمات اسلایدر سه‌بعدی محصولات */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center text-lg font-black">
              🖥️
            </span>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">۲. نمایشگاه سه‌بعدی محصولات (3D Perspective Showcase)</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">تنظیم مقیاس کارت‌ها، تیتر و تعداد کالاهای نمایشی در کاروسل</p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-[var(--input-bg)] px-3.5 py-2 rounded-2xl border border-[var(--card-border)]">
            <input
              type="checkbox"
              checked={config.showcase3D.show}
              onChange={(e) => updateSection("showcase3D", { show: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
            />
            <span className="text-xs font-black">نمایش اسلایدر سه‌بعدی</span>
          </label>
        </div>

        {config.showcase3D.show && (
          <div className="space-y-4 text-xs animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-[var(--text-secondary)]">مقیاس ابعاد کارت‌ها:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "compact", label: "کوچک" },
                    { id: "standard", label: "استاندارد" },
                    { id: "large", label: "بزرگ و عریض" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { soundEngine.playClick(); updateSection("showcase3D", { cardScale: m.id as any }); }}
                      className={`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                        config.showcase3D.cardScale === m.id
                          ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md"
                          : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">تیتر بخش اسلایدر:</label>
                <input
                  type="text"
                  value={config.showcase3D.title}
                  onChange={(e) => updateSection("showcase3D", { title: e.target.value })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">تعداد کالاهای کاروسل:</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={config.showcase3D.limit}
                  onChange={(e) => updateSection("showcase3D", { limit: Number(e.target.value) })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-mono font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">زیرعنوان توضیحات اسلایدر:</label>
                <input
                  type="text"
                  value={config.showcase3D.subtitle}
                  onChange={(e) => updateSection("showcase3D", { subtitle: e.target.value })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-medium text-xs outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ۳. تیکر اخبار و بخش مجله */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📡</span>
              <h3 className="font-black text-sm text-[var(--text-primary)]">۳. تیکر جدیدترین اخبار تکنولوژی</h3>
            </div>
            <input
              type="checkbox"
              checked={config.newsTicker.show}
              onChange={(e) => updateSection("newsTicker", { show: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            نمایش نوار پویا و فشرده اخبار با چرخش هر ۶ ثانیه در بالای هیرو بنر صفحه نخست.
          </p>
        </div>

        <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h3 className="font-black text-sm text-[var(--text-primary)]">۴. مجله و مقالات تخصصی صفحه اصلی</h3>
            </div>
            <input
              type="checkbox"
              checked={config.blogSection.show}
              onChange={(e) => updateSection("blogSection", { show: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">تعداد مقالات:</label>
              <select
                value={config.blogSection.count}
                onChange={(e) => updateSection("blogSection", { count: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                <option value={3}>۳ مقاله (یک ردیف فشرده)</option>
                <option value={6}>۶ مقاله (دو ردیف کامل)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">دکمه «مشاهده همه»:</label>
              <button
                type="button"
                onClick={() => updateSection("blogSection", { showViewAll: !config.blogSection.showViewAll })}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
              >
                {config.blogSection.showViewAll ? "نمایش لینک ✓" : "مخفی"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ۵. تنظیمات فوتر و داک کلیدهای کیبورد */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-lg font-black">
            ⚓
          </span>
          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">۵. تنظیمات جامع فوتر و داک کلیدهای مکانیکی (Footer & ContactDock)</h3>
            <p className="text-[11px] text-[var(--text-secondary)]">کنترل نشان‌های گارانتی، پدینگ فوتر و فعال/غیرفعال‌سازی داک کیبورد شبکه اجتماعی</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <span className="font-bold text-[var(--text-primary)] block">کلیدهای فلیپ‌شونده CONTACT:</span>
            <button
              type="button"
              onClick={() => { soundEngine.playClick(); updateSection("contactDock", { show: !config.contactDock.show }); }}
              className={`w-full py-2.5 rounded-xl font-bold transition cursor-pointer border ${
                config.contactDock.show
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-600"
              }`}
            >
              {config.contactDock.show ? "داک کیبورد فعال است ✓" : "مخفی‌سازی داک کیبورد"}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <span className="font-bold text-[var(--text-primary)] block">نشان‌های گارانتی و ارسال:</span>
            <button
              type="button"
              onClick={() => { soundEngine.playClick(); updateSection("footer", { showBadges: !config.footer.showBadges }); }}
              className={`w-full py-2.5 rounded-xl font-bold transition cursor-pointer border ${
                config.footer.showBadges
                  ? "bg-blue-500/15 border-blue-500/30 text-[var(--accent-blue)]"
                  : "bg-slate-500/15 border-slate-500/30 text-slate-500"
              }`}
            >
              {config.footer.showBadges ? "نمایش بج‌های گارانتی ✓" : "مخفی‌سازی بج‌ها"}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <span className="font-bold text-[var(--text-primary)] block">تراکم و فواصل عمودی فوتر:</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "compact", label: "فشرده" },
                { id: "normal", label: "معمولی" },
                { id: "relaxed", label: "باز" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { soundEngine.playClick(); updateSection("footer", { paddingMode: m.id as any }); }}
                  className={`py-1.5 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                    config.footer.paddingMode === m.id
                      ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                      : "bg-[var(--modal-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ۶. تنظیم ارتفاع دکمه شناور چت هوش مصنوعی */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-md">
            🤖
          </span>
          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">۶. تنظیم ارتفاع شناور دکمه هوش مصنوعی (AIAssistantChat)</h3>
            <p className="text-[11px] text-[var(--text-secondary)]">تنظیم دقیق فاصله از پایین صفحه جهت جلوگیری از هرگونه تداخل با فوتر یا داک موبایل</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-primary)]">فاصله در دسکتاپ:</span>
              <span className="font-mono font-black text-[var(--accent-blue)]">{config.aiChat.bottomDesktop} پیکسل</span>
            </div>
            <input
              type="range"
              min="20"
              max="160"
              value={config.aiChat.bottomDesktop}
              onChange={(e) => updateSection("aiChat", { bottomDesktop: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-[10px] text-[var(--text-secondary)] block">پیش‌فرض: ۶۴ پیکسل (معادل bottom-16)</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-primary)]">فاصله در موبایل:</span>
              <span className="font-mono font-black text-emerald-500">{config.aiChat.bottomMobile} پیکسل</span>
            </div>
            <input
              type="range"
              min="40"
              max="180"
              value={config.aiChat.bottomMobile}
              onChange={(e) => updateSection("aiChat", { bottomMobile: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-[10px] text-[var(--text-secondary)] block">پیش‌فرض: ۹۶ پیکسل (معادل bottom-24 جهت قرارگیری بالای داک منو)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
