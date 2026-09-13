/**
 * AXON CORE - Connect Admin Orders UI with SMS Trigger on Status Change (fix.js)
 * Preserves all existing table structures, filters, and tracking codes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

function writeFile(relPath, content) {
  const fullPath = path.join(ROOT, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ارتقا یافت: ${relPath}\x1b[0m`);
}

console.log("\x1b[35m[ORDERS-SMS-INTEGRATION]\x1b[0m ادغام ماشه ارسال پیامک خریدار با تغییر وضعیت سفارش در پنل...");

const ordersPagePath = 'app/admin/orders/page.tsx';

const upgradedOrdersPageCode = `"use client";

import React, { useEffect, useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface OrderItem {
  title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_color?: string;
  selected_storage?: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  postal_code?: string;
  status: string;
  total_amount: number;
  discount_amount?: number;
  final_amount?: number;
  coupon_code?: string;
  tracking_code?: string;
  created_at: string;
  items: OrderItem[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "همه سفارشات" },
  { value: "pending_manual_review", label: "در انتظار بررسی واریز" },
  { value: "paid", label: "پرداخت تایید شد (کسر موجودی)" },
  { value: "processing", label: "در حال پردازش در انبار" },
  { value: "shipped", label: "ارسال شد" },
  { value: "delivered", label: "تحویل گردید" },
  { value: "cancelled", label: "لغو شده" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [sendSmsMap, setSendSmsMap] = useState<Record<string, boolean>>({});

  const fetchOrders = async (status = filter) => {
    try {
      setLoading(true);
      const url = status === "all" ? "/api/admin/orders" : \`/api/admin/orders?status=\${status}\`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      }
    } catch {
      console.error("خطا در واکشی سفارشات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(filter);
  }, [filter]);

  const handleStatusChange = async (order: Order, newStatus: string) => {
    soundEngine.playClick();
    setUpdatingId(order.id);
    const tracking = trackingInputs[order.id] || order.tracking_code;
    const shouldSendSms = sendSmsMap[order.id] !== false; // پیش‌فرض فعال

    try {
      // ۱. به‌روزرسانی وضعیت سفارش در دیتابیس
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          status: newStatus,
          tracking_code: tracking,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // ۲. ارسال پیامک به خریدار در صورت تایید و انتخاب وضعیت‌های مهم
        if (shouldSendSms && ["paid", "shipped", "delivered"].includes(newStatus)) {
          try {
            await fetch("/api/admin/sms/order-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: order.id,
                phone: order.customer_phone,
                status: newStatus,
                customerName: order.customer_name,
                trackingCode: tracking,
              }),
            });
          } catch (smsErr) {
            console.error("خطا در ارسال پیامک خودکار:", smsErr);
          }
        }

        soundEngine.playSuccess();
        fetchOrders(filter);
      } else {
        alert(data.message || "خطا در تغییر وضعیت سفارش.");
      }
    } catch {
      alert("ارتباط با سرور برقرار نشد.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_manual_review":
        return "bg-amber-500/15 border-amber-500/30 text-amber-400";
      case "paid":
      case "delivered":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
      case "processing":
      case "shipped":
        return "bg-blue-500/15 border-blue-500/30 text-blue-400";
      case "cancelled":
        return "bg-rose-500/15 border-rose-500/30 text-rose-400";
      default:
        return "bg-slate-500/15 border-slate-500/30 text-slate-400";
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      {/* هدر صفحه و فیلترها */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📦</span> مدیریت جامع سفارشات و انبار
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            بررسی پرداخت‌ها، تغییر وضعیت پردازش، ثبت بارنامه‌های پستی و دیسپچ پیامک‌های مشتری
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                soundEngine.playClick();
                setFilter(opt.value);
              }}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition border \${
                filter === opt.value
                  ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white"
                  : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-white"
              }\`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* لیست سفارشات */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">در حال دریافت سفارشات...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl">
          هیچ سفارشی در این وضعیت یافت نشد.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-400">#{ord.id.slice(0, 8)}</span>
                  <span className="font-black text-sm text-[var(--text-primary)]">{ord.customer_name}</span>
                  <span className="font-mono text-xs text-slate-400">{ord.customer_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={\`px-3 py-1 rounded-xl border text-xs font-bold \${getStatusBadge(ord.status)}\`}>
                    {STATUS_OPTIONS.find((s) => s.value === ord.status)?.label || ord.status}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(ord.created_at).toLocaleDateString("fa-IR")}
                  </span>
                </div>
              </div>

              {/* آدرس و اقلام */}
              <div className="text-xs text-[var(--text-secondary)]">
                <span className="font-bold text-[var(--text-primary)]">آدرس تحویل: </span>
                {ord.customer_address} {ord.postal_code && \`(کد پستی: \${ord.postal_code})\`}
              </div>

              <div className="space-y-1.5">
                {Array.isArray(ord.items) &&
                  ord.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]"
                    >
                      <span className="font-bold text-[var(--text-primary)]">
                        {item.title} × {item.quantity}
                        {item.selected_color && <span className="mr-2 text-slate-400">({item.selected_color})</span>}
                        {item.selected_storage && <span className="mr-1 text-slate-400">[{item.selected_storage}]</span>}
                      </span>
                      <span className="font-mono text-slate-300">
                        {Number(item.total_price || item.unit_price * item.quantity).toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  ))}
              </div>

              {/* مبلغ نهایی، گزینه‌ها و تغییر وضعیت */}
              <div className="border-t border-[var(--card-border)] pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400">مبلغ نهایی: </span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {Number(ord.final_amount || ord.total_amount).toLocaleString("fa-IR")} تومان
                  </span>
                  {ord.coupon_code && (
                    <span className="mr-2 text-[11px] text-amber-400 font-mono">(کوپن: {ord.coupon_code})</span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sendSmsMap[ord.id] !== false}
                      onChange={(e) =>
                        setSendSmsMap((prev) => ({ ...prev, [ord.id]: e.target.checked }))
                      }
                      className="rounded accent-[var(--accent-blue)]"
                    />
                    ارسال پیامک تغییر وضعیت
                  </label>

                  <input
                    type="text"
                    placeholder="کد پیگیری پستی..."
                    defaultValue={ord.tracking_code || ""}
                    onChange={(e) =>
                      setTrackingInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))
                    }
                    className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                  />

                  <select
                    disabled={updatingId === ord.id}
                    value={ord.status}
                    onChange={(e) => handleStatusChange(ord, e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-bold focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.filter((s) => s.value !== "all").map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;

writeFile(ordersPagePath, upgradedOrdersPageCode);

// کامپایل و تست صحت پروژه
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ کامپایل با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

// ارسال تغییرات به مخزن گیت‌هاب
console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "feat(orders): connect order status updates with automated SMS notifications to customers"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ اتصال پیامک‌های خودکار سفارش با موفقیت روی سرور ورسل مستقر گردید!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}