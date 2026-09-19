"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Package, Truck, CheckCircle2, Clock, MapPin, Phone, Hash } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    if (supabaseBrowser && typeof supabaseBrowser.channel === "function") {
      const client = supabaseBrowser;
      const channel = client
        .channel("admin-orders-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [fetchOrders]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, payment_status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, payment_status: newStatus } : o))
        );
      }
    } catch (err) {
      alert("خطا در تغییر وضعیت سفارش");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 lg:p-10 dir-rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[var(--card-border)]">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/orders" className="p-2 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-hover)] text-sm font-bold flex items-center gap-2">
              <ArrowRight size={18} />
              پیشخوان
            </Link>
            <h1 className="text-2xl font-black">مدیریت سفارشات و بارنامه‌ها</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            مشاهده سفارشات خریداران، بررسی آدرس‌ها و صدور بارنامه به صورت بلادرنگ
          </p>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="text-center py-20 text-sm font-bold text-[var(--text-secondary)]">
            در حال بارگذاری لیست سفارشات...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center">
            <Package size={40} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-sm font-bold text-[var(--text-secondary)]">
              هنوز سفارشی به ثبت نرسیده است.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div key={ord.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--card-border)]">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 font-black text-xs flex items-center gap-1">
                      <Hash size={14} />
                      {ord.order_number}
                    </span>
                    <span className="font-bold text-sm text-white">{ord.customer_name}</span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Phone size={13} />
                      {ord.customer_phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">وضعیت:</span>
                    <select
                      value={ord.payment_status || "pending"}
                      onChange={(e) => updateStatus(ord.id, e.target.value)}
                      className="bg-[#1c1c1f] border border-[#27272a] text-xs font-bold text-white px-3 py-1.5 rounded-xl outline-none"
                    >
                      <option value="pending">در انتظار بررسی / پرداخت</option>
                      <option value="paid">پرداخت شده و تایید</option>
                      <option value="shipped">ارسال شده به پست</option>
                      <option value="delivered">تحویل داده شده</option>
                      <option value="cancelled">لغو شده</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-zinc-400 mb-1 flex items-center gap-1">
                      <MapPin size={13} />
                      نشانی تحویل:
                    </div>
                    <div className="text-white font-medium">{ord.shipping_address}</div>
                  </div>

                  <div className="text-left md:text-left flex flex-col justify-end">
                    <div className="text-zinc-400">مجموع پرداختی:</div>
                    <div className="text-lg font-black text-emerald-400 mt-0.5">
                      {Number(ord.total_price || 0).toLocaleString("fa-IR")} تومان
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {(Number(ord.total_price || 0) * 10).toLocaleString("fa-IR")} ریال
                    </div>
                  </div>
                </div>

                {Array.isArray(ord.items) && ord.items.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                    {ord.items.map((it: any, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-black/30 rounded-xl text-[11px] text-zinc-300 border border-white/5">
                        {it.title} × {it.quantity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
