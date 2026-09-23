"use client";
import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, Package, Users, TrendingUp, Search,
  RefreshCw, Save, Download, AlertTriangle, Plus } from "lucide-react";

type Tab = "orders" | "inventory" | "monthly" | "crm";
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "orders",    label: "سفارشات و بارنامه", emoji: "📦" },
  { id: "inventory", label: "انبار و موجودی",    emoji: "🏪" },
  { id: "monthly",   label: "گزارش مالی ماهانه", emoji: "📊" },
  { id: "crm",       label: "مشتریان CRM",       emoji: "👥" },
];

const STATUS_MAP: Record<string,{label:string;color:string}> = {
  pending:   { label:"در انتظار",   color:"text-amber-400   bg-amber-400/10"   },
  paid:      { label:"پرداخت‌شده", color:"text-emerald-400 bg-emerald-400/10" },
  shipped:   { label:"ارسال‌شده",  color:"text-blue-400    bg-blue-400/10"    },
  delivered: { label:"تحویل‌شده",  color:"text-green-500   bg-green-500/10"   },
  cancelled: { label:"لغو‌شده",   color:"text-rose-400    bg-rose-400/10"    },
};

// ── تب سفارشات ────────────────────────────────────────────────
function OrdersTab() {
  const [orders,setOrders]   = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [search,setSearch]   = useState("");
  const [filter,setFilter]   = useState("all");
  const [tracking,setTracking] = useState<Record<string,string>>({});
  const [saving,setSaving]   = useState<Record<string,boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/orders");
      const d = await r.json();
      if (d.success) {
        setOrders(d.orders || []);
        const t: Record<string,string> = {};
        (d.orders||[]).forEach((o:any) => { t[o.id] = o.tracking_code || ""; });
        setTracking(t);
      }
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, s: string) => {
    await fetch("/api/admin/orders", { method:"PATCH",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id, payment_status: s }) });
    setOrders(prev => prev.map(o => o.id===id ? {...o, payment_status:s} : o));
  };

  const saveTracking = async (id: string) => {
    setSaving(p => ({...p,[id]:true}));
    const code = (tracking[id]||"").trim();
    const r = await fetch("/api/admin/orders", { method:"PATCH",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id, tracking_code: code, payment_status: code ? "shipped" : undefined }) });
    if (r.ok) setOrders(p => p.map(o => o.id===id ? {...o, tracking_code:code, payment_status: code ? "shipped" : o.payment_status} : o));
    setSaving(p => ({...p,[id]:false}));
  };

  const filtered = orders.filter(o =>
    (filter==="all" || o.payment_status===filter) &&
    (!search || (o.customer_name||"").includes(search) || (o.customer_phone||"").includes(search) || (o.order_number||"").includes(search))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="جستجوی نام، موبایل، شماره سفارش..."
            className="w-full py-2.5 pr-9 pl-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none" />
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none cursor-pointer">
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={load} className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]"><RefreshCw size={15}/></button>
      </div>
      <p className="text-[11px] text-[var(--text-secondary)] font-bold">{orders.length} سفارش · نمایش {filtered.length}</p>
      {loading ? <p className="py-16 text-center text-xs text-slate-400">در حال بارگذاری...</p> :
       filtered.length === 0 ? <p className="py-16 text-center text-xs text-slate-400">سفارشی یافت نشد</p> :
      <div className="space-y-3">
        {filtered.map(ord => {
          const s = STATUS_MAP[ord.payment_status] || { label: ord.payment_status, color: "text-slate-400 bg-slate-400/10" };
          return (
            <div key={ord.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-black text-[var(--accent-blue)]">{"#"+ord.order_number}</span>
                  <span className="font-bold">{ord.customer_name}</span>
                  <span className="text-slate-400 font-mono">{ord.customer_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={"px-2.5 py-1 rounded-full text-[10px] font-bold " + s.color}>{s.label}</span>
                  <select value={ord.payment_status||"pending"} onChange={e=>updateStatus(ord.id,e.target.value)}
                    className="bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold px-2 py-1 rounded-xl outline-none cursor-pointer">
                    {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div><span className="text-slate-400">آدرس: </span><span>{ord.shipping_address}</span></div>
                <div><span className="text-slate-400">مبلغ: </span>
                  <span className="font-mono font-black text-emerald-400">{Number(ord.total_price||0).toLocaleString("fa-IR")} ت</span></div>
                <div><span className="text-slate-400">تاریخ: </span><span>{new Date(ord.created_at).toLocaleDateString("fa-IR")}</span></div>
              </div>
              {Array.isArray(ord.items) && ord.items.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ord.items.map((it:any,i:number) => (
                    <span key={i} className="px-2.5 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-bold">
                      {it.title} {"×"+it.quantity}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--card-border)]">
                <input value={tracking[ord.id]||""} onChange={e=>setTracking(p=>({...p,[ord.id]:e.target.value}))}
                  placeholder="کد رهگیری پست..."
                  className="flex-1 p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[11px] outline-none" />
                <button onClick={()=>saveTracking(ord.id)} disabled={saving[ord.id]}
                  className="px-3 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer">
                  <Save size={12}/>{saving[ord.id]?"...":"ثبت"}
                </button>
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}

// ── تب انبار ─────────────────────────────────────────────────
function InventoryTab() {
  const [products,setProducts] = useState<any[]>([]);
  const [stats,setStats]       = useState<any>(null);
  const [loading,setLoading]   = useState(true);
  const [addQty,setAddQty]     = useState<Record<string,string>>({});
  const [saving,setSaving]     = useState<Record<string,boolean>>({});
  const [search,setSearch]     = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/financial?type=inventory");
      const d = await r.json();
      if (d.success) { setProducts(d.products||[]); setStats(d.stats); }
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleRestock = async (p: any) => {
    const qty = Number(addQty[p.id] || 0);
    if (qty <= 0) { alert("تعداد باید بزرگتر از صفر باشد"); return; }
    const msg = "آیا مطمئنید که می‌خواهید " + qty + " عدد به موجودی «" + p.title + "» اضافه کنید?\n" +
                "موجودی فعلی: " + p.stock + " → جدید: " + (Number(p.stock)+qty);
    if (!window.confirm(msg)) return;
    setSaving(s => ({...s,[p.id]:true}));
    const r = await fetch("/api/admin/financial", {
      method: "PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ productId: p.id, addStock: qty }) });
    const d = await r.json();
    if (d.success) { setAddQty(a=>({...a,[p.id]:""})); load(); } else alert(d.message);
    setSaving(s => ({...s,[p.id]:false}));
  };

  const filtered = products.filter(p => !search || (p.title||"").includes(search) || (p.category||"").includes(search));

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { label:"کل محصولات",    value: stats.totalProducts,        color:"text-[var(--accent-blue)]" },
            { label:"موجود",          value: stats.inStock,               color:"text-emerald-400" },
            { label:"ناموجود",        value: stats.outOfStock,            color:"text-rose-400" },
            { label:"کم‌موجودی (≤۳)", value: stats.lowStock,             color:"text-amber-400" },
          ].map((s,i) => (
            <div key={i} className="p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center">
              <div className={"text-lg font-black font-mono " + s.color}>{s.value}</div>
              <div className="text-slate-400 text-[10px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {stats && <p className="text-xs text-[var(--text-secondary)]">ارزش کل انبار: <span className="font-mono font-black text-emerald-400">{Number(stats.totalInventoryValue).toLocaleString("fa-IR")} تومان</span></p>}
      <div className="relative">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی محصول..."
          className="w-full py-2.5 pr-9 pl-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none" />
      </div>
      {loading ? <p className="py-12 text-center text-xs text-slate-400">در حال بارگذاری انبار...</p> :
      <div className="overflow-x-auto rounded-3xl border border-[var(--card-border)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--card-bg)] border-b border-[var(--card-border)] text-[var(--text-secondary)] font-bold">
              <th className="py-3 px-4 text-right">محصول</th>
              <th className="py-3 px-4 text-right">دسته</th>
              <th className="py-3 px-4 text-right">قیمت</th>
              <th className="py-3 px-4 text-right">موجودی</th>
              <th className="py-3 px-4 text-right">شارژ انبار</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-[var(--card-hover)] transition">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <img src={p.image_url||"/placeholder.png"} alt="" className="w-9 h-9 object-contain rounded-lg bg-[var(--card-bg)] p-0.5 shrink-0" />
                    <span className="font-bold line-clamp-1">{p.title}</span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-slate-400">{p.category||"عمومی"}</td>
                <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">{Number(p.price||0).toLocaleString("fa-IR")}</td>
                <td className="py-2.5 px-4">
                  <span className={"font-black font-mono " + (Number(p.stock)===0?"text-rose-400":Number(p.stock)<=3?"text-amber-400":"text-emerald-400")}>
                    {p.stock}
                    {Number(p.stock)===0 && <span className="text-rose-400 text-[10px] mr-1">(ناموجود)</span>}
                    {Number(p.stock)>0 && Number(p.stock)<=3 && <AlertTriangle size={12} className="inline mr-1 text-amber-400"/>}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <input type="number" min={1} value={addQty[p.id]||""} onChange={e=>setAddQty(a=>({...a,[p.id]:e.target.value}))}
                      placeholder="تعداد"
                      className="w-16 p-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-[11px] text-center outline-none" />
                    <button onClick={()=>handleRestock(p)} disabled={saving[p.id]}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer hover:bg-emerald-500 transition">
                      <Plus size={12}/>{saving[p.id]?"...":"افزودن"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

// ── تب گزارش ماهانه ─────────────────────────────────────────
function MonthlyTab() {
  const now = new Date().toISOString().slice(0, 7);
  const [month,setMonth]   = useState(now);
  const [data,setData]     = useState<any>(null);
  const [loading,setLoading] = useState(false);

  const load = async (m: string) => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/financial?type=monthly&month=" + m);
      const d = await r.json();
      if (d.success) setData(d);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(month); }, [month]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [["تاریخ","سفارش","مشتری","مبلغ","وضعیت"],
      ...(data.orders||[]).map((o:any) => [
        o.created_at.slice(0,10), o.order_number, o.customer_name,
        Number(o.final_amount||o.total_price||0), o.payment_status])];
    const csv  = rows.map((r:any[]) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "axon-report-" + month + ".csv";
    a.click();
  };

  const maxRevenue = data?.dailyRevenue?.length > 0 ? Math.max(...data.dailyRevenue.map((d:any)=>d.revenue)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)} max={now}
          className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none cursor-pointer" />
        <button onClick={exportCSV}
          className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold flex items-center gap-2 hover:bg-[var(--card-hover)] transition cursor-pointer">
          <Download size={14}/> دریافت CSV
        </button>
      </div>
      {loading ? <p className="py-12 text-center text-xs text-slate-400">در حال محاسبه...</p> :
       data && <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { label:"درآمد ماه",      value: Number(data.stats.totalRevenue).toLocaleString("fa-IR")+" ت", color:"text-emerald-400" },
            { label:"کل سفارشات",    value: data.stats.totalOrders, color:"text-[var(--accent-blue)]" },
            { label:"نرخ موفقیت",    value: data.stats.successRate+"%", color:"text-purple-400" },
            { label:"میانگین سفارش", value: Number(data.stats.avgOrder).toLocaleString("fa-IR")+" ت", color:"text-amber-400" },
          ].map((k,i) => (
            <div key={i} className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
              <div className={"text-base font-black font-mono " + k.color}>{k.value}</div>
              <div className="text-slate-400 text-[10px] mt-1">{k.label}</div>
            </div>
          ))}
        </div>
        {data.dailyRevenue?.length > 0 && (
          <div className="p-5 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3">
            <h3 className="text-xs font-black">نمودار درآمد روزانه</h3>
            <div className="flex items-end gap-1 h-28 overflow-x-auto pb-4">
              {data.dailyRevenue.map((d:any) => (
                <div key={d.date} className="flex flex-col items-center gap-1 min-w-[28px] flex-1">
                  <div
                    title={d.date + ": " + Number(d.revenue).toLocaleString("fa-IR") + " ت"}
                    style={{ height: String(Math.max(4, Math.round((d.revenue/maxRevenue)*90))) + "px" }}
                    className="w-full rounded-t-lg bg-[var(--accent-blue)] opacity-80 hover:opacity-100 transition cursor-pointer"
                  />
                  <span className="text-[8px] text-slate-400">{d.date.slice(8)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.topProducts?.length > 0 && (
          <div className="p-5 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3">
            <h3 className="text-xs font-black">پرفروش‌ترین محصولات این ماه</h3>
            {data.topProducts.slice(0,5).map((p:any,i:number) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-[var(--card-border)]/40">
                <span className="font-bold">{(i+1) + ". " + p.title}</span>
                <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <span>{p.qty} فروش</span>
                  <span className="font-mono text-emerald-400">{Number(p.revenue).toLocaleString("fa-IR")} ت</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </>}
    </div>
  );
}

// ── تب CRM ──────────────────────────────────────────────────
function CRMTab() {
  const [customers,setCustomers] = useState<any[]>([]);
  const [loading,setLoading]     = useState(true);
  const [search,setSearch]       = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/admin/financial?type=customers");
        const d = await r.json();
        if (d.success) setCustomers(d.customers);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const filtered = customers.filter(c =>
    !search || (c.name||"").includes(search) || (c.phone||"").includes(search));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی نام یا شماره..."
          className="w-full py-2.5 pr-9 pl-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none" />
      </div>
      <p className="text-xs text-[var(--text-secondary)]">{customers.length} مشتری · {customers.filter((c:any)=>c.isVip).length} VIP</p>
      {loading ? <p className="py-12 text-center text-xs text-slate-400">در حال بارگذاری...</p> :
      <div className="overflow-x-auto rounded-3xl border border-[var(--card-border)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--card-bg)] border-b border-[var(--card-border)] text-[var(--text-secondary)] font-bold">
              <th className="py-3 px-4 text-right">مشتری</th>
              <th className="py-3 px-4 text-right hidden sm:table-cell">شماره</th>
              <th className="py-3 px-4 text-right">سفارشات</th>
              <th className="py-3 px-4 text-right">مجموع خرید</th>
              <th className="py-3 px-4 text-right hidden md:table-cell">آخرین خرید</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {filtered.map((c:any,i:number) => (
              <tr key={i} className="hover:bg-[var(--card-hover)] transition">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] flex items-center justify-center font-black text-sm">
                      {(c.name||"?")[0]}
                    </div>
                    <div>
                      <div className="font-bold">{c.name}</div>
                      {c.isVip && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-black">VIP</span>}
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4 font-mono text-slate-400 hidden sm:table-cell">{c.phone}</td>
                <td className="py-2.5 px-4">
                  <span className="font-bold text-[var(--accent-blue)]">{c.totalOrders}</span>
                  <span className="text-slate-400"> ({c.paidOrders} موفق)</span>
                </td>
                <td className="py-2.5 px-4 font-mono font-black text-emerald-400">
                  {Number(c.totalSpent).toLocaleString("fa-IR")} ت
                </td>
                <td className="py-2.5 px-4 text-slate-400 hidden md:table-cell">
                  {new Date(c.lastOrderAt).toLocaleDateString("fa-IR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

// ── صفحه اصلی ──────────────────────────────────────────────
export default function FinancialHubPage() {
  const [tab, setTab] = useState<Tab>("orders");
  return (
    <div className="space-y-5 font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-base font-black text-[var(--accent-blue)] flex items-center gap-2 mb-4">
          <BarChart3 size={20}/> مرکز مالی، سفارشات و انبار
        </h1>
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={"px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer " +
                (tab===t.id ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-hover)]")}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        {tab==="orders"    && <OrdersTab/>}
        {tab==="inventory" && <InventoryTab/>}
        {tab==="monthly"   && <MonthlyTab/>}
        {tab==="crm"       && <CRMTab/>}
      </div>
    </div>
  );
}