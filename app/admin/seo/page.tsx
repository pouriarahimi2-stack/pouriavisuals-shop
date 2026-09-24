"use client";
import React, { useState, useEffect } from "react";
import { Search, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Copy } from "lucide-react";

export default function SeoPage() {
  const [audit,      setAudit]      = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic,      setTopic]      = useState("");
  const [result,     setResult]     = useState<any>(null);
  const [msg,        setMsg]        = useState("");

  const loadAudit = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/seo-audit");
      const d = await r.json();
      if (d.success) setAudit(d);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { loadAudit(); }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true); setResult(null); setMsg("");
    try {
      const r = await fetch("/api/admin/seo-audit", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ topic }),
      });
      const d = await r.json();
      if (d.success) setResult(d);
      else setMsg(d.message || "خطا در تولید محتوا");
    } catch { setMsg("خطا در ارتباط با سرور"); }
    setGenerating(false);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setMsg("✓ کپی شد"); setTimeout(() => setMsg(""), 2000); });
  };

  const scoreColor = !audit ? "text-slate-400" :
    audit.score >= 80 ? "text-emerald-400" :
    audit.score >= 50 ? "text-amber-400" : "text-rose-400";

  const LEVEL_STYLE: Record<string,string> = {
    error:   "border-rose-500/30 bg-rose-500/5 text-rose-400",
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    info:    "border-blue-500/30 bg-blue-500/5 text-blue-400",
  };
  const LEVEL_ICON: Record<string,string> = {
    error: "❌", warning: "⚠️", info: "ℹ️"
  };

  return (
    <div className="space-y-5 font-sans text-[var(--text-primary)]" dir="rtl">

      {/* هدر */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-black text-[var(--accent-blue)] flex items-center gap-2">
            <TrendingUp size={20}/> دستیار تخصصی SEO آکسون کور
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">آنالیز سئوی سایت + تولید محتوای SEO با هوش مصنوعی</p>
        </div>
        <button onClick={loadAudit}
          className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-hover)] transition cursor-pointer">
          <RefreshCw size={15} className={loading?"animate-spin":""}/>
        </button>
      </div>

      {/* امتیاز SEO */}
      {audit && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-center sm:col-span-1">
            <div className={"text-5xl font-black font-mono " + scoreColor}>{audit.score}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-2 font-bold">امتیاز SEO از ۱۰۰</div>
            <div className="mt-3 h-2 rounded-full bg-[var(--input-bg)] overflow-hidden">
              <div
                style={{ width: audit.score + "%" }}
                className={"h-full rounded-full transition-all duration-1000 " + (audit.score>=80?"bg-emerald-500":audit.score>=50?"bg-amber-500":"bg-rose-500")}
              />
            </div>
          </div>
          <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label:"محصولات",    value: audit.stats.products, ok: audit.stats.products > 0 },
              { label:"مقالات",     value: audit.stats.posts,    ok: audit.stats.posts > 0 },
              { label:"نام سایت",  value: audit.stats.hasSiteName?"✓":"✕",   ok: audit.stats.hasSiteName },
              { label:"توضیحات",   value: audit.stats.hasDescription?"✓":"✕", ok: audit.stats.hasDescription },
              { label:"ایندکس گوگل",value:audit.stats.googleIndexed?"فعال":"غیرفعال", ok: audit.stats.googleIndexed },
            ].map((s,i) => (
              <div key={i} className="p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center">
                <div className={"text-base font-black " + (s.ok?"text-emerald-400":"text-rose-400")}>{s.value}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* مشکلات SEO */}
      {audit?.issues?.length > 0 && (
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3">
          <h3 className="text-sm font-black flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400"/> مشکلات و توصیه‌های SEO
          </h3>
          {audit.issues.map((issue:any, i:number) => (
            <div key={i} className={"flex items-start gap-2 p-3 rounded-2xl border text-xs font-bold " + (LEVEL_STYLE[issue.level]||"")}>
              <span>{LEVEL_ICON[issue.level]||"•"}</span>
              {issue.message}
            </div>
          ))}
        </div>
      )}
      {audit?.issues?.length === 0 && audit && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16}/> عالی! مشکل SEO شناسایی‌شده‌ای وجود ندارد.
        </div>
      )}

      {/* تولید محتوای SEO با AI */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h3 className="text-sm font-black flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--accent-blue)]"/> تولید مقاله SEO با هوش مصنوعی
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          موضوع، محصول یا کلیدواژه مورد نظر را وارد کن. AI یک مقاله کامل SEO-friendly به فارسی می‌سازد.
        </p>
        {msg && <div className="text-xs font-bold text-[var(--accent-blue)]">{msg}</div>}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={topic} onChange={e=>setTopic(e.target.value)}
              placeholder="مثال: بهترین لپ‌تاپ گیمینگ زیر ۵۰ میلیون"
              onKeyDown={e=>{if(e.key==="Enter")handleGenerate();}}
              className="w-full py-3 pr-10 pl-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm font-bold outline-none focus:border-[var(--accent-blue)]" />
          </div>
          <button onClick={handleGenerate} disabled={generating || !topic.trim()}
            className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer hover:opacity-90 transition">
            {generating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"/></> : <Sparkles size={15}/>}
            {generating ? "در حال تولید..." : "تولید محتوا"}
          </button>
        </div>

        {/* نتیجه */}
        {result && (
          <div className="space-y-4 pt-4 border-t border-[var(--card-border)] text-xs">
            {result.meta_title && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[var(--text-secondary)]">عنوان SEO (Meta Title):</span>
                  <button onClick={()=>copyText(result.meta_title)} className="flex items-center gap-1 text-[var(--accent-blue)] font-bold cursor-pointer"><Copy size={12}/>کپی</button>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold">{result.meta_title}</div>
              </div>
            )}
            {result.meta_description && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[var(--text-secondary)]">توضیحات SEO (Meta Description):</span>
                  <button onClick={()=>copyText(result.meta_description)} className="flex items-center gap-1 text-[var(--accent-blue)] font-bold cursor-pointer"><Copy size={12}/>کپی</button>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">{result.meta_description}</div>
              </div>
            )}
            {result.content && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[var(--text-secondary)]">محتوای کامل مقاله:</span>
                  <button onClick={()=>copyText(result.content)} className="flex items-center gap-1 text-[var(--accent-blue)] font-bold cursor-pointer"><Copy size={12}/>کپی</button>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-loose whitespace-pre-wrap max-h-64 overflow-y-auto text-[var(--text-secondary)]">
                  {result.content}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}