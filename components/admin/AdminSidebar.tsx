"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

const NAV = [
  {
    group: "مدیریت فروش",
    items: [
      { name: "داشبورد",             href: "/admin/dashboard",  icon: "📊" },
      { name: "سفارشات",             href: "/admin/financial",  icon: "📦" },
      { name: "مشتریان و CRM",        href: "/admin/customers",  icon: "👥" },
      { name: "حسابداری و انبار",    href: "/admin/inventory",  icon: "📈" },
      { name: "گزارش‌های مالی",      href: "/admin/reports",    icon: "📑" },
      { name: "کدهای تخفیف",         href: "/admin/coupons",    icon: "🏷️" },
    ],
  },
  {
    group: "ویترین",
    items: [
      { name: "استودیوی ظاهر",       href: "/admin/appearance", icon: "🎨" },
      { name: "محصولات",             href: "/admin/products",   icon: "💻" },
      { name: "بنرها",               href: "/admin/banners",    icon: "🖼️" },
      { name: "صفحه‌ساز",            href: "/admin/pages",      icon: "📐" },
      { name: "وبلاگ و مقالات",      href: "/admin/blog",       icon: "📚" },
      { name: "اخبار فناوری",        href: "/admin/news",       icon: "📡" },
      { name: "منو و دسته‌بندی",     href: "/admin/menu",       icon: "🔗" },
      { name: "پیام‌ها",             href: "/admin/messages",   icon: "📩" },
      { name: "دیدگاه‌ها",           href: "/admin/reviews",    icon: "⭐" },
    ],
  },
  {
    group: "هوش مصنوعی",
    items: [
      { name: "مرکز AI",             href: "/admin/ai",         icon: "🤖" },
      { name: "هویت بصری",           href: "/admin/styles",     icon: "✨" },
      { name: "سئو",                 href: "/admin/seo",        icon: "🔍" },
    ],
  },
  {
    group: "سیستم",
    items: [
      { name: "دسترسی‌ها",           href: "/admin/roles",      icon: "🛡️" },
      { name: "لاگ‌های امنیتی",      href: "/admin/audit-logs", icon: "📝" },
      { name: "پشتیبان‌گیری",        href: "/admin/backup",     icon: "💾" },
      { name: "تنظیمات",             href: "/admin/settings",   icon: "⚙️" },
      { name: "رمز عبور",            href: "/admin/change-pin", icon: "🔐" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open,   setOpen]   = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/admin/messages?count=true")
      .then(r => r.json())
      .then(d => { if (d.unread) setUnread(d.unread); })
      .catch(() => {});
  }, []);

  const logout = async () => {
    soundEngine.playClick();
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/admin/login";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* لوگو */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--card-border)] shrink-0">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-md shrink-0">⚡</div>
        <div className="min-w-0">
          <span className="font-black text-xs text-[var(--text-primary)] block truncate">آکسون کور</span>
          <span className="text-[9px] font-mono text-blue-500 font-bold block">ADMIN PANEL</span>
        </div>
      </div>

      {/* منو */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-3 px-3">
        {NAV.map((sec, si) => (
          <div key={si} className="space-y-0.5">
            <span className="text-[9px] font-black text-slate-400 px-2 block uppercase tracking-wider mb-1">{sec.group}</span>
            {sec.items.map(item => {
              const isActive  = pathname === item.href || pathname.startsWith(item.href + "/");
              const hasUnread = item.href === "/admin/messages" && unread > 0;
              return (
                <Link key={item.href} href={item.href}
                  onClick={() => { soundEngine.playClick(); setOpen(false); }}
                  className={"flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer " + (isActive ? "bg-blue-600 text-white shadow" : "text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]")}>
                  <span className="flex items-center gap-2 truncate">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </span>
                  {hasUnread && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono flex items-center justify-center shrink-0">{unread}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* پایین */}
      <div className="border-t border-[var(--card-border)] p-3 space-y-1.5 shrink-0">
        <Link href="/" target="_blank" onClick={() => soundEngine.playClick()}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--card-border)] hover:border-blue-500 transition cursor-pointer">
          <span>مشاهده سایت</span><span>↗</span>
        </Link>
        <button onClick={logout}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer">
          <span>خروج</span><span>🚪</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* دسکتاپ و تبلت — sidebar ثابت */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 shrink-0 bg-[var(--modal-bg)] border-l border-[var(--card-border)] h-screen sticky top-0 shadow-xl overflow-hidden" dir="rtl">
        <SidebarContent />
      </aside>

      {/* موبایل — دکمه float */}
      <div className="md:hidden fixed bottom-[72px] left-3 z-50">
        <button onClick={() => setOpen(!open)}
          className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xl font-bold text-base cursor-pointer active:scale-95 transition">
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* موبایل — overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* موبایل — drawer از سمت راست */}
      <aside
        className={"md:hidden fixed inset-y-0 right-0 z-50 w-72 bg-[var(--modal-bg)] border-l border-[var(--card-border)] shadow-2xl transition-transform duration-300 overflow-hidden " + (open ? "translate-x-0" : "translate-x-full")}
        dir="rtl"
      >
        <SidebarContent />
      </aside>
    </>
  );
}
