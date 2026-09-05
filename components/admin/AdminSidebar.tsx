"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

interface NavGroup {
  group: string;
  items: {
    id: string;
    title: string;
    href: string;
    icon: string;
    badge?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    group: "فروشگاه و محصولات",
    items: [
      { id: "dashboard", title: "داشبورد و آمار زنده", href: "/admin", icon: "📊" },
      { id: "products", title: "کاتالوگ کالاها", href: "/admin/products", icon: "📦" },
      { id: "inventory", title: "موجودی و انبار", href: "/admin/inventory", icon: "📥" },
      { id: "orders", title: "سفارش‌ها و فاکتورها", href: "/admin/orders", icon: "📄" },
      { id: "coupons", title: "کدهای تخفیف", href: "/admin/coupons", icon: "🏷️" },
    ],
  },
  {
    group: "مخاطبان و ارتباطات",
    items: [
      { id: "customers", title: "باشگاه مشتریان (CRM)", href: "/admin/customers", icon: "👥" },
      { id: "messages", title: "پیام‌ها و تیکت‌ها", href: "/admin/messages", icon: "📩" },
    ],
  },
  {
    group: "محتوا، سئو و هوش مصنوعی",
    items: [
      { id: "blog", title: "مجله و مقالات سئو", href: "/admin/blog", icon: "📚" },
      { id: "news", title: "اخبار تکنولوژی", href: "/admin/news", icon: "📡" },
      { id: "ai_suite", title: "هوش مصنوعی Master Suite", href: "/admin/ai", icon: "🤖" },
      { id: "pages", title: "صفحه‌ساز ماژولار", href: "/admin/pages", icon: "🏗️" },
    ],
  },
  {
    group: "طراحی و تنظیمات پایه",
    items: [
      { id: "banners", title: "اسلایدر صفحه نخست", href: "/admin/banners", icon: "🖼️" },
      { id: "menu", title: "منوها و دسته‌بندی‌ها", href: "/admin/menu", icon: "🔗" },
      { id: "styles", title: "هویت بصری و فونت", href: "/admin/styles", icon: "🎨" },
      { id: "site_info", title: "تنظیمات عمومی سایت", href: "/admin/settings", icon: "⚙️" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    soundEngine.playClick();
    if (!confirm("آیا قصد خروج از پیشخوان مدیریت را دارید؟")) return;
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <aside className="w-72 bg-[var(--modal-bg)] border-l border-[var(--card-border)] flex flex-col justify-between p-5 min-h-screen select-none font-sans" dir="rtl">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[var(--accent-blue)] text-white flex items-center justify-center text-lg font-black shadow-lg">
              ⚡
            </span>
            <div>
              <h1 className="text-sm font-black text-[var(--text-primary)]">پیشخوان آکسون</h1>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium">مدیریت تخصصی استودیو</p>
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition"
            title="مشاهده ویترین سایت"
          >
            ↗
          </Link>
        </div>

        <nav className="space-y-5 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1.5">
              <span className="text-[10px] font-black text-[var(--text-secondary)] px-2 block uppercase tracking-wider">
                {group.group}
              </span>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => soundEngine.playClick()}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition duration-200 ${
                        isActive
                          ? "bg-[var(--accent-blue)] text-white shadow-md shadow-blue-500/20"
                          : "text-[var(--text-primary)] hover:bg-[var(--input-bg)] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] bg-white/20 text-white font-mono font-black">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-[var(--card-border)]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-500 text-xs font-black transition cursor-pointer"
        >
          <span>🚪</span>
          <span>خروج از حساب ادمین</span>
        </button>
      </div>
    </aside>
  );
}
