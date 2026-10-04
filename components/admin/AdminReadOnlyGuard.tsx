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

// تنها دکمه‌های تغییر تب نمایشی (۱. / ۲. / ۳. / ۴. / ۵.) که هیچ عملیاتی انجام نمی‌دهند و فقط بین تب‌های صفحه جابه‌جا می‌شوند
function isPureSubTabSwitcher(btn: HTMLElement): boolean {
  if (btn.getAttribute("type")?.toLowerCase() === "submit") return false;
  const text = (btn.innerText || btn.textContent || "").trim();

  // اگر دکمه شامل هرگونه عبارت عملیاتی، دانلود، کپی، استعلام، بروزرسانی یا بازیابی باشد، قطعا باید قفل شود
  const forbiddenWords = [
    "ذخیره",
    "ثبت",
    "حذف",
    "ویرایش",
    "افزودن",
    "ایجاد",
    "جدید",
    "آپلود",
    "بارگذاری",
    "بازیابی",
    "دانلود",
    "خروجی",
    "اکسل",
    "csv",
    "json",
    "کپی",
    "استعلام",
    "بروزرسانی",
    "تازه‌سازی",
    "پایش",
    "اسکن",
    "بهینه‌سازی",
    "ارتقا",
    "تولید",
    "ارسال",
    "پاکسازی",
    "بکاپ",
    "تغییر",
    "اعمال",
    "تعمیرات",
    "ایندکس",
    "پاسخ",
    "تایید",
    "لغو",
    "صدور",
    "درج",
    "پیشنهاد",
  ];

  const lower = text.toLowerCase();
  if (forbiddenWords.some((w) => lower.includes(w))) {
    return false;
  }

  // فقط تب‌های شماره‌دار بالای صفحات چندتبی (مثل ۱. حسابداری / ۲. سفارشات / ۳. گزارش مالی)
  return /^[🧭🏛📑🌳⚡🏭📦📈🎯✏️📡💻📊📋🔍🚀📚🤖]*s*[۱۱۲۳۴۵12345]./.test(text);
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

    if (pathname.startsWith("/admin/roles") || pathname.startsWith("/admin/monitoring") || pathname.startsWith("/admin/change-pin")) {
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

    const lockAllInteractiveElements = () => {
      const workspace = document.getElementById("axon-admin-main-workspace");
      if (!workspace) return;

      // ۱. قفل کردن ۱۰۰٪ تمامی input، textarea و select (شامل کادرهای جستجو، فایل، چک‌باکس و اسلایدر)
      const formControls = workspace.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >("input, textarea, select");

      formControls.forEach((el) => {
        el.setAttribute("data-axon-readonly-locked", "1");
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.readOnly = true;
        }
        el.disabled = true;
        el.style.opacity = "0.4";
        el.style.cursor = "not-allowed";
        el.style.pointerEvents = "none";
        el.style.filter = "grayscale(100%)";
      });

      // ۲. قفل کردن تگ‌های <label> که نقش دکمه آپلود/بازیابی فایل دارند (مانند دکمه سبز «بازیابی سایت از فایل پشتیبان»)
      const labels = workspace.querySelectorAll<HTMLLabelElement>("label");
      labels.forEach((lbl) => {
        const hasFileOrCheckbox = lbl.querySelector("input");
        const cls = lbl.className || "";
        if (hasFileOrCheckbox || cls.includes("cursor-pointer") || cls.includes("bg-")) {
          lbl.setAttribute("data-axon-readonly-locked", "1");
          lbl.style.opacity = "0.35";
          lbl.style.cursor = "not-allowed";
          lbl.style.pointerEvents = "none";
          lbl.style.filter = "grayscale(100%)";
        }
      });

      // ۳. قفل کردن تمامی دکمه‌ها (<button>) و المان‌های دارای role="button"
      const buttons = workspace.querySelectorAll<HTMLElement>('button, [role="button"]');
      buttons.forEach((btn) => {
        if (isPureSubTabSwitcher(btn)) return;
        btn.setAttribute("data-axon-readonly-btn", "1");
        if (btn instanceof HTMLButtonElement) {
          btn.disabled = true;
        }
        btn.style.opacity = "0.35";
        btn.style.cursor = "not-allowed";
        btn.style.pointerEvents = "none";
        btn.style.filter = "grayscale(100%)";
      });

      // ۴. قفل کردن لینک‌های دانلود یا عملیاتی داخل محیط کاری
      const actionLinks = workspace.querySelectorAll<HTMLAnchorElement>("a[download], a[target='_blank']");
      actionLinks.forEach((a) => {
        a.style.opacity = "0.35";
        a.style.cursor = "not-allowed";
        a.style.pointerEvents = "none";
        a.style.filter = "grayscale(100%)";
      });
    };

    lockAllInteractiveElements();
    const observer = new MutationObserver(() => {
      lockAllInteractiveElements();
    });

    const workspace = document.getElementById("axon-admin-main-workspace") || document.body;
    observer.observe(workspace, { childList: true, subtree: true });

    const blockCaptureEvent = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const workspaceEl = document.getElementById("axon-admin-main-workspace");
      if (!workspaceEl || !workspaceEl.contains(target)) return;

      const btn = target.closest("button");
      if (btn && isPureSubTabSwitcher(btn)) {
        return;
      }

      const interactive = target.closest(
        'button, input, select, textarea, label, a[download], [role="button"]'
      );
      if (interactive) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("click", blockCaptureEvent, true);
    document.addEventListener("change", blockCaptureEvent, true);
    document.addEventListener("input", blockCaptureEvent, true);
    document.addEventListener("submit", blockCaptureEvent, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", blockCaptureEvent, true);
      document.removeEventListener("change", blockCaptureEvent, true);
      document.removeEventListener("input", blockCaptureEvent, true);
      document.removeEventListener("submit", blockCaptureEvent, true);
    };
  }, [isCurrentPageReadOnly, pathname]);

  // مسدودسازی هرگونه درخواست تغییر، آپلود، استعلام یا دانلود در لایه شبکه
  useEffect(() => {
    if (!adminUser || isSuperAdmin || typeof window === "undefined") return;

    const originalFetch = window.fetch;
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const method = (init?.method || "GET").toUpperCase();
      const urlStr = typeof input === "string" ? input : input.toString();

      if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
        if (urlStr.includes("/api/analytics/device") || urlStr.includes("/api/admin/logout") || urlStr.includes("/api/admin/monitoring")) {
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
