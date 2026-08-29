// File Path: components/admin/OrderManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";
import { Order, normalizeOrder, orderService } from "@/services/orderService";

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [statusInput, setStatusInput] = useState<Order["status"]>("paid");
  const [saving, setSaving] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getAll();
      setOrders(data || []);
    } catch (e) {
      console.error("Error loading orders in OrderManager:", e);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleOrdersUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setOrders(e.detail);
      } else {
        fetchOrders();
      }
    };

    window.addEventListener("orders_updated", handleOrdersUpdate);
    return () => {
      window.removeEventListener("orders_updated", handleOrdersUpdate);
    };
  }, []);

  const handleSelectOrder = (o: Order) => {
    soundEngine.playClick();
    setSelectedOrder(o);
    setTrackingInput(o.tracking_code || o.trackingCode || "");
    setStatusInput(o.status || "paid");
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    soundEngine.playClick();
    setSaving(true);
    try {
      const ok = await orderService.updateStatus(
        selectedOrder.id,
        statusInput,
        trackingInput.trim() || undefined
      );

      if (ok) {
        soundEngine.playSuccess();
        const updatedList = orders.map((o) =>
          String(o.id) === String(selectedOrder.id)
            ? { ...o, status: statusInput, tracking_code: trackingInput.trim(), trackingCode: trackingInput.trim() }
            : o
        );
        setOrders(updatedList);
        setSelectedOrder({
          ...selectedOrder,
          status: statusInput,
          tracking_code: trackingInput.trim(),
          trackingCode: trackingInput.trim(),
        });
        alert("وضعیت سفارش و کد رهگیری پستی به صورت زنده ذخیره شد.");
      }
    } catch (err) {
      console.error("Error updating order in OrderManager:", err);
      alert("خطا در بروزرسانی وضعیت فاکتور.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📦</span> مدیریت فاکتورها، سفارشات و صدور بارنامه پستی
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            بررسی وضعیت پرداخت، درج کد رهگیری پیشتاز و اطلاع‌رسانی لایو به مشتریان
          </p>
        </div>
        <span className="px-4 py-2 rounded-2xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-black">
          {orders.length} سفارش ثبت‌شده
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-2 h-[540px] overflow-y-auto">
          {orders.length === 0 ? (
            <p className="text-xs text-center py-12 text-[var(--text-secondary)] font-bold">هنوز سفارشی ثبت نشده است.</p>
          ) : (
            orders.map((o) => {
              const customerName = o.customer?.fullName || o.customerName || (o as any).customer_name || "مشتری گرامی";
              const customerPhone = o.customer?.phone || o.phone || (o as any).customer_phone || "---";
              const totalAmount = Number(o.finalAmount || o.totalAmount || (o as any).final_amount || (o as any).total_amount || 0);

              return (
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
                    <span className="text-[var(--text-primary)] truncate max-w-[140px]">
                      {customerName}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      o.status === "shipped" ? "bg-blue-500/15 text-blue-500" :
                      o.status === "paid" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                      o.status === "delivered" ? "bg-purple-500/15 text-purple-500" :
                      o.status === "cancelled" ? "bg-rose-500/15 text-rose-500" : "bg-amber-500/15 text-amber-500"
                    }`}>
                      {o.status === "shipped" ? "ارسال شده 🚚" : o.status === "paid" ? "پرداخت شده ✓" : o.status === "delivered" ? "تحویل داده شده" : o.status === "cancelled" ? "لغو شده" : "در انتظار"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)]">
                    <span className="font-mono">{customerPhone}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {totalAmount.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] h-[540px] overflow-y-auto">
          {selectedOrder ? (
            <form onSubmit={handleUpdateOrder} className="space-y-6 text-xs">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
                <div>
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    فاکتور: {selectedOrder.customer?.fullName || selectedOrder.customerName || (selectedOrder as any).customer_name}
                  </h3>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">شناسه سفارش: {selectedOrder.orderNumber || selectedOrder.id}</span>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {saving ? "در حال ثبت..." : "💾 ذخیره وضعیت"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--card-border)]">
                <div><span className="text-[var(--text-secondary)] font-bold">شماره تماس:</span> <span className="font-mono font-bold mr-1">{selectedOrder.customer?.phone || selectedOrder.phone}</span></div>
                <div><span className="text-[var(--text-secondary)] font-bold">کد پستی ۱۰ رقمی:</span> <span className="font-mono font-bold mr-1">{selectedOrder.customer?.postalCode || selectedOrder.postalCode || "---"}</span></div>
                <div className="sm:col-span-2"><span className="text-[var(--text-secondary)] font-bold">نشانی تحویل:</span> <span className="mr-1 leading-relaxed font-medium">{selectedOrder.customer?.address || selectedOrder.address}</span></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">وضعیت پردازش سفارش</label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as any)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    <option value="pending">در انتظار پرداخت</option>
                    <option value="paid">پرداخت شده و در حال آماده‌سازی</option>
                    <option value="processing">در حال بسته‌بندی استودیویی</option>
                    <option value="shipped">تحویل به شرکت پست (ارسال شد)</option>
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
            <div className="h-full flex items-center justify-center text-xs text-[var(--text-secondary)] font-bold">
              یک سفارش را از لیست سمت راست برای مشاهده و مدیریت انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}