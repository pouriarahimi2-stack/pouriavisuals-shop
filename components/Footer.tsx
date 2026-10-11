"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Footer() {
  const [customPages, setCustomPages] = useState<any[]>([]);
  const [siteInfo, setSiteInfo] = useState<any>({});

  const fetchData = async () => {
    const { data: pages } = await supabase.from("modular_pages").select("title, slug").eq("is_published", true);
    if (pages) setCustomPages(pages);
    
    const { data: info } = await supabase.from("site_info").select("*").limit(1).maybeSingle();
    if (info) setSiteInfo(info);
  };

  useEffect(() => {
    fetchData();

    // همگام‌سازی بلادرنگ (Realtime) صفحات فوتر در هر سه پلتفرم
    const channel = supabase.channel('realtime_footer_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modular_pages' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_info' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--card-border)] pt-12 pb-8 mt-24 text-[var(--text-primary)]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <h3 className="font-black text-xl mb-4 text-[var(--accent-blue)]">
              {siteInfo?.site_name || "آکسون کور | فروشگاه تکنولوژی و دیجیتال"}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed text-justify max-w-md">
              {siteInfo?.tagline || "مرجع تخصصی عرضه کالاهای فناوری، سخت‌افزار و تجهیزات دیجیتال با تضمین اصالت کالا و ارسال سریع به سراسر ایران."}
            </p>
          </div>
          
          <div>
            <h4 className="font-black text-sm mb-4">دسترسی سریع</h4>
            <ul className="space-y-2.5 text-xs font-bold text-[var(--text-secondary)]">
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition">🛍️ کاتالوگ محصولات دیجیتال</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">📡 رادار اخبار تکنولوژی</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">📦 پیگیری لحظه‌ای سفارشات</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-sm mb-4">صفحات و قوانین سایت</h4>
            <ul className="space-y-2.5 text-xs font-bold text-[var(--text-secondary)]">
              {customPages.map(p => (
                <li key={p.slug}>
                  <Link href={`/${p.slug}`} className="hover:text-[var(--accent-blue)] transition">
                    📄 {p.title}
                  </Link>
                </li>
              ))}
              {customPages.length === 0 && (
                <li className="text-slate-500">صفحه‌ای ثبت نشده است</li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--card-border)] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold text-[var(--text-secondary)]">
          <p>تمامی حقوق مادی و معنوی برای {siteInfo?.site_name || "آکسون کور"} محفوظ است © {new Date().getFullYear()}</p>
          <div className="flex items-center gap-4">
            <span>پشتیبانی: <span className="font-mono" dir="ltr">{siteInfo?.phone || "021-00000000"}</span></span>
            <span>ایمیل: <span className="font-mono">{siteInfo?.email || "info@axoncore.ir"}</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
