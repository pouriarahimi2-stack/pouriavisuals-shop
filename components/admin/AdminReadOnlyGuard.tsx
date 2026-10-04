"use client";
// File Path: components/admin/AdminReadOnlyGuard.tsx
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { canRoleWriteOnAdminPage, canRoleMutateApi } from "@/lib/roleWriteFirewall";

const ROUTE_PERM_MAP: Array<{ prefix: string; perms: string[] }> = [
  { prefix: "/admin/dashboard", perms: ["dashboard", "all"] },
  { prefix: "/admin/inventory", perms: ["inventory", "orders", "financial", "reports", "all"] },
  { prefix: "/admin/orders", perms: ["orders", "inventory", "all"] },
  { prefix: "/admin/financial", perms: ["financial", "inventory", "all"] },
  { prefix: "/admin/reports", perms: ["reports", "inventory", "all"] },
  { prefix: "/admin/products", perms: ["products", "all"] },
  { prefix: "/admin/torob", perms: ["products", "seo", "reports", "all"] },
  { prefix: "/admin/banners", perms: ["banners", "all"] },
  { prefix: "/admin/customers", perms: ["customers", "all"] },
  { prefix: "/admin/coupons", perms: ["coupons", "all"] },
  { prefix: "/admin/appearance", perms: ["appearance", "menu", "pages", "all"] },
  { prefix: "/admin/menu", perms: ["menu", "appearance", "all"] },
  { prefix: "/admin/pages", perms: ["pages", "appearance", "all"] },
  { prefix: "/admin/styles", perms: ["styles", "appearance", "all"] },
  { prefix: "/admin/seo", perms: ["seo", "all"] },
  { prefix: "/admin/blog", perms: ["blog", "seo", "all"] },
  { prefix: "/admin/news", perms: ["news", "seo", "all"] },
  { prefix: "/admin/ai", perms: ["ai", "all"] },
  { prefix: "/admin/messages", perms: ["messages", "all"] },
  { prefix: "/admin/reviews", perms: ["reviews", "all"] },
  { prefix: "/admin/audit-logs", perms: ["audit_logs", "all"] },
  { prefix: "/admin/backup", perms: ["backup", "all"] },
  { prefix: "/admin/settings", perms: ["settings", "all"] },
  { prefix: "/admin/roles", perms: ["roles", "all"] },
];

export default function AdminReadOnlyGuard() {
  const pathname = usePathname() || "/admin/dashboard";
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{
    username?: string;
    role?: string;
    permissions?: string[];
  } | null>(null);
  const [blockedAlert, setBlockedAlert] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.authenticated && json.user) {
          setAdminUser(json.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // ۱. بررسی اینکه آیا مدیر ارشد تیک مشاهده این منو را برای این کاربر زده است یا خیر
  useEffect(() => {
    if (!adminUser) return;
    const isSuper =
      adminUser.role === "superadmin" || (adminUser.permissions || []).includes("all");
    if (isSuper) return;

    const userPerms = adminUser.permissions || ["dashboard"];
    const matchedRule = ROUTE_PERM_MAP.find((r) => pathname.startsWith(r.prefix));
    if (matchedRule) {
      const hasAccess = matchedRule.perms.some((p) => userPerms.includes(p));
      if (!hasAccess) {
        router.replace("/admin/dashboard");
      }
    }
  }, [adminUser, pathname, router]);

  const role = adminUser?.role || "superadmin";
  const isSuperAdmin = role === "superadmin";
  const isCurrentPageReadOnly =
    Boolean(adminUser) && !isSuperAdmin && !canRoleWriteOnAdminPage(role, pathname);

  // ۲. مسدودسازی ارسال فرم‌ها و درخواست‌های تغییر (POST/PUT/PATCH/DELETE) در بخش‌های غیرمرتبط با نقش
  useEffect(() => {
    if (!adminUser || isSuperAdmin || typeof window === "undefined") return;

    const triggerAlert = () => {
      try {
        soundEngine.playClick();
      } catch {}
      setBlockedAlert(
        "⛔ دسترسی فقط مشاهده (Read-Only): بر اساس نقش سازمانی شما، مشاهده این بخش مجاز است اما امکان ذخیره، ویرایش یا حذف اطلاعات در این قسمت وجود ندارد."
      );
      setTimeout(() => setBlockedAlert(null), 4200);
    };

    const handleFormSubmit = (e: Event) => {
      if (isCurrentPageReadOnly) {
        e.preventDefault();
        e.stopPropagation();
        triggerAlert();
      }
    };

    const originalFetch = window.fetch;
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const method = (init?.method || "GET").toUpperCase();
      const urlStr = typeof input === "string" ? input : input.toString();

      if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
        let apiPath = urlStr;
        try {
          if (urlStr.startsWith("http")) {
            apiPath = new URL(urlStr).pathname;
          }
        } catch {}

        if (apiPath.startsWith("/api/") && !canRoleMutateApi(role, apiPath)) {
          triggerAlert();
          return new Response(
            JSON.stringify({
              success: false,
              readOnly: true,
              message:
                "⛔ بر اساس نقش سازمانی شما، این بخش در حالت «فقط مشاهده» قرار دارد و امکان تغییر اطلاعات وجود ندارد.",
            }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }
      return originalFetch.apply(this, [input, init as any]);
    };

    document.addEventListener("submit", handleFormSubmit, true);
    return () => {
      window.fetch = originalFetch;
      document.removeEventListener("submit", handleFormSubmit, true);
    };
  }, [adminUser, isSuperAdmin, isCurrentPageReadOnly, role]);

  if (!isCurrentPageReadOnly) return null;

  return (
    <div className="mb-4 space-y-2 font-sans select-text" dir="rtl">
      <div className="p-3.5 px-5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-500 text-xs font-black flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-base">👁️</span>
          <span>
            حالت فقط مشاهده (Read-Only): این بخش توسط مدیر ارشد صرفاً جهت مشاهده و گزارش‌گیری برای نقش شما باز شده است و امکان ویرایش یا حذف اطلاعات در این قسمت وجود ندارد.
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-mono text-[10px] font-black">
          VIEW ONLY SCOPE
        </span>
      </div>

      {blockedAlert && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border-2 border-rose-500 text-rose-400 text-xs font-black animate-bounce shadow-xl">
          {blockedAlert}
        </div>
      )}
    </div>
  );
}
