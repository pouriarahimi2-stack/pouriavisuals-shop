"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const STORAGE_PREFIX = "axon_puck_page_data_v2026_";

// قالب پیش‌فرض اختصاصی برای هر صفحه خاص
function getInitialDataForSlug(slug: string, title?: string): Data {
  const commonHeader = {
    type: "HeaderCapsuleBar",
    props: {
      id: "header-capsule-" + slug,
      brandText: "Axon | آکسون",
      logoUrl: "",
      logoWidth: 36,
      logoHeight: 36,
      menu1Text: "کاتالوگ محصولات",
      menu1Url: "/products",
      menu2Text: "اخبار تکنولوژی",
      menu2Url: "/news",
      menu3Text: "مجله سئو",
      menu3Url: "/blog",
      menu4Text: "پیگیری سفارش",
      menu4Url: "/track-order",
      menu5Text: "تماس با ما",
      menu5Url: "/contact",
      showCart: true,
      showTheme: true,
      showUser: true,
      capsuleBg: "#07090e",
      capsuleBorder: "#27272a"
    }
  };

  const commonFooter = {
    type: "GlobalFooterBlock",
    props: {
      id: "footer-" + slug,
      footerLogoUrl: "",
      brandTitle: "Axon | آکسون",
      brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
      brandDesc: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
      supportPhone: "09376110200",
      supportEmail: "Pouriarahimi@yahoo.com",
      warehouseAddress: "شیراز - ستارخان",
      workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      enamadCode: "27424534",
      copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
      footerBg: "#07090e"
    }
  };

  if (slug === "products") {
    return {
      content: [
        commonHeader,
        {
          type: "NativeProductCatalog",
          props: {
            id: "catalog-page-main",
            heading: "کاتالوگ جامع مانیتورها و تجهیزات تصویر",
            subtitle: "دارای گارانتی اصالت طلایی و ارسال سریع پیشتاز به سراسر کشور",
            limit: 12
          }
        },
        commonFooter
      ],
      root: { props: { title: "کاتالوگ محصولات" } }
    };
  }

  if (slug === "about") {
    return {
      content: [
        commonHeader,
        {
          type: "RichTextBlock",
          props: {
            id: "about-rich-text",
            title: "درباره آکسون استودیو (Axon Core)",
            content: "مجموعه آکسون مرجع تخصصی تامین، کالیبراسیون و مشاوره تجهیزات پیشرفته تصویر، مانیتورهای تدوین رنگ ۵K و ۴K، کارت‌های کپچر و ابزارهای حرفه‌ای استودیو در ایران است.\n\nتعهد ما ارائه کالاهای ۱۰۰٪ اورجینال با گارانتی اصالت طلایی، تضمین بهترین قیمت بازار و ارسال سریع پیشتاز به سراسر کشور با بسته‌بندی ضدضربه استودیویی است.",
            bgColor: "transparent"
          }
        },
        {
          type: "FeaturesGridBlock",
          props: {
            id: "about-features",
            heading: "استانداردهای مهندسی و خدمات طلایی آکسون",
            col1Title: "🛡️ گارانتی اصالت طلایی",
            col1Desc: "تضمین ۱۰۰٪ اصالت فیزیکی قطعات و مهلت تست ۷ روزه بازگشت وجه.",
            col2Title: "🚀 ارسال ایمن هوانوردی",
            col2Desc: "بسته‌بندی ضربه‌گیر ویژه تجهیزات حساس اپتیکال با پوشش کامل بیمه.",
            col3Title: "🎨 کالیبراسیون ۳D LUT",
            col3Desc: "تست سلامت پنل و تطبیق با طیف رنگی سینمایی DCI-P3.",
            bgColor: "transparent"
          }
        },
        commonFooter
      ],
      root: { props: { title: "درباره ما" } }
    };
  }

  if (slug === "contact") {
    return {
      content: [
        commonHeader,
        {
          type: "RichTextBlock",
          props: {
            id: "contact-intro",
            title: "تماس با واحد مشاوره و پشتیبانی آکسون",
            content: "برای دریافت مشاوره تخصصی در خصوص انتخاب مانیتورهای ۵K، کارت‌های کپچر و هماهنگی فاکتور رسمی می‌توانید با شماره‌های پشتیبانی تماس حاصل فرمایید یا از طریق شبکه‌های اجتماعی با کارشناسان ما در ارتباط باشید.",
            bgColor: "transparent"
          }
        },
        commonFooter
      ],
      root: { props: { title: "تماس با ما" } }
    };
  }

  if (slug === "track-order") {
    return {
      content: [
        commonHeader,
        {
          type: "RichTextBlock",
          props: {
            id: "track-order-intro",
            title: "سامانه رهگیری لحظه‌ای مرسولات پستی",
            content: "کد رهگیری ۲۴ رقمی پیامک‌شده را در این قسمت وارد نمایید تا آخرین وضعیت ارسال بسته پستی خود را به صورت آنلاین مشاهده کنید.",
            bgColor: "transparent"
          }
        },
        commonFooter
      ],
      root: { props: { title: "پیگیری سفارش" } }
    };
  }

  // صفحه اصلی (خانه)
  if (slug === "home") {
    return {
      content: [
        commonHeader,
        {
          type: "NativeHero3D",
          props: {
            id: "hero-1",
            topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
            badgeColor: "#38bdf8",
            title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
            titleSize: 42,
            subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
            bgColor: "transparent"
          }
        },
        {
          type: "NativePerspectiveSlider",
          props: {
            id: "slider-1",
            sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
            sectionSubtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی"
          }
        },
        {
          type: "NativeProductCatalog",
          props: {
            id: "catalog-1",
            heading: "کاتالوگ تجهیزات تخصصی و مانیتورها",
            subtitle: "تمامی کالاها با گارانتی اصالت طلایی عرضه می‌شوند",
            limit: 8
          }
        },
        {
          type: "NativeExplodedView",
          props: {
            id: "exploded-1",
            productTitle: "Apple Studio Display 5K Retina",
            sectionTitle: "کالبدشکافی لایه‌های سخت‌افزاری"
          }
        },
        commonFooter
      ],
      root: { props: { title: "صفحه اصلی" } }
    };
  }

  // هر صفحه جدید و سفارشی دیگر
  return {
    content: [
      commonHeader,
      {
        type: "RichTextBlock",
        props: {
          id: "custom-page-" + slug,
          title: title || "صفحه جدید",
          content: "محتوای این صفحه را از سایدبار سمت راست ویرایش کنید یا بلوک‌های دلخواه را به آن اضافه نمایید.",
          bgColor: "transparent"
        }
      },
      commonFooter
    ],
    root: { props: { title: title || slug } }
  };
}

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data | null>(null);
  const [renderKey, setRenderKey] = useState<string>("init");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // استیت مدال ایجاد صفحه جدید
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const loadPage = async (slug: string, customTitle?: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();

    let targetData: Data | null = null;

    // ۱. بررسی کش کلاینت
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(STORAGE_PREFIX + slug);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && Array.isArray(parsed.content) && parsed.content.length > 0) {
            targetData = parsed;
          }
        }
      } catch {}
    }

    // ۲. بررسی دیتابیس
    try {
      const res = await fetch("/api/pages?slug=" + encodeURIComponent(slug), { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page && json.page.puck_data && Array.isArray(json.page.puck_data.content) && json.page.puck_data.content.length > 0) {
        targetData = json.page.puck_data;
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(targetData));
        }
      }
    } catch {}

    // ۳. در صورت نبودن دیتای ذخیره‌شده، لود قالب اختصاصی همان صفحه
    if (!targetData) {
      targetData = getInitialDataForSlug(slug, customTitle);
    }

    setPageData(targetData);
    setRenderKey(slug + "_" + Date.now());
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار و ذخیره تغییرات...");

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_PREFIX + currentSlug, JSON.stringify(data));
      } catch {}
    }
    setPageData(data);

    try {
      const currentPageObj = pages.find((p) => p.slug === currentSlug);
      const pageTitle = currentPageObj?.title || currentSlug;

      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: pageTitle,
          puck_data: data,
          is_published: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setToast("✓ صفحه «" + pageTitle + "» با موفقیت ذخیره و منتشر شد.");
        fetchPages();

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("puck_published"));
        }
      } else {
        setToast("هشدار: در مرورگر ثبت شد، خطا در سرور: " + (json.message || ""));
      }
    } catch {
      setToast("✓ تغییرات به صورت محلی ذخیره شد.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleCreateNewPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageSlug.trim()) return;

    soundEngine.playSuccess();
    const cleanSlug = newPageSlug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const title = newPageTitle.trim();

    const newPageObj = { id: "page_" + Date.now(), slug: cleanSlug, title };
    setPages((prev) => [...prev, newPageObj]);

    setShowNewPageModal(false);
    setNewPageTitle("");
    setNewPageSlug("");

    // بارگذاری فوری صفحه جدید در ویرایشگر
    loadPage(cleanSlug, title);
    setToast("✓ صفحه جدید «" + title + "» ایجاد شد. اکنون می‌توانید چیدمان آن را تکمیل و Publish کنید.");
    setTimeout(() => setToast(null), 4000);
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : "/" + currentSlug;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ استودیو با منوی انتخاب صفحه و دکمه ساخت صفحه جدید */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">انتخاب صفحه:</span>
            <select
              value={currentSlug}
              onChange={(e) => loadPage(e.target.value)}
              className="p-2 px-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black outline-none cursor-pointer"
            >
              {pages.map((p) => (
                <option key={p.id || p.slug} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => { soundEngine.playClick(); setShowNewPageModal(true); }}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black shadow-md cursor-pointer transition flex items-center gap-1"
          >
            <span>➕</span>
            <span>ایجاد صفحه جدید</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده این صفحه</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      {/* مدال ساخت صفحه جدید */}
      {showNewPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn font-sans" dir="rtl">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 shadow-2xl text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm text-sky-500 flex items-center gap-2">
                <span>➕</span> ایجاد صفحه سفارشی جدید
              </h3>
              <button
                type="button"
                onClick={() => setShowNewPageModal(false)}
                className="w-7 h-7 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewPage} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">عنوان فارسی صفحه *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شرایط گارانتی و خدمات"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">آدرس انگلیسی / نامک (Slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: warranty-terms"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">آدرس نهایی صفحه: axoncore.ir/{newPageSlug.trim() || "slug"}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowNewPageModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--input-bg)] text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-md transition cursor-pointer"
                >
                  ایجاد و باز کردن در ویرایشگر ←
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* بوم Puck */}
      <div className="w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[880px]">
        {loading || !pageData ? (
          <div className="py-32 text-center text-xs font-bold text-slate-400">در حال آماده‌سازی صفحه...</div>
        ) : (
          <Puck
            key={renderKey}
            config={puckConfig}
            data={pageData}
            onPublish={handleSave}
          />
        )}
      </div>
    </div>
  );
}
