"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import { siteInfoService } from "@/services/siteInfoService";
import Link from "next/link";

const BASE_INITIAL_DATA: Data = {
  content: [
    {
      type: "HeaderCapsuleBar",
      props: {
        id: "header-capsule-1",
        brandText: "Axon | آکسون",
        logoUrl: "",
        logoWidth: 36,
        logoHeight: 36,
        capsuleBg: "rgba(7, 9, 14, 0.9)",
        capsuleBorder: "rgba(255, 255, 255, 0.12)",
        paddingY: 10
      }
    },
    {
      type: "NativeHero3D",
      props: {
        id: "hero-1",
        topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        badgeColor: "#38bdf8",
        title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
        titleSize: 42,
        subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
        bgColor: "transparent",
        paddingTop: 40,
        paddingBottom: 20
      }
    },
    {
      type: "NativePerspectiveSlider",
      props: {
        id: "slider-1",
        sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
        sectionSubtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی",
        paddingY: 20
      }
    },
    {
      type: "NativeProductCatalog",
      props: {
        id: "catalog-1",
        heading: "کاتالوگ تجهیزات تخصصی و مانیتورها",
        subtitle: "تمامی کالاها با گارانتی اصالت طلایی و تست سلامت فیزیکی عرضه می‌شوند",
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
    {
      type: "GlobalFooterBlock",
      props: {
        id: "footer-1",
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
    }
  ],
  root: { props: { title: "صفحه اصلی" } }
};

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data>(BASE_INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const loadPage = async (slug: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();
    try {
      // ۱. ابتدا تنظیمات ذخیره‌شده مستقیم دیتابیس را می‌خوانیم
      const siteInfo = await siteInfoService.getSiteInfo();

      const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const json = await res.json();

      let targetData: Data = BASE_INITIAL_DATA;

      if (json.success && json.page && json.page.puck_data && Array.isArray(json.page.puck_data.content) && json.page.puck_data.content.length > 0) {
        targetData = json.page.puck_data;
      }

      // تضمین بازگردانی ابعاد لوگو حتی اگر Puck ناقص ذخیره کرده باشد
      const headerIndex = targetData.content.findIndex((b: any) => b.type === "HeaderCapsuleBar");
      if (headerIndex !== -1 && siteInfo?.homepage_layout_config?.headerLogoConfig) {
        const savedLogo = siteInfo.homepage_layout_config.headerLogoConfig;
        targetData.content[headerIndex].props = {
          ...targetData.content[headerIndex].props,
          logoWidth: savedLogo.width || targetData.content[headerIndex].props.logoWidth || 36,
          logoHeight: savedLogo.height || targetData.content[headerIndex].props.logoHeight || 36,
          logoUrl: savedLogo.url || targetData.content[headerIndex].props.logoUrl || "",
        };
      }

      setPageData(targetData);
    } catch {
      setPageData(BASE_INITIAL_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار تغییرات روی سایت...");

    try {
      // استخراج تنظیمات لوگوی هدر
      const headerBlock = data.content?.find((b: any) => b.type === "HeaderCapsuleBar");
      const logoW = Number(headerBlock?.props?.logoWidth) || 36;
      const logoH = Number(headerBlock?.props?.logoHeight) || 36;
      const logoU = headerBlock?.props?.logoUrl || "";

      // ذخیره دائمی در site_info جهت حفظ ۱۰۰٪ پس از رفرش
      const currentInfo = await siteInfoService.getSiteInfo();
      await siteInfoService.updateSiteInfo({
        homepage_layout_config: {
          ...(currentInfo?.homepage_layout_config || {}),
          headerLogoConfig: {
            width: logoW,
            height: logoH,
            url: logoU
          }
        }
      });

      // ذخیره درخت ساختار Puck در modular_pages
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: currentSlug === "home" ? "صفحه اصلی" : currentSlug,
          puck_data: data,
          is_published: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setToast("✓ ابعاد لوگو و تنظیمات صفحه با موفقیت ذخیره دائم شد.");

        // برودکست وب‌سوکت بلادرنگ به تمام تب‌ها
        try {
          supabase.channel("realtime-header-puck-sync").send({
            type: "broadcast",
            event: "header_updated",
            payload: {
              ...(headerBlock?.props || {}),
              logoWidth: logoW,
              logoHeight: logoH
            }
          });
        } catch {}

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("puck_published"));
        }
      } else {
        setToast("خطا در ذخیره‌سازی.");
      }
    } catch {
      setToast("خطا در برقراری ارتباط با سرور.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : `/${currentSlug}`;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
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
                <option key={p.id} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده در سایت</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      <div className="w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[880px]">
        {loading ? (
          <div className="py-32 text-center text-xs font-bold text-slate-400">در حال آماده‌سازی بوم بصری و فراخوانی ابعاد ذخیره‌شده...</div>
        ) : (
          <Puck
            config={puckConfig}
            data={pageData}
            onPublish={handleSave}
          />
        )}
      </div>
    </div>
  );
}
