"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { BlockType, PageBlock, ModularPageDocument } from "@/lib/modularBuilderTypes";
import { supabase } from "@/lib/supabase";

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string; is_published: boolean }>>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [pageTitle, setPageTitle] = useState("صفحه اصلی (خانه)");
  const [pageSlug, setPageSlug] = useState("home");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);

  // استیت‌های اینسپکتور المان زنده
  const [selectedElementMeta, setSelectedElementMeta] = useState<any>(null);
  const [inspectorTab, setInspectorTab] = useState<"element_style" | "box_model" | "advanced_css">("element_style");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isWidgetsDrawerOpen, setIsWidgetsDrawerOpen] = useState(false);

  // متغیرهای استایل‌دهی المان کلیک‌شده
  const [elemColor, setElemColor] = useState("#ffffff");
  const [elemBgColor, setElemBgColor] = useState("#000000");
  const [elemFontSize, setElemFontSize] = useState(16);
  const [elemFontWeight, setElemFontWeight] = useState("400");
  const [elemRadius, setElemRadius] = useState(0);
  const [elemPaddingY, setElemPaddingY] = useState(0);
  const [elemPaddingX, setElemPaddingX] = useState(0);
  const [elemMarginY, setElemMarginY] = useState(0);
  const [elemCustomCss, setElemCustomCss] = useState("");

  const [iframeKey, setIframeKey] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fetchPagesList = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
        if (json.pages.length > 0 && !selectedPageId) {
          const home = json.pages.find((p: any) => p.slug === "home") || json.pages[0];
          loadPageDetails(home.slug);
        }
      }
    } catch {}
  };

  const loadPageDetails = async (slug: string) => {
    soundEngine.playClick();
    try {
      const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page) {
        const p: ModularPageDocument = json.page;
        setSelectedPageId(p.id);
        setPageTitle(p.title);
        setPageSlug(p.slug);
        setMetaDescription(p.meta_description || "");
        setIsPublished(p.is_published !== false);
        setBlocks(Array.isArray(p.blocks) ? p.blocks : []);
      }
    } catch {} finally {
      setIframeKey(Date.now());
      setSelectedElementMeta(null);
    }
  };

  useEffect(() => {
    fetchPagesList();

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "AXON_ELEMENT_SELECTED") {
        const meta = e.data.payload;
        setSelectedElementMeta(meta);
        setElemFontSize(meta.fontSize || 16);
        setElemFontWeight(String(meta.fontWeight || "400"));
        setElemRadius(meta.borderRadius || 0);
        setElemPaddingY(meta.paddingTop || 0);
        setElemPaddingX(meta.paddingLeft || 0);
        setElemMarginY(meta.marginTop || 0);
        setToastMessage({ type: "success", text: `المان «${meta.tagName}» انتخاب شد. تنظیمات زنده در سایدبار فعال است.` });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // ارسال تغییر استایل به فریم زنده
  const dispatchStyleChange = (key: string, value: string | number) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: "AXON_APPLY_STYLE",
        payload: { key, value }
      }, "*");
    }
  };

  // ارسال اکشن حذف یا جابجایی المان به فریم
  const dispatchElementAction = (action: "delete" | "moveUp" | "moveDown") => {
    soundEngine.playClick();
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: "AXON_ELEMENT_ACTION",
        action
      }, "*");
    }
  };

  const handleSavePage = async () => {
    if (!pageTitle.trim() || !pageSlug.trim()) {
      alert("عنوان و نامک آدرس صفحه الزامی است.");
      return;
    }

    soundEngine.playClick();
    setSaving(true);
    setToastMessage(null);

    const payload: Partial<ModularPageDocument> = {
      id: selectedPageId || undefined,
      title: pageTitle.trim(),
      slug: pageSlug.trim().toLowerCase(),
      meta_description: metaDescription.trim(),
      blocks,
      is_published: isPublished
    };

    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setToastMessage({ type: "success", text: "✓ تمامی تغییرات استایلی و محتوایی در دیتابیس ذخیره گردید." });
        fetchPagesList();
        if (!selectedPageId && json.page) setSelectedPageId(json.page.id);
      } else {
        setToastMessage({ type: "error", text: json.message || "خطا در ذخیره‌سازی." });
      }
    } catch {
      setToastMessage({ type: "error", text: "خطای ارتباط با سرور." });
    } finally {
      setSaving(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const targetLiveUrl = pageSlug === "home" ? "/" : `/${pageSlug}`;

  return (
    <div className="min-h-screen flex flex-col font-sans select-none text-[var(--text-primary)] space-y-4" dir="rtl">
      
      {/* نوار فرمان بالای استودیو */}
      <header className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md">
            🎨
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSlug}
              onChange={(e) => loadPageDetails(e.target.value)}
              className="p-2 px-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--accent-blue)]"
            >
              {pages.map((p) => {
                const isSys = ["home", "products", "news", "blog", "about", "contact", "track-order"].includes(p.slug);
                return (
                  <option key={p.id} value={p.slug}>
                    {isSys ? "⭐ [صفحه اصلی سایت] " : "📄 [لندینگ سفارشی] "} {p.title} (/{p.slug === "home" ? "" : p.slug})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* سوییچر دسکتاپ، تبلت و موبایل */}
        <div className="flex items-center gap-1.5 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--card-border)]">
          {[
            { id: "desktop" as const, icon: "🖥️", label: "دسکتاپ" },
            { id: "tablet" as const, icon: "📱", label: "تبلت" },
            { id: "mobile" as const, icon: "📲", label: "موبایل" },
          ].map((dev) => (
            <button
              key={dev.id}
              type="button"
              onClick={() => { soundEngine.playClick(); setPreviewDevice(dev.id); }}
              className={"px-3.5 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1.5 cursor-pointer " + (
                previewDevice === dev.id ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-slate-400"
              )}
            >
              <span>{dev.icon}</span>
              <span className="hidden md:inline">{dev.label}</span>
            </button>
          ))}
        </div>

        {/* دکمه‌های انتشار و مشاهده زنده */}
        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده در سایت</span>
            <span>🔗</span>
          </Link>

          <button
            type="button"
            onClick={handleSavePage}
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-xl transition cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال ذخیره..." : "💾 ذخیره و انتشار سراسری"}
          </button>
        </div>
      </header>

      {toastMessage && (
        <div className={"p-3.5 rounded-2xl text-xs font-bold transition animate-fadeIn " + (
          toastMessage.type === "success" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 border border-rose-500/30 text-rose-600"
        )}>
          {toastMessage.text}
        </div>
      )}

      {/* محیط کاربری دو پنله: اینسپکتور سبک المنتور پرو (راست) + بوم زنده (چپ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        
        {/* سایدبار راست: کنترلر استایل المان انتخاب‌شده */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
            
            {/* سربرگ المان انتخاب‌شده */}
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <div>
                <span className="font-black text-xs text-[var(--accent-blue)] block">
                  {selectedElementMeta ? `المان فعال: <${selectedElementMeta.tagName.toLowerCase()}>` : "روی هر المانی کلیک کنید"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {selectedElementMeta ? (selectedElementMeta.text || "بدون متن") : "برای ویرایش روی متن، تصویر یا دکمه در بوم کلیک کنید"}
                </span>
              </div>

              {selectedElementMeta && (
                <div className="flex gap-1">
                  <button onClick={() => dispatchElementAction("moveUp")} className="p-1 px-2 rounded-lg bg-[var(--input-bg)] text-xs cursor-pointer" title="انتقال به بالا">▲</button>
                  <button onClick={() => dispatchElementAction("moveDown")} className="p-1 px-2 rounded-lg bg-[var(--input-bg)] text-xs cursor-pointer" title="انتقال به پایین">▼</button>
                  <button onClick={() => dispatchElementAction("delete")} className="p-1 px-2 rounded-lg bg-rose-500/15 text-rose-500 text-xs cursor-pointer" title="حذف المان">🗑️</button>
                </div>
              )}
            </div>

            {selectedElementMeta ? (
              <>
                {/* تب‌های اینسپکتور */}
                <div className="flex gap-1 bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--card-border)]">
                  {[
                    { id: "element_style" as const, label: "ظاهر و رنگ" },
                    { id: "box_model" as const, label: "فواصل و ابعاد" },
                    { id: "advanced_css" as const, label: "کد CSS زنده" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInspectorTab(tab.id)}
                      className={"flex-1 py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer " + (
                        inspectorTab === tab.id ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-slate-400"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* تب ۱: ظاهر، رنگ، فونت و انحنا */}
                {inspectorTab === "element_style" && (
                  <div className="space-y-3.5 pt-1">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-400">رنگ متن:</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={elemColor}
                            onChange={(e) => {
                              setElemColor(e.target.value);
                              dispatchStyleChange("color", e.target.value);
                            }}
                            className="w-7 h-7 rounded-lg border-none cursor-pointer bg-transparent"
                          />
                          <span className="font-mono text-[10px] font-bold">{elemColor}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-400">رنگ پس‌زمینه:</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={elemBgColor}
                            onChange={(e) => {
                              setElemBgColor(e.target.value);
                              dispatchStyleChange("backgroundColor", e.target.value);
                            }}
                            className="w-7 h-7 rounded-lg border-none cursor-pointer bg-transparent"
                          />
                          <span className="font-mono text-[10px] font-bold">{elemBgColor}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400">اندازه فونت (Font Size):</label>
                        <span className="font-mono font-bold text-[var(--accent-blue)]">{elemFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="72"
                        value={elemFontSize}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setElemFontSize(val);
                          dispatchStyleChange("fontSize", `${val}px`);
                        }}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-slate-400">وزن فونت (Font Weight):</label>
                      <select
                        value={elemFontWeight}
                        onChange={(e) => {
                          setElemFontWeight(e.target.value);
                          dispatchStyleChange("fontWeight", e.target.value);
                        }}
                        className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                      >
                        <option value="300">نازک (Light - 300)</option>
                        <option value="400">معمولی (Regular - 400)</option>
                        <option value="600">نیمه‌پر (SemiBold - 600)</option>
                        <option value="800">خیلی ضخیم (ExtraBold - 800)</option>
                        <option value="900">سیاه توپر (Black - 900)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400">شعاع گوشه (Border Radius):</label>
                        <span className="font-mono font-bold text-[var(--accent-blue)]">{elemRadius}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        value={elemRadius}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setElemRadius(val);
                          dispatchStyleChange("borderRadius", `${val}px`);
                        }}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* تب ۲: فواصل و باکس‌مدل */}
                {inspectorTab === "box_model" && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400">فاصله درونی عمودی (Padding Y):</label>
                        <span className="font-mono font-bold text-[var(--accent-blue)]">{elemPaddingY}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={elemPaddingY}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setElemPaddingY(val);
                          dispatchStyleChange("paddingTop", `${val}px`);
                          dispatchStyleChange("paddingBottom", `${val}px`);
                        }}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400">فاصله درونی افقی (Padding X):</label>
                        <span className="font-mono font-bold text-[var(--accent-blue)]">{elemPaddingX}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={elemPaddingX}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setElemPaddingX(val);
                          dispatchStyleChange("paddingLeft", `${val}px`);
                          dispatchStyleChange("paddingRight", `${val}px`);
                        }}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400">فاصله بیرونی عمودی (Margin Y):</label>
                        <span className="font-mono font-bold text-[var(--accent-blue)]">{elemMarginY}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        value={elemMarginY}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setElemMarginY(val);
                          dispatchStyleChange("marginTop", `${val}px`);
                          dispatchStyleChange("marginBottom", `${val}px`);
                        }}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* تب ۳: کد CSS زنده */}
                {inspectorTab === "advanced_css" && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-[10px] font-bold text-slate-400">کد CSS اختصاصی المان:</label>
                    <textarea
                      rows={5}
                      value={elemCustomCss}
                      onChange={(e) => {
                        setElemCustomCss(e.target.value);
                        // اعمال قوانین دلخواه مثل box-shadow
                        if (e.target.value.includes("shadow")) {
                          dispatchStyleChange("boxShadow", "0 10px 30px rgba(56, 189, 248, 0.4)");
                        }
                      }}
                      placeholder="box-shadow: 0 10px 30px rgba(0,0,0,0.5);&#10;filter: drop-shadow(0 0 10px #0284c7);"
                      className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[11px] text-sky-400 outline-none"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="py-10 text-center text-slate-400 font-bold text-xs space-y-2">
                <span className="text-2xl block">👆</span>
                <p>در بوم سمت چپ روی هر تیتری، دکمه، عکسی یا کادری کلیک کنید تا تمام تنظیمات ظاهری، فونت و فواصل آن در این بخش فعال شود.</p>
              </div>
            )}
          </div>
        </div>

        {/* بوم زنده تعاملی پیش‌نمایش (دسکتاپ، تبلت، موبایل) */}
        <div className="lg:col-span-8 flex justify-center w-full">
          <div
            className={"transition-all duration-300 rounded-[2.5rem] bg-[var(--modal-bg)] border-2 border-[var(--card-border)] shadow-2xl overflow-hidden min-h-[750px] w-full flex flex-col " + (
              previewDevice === "mobile"
                ? "max-w-[390px] border-sky-500/50 shadow-sky-500/10"
                : previewDevice === "tablet"
                ? "max-w-[768px] border-indigo-500/50"
                : "max-w-full"
            )}
          >
            <div className="p-3.5 bg-[var(--input-bg)] border-b border-[var(--card-border)] flex justify-between items-center text-xs px-6">
              <span className="font-mono text-[10px] text-slate-400">
                بوم بصری تعاملی: <strong className="text-[var(--text-primary)]">{targetLiveUrl}</strong> ({previewDevice.toUpperCase()})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIframeKey(Date.now())}
                  className="px-2.5 py-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-[10px] font-bold hover:border-sky-500 transition cursor-pointer"
                >
                  🔄 تازه‌سازی فریم
                </button>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            <div className="flex-1 w-full bg-black relative flex items-center justify-center min-h-[700px]">
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={targetLiveUrl}
                title="Axon Elementor Visual Canvas"
                className="w-full h-full min-h-[700px] border-none shadow-inner"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
