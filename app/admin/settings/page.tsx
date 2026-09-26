"use client";
import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    site_name:"",tagline:"",description:"",phone:"",email:"",
    address:"",working_hours:"",header_announcement:"",
    allow_google_index:true,maintenance_mode:"none",
    free_shipping_threshold:2000000,currency:"تومان",
  });
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState<{type:"success"|"error";text:string}|null>(null);

  useEffect(()=>{
    fetch("/api/admin/settings").then(r=>r.json()).then(d=>{
      if(d.success&&d.settings) setForm(p=>({...p,...d.settings}));
    }).catch(()=>{});
  },[]);

  const save=async()=>{
    soundEngine.playClick();setSaving(true);setMsg(null);
    const r=await fetch("/api/admin/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const d=await r.json();
    setMsg(d.success?{type:"success",text:"✓ تنظیمات ذخیره شد."}:{type:"error",text:d.message||"خطا"});
    setSaving(false);setTimeout(()=>setMsg(null),4000);
  };

  const inp="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)]";

  return (
    <div className="space-y-6 max-w-3xl font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)]">⚙️ تنظیمات عمومی فروشگاه</h1>
      </div>

      {msg&&<div className={`p-4 rounded-2xl text-xs font-bold border ${msg.type==="success"?"bg-emerald-500/15 border-emerald-500/30 text-emerald-600":"bg-rose-500/15 border-rose-500/30 text-rose-600"}`}>{msg.text}</div>}

      <div className="space-y-6 p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <div className="space-y-4">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🏪 اطلاعات فروشگاه</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[{k:"site_name",l:"نام فروشگاه"},{k:"tagline",l:"شعار"},{k:"phone",l:"تلفن"},{k:"email",l:"ایمیل"},{k:"address",l:"آدرس"},{k:"working_hours",l:"ساعات کاری"}].map(f=>(
              <div key={f.k} className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">{f.l}</label>
                <input type="text" value={(form as any)[f.k]||""} onChange={e=>setForm({...form,[f.k]:e.target.value})} className={inp}/>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">توضیحات (meta)</label>
            <textarea rows={2} value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} className={inp+" resize-none"}/>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">متن اعلان هدر</label>
            <input type="text" value={form.header_announcement||""} onChange={e=>setForm({...form,header_announcement:e.target.value})} className={inp}/>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🔧 حالت تعمیر</h2>
          <div className="grid grid-cols-3 gap-3">
            {[{v:"none",l:"فعال",c:"emerald"},{v:"timed",l:"موقت",c:"amber"},{v:"indefinite",l:"نامحدود",c:"rose"}].map(m=>(
              <button key={m.v} onClick={()=>{soundEngine.playClick();setForm({...form,maintenance_mode:m.v});}}
                className={`p-3 rounded-2xl border text-xs font-bold cursor-pointer ${form.maintenance_mode===m.v?"border-"+m.c+"-500 bg-"+m.c+"-500/10 text-"+m.c+"-600":"border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-secondary)]"}`}>
                {m.l}
              </button>
            ))}
          </div>
          {form.maintenance_mode!=="none"&&(
            <p className="text-xs font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl">
              ⚠️ سایت در حالت تعمیر است — فقط ادمین می‌تواند وارد شود.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🔍 موتورهای جستجو (SEO)</h2>
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)]">
            <input type="checkbox" checked={form.allow_google_index} onChange={e=>setForm({...form,allow_google_index:e.target.checked})} className="w-5 h-5 rounded cursor-pointer accent-[var(--accent-blue)]"/>
            <div>
              <p className="text-xs font-black">{form.allow_google_index?"✅ ایندکس مجاز — robots.txt: Allow /":"❌ عدم ایندکس — robots.txt: Disallow /"}</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">وقتی غیرفعال است هیچ صفحه‌ای توسط گوگل ایندکس نمی‌شود</p>
            </div>
          </label>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-lg">
          {saving?"در حال ذخیره...":"💾 ذخیره تنظیمات"}
        </button>
      </div>
    </div>
  );
}
