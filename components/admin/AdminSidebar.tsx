"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import { canRoleWriteModule } from "@/lib/roleWriteFirewall";

export interface SidebarNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: string;
  permKey: string;
  requiredPerm: string[];
}

export const UNIFIED_ADMIN_NAV: SidebarNavItem[] = [
  { id: "dashboard", permKey: "dashboard", label: "داشبورد تحلیلی و فرماندهی", href: "/admin/dashboard", icon: "📊", requiredPerm: ["dashboard", "all"] },
  { id: "inventory_hub", permKey: "inventory", label: "حسابداری، انبار، سفارشات و مالی", href: "/admin/inventory", icon: "🏛️", badge: "یکپارچه", requiredPerm: ["inventory", "orders", "financial", "reports", "all"] },
  { id: "products", permKey: "products", label: "کاتالوگ محصولات و قیمت‌ها", href: "/admin/products", icon: "🛍️", requiredPerm: ["products", "all"] },
  { id: "torob", permKey: "products", label: "مرکز آمار و رادار زنده تُرب", href: "/admin/torob", icon: "🔍", badge: "ترب", requiredPerm: ["products", "seo", "reports", "all"] },
  { id: "banners", permKey: "banners", label: "بنرها و اسلایدر محصولات", href: "/admin/banners", icon: "🖼️", requiredPerm: ["banners", "all"] },
  { id: "customers", permKey: "customers", label: "مشتریان (CRM) و پیامک", href: "/admin/customers", icon: "👥", requiredPerm: ["customers", "all"] },
  { id: "coupons", permKey: "coupons", label: "کدهای تخفیف زمان‌دار و هدفمند", href: "/admin/coupons", icon: "🏷️", requiredPerm: ["coupons", "all"] },
  { id: "appearance_hub", permKey: "appearance", label: "استودیوی ظاهر، منوها و صفحه‌ساز", href: "/admin/appearance", icon: "🎨", badge: "یکپارچه", requiredPerm: ["appearance", "menu", "pages", "all"] },
  { id: "styles", permKey: "styles", label: "هویت بصری، فونت‌ها و CSS", href: "/admin/styles", icon: "✨", requiredPerm: ["appearance", "styles", "all"] },
  { id: "seo", permKey: "seo", label: "دستیار تخصصی سئو (رنک ۱)", href: "/admin/seo", icon: "🚀", badge: "SEO", requiredPerm: ["seo", "all"] },
  { id: "blog", permKey: "blog", label: "وبلاگ و مقالات سئو (متصل به کالا)", href: "/admin/blog", icon: "📚", requiredPerm: ["blog", "seo", "all"] },
  { id: "news", permKey: "news", label: "رادار خودکار اخبار فناوری", href: "/admin/news", icon: "📡", requiredPerm: ["news", "seo", "all"] },
  { id: "ai", permKey: "ai", label: "مرکز هوش مصنوعی و کوپایلوت", href: "/admin/ai", icon: "🤖", requiredPerm: ["ai", "all"] },
  { id: "messages", permKey: "messages", label: "تیکت‌ها و پیام‌های کاربران", href: "/admin/messages", icon: "📩", requiredPerm: ["messages", "all"] },
  { id: "reviews", permKey: "reviews", label: "دیدگاه‌ها و رضایت خریداران", href: "/admin/reviews", icon: "⭐", requiredPerm: ["reviews", "all"] },
  { id: "roles", permKey: "roles", label: "مدیران و ماتریس دسترسی‌ها", href: "/admin/roles", icon: "🛡️", requiredPerm: ["roles", "all"] },
  { id: "change_pin", permKey: "change_pin", label: "تغییر رمز عبور و پین امنیتی", href: "/admin/change-pin", icon: "🔐", requiredPerm: ["settings", "all"] },
  { id: "audit_logs", permKey: "audit_logs", label: "لاگ‌های امنیتی و اسکنر هوشمند", href: "/admin/audit-logs", icon: "🚨", requiredPerm: ["audit_logs", "all"] },
  { id: "backup", permKey: "backup", label: "بکاپ خودکار روزانه و بازیابی", href: "/admin/backup", icon: "💾", requiredPerm: ["backup", "all"] },
  { id: "settings", permKey: "settings", label: "تنظیمات کلان و حالت تعمیرات", href: "/admin/settings", icon: "⚙️", requiredPerm: ["settings", "all"] },
];

