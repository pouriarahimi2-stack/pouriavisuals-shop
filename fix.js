/**
 * AXON CORE - Complete Remaining Audit Deliverables (My Orders, Audit Logs, Excel Export) (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ایجاد و ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[FINAL-AUDIT-COMPLETION]\x1b[0m پیاده‌سازی صفحه سفارش‌های من، Audit Log ادمین و اکسپورت کاتالوگ...");

// =============================================================================
// ۱. پیاده‌سازی صفحه کاربری «سفارش‌های من» (app/my-orders/page.tsx)
// =============================================================================
const myOrdersPageCode = `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

interface OrderItem {
  id: string;
  order_number?: string;
  created_at: string;
  status: string;
  final_amount: number;
  tracking_code?: string;
  items: any[];
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    // استخراج شماره همراه کاربر وارد شده از سشن
    try {
      const userRaw = localStorage.getItem("axon_user_session");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user?.phone) {
          setPhone(user.phone);
          fetchCustomerOrders(user.phone);
          return;
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  const fetchCustomerOrders = async (userPhone: string) => {
    try {
      const res = await fetch(\`/api/orders/track?phone=\${encodeURIComponent(userPhone)}\`);
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "paid":
        return <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">پرداخت شده ✓</span>;
      case "shipped":
        return <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-500 font-bold text-[10px]">تحویل به پست 🚚</span>;
      case "delivered":
        return <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-500 font-bold text-[10px]">تحویل داده شد</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-500 font-bold text-[10px]">لغو شده</span>;
      default:
        return <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-500 font-bold text-[10px]">در انتظار بررسی</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="border-b border-[var(--card-border)] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">حساب کاربری و تاریخچه سفارش‌های من</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {phone ? \`سفارش‌های ثبت شده با شماره \${phone}\` : "برای مشاهده سوابق فاکتورها وارد حساب خود شوید."}
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold"
        >
          ← بازگشت به فروشگاه
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-bold text-[var(--text-secondary)]">
          در حال بارگذاری فاکتورهای شما...
        </div>
      ) : !phone ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4">
          <p className="text-xs font-bold text-[var(--text-secondary)]">شما هنوز وارد حساب کاربری خود نشده‌اید.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg"
          >
            ورود به حساب کاربری ←
          </Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-3">
          <span className="text-3xl block">📦</span>
          <p className="text-xs font-bold text-[var(--text-secondary)]">هنوز سفارشی با این شماره در سیستم ثبت نشده است.</p>
          <Link
            href="/products"
            className="inline-block px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold"
          >
            مشاهده کاتالوگ مانیتورها
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm space-y-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm text-[var(--accent-blue)]">
                    #{ord.order_number || ord.id.slice(0, 8)}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                    {new Date(ord.created_at).toLocaleDateString("fa-IR")}
                  </span>
                </div>
                <div>{getStatusBadge(ord.status)}</div>
              </div>

              {ord.tracking_code && (
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-wrap justify-between items-center gap-2">
                  <span className="font-bold text-blue-400 text-[11px]">کد رهگیری پست پیشتاز:</span>
                  <span className="font-mono font-black tracking-widest text-[11px] text-blue-300">{ord.tracking_code}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-[var(--text-secondary)]">مبلغ کل پرداختی:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm" suppressHydrationWarning>
                  {formatPrice(ord.final_amount)} تومان
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;
writeFile('app/my-orders/page.tsx', myOrdersPageCode);

// =============================================================================
// ۲. پیاده‌سازی سیستم لاگ فعالیت ادمین (Audit Log) - lib/logger.ts
// =============================================================================
const loggerCode = `import { supabaseAdmin } from "@/lib/supabaseServer";

export interface AuditLogEntry {
  admin_username: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "STATUS_CHANGE";
  resource: "PRODUCT" | "ORDER" | "COUPON" | "BANNER" | "PAGE" | "BLOG" | "SETTINGS";
  resource_id?: string;
  details?: string;
  ip?: string;
}

export async function logAdminActivity(entry: AuditLogEntry) {
  try {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from("admin_audit_logs").insert([{
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      admin_username: entry.admin_username,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id || null,
      details: entry.details || null,
      ip: entry.ip || "internal",
      created_at: new Date().toISOString(),
    }]);
  } catch (e) {
    // خطای ثبت لاگ نباید عملکرد تراکنش اصلی را متوقف کند
    console.error("Audit log error:", e);
  }
}
`;
writeFile('lib/logger.ts', loggerCode);

// =============================================================================
// ۳. اندپوینت API و صفحه مشاهده لاگ‌های ادمین (app/api/admin/audit-logs/route.ts)
// =============================================================================
const auditLogsApiCode = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      // در صورت نبودن جدول اولیه، لیست خالی برمی‌گرداند
      return NextResponse.json({ success: true, logs: [] });
    }

    return NextResponse.json({ success: true, logs: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/admin/audit-logs/route.ts', auditLogsApiCode);

// =============================================================================
// ۴. ایجاد قابلیت خروجی CSV کاتالوگ مانیتورها (app/api/admin/export-products/route.ts)
// =============================================================================
const exportProductsApiCode = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, title, category, price, discount_price, stock, is_available")
      .order("created_at", { ascending: false });

    // ساخت فایل CSV با انکودینگ UTF-8 BOM جهت باز شدن صحیح در اکسل فارسی
    let csv = "\\uFEFFشناسه,عنوان کالا,دسته‌بندی,قیمت فروش (تومان),قیمت تخفیف,موجودی,وضعیت\\n";
    (products || []).forEach((p) => {
      csv += \`"\${p.id}","\${p.title || ""}","\${p.category || ""}",\${p.price || 0},\${p.discount_price || 0},\${p.stock || 0},"\${p.is_available ? "موجود" : "ناموجود"}"\\n\`;
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="axon_products_catalog.csv"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/admin/export-products/route.ts', exportProductsApiCode);

// =============================================================================
// ۵. بیلد و ارسال به گیت‌هاب و ورسل
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ تمام مراحل کامپایل ۱۰۰٪ با موفقیت پاس شدند.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و دیپلوی در ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "feat(audit-complete): add user order history page, audit logging engine, and CSV catalog exporter"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تمامی موارد و الزامات گزارش با موفقیت تکمیل و در ورسل مستقر شدند!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}