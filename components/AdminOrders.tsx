// File Path: components/AdminOrders.tsx
"use client";

import React, { useState, useEffect } from "react";
import { orderService, Order } from "@/services/orderService";
import { smsService } from "@/services/smsService";
import { soundEngine } from "@/lib/soundEngine";

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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll();
      setOrders(data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleOrdersUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setOrders(e.detail);
      else fetchOrders();
    };

    window.addEventListener("orders_updated", handleOrdersUpdate);
    return () => {
      window.removeEventListener("orders_updated", handleOrdersUpdate);
    };
  }, []);

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
      await orderService.updateStatus(orderId, newStatus as any);
      const updated = orders.map((o) =>
        String(o.id) === String(orderId) ? { ...o, status: newStatus as any } : o
      );
      setOrders(updated);

      if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
      soundEngine.playSuccess();
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
      await orderService.updateStatus(orderId, "shipped", code);

      const updated = orders.map((o) =>
        String(o.id) === String(orderId)
          ? { ...o, status: "shipped" as any, tracking_code: code, trackingCode: code }
          : o
      );
      setOrders(updated);

      if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
        setSelectedOrder({
          ...selectedOrder,
          status: "shipped" as any,
          tracking_code: code,
          trackingCode: code,
        });
      }

      const phone =
        trackingModal.order.customer?.phone ||
        (trackingModal.order as any).customer_phone ||
        (trackingModal.order as any).phone;
      const name =
        trackingModal.order.customer?.fullName ||
        trackingModal.order.customer?.name ||
        (trackingModal.order as any).customer_name ||
        "مشتری گرامی";

      if (phone) {
        try {
          await smsService.sendTrackingCode(phone, name, code);
        } catch (smsErr) {
          console.error("SMS Error:", smsErr);
        }
      }

      soundEngine.playSuccess();
      alert("✅ سفارش به وضعیت «ارسال به پست» تغییر یافت و پیامک کد رهگیری پستی به مشتری ارسال شد.");
    } catch (err) {
      console.error(err);
      alert("خطا در ثبت کد رهگیری");
    } finally {
      setUpdatingId(null);
      setTrackingModal({ open: false, order: null, code: "" });
    }
  };

  const printOrderInvoice = (order: Order) => {
    soundEngine.playClick();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const items = order.items || [];
    const customerName = order.customer?.fullName || order.customer?.name || (order as any).customer_name || "خریدار محترم";
    const customerPhone = order.customer?.phone || (order as any).customer_phone || (order as any).phone || "---";
    const address = order.customer?.address || (order as any).address || "ثبت نشده";
    const total = Number(order.finalAmount || order.final_amount || order.totalAmount || (order as any).total_amount || 0).toLocaleString("fa-IR");

    printWindow.document.write(`
      <html dir="rtl" lang="fa">
        <head>
          <title>فاکتور رسمی سفارش ${order.id}</title>
          <style>
            body { font-family: Tahoma, sans-serif; padding: 30px; direction: rtl; color: #0f172a; font-size: 13px; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; margin: 0; color: #2563eb; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
            .box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #f8fafc; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; }
            th { background: #e2e8f0; font-weight: bold; }
            .total-row { font-size: 15px; font-weight: bold; background: #eff6ff; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">فاکتور رسمی فروش کالا و خدمات استودیویی</h1>
            <p>شماره سفارش: ${order.orderNumber || order.id} | تاریخ: ${order.created_at ? new Date(order.created_at).toLocaleDateString("fa-IR") : new Date().toLocaleDateString("fa-IR")}</p>
          </div>
          <div class="info-grid">
            <div class="box">
              <p><strong>نام و نام خانوادگی خریدار:</strong> ${customerName}</p>
              <p><strong>شماره تماس:</strong> ${customerPhone}</p>
            </div>
            <div class="box">
              <p><strong>نشانی ارسال مرسوله:</strong> ${address}</p>
              <p><strong>کد رهگیری پستی:</strong> ${order.trackingCode || order.tracking_code || 'صادر نشده'}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ردیف</th>
                <th>نام کالا</th>
                <th>تعداد</th>
                <th>قیمت واحد (تومان)</th>
                <th>مبلغ کل (تومان)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any, idx: number) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.title || item.name}</td>
                  <td>${item.quantity || 1}</td>
                  <td>${Number(item.price || 0).toLocaleString("fa-IR")}</td>
                  <td>${Number((item.price || 0) * (item.quantity || 1)).toLocaleString("fa-IR")}</td>
                </tr>
              `).join("")}
              <tr class="total-row">
                <td colspan="4" style="text-align: left; padding-left: 20px;">مبلغ نهایی قابل پرداخت:</td>
                <td>${total} تومان</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>کلیه کالاهای این فاکتور دارای ضمانت اصالت فیزیکی و تست سلامت می‌باشند.</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">پرداخت شده</span>;
      case "processing":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 border border-amber-500/20">در حال پردازش</span>;
      case "shipped":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 border border-blue-500/20">ارسال به پست</span>;
      case "delivered":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-600 border border-purple-500/20">تحویل داده شده</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 border border-rose-500/20">لغو شده</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-500/15 text-slate-600 border border-slate-500/20">در انتظار پرداخت</span>;
    }
  };

  const filteredOrders = orders.filter((o: any) => {
    const matchesTab = activeTab === "all" || o.status === activeTab;
    const name = o.customer?.fullName || o.customer?.name || o.customer_name || "";
    const phone = o.customer?.phone || o.customer_phone || o.phone || "";
    const id = String(o.id || "");
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      id.includes(searchQuery);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📑</span> مدیریت سفارش‌ها، صدور فاکتور و رهگیری پستی
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تغییر وضعیت فاکتور، درج کد مرسوله پیشتاز و ارسال خودکار پیامک رهگیری به خریدار
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
        >
          <span>🔄</span>
          <span>بروزرسانی زنده</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 rounded-2xl shadow-sm">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 text-xs scrollbar-none">
          {[
            { id: "all", label: "همه" },
            { id: "pending", label: "در انتظار پرداخت" },
            { id: "paid", label: "پرداخت شده" },
            { id: "processing", label: "در حال پردازش" },
            { id: "shipped", label: "ارسال شده" },
            { id: "delivered", label: "تحویل شده" },
            { id: "cancelled", label: "لغو شده" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tab.id);
              }}
              className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap text-xs ${
                activeTab === tab.id
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--card-border)]"
              }`}
            >
              {tab.label}
              <span className="mr-1.5 opacity-70">
                ({tab.id === "all" ? orders.length : orders.filter((o) => o.status === tab.id).length})
              </span>
            </button>
          ))}
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام، تلفن، شناسه..."
            className="w-full px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto mb-2" />
          <span className="text-xs text-[var(--text-secondary)] font-bold">در حال دریافت لیست سفارش‌ها...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl space-y-2">
          <span className="text-4xl block">🔍</span>
          <p className="text-xs font-bold text-[var(--text-secondary)]">سفارشی با این مشخصات ثبت نشده است.</p>
        </div>
      ) : (
        <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] font-bold text-[11px]">
                  <th className="p-4">شناسه</th>
                  <th className="p-4">نام خریدار</th>
                  <th className="p-4">شماره تماس</th>
                  <th className="p-4">مبلغ (تومان)</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">کد رهگیری پست</th>
                  <th className="p-4 text-center">عملیات و پردازش</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] font-medium">
                {filteredOrders.map((order: any) => {
                  const items = order.items || [];
                  const isUpdating = updatingId === order.id;
                  const cName = order.customer?.fullName || order.customer?.name || order.customer_name || "بدون نام";
                  const cPhone = order.customer?.phone || order.customer_phone || order.phone || "---";
                  const total = order.finalAmount || order.final_amount || order.totalAmount || order.total_amount || 0;
                  const trackCode = order.trackingCode || order.tracking_code;

                  return (
                    <tr key={order.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                      <td className="p-4 font-mono font-bold text-[var(--accent-blue)]">{order.id}</td>
                      <td className="p-4">
                        <div className="font-black text-[var(--text-primary)]">{cName}</div>
                        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">{items.length} قلم کالا</div>
                      </td>
                      <td className="p-4 font-mono text-[var(--text-primary)]">{cPhone}</td>
                      <td className="p-4 font-mono font-black text-[var(--accent-blue)]">
                        {Number(total).toLocaleString("fa-IR")}
                      </td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                      <td className="p-4 font-mono text-[11px] text-[var(--text-secondary)]">
                        {trackCode ? (
                          <span className="px-2 py-0.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)]">
                            {trackCode}
                          </span>
                        ) : (
                          "---"
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              soundEngine.playClick();
                              setSelectedOrder(order);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] font-bold transition cursor-pointer"
                          >
                            👁️ جزئیات
                          </button>

                          <button
                            onClick={() => printOrderInvoice(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-emerald-500 text-[11px] font-bold transition cursor-pointer"
                          >
                            🖨️ فاکتور
                          </button>

                          <select
                            disabled={isUpdating}
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            className="p-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="pending">در انتظار پرداخت</option>
                            <option value="paid">پرداخت شده</option>
                            <option value="processing">در حال پردازش</option>
                            <option value="shipped">ارسال به پست (SMS) 📮</option>
                            <option value="delivered">تحویل به خریدار</option>
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

      {/* مدال جزئیات سفارش */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn font-sans">
          <div className="max-w-2xl w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-6 shadow-2xl text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <span>📦</span> فاکتور کامل سفارش:{" "}
                  <span className="font-mono text-[var(--accent-blue)]">{selectedOrder.id}</span>
                </h3>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  تاریخ ثبت: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString("fa-IR") : "---"}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center font-bold text-xs hover:border-[var(--accent-blue)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <h4 className="font-black text-[var(--accent-blue)]">👤 گیرنده مرسوله:</h4>
                <p><strong>نام:</strong> {selectedOrder.customer?.fullName || selectedOrder.customer?.name || (selectedOrder as any).customer_name}</p>
                <p><strong>تلفن:</strong> <span className="font-mono">{selectedOrder.customer?.phone || (selectedOrder as any).customer_phone || (selectedOrder as any).phone}</span></p>
                <p><strong>کد پستی:</strong> <span className="font-mono">{selectedOrder.customer?.postalCode || (selectedOrder as any).postal_code || "---"}</span></p>
                <p><strong>نشانی پستی:</strong> {selectedOrder.customer?.address || (selectedOrder as any).address}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <h4 className="font-black text-[var(--accent-blue)]">💳 اطلاعات مالی و پست:</h4>
                <p><strong>مبلغ نهایی:</strong> <span className="font-mono font-black">{Number(selectedOrder.finalAmount || selectedOrder.final_amount || selectedOrder.totalAmount || (selectedOrder as any).total_amount || 0).toLocaleString("fa-IR")} تومان</span></p>
                <p><strong>وضعیت سفارش:</strong> {getStatusBadge(selectedOrder.status)}</p>
                <p><strong>کد رهگیری پست:</strong> <span className="font-mono">{selectedOrder.trackingCode || selectedOrder.tracking_code || "صادر نشده"}</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-xs text-[var(--text-primary)]">🛍️ اقلام خریداری شده:</h4>
              <div className="divide-y divide-[var(--card-border)] border border-[var(--card-border)] rounded-2xl overflow-hidden bg-[var(--input-bg)]">
                {(selectedOrder.items || []).map((item: any, i: number) => (
                  <div key={i} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {(item.image || item.image_url) && (
                        <img src={item.image || item.image_url} alt="" className="w-10 h-10 object-contain rounded-lg bg-[var(--modal-bg)] p-1 border border-[var(--card-border)]" />
                      )}
                      <div>
                        <div className="font-black text-[var(--text-primary)]">{item.title || item.name}</div>
                        <span className="text-[10px] text-[var(--text-secondary)]">تعداد: {item.quantity} عدد</span>
                      </div>
                    </div>
                    <div className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {Number((item.price || 0) * (item.quantity || 1)).toLocaleString("fa-IR")} تومان
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                onClick={() => printOrderInvoice(selectedOrder)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>چاپ فاکتور رسمی</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مدال ثبت بارنامه و ارسال پیامک */}
      {trackingModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn font-sans">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 shadow-2xl text-[var(--text-primary)]">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
              <span className="text-2xl">📮</span>
              <div>
                <h3 className="font-black text-sm">ارسال به شرکت ملی پست و صدور بارنامه</h3>
                <p className="text-[10px] text-[var(--text-secondary)]">پیامک خودکار کد مرسوله برای خریدار</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              لطفاً کد ۲۴ رقمی بارنامه پیشتاز را وارد نمایید تا پیامک حاوی لینک پیگیری ارسال شود:
            </p>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-[var(--text-secondary)]">
                شماره مرسوله / بارنامه پستی (۲۴ رقمی):
              </label>
              <input
                type="text"
                placeholder="مثال: 184590219400018370000114"
                value={trackingModal.code}
                onChange={(e) => setTrackingModal({ ...trackingModal, code: e.target.value })}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-center font-bold text-xs focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setTrackingModal({ open: false, order: null, code: "" })}
                className="px-4 py-2 rounded-xl bg-[var(--input-bg)] text-xs font-bold text-[var(--text-secondary)] border border-[var(--card-border)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmTrackingCode}
                className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 shadow-md cursor-pointer"
              >
                تایید بارنامه و ارسال پیامک 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}