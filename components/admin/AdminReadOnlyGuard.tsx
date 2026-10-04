"use client";
// File Path: components/admin/AdminReadOnlyGuard.tsx
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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

// تنها دکمه‌هایی که در حالت «فقط مشاهده» باز می‌مانند (جابه‌جایی بین تب‌ها، بستن پنجره، چاپ و دریافت گزارش)
function isSafeNavigationOrViewButton(btn: HTMLElement): boolean {
  const text = (
    (btn.innerText || btn.textContent || "") +
    " " +
    (btn.getAttribute("title") || "") +
    " " +
    (btn.getAttribute("aria-label") || "")
  )
    .trim()
    .toLowerCase();

  if (
    text.includes("ذخیره") ||
    text.includes("حذف") ||
    text.includes("ویرایش") ||
    text.includes("افزودن") ||
    text.includes("ایجاد") ||
    text.includes("آپلود") ||
    text.includes("بهینه‌سازی") ||
    text.includes("ارتقا") ||
    text.includes("تولید") ||
    text.includes("ارسال")
  ) {
    return false;
  }

  const allowedViewKeywords = [
    "✕",
    "بستن",
    "انصراف",
    "مشاهده",
    "چاپ",
    "اکسل",
    "csv",
    "استعلام",
    "بروزرسانی",
    "دسکتاپ",
    "موبایل",
    "تبلت",
    "۱.",
    "۲.",
    "۳.",
    "۴.",
    "۵.",
    "تب ",
    "حسابداری و انبار",
    "سفارشات و صدور",
    "گزارشات مالی",
    "رادار سلامت",
    "اتوپایلوت",
    "کوپایلوت بازار",
  ];

  return allowedViewKeywords.some((kw) => text.includes(kw.toLowerCase()));
}

export default function AdminReadOnlyGuard() {
  const pathname = usePathname() || "/admin/dashboard";
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{
    username?: string;
    role?: string;
    permissions?: string[];
  } | null>(null);

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

  useEffect(() => {
    if (!adminUser) return;
    const isSuper = adminUser.role === "superadmin";
    if (isSuper) return;

    if (pathname.startsWith("/admin/roles") || pathname.startsWith("/admin/change-pin")) {
      router.replace("/admin/dashboard");
      return;
    }

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

  useEffect(() => {
    if (!isCurrentPageReadOnly || typeof document === "undefined") return;

    const lockWorkspaceElements = () => {
      const workspace = document.getElementById("axon-admin-main-workspace");
      if (!workspace) return;

      const inputs = workspace.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >("input, textarea, select");

      inputs.forEach((el) => {
        const placeholder = (el.getAttribute("placeholder") || "").toLowerCase();
        const isSearchBox =
          placeholder.includes("جستجو") ||
          placeholder.includes("search") ||
          placeholder.includes("فیلتر");
        if (isSearchBox) return;

        el.setAttribute("data-axon-readonly-locked", "1");
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.readOnly = true;
        }
        el.disabled = true;
        el.style.opacity = "0.5";
        el.style.cursor = "not-allowed";
        el.style.pointerEvents = "none";
      });

      // قفل کردن تمام دکمه‌های داخل صفحه (شامل دکمه‌های تغییر وضعیت تعمیرات و ایندکس گوگل) به جز تب‌ها و دکمه‌های مشاهده
      const buttons = workspace.querySelectorAll<HTMLButtonElement>("button");
      buttons.forEach((btn) => {
        if (btn.getAttribute("data-axon-readonly-btn") === "1") return;
        if (!isSafeNavigationOrViewButton(btn)) {
          btn.setAttribute("data-axon-readonly-btn", "1");
          btn.disabled = true;
          btn.style.opacity = "0.4";
          btn.style.cursor = "not-allowed";
          btn.style.pointerEvents = "none";
          btn.style.filter = "grayscale(100%)";
        }
      });
    };

    lockWorkspaceElements();
    const observer = new MutationObserver(() => {
      lockWorkspaceElements();
    });

    const workspace = document.getElementById("axon-admin-main-workspace") || document.body;
    observer.observe(workspace, { childList: true, subtree: true });

    const handleCaptureClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest("button");
      const workspaceEl = document.getElementById("axon-admin-main-workspace");
      if (btn && workspaceEl && workspaceEl.contains(btn) && !isSafeNavigationOrViewButton(btn)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleCaptureSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("click", handleCaptureClick, true);
    document.addEventListener("submit", handleCaptureSubmit, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleCaptureClick, true);
      document.removeEventListener("submit", handleCaptureSubmit, true);
    };
  }, [isCurrentPageReadOnly, pathname]);

  useEffect(() => {
    if (!adminUser || isSuperAdmin || typeof window === "undefined") return;

    const originalFetch = window.fetch;
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const method = (init?.method || "GET").toUpperCase();
      const urlStr = typeof input === "string" ? input : input.toString();

      if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
        // اجازه ارسال تله‌متری بازدید دستگاه در پس‌زمینه بدون خطا
        if (urlStr.includes("/api/analytics/device") || urlStr.includes("/api/admin/logout")) {
          return originalFetch.apply(this, [input, init as any]);
        }

        if (urlStr.includes(".supabase.co/rest/") || urlStr.includes(".supabase.co/storage/")) {
          if (isCurrentPageReadOnly || role === "viewer_reporter") {
            return new Response(
              JSON.stringify({ success: false, readOnly: true }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }
        }

        let apiPath = urlStr;
        try {
          if (urlStr.startsWith("http")) {
            apiPath = new URL(urlStr).pathname;
          }
        } catch {}

        if (apiPath.startsWith("/api/") && !canRoleMutateApi(role, apiPath)) {
          return new Response(
            JSON.stringify({
              success: false,
              readOnly: true,
              message: "دسترسی فقط مشاهده (Read-Only)",
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

    return () => {
      window.fetch = originalFetch;
    };
  }, [adminUser, isSuperAdmin, isCurrentPageReadOnly, role]);

  return null;
}
