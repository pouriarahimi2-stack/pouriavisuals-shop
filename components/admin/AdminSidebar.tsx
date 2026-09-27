"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

const NAV = [
  {
    group: "مدیریت فروش",
    items: [
      { name: "داشبورد تحلیلی",      href: "/admin/dashboard",  icon: "📊" },
      { name: "سفارشات و بارنامه",   href: "/admin/financial",  icon: "📦" },
      { name: "مشتریان و CRM",        href: "/admin/customers",  icon: "👥" },
      { name: "حسابداری و انبار",    href: "/admin/inventory",  icon: "📈" },
      { name: "گزارش‌های مالی",      href: "/admin/reports",    icon: "📑" },
      { name: "کدهای تخفیف",         href: "/admin/coupons",    icon: "🏷️" },
    ],
  },
  {
    group: "ویترین و محتوا",
    items: [
      { name: "استودیوی ظاهر",        href: "/admin/appearance", icon: "🎨" },
      { name: "کاتالوگ محصولات",     href: "/admin/products",   icon: "💻" },
      { name: "بنرها و اسلایدر",     href: "/admin/banners",    icon: "🖼️" },
      { name: "صفحه‌ساز ماژولار",    href: "/admin/pages",      icon: "📐" },
      { name: "وبلاگ و مقالات سئو",  href: "/admin/blog",       icon: "📚" },
      { name: "رادار اخبار فناوری",  href: "/admin/news",       icon: "📡" },
      { name: "منو و دسته‌بندی‌ها", href: "/admin/menu",       icon: "🔗" },
      { name: "پیام‌ها و تیکت‌ها",  href: "/admin/messages",   icon: "📩" },
      { name: "دیدگاه‌ها و نظرات",   href: "/admin/reviews",    icon: "⭐" },
    ],
  },
  {
    group: "هوش مصنوعی و طراحی",
    items: [
      { name: "مرکز هوش مصنوعی",     href: "/admin/ai",         icon: "🤖" },
      { name: "هویت بصری و فونت",    href: "/admin/styles",     icon: "✨" },
      { name: "سئو و دیده‌شدن",      href: "/admin/seo",        icon: "🔍" },
    ],
  },
  {
    group: "سیستم و امنیت",
    items: [
      { name: "ماتریس دسترسی‌ها",   href: "/admin/roles",      icon: "🛡️" },
      { name: "لاگ‌های امنیتی",      href: "/admin/audit-logs", icon: "📝" },
      { name: "پشتیبان‌گیری",        href: "/admin/backup",     icon: "💾" },
      { name: "تنظیمات عمومی",       href: "/admin/settings",   icon: "⚙️" },
      { name: "تغییر رمز عبور",      href: "/admin/change-pin", icon: "🔐" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname   = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/admin/messages?count=true").then(r => r.json())
      .then(d => { if (d.unread) setUnread(d.unread); }).catch(() => {});
  }, []);

  const logout = async () => {
    soundEngine.playClick();
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/admin/login";
  };

  return (
    <>
      {/* دکمه موبایل */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button onClick={() => setOpen(!open)}
          className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xl font-bold text-lg cursor-pointer">
          {open ? "✕" : "☰"}
        </button>
      </div>
      {open && <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"/>}

      <aside
        className={`fixed lg:sticky top-0 right-0 z-40 w-72 shrink-0 bg-[var(--modal-bg)] border-l border-[var(--card-border)] h-screen overflow-y-auto flex flex-col justify-between p-4 font-sans shadow-xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
        dir="rtl"
      >
        <div className="space-y-5">
          {/* لوگو */}
          <div className="flex items-center gap-3 px-2 py-2 border-b border-[var(--card-border)] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md">⚡</div>
            <div>
              <span className="font-black text-xs text-[var(--text-primary)] block">آکسون کور | Axon</span>
              <span className="text-[10px] font-mono text-blue-500 font-bold block">ENTERPRISE PANEL</span>
            </div>
          </div>

          {/* منو */}
          <nav className="space-y-4">
            {NAV.map((sec, si) => (
              <div key={si} className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 px-3 block uppercase tracking-wider">{sec.group}</span>
                <div className="space-y-0.5">
                  {sec.items.map(item => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const hasUnread = item.href === "/admin/messages" && unread > 0;
                    return (
                      <Link key={item.href} href={item.href}
                        onClick={() => { soundEngine.playClick(); setOpen(false); }}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md" : "text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]"}`}>
                        <span className="truncate">{item.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasUnread && (
                            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono flex items-center justify-center">{unread}</span>
                          )}
                          <span className="text-sm opacity-90">{item.icon}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* پایین */}
        <div className="pt-4 border-t border-[var(--card-border)] space-y-2 mt-4">
          <Link href="/" target="_blank" onClick={() => soundEngine.playClick()}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--card-border)] hover:border-blue-500 transition cursor-pointer">
            <span>مشاهده ویترین</span><span>↗</span>
          </Link>
          <button onClick={logout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer">
            <span>خروج از پنل</span><span>🚪</span>
          </button>
        </div>
      </aside>
    </>
  );
}
