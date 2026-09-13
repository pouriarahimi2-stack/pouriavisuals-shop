"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface RolePermissionDef {
  role: string;
  title: string;
  badgeColor: string;
  description: string;
  permissions: { key: string; name: string; allowed: boolean }[];
}

const DEFAULT_ROLE_MATRIX: RolePermissionDef[] = [
  {
    role: "admin",
    title: "مدیر ارشد (Super Admin)",
    badgeColor: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    description: "دسترسی نامحدود و مطلق به تمام بخش‌ها، تراکنش‌ها، تنظیمات امنیتی، لاگ‌ها و بکاپ دیتابیس",
    permissions: [
      { key: "orders.manage", name: "مدیریت و تغییر وضعیت سفارشات", allowed: true },
      { key: "products.manage", name: "ایجاد، ویرایش و حذف محصولات", allowed: true },
      { key: "coupons.manage", name: "مدیریت کدهای تخفیف", allowed: true },
      { key: "content.manage", name: "انتشار مقالات و صفحات Puck", allowed: true },
      { key: "system.backup", name: "پشتیبان‌گیری و بازیابی دیتابیس", allowed: true },
      { key: "security.audit", name: "مشاهده لاگ‌های امنیتی سیستم", allowed: true },
    ],
  },
  {
    role: "product_manager",
    title: "مدیر انبار و محصولات",
    badgeColor: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    description: "کنترل موجودی انبار، تعریف محصولات جدید، قیمت‌گذاری و کوپن‌های فروش",
    permissions: [
      { key: "orders.manage", name: "مدیریت و تغییر وضعیت سفارشات", allowed: false },
      { key: "products.manage", name: "ایجاد، ویرایش و حذف محصولات", allowed: true },
      { key: "coupons.manage", name: "مدیریت کدهای تخفیف", allowed: true },
      { key: "content.manage", name: "انتشار مقالات و صفحات Puck", allowed: false },
      { key: "system.backup", name: "پشتیبان‌گیری و بازیابی دیتابیس", allowed: false },
      { key: "security.audit", name: "مشاهده لاگ‌های امنیتی سیستم", allowed: false },
    ],
  },
  {
    role: "content_editor",
    title: "کارشناس تولید محتوا",
    badgeColor: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    description: "مدیریت اخبار فناوری، بلاگ‌ها، سئو و ویرایش صفحات با صفحه‌ساز ماژولار",
    permissions: [
      { key: "orders.manage", name: "مدیریت و تغییر وضعیت سفارشات", allowed: false },
      { key: "products.manage", name: "ایجاد، ویرایش و حذف محصولات", allowed: false },
      { key: "coupons.manage", name: "مدیریت کدهای تخفیف", allowed: false },
      { key: "content.manage", name: "انتشار مقالات و صفحات Puck", allowed: true },
      { key: "system.backup", name: "پشتیبان‌گیری و بازیابی دیتابیس", allowed: false },
      { key: "security.audit", name: "مشاهده لاگ‌های امنیتی سیستم", allowed: false },
    ],
  },
  {
    role: "support_agent",
    title: "پشتیبان امور مشتریان",
    badgeColor: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    description: "پاسخگویی به تیکت‌ها، بررسی پیام‌ها و استعلام وضعیت بسته‌های مشتریان",
    permissions: [
      { key: "orders.manage", name: "مدیریت و تغییر وضعیت سفارشات", allowed: false },
      { key: "products.manage", name: "ایجاد، ویرایش و حذف محصولات", allowed: false },
      { key: "coupons.manage", name: "مدیریت کدهای تخفیف", allowed: false },
      { key: "content.manage", name: "انتشار مقالات و صفحات Puck", allowed: false },
      { key: "system.backup", name: "پشتیبان‌گیری و بازیابی دیتابیس", allowed: false },
      { key: "security.audit", name: "مشاهده لاگ‌های امنیتی سیستم", allowed: false },
    ],
  },
];

export default function RolesManagementPage() {
  const [roles] = useState<RolePermissionDef[]>(DEFAULT_ROLE_MATRIX);

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🛡️</span> مدیریت دسترسی‌ها و ماتریس نقش‌ها (RBAC Engine)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پایش و تفکیک سطح اختیارات کاربران مدیریت مطابق استانداردهای امنیتی پروژه
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold">
          ✓ گارد محافظتی rbacGuard فعال است
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((r) => (
          <div
            key={r.role}
            className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 hover:border-[var(--accent-blue)]/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                  <span>👤</span> {r.title}
                </h3>
                <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
                  نقش سیستمی: {r.role}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${r.badgeColor}`}>
                {r.role.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed min-h-[36px]">
              {r.description}
            </p>

            <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
              <span className="text-[11px] font-black text-slate-400 block mb-2">مجوزهای فعال برای این سطح:</span>
              <div className="grid grid-cols-1 gap-1.5">
                {r.permissions.map((p) => (
                  <div
                    key={p.key}
                    className="flex items-center justify-between p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-medium"
                  >
                    <span className={p.allowed ? "text-[var(--text-primary)]" : "text-slate-500 line-through opacity-60"}>
                      {p.name}
                    </span>
                    <span className={p.allowed ? "text-emerald-500 font-bold" : "text-rose-500/70 font-bold"}>
                      {p.allowed ? "✓ مجاز" : "✕ مسدود"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
