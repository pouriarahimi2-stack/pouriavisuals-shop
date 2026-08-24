"use client";

import React, { useState, useEffect } from "react";
import { orderService, Order } from "@/services/orderService";
import { smsService } from "@/services/smsService";

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [newStatus, setNewStatus] = useState<Order["status"]>("pending");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll();
      setOrders(data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const handleOrdersUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setOrders(e.detail);
      else loadOrders();
    };
    window.addEventListener("orders_updated", handleOrdersUpdate);
    return () => window.removeEventListener("orders_updated", handleOrdersUpdate);
  }, []);

  const openOrderModal = (ord: Order) => {
    setSelectedOrder(ord);
    setNewStatus(ord.status);
    setTrackingInput(ord.trackingCode || ord.tracking_code || "");
  };

  const handleSaveOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      const isShipped = newStatus === "shipped";
      const tracking = trackingInput.trim() || undefined;

      const success = await orderService.updateStatus(selectedOrder.id, newStatus, tracking);

      if (success) {
        // در صورت ثبت کد رهگیری جدید و تغییر وضعیت به ارسال، پیامک رهگیری ارسال می‌شود
        const phone = selectedOrder.customer?.phone || (selectedOrder as any).phone;
        const currentTracking = selectedOrder.trackingCode || selectedOrder.tracking_code;

        if (isShipped && tracking && tracking !== currentTracking && phone && smsService && typeof smsService.sendTrackingCode === "function") {
          try {
            await smsService.sendTrackingCode(phone, selectedOrder.id, tracking);
          } catch (smsErr) {
            console.error("SMS Error:", smsErr);
          }
        }

        showToast(`وضعیت سفارش ${selectedOrder.id} با موفقیت به‌روزرسانی شد.`);
        setSelectedOrder(null);
        await loadOrders();
      } else {
        showToast("خطا در به‌روزرسانی وضعیت سفارش.");
      }
    } catch (err) {
      console.error("Order update error:", err);
      showToast("خطای سیستمی در ارتباط با دیتابیس.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchStatus = statusFilter === "all" || ord.status === statusFilter;
    const orderIdStr = String(ord.id || "");
    const custName = ord.customer?.fullName || ord.customer?.name || (ord as any).customerName || "";
    const custPhone = ord.customer?.phone || (ord as any).phone || "";
    const trackingStr = ord.trackingCode || ord.tracking_code || "";

    const matchSearch =
      orderIdStr.toLowerCase().includes(search.toLowerCase()) ||
      custName.toLowerCase().includes(search.toLowerCase()) ||
      custPhone.includes(search) ||
      trackingStr.includes(search);

    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px]">در انتظار پرداخت</span>;
      case "processing":
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10px]">در حال آماده‌سازی</span>;
      case "shipped":
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-[10px]">ارسال شده به پست</span>;
      case "delivered":
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">تحویل داده شد</span>;
      case "cancelled":
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px]">لغو شده</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* هدر بخش سفارش‌ها */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base flex items-center gap-2 text-[var(--accent-blue)]">
            <span>📑</span> سامانه مدیریت سفارشات و مرسولات پستی
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تغییر وضعیت فاکتورها، صدور کد رهگیری پستی پیشتاز و ارسال آنی پیامک به مشتری
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none cursor-pointer"
          >
            <option value="all">همه وضعیت‌ها ({orders.length})</option>
            <option value="pending">در انتظار پرداخت</option>
            <option value="processing">در حال پردازش</option>
            <option value="shipped">تحویل به پست</option>
            <option value="delivered">تحویل نهایی</option>
            <option value="cancelled">لغو شده</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در شناسه، مشتری، شماره یا کد پست..."
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] w-60"
          />
        </div>
      </div>

      {/* جدول سفارش‌ها */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-[var(--text-secondary)]">در حال دریافت فاکتورها از دیتابیس...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-[var(--text-secondary)]">هیچ سفارشی یافت نشد.</div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                <th className="pb-3 px-2">شماره فاکتور</th>
                <th className="pb-3 px-2">نام خریدار</th>
                <th className="pb-3 px-2">شماره تماس</th>
                <th className="pb-3 px-2">مبلغ کل</th>
                <th className="pb-3 px-2">کد رهگیری پست</th>
                <th className="pb-3 px-2">وضعیت فاکتور</th>
                <th className="pb-3 px-2 text-center">مدیریت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredOrders.map((ord) => {
                const cName = ord.customer?.fullName || ord.customer?.name || (ord as any).customerName || "خریدار";
                const cPhone = ord.customer?.phone || (ord as any).phone || "---";
                const total = ord.finalAmount || ord.final_amount || ord.totalAmount || (ord as any).total_amount || 0;
                const trackCode = ord.trackingCode || ord.tracking_code;
                const orderNum = ord.orderNumber || ord.order_number || ord.id;

                return (
                  <tr key={ord.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-2 font-mono font-black text-[var(--accent-blue)]">{orderNum}</td>
                    <td className="py-3 px-2 font-bold">{cName}</td>
                    <td className="py-3 px-2 font-mono text-[var(--text-secondary)]">{cPhone}</td>
                    <td className="py-3 px-2 font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {Number(total).toLocaleString("fa-IR")} تومان
                    </td>
                    <td className="py-3 px-2 font-mono text-[11px]">
                      {trackCode ? (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                          {trackCode}
                        </span>
                      ) : (
                        <span className="text-[var(--text-secondary)] opacity-50">ثبت نشده</span>
                      )}
                    </td>
                    <td className="py-3 px-2">{getStatusBadge(ord.status)}</td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => openOrderModal(ord)}
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px] hover:opacity-90 transition cursor-pointer shadow-md"
                      >
                        ✏️ مدیریت و بارنامه
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* مودال مدیریت و تغییر وضعیت سفارش */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleSaveOrderStatus} className="max-w-lg w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-7 space-y-5 shadow-2xl text-[var(--text-primary)] text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <div>
                <h4 className="font-black text-sm text-[var(--accent-blue)]">مدیریت سفارش {selectedOrder.orderNumber || selectedOrder.order_number || selectedOrder.id}</h4>
                <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-0.5">
                  خریدار: {selectedOrder.customer?.fullName || selectedOrder.customer?.name || (selectedOrder as any).customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* مشخصات نشانی و اقلام */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] space-y-2 text-[11px] leading-relaxed">
              <p>
                <strong className="text-[var(--text-secondary)]">شماره تماس:</strong>{" "}
                <span className="font-mono">{selectedOrder.customer?.phone || (selectedOrder as any).phone}</span>
              </p>
              <p>
                <strong className="text-[var(--text-secondary)]">کد پستی:</strong>{" "}
                <span className="font-mono">{selectedOrder.customer?.postalCode || (selectedOrder as any).postalCode || "ثبت نشده"}</span>
              </p>
              <p>
                <strong className="text-[var(--text-secondary)]">نشانی پستی:</strong>{" "}
                {selectedOrder.customer?.address || (selectedOrder as any).address || "ثبت نشده"}
              </p>
              {selectedOrder.notes && (
                <p>
                  <strong className="text-[var(--text-secondary)]">یادداشت سفارش:</strong> {selectedOrder.notes}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">وضعیت جدید سفارش *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)] cursor-pointer"
                >
                  <option value="pending">در انتظار پرداخت</option>
                  <option value="processing">در حال پردازش و انبارداری</option>
                  <option value="shipped">تحویل به پست پیشتاز (ارسال شد)</option>
                  <option value="delivered">تحویل داده شد به خریدار</option>
                  <option value="cancelled">لغو سفارش</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  کد رهگیری مرسوله پستی (۲۴ رقمی پیشتاز):
                </label>
                <input
                  type="text"
                  placeholder="مثال: 123456789012345678901234"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                  * با تغییر وضعیت به «ارسال شد»، پیامک حاوی این کد رهگیری به شماره موبایل مشتری ارسال خواهد شد.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-[var(--input-bg)] font-bold text-[var(--text-secondary)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? "در حال ثبت..." : "ذخیره و ارسال پیامک 💾"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}