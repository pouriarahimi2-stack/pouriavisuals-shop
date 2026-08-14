"use client";

import { useState } from "react";

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageEmoji: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  badge: string;
  icon: string;
}

export default function PageBuilder() {
  // ۱. لیست بنرهای اصلی (قابل حذف و اضافه نامحدود)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
    {
      id: "h1",
      badge: "نسل جدید فروشگاه آنلاین",
      title: "طراحی مینیمال. سرعت فوق‌العاده.",
      subtitle: "تجربه‌ای متفاوت از خرید آنلاین با بالاترین سرعت بارگذاری.",
      buttonText: "مشاهده محصولات",
      buttonLink: "#products",
      imageEmoji: "💎",
    },
  ]);

  // ۲. لیست بنرهای تبلیغاتی (قابل حذف و اضافه نامحدود)
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([
    {
      id: "p1",
      title: "آیفون ۱۵ پرو مکس",
      subtitle: "بدنه تیتانیوم با تراشه A17 Pro",
      link: "/products/1",
      badge: "پیشنهاد ویژه",
      icon: "📱",
    },
    {
      id: "p2",
      title: "مک‌بوک پرو M3",
      subtitle: "قدرت بی‌نظیر برای حرفه‌ای‌ها",
      link: "/products/2",
      badge: "فروش شگفت‌انگیز",
      icon: "💻",
    },
  ]);

  // افزودن بنر اصلی جدید
  const handleAddHeroSlide = () => {
    const newSlide: HeroSlide = {
      id: Date.now().toString(),
      badge: "عنوان برچسب جدید",
      title: "تیتر بنر جدید شما",
      subtitle: "توضیحات اختصاصی برای این بنر جدید...",
      buttonText: "کلیک کنید",
      buttonLink: "/products",
      imageEmoji: "🚀",
    };
    setHeroSlides([...heroSlides, newSlide]);
  };

  // حذف بنر اصلی
  const handleDeleteHeroSlide = (id: string) => {
    if (heroSlides.length === 1) {
      alert("حداقل یک بنر اصلی باید در سایت وجود داشته باشد.");
      return;
    }
    setHeroSlides(heroSlides.filter((slide) => slide.id !== id));
  };

  // افزودن بنر تبلیغاتی جدید
  const handleAddPromoBanner = () => {
    const newBanner: PromoBanner = {
      id: Date.now().toString(),
      title: "عنوان بنر تبلیغاتی",
      subtitle: "توضیحات کوتاه تبلیغاتی",
      link: "/categories",
      badge: "جدید",
      icon: "🎁",
    };
    setPromoBanners([...promoBanners, newBanner]);
  };

  // حذف بنر تبلیغاتی
  const handleDeletePromoBanner = (id: string) => {
    setPromoBanners(promoBanners.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-8 dir-rtl">
      {/* ================= ۱. مدیریت بنرهای اصلی Hero (افزودن / حذف / ویرایش) ================= */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">🖼️ اسلایدر و بنرهای اصلی (Hero Section)</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">امکان افزودن بنرهای جدید یا حذف موارد قدیمی</p>
          </div>
          <button
            onClick={handleAddHeroSlide}
            className="bg-[var(--accent-blue)] text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition flex items-center gap-1"
          >
            ➕ افزودن بنر اصلی جدید
          </button>
        </div>

        <div className="space-y-6">
          {heroSlides.map((slide, idx) => (
            <div key={slide.id} className="p-5 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-primary)] space-y-4 relative">
              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <span className="text-xs font-bold text-[var(--accent-blue)]">اسلاید شماره {idx + 1}</span>
                <button
                  onClick={() => handleDeleteHeroSlide(slide.id)}
                  className="text-xs text-red-500 hover:bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20 transition"
                >
                  🗑️ حذف این اسلاید
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">آیکون / نماد بنر</label>
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={slide.imageEmoji}
                    onChange={(e) => {
                      const updated = [...heroSlides];
                      updated[idx].imageEmoji = e.target.value;
                      setHeroSlides(updated);
                    }}
                    className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs text-center text-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">برچسب بالای تیتر (Badge)</label>
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={slide.badge}
                    onChange={(e) => {
                      const updated = [...heroSlides];
                      updated[idx].badge = e.target.value;
                      setHeroSlides(updated);
                    }}
                    className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">متن دکمه (CTA)</label>
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={slide.buttonText}
                    onChange={(e) => {
                      const updated = [...heroSlides];
                      updated[idx].buttonText = e.target.value;
                      setHeroSlides(updated);
                    }}
                    className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">تیتر اصلی *</label>
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={slide.title}
                    onChange={(e) => {
                      const updated = [...heroSlides];
                      updated[idx].title = e.target.value;
                      setHeroSlides(updated);
                    }}
                    className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">لینک هدایت کلیک</label>
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={slide.buttonLink}
                    onChange={(e) => {
                      const updated = [...heroSlides];
                      updated[idx].buttonLink = e.target.value;
                      setHeroSlides(updated);
                    }}
                    className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">توضیحات اسلاید</label>
                <textarea
                  rows={2}
                  suppressHydrationWarning
                  value={slide.subtitle}
                  onChange={(e) => {
                    const updated = [...heroSlides];
                    updated[idx].subtitle = e.target.value;
                    setHeroSlides(updated);
                  }}
                  className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= ۲. مدیریت بنرهای تبلیغاتی وسط صفحه (افزودن / حذف) ================= */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">📢 بنرهای تبلیغاتی پویا</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">تعریف بنرهای تبلیغاتی چندتایی وسط صفحه اول</p>
          </div>
          <button
            onClick={handleAddPromoBanner}
            className="bg-[var(--accent-blue)] text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition flex items-center gap-1"
          >
            ➕ افزودن بنر تبلیغاتی جدید
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promoBanners.map((banner, idx) => (
            <div key={banner.id} className="p-5 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-primary)] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[var(--accent-blue)]">بنر تبلیغاتی {idx + 1}</span>
                <button
                  onClick={() => handleDeletePromoBanner(banner.id)}
                  className="text-xs text-red-500 hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition"
                >
                  حذف
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">آیکون بنر</label>
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={banner.icon}
                    onChange={(e) => {
                      const updated = [...promoBanners];
                      updated[idx].icon = e.target.value;
                      setPromoBanners(updated);
                    }}
                    className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">برچسب (Badge)</label>
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={banner.badge}
                    onChange={(e) => {
                      const updated = [...promoBanners];
                      updated[idx].badge = e.target.value;
                      setPromoBanners(updated);
                    }}
                    className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">عنوان بنر</label>
                <input
                  type="text"
                  suppressHydrationWarning
                  value={banner.title}
                  onChange={(e) => {
                    const updated = [...promoBanners];
                    updated[idx].title = e.target.value;
                    setPromoBanners(updated);
                  }}
                  className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">لینک آدرس (URL)</label>
                <input
                  type="text"
                  suppressHydrationWarning
                  value={banner.link}
                  onChange={(e) => {
                    const updated = [...promoBanners];
                    updated[idx].link = e.target.value;
                    setPromoBanners(updated);
                  }}
                  className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}