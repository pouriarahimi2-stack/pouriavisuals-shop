"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export default function StorefrontLayoutStudio({ defaultTab = "pages" }: { defaultTab?: string }) {
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPageUrl, setSelectedPageUrl] = useState<string>("/");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [controls, setControls] = useState({
    padding: 16,
    fontSize: 16,
    borderRadius: 8,
    color: "#ffffff",
    bgColor: "#07090e"
  });

  useEffect(() => {
    const fetchPages = async () => {
      // لود تمامی صفحات سایت از دیتابیس
      const { data } = await supabase.from("modular_pages").select("*");
      if (data) setPages(data);
    };
    fetchPages();

    // همگام‌سازی بلادرنگ
    const channel = supabase.channel('studio_pages_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modular_pages' }, fetchPages)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleStyleChange = (key: string, value: any, cssValue: string) => {
    setControls(prev => ({ ...prev, [key]: value }));
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: "AXON_APPLY_STYLE",
        payload: { key, value: cssValue }
      }, "*");
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-[var(--bg-main)] text-[var(--text-primary)] rounded-3xl overflow-hidden border border-[var(--card-border)] shadow-2xl" dir="rtl">
       <div className="p-4 border-b border-[var(--card-border)] bg-[var(--modal-bg)] flex flex-wrap justify-between items-center gap-4">
         <div className="flex items-center gap-3">
           <span className="text-2xl">🎨</span>
           <div>
             <h1 className="font-black text-lg text-[var(--accent-blue)]">سیستم پیشرفته صفحه‌ساز و لندینگ‌پیج</h1>
             <p className="text-[10px] text-[var(--text-secondary)]">مدیریت زنده (Realtime) صفحات، رنگ‌ها و چیدمان پیکسلی</p>
           </div>
         </div>
         
         <div className="flex items-center gap-3">
           <select
             value={selectedPageUrl}
             onChange={(e) => {
               soundEngine.playClick();
               setSelectedPageUrl(e.target.value);
             }}
             className="p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--accent-blue)] transition"
           >
             <option value="/">🏠 صفحه اصلی فروشگاه (/)</option>
             <option value="/products">🛍️ کاتالوگ محصولات (/products)</option>
             <option disabled>──────────</option>
             {pages.map(p => (
               <option key={p.id} value={`/${p.slug}`}>📄 {p.title} (/${p.slug})</option>
             ))}
           </select>
           <button onClick={() => soundEngine.playSuccess()} className="px-5 py-3 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg hover:opacity-90 transition cursor-pointer">
             💾 ذخیره و انتشار نهایی
           </button>
         </div>
       </div>

       <div className="flex flex-1 overflow-hidden">
         <div className="w-80 p-5 border-l border-[var(--card-border)] bg-[var(--modal-bg)] overflow-y-auto space-y-6">
            <div className="p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--card-border)]">
              <h3 className="text-xs font-black mb-4 text-[var(--text-secondary)]">🎛️ کنترل‌گر المان انتخابی</h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-[10px] mb-1 font-bold">
                    <span>فاصله داخلی (Padding)</span>
                    <span>{controls.padding}px</span>
                  </div>
                  <input type="range" min="0" max="100" value={controls.padding} 
                    onChange={(e) => handleStyleChange('padding', Number(e.target.value), `${e.target.value}px`)} 
                    className="w-full accent-[var(--accent-blue)]" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1 font-bold">
                    <span>سایز فونت (Font Size)</span>
                    <span>{controls.fontSize}px</span>
                  </div>
                  <input type="range" min="10" max="72" value={controls.fontSize} 
                    onChange={(e) => handleStyleChange('fontSize', Number(e.target.value), `${e.target.value}px`)} 
                    className="w-full accent-[var(--accent-blue)]" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1 font-bold">
                    <span>گردی لبه‌ها (Radius)</span>
                    <span>{controls.borderRadius}px</span>
                  </div>
                  <input type="range" min="0" max="100" value={controls.borderRadius} 
                    onChange={(e) => handleStyleChange('borderRadius', Number(e.target.value), `${e.target.value}px`)} 
                    className="w-full accent-[var(--accent-blue)]" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--card-border)]">
               <h3 className="text-xs font-black mb-4 text-[var(--text-secondary)]">🎨 مدیریت رنگ‌ها</h3>
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold">رنگ متن:</span>
                   <input type="color" value={controls.color} 
                     onChange={(e) => handleStyleChange('color', e.target.value, e.target.value)}
                     className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold">رنگ پس‌زمینه:</span>
                   <input type="color" value={controls.bgColor} 
                     onChange={(e) => handleStyleChange('backgroundColor', e.target.value, e.target.value)}
                     className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                 </div>
               </div>
            </div>
         </div>

         <div className="flex-1 bg-black/5 dark:bg-white/5 p-4 md:p-8 flex items-center justify-center">
            <div className="w-full h-full max-w-5xl bg-white dark:bg-[#07090e] rounded-[2rem] border-4 border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden relative">
              <iframe
                ref={iframeRef}
                src={selectedPageUrl}
                className="w-full h-full absolute inset-0 transition-all duration-300"
              />
            </div>
         </div>
       </div>
    </div>
  );
}
