"use client";
import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

const FONTS = [
  { value:"Vazirmatn", label:"وزیرمتن (پیش‌فرض)" },
  { value:"IRANSans",  label:"ایران سنس" },
  { value:"Yekan",     label:"یکان" },
  { value:"Shabnam",   label:"شبنم" },
  { value:"Samim",     label:"صمیم" },
];
const RADII = [
  { value:"0.5rem",label:"تیز" },{ value:"1rem",label:"کمی گرد" },
  { value:"1.5rem",label:"گرد" },{ value:"2rem",label:"خیلی گرد" },{ value:"9999px",label:"دایره" },
];

export default function AdminStylesPage() {
  const [primary,  setPrimary]  = useState("#0071e3");
  const [secondary,setSecondary]= useState("#4f46e5");
  const [font,     setFont]     = useState("Vazirmatn");
  const [radius,   setRadius]   = useState("1.5rem");
  const [css,      setCss]      = useState("");
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState<{type:"success"|"error";text:string}|null>(null);

  useEffect(() => {
    fetch("/api/admin/styles").then(r=>r.json()).then(d=>{
      if(d.success && d.styles){
        setPrimary(d.styles.primary_color||"#0071e3");
        setSecondary(d.styles.secondary_color||"#4f46e5");
        setFont(d.styles.font_family||"Vazirmatn");
        setRadius(d.styles.border_radius||"1.5rem");
        setCss(d.styles.custom_css||"");
      }
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    document.documentElement.style.setProperty("--accent-blue", primary);
    document.documentElement.style.setProperty("--accent-purple", secondary);
    document.documentElement.style.setProperty("--border-radius-card", radius);
    document.body.style.fontFamily = font + ", Vazirmatn, sans-serif";
  },[primary,secondary,font,radius]);

  const save = async()=>{
    soundEngine.playClick(); setSaving(true); setMsg(null);
    const res = await fetch("/api/admin/styles",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({primary_color:primary,secondary_color:secondary,font_family:font,border_radius:radius,custom_css:css})});
    const d = await res.json();
    setMsg(d.success?{type:"success",text:"✓ هویت بصری در کل سایت اعمال شد."}:{type:"error",text:d.message||"خطا"});
    setSaving(false);
    setTimeout(()=>setMsg(null),4000);
  };

  const inp = "w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]";

  return (
    <div className="space-y-6 max-w-3xl font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)]">✨ هویت بصری و فونت‌ها</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">تغییرات به صورت زنده پیش‌نمایش داده می‌شود.</p>
      </div>

      {msg && <div className={`p-4 rounded-2xl text-xs font-bold border ${msg.type==="success"?"bg-emerald-500/15 border-emerald-500/30 text-emerald-600":"bg-rose-500/15 border-rose-500/30 text-rose-600"}`}>{msg.text}</div>}

      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🎨 رنگ‌ها</h2>
          <div className="grid grid-cols-2 gap-4">
            {[{label:"رنگ اصلی",val:primary,set:setPrimary},{label:"رنگ ثانویه",val:secondary,set:setSecondary}].map(c=>(
              <div key={c.label} className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">{c.label}</label>
                <div className="flex gap-2">
                  <input type="color" value={c.val} onChange={e=>c.set(e.target.value)} className="w-12 h-10 rounded-xl border border-[var(--card-border)] cursor-pointer"/>
                  <input type="text" value={c.val} onChange={e=>c.set(e.target.value)} className={inp+" flex-1 font-mono"}/>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{background:primary}}>اصلی</div>
            <div className="h-10 w-28 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{background:secondary}}>ثانویه</div>
            <div className="h-10 w-28 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{background:`linear-gradient(135deg,${primary},${secondary})`}}>گرادیان</div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🖋️ فونت</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FONTS.map(f=>(
              <button key={f.value} onClick={()=>{soundEngine.playClick();setFont(f.value);}}
                style={{fontFamily:f.value+",sans-serif"}}
                className={`p-3 rounded-2xl border text-sm font-bold cursor-pointer text-right ${font===f.value?"border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]":"border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-secondary)]"}`}>
                {f.label} — نمونه ۱۲۳
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">⬜ گوشه‌ها</h2>
          <div className="flex flex-wrap gap-2">
            {RADII.map(r=>(
              <button key={r.value} onClick={()=>{soundEngine.playClick();setRadius(r.value);}}
                style={{borderRadius:r.value}}
                className={`px-4 py-2 border text-xs font-bold cursor-pointer ${radius===r.value?"border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white":"border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-secondary)]"}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">⚙️ CSS اختصاصی</h2>
          <textarea rows={5} value={css} onChange={e=>setCss(e.target.value)}
            placeholder=":root { --my-var: value; }"
            className={inp+" resize-none font-mono"}/>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-lg">
          {saving?"در حال ذخیره...":"💾 ذخیره و اعمال سراسری"}
        </button>
      </div>
    </div>
  );
}
