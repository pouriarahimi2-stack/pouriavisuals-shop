"use client";
import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function CmsManagerStudio() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // کادر لینک فوتر (حداقل یک ردیف برای جلوگیری از غیب شدن کادر)
  const [footerLinks, setFooterLinks] = useState<{title: string, url: string}[]>([{title: "", url: ""}]);
  const [savingFooter, setSavingFooter] = useState(false);
  const [feedback, setFeedback] = useState<{type: "ok" | "err", text: string} | null>(null);

  const fetchData = async () => {
    try {
      const pRes = await fetch("/api/pages");
      if (pRes.ok) setPages(await pRes.json());

      const tRes = await fetch("/api/admin/footer-links?t=" + Date.now(), { cache: "no-store" });
      const tJson = await tRes.json();
      if (tJson.success && Array.isArray(tJson.links) && tJson.links.length > 0) {
        setFooterLinks(tJson.links);
      } else {
        setFooterLinks([{ title: "", url: "" }]);
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

  // 🟢 اتصال هوشمند دکمه ویرایش به صفحه‌ساز پایینی
  const triggerEdit = (slug: string) => {
    soundEngine.playClick();
    window.dispatchEvent(new CustomEvent('axon_edit_page', { detail: slug }));
  };

  const handleSaveFooterLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSavingFooter(true);
    setFeedback(null);
    try {
      // فقط لینک‌هایی ذخیره شوند که مقدار دارند
      const validLinks = footerLinks.filter(l => l.title.trim() !== "" && l.url.trim() !== "");
      
      const res = await fetch("/api/admin/footer-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: validLinks }),
      });

      if (res.ok) {
        soundEngine.playSuccess();
        setFeedback({ type: "ok", text: "✓ لینک‌های شما با موفقیت در فوتر سایت قرار گرفتند." });
        if (validLinks.length === 0) setFooterLinks([{ title: "", url: "" }]);
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: "err", text: "خطا در ارتباط با دیتابیس." });
    } finally {
      setSavingFooter(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[var(--text-primary)] select-text" dir="rtl">
      
      {/* 🟢 بخش اول: جدول مدیریت لندینگ‌پیج‌ها */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[var(--card-border)] pb-4 gap-4">
          <div>
            <h2 className="text-lg font-black text-[var(--accent-blue)]">📄 سیستم هوشمند مدیریت لندینگ‌پیج‌ها (CMS)</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">با زدن دکمه «ویرایش صفحه»، لندینگ‌پیج شما فوراً در صفحه‌ساز گرافیکی پایین باز می‌شود.</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition">
            🔄 بروزرسانی لیست
          </button>
        </div>

        {loading ? (
          <div className="text-center text-xs text-slate-400 py-10">در حال دریافت اطلاعات...</div>
        ) : pages.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-10">هنوز لندینگ‌پیجی نساخته‌اید.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="text-[var(--text-secondary)] border-b border-[var(--card-border)]">
                <tr>
                  <th className="pb-3 px-2">عنوان لندینگ‌پیج</th>
                  <th className="pb-3 px-2">لینک (URL)</th>
                  <th className="pb-3 px-2 text-left">ابزارهای مدیریت</th>
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
                    <td className="py-4 px-2 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/${p.slug}`} target="_blank" className="px-3 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-bold">👁️ مشاهده</a>
                        {/* دکمه ویرایش هوشمند */}
                        <button onClick={() => triggerEdit(p.slug)} className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30 hover:bg-amber-500 hover:text-black transition">
                          ✏️ ویرایش صفحه
                        </button>
                        <button onClick={() => handleDeletePage(p.slug)} className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-500 font-bold hover:bg-rose-500 hover:text-white transition">🗑️ حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🟢 بخش دوم: مدیریت لینک‌های فوتر سایت */}
      <form onSubmit={handleSaveFooterLinks} className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
          <div>
            <h2 className="text-lg font-black text-emerald-500">📑 نمایش صفحات در فوتر سایت</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">آدرس صفحاتی که بالا ساخته‌اید (مثل /terms) را اینجا وارد کنید تا در منوی پایینی سایت قرار گیرند.</p>
          </div>
          <button type="submit" disabled={savingFooter} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-lg disabled:opacity-50 hover:bg-emerald-500 transition">
            {savingFooter ? "در حال ذخیره..." : "💾 ذخیره لینک‌های فوتر"}
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
                <input type="text" placeholder="مثلاً: قوانین سایت" value={link.title} onChange={(e) => { const n = [...footerLinks]; n[idx].title = e.target.value; setFooterLinks(n); }} className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-emerald-500" />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="text-[10px] text-[var(--text-secondary)] font-bold ml-2">آدرس لینک (URL):</label>
                <div className="flex gap-2 items-center">
                  <input type="text" dir="ltr" placeholder="/terms" value={link.url} onChange={(e) => { const n = [...footerLinks]; n[idx].url = e.target.value; setFooterLinks(n); }} className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-emerald-500" />
                  <button type="button" onClick={() => { const n = footerLinks.filter((_, i) => i !== idx); setFooterLinks(n.length === 0 ? [{ title: "", url: "" }] : n); }} className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold">✕</button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setFooterLinks([...footerLinks, { title: "", url: "" }])} className="w-full py-3 rounded-2xl border-2 border-dashed border-[var(--card-border)] text-[var(--text-secondary)] font-bold text-xs hover:border-emerald-500 hover:text-emerald-500 transition">
            + افزودن کادر لینک جدید به فوتر
          </button>
        </div>
      </form>
    </div>
  );
}
