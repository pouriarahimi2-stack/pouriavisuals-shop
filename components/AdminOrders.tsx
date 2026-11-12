// File Path: components/AdminOrders.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { orderService, Order } from "@/services/orderService";
import { smsService } from "@/services/smsService";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/formatters";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const [trackingModal, setTrackingModal] = useState<{
    open: boolean;
    order: Order | null;
    code: string;
  }>({ open: false, order: null, code: "" });

  const fetchOrders = useCallback(async () => {
    try {
      const data = await orderService.getAll();
      const list = data || [];
      setOrders(list);
      setSelectedOrder((prev) => {
        if (!prev) return null;
        const refreshed = list.find((o) => String(o.id) === String(prev.id));
        return refreshed || prev;
      });
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("realtime-admin-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    const handleLocalUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setOrders(e.detail);
      else fetchOrders();
    };
    window.addEventListener("orders_updated", handleLocalUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("orders_updated", handleLocalUpdate);
    };
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string | number, newStatus: string) => {
    soundEngine.playClick();
    const targetOrder = orders.find((o) => String(o.id) === String(orderId));

    if (newStatus === "shipped" && targetOrder) {
      setTrackingModal({
        open: true,
        order: targetOrder,
        code: targetOrder.tracking_code || targetOrder.trackingCode || "",
      });
      return;
    }

    setUpdatingId(orderId);
    try {
      const ok = await orderService.updateStatus(orderId, newStatus);
      if (!ok) {
        alert("خطا در بروزرسانی وضعیت سفارش");
        return;
      }

      const updated = orders.map((o) =>
        String(o.id) === String(orderId) ? { ...o, status: newStatus as any } : o
      );
      setOrders(updated);

      if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }

      if (targetOrder?.phone) {
        await smsService
          .sendOrderStatusChange(
            targetOrder.phone,
            String(targetOrder.orderNumber || targetOrder.id),
            newStatus
          )
          .catch(() => {});
      }

      soundEngine.playSuccess();
      fetchOrders();
    } catch (err) {
      console.error("Status update error:", err);
      alert("خطا در بروزرسانی وضعیت سفارش");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmTrackingCode = async () => {
    if (!trackingModal.order || !trackingModal.code.trim()) return;

    soundEngine.playClick();
    const orderId = trackingModal.order.id;
    const code = trackingModal.code.trim();
    setUpdatingId(orderId);

    try {
      const ok = await orderService.updateStatus(orderId, "shipped", code);
      if (!ok) {
        alert("خطا در ثبت کد رهگیری");
        return;
      }

      const phone = trackingModal.order.customer?.phone || trackingModal.order.phone;
      const name =
        trackingModal.order.customer?.fullName ||
        trackingModal.order.customerName ||
        "مشتری گرامی";

      if (phone) {
        await smsService.sendTrackingCode(phone, name, code).catch(() => {});
      }

      soundEngine.playSuccess();
      alert(
        "✅ سفارش به وضعیت «ارسال به پست» تغییر یافت و پیامک کد رهگیری پستی به مشتری ارسال شد."
      );
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("خطا در ثبت کد رهگیری");
    } finally {
      setUpdatingId(null);
      setTrackingModal({ open: false, order: null, code: "" });
    }
  };

  const handleSendReviewSms = async (order: Order) => {
    if (!confirm("آیا مایل به ارسال پیامک درخواست ثبت نظر برای این سفارش هستید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/admin/sms/review-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          phone: order.phone || order.customer?.phone,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success !== false) {
        soundEngine.playSuccess();
        alert("پیامک نظرسنجی با موفقیت ارسال شد.");
      } else {
        alert("خطا: " + (json.message || "عدم موفقیت در ارسال پیامک"));
      }
    } catch {
      alert("خطا در برقراری ارتباط با سرور");
    }
  };

  const handleDeleteOrder = async (orderId: string | number) => {
    if (!confirm("آیا از حذف کامل این سفارش از دیتابیس اطمینان دارید؟")) return;
    soundEngine.playClick();
    setUpdatingId(orderId);
    try {
      const res = await fetch(
        "/api/admin/orders?id=" + encodeURIComponent(String(orderId)),
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        soundEngine.playSuccess();
        setOrders((prev) => prev.filter((o) => String(o.id) !== String(orderId)));
        if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
          setSelectedOrder(null);
        }
      } else {
        alert("خطا در حذف سفارش.");
      }
    } catch {
      alert("خطا در ارتباط با سرور.");
    } finally {
      setUpdatingId(null);
    }
  };

  const printOrderInvoice = (order: Order) => {
    soundEngine.playClick();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const items = order.items || [];
    const customerName = order.customer?.fullName || order.customerName || "خریدار محترم";
    const customerPhone = order.customer?.phone || order.phone || "---";
    const address = order.customer?.address || order.address || "ثبت نشده";
    const total = Number(order.finalAmount || order.totalAmount || 0).toLocaleString("fa-IR");

    printWindow.document.write(
      '<html dir="rtl" lang="fa"><head><title>فاکتور رسمی سفارش ' +
        order.id +
        "</title><style>" +
        "body { font-family: Tahoma, sans-serif; padding: 30px; direction: rtl; color: #0f172a; font-size: 13px; }" +
        ".header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }" +
        ".title { font-size: 20px; font-weight: bold; margin: 0; color: #0284c7; }" +
        ".info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }" +
        ".box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #f8fafc; }" +
        "table { width: 100%; border-collapse: collapse; margin-top: 15px; }" +
        "th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; }" +
        "th { background: #e2e8f0; font-weight: bold; }" +
        ".total-row { font-size: 15px; font-weight: bold; background: #eff6ff; }" +
        ".footer { margin-top: 30px; text-align: center; font-size: 11px; color: #64748b; }" +
        "</style></head><body>" +
        '<div class="header"><h1 class="title">فاکتور رسمی فروش تجهیزات دیجیتال و تکنولوژی آکسون</h1>' +
        "<p>شماره سفارش: " +
        (order.orderNumber || order.id) +
        " | تاریخ: " +
        new Date(order.created_at || Date.now()).toLocaleDateString("fa-IR") +
        "</p></div>" +
        '<div class="info-grid"><div class="box"><p><strong>خریدار:</strong> ' +
        customerName +
        "</p><p><strong>تلفن همراه:</strong> " +
        customerPhone +
        '</p></div><div class="box"><p><strong>نشانی تحویل:</strong> ' +
        address +
        "</p><p><strong>کد رهگیری پست:</strong> " +
        (order.trackingCode || order.tracking_code || "صادر نشده") +
        "</p></div></div>" +
        "<table><thead><tr><th>ردیف</th><th>نام کالا</th><th>تعداد</th><th>قیمت واحد (تومان)</th><th>مبلغ کل (تومان)</th></tr></thead><tbody>" +
        items
          .map(
            (item: any, idx: number) =>
              "<tr><td>" +
              (idx + 1) +
              "</td><td>" +
              (item.title || item.name) +
              (item.selectedColor ? ` (${item.selectedColor})` : "") +
              "</td><td>" +
              (item.quantity || 1) +
              "</td><td>" +
              Number(item.price || 0).toLocaleString("fa-IR") +
              "</td><td>" +
              Number((item.price || 0) * (item.quantity || 1)).toLocaleString("fa-IR") +
              "</td></tr>"
          )
          .join("") +
        '<tr class="total-row"><td colspan="4" style="text-align: left; padding-left: 20px;">مبلغ نهایی قابل پرداخت:</td><td>' +
        total +
        " تومان</td></tr></tbody></table>" +
        '<div class="footer"><p>کلیه کالاهای این فاکتور دارای ضمانت اصالت ۱۰۰٪ فیزیکی و گارانتی معتبر آکسون هستند.</p></div>' +
        "<script>window.print();</script></body></html>"
    );
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 whitespace-nowrap">
            پرداخت شده ✓
          </span>
        );
      case "processing":
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse whitespace-nowrap">
            در حال پردازش
          </span>
        );
      case "shipped":
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/30 whitespace-nowrap">
            ارسال به پست 🚚
          </span>
        );
      case "delivered":
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-400 border border-purple-500/30 whitespace-nowrap">
            تحویل مشتری شد
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-500 border border-rose-500/30 whitespace-nowrap">
            لغو شده
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-500/15 text-slate-400 border border-slate-500/30 whitespace-nowrap">
            در انتظار پرداخت
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((o: any) => {
    const normalizedSt =
      o.status === "pending_manual_review" || !o.status ? "pending" : o.status;
    const matchesTab = activeTab === "all" || normalizedSt === activeTab;
    const name = o.customer?.fullName || o.customerName || "";
    const phone = o.customer?.phone || o.phone || "";
    const id = String(o.id || o.orderNumber || "");
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-4 bg-[var(--modal-bg)] border border-[var(--card-border)] p-5 sm:p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📑</span> مدیریت سفارش‌ها، صدور فاکتور و رهگیری پستی (Realtime)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            دریافت بلادرنگ فاکتورها، صدور بارنامه پیشتاز و ارسال خودکار پیامک وضعیت
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            fetchOrders();
          }}
          className="px-5 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <span>🔄</span>
          <span>همگام‌سازی آنی</span>
        </button>
      </div>

      <div className="flex flex-col gap-3.5 bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 sm:p-5 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 جستجو بر اساس نام خریدار، شماره موبایل یا کد فاکتور (مثلاً AXN-...)..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] transition"
            />
          </div>
          <div className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-2">
            <span>تعداد نمایش:</span>
            <span className="px-2.5 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-[var(--accent-blue)]">
              {filteredOrders.length} سفارش
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--card-border)] text-xs">
          {[
            { id: "all", label: "همه فاکتورها" },
            { id: "pending", label: "در انتظار پرداخت" },
            { id: "paid", label: "پرداخت شده" },
            { id: "processing", label: "در حال پردازش" },
            { id: "shipped", label: "تحویل به پست" },
            { id: "delivered", label: "تحویل شده" },
            { id: "cancelled", label: "لغو شده" },
          ].map((tab) => {
            const count =
              tab.id === "all"
                ? orders.length
                : orders.filter((o) => {
                    const st =
                      (o as any).status === "pending_manual_review" || !o.status
                        ? "pending"
                        : o.status;
                    return st === tab.id;
                  }).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(tab.id);
                }}
                className={
                  "px-3.5 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap text-xs " +
                  (activeTab === tab.id
                    ? "bg-[var(--accent-blue)] text-white shadow-md font-black"
                    : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--card-border)]")
                }
              >
                {tab.label}
                <span className="mr-1.5 font-mono opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl">
          <span className="text-xs text-[var(--text-secondary)] font-bold">
            در حال دریافت بلادرنگ سفارش‌ها...
          </span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl space-y-2">
          <span className="text-4xl block">🔍</span>
          <p className="text-xs font-bold text-[var(--text-secondary)]">
            سفارشی با این فیلتر ثبت نشده است.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs min-w-[780px]">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] font-black text-[11px]">
                  <th className="p-4">شناسه فاکتور</th>
                  <th className="p-4">نام خریدار</th>
                  <th className="p-4">شماره تماس</th>
                  <th className="p-4">مبلغ پرداختی</th>
                  <th className="p-4 text-center">وضعیت سفارش</th>
                  <th className="p-4">کد رهگیری پست</th>
                  <th className="p-4 text-center">عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] font-medium">
                {filteredOrders.map((order: any) => {
                  const items = order.items || [];
                  const isUpdating = updatingId === order.id;
                  const cName = order.customer?.fullName || order.customerName || "بدون نام";
                  const cPhone = order.customer?.phone || order.phone || "---";
                  const total = order.finalAmount || order.totalAmount || 0;
                  const trackCode = order.trackingCode || order.tracking_code;
                  const currentStatus =
                    order.status === "pending_manual_review" || !order.status
                      ? "pending"
                      : order.status;

                  return (
                    <tr key={order.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                      <td
                        className="p-4 font-mono font-black text-[var(--accent-blue)] whitespace-nowrap"
                        dir="ltr"
                      >
                        #{order.orderNumber || order.order_number || order.id}
                      </td>
                      <td className="p-4">
                        <div className="font-black text-[var(--text-primary)]">{cName}</div>
                        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                          {items.length} قلم کالا
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[var(--text-primary)] whitespace-nowrap">
                        {cPhone}
                      </td>
                      <td
                        className="p-4 font-mono font-black text-emerald-500 whitespace-nowrap"
                        suppressHydrationWarning
                      >
                        {formatPrice(total)} تومان
                      </td>
                      <td className="p-4 text-center">{getStatusBadge(currentStatus)}</td>
                      <td className="p-4 font-mono text-[11px] text-[var(--text-secondary)]">
                        {trackCode ? (
                          <span className="px-2.5 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-blue-400 font-bold whitespace-nowrap">
                            {trackCode}
                          </span>
                        ) : (
                          "---"
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setSelectedOrder(order);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] font-bold transition cursor-pointer"
                          >
                            👁️ پرونده
                          </button>

                          <button
                            type="button"
                            onClick={() => printOrderInvoice(order)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 border border-emerald-500/20 text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
                          >
                            🖨️ فاکتور
                          </button>

                          {currentStatus === "delivered" && (
                            <button
                              type="button"
                              onClick={() => handleSendReviewSms(order)}
                              className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-500 border border-sky-500/20 text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
                              title="ارسال پیامک درخواست ثبت نظر به مشتری"
                            >
                              💬 پیامک نظر
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 text-[11px] font-bold transition cursor-pointer"
                            title="حذف سفارش"
                          >
                            🗑️
                          </button>

                          <select
                            disabled={isUpdating}
                            value={currentStatus}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            className="p-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="pending">در انتظار پرداخت</option>
                            <option value="paid">پرداخت شده ✓</option>
                            <option value="processing">در حال پردازش</option>
                            <option value="shipped">ارسال به پست 📮</option>
                            <option value="delivered">تحویل شده</option>
                            <option value="cancelled">لغو سفارش</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div className="max-w-2xl w-full p-5 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-6 shadow-2xl text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <span>📦</span> فاکتور سفارش:{" "}
                  <span className="font-mono text-[var(--accent-blue)]">
                    {selectedOrder.orderNumber || selectedOrder.id}
                  </span>
                </h3>
                {selectedOrder.created_at && (
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                    تاریخ ثبت: {new Date(selectedOrder.created_at).toLocaleString("fa-IR")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <h4 className="font-black text-[var(--accent-blue)]">👤 مشخصات خریدار:</h4>
                <p>
                  <strong>نام:</strong>{" "}
                  {selectedOrder.customer?.fullName || selectedOrder.customerName}
                </p>
                <p>
                  <strong>شماره تماس:</strong>{" "}
                  <span className="font-mono">
                    {selectedOrder.customer?.phone || selectedOrder.phone}
                  </span>
                </p>
                {(selectedOrder.province || selectedOrder.city) && (
                  <p>
                    <strong>استان / شهر:</strong>{" "}
                    {[selectedOrder.province, selectedOrder.city].filter(Boolean).join(" - ")}
                  </p>
                )}
                <p>
                  <strong>نشانی پستی:</strong>{" "}
                  {selectedOrder.customer?.address || selectedOrder.address}
                </p>
                {(selectedOrder.postalCode || selectedOrder.postal_code) && (
                  <p>
                    <strong>کد پستی:</strong>{" "}
                    <span className="font-mono">
                      {selectedOrder.postalCode || selectedOrder.postal_code}
                    </span>
                  </p>
                )}
                {(selectedOrder.notes || selectedOrder.customer?.notes) && (
                  <p>
                    <strong>یادداشت مشتری:</strong>{" "}
                    {selectedOrder.notes || selectedOrder.customer?.notes}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <h4 className="font-black text-[var(--accent-blue)]">
                  💳 تراز مالی و وضعیت مرسوله:
                </h4>
                <p>
                  <strong>مبلغ کل اقلام:</strong>{" "}
                  <span className="font-mono">
                    {Number(
                      selectedOrder.totalAmount || selectedOrder.finalAmount || 0
                    ).toLocaleString("fa-IR")}{" "}
                    تومان
                  </span>
                </p>
                {Number(selectedOrder.discountAmount || 0) > 0 && (
                  <p>
                    <strong>تخفیف اعمال‌شده:</strong>{" "}
                    <span className="font-mono text-rose-400">
                      {Number(selectedOrder.discountAmount).toLocaleString("fa-IR")} تومان
                    </span>
                  </p>
                )}
                <p>
                  <strong>مبلغ نهایی:</strong>{" "}
                  <span className="font-mono font-black text-emerald-500">
                    {Number(
                      selectedOrder.finalAmount || selectedOrder.totalAmount || 0
                    ).toLocaleString("fa-IR")}{" "}
                    تومان
                  </span>
                </p>
                <p>
                  <strong>وضعیت جاری:</strong> {getStatusBadge(selectedOrder.status)}
                </p>
                <p>
                  <strong>کد رهگیری پست:</strong>{" "}
                  <span className="font-mono">
                    {selectedOrder.trackingCode || selectedOrder.tracking_code || "صادر نشده"}
                  </span>
                </p>
              </div>
            </div>

            {/* جدول اقلام داخل سفارش */}
            {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 && (
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 text-xs">
                <h4 className="font-black text-[var(--accent-blue)]">
                  🛍️ اقلام سفارش ({selectedOrder.items.length} قلم):
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                        <th className="pb-2">عنوان کالا</th>
                        <th className="pb-2 text-center">تعداد</th>
                        <th className="pb-2">قیمت واحد</th>
                        <th className="pb-2">جمع ردیف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {selectedOrder.items.map((item: any, idx: number) => {
                        const qty = Number(item.quantity || 1);
                        const uPrice = Number(item.unit_price || item.price || 0);
                        return (
                          <tr key={idx}>
                            <td className="py-2 font-bold">
                              {item.title || item.name}
                              {item.selectedColor && (
                                <span className="mr-1.5 text-[10px] text-[var(--accent-blue)]">
                                  (رنگ: {item.selectedColor})
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-center font-mono font-bold">{qty}</td>
                            <td className="py-2 font-mono">
                              {uPrice.toLocaleString("fa-IR")} ت
                            </td>
                            <td className="py-2 font-mono font-bold text-emerald-500">
                              {(uPrice * qty).toLocaleString("fa-IR")} ت
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => printOrderInvoice(selectedOrder)}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>چاپ فاکتور رسمی</span>
              </button>
              {selectedOrder.status === "delivered" && (
                <button
                  type="button"
                  onClick={() => handleSendReviewSms(selectedOrder)}
                  className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black transition shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <span>💬</span>
                  <span>ارسال پیامک نظرسنجی</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {trackingModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTrackingModal({ open: false, order: null, code: "" });
            }
          }}
        >
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 shadow-2xl text-[var(--text-primary)]">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
              <span className="text-2xl">📮</span>
              <div>
                <h3 className="font-black text-sm">ارسال به شرکت ملی پست و صدور بارنامه</h3>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  پیامک خودکار کد مرسوله پیشتاز برای خریدار
                </p>
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-[var(--text-secondary)]">
                شماره مرسوله / بارنامه پستی (۲۴ رقمی):
              </label>
              <input
                type="text"
                dir="ltr"
                placeholder="184590219400018370000114"
                value={trackingModal.code}
                onChange={(e) => setTrackingModal({ ...trackingModal, code: e.target.value })}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-center font-bold text-xs focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setTrackingModal({ open: false, order: null, code: "" })}
                className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] text-xs font-bold text-[var(--text-secondary)] border border-[var(--card-border)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmTrackingCode}
                className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 shadow-lg cursor-pointer"
              >
                تایید و ارسال پیامک 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}