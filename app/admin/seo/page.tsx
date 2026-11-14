// File Path: app/admin/seo/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import AdminAiSeoAutopilot from "@/components/admin/AdminAiSeoAutopilot";

interface SeoItem {
  id: string;
  type: "product" | "post" | "news" | "page";
  title: string;
  raw_title?: string;
  meta_title: string;
  meta_description: string;
  focus_keyword?: string;
  has_image?: boolean;
  has_missing_alt?: boolean;
  url?: string;
  score?: number;
  category?: string;
  price?: number;
}

interface SeoIssue {
  id: string;
  type: "product" | "post" | "news" | "page";
  title: string;
  severity: "high" | "medium" | "low";
  message: string;
  meta_title: string;
  meta_description: string;
  focus_keyword?: string;
  url?: string;
  item_score?: number;
}

interface RedirectRule {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302;
}

interface TechnicalSeoConfig {
  allowGoogleIndex: boolean;
  googleSiteVerification: string;
  canonicalBaseUrl: string;
  defaultTitleSuffix: string;
  defaultKeywords: string;
  enableProductSchema: boolean;
  enableOrganizationSchema: boolean;
  enableFaqSchema: boolean;
  torobBotAllowed: boolean;
  redirectRules: RedirectRule[];
}

const DEFAULT_TECH_CONFIG: TechnicalSeoConfig = {
  allowGoogleIndex: true,
  googleSiteVerification: "",
  canonicalBaseUrl: "https://axoncore.ir",
  defaultTitleSuffix: " | آکسون کور",
  defaultKeywords:
    "آکسون کور, خرید کالای دیجیتال, گجت هوشمند, تجهیزات تکنولوژی, قیمت لوازم جانبی اپل, سخت افزار",
  enableProductSchema: true,
  enableOrganizationSchema: true,
  enableFaqSchema: true,
  torobBotAllowed: true,
  redirectRules: [],
};

export default function AdminSeoPage() {
  const [activeTab, setActiveTab] = useState<
    "audit" | "meta_editor" | "technical_seo" | "autopilot"
  >("audit");
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number>(92);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalPosts: 0,
    totalNews: 0,
    totalPages: 0,
    totalSitemapUrls: 6,
    healthyCount: 0,
    issuesCount: 0,
  });
  const [issues, setIssues] = useState<SeoIssue[]>([]);
  const [items, setItems] = useState<SeoItem[]>([]);

  // فیلترهای تب رادار و ویرایشگر
  const [severityFilter, setSeverityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "product" | "post" | "news" | "page">(
    "all"
  );
  const [search, setSearch] = useState("");

  // استیت‌های مودال ویرایش متاتگ
  const [editingItem, setEditingItem] = useState<SeoItem | null>(null);
  const [metaTitleInput, setMetaTitleInput] = useState("");
  const [metaDescInput, setMetaDescInput] = useState("");
  const [focusKeywordInput, setFocusKeywordInput] = useState("");
  const [serpPreviewMode, setSerpPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [generatingSingleMeta, setGeneratingSingleMeta] = useState(false);

  // استیت‌های تب سئو تکنیکال و ریدایرکت ۳۰۱
  const [techConfig, setTechConfig] = useState<TechnicalSeoConfig>(DEFAULT_TECH_CONFIG);
  const [newFromPath, setNewFromPath] = useState("");
  const [newToPath, setNewToPath] = useState("");
  const [newRedirectCode, setNewRedirectCode] = useState<301 | 302>(301);

  const [saving, setSaving] = useState(false);
  const [autoFixingAll, setAutoFixingAll] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchSeoAudit = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/seo-audit?t=" + Date.now(), { cache: "no-store" });
      const json = await res.json();
      if (json && json.success) {
        setScore(Number(json.score ?? 92));
        setSummary(
          json.summary || {
            totalProducts: 0,
            totalPosts: 0,
            totalNews: 0,
            totalPages: 0,
            totalSitemapUrls: 6,
            healthyCount: 0,
            issuesCount: 0,
          }
        );
        if (json.technicalConfig) {
          setTechConfig({ ...DEFAULT_TECH_CONFIG, ...json.technicalConfig });
        }
        setIssues(Array.isArray(json.issues) ? json.issues : []);
        setItems(Array.isArray(json.items) ? json.items : []);
      }
    } catch (e) {
      console.error("SEO Audit fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeoAudit();

    const chProducts = supabase
      .channel("realtime-admin-seo-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchSeoAudit();
      })
      .subscribe();

    const chPosts = supabase
      .channel("realtime-admin-seo-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        fetchSeoAudit();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chProducts);
      supabase.removeChannel(chPosts);
    };
  }, [fetchSeoAudit]);

  const handleAutoFixAllSeo = async () => {
    soundEngine.playClick();
    setAutoFixingAll(true);
    try {
      const res = await fetch("/api/admin/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auto_fix_all_seo" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        await fetchSeoAudit();
      }
    } finally {
      setAutoFixingAll(false);
    }
  };

  const handleOpenMetaEditor = (item: {
    id: string;
    type: "product" | "post" | "news" | "page";
    title: string;
    raw_title?: string;
    meta_title: string;
    meta_description: string;
    focus_keyword?: string;
    url?: string;
    category?: string;
    price?: number;
  }) => {
    soundEngine.playClick();
    setEditingItem(item);
    setMetaTitleInput(item.meta_title || item.raw_title || item.title || "");
    setMetaDescInput(item.meta_description || "");
    setFocusKeywordInput(
      item.focus_keyword ||
        "خرید " + String(item.raw_title || item.title || "").replace(/^[📦📚📡📄]\s*/, "")
    );
  };

  const handleGenerateSmartSingleMeta = async () => {
    if (!editingItem) return;
    soundEngine.playClick();
    setGeneratingSingleMeta(true);
    try {
      const res = await fetch("/api/admin/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_smart_meta_single",
          type: editingItem.type,
          title: editingItem.raw_title || editingItem.title,
          category: editingItem.category || "",
          price: editingItem.price || 0,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setMetaTitleInput(json.meta_title || "");
        setMetaDescInput(json.meta_description || "");
        if (json.focus_keyword) setFocusKeywordInput(json.focus_keyword);
      }
    } finally {
      setGeneratingSingleMeta(false);
    }
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    soundEngine.playClick();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          type: editingItem.type,
          meta_title: metaTitleInput.trim(),
          meta_description: metaDescInput.trim(),
          focus_keyword: focusKeywordInput.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message || "متاتگ‌های سئو با موفقیت بروزرسانی شدند.");
        setEditingItem(null);
        await fetchSeoAudit();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddRedirectRule = () => {
    if (!newFromPath.trim() || !newToPath.trim()) return;
    soundEngine.playClick();
    const cleanFrom = newFromPath.trim().startsWith("/")
      ? newFromPath.trim()
      : "/" + newFromPath.trim();
    const cleanTo =
      newToPath.trim().startsWith("/") || newToPath.trim().startsWith("http")
        ? newToPath.trim()
        : "/" + newToPath.trim();

    setTechConfig((prev) => ({
      ...prev,
      redirectRules: [
        ...(prev.redirectRules || []),
        {
          id: "red_" + Date.now(),
          fromPath: cleanFrom,
          toPath: cleanTo,
          statusCode: newRedirectCode,
        },
      ],
    }));
    setNewFromPath("");
    setNewToPath("");
  };

  const handleSaveTechnicalSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_technical_seo",
          technicalConfig: techConfig,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        await fetchSeoAudit();
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredIssues = issues.filter((iss) => {
    if (severityFilter !== "all" && iss.severity !== severityFilter) return false;
    if (typeFilter !== "all" && iss.type !== typeFilter) return false;
    return true;
  });

  const filteredItems = items.filter((i) => {
    if (typeFilter !== "all" && i.type !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (i.title || "").toLowerCase().includes(q) ||
      (i.meta_title || "").toLowerCase().includes(q) ||
      (i.url || "").toLowerCase().includes(q)
    );
  });

  const titleLen = metaTitleInput.trim().length;
  const descLen = metaDescInput.trim().length;

  const sampleJsonLdSchema = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "ElectronicsStore",
      name: "آکسون کور | Axon Core",
      url: techConfig.canonicalBaseUrl || "https://axoncore.ir",
      telephone: "09376110200",
      address: {
        "@type": "PostalAddress",
        addressLocality: "شیراز",
        addressCountry: "IR",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${techConfig.canonicalBaseUrl || "https://axoncore.ir"}/products?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    null,
    2
  );

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🚀</span> مرکز فرماندهی سئو، متاتگ‌ها و ایندکس گوگل (SEO Suite)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            اسکن بلادرنگ سلامت سئو تکنیکال، ویرایشگر متاتگ‌ها، مدیریت اسکیما و نقشه سایت و اتوپایلوت تولید محتوا
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("audit");
            }}
            className={
              "px-3.5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer " +
              (activeTab === "audit"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            🔍 رادار سلامت ({issues.length})
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("meta_editor");
            }}
            className={
              "px-3.5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer " +
              (activeTab === "meta_editor"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            🏷️ ویرایشگر متاتگ‌ها ({items.length})
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("technical_seo");
            }}
            className={
              "px-3.5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer " +
              (activeTab === "technical_seo"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            🌐 ایندکس و اسکیما
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("autopilot");
            }}
            className={
              "px-3.5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer " +
              (activeTab === "autopilot"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            🤖 اتوپایلوت سئو AI
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold animate-fadeIn">
          {feedback}
        </div>
      )}

      {/* کارت‌های KPI سئو */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">امتیاز سلامت سئو سایت:</span>
          <span
            className={
              "text-2xl font-black font-mono block " +
              (score >= 90
                ? "text-emerald-500"
                : score >= 75
                ? "text-sky-400"
                : "text-amber-500")
            }
          >
            {score}%
          </span>
          <span className="text-[10px] text-slate-400">
            {summary.healthyCount} صفحه ۱۰۰٪ استاندارد از {items.length} صفحه
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">لینک‌های فعال در نقشه سایت:</span>
          <span className="text-2xl font-black font-mono text-[var(--accent-blue)] block">
            {summary.totalSitemapUrls}
          </span>
          <span className="text-[10px] text-slate-400">
            شامل {summary.totalProducts} کالا در sitemap.xml
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">مقالات و اخبار سئو:</span>
          <span className="text-2xl font-black font-mono text-indigo-400 block">
            {summary.totalPosts + (summary.totalNews || 0)}
          </span>
          <span className="text-[10px] text-slate-400">
            {summary.totalPosts} مقاله وبلاگ + {summary.totalNews || 0} خبر فناوری
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">موارد نیازمند بهینه‌سازی:</span>
          <span
            className={
              "text-2xl font-black font-mono block " +
              (summary.issuesCount === 0 ? "text-emerald-500" : "text-amber-500")
            }
          >
            {summary.issuesCount}
          </span>
          <span className="text-[10px] text-slate-400">قابل اصلاح فوری با یک کلیک</span>
        </div>
      </div>

      {/* تب ۱: رادار سلامت سئو */}
      {activeTab === "audit" && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
            <div>
              <h2 className="text-sm font-black">لیست هشدارهای سئو، نقص متاتگ‌ها و تگ‌های Alt</h2>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                بررسی زنده طول عناوین، کلمات کلیدی تجاری، توضیحات متا و تصاویر OpenGraph
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={autoFixingAll}
                onClick={handleAutoFixAllSeo}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg cursor-pointer transition disabled:opacity-50"
              >
                {autoFixingAll
                  ? "در حال بهینه‌سازی..."
                  : "⚡ بهینه‌سازی خودکار ۱-کلیکی تمام متاتگ‌ها و Alt تصاویر"}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  fetchSeoAudit();
                }}
                className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer"
              >
                🔄 اسکن مجدد
              </button>
            </div>
          </div>

          {/* فیلترهای رادار سئو */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[var(--text-secondary)] font-bold ml-1">فیلتر اولویت:</span>
              {[
                { id: "all", label: "همه موارد" },
                { id: "high", label: "🔴 اولویت بالا" },
                { id: "medium", label: "🟠 متوسط" },
                { id: "low", label: "🟡 بهینه‌سازی جزئی" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeverityFilter(s.id as any)}
                  className={
                    "px-3 py-1.5 rounded-xl font-bold cursor-pointer transition " +
                    (severityFilter === s.id
                      ? "bg-[var(--accent-blue)] text-white"
                      : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "همه بخش‌ها" },
                { id: "product", label: "📦 کالاها" },
                { id: "post", label: "📚 مقالات" },
                { id: "news", label: "📡 اخبار" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id as any)}
                  className={
                    "px-3 py-1.5 rounded-xl font-bold cursor-pointer transition " +
                    (typeFilter === t.id
                      ? "bg-indigo-600 text-white"
                      : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-bold">
              در حال اسکن متاتگ‌ها و ساختار سئو...
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="py-12 text-center text-xs text-emerald-500 font-black">
              🎉 فوق‌العاده! تمامی محصولات، مقالات و صفحات در این بخش دارای متاتگ‌های استاندارد سئو هستند.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredIssues.map((iss, idx) => (
                <div
                  key={iss.id + "-" + idx}
                  className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          "px-2 py-0.5 rounded-md text-[10px] font-bold " +
                          (iss.severity === "high"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : iss.severity === "medium"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-sky-500/15 text-sky-400 border border-sky-500/30")
                        }
                      >
                        {iss.severity === "high"
                          ? "اولویت بالا"
                          : iss.severity === "medium"
                          ? "متوسط"
                          : "جزئی"}
                      </span>
                      <h4 className="text-xs font-black truncate">{iss.title}</h4>
                      {iss.item_score !== undefined && (
                        <span className="text-[10px] font-mono text-slate-400">
                          (امتیاز فعلی: {iss.item_score}%)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">{iss.message}</p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    {iss.url && (
                      <Link
                        href={iss.url}
                        target="_blank"
                        className="px-3 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition"
                      >
                        🔗
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenMetaEditor(iss)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition cursor-pointer"
                    >
                      ✏️ اصلاح فوری متاتگ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* تب ۲: ویرایشگر پیشرفته متاتگ‌ها */}
      {activeTab === "meta_editor" && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-[var(--card-border)] pb-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: "all", label: `همه (${items.length})` },
                {
                  id: "product",
                  label: `📦 کالاها (${items.filter((x) => x.type === "product").length})`,
                },
                {
                  id: "post",
                  label: `📚 مقالات (${items.filter((x) => x.type === "post").length})`,
                },
                {
                  id: "news",
                  label: `📡 اخبار (${items.filter((x) => x.type === "news").length})`,
                },
                {
                  id: "page",
                  label: `📄 صفحات (${items.filter((x) => x.type === "page").length})`,
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id as any)}
                  className={
                    "px-3 py-2 rounded-xl font-black cursor-pointer transition " +
                    (typeFilter === t.id
                      ? "bg-[var(--accent-blue)] text-white shadow"
                      : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="🔍 جستجوی نام کالا، مقاله یا آدرس URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-80 p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const itemScore = item.score ?? 100;
              return (
                <div
                  key={item.type + "_" + item.id}
                  className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 max-w-2xl min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-[var(--accent-blue)] truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400" dir="ltr">
                        {item.url}
                      </span>
                      <span
                        className={
                          "px-2 py-0.5 rounded-md font-mono text-[10px] font-black " +
                          (itemScore >= 90
                            ? "bg-emerald-500/15 text-emerald-400"
                            : itemScore >= 70
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-rose-500/15 text-rose-400")
                        }
                      >
                        سئو: {itemScore}%
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">
                      <strong>Meta Title ({item.meta_title?.length || 0}):</strong>{" "}
                      {item.meta_title || "---"}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      <strong>Meta Desc ({item.meta_description?.length || 0}):</strong>{" "}
                      {item.meta_description || "ثبت نشده"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    {item.url && (
                      <Link
                        href={item.url}
                        target="_blank"
                        className="px-3 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition"
                        title="مشاهده صفحه در سایت"
                      >
                        🔗
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenMetaEditor(item)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer"
                    >
                      ✏️ ویرایش سئو و SERP
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* تب ۳: ایندکس گوگل، اسکیما (JSON-LD) و ریدایرکت ۳۰۱ */}
      {activeTab === "technical_seo" && (
        <form onSubmit={handleSaveTechnicalSeo} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
                <h2 className="font-black text-sm text-[var(--accent-blue)]">
                  🌐 تنظیمات ایندکس گوگل، سرچ کنسول و اسکیمای JSON-LD
                </h2>
                <div className="flex gap-2">
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-sky-500 font-mono text-[11px] font-bold"
                  >
                    📄 /sitemap.xml
                  </a>
                  <a
                    href="/robots.txt"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-sky-500 font-mono text-[11px] font-bold"
                  >
                    🤖 /robots.txt
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-4">
                <div>
                  <span className="font-black text-sm block text-emerald-400">
                    مجوز خزش و ایندکس کل سایت در موتور جستجوی گوگل (Googlebot Indexing)
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    در صورت غیرفعال کردن، تگ noindex فعال شده و ربات‌های گوگل از ایندکس صفحات منع می‌شوند
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={techConfig.allowGoogleIndex}
                  onChange={(e) =>
                    setTechConfig((prev) => ({ ...prev, allowGoogleIndex: e.target.checked }))
                  }
                  className="w-5 h-5 accent-emerald-500 cursor-pointer shrink-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    دامنه اصلی استاندارد (Canonical Base URL):
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={techConfig.canonicalBaseUrl}
                    onChange={(e) =>
                      setTechConfig((prev) => ({ ...prev, canonicalBaseUrl: e.target.value }))
                    }
                    placeholder="https://axoncore.ir"
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    کد تایید گوگل سرچ کنسول (Google Verification):
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={techConfig.googleSiteVerification}
                    onChange={(e) =>
                      setTechConfig((prev) => ({
                        ...prev,
                        googleSiteVerification: e.target.value,
                      }))
                    }
                    placeholder="google-site-verification code..."
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    کلمات کلیدی مادر فروشگاه (Global Meta Keywords):
                  </label>
                  <input
                    type="text"
                    value={techConfig.defaultKeywords}
                    onChange={(e) =>
                      setTechConfig((prev) => ({ ...prev, defaultKeywords: e.target.value }))
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                <span className="font-black text-[var(--accent-blue)] block">
                  🧬 داده‌های ساختاریافته و اسکیمای گوگل (Rich Snippets & JSON-LD):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between cursor-pointer font-bold">
                    <span>📦 اسکیمای قیمت و موجودی کالا (Product)</span>
                    <input
                      type="checkbox"
                      checked={techConfig.enableProductSchema}
                      onChange={(e) =>
                        setTechConfig((prev) => ({
                          ...prev,
                          enableProductSchema: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-sky-500"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between cursor-pointer font-bold">
                    <span>🏢 اسکیمای سازمان و گراف دانش (Organization)</span>
                    <input
                      type="checkbox"
                      checked={techConfig.enableOrganizationSchema}
                      onChange={(e) =>
                        setTechConfig((prev) => ({
                          ...prev,
                          enableOrganizationSchema: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-sky-500"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between cursor-pointer font-bold">
                    <span>❓ اسکیمای سوالات متداول (FAQPage)</span>
                    <input
                      type="checkbox"
                      checked={techConfig.enableFaqSchema}
                      onChange={(e) =>
                        setTechConfig((prev) => ({
                          ...prev,
                          enableFaqSchema: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-sky-500"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between cursor-pointer font-bold">
                    <span>🛍️ مجوز خزش ربات ترب در /api/torob</span>
                    <input
                      type="checkbox"
                      checked={techConfig.torobBotAllowed}
                      onChange={(e) =>
                        setTechConfig((prev) => ({
                          ...prev,
                          torobBotAllowed: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-emerald-500"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-xl cursor-pointer hover:opacity-90 transition disabled:opacity-50"
              >
                {saving
                  ? "در حال ذخیره تنظیمات سئو تکنیکال..."
                  : "💾 ذخیره و اعمال تنظیمات ایندکس، اسکیما و ریدایرکت‌ها"}
              </button>
            </div>

            {/* ستون چپ: مدیریت ریدایرکت‌های ۳۰۱ و پیش‌نمایش JSON-LD */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
                <h3 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-2.5">
                  🔀 مدیریت ریدایرکت‌های سئو (301 / 302 Redirects)
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  برای جلوگیری از خطای 404 در گوگل سرچ کنسول، آدرس‌های قدیمی را به آدرس جدید منتقل کنید:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={newFromPath}
                    onChange={(e) => setNewFromPath(e.target.value)}
                    placeholder="/old-url"
                    className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={newToPath}
                    onChange={(e) => setNewToPath(e.target.value)}
                    placeholder="/products/new-item"
                    className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={newRedirectCode}
                    onChange={(e) => setNewRedirectCode(Number(e.target.value) as 301 | 302)}
                    className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                  >
                    <option value={301}>301 (انتقال دائمی سئو)</option>
                    <option value={302}>302 (انتقال موقت)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddRedirectRule}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer transition"
                  >
                    + افزودن ریدایرکت
                  </button>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {(techConfig.redirectRules || []).length === 0 ? (
                    <div className="py-4 text-center text-slate-400 font-bold">
                      هنوز قانون ریدایرکتی ثبت نشده است.
                    </div>
                  ) : (
                    techConfig.redirectRules.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2 font-mono text-[11px]"
                        dir="ltr"
                      >
                        <span className="truncate">
                          <strong className="text-sky-400">[{r.statusCode}]</strong> {r.fromPath} ➔{" "}
                          {r.toPath}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setTechConfig((prev) => ({
                              ...prev,
                              redirectRules: prev.redirectRules.filter((x) => x.id !== r.id),
                            }))
                          }
                          className="text-rose-400 font-bold px-2 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-2.5">
                <span className="font-black text-xs text-emerald-400 block">
                  📋 ساختار اسکیمای JSON-LD فعال سایت برای ربات گوگل:
                </span>
                <pre
                  dir="ltr"
                  className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[10px] text-sky-300 overflow-x-auto leading-relaxed"
                >
                  {sampleJsonLdSchema}
                </pre>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* تب ۴: اتوپایلوت سئو AI */}
      {activeTab === "autopilot" && <AdminAiSeoAutopilot />}

      {/* مودال پیشرفته ویرایش متاتگ و پیش‌نمایش زنده SERP گوگل */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingItem(null);
          }}
        >
          <div className="w-full max-w-xl rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--accent-blue)] truncate max-w-sm">
                🏷️ مهندسی متاتگ سئو: {editingItem.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={generatingSingleMeta}
                  onClick={handleGenerateSmartSingleMeta}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[11px] shadow cursor-pointer hover:opacity-95 transition"
                >
                  {generatingSingleMeta
                    ? "در حال تولید..."
                    : "✨ پیشنهاد هوشمند متاتگ رنک ۱"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveMeta} className="space-y-4">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  کلمه کلیدی کانونی (Focus Keyword):
                </label>
                <input
                  type="text"
                  value={focusKeywordInput}
                  onChange={(e) => setFocusKeywordInput(e.target.value)}
                  placeholder="مثال: خرید آیفون ۱۶ پرو مکس"
                  className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-bold text-[var(--text-secondary)]">
                    عنوان سئو در نتایج گوگل (Meta Title):
                  </label>
                  <span
                    className={
                      "font-mono text-[10px] font-bold " +
                      (titleLen >= 30 && titleLen <= 65
                        ? "text-emerald-400"
                        : titleLen > 65
                        ? "text-rose-400"
                        : "text-amber-400")
                    }
                  >
                    {titleLen} / 60 کاراکتر (استاندارد: ۳۰ تا ۶۰)
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={metaTitleInput}
                  onChange={(e) => setMetaTitleInput(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                />
                <div className="w-full h-1.5 rounded-full bg-[var(--input-bg)] overflow-hidden">
                  <div
                    className={
                      "h-full transition-all " +
                      (titleLen >= 30 && titleLen <= 65
                        ? "bg-emerald-500"
                        : titleLen > 65
                        ? "bg-rose-500"
                        : "bg-amber-500")
                    }
                    style={{ width: Math.min(100, Math.round((titleLen / 65) * 100)) + "%" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-bold text-[var(--text-secondary)]">
                    توضیحات متا (Meta Description):
                  </label>
                  <span
                    className={
                      "font-mono text-[10px] font-bold " +
                      (descLen >= 90 && descLen <= 165
                        ? "text-emerald-400"
                        : descLen > 165
                        ? "text-rose-400"
                        : "text-amber-400")
                    }
                  >
                    {descLen} / 160 کاراکتر (استاندارد: ۱۰۰ تا ۱۶۰)
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={metaDescInput}
                  onChange={(e) => setMetaDescInput(e.target.value)}
                  placeholder="توضیحات جذاب شامل کلمات کلیدی اصلی، گارانتی و مزایا جهت افزایش نرخ کلیک (CTR) در گوگل..."
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed outline-none focus:border-[var(--accent-blue)]"
                />
                <div className="w-full h-1.5 rounded-full bg-[var(--input-bg)] overflow-hidden">
                  <div
                    className={
                      "h-full transition-all " +
                      (descLen >= 90 && descLen <= 165
                        ? "bg-emerald-500"
                        : descLen > 165
                        ? "bg-rose-500"
                        : "bg-amber-500")
                    }
                    style={{ width: Math.min(100, Math.round((descLen / 160) * 100)) + "%" }}
                  />
                </div>
              </div>

              {/* پیش‌نمایش زنده در نتایج گوگل (SERP) */}
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">
                    🌐 پیش‌‌نمایش زنده در صفحه اول گوگل (Google SERP Snippet):
                  </span>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSerpPreviewMode("desktop")}
                      className={
                        "px-2 py-0.5 rounded font-bold cursor-pointer " +
                        (serpPreviewMode === "desktop"
                          ? "bg-[var(--accent-blue)] text-white"
                          : "text-slate-400")
                      }
                    >
                      🖥️ دسکتاپ
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerpPreviewMode("mobile")}
                      className={
                        "px-2 py-0.5 rounded font-bold cursor-pointer " +
                        (serpPreviewMode === "mobile"
                          ? "bg-[var(--accent-blue)] text-white"
                          : "text-slate-400")
                      }
                    >
                      📱 موبایل
                    </button>
                  </div>
                </div>

                <div
                  className={
                    "p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 " +
                    (serpPreviewMode === "mobile" ? "max-w-[340px] mx-auto" : "w-full")
                  }
                >
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-emerald-400">آکسون کور | Axon Core</span>
                    <span className="font-mono text-slate-400 truncate" dir="ltr">
                      https://axoncore.ir{editingItem.url || "/products/" + editingItem.id}
                    </span>
                  </div>
                  <div className="text-sm font-black text-sky-400 truncate">
                    {metaTitleInput || editingItem.title}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {metaDescInput ||
                      "توضیحات متا در زیر عنوان لینک شما در گوگل نمایش داده می‌شود..."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {saving ? "در حال ذخیره..." : "ذخیره متاتگ در دیتابیس 💾"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}