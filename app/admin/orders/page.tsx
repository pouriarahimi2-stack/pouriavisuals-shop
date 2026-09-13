"use client";

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

  const fetchOrders = async (status = filter) => {
    try {
      setLoading(true);
      const url = status === "all" ? "/api/admin/orders" : `/api/admin/orders?status=${status}`;
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    soundEngine.playClick();
    setUpdatingId(orderId);
    try {
      const tracking = trackingInputs[orderId];
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          tracking_code: tracking,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
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
            بررسی پرداخت‌ها، تغییر وضعیت پردازش و ثبت بارنامه‌های پستی مشتریان
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filter === opt.value
                  ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white"
                  : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-white"
              }`}
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
                  <span className={`px-3 py-1 rounded-xl border text-xs font-bold ${getStatusBadge(ord.status)}`}>
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
                {ord.customer_address} {ord.postal_code && `(کد پستی: ${ord.postal_code})`}
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

              {/* مبلغ نهایی و فیلدهای تغییر وضعیت */}
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

                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
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
                    onChange={(e) => handleStatusChange(ord.id, e.target.value)}
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
