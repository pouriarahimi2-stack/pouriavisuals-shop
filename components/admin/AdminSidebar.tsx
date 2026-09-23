"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

interface NavGroup {
  groupTitle: string;
  items: {
    name: string;
    href: string;
    icon: string;
  }[];
}

const NAV_SECTIONS: NavGroup[] = [
  {
    groupTitle: "مدیریت فروش و مالی",
    items: [
      { name: "داشبورد تحلیلی",         href: "/admin/dashboard", icon: "📊" },
      { name: "مرکز مالی و سفارشات",    href: "/admin/financial", icon: "💰" },
      { name: "کدهای تخفیف",            href: "/admin/coupons",   icon: "🏷️" },
    ],
  },
  {
    groupTitle: "کاتالوگ و چیدمان ویترین",
    items: [
      { name: "استودیوی ظاهر (هدر و فوتر)", href: "/admin/appearance", icon: "🎨" },
      { name: "کاتالوگ محصولات", href: "/admin/products", icon: "💻" },
      { name: "صفحه‌ساز ماژولار (Puck)", href: "/admin/pages", icon: "📐" },
      { name: "بنرها و اسلایدر", href: "/admin/banners", icon: "🖼️" },
      { name: "وبلاگ و مقالات سئو", href: "/admin/blog", icon: "📚" },
      { name: "رادار اخبار فناوری", href: "/admin/news", icon: "📡" },
      { name: "منو و دسته‌بندی‌ها", href: "/admin/menu", icon: "🔗" },
      { name: "پیام‌ها و تیکت‌ها", href: "/admin/messages", icon: "📩" },
      { name: "دیدگاه‌ها و نظرات", href: "/admin/reviews", icon: "⭐" },
    ],
  },
  {
    groupTitle: "هوش مصنوعی و هویت بصری",
    items: [
      { name: "مرکز هوش مصنوعی (AI Suite)", href: "/admin/ai", icon: "🤖" },
      { name: "هویت بصری و فونت‌ها", href: "/admin/styles", icon: "✨" },
    ],
  },
  {
    groupTitle: "سیستم و امنیت هسته",
    items: [
      { name: "ماتریس دسترسی‌ها (RBAC)", href: "/admin/roles", icon: "🛡️" },
      { name: "لاگ‌های امنیتی (Audit)", href: "/admin/audit-logs", icon: "📝" },
      { name: "پشتیبان‌گیری دیتابیس", href: "/admin/backup", icon: "💾" },
      { name: "تنظیمات عمومی فروشگاه", href: "/admin/settings", icon: "⚙️" },
      { name: "تغییر کلمه عبور و پین", href: "/admin/change-pin", icon: "🔐" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    window.location.href = "/admin/login";
  };

  return (
    <>
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xl font-bold text-lg cursor-pointer"
          aria-label="منوی مدیریت"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 right-0 z-40 w-72 shrink-0 bg-[var(--modal-bg)] border-l border-[var(--card-border)] h-screen overflow-y-auto flex flex-col justify-between p-4 font-sans shadow-xl transition-transform duration-350 ${
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
        dir="rtl"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 px-2 py-2 border-b border-[var(--card-border)] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/25">
              ⚡
            </div>
            <div>
              <span className="font-black text-xs text-[var(--text-primary)] block tracking-tight">آکسون کور | Axon</span>
              <span className="text-[10px] font-mono text-blue-500 font-bold tracking-wider block">ENTERPRISE PANEL</span>
            </div>
          </div>

          <nav className="space-y-4">
            {NAV_SECTIONS.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 px-3 block uppercase tracking-wider">
                  {sec.groupTitle}
                </span>
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          soundEngine.playClick();
                          setMobileOpen(false);
                        }}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                            : "text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="text-sm shrink-0 opacity-90">{item.icon}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-[var(--card-border)] space-y-2 mt-4">
          <Link
            href="/"
            target="_blank"
            onClick={() => soundEngine.playClick()}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-[var(--input-bg)] text-[var(--text-primary)] hover:border-blue-500 border border-[var(--card-border)] transition cursor-pointer"
          >
            <span>مشاهده ویترین فروشگاه</span>
            <span className="text-sm">↗</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <span>خروج از پنل مدیریت</span>
            <span>🚪</span>
          </button>
        </div>
      </aside>
    </>
  );
}
