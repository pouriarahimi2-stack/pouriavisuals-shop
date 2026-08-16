"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { menuService, MenuItem } from "@/services/menuService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function Footer() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);

  useEffect(() => {
    async function loadFooterData() {
      try {
        const [info, menuList] = await Promise.all([
          siteInfoService.getAll(),
          menuService.getAll(),
        ]);
        setSiteInfo(info);
        setMenus((menuList || []).filter((m) => m.is_active !== false));
      } catch (err) {
        console.error("Error loading footer data:", err);
      }
    }
    loadFooterData();
  }, []);

  return (
    <footer className="bg-[var(--modal-bg)] border-t border-[var(--card-border)] font-sans select-none text-[var(--text-primary)] mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* ستون اطلاعات و درباره فروشگاه */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center font-bold text-lg shadow-md">
                
              </span>
              <span className="text-base font-black">
                {siteInfo?.storeName || siteInfo?.siteTitle || "فروشگاه تخصصی محصولات اپل"}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium max-w-md">
              {siteInfo?.aboutText || siteInfo?.aboutUs || "مرجع تخصصی خرید جدیدترین محصولات و لوازم جانبی اصل اپل با تضمین بهترین قیمت، ضمانت اصالت کالا و ارسال سریع به سراسر کشور."}
            </p>
          </div>

          {/* دسترسی سریع / منوها */}
          <div className="space-y-3 text-xs">
            <h4 className="font-black text-sm text-[var(--text-primary)]">دسترسی سریع</h4>
            <ul className="space-y-2">
              {menus.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.url}
                    className="text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition font-medium"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ارتباط با ما و شبکه‌های اجتماعی */}
          <div className="space-y-3 text-xs">
            <h4 className="font-black text-sm text-[var(--text-primary)]">ارتباط و پشتیبانی</h4>
            <div className="space-y-2 text-[var(--text-secondary)] font-medium">
              {siteInfo?.phone && (
                <p className="flex items-center gap-2">
                  <span>📞</span>
                  <span className="font-mono" dir="ltr">{siteInfo.phone}</span>
                </p>
              )}
              {siteInfo?.email && (
                <p className="flex items-center gap-2">
                  <span>✉️</span>
                  <span className="font-mono">{siteInfo.email}</span>
                </p>
              )}
              {siteInfo?.address && (
                <p className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{siteInfo.address}</span>
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {siteInfo?.instagram && (
                <a
                  href={`https://instagram.com/${siteInfo.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition"
                >
                  📷 اینستاگرام
                </a>
              )}
              {siteInfo?.telegram && (
                <a
                  href={`https://t.me/${siteInfo.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition"
                >
                  ✈️ تلگرام
                </a>
              )}
            </div>
          </div>
        </div>

        {/* کپی‌رایت */}
        <div className="border-t border-[var(--card-border)] mt-8 pt-6 text-center text-[11px] text-[var(--text-secondary)] font-medium">
          © {new Date().getFullYear()} تمامی حقوق محفوظ است. طراحی و توسعه فروشگاه تخصصی
        </div>
      </div>
    </footer>
  );
}