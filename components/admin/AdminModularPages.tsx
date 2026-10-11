"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminModularPages() {
  const [pages, setPages] = useState<any[]>([]);

  const fetchPages = async () => {
    const { data } = await supabase.from("modular_pages").select("*").order("created_at", { ascending: false });
    if (data) setPages(data);
  };

  useEffect(() => {
    fetchPages();

    const channel = supabase.channel('cms_pages_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modular_pages' }, fetchPages)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if(!confirm(`آیا از حذف صفحه «${title}» مطمئن هستید؟`)) return;
    soundEngine.playClick();
    await supabase.from("modular_pages").delete().eq("id", id);
    setPages(pages.filter(p => p.id !== id));
    soundEngine.playSuccess();
  };

  return (
    <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl" dir="rtl">
       <div className="flex items-center justify-between mb-6 border-b border-[var(--card-border)] pb-4">
         <div>
           <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
             <span>📄</span> سیستم هوشمند مدیریت لندینگ‌پیج‌ها (CMS)
           </h2>
           <p className="text-xs text-[var(--text-secondary)] mt-1">
             با کلیک روی «ویرایش صفحه»، لندینگ‌پیج مستقیماً در صفحه‌ساز گرافیکی باز می‌شود.
           </p>
         </div>
         <button onClick={() => { soundEngine.playClick(); fetchPages(); }} className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer">
           🔄 بروزرسانی
         </button>
       </div>
       
       <div className="overflow-x-auto">
         <table className="w-full text-right text-xs">
           <thead>
             <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
               <th className="pb-3 px-2">عنوان صفحه</th>
               <th className="pb-3 px-2">لینک (URL)</th>
               <th className="pb-3 px-2 text-left">عملیات مدیریت</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-[var(--card-border)]">
             {pages.length === 0 ? (
               <tr>
                 <td colSpan={3} className="py-8 text-center text-slate-500 font-bold">هیچ صفحه‌ای یافت نشد.</td>
               </tr>
             ) : pages.map(p => (
               <tr key={p.id} className="hover:bg-[var(--input-bg)] transition">
                 <td className="py-4 px-2 font-black text-[var(--text-primary)]">{p.title}</td>
                 <td className="py-4 px-2">
                   <Link href={`https://axoncore.ir/${p.slug}`} target="_blank" className="font-mono text-[var(--accent-blue)] hover:underline">
                     axoncore.ir/{p.slug}
                   </Link>
                 </td>
                 <td className="py-4 px-2 text-left flex items-center justify-end gap-2">
                   <Link href={`https://axoncore.ir/${p.slug}`} target="_blank" className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)] transition font-bold">
                     👁 مشاهده
                   </Link>
                   <Link href={`/admin/appearance?page=${p.slug}`} className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30 font-bold hover:bg-amber-500 hover:text-white transition">
                     ✏️ ویرایش صفحه
                   </Link>
                   <button onClick={() => handleDelete(p.id, p.title)} className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30 font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer">
                     🗑 حذف
                   </button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
    </div>
  );
}
