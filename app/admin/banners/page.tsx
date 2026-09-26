"use client";
import React, { useEffect, useState, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface Banner { id: string; title: string; image_url: string; link_url?: string | null; is_active: boolean; }
interface Product { id: string | number; title?: string; name?: string; }

export default function AdminBannersPage() {
  const [banners,   setBanners]   = useState<Banner[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [statusMsg, setStatusMsg] = useState<{type:"success"|"error";text:string}|null>(null);
  const [productSearch,  setProductSearch]  = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searchingProds, setSearchingProds] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState({ id:"", title:"", image_url:"", link_url:"/products", is_active:true });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/banners");
      const d = await r.json();
      if (d.success) setBanners(d.banners || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchBanners(); }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!productSearch.trim()) { setProductResults([]); return; }
    setSearchingProds(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await fetch("/api/products?search=" + encodeURIComponent(productSearch));
        const d = await r.json();
        setProductResults((d.data || []).slice(0, 8));
      } catch {} finally { setSearchingProds(false); }
    }, 400);
  }, [productSearch]);

  const openNew  = () => { setForm({ id:"", title:"", image_url:"", link_url:"/products", is_active:true }); setProductSearch(""); setProductResults([]); setModalOpen(true); };
  const openEdit = (b: Banner) => { setForm({ id:b.id, title:b.title, image_url:b.image_url, link_url:b.link_url||"/products", is_active:b.is_active }); setProductSearch(""); setProductResults([]); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image_url.trim()) return;
    soundEngine.playClick(); setSubmitting(true);
    try {
      const r = await fetch("/api/admin/banners", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const d = await r.json();
      if (d.success) {
        soundEngine.playSuccess();
        setBanners(d.banners || banners);
        setModalOpen(false);
        setStatusMsg({ type:"success", text:"✓ بنر " + (form.id ? "ویرایش" : "اضافه") + " شد." });
      } else { setStatusMsg({ type:"error", text: d.message || "خطا" }); }
    } catch (e: any) { setStatusMsg({ type:"error", text: e.message }); }
    finally { setSubmitting(false); setTimeout(() => setStatusMsg(null), 4000); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    const r = await fetch("/api/admin/banners?id=" + id, { method:"DELETE" });
    const d = await r.json();
    if (d.success) setBanners(d.banners || banners.filter(b => b.id !== id));
  };

  const handleToggle = async (b: Banner) => {
    const r = await fetch("/api/admin/banners", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...b, is_active:!b.is_active}) });
    const d = await r.json();
    if (d.success) setBanners(d.banners || banners.map(x => x.id===b.id ? {...x,is_active:!x.is_active} : x));
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)]">🖼️ مدیریت بنرها</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">لینک‌دهی مستقیم به محصول یا صفحه دلخواه</p>
        </div>
        <button onClick={openNew} className="px-4 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer">➕ بنر جدید</button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border ${statusMsg.type==="success" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600" : "bg-rose-500/15 border-rose-500/30 text-rose-600"}`}>
          {statusMsg.text}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">در حال بارگذاری...</div>
      ) : banners.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-3">
          <span className="text-4xl block">🖼️</span>
          <p className="text-xs font-bold text-[var(--text-secondary)]">هنوز بنری اضافه نشده.</p>
          <button onClick={openNew} className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black cursor-pointer">اولین بنر را اضافه کن</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map(b => (
            <div key={b.id} className="rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow">
              <div className="aspect-[16/7] bg-slate-800 relative">
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src="/placeholder.png"; }} />
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${b.is_active ? "bg-emerald-500 text-white" : "bg-slate-600 text-slate-300"}`}>{b.is_active ? "فعال" : "غیرفعال"}</div>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs font-black truncate">{b.title}</p>
                <p className="text-[10px] text-[var(--text-secondary)] font-mono truncate">{b.link_url}</p>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => openEdit(b)} className="flex-1 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">ویرایش</button>
                  <button onClick={() => handleToggle(b)} className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${b.is_active ? "border-amber-500/30 bg-amber-500/10 text-amber-500" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"}`}>{b.is_active ? "غیرفعال" : "فعال"}</button>
                  <button onClick={() => handleDelete(b.id)} className="py-1.5 px-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold cursor-pointer">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target===e.currentTarget) setModalOpen(false); }}>
          <div className="w-full max-w-lg bg-[var(--modal-bg)] rounded-3xl border border-[var(--card-border)] shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black">{form.id ? "ویرایش بنر" : "بنر جدید"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer text-lg">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">عنوان *</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form,title:e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">آدرس تصویر *</label>
                <input type="text" required value={form.image_url} onChange={e => setForm({...form,image_url:e.target.value})}
                  placeholder="https://... یا /images/banner.jpg"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-[var(--accent-blue)]" />
                {form.image_url && (
                  <div className="mt-2 aspect-[16/7] rounded-xl overflow-hidden bg-slate-800">
                    <img src={form.image_url} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src="/placeholder.png"; }} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)]">لینک مقصد</label>
                <input type="text" value={form.link_url} onChange={e => setForm({...form,link_url:e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-[var(--accent-blue)]" />
                <div className="relative">
                  <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                    placeholder="🔍 جستجوی محصول برای لینک..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]" />
                  {(searchingProds || productResults.length > 0) && (
                    <div className="absolute top-full right-0 left-0 mt-1 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl z-10 overflow-hidden max-h-48 overflow-y-auto">
                      {searchingProds && <div className="p-3 text-xs text-center text-slate-400">جستجو...</div>}
                      {productResults.map(p => (
                        <button key={p.id} type="button"
                          onClick={() => { setForm({...form,link_url:"/products/"+p.id}); setProductSearch(String(p.title||p.name||"")); setProductResults([]); soundEngine.playClick(); }}
                          className="w-full text-right px-4 py-2.5 text-xs font-bold hover:bg-[var(--input-bg)] transition cursor-pointer flex items-center justify-between gap-2">
                          <span className="truncate">{p.title||p.name}</span>
                          <span className="text-[var(--accent-blue)] font-mono text-[10px] shrink-0">/products/{p.id}</span>
                        </button>
                      ))}
                      {!searchingProds && productResults.length===0 && productSearch && (
                        <div className="p-3 text-xs text-center text-slate-400">محصولی یافت نشد.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form,is_active:e.target.checked})}
                  className="w-4 h-4 rounded cursor-pointer accent-[var(--accent-blue)]" />
                <span className="text-xs font-bold">بنر فعال باشد</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition disabled:opacity-50 cursor-pointer">
                  {submitting ? "در حال ذخیره..." : "💾 ذخیره بنر"}
                </button>
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer">
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
