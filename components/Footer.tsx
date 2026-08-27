// File Path: components/Footer.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  const fetchFooterData = async () => {
    try {
      const data = await siteInfoService.getSiteInfo();
      if (data) setInfo(data);
    } catch (e) {
      console.error("Footer fetch error:", e);
    }
  };

  useEffect(() => {
    fetchFooterData();

    const handleUpdate = (e: any) => {
      if (e.detail) setInfo(e.detail);
    };

    window.addEventListener("site_info_updated", handleUpdate);

    const channel = supabase
      .channel("footer-realtime-master-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => fetchFooterData())
      .subscribe();

    return () => {
      window.removeEventListener("site_info_updated", handleUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  const siteName = info?.site_name || info?.siteName || info?.storeName || "آکسون | Axon";
  const tagline = info?.tagline || "مرجع تخصصی تجهیزات دیجیتال، تصویر و استودیو";
  const phone = info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
  const email = info?.email || "info@axoncore.ir";
  const address = info?.address || "تهران، خیابان ولیعصر، تقاطع میرداماد";
  const workingHours = info?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";
  const description = info?.footer_text || info?.description || tagline;
  const footerLogo = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url;

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] transition-colors mt-auto shadow-2xl select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* ستون اول: لوگو و معرفی */}
          <div className="space-y-4 md:col-span-1">
            <div className="w-full max-w-[200px] h-24 rounded-3xl border border-[var(--card-border)] bg-white/5 p-2 shadow-inner flex items-center justify-center overflow-hidden">
              {footerLogo ? (
                <img src={footerLogo} alt={siteName} className="w-full h-full object-contain p-1" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-[var(--accent-blue)] flex items-center justify-center text-white font-black text-2xl shadow-md">
                  ⚓
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {description}
            </p>
          </div>

          {/* ستون دوم: دسترسی سریع */}
          <div className="space-y-3">
            <h5 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">دسترسی سریع</h5>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition font-bold">کاتالوگ تجهیزات و مانیتورها</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition font-bold">استعلام و پیگیری مرسوله پستی</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition font-bold">جدیدترین اخبار حوزه تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition font-bold">مجله تخصصی و مقالات سئو</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition font-bold">تماس با پشتیبانی و نشانی</Link></li>
            </ul>
          </div>

          {/* ستون سوم: اطلاعات رسمی */}
          <div className="space-y-3">
            <h5 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">اطلاعات رسمی</h5>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-medium">
              <li className="flex items-center gap-2">
                <span className="font-bold">تلفن:</span>
                <span className="font-mono font-black text-[var(--accent-blue)]">{phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold">ایمیل:</span>
                <span className="font-mono">{email}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold">ساعات کاری:</span>
                <span>{workingHours}</span>
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="font-bold shrink-0">نشانی:</span>
                <span>{address}</span>
              </li>
            </ul>

            <div className="flex gap-2.5 pt-3">
              {info?.instagram && <a href={info.instagram} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] hover:text-white hover:bg-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-black transition shadow-sm">اینستاگرام</a>}
              {info?.telegram && <a href={info.telegram} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] hover:text-white hover:bg-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-black transition shadow-sm">تلگرام</a>}
              {info?.whatsapp && <a href={info.whatsapp} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] hover:text-white hover:bg-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-black transition shadow-sm">واتساپ</a>}
            </div>
          </div>

          {/* ستون چهارم: ضمانت و استانداردها */}
          <div className="space-y-3">
            <h5 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">ضمانت و پشتیبانی</h5>
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 text-xs shadow-inner">
              <div className="font-black text-emerald-500 flex items-center gap-1.5"><span>✓</span> ضمانت ۱۰۰٪ اصالت فیزیکی کالا</div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">تمامی مرسولات با بیمه کامل پستی و بسته‌بندی ضدضربه استودیویی ارسال می‌گردند.</p>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-[var(--card-border)] text-center text-xs text-[var(--text-secondary)] font-bold">
          تمامی حقوق مادی و معنوی برای مجموعه <span className="text-[var(--accent-blue)]">{siteName}</span> محفوظ است © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}