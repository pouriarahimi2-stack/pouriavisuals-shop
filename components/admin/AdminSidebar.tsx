// File Path: components/admin/AdminSidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

export interface SidebarNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: string;
  requiredPerm: string[];
}

const UNIFIED_ADMIN_NAV: SidebarNavItem[] = [
  {
    id: "dashboard",
    label: "داشبورد تحلیلی و فرماندهی",
    href: "/admin/dashboard",
    icon: "📊",
    requiredPerm: ["dashboard", "all"],
  },
  {
    id: "inventory_hub",
    label: "حسابداری، انبار، سفارشات و مالی",
    href: "/admin/inventory",
    icon: "🏛️",
    badge: "یکپارچه",
    requiredPerm: ["inventory", "orders", "financial", "reports", "all"],
  },
  {
    id: "products",
    label: "کاتالوگ محصولات و قیمت‌ها",
    href: "/admin/products",
    icon: "🛍️",
    requiredPerm: ["products", "all"],
  },
  {
    id: "customers",
    label: "مشتریان (CRM) و پیامک",
    href: "/admin/customers",
    icon: "👥",
    requiredPerm: ["customers", "all"],
  },
  {
    id: "coupons",
    label: "کدهای تخفیف زمان‌دار و هدفمند",
    href: "/admin/coupons",
    icon: "🏷️",
    requiredPerm: ["coupons", "all"],
  },
  {
    id: "appearance_hub",
    label: "استودیوی ظاهر، هدر، فوتر و منوها",
    href: "/admin/appearance",
    icon: "🎨",
    badge: "یکپارچه",
    requiredPerm: ["appearance", "menu", "all"],
  },
  {
    id: "pages",
    label: "صفحه‌ساز ماژولار (ریسپانسیو)",
    href: "/admin/pages",
    icon: "⚡",
    requiredPerm: ["pages", "all"],
  },
  {
    id: "styles",
    label: "هویت بصری، فونت‌ها و CSS",
    href: "/admin/styles",
    icon: "✨",
    requiredPerm: ["appearance", "styles", "all"],
  },
  {
    id: "banners",
    label: "بنرها و اسلایدر کاتالوگ",
    href: "/admin/banners",
    icon: "🖼️",
    requiredPerm: ["banners", "all"],
  },
  {
    id: "seo",
    label: "دستیار تخصصی سئو (رنک ۱)",
    href: "/admin/seo",
    icon: "🚀",
    badge: "SEO",
    requiredPerm: ["seo", "all"],
  },
  {
    id: "blog",
    label: "وبلاگ و مقالات سئو (متصل به کالا)",
    href: "/admin/blog",
    icon: "📚",
    requiredPerm: ["blog", "seo", "all"],
  },
  {
    id: "news",
    label: "رادار خودکار اخبار فناوری",
    href: "/admin/news",
    icon: "📡",
    requiredPerm: ["news", "seo", "all"],
  },
  {
    id: "ai",
    label: "مرکز هوش مصنوعی و کوپایلوت",
    href: "/admin/ai",
    icon: "🤖",
    requiredPerm: ["ai", "all"],
  },
  {
    id: "messages",
    label: "تیکت‌ها و پیام‌های کاربران",
    href: "/admin/messages",
    icon: "📩",
    requiredPerm: ["messages", "all"],
  },
  {
    id: "reviews",
    label: "دیدگاه‌ها و رضایت خریداران",
    href: "/admin/reviews",
    icon: "⭐",
    requiredPerm: ["reviews", "all"],
  },
  {
    id: "roles",
    label: "مدیران و ماتریس دسترسی‌ها",
    href: "/admin/roles",
    icon: "🛡️",
    requiredPerm: ["roles", "all"],
  },
  {
    id: "change_pin",
    label: "تغییر رمز عبور و پین امنیتی",
    href: "/admin/change-pin",
    icon: "🔐",
    requiredPerm: ["dashboard", "all"],
  },
  {
    id: "audit_logs",
    label: "لاگ‌های امنیتی و اسکنر هوشمند",
    href: "/admin/audit-logs",
    icon: "🚨",
    requiredPerm: ["audit_logs", "all"],
  },
  {
    id: "backup",
    label: "بکاپ خودکار روزانه و بازیابی",
    href: "/admin/backup",
    icon: "💾",
    requiredPerm: ["backup", "all"],
  },
  {
    id: "settings",
    label: "تنظیمات کلان و حالت تعمیرات",
    href: "/admin/settings",
    icon: "⚙️",
    requiredPerm: ["settings", "all"],
  },
];

export function AdminSidebar(props: any = {}) {
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<{
    username?: string;
    role?: string;
    permissions?: string[];
  } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchSessionPermissions = async () => {
    try {
      const res = await fetch("/api/admin/auth", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.authenticated && json.user) {
        setAdminUser(json.user);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSessionPermissions();

    const ch = supabase
      .channel("realtime-sidebar-permissions")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        fetchSessionPermissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const userPerms = adminUser?.permissions || ["all"];
  const isSuper =
    adminUser?.role === "superadmin" || userPerms.includes("all");

  const allowedMenuItems = UNIFIED_ADMIN_NAV.filter((item) => {
    if (isSuper) return true;
    return item.requiredPerm.some((p) => userPerms.includes(p));
  });

  const getRoleBadgeLabel = (role?: string) => {
    if (role === "superadmin") return "👑 مدیر ارشد کل سیستم";
    if (role === "product_manager") return "📦 مدیر کاتالوگ و انبار";
    if (role === "order_manager") return "💳 پشتیبان سفارشات و مالی";
    if (role === "content_seo_manager") return "🚀 کارشناس محتوا و سئو";
    if (role === "viewer_reporter") return "👁️ بیننده و گزارش‌دهنده";
    return "🛡️️ مدیر سیستم";
  };

  return (
    <>
      {/* نوار بالای موبایل و تبلت برای باز کردن منو */}
      <div className="lg:hidden flex items-center justify-between p-3.5 mb-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-black">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <span>پنل فرماندهی آکسون</span>
          {adminUser?.role && (
            <span className="px-2 py-0.5 rounded-lg bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-[10px]">
              {getRoleBadgeLabel(adminUser.role)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setMobileOpen(!mobileOpen);
          }}
          className="px-3.5 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer"
        >
          {mobileOpen ? "✕ بستن منو" : "☰ منوی مدیریت"}
        </button>
      </div>

      <aside
        className={
          "w-full lg:w-72 shrink-0 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 shadow-2xl font-sans select-none space-y-4 transition-all " +
          (mobileOpen ? "block" : "hidden lg:block")
        }
        dir="rtl"
      >
        <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-[var(--accent-blue)]">AXON ADMIN OS</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-[11px] font-bold text-[var(--text-primary)] truncate">
            {adminUser?.username ? "حساب: @" + adminUser.username : "مدیریت یکپارچه سایت"}
          </div>
          <div className="text-[10px] font-bold text-emerald-400">
            {getRoleBadgeLabel(adminUser?.role)}
          </div>
        </div>

        <nav className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1 text-xs">
          {allowedMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.id === "inventory_hub" &&
                (pathname?.startsWith("/admin/inventory") ||
                  pathname?.startsWith("/admin/orders") ||
                  pathname?.startsWith("/admin/financial") ||
                  pathname?.startsWith("/admin/reports"))) ||
              (item.id === "appearance_hub" &&
                (pathname?.startsWith("/admin/appearance") ||
                  pathname?.startsWith("/admin/menu")));

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  soundEngine.playClick();
                  setMobileOpen(false);
                  if (typeof props.onSelectTab === "function") {
                    props.onSelectTab(item.id);
                  }
                }}
                className={
                  "flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl font-bold transition " +
                  (isActive
                    ? "bg-[var(--accent-blue)] text-white shadow-lg font-black"
                    : "text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]")
                }
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-sm shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={
                      "px-2 py-0.5 rounded-md text-[9px] font-black shrink-0 " +
                      (isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]")
                    }
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between text-[11px]">
          <Link
            href="/"
            target="_blank"
            className="font-bold text-[var(--accent-blue)] hover:underline"
          >
            🌐 مشاهده زنده فروشگاه
          </Link>
          <span className="font-mono text-[10px] text-slate-400">
            {allowedMenuItems.length} ماژول فعال
          </span>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
