"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: "داشبورد اصلی", href: "/admin/dashboard", icon: "⚡" },
  { name: "مدیریت سفارشات", href: "/admin/orders", icon: "📦" },
  { name: "کاتالوگ محصولات", href: "/admin/products", icon: "💻" },
  { name: "صفحه‌ساز حرفه‌ای (Puck)", href: "/admin/pages", icon: "🎨" },
  { name: "کدهای تخفیف", href: "/admin/coupons", icon: "🏷️" },
  { name: "بنرها و اسلایدر", href: "/admin/banners", icon: "🖼️" },
  { name: "اخبار و مقالات", href: "/admin/news", icon: "📰" },
  { name: "گزارشات و انبار", href: "/admin/inventory", icon: "📈" },
  { name: "لاگ‌های امنیتی", href: "/admin/audit-logs", icon: "🛡️" },
  { name: "پشتیبان‌گیری داده‌ها", href: "/admin/backup", icon: "💾" },
  { name: "تنظیمات فروشگاه", href: "/admin/settings", icon: "⚙️" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    soundEngine.playClick();
    document.cookie = "admin_session_token=; path=/; max-age=0";
    document.cookie = "admin_logged_in=; path=/; max-age=0";
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    window.location.href = "/admin/login";
  };

  return (
    <aside className="w-64 shrink-0 bg-[var(--modal-bg)] border-l border-[var(--card-border)] min-h-[calc(100vh-65px)] flex flex-col justify-between p-4 font-sans select-none shadow-sm" dir="rtl">
      <div className="space-y-6">
        {/* برند بالای سایدبار */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
            A
          </div>
          <div>
            <span className="font-black text-xs text-[var(--text-primary)] block tracking-tight">آکسون کور</span>
            <span className="text-[10px] font-mono text-blue-500 font-bold tracking-wider block">CONTROL PANEL V1.0</span>
          </div>
        </div>

        {/* لیست منوها */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => soundEngine.playClick()}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "text-[var(--text-primary)] hover:bg-[var(--input-bg)] hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <span className="truncate">{item.name}</span>
                <span className="text-base shrink-0 opacity-90">{item.icon}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* بخش پایینی: مشاهده سایت و خروج */}
      <div className="pt-4 border-t border-[var(--card-border)] space-y-2">
        <Link
          href="/"
          target="_blank"
          onClick={() => soundEngine.playClick()}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-blue-600 hover:bg-[var(--input-bg)] transition cursor-pointer"
        >
          <span>مشاهده فروشگاه</span>
          <span className="text-sm">↗</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
        >
          <span>خروج از مدیریت</span>
          <span>🚪</span>
        </button>
      </div>
    </aside>
  );
}