export function AdminSidebar(props: any = {}) {
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<{
    username?: string;
    role?: string;
    permissions?: string[];
  } | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({});
  const [sidebarFontSize, setSidebarFontSize] = useState<number>(12);
  const [isEditingLabels, setIsEditingLabels] = useState(false);
  const [savingLabels, setSavingLabels] = useState(false);

  const fetchSessionAndLabels = async () => {
    try {
      const [authRes, tbRes] = await Promise.all([
        fetch("/api/admin/auth?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
        fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
      ]);
      if (authRes && authRes.ok) {
        const json = await authRes.json();
        if (json.authenticated && json.user) setAdminUser(json.user);
      }
      if (tbRes && tbRes.ok) {
        const tbJson = await tbRes.json();
        const saved = tbJson?.config?.adminSidebarLabels || {};
        if (saved.labels) setCustomLabels(saved.labels);
        else if (typeof saved === "object") setCustomLabels(saved);
        if (saved.icons) setCustomIcons(saved.icons);
        if (saved.fontSize) setSidebarFontSize(Number(saved.fontSize));
      }
    } catch {
    } finally {
      setSessionLoaded(true);
    }
  };

  useEffect(() => {
    fetchSessionAndLabels();
    const ch = supabase
      .channel("realtime-sidebar-permissions")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        fetchSessionAndLabels();
      })
      .subscribe();
    window.addEventListener("theme_builder_updated", fetchSessionAndLabels);
    return () => {
      supabase.removeChannel(ch);
      window.removeEventListener("theme_builder_updated", fetchSessionAndLabels);
    };
  }, []);

  const userRole = adminUser?.role || "viewer_reporter";
  const isSuper = userRole === "superadmin";
  const userPerms = adminUser?.permissions || (sessionLoaded ? ["dashboard"] : []);

  const handleSaveCustomLabels = async () => {
    if (!isSuper) return;
    soundEngine.playClick();
    setSavingLabels(true);
    try {
      const res = await fetch("/api/theme-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            adminSidebarLabels: {
              labels: customLabels,
              icons: customIcons,
              fontSize: sidebarFontSize,
            },
          },
        }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        setIsEditingLabels(false);
      }
    } finally {
      setSavingLabels(false);
    }
  };

  const allowedMenuItems = UNIFIED_ADMIN_NAV.filter((item) => {
    if (!sessionLoaded) return item.id === "dashboard";
    if (isSuper) return true;
    // صفحه مدیریت مدیران (/admin/roles) و تغییر پین فقط مخصوص مالک سایت (superadmin) است
    if (item.id === "roles" || item.id === "change_pin") return false;
    return item.requiredPerm.some((p) => userPerms.includes(p));
  });

  const getRoleBadgeLabel = (role?: string) => {
    if (role === "superadmin") return "👑 مدیر ارشد کل سیستم";
    if (role === "product_manager") return "📦 مدیر کاتالوگ و انبار";
    if (role === "order_manager") return "💳 پشتیبان سفارشات و مالی";
    if (role === "content_seo_manager") return "🚀 کارشناس محتوا و سئو";
    if (role === "viewer_reporter") return "👁️ بیننده و گزارش‌دهنده (فقط مشاهده)";
    return "🛡 مدیر سیستم";
  };

  return (
    <>
      <div className="lg:hidden flex items-center justify-between p-3.5 m-3 mb-0 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-black">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <span>پنل فرماندهی آکسون</span>
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
          "w-full lg:w-72 shrink-0 bg-[var(--modal-bg)] border-l border-[var(--card-border)] p-4 shadow-2xl font-sans select-text space-y-4 transition-all " +
          (mobileOpen ? "block" : "hidden lg:block")
        }
        dir="rtl"
      >
        <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-[var(--accent-blue)]">AXON ADMIN OS</span>
            {/* دکمه ویرایش منوها منحصراً برای مدیر ارشد (superadmin) نمایش داده می‌شود */}
            {isSuper && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setIsEditingLabels(!isEditingLabels);
                }}
                className="px-2 py-0.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[10px] font-bold cursor-pointer"
              >
                {isEditingLabels ? "✕ بستن" : "✏️ ویرایش منوها"}
              </button>
            )}
          </div>
          <div className="text-[11px] font-bold text-[var(--text-primary)] truncate">
            {adminUser?.username ? "حساب: @" + adminUser.username : "در حال بررسی نشست..."}
          </div>
          <div
            className={
              "text-[10px] font-black " +
              (userRole === "viewer_reporter" ? "text-amber-400" : "text-emerald-400")
            }
          >
            {getRoleBadgeLabel(userRole)}
          </div>
        </div>

        {isSuper && isEditingLabels && (
          <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)] space-y-2.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-black text-[var(--accent-blue)]">سایز فونت منو:</span>
              <span className="font-mono font-bold">{sidebarFontSize}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={16}
              value={sidebarFontSize}
              onChange={(e) => setSidebarFontSize(Number(e.target.value))}
              className="w-full accent-[var(--accent-blue)] cursor-pointer"
            />
            <div className="font-black text-[var(--accent-blue)]">✏️ تغییر نام و آیکون منوها:</div>
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {UNIFIED_ADMIN_NAV.map((item) => (
                <div key={item.id} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customIcons[item.id] !== undefined ? customIcons[item.id] : item.icon}
                    onChange={(e) =>
                      setCustomIcons((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="w-8 p-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-center outline-none"
                  />
                  <input
                    type="text"
                    value={customLabels[item.id] !== undefined ? customLabels[item.id] : item.label}
                    onChange={(e) =>
                      setCustomLabels((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="flex-1 p-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 pt-1">
              <button
                type="button"
                disabled={savingLabels}
                onClick={handleSaveCustomLabels}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black cursor-pointer"
              >
                {savingLabels ? "در حال ذخیره..." : "💾 ذخیره منوها"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomLabels({});
                  setCustomIcons({});
                  setSidebarFontSize(12);
                }}
                className="px-2.5 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
              >
                پیش‌فرض
              </button>
            </div>
          </div>
        )}

        <nav
          style={{ fontSize: sidebarFontSize + "px" }}
          className="space-y-1.5 max-h-[72vh] overflow-y-auto pr-1"
        >
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
                  pathname?.startsWith("/admin/menu") ||
                  pathname?.startsWith("/admin/pages")));

            const displayLabel =
              customLabels[item.id] && String(customLabels[item.id]).trim() !== ""
                ? customLabels[item.id]
                : item.label;
            const displayIcon =
              customIcons[item.id] && String(customIcons[item.id]).trim() !== ""
                ? customIcons[item.id]
                : item.icon;

            const isReadOnlyItem = !isSuper && !canRoleWriteModule(userRole, item.permKey);

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
                  <span className="text-sm shrink-0">{displayIcon}</span>
                  <span className="truncate">{displayLabel}</span>
                </div>
                {isReadOnlyItem ? (
                  <span
                    className={
                      "px-1.5 py-0.5 rounded-md text-[9px] font-black shrink-0 " +
                      (isActive
                        ? "bg-black/25 text-amber-200"
                        : "bg-amber-500/15 text-amber-400")
                    }
                    title="فقط مشاهده (بدون امکان ویرایش)"
                  >
                    👁️ مشاهده
                  </span>
                ) : item.badge ? (
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
                ) : null}
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
