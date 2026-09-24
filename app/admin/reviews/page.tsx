"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle2, XCircle, Trash2, RefreshCw, Star, MessageSquare } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews,   setReviews]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<"all"|"pending"|"approved">("pending");
  const [saving,    setSaving]    = useState<Record<string,boolean>>({});
  const [msg,       setMsg]       = useState<{type:"success"|"error";text:string}|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/reviews");
      const d = await r.json();
      if (d.success) setReviews(d.reviews || []);
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const showMsg = (type: "success"|"error", text: string) => {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 3000);
  };

  const approve = async (id: string) => {
    setSaving(p => ({...p,[id]:true}));
    const r = await fetch("/api/admin/reviews", {
      method: "PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id, is_approved: true }),
    });
    const d = await r.json();
    if (d.success) { setReviews(p => p.map(rv => rv.id===id ? {...rv, is_approved:true} : rv)); showMsg("success","✓ دیدگاه تایید شد"); }
    else showMsg("error", d.message);
    setSaving(p => ({...p,[id]:false}));
  };

  const reject = async (id: string) => {
    setSaving(p => ({...p,[id]:true}));
    const r = await fetch("/api/admin/reviews", {
      method: "PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id, is_approved: false }),
    });
    const d = await r.json();
    if (d.success) { setReviews(p => p.map(rv => rv.id===id ? {...rv, is_approved:false} : rv)); showMsg("success","✓ دیدگاه رد شد"); }
    else showMsg("error", d.message);
    setSaving(p => ({...p,[id]:false}));
  };

  const remove = async (id: string) => {
    if (!window.confirm("آیا از حذف این دیدگاه مطمئنید؟")) return;
    const r = await fetch("/api/admin/reviews?id=" + id, { method: "DELETE" });
    const d = await r.json();
    if (d.success) { setReviews(p => p.filter(rv => rv.id !== id)); showMsg("success","✓ دیدگاه حذف شد"); }
    else showMsg("error", d.message);
  };

  const filtered = reviews.filter(rv => {
    const matchFilter = filter === "all" || (filter === "approved" ? rv.is_approved === true : rv.is_approved === false || rv.is_approved === null);
    const matchSearch = !search || (rv.author_name||rv.user_name||"").includes(search) || (rv.comment||"").includes(search);
    return matchFilter && matchSearch;
  });

  const pendingCount  = reviews.filter(r => !r.is_approved).length;
  const approvedCount = reviews.filter(r => r.is_approved === true).length;

  return (
    <div className="space-y-5 font-sans text-[var(--text-primary)]" dir="rtl">

      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-black text-[var(--accent-blue)] flex items-center gap-2">
            <MessageSquare size={20}/> مدیریت دیدگاه‌ها و نظرات مشتریان
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {pendingCount} در انتظار تایید · {approvedCount} تایید‌شده · {reviews.length} کل
          </p>
        </div>
        <button onClick={load} className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-hover)] transition cursor-pointer">
          <RefreshCw size={15} className={loading?"animate-spin":""}/>
        </button>
      </div>

      {msg && (
        <div className={"p-4 rounded-2xl text-xs font-bold " + (msg.type==="success"?"bg-emerald-500/10 text-emerald-400":"bg-rose-500/10 text-rose-400")}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی نام یا متن دیدگاه..."
            className="w-full py-2.5 pr-9 pl-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none"/>
        </div>
        <div className="flex gap-2">
          {(["all","pending","approved"] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              className={"px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer " + (filter===f ? "bg-[var(--accent-blue)] text-white" : "bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-hover)]")}>
              {f==="all"?"همه":f==="pending"?"در انتظار":"تایید‌شده"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-[var(--text-secondary)]">{reviews.length} دیدگاه · نمایش {filtered.length}</p>

      {loading ? (
        <p className="py-16 text-center text-xs text-slate-400">در حال بارگذاری...</p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-xs text-slate-400">دیدگاهی یافت نشد</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(rv => (
            <div key={rv.id} className={"p-5 rounded-3xl bg-[var(--modal-bg)] border shadow-sm space-y-3 " + (rv.is_approved ? "border-emerald-500/20" : "border-amber-500/20")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] flex items-center justify-center font-black text-sm">
                      {(rv.author_name||rv.user_name||"؟")[0]}
                    </div>
                    <span className="font-black">{rv.author_name || rv.user_name || "کاربر ناشناس"}</span>
                    <span className="text-slate-400">{new Date(rv.created_at).toLocaleDateString("fa-IR")}</span>
                    {rv.is_approved ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black">تایید‌شده</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-black">در انتظار</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 pr-10">
                    {Array.from({length:5}).map((_,i) => (
                      <Star key={i} size={13} className={i < (rv.rating||5) ? "text-amber-400 fill-amber-400" : "text-slate-600"}/>
                    ))}
                    <span className="text-[10px] text-slate-400 mr-1">{rv.rating || 5}/5</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!rv.is_approved && (
                    <button onClick={()=>approve(rv.id)} disabled={saving[rv.id]}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer hover:bg-emerald-500 transition">
                      <CheckCircle2 size={13}/> تایید
                    </button>
                  )}
                  {rv.is_approved && (
                    <button onClick={()=>reject(rv.id)} disabled={saving[rv.id]}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer hover:bg-amber-500 transition">
                      <XCircle size={13}/> رد
                    </button>
                  )}
                  <button onClick={()=>remove(rv.id)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-rose-400 text-rose-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition">
                    <Trash2 size={13}/> حذف
                  </button>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)] bg-[var(--input-bg)] p-3 rounded-2xl">
                {rv.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}