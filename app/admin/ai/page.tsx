"use client";
import React, { useState, useRef, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

const TOOLS = [
  {id:"market",   icon:"📊",label:"کوپایلوت بازار",    prompt:"تحلیل بازار تکنولوژی ایران درباره:"},
  {id:"seo",      icon:"🔍",label:"اتوپایلوت سئو",     prompt:"استراتژی سئو برای فروشگاه تکنولوژی درباره:"},
  {id:"content",  icon:"✍️",label:"تولید محتوا",       prompt:"محتوای سئومحور فارسی برای فروشگاه تکنولوژی درباره:"},
  {id:"product",  icon:"📦",label:"توضیح محصول",       prompt:"توضیح محصول حرفه‌ای فارسی برای:"},
  {id:"pricing",  icon:"💰",label:"قیمت‌گذاری",       prompt:"استراتژی قیمت‌گذاری بازار ایران برای:"},
  {id:"campaign", icon:"📣",label:"کمپین بازاریابی",   prompt:"کمپین دیجیتال مارکتینگ برای:"},
  {id:"supplier", icon:"🏭",label:"تامین‌کننده",       prompt:"استراتژی تامین کالا برای فروشگاه دیجیتال درباره:"},
  {id:"analyze",  icon:"🧠",label:"تحلیل رقبا",        prompt:"تحلیل رقبا در بازار ایران برای:"},
];

type Msg = {role:"user"|"ai";text:string};

export default function AdminAIPage() {
  const [tool,    setTool]    = useState(TOOLS[0]);
  const [msgs,    setMsgs]    = useState<Msg[]>([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey,  setApiKey]  = useState("");
  const [keyOk,   setKeyOk]   = useState(false);
  const [savingKey,setSavingKey]=useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);
  useEffect(()=>{
    fetch("/api/admin/ai-config").then(r=>r.json()).then(d=>{
      if(d.success && d.gemini_api_key){setApiKey(d.gemini_api_key);setKeyOk(true);}
    }).catch(()=>{});
  },[]);

  const saveKey = async()=>{
    setSavingKey(true);
    const r = await fetch("/api/admin/ai-config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({gemini_api_key:apiKey})});
    const d = await r.json();
    if(d.success){setKeyOk(true);soundEngine.playSuccess?.();}
    setSavingKey(false);
  };

  const send = async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!input.trim()||loading)return;
    soundEngine.playClick();
    const userMsg:Msg={role:"user",text:input.trim()};
    const prompt = tool.prompt+" "+input.trim();
    setInput(""); setMsgs(p=>[...p,userMsg]); setLoading(true);
    try{
      const r=await fetch("/api/admin/ai-assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,tool:tool.id})});
      const d=await r.json();
      setMsgs(p=>[...p,{role:"ai",text:d.reply||d.message||"پاسخی دریافت نشد."}]);
    }catch{
      setMsgs(p=>[...p,{role:"ai",text:"خطا در اتصال."}]);
    }finally{setLoading(false);}
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)]">🤖 مرکز هوش مصنوعی آکسون</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">دستیار هوشمند رشد فروش، سئو، محتوا و استراتژی</p>
      </div>

      {!keyOk && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <p className="text-xs font-black text-amber-600">⚙️ کلید Gemini API را برای فعال‌سازی وارد کنید:</p>
          <div className="flex gap-3">
            <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="AIza..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-[var(--accent-blue)]"/>
            <button onClick={saveKey} disabled={savingKey||!apiKey}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black cursor-pointer hover:opacity-90 disabled:opacity-50">
              {savingKey?"ذخیره...":"ذخیره"}
            </button>
          </div>
          <p className="text-[10px] text-slate-400">از <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[var(--accent-blue)] underline">Google AI Studio</a> رایگان دریافت کنید.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-1.5">
          <p className="text-xs font-black text-[var(--text-secondary)] px-1 pb-1">ابزارها</p>
          {TOOLS.map(t=>(
            <button key={t.id} onClick={()=>{soundEngine.playClick();setTool(t);setMsgs([]);}}
              className={`w-full text-right px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${tool.id===t.id?"bg-[var(--accent-blue)] text-white shadow":"bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"}`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl shadow-xl flex flex-col overflow-hidden" style={{minHeight:"500px"}}>
          <div className="p-4 border-b border-[var(--card-border)] bg-[var(--accent-blue)]/5 flex items-center gap-3">
            <span className="text-2xl">{tool.icon}</span>
            <div><p className="text-sm font-black">{tool.label}</p><p className="text-[10px] text-[var(--text-secondary)]">{tool.prompt.slice(0,50)}...</p></div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.length===0&&(
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                <span className="text-5xl">{tool.icon}</span>
                <p className="text-sm font-black text-[var(--text-secondary)]">{tool.label}</p>
                <p className="text-xs text-slate-400 max-w-xs">{tool.prompt}</p>
              </div>
            )}
            {msgs.map((m,i)=>(
              <div key={i} className={`flex ${m.role==="user"?"justify-start":"justify-end"}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-wrap ${m.role==="user"?"bg-[var(--accent-blue)] text-white":"bg-[var(--input-bg)] border border-[var(--card-border)]"}`}>
                  {m.role==="ai"&&<span className="text-[var(--accent-blue)] font-black block mb-1 text-[10px]">🤖 دستیار آکسون</span>}
                  {m.text}
                </div>
              </div>
            ))}
            {loading&&(
              <div className="flex justify-end">
                <div className="bg-[var(--input-bg)] border border-[var(--card-border)] px-4 py-3 rounded-2xl inline-flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">در حال تفکر...</span>
                  {[0,1,2].map(i=>(<span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-bounce" style={{animationDelay:i*150+"ms"}}/>))}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          <form onSubmit={send} className="p-4 border-t border-[var(--card-border)] flex gap-3">
            <input type="text" value={input} onChange={e=>setInput(e.target.value)} disabled={loading}
              placeholder={`درخواست برای «${tool.label}»...`}
              style={{fontSize:"16px"}}
              className="flex-1 px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm font-bold outline-none focus:border-[var(--accent-blue)] disabled:opacity-50"/>
            <button type="submit" disabled={loading||!input.trim()}
              className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm disabled:opacity-40 cursor-pointer hover:opacity-90">←</button>
          </form>
        </div>
      </div>
    </div>
  );
}
