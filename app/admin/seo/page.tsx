// File Path: app/admin/seo/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import AdminAiSeoAutopilot from "@/components/admin/AdminAiSeoAutopilot";

interface SeoItem {
  id: string;
  type: "product" | "post" | "page";
  title: string;
  meta_title: string;
  meta_description: string;
  has_image?: boolean;
  url?: string;
}

interface SeoIssue {
  id: string;
  type: "product" | "post" | "page";
  title: string;
  severity: "high" | "medium" | "low";
  message: string;
  meta_title: string;
  meta_description: string;
}

export default function AdminSeoPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "meta_editor" | "autopilot">("audit");
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number>(92);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalPosts: 0,
    totalPages: 0,
    healthyCount: 0,
    issuesCount: 0,
  });
  const [issues, setIssues] = useState<SeoIssue[]>([]);
  const [items, setItems] = useState<SeoItem[]>([]);
  const [search, setSearch] = useState("");

  const [editingItem, setEditingItem] = useState<SeoItem | null>(null);
  const [metaTitleInput, setMetaTitleInput] = useState("");
  const [metaDescInput, setMetaDescInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchSeoAudit = async () => {
    try {
      const res = await fetch("/api/admin/seo-audit", { cache: "no-store" });
      const json = await res.json();
      if (json && json.success) {
        setScore(Number(json.score ?? 90));
        setSummary(
          json.summary || {
            totalProducts: 0,
            totalPosts: 0,
            totalPages: 0,
            healthyCount: 0,
            issuesCount: 0,
          }
        );
        setIssues(Array.isArray(json.issues) ? json.issues : []);
        setItems(Array.isArray(json.items) ? json.items : []);
      }
    } catch (e) {
      console.error("SEO Audit fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

  const handleOpenMetaEditor = (item: {
    id: string;
    type: "product" | "post" | "page";
    title: string;
    meta_title: string;
    meta_description: string;
  }) => {
    soundEngine.playClick();
    setEditingItem(item);
    setMetaTitleInput(item.meta_title || item.title || "");
    setMetaDescInput(item.meta_description || "");
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
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFeedback(json.message || "متاتگ‌های سئو با موفقیت بروزرسانی شدند.");
        setEditingItem(null);
        fetchSeoAudit();
        setTimeout(() => setFeedback(null), 3500);
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter((i) =>
    (i.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🚀</span> مرکز فرماندهی سئو، متاتگ‌ها و ایندکس گوگل (SEO Suite)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            اسکن بلادرنگ سلامت سئو تکنیکال، ویرایش مستقیم متاتگ‌های کالاها و اتوپایلوت تولید محتوا
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("audit");
            }}
            className={
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer " +
              (activeTab === "audit"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            🔍 رادار سلامت سئو ({issues.length})
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("meta_editor");
            }}
            className={
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer " +
              (activeTab === "meta_editor"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            🏷️ ویرایشگر متاتگ‌ها
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("autopilot");
            }}
            className={
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer " +
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
          ✓ {feedback}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">امتیاز سلامت سئو سایت:</span>
          <span className="text-2xl font-black font-mono text-emerald-500 block">{score}%</span>
          <span className="text-[10px] text-slate-400">محاسبه زنده بر اساس متادیتا</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">کالاهای ایندکس‌شده:</span>
          <span className="text-2xl font-black font-mono text-[var(--accent-blue)] block">
            {summary.totalProducts}
          </span>
          <span className="text-[10px] text-slate-400">در نقشه سایت (sitemap.xml)</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">مقالات مجله سئو:</span>
          <span className="text-2xl font-black font-mono text-indigo-400 block">
            {summary.totalPosts}
          </span>
          <span className="text-[10px] text-slate-400">مجهز به اسکیمای Article</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">موارد نیازمند بهینه‌سازی:</span>
          <span className="text-2xl font-black font-mono text-amber-500 block">
            {summary.issuesCount}
          </span>
          <span className="text-[10px] text-slate-400">قابل اصلاح فوری با یک کلیک</span>
        </div>
      </div>

      {activeTab === "audit" && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <h2 className="text-sm font-black">لیست هشدارهای سئو و نقص متاتگ‌ها</h2>
            <button
              onClick={() => {
                soundEngine.playClick();
                fetchSeoAudit();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer"
            >
              🔄 اسکن مجدد
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-bold">
              در حال اسکن متاتگ‌ها و ساختار سئو...
            </div>
          ) : issues.length === 0 ? (
            <div className="py-12 text-center text-xs text-emerald-500 font-black">
              🎉 فوق‌العاده! تمامی محصولات و مقالات دارای متاتگ‌های استاندارد سئو هستند.
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((iss, idx) => (
                <div
                  key={iss.id + "-" + idx}
                  className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "px-2 py-0.5 rounded-md text-[10px] font-bold " +
                          (iss.severity === "high"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30")
                        }
                      >
                        {iss.severity === "high" ? "اولویت بالا" : "متوسط"}
                      </span>
                      <h4 className="text-xs font-black">{iss.title}</h4>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">{iss.message}</p>
                  </div>

                  <button
                    onClick={() => handleOpenMetaEditor(iss)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition cursor-pointer shrink-0"
                  >
                    ✏️ اصلاح فوری متاتگ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "meta_editor" && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[var(--card-border)] pb-3">
            <h2 className="text-sm font-black">مدیریت و ویرایش مستقیم متاتگ‌های محصولات</h2>
            <input
              type="text"
              placeholder="🔍 جستجوی نام کالا..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[var(--accent-blue)]">{item.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{item.url}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate">
                    <strong>Meta Title:</strong> {item.meta_title || "---"}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    <strong>Meta Desc:</strong> {item.meta_description || "ثبت نشده"}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenMetaEditor(item)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer shrink-0"
                >
                  ✏️ ویرایش سئو
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "autopilot" && <AdminAiSeoAutopilot />}

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--accent-blue)]">
                🏷️ ویرایش متاتگ سئو: {editingItem.title}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMeta} className="space-y-4">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  عنوان سئو در نتایج گوگل (Meta Title):
                </label>
                <input
                  type="text"
                  required
                  value={metaTitleInput}
                  onChange={(e) => setMetaTitleInput(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-bold text-[var(--text-secondary)]">
                    توضیحات متا (Meta Description):
                  </label>
                  <span className="font-mono text-[10px] text-slate-400">
                    {metaDescInput.length} / 160 کاراکتر
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={metaDescInput}
                  onChange={(e) => setMetaDescInput(e.target.value)}
                  placeholder="توضیحات جذاب شامل کلمات کلیدی اصلی جهت افزایش نرخ کلیک (CTR) در گوگل..."
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed outline-none focus:border-[var(--accent-blue)]"
                />
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
