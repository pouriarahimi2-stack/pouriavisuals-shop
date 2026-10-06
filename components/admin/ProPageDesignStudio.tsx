"use client";
// File Path: components/admin/ProPageDesignStudio.tsx
import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { CustomPageSection } from "@/components/LivePageSectionsRenderer";

const BLOCK_TEMPLATES: Record<
  CustomPageSection["type"],
  { label: string; defaultTitle: string; defaultSub: string; defaultItems?: any[] }
> = {
  hero_banner: {
    label: "🌌 بنر هیرو پیشرفته (Hero Showcase + CTA)",
    defaultTitle: "نسل جدید تجهیزات دیجیتال و گجت‌های هوشمند در آکسون کور",
    defaultSub: "با ضمانت اصالت طلایی، ارسال سریع سراسری و پشتیبانی تخصصی آنلاین",
  },
  product_showcase: {
    label: "🛍️ ویترین داینامیک محصولات (بر اساس دسته یا تخفیف)",
    defaultTitle: "منتخب‌ترین تجهیزات پرچمدار آکسون کور",
    defaultSub: "ارسال فوری با گارانتی معتبر و تضمین اصالت",
  },
  bento_grid: {
    label: "🍱 شبکه بنتو به سبک اپل (Apple Bento Grid)",
    defaultTitle: "چرا حرفه‌ای‌ها آکسون کور را انتخاب می‌کنند؟",
    defaultSub: "ترکیبی از اصالت سخت‌افزاری، قیمت رقابتی و گارانتی معتبر",
    defaultItems: [
      {
        icon: "🛡️",
        title: "ضمانت ۱۰۰٪ اصالت کالا",
        desc: "تمامی محصولات با تست سلامت و تضمین اورجینال بودن عرضه می‌شوند.",
        badge: "VIP Guarantee",
      },
      {
        icon: "🚀",
        title: "ارسال اکسپرس و ایمن",
        desc: "بسته‌بندی ضدضربه و ارسال سریع به سراسر کشور همراه با کد رهگیری.",
        badge: "Fast Express",
      },
      {
        icon: "💬",
        title: "مشاوره تخصصی پیش از خرید",
        desc: "پشتیبانی زنده برای انتخاب بهترین گزینه متناسب با نیاز شما.",
        badge: "Live Support",
      },
    ],
  },
  comparison_table: {
    label: "📊 جدول مقایسه تخصصی ویژگی‌ها",
    defaultTitle: "مقایسه استانداردهای کیفی آکسون کور",
    defaultSub: "بررسی دقیق مزایای خرید مستقیم از مرجع تخصصی",
    defaultItems: [
      {
        title: "اصالت و سلامت فیزیکی کالا",
        desc: "پلمپ اصلی + بررسی تخصصی پیش از ارسال",
        badge: "✓ تضمین ۱۰۰٪",
      },
      {
        title: "پشتیبانی و رهگیری سفارش",
        desc: "گفتگوی زنده بلادرنگ + پیامک خودکار کد رهگیری",
        badge: "✓ فعال ۲۴/۷",
      },
    ],
  },
  faq_accordion: {
    label: "❓ سوالات متداول آکاردئونی (Interactive FAQ)",
    defaultTitle: "سوالات متداول خریداران",
    defaultSub: "پاسخ به پرسش‌های پرتکرار درباره نحوه سفارش، گارانتی و ارسال",
    defaultItems: [
      {
        title: "ارسال سفارشات چقدر زمان می‌برد؟",
        desc: "تمامی سفارشات در سریع‌ترین زمان ممکن پردازش و تحویل پست پیشتاز می‌شوند و کد رهگیری پیامک می‌گردد.",
      },
      {
        title: "آیا تمامی کالاها دارای ضمانت اصالت هستند؟",
        desc: "بله، تمامی کالاهای موجود در آکسون کور با تضمین اصالت و سلامت فیزیکی عرضه می‌شوند.",
      },
    ],
  },
  countdown_offer: {
    label: "⏳ بنر کمپین و جشنواره فروش ویژه",
    defaultTitle: "جشنواره فروش ویژه تجهیزات منتخب آکسون کور",
    defaultSub: "فرصت محدود استفاده از تخفیف‌های اختصاصی روی محصولات منتخب",
  },
  trust_badges: {
    label: "🛡️ نوار ضمانت اصالت و مزایای خرید",
    defaultTitle: "خرید امن با ضمانت اصالت کالا و پشتیبانی آنلاین آکسون کور",
    defaultSub: "تجربه خریدی مطمئن، سریع و مدرن",
  },
  glass_callout: {
    label: "💎 کارت شیشه‌ای فراخوان (Liquid Glass Callout)",
    defaultTitle: "نیاز به راهنمایی تخصصی برای انتخاب محصول دارید؟",
    defaultSub: "همین حالا از طریق آیکون گفتگوی زنده در پایین صفحه با کارشناسان ما در ارتباط باشید.",
  },
  custom_html: {
    label: "💻 بلوک کد آزاد HTML / بنر سفارشی",
    defaultTitle: "بخش سفارشی آکسون کور",
    defaultSub: "",
  },
};

export default function ProPageDesignStudio() {
  const [sections, setSections] = useState<CustomPageSection[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>("/");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json?.config?.customPageSections)) {
          setSections(json.config.customPageSections);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddBlock = (type: CustomPageSection["type"]) => {
    soundEngine.playClick();
    const tpl = BLOCK_TEMPLATES[type];
    const newBlock: CustomPageSection = {
      id: "sec_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      targetRoute: selectedRoute,
      position: "top",
      type,
      title: tpl.defaultTitle,
      subtitle: tpl.defaultSub,
      badgeText: "AXON CORE EXCLUSIVE",
      ctaText: "مشاهده کاتالوگ محصولات",
      ctaLink: "/products",
      mediaUrl: "",
      categoryFilter: "all",
      onlyDiscounted: false,
      customHtml:
        type === "custom_html"
          ? '<div class="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-center font-bold">محتوای سفارشی HTML شما در اینجا قرار می‌گیرد</div>'
          : "",
      glassStyle: true,
      paddingY: 28,
      items: tpl.defaultItems ? JSON.parse(JSON.stringify(tpl.defaultItems)) : [],
      enabled: true,
    };
    setSections((prev) => [...prev, newBlock]);
    setEditingId(newBlock.id);
  };

  const handleUpdateBlock = (id: string, patch: Partial<CustomPageSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const handleDeleteBlock = (id: string) => {
    soundEngine.playClick();
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleSaveAllSections = async () => {
    soundEngine.playClick();
    setSaving(true);
    setFeedback(null);
    try {
      const tbRes = await fetch("/api/theme-builder?t=" + Date.now(), {
        cache: "no-store",
      });
      const tbJson = await tbRes.json().catch(() => ({}));
      const prevConfig = tbJson?.config || {};

      const res = await fetch("/api/theme-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            ...prevConfig,
            customPageSections: sections,
          },
        }),
      });

      if (res.ok) {
        soundEngine.playSuccess();
        window.dispatchEvent(new CustomEvent("axon_pages_studio_updated"));
        window.dispatchEvent(new CustomEvent("theme_builder_updated"));
        setFeedback("✓ طراحی و بلوک‌های صفحات با موفقیت ذخیره و به صورت زنده در سایت منتشر شد!");
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const routeSections = sections.filter((s) => s.targetRoute === selectedRoute);
  const activeBlock = sections.find((s) => s.id === editingId) || null;

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border-2 border-[var(--accent-blue)]/40 shadow-2xl space-y-5 text-xs font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
        <div>
          <h2 className="font-black text-sm sm:text-base text-[var(--accent-blue)] flex items-center gap-2">
            <span>🎨</span> استودیوی پیشرفته طراحی صفحات سایت و ویرایشگر صفحات فعلی (Live Modular Studio)
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            ویرایش مستقیم صفحات فعلی سایت (صفحه اصلی، کاتالوگ، درباره ما، تماس با ما) یا افزودن بلوک‌های Liquid Glass با جزئیات کامل
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSaveAllSections}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xl cursor-pointer transition disabled:opacity-50"
        >
          {saving ? "در حال انتشار..." : "💾 ذخیره و انتشار زنده بلوک‌های صفحات"}
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black">
          {feedback}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-black text-[var(--text-secondary)] ml-2">
          📍 انتخاب صفحه جهت طراحی یا ویرایش:
        </span>
        {[
          { route: "/", label: "🏠 صفحه اصلی سایت (/)" },
          { route: "/products", label: "🛍️ صفحه کاتالوگ محصولات (/products)" },
          { route: "/about", label: "ℹ️ صفحه درباره ما (/about)" },
          { route: "/contact", label: "📞 صفحه تماس با ما (/contact)" },
          { route: "all", label: "🌐 نمایش در تمام صفحات سایت" },
        ].map((r) => (
          <button
            key={r.route}
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setSelectedRoute(r.route);
              setEditingId(null);
            }}
            className={
              "px-3.5 py-2 rounded-2xl border font-black cursor-pointer transition " +
              (selectedRoute === r.route
                ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-lg"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
        <div className="font-black text-[var(--accent-blue)]">
          ➕ افزودن بلوک جدید به صفحه انتخاب‌شده ({selectedRoute}):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(Object.keys(BLOCK_TEMPLATES) as Array<CustomPageSection["type"]>).map(
            (typeKey) => (
              <button
                key={typeKey}
                type="button"
                onClick={() => handleAddBlock(typeKey)}
                className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-right font-bold cursor-pointer transition flex items-center justify-between gap-2"
              >
                <span className="truncate">{BLOCK_TEMPLATES[typeKey].label}</span>
                <span className="text-[var(--accent-blue)] font-black">+</span>
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 space-y-2.5">
          <div className="font-black text-[var(--text-secondary)]">
            🧱 بلوک‌های فعال در مسیر «{selectedRoute}» ({routeSections.length} بلوک):
          </div>
          {routeSections.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[var(--input-bg)] border border-dashed border-[var(--card-border)] text-center text-[var(--text-secondary)]">
              هنوز بلوکی به این صفحه اضافه نشده است. از دکمه‌های بالا یک بلوک انتخاب کنید.
            </div>
          ) : (
            routeSections.map((sec, idx) => (
              <div
                key={sec.id}
                onClick={() => setEditingId(sec.id)}
                className={
                  "p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-2 " +
                  (editingId === sec.id
                    ? "bg-[var(--accent-blue)]/15 border-[var(--accent-blue)]"
                    : "bg-[var(--input-bg)] border-[var(--card-border)]")
                }
              >
                <div className="min-w-0">
                  <div className="font-black truncate">
                    {idx + 1}. {sec.title}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {BLOCK_TEMPLATES[sec.type]?.label} | جایگاه:{" "}
                    {sec.position === "top" ? "بالای صفحه" : "پایین صفحه"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateBlock(sec.id, { enabled: !sec.enabled });
                    }}
                    className={
                      "px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer " +
                      (sec.enabled
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-500/20 text-slate-400")
                    }
                  >
                    {sec.enabled ? "فعال" : "مخفی"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBlock(sec.id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-[10px] font-black cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-7">
          {activeBlock ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/50 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-2.5">
                <span className="font-black text-sm text-[var(--accent-blue)]">
                  ⚙️ ویرایش جزئیات بلوک: {BLOCK_TEMPLATES[activeBlock.type]?.label}
                </span>
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <span>استایل شیشه‌ای (Liquid Glass)</span>
                  <input
                    type="checkbox"
                    checked={activeBlock.glassStyle}
                    onChange={(e) =>
                      handleUpdateBlock(activeBlock.id, {
                        glassStyle: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-sky-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold">عنوان اصلی بلوک:</label>
                  <input
                    type="text"
                    value={activeBlock.title}
                    onChange={(e) =>
                      handleUpdateBlock(activeBlock.id, { title: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold">بج بالای عنوان (Badge):</label>
                  <input
                    type="text"
                    value={activeBlock.badgeText || ""}
                    onChange={(e) =>
                      handleUpdateBlock(activeBlock.id, { badgeText: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold">زیرعنوان / توضیحات بلوک:</label>
                <textarea
                  rows={2}
                  value={activeBlock.subtitle}
                  onChange={(e) =>
                    handleUpdateBlock(activeBlock.id, { subtitle: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none"
                />
              </div>

              {activeBlock.type === "product_showcase" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                  <div>
                    <label className="block mb-1 font-bold">فیلتر دسته‌بندی محصولات:</label>
                    <input
                      type="text"
                      value={activeBlock.categoryFilter || "all"}
                      onChange={(e) =>
                        handleUpdateBlock(activeBlock.id, { categoryFilter: e.target.value })
                      }
                      placeholder="all یا نام دسته (مثلاً اتوبخار)"
                      className="w-full p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="w-full p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between cursor-pointer font-bold">
                      <span>فقط نمایش کالاهای تخفیف‌دار</span>
                      <input
                        type="checkbox"
                        checked={Boolean(activeBlock.onlyDiscounted)}
                        onChange={(e) =>
                          handleUpdateBlock(activeBlock.id, {
                            onlyDiscounted: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-sky-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeBlock.type === "custom_html" && (
                <div>
                  <label className="block mb-1 font-bold">کد سفارشی HTML / Tailwind:</label>
                  <textarea
                    rows={4}
                    dir="ltr"
                    value={activeBlock.customHtml || ""}
                    onChange={(e) =>
                      handleUpdateBlock(activeBlock.id, { customHtml: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>
              )}

              {(activeBlock.type === "bento_grid" ||
                activeBlock.type === "comparison_table" ||
                activeBlock.type === "faq_accordion") && (
                <div className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[var(--accent-blue)]">
                      📋 مدیریت آیتم‌های زیرمجموعه این بلوک ({(activeBlock.items || []).length} مورد):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextItems = [
                          ...(activeBlock.items || []),
                          { title: "عنوان آیتم جدید", desc: "توضیحات این آیتم...", badge: "VIP", icon: "✨" },
                        ];
                        handleUpdateBlock(activeBlock.id, { items: nextItems });
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-black text-[10px] cursor-pointer"
                    >
                      + افزودن آیتم جدید
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(activeBlock.items || []).map((it, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={it.title}
                            onChange={(e) => {
                              const copy = [...(activeBlock.items || [])];
                              copy[idx] = { ...copy[idx], title: e.target.value };
                              handleUpdateBlock(activeBlock.id, { items: copy });
                            }}
                            placeholder="عنوان آیتم"
                            className="flex-1 p-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const copy = (activeBlock.items || []).filter((_, i) => i !== idx);
                              handleUpdateBlock(activeBlock.id, { items: copy });
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="text"
                          value={it.desc}
                          onChange={(e) => {
                            const copy = [...(activeBlock.items || [])];
                            copy[idx] = { ...copy[idx], desc: e.target.value };
                            handleUpdateBlock(activeBlock.id, { items: copy });
                          }}
                          placeholder="توضیحات آیتم"
                          className="w-full p-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold">متن دکمه (CTA):</label>
                  <input
                    type="text"
                    value={activeBlock.ctaText || ""}
                    onChange={(e) =>
                      handleUpdateBlock(activeBlock.id, { ctaText: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold">لینک دکمه:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={activeBlock.ctaLink || ""}
                    onChange={(e) =>
                      handleUpdateBlock(activeBlock.id, { ctaLink: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold">محل نمایش در صفحه:</label>
                  <select
                    value={activeBlock.position}
                    onChange={(e) =>
                      handleUpdateBlock(activeBlock.id, {
                        position: e.target.value as "top" | "bottom",
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                  >
                    <option value="top">⬆️ بالای صفحه (زیر هدر)</option>
                    <option value="bottom">⬇️ پایین صفحه (بالای فوتر)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[180px] p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-secondary)] font-bold">
              روی یکی از بلوک‌های سمت راست کلیک کنید تا جزئیات کامل آن را ویرایش نمایید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
