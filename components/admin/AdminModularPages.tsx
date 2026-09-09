"use client";

import React, { useState, useEffect } from "react";
import { Puck, Render, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { siteInfoService } from "@/services/siteInfoService";

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [activeTab, setActiveTab] = useState<"page_canvas" | "header_footer_editor">("page_canvas");
  const [pageData, setPageData] = useState<Data>({ content: [], root: { props: { title: "صفحه" } } });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "split" | "live_site">("split");
  const [viewportWidth, setViewportWidth] = useState<"100%" | "768px" | "390px">("100%");
  const [toast, setToast] = useState<string | null>(null);

  // استیت‌های ویرایش هدر و فوتر زنده
  const [brandName, setBrandName] = useState("Axon | آکسون");
  const [phone, setPhone] = useState("09376110200");
  const [email, setEmail] = useState("Pouriarahimi@yahoo.com");
  const [address, setAddress] = useState("شیراز - ستارخان");
  const [workingHours, setWorkingHours] = useState("شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰");
  const [bioText, setBioText] = useState("مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.");

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const loadHeaderFooterData = async () => {
    const info = await siteInfoService.getSiteInfo();
    if (info) {
      setBrandName(info.site_name || info.siteName || "Axon | آکسون");
      setPhone(info.phone || "09376110200");
      setEmail(info.email || "Pouriarahimi@yahoo.com");
      setAddress(info.address || "شیراز - ستارخان");
      setWorkingHours(info.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰");
      setBioText(info.description || info.footer_text || "");
    }
  };

  const loadPage = async (slug: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();
    try {
      const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page && json.page.puck_data && json.page.puck_data.content?.length > 0) {
        setPageData(json.page.puck_data);
      } else {
        setPageData({
          content: [
            { type: "NativeHero3D", props: { id: "hero-1", topBadge: "🚀 مانیتورهای ۵K", bgColor: "transparent" } },
            { type: "NativePerspectiveSlider", props: { id: "slider-1", paddingY: 20 } },
            { type: "NativeProductCatalog", props: { id: "catalog-1", heading: "کاتالوگ تجهیزات" } },
            { type: "NativeExplodedView", props: { id: "exploded-1", productTitle: "Apple Studio Display 5K Retina" } }
          ],
          root: { props: { title: slug } }
        });
      }
    } catch {
      setPageData({ content: [], root: { props: { title: slug } } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
    loadHeaderFooterData();
  }, []);

  const handleSavePage = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار تغییرات روی سایت...");
    try {
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
        setToast("✓ تمامی بلوک‌های بدنه ذخیره و منتشر شد.");
      }
    } catch {
      setToast("خطا در برقراری ارتباط با سرور.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleSaveHeaderFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setToast("در حال ذخیره و انتشار سراسری هدر و فوتر...");
    try {
      await siteInfoService.updateSiteInfo({
        site_name: brandName,
        phone,
        email,
        address,
        working_hours: workingHours,
        description: bioText,
        footer_text: bioText,
      });
      soundEngine.playSuccess();
      setToast("✓ هدر کپسولی و فوتر ۴ ستونه در تمام صفحات سایت به‌روزرسانی شد!");
    } catch {
      setToast("خطا در ذخیره‌سازی اطلاعات هدر و فوتر.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : `/${currentSlug}`;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ هوشمند با سوییچ حالت ادیتور */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { soundEngine.playClick(); setActiveTab("page_canvas"); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === "page_canvas" ? "bg-sky-500 text-white shadow-md" : "bg-[var(--input-bg)] text-slate-400"
              }`}
            >
              🧱 ویرایش بدنه صفحات
            </button>

            <button
              type="button"
              onClick={() => { soundEngine.playClick(); setActiveTab("header_footer_editor"); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === "header_footer_editor" ? "bg-sky-500 text-white shadow-md" : "bg-[var(--input-bg)] text-slate-400"
              }`}
            >
              🧭 ویرایش هدر کپسولی و فوتر ۴ ستونه
            </button>
          </div>
        </div>

        {activeTab === "page_canvas" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">انتخاب صفحه:</span>
            <select
              value={currentSlug}
              onChange={(e) => loadPage(e.target.value)}
              className="p-2 px-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black outline-none cursor-pointer"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      {/* ۱. محیط ویرایشگر هدر و فوتر به همراه پیش‌نمایش کاملاً زنده */}
      {activeTab === "header_footer_editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* فرم ویرایش تک‌تک بخش‌های هدر و فوتر */}
          <form onSubmit={handleSaveHeaderFooter} className="lg:col-span-5 p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 text-xs shadow-xl">
            <h3 className="font-black text-sm text-sky-500 border-b border-[var(--card-border)] pb-3">
              ✏️ کنترل اختصاصی مشخصات هدر و فوتر
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">نام برند (لوگو هدر و فوتر):</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">تلفن پشتیبانی فوتر:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">ایمیل پشتیبانی:</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">نشانی تحویل حضوری و انبار:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">ساعات پاسخگویی:</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">متن معرفی و گارانتی استودیو در فوتر:</label>
                <textarea
                  rows={3}
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-medium text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs transition shadow-xl cursor-pointer"
              >
                💾 ذخیره و انتشار در سراسر سایت
              </button>
            </div>
          </form>

          {/* پیش‌نمایش ۱۰۰٪ واقعی هدر و فوتر در بوم */}
          <div className="lg:col-span-7 rounded-3xl border border-[var(--card-border)] bg-[var(--modal-bg)] p-4 shadow-2xl space-y-6">
            <span className="text-xs font-black text-emerald-500 block px-2">
              👁️ پیش‌نمایش رندر واقعی و زنده هدر و فوتر سایت:
            </span>
            <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/40 p-2 space-y-8">
              <Header />
              <div className="py-12 text-center text-slate-500 font-bold text-xs border-y border-white/5">
                (محتوا و بدنه صفحات سایت در این میان رندر می‌شود)
              </div>
              <Footer />
            </div>
          </div>
        </div>
      )}

      {/* ۲. محیط ویرایشگر بدنه صفحات Puck */}
      {activeTab === "page_canvas" && (
        <div className="flex-1 w-full min-h-[750px] flex gap-4 items-start">
          <div className="w-1/2 rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px]">
            <div className="p-2.5 bg-black/40 border-b border-white/10 px-4 text-xs font-bold text-sky-400 flex items-center gap-2">
              <span>🛠️ چیدمان بلوک‌های بدنه صفحه</span>
            </div>
            <Puck
              config={puckConfig}
              data={pageData}
              onChange={(newData) => setPageData(newData)}
              onPublish={handleSavePage}
            />
          </div>

          <div className="w-1/2 rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px] flex flex-col">
            <div className="p-2.5 bg-black/40 border-b border-white/10 px-4 text-xs font-bold text-emerald-400 flex justify-between items-center">
              <span>پیش‌نمایش کامل صفحه با هدر و فوتر واقعی</span>
              <span className="text-[10px] font-mono text-slate-400">{targetLiveUrl}</span>
            </div>

            <div className="flex-1 w-full bg-[#07090e] overflow-y-auto p-2">
              <Header />
              <div className="py-4">
                <Render config={puckConfig} data={pageData} />
              </div>
              <Footer />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
