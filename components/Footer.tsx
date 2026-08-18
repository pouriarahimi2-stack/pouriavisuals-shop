"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function Footer() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    async function loadInfo() {
      try {
        const info = await siteInfoService.getAll();
        setSiteInfo(info);
      } catch (e) {
        console.error("Footer load error:", e);
      }
    }
    loadInfo();

    const handleUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const phoneNum = siteInfo?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
  const addressText = siteInfo?.address || "تهران، خیابان ولیعصر";
  const siteName = siteInfo?.site_name || "پوریا ویژوالز";

  return (
    <footer className="mt-20 border-t border-[var(--card-border)] bg-[var(--modal-bg)] font-sans select-none text-[var(--text-primary)] transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
        
        {/* ستون ۱: معرفی برند */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center font-black">
              ⚡
            </div>
            <h3 className="font-black text-sm">{siteName}</h3>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
            {siteInfo?.about_text ||
              "مرجع تخصصی فروش، کالیبراسیون و مشاوره مانیتورهای حرفه‌ای تدوین، کالرگریدینگ و تجهیزات استودیویی در ایران."}
          </p>
        </div>

        {/* ستون ۲: دسترسی سریع */}
        <div className="space-y-2.5">
          <h4 className="font-black text-xs text-[var(--text-primary)]">دسترسی سریع</h4>
          <ul className="space-y-2 text-[var(--text-secondary)] font-medium">
            <li>
              <Link href="/#products" className="hover:text-[var(--accent-blue)] transition">
                کاتالوگ تجهیزات و مانیتورها
              </Link>
            </li>
            <li>
              <Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">
                استعلام و پیگیری مرسوله پستی
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-[var(--accent-blue)] transition">
                مجله تخصصی و مقالات سئو
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[var(--accent-blue)] transition">
                تماس با پشتیبانی و نشانی
              </Link>
            </li>
          </ul>
        </div>

        {/* ستون ۳: اطلاعات پشتیبانی */}
        <div className="space-y-2.5">
          <h4 className="font-black text-xs text-[var(--text-primary)]">اطلاعات ارتباطی</h4>
          <div className="space-y-2 text-[var(--text-secondary)] font-medium leading-relaxed">
            <p>
              <strong>تلفن:</strong> <span className="font-mono text-[var(--accent-blue)]">{phoneNum}</span>
            </p>
            <p>
              <strong>ایمیل:</strong> <span className="font-mono">{siteInfo?.email || "info@pouriavisuals.ir"}</span>
            </p>
            <p>
              <strong>نشانی:</strong> {addressText}
            </p>
          </div>
        </div>

        {/* ستون ۴: نمادهای اعتماد و حقوق معنوی */}
        <div className="space-y-3">
          <h4 className="font-black text-xs text-[var(--text-primary)]">ضمانت و پشتیبانی</h4>
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1.5 text-[11px] text-[var(--text-secondary)] leading-relaxed">
            <p className="font-bold text-[var(--text-primary)]">✓ ضمانت اصالت کالا</p>
            <p>تمامی بسته‌ها با پست پیشتاز بیمه‌شده و بسته‌بندی ضدضربه ارسال می‌گردند.</p>
          </div>
        </div>
      </div>

      {/* کپی‌رایت انتهای صفحه */}
      <div className="border-t border-[var(--card-border)] py-4 text-center text-[10px] text-[var(--text-secondary)] font-medium">
        تمامی حقوق مادی و معنوی برای مجموعه {siteName} محفوظ است © {new Date().getFullYear()}
      </div>
    </footer>
  );
}