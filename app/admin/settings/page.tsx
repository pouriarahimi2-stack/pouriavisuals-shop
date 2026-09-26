"use client";
import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    site_name: "", tagline: "", description: "", phone: "", email: "",
    address: "", working_hours: "", header_announcement: "",
    allow_google_index: true, maintenance_mode: "none",
    free_shipping_threshold: 2000000, currency: "تومان",
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState<{type:"success"|"error";text:string}|null>(null);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      if (d.success && d.settings) setForm(prev => ({ ...prev, ...d.settings }));
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    soundEngine.playClick();
    setSaving(true); setMsg(null);
    try {
      const res  = await fetch("/api/admin/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        soundEngine.playSuccess?.();
        setMsg({ type: "success", text: "✓ تنظیمات با موفقیت ذخیره و اعمال شد." });
      } else {
        setMsg({ type: "error", text: data.message || "خطا" });
      }
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const inp = "w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)]";

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] max-w-3xl" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)]">⚙️ تنظیمات عمومی فروشگاه</h1>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border ${msg.type==="success" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600" : "bg-rose-500/15 border-rose-500/30 text-rose-600"}`}>
          {msg.text}
        </div>
      )}

      <div className="space-y-6 p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">

        {/* اطلاعات اصلی */}
        <div className="space-y-4">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🏪 اطلاعات فروشگاه</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key:"site_name",   label:"نام فروشگاه" },
              { key:"tagline",     label:"شعار فروشگاه" },
              { key:"phone",       label:"تلفن تماس" },
              { key:"email",       label:"ایمیل" },
              { key:"address",     label:"آدرس" },
              { key:"working_hours",label:"ساعات کاری" },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">{f.label}</label>
                <input type="text" value={(form as any)[f.key] || ""} onChange={e => setForm({...form,[f.key]:e.target.value})} className={inp} />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">توضیحات (meta description)</label>
            <textarea rows={3} value={form.description || ""} onChange={e => setForm({...form,description:e.target.value})}
              className={inp + " resize-none"} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">متن اعلان هدر سایت</label>
            <input type="text" value={form.header_announcement || ""} onChange={e => setForm({...form,header_announcement:e.target.value})} className={inp} />
          </div>
        </div>

        {/* حالت تعمیر */}
        <div className="space-y-4">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🔧 حالت تعمیر (Maintenance)</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value:"none",       label:"سایت فعال",        color:"emerald", desc:"همه کاربران دسترسی دارند" },
              { value:"timed",      label:"تعمیر موقت",       color:"amber",   desc:"۲۴ ساعت آینده" },
              { value:"indefinite", label:"قطع نامحدود",      color:"rose",    desc:"تا اطلاع ثانوی" },
            ].map(m => (
              <button key={m.value} onClick={() => { soundEngine.playClick(); setForm({...form,maintenance_mode:m.value}); }}
                className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer text-right space-y-1 ${form.maintenance_mode===m.value ? "border-"+m.color+"-500 bg-"+m.color+"-500/10 text-"+m.color+"-600" : "border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-secondary)]"}`}>
                <div>{m.label}</div>
                <div className="font-normal text-[10px] opacity-70">{m.desc}</div>
              </button>
            ))}
          </div>
          {form.maintenance_mode !== "none" && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-600">
              ⚠️ وقتی حالت تعمیر فعال است، تمام صفحات سایت یک پیام «در حال تعمیر» نمایش می‌دهند. فقط ادمین دسترسی دارد.
            </div>
          )}
        </div>

        {/* دسترسی موتورهای جستجو */}
        <div className="space-y-3">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🔍 دسترسی موتورهای جستجو (SEO)</h2>
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)]">
            <input type="checkbox" checked={form.allow_google_index} onChange={e => setForm({...form,allow_google_index:e.target.checked})}
              className="w-5 h-5 rounded cursor-pointer accent-[var(--accent-blue)]" />
            <div className="space-y-0.5">
              <span className="text-xs font-black">اجازه ایندکس شدن توسط گوگل و سایر موتورهای جستجو</span>
              <p className="text-[10px] text-[var(--text-secondary)]">
                {form.allow_google_index ? "✅ سایت در گوگل ایندکس می‌شود — robots.txt: Allow: /" : "❌ سایت ایندکس نمی‌شود — robots.txt: Disallow: /"}
              </p>
            </div>
          </label>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-lg">
          {saving ? "در حال ذخیره..." : "💾 ذخیره تنظیمات"}
        </button>
      </div>
    </div>
  );
}
