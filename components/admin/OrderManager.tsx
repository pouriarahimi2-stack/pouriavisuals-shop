// components/admin/OrderManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export interface Order {
  id: string;
  first_name?: string;
  last_name?: string;
  phone: string;
  address: string;
  postal_code: string;
  total_amount: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  tracking_code?: string;
  items?: any[];
  created_at: string;
}

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [statusInput, setStatusInput] = useState<Order["status"]>("paid");
  const [saving, setSaving] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (e) {
      console.error("Error loading orders:", e);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-realtime-channel-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectOrder = (o: Order) => {
    soundEngine.playClick();
    setSelectedOrder(o);
    setTrackingInput(o.tracking_code || "");
    setStatusInput(o.status || "paid");
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    soundEngine.playClick();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: statusInput,
          tracking_code: trackingInput.trim() || null,
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      soundEngine.playSuccess();
      setOrders(
        orders.map((o) =>
          o.id === selectedOrder.id ? { ...o, status: statusInput, tracking_code: trackingInput.trim() } : o
        )
      );
      setSelectedOrder({ ...selectedOrder, status: statusInput, tracking_code: trackingInput.trim() });
      alert("وضعیت سفارش و کد رهگیری پستی به صورت زنده ذخیره شد.");
    } catch (err) {
      console.error("Error updating order:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">📦 مدیریت سفارشات و مرسولات پستی</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">بررسی وضعیت پرداخت، درج کد رهگیری پیشتاز و اطلاع‌رسانی لایو</p>
        </div>
        <span className="px-4 py-2 rounded-2xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-black">
          {orders.length} سفارش ثبت‌شده
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-2 h-[540px] overflow-y-auto">
          {orders.length === 0 ? (
            <p className="text-xs text-center py-8 text-[var(--text-muted)] font-bold">هنوز سفارشی ثبت نشده است.</p>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                onClick={() => handleSelectOrder(o)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                  selectedOrder?.id === o.id
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                    : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-[var(--text-primary)]">
                    {o.first_name || ""} {o.last_name || "مشتری"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-500/10 text-blue-500">
                    {o.status === "shipped" ? "ارسال شده 🚚" : o.status === "paid" ? "پرداخت شده ✓" : o.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)]">
                  <span className="font-mono">{o.phone}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {Number(o.total_amount || 0).toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] h-[540px] overflow-y-auto">
          {selectedOrder ? (
            <form onSubmit={handleUpdateOrder} className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
                <div>
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    سفارش: {selectedOrder.first_name} {selectedOrder.last_name}
                  </h3>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">ID: {selectedOrder.id}</span>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition cursor-pointer shadow-md"
                >
                  {saving ? "در حال ثبت..." : "💾 ذخیره وضعیت"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--card-border)]">
                <div><span className="text-[var(--text-muted)] font-bold">شماره تماس:</span> <span className="font-mono font-bold mr-1">{selectedOrder.phone}</span></div>
                <div><span className="text-[var(--text-muted)] font-bold">کد پستی ۱۰ رقمی:</span> <span className="font-mono font-bold mr-1">{selectedOrder.postal_code}</span></div>
                <div className="sm:col-span-2"><span className="text-[var(--text-muted)] font-bold">نشانی تحویل:</span> <span className="mr-1 leading-relaxed font-medium">{selectedOrder.address}</span></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">وضعیت پردازش سفارش</label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as any)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none"
                  >
                    <option value="paid">پرداخت شده و در حال آماده‌سازی</option>
                    <option value="shipped">تحویل به پست (ارسال شد)</option>
                    <option value="delivered">تحویل داده شده به مشتری</option>
                    <option value="cancelled">لغو شده</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">کد رهگیری پست پیشتاز (۲۴ رقمی)</label>
                  <input
                    type="text"
                    placeholder="مثال: 184590219400018370000114"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)] font-bold">
              یک سفارش را از لیست سمت راست برای مشاهده و مدیریت انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}