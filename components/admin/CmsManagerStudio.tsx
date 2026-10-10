"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

export default function CmsManagerStudio() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // سیستم پیشرفته مدیریت لینک‌های فوتر
  const [footerLinks, setFooterLinks] = useState<{title: string, url: string}[]>([]);
  const [savingFooter, setSavingFooter] = useState(false);
  const [feedback, setFeedback] = useState<{type: "ok" | "err", text: string} | null>(null);

  const fetchData = async () => {
    try {
      const pRes = await fetch("/api/pages");
      if (pRes.ok) setPages(await pRes.json());

      const tRes = await fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" });
      const tJson = await tRes.json();
      const links = tJson?.config?.globalBackground?.dynamicFooterLinks;
      if (Array.isArray(links) && links.length > 0) {
        setFooterLinks(links);
      } else {
        setFooterLinks([
          { title: "قوانین و مقررات سایت", url: "/terms" },
          { title: "تماس با ما", url: "/contact" }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeletePage = async (slug: string) => {
    if (!confirm(`آیا از حذف کامل صفحه (${slug}) مطمئن هستید؟`)) return;
    soundEngine.playClick();
    try {
      const res = await fetch(`/api/pages?slug=${slug}`, { method: "DELETE" });
      if (res.ok) {
        soundEngine.playSuccess();
        fetchData();
      }
    } catch {}
  };

  const handleSaveFooterLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSavingFooter(true);
    setFeedback(null);
    try {
      const tbRes = await fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" });
      const tbJson = await tbRes.json().catch(() => ({}));
      const prevConfig = tbJson?.config || {};

      const res = await fetch("/api/theme-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            ...prevConfig,
            globalBackground: {
              ...(prevConfig.globalBackground || {}),
              dynamicFooterLinks: footerLinks,
            }
          },
        }),
      });

      if (res.ok) {
        soundEngine.playSuccess();
        setFeedback({ type: "ok", text: "✓ لینک‌های فوتر به صورت امن و دائمی ذخیره شدند." });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: "err", text: "خطا در برقراری ارتباط با سرور." });
    } finally {
      setSavingFooter(false);
    }
  };

  const addFooterLink = () => {
    soundEngine.playClick();
    setFooterLinks([...footerLinks, { title: "", url: "" }]);
  };

  const removeFooterLink = (index: number) => {
    soundEngine.playClick();
    setFooterLinks(footerLinks.filter((_, i) => i !== index));
  };

  const updateFooterLink = (index: number, field: "title" | "url", value: string) => {
    const newLinks = [...footerLinks];
    newLinks[index][field] = value;
    setFooterLinks(newLinks);
  };

  return (
    <div className="space-y-8 font-sans text-[var(--text-primary)] select-text" dir="rtl">
      
      {/* جدول مدیریت صفحات */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
          <div>
            <h2 className="text-lg font-black text-[var(--accent-blue)]">📄 مدیریت صفحات سایت (CMS)</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">لیست تمام صفحاتی که با صفحه‌ساز ساخته‌اید</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition">
            🔄 بروزرسانی لیست
          </button>
        </div>

        {loading ? (
          <div className="text-center text-xs text-slate-400 py-10">در حال دریافت امن اطلاعات...</div>
        ) : pages.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-10">هنوز صفحه‌ای نساخته‌اید.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="text-[var(--text-secondary)] border-b border-[var(--card-border)]">
                <tr>
                  <th className="pb-3 px-2">عنوان صفحه</th>
                  <th className="pb-3 px-2">لینک آدرس (URL)</th>
                  <th className="pb-3 px-2">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--input-bg)]/50 transition">
                    <td className="py-4 px-2 font-black">{p.title}</td>
                    <td className="py-4 px-2">
                      <a href={`/${p.slug}`} target="_blank" className="font-mono text-sky-500 hover:underline" dir="ltr">
                        axoncore.ir/{p.slug}
                      </a>
                    </td>
                    <td className="py-4 px-2 flex gap-2">
                      <a href={`/${p.slug}`} target="_blank" className="px-3 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-bold">
                        👁️ مشاهده
                      </a>
                      <button onClick={() => handleDeletePage(p.slug)} className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-500 font-bold">
                        🗑️ حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* سیستم امن مدیریت لینک‌های فوتر */}
      <form onSubmit={handleSaveFooterLinks} className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
          <div>
            <h2 className="text-lg font-black text-emerald-500">📑 مدیریت پیشرفته لینک‌های فوتر</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">لینک‌ها را با دقت وارد کنید تا به صورت خودکار در سایت نمایش داده شوند</p>
          </div>
          <button type="submit" disabled={savingFooter} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-lg disabled:opacity-50 hover:bg-emerald-500 transition">
            {savingFooter ? "در حال ذخیره امن..." : "💾 ذخیره لینک‌های فوتر"}
          </button>
        </div>

        {feedback && (
          <div className={"p-3 rounded-xl text-xs font-bold " + (feedback.type === "ok" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400")}>
            {feedback.text}
          </div>
        )}

        <div className="space-y-3">
          {footerLinks.map((link, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] items-center">
              <div className="w-full sm:w-1/2">
                <label className="text-[10px] text-[var(--text-secondary)] font-bold ml-2">عنوان نمایشی:</label>
                <input type="text" required placeholder="مثلاً: شرایط مرجوعی کالا" value={link.title} onChange={(e) => updateFooterLink(idx, "title", e.target.value)} className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-emerald-500" />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="text-[10px] text-[var(--text-secondary)] font-bold ml-2">آدرس لینک (URL):</label>
                <div className="flex gap-2 items-center">
                  <input type="text" required dir="ltr" placeholder="/return-policy" value={link.url} onChange={(e) => updateFooterLink(idx, "url", e.target.value)} className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-emerald-500" />
                  <button type="button" onClick={() => removeFooterLink(idx)} className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold">✕</button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addFooterLink} className="w-full py-3 rounded-2xl border-2 border-dashed border-[var(--card-border)] text-[var(--text-secondary)] font-bold text-xs hover:border-emerald-500 hover:text-emerald-500 transition">
            + افزودن کادر لینک جدید به فوتر
          </button>
        </div>
      </form>
    </div>
  );
}
