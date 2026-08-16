"use client";

import React, { useState, useEffect } from "react";
import { orderService, Order } from "@/services/orderService";
import { smsService } from "@/services/smsService";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // استیت مدال ثبت کد رهگیری پستی و ارسال پیامک
  const [trackingModal, setTrackingModal] = useState<{
    open: boolean;
    order: Order | null;
    code: string;
  }>({ open: false, order: null, code: "" });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let data: Order[] = [];
      if (typeof orderService.getAllOrders === "function") {
        data = await orderService.getAllOrders();
      }
      if (!data || data.length === 0) {
        data = JSON.parse(
          localStorage.getItem("admin_orders_cache") ||
          localStorage.getItem("site_orders") ||
          "[]"
        );
      }
      setOrders(data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);

    // در صورت تغییر وضعیت به ارسال شده، فرم کد پستی و ارسال پیامک باز شود
    if (newStatus === "shipped" && targetOrder) {
      setTrackingModal({
        open: true,
        order: targetOrder,
        code: targetOrder.tracking_code || "",
      });
      return;
    }

    setUpdatingId(orderId);
    try {
      if (typeof orderService.updateOrderStatus === "function") {
        await orderService.updateOrderStatus(orderId, newStatus as any);
      }

      const updated = orders.map((o) =>
        o.id === orderId ? { ...o, status: newStatus as any } : o
      );
      setOrders(updated);
      localStorage.setItem("admin_orders_cache", JSON.stringify(updated));
      localStorage.setItem("site_orders", JSON.stringify(updated));

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert("خطا در بروزرسانی وضعیت سفارش");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmTrackingCode = async () => {
    if (!trackingModal.order || !trackingModal.code.trim()) return;

    const orderId = trackingModal.order.id;
    const code = trackingModal.code.trim();
    setUpdatingId(orderId);

    try {
      if (typeof orderService.updateOrderStatus === "function") {
        await orderService.updateOrderStatus(orderId, "shipped");
      }

      const updated = orders.map((o) =>
        o.id === orderId
          ? { ...o, status: "shipped" as any, tracking_code: code }
          : o
      );
      setOrders(updated);
      localStorage.setItem("admin_orders_cache", JSON.stringify(updated));
      localStorage.setItem("site_orders", JSON.stringify(updated));

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: "shipped" as any,
          tracking_code: code,
        });
      }

      // ارسال پیامک خودکار کد رهگیری پست
      const phone =
        trackingModal.order.customer_phone ||
        (trackingModal.order as any).customerPhone;
      const name =
        trackingModal.order.customer_name ||
        (trackingModal.order as any).customerName ||
        "مشتری گرامی";

      if (phone) {
        await smsService.sendTrackingCode(phone, name, code);
      }

      alert("✅ سفارش به وضعیت «ارسال شده» تغییر یافت و پیامک کد رهگیری برای مشتری ارسال گردید.");
    } catch (err) {
      console.error(err);
      alert("خطا در ثبت کد رهگیری");
    } finally {
      setUpdatingId(null);
      setTrackingModal({ open: false, order: null, code: "" });
    }
  };

  // خروجی اکسل (CSV) استاندارد با پشتیبانی کامل از حروف فارسی
  const exportToCSV = () => {
    if (orders.length === 0) {
      alert("سفارشی برای خروجی یافت نشد.");
      return;
    }

    const headers = ["شناسه سفارش,نام خریدار,شماره تماس,مبلغ کل (تومان),وضعیت,کد رهگیری پستی,تاریخ ثبت\n"];
    const rows = orders.map((o: any) =>
      `"${o.id}","${o.customer_name || o.customerName || ""}","${o.customer_phone || o.customerPhone || ""}","${o.total_amount || o.totalAmount || 0}","${o.status || ""}","${o.tracking_code || ""}","${o.created_at || ""}"\n`
    );

    const blob = new Blob(["\uFEFF" + headers.concat(rows).join("")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Orders_Report_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // چاپ فاکتور استاندارد رسمی سفارش
  const printOrderInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const items = order.items || (order as any).cart_items || [];
    const customerName = order.customer_name || (order as any).customerName || "خریدار محترم";
    const customerPhone = order.customer_phone || (order as any).customerPhone || "---";
    const address = order.shipping_address || (order as any).shippingAddress || (order as any).address || "ثبت نشده";
    const total = Number(order.total_amount || (order as any).totalAmount || 0).toLocaleString("fa-IR");

    printWindow.document.write(`
      <html dir="rtl" lang="fa">
        <head>
          <title>فاکتور سفارش ${order.id}</title>
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
            <h1 class="title">فاکتور رسمی فروش کالا - فروشگاه تخصصی Tech</h1>
            <p>شماره سفارش: ${order.id} | تاریخ: ${order.created_at ? new Date(order.created_at).toLocaleDateString("fa-IR") : new Date().toLocaleDateString("fa-IR")}</p>
          </div>
          <div class="info-grid">
            <div class="box">
              <p><strong>نام و نام خانوادگی خریدار:</strong> ${customerName}</p>
              <p><strong>شماره تماس:</strong> ${customerPhone}</p>
            </div>
            <div class="box">
              <p><strong>نشانی ارسال مرسوله:</strong> ${address}</p>
              <p><strong>وضعیت سفارش:</strong> ${getStatusLabel(order.status)}</p>
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
              ${items.length > 0 ? items.map((item: any, idx: number) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.title || item.name}</td>
                  <td>${item.quantity || 1}</td>
                  <td>${Number(item.price || 0).toLocaleString("fa-IR")}</td>
                  <td>${Number((item.price || 0) * (item.quantity || 1)).toLocaleString("fa-IR")}</td>
                </tr>
              `).join("") : `<tr><td colspan="5" style="text-align:center;">اطلاعات اقلام سفارش ثبت نشده است.</td></tr>`}
              <tr class="total-row">
                <td colspan="4" style="text-align: left; padding-left: 20px;">مبلغ نهایی فاکتور:</td>
                <td>${total} تومان</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>از خرید شما سپاسگزاریم. کلیه کالاهای این فروشگاه دارای ضمانت اصالت و سلامت فیزیکی می‌باشند.</p>
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
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 border border-blue-500/20">ارسال شده به پست</span>;
      case "delivered":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-600 border border-purple-500/20">تحویل داده شده</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 border border-rose-500/20">لغو شده</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-500/15 text-slate-600 border border-slate-500/20">در انتظار پرداخت</span>;
    }
  };

  function getStatusLabel(status: string) {
    switch (status) {
      case "paid": return "پرداخت شده";
      case "processing": return "در حال بسته‌بندی";
      case "shipped": return "ارسال به پست";
      case "delivered": return "تحویل به مشتری";
      case "cancelled": return "لغو شده";
      default: return "در انتظار پرداخت";
    }
  }

  const filteredOrders = orders.filter((o: any) => {
    const matchesTab = activeTab === "all" || o.status === activeTab;
    const name = o.customer_name || o.customerName || "";
    const phone = o.customer_phone || o.customerPhone || "";
    const id = o.id || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      id.includes(searchQuery);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]">
      
      {/* سربرگ مدیریت سفارش‌ها و دکمه‌های کنترل */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📑</span> مدیریت و پردازش هوشمند سفارش‌ها
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            رهگیری، تغییر وضعیت سفارش، ارسال خودکار پیامک پستی و چاپ فاکتور
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <span>📊</span>
            <span>خروجی اکسل</span>
          </button>
          <button
            onClick={fetchOrders}
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>بروزرسانی</span>
          </button>
        </div>
      </div>

      {/* نوار جستجو و تب‌های وضعیت */}
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
              onClick={() => setActiveTab(tab.id)}
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
            placeholder="جستجوی نام، تلفن، شماره سفارش..."
            className="w-full px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {/* جدول نمایش لیست سفارش‌ها */}
      {loading ? (
        <div className="py-16 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto mb-2" />
          <span className="text-xs text-[var(--text-secondary)] font-bold">در حال دریافت لیست سفارش‌ها...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl space-y-2">
          <span className="text-4xl block">🔍</span>
          <p className="text-xs font-bold text-[var(--text-secondary)]">سفارشی مطابق با این فیلتر ثبت نشده است.</p>
        </div>
      ) : (
        <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] font-bold text-[11px]">
                  <th className="p-4">شناسه</th>
                  <th className="p-4">خریدار</th>
                  <th className="p-4">شماره تماس</th>
                  <th className="p-4">مبلغ (تومان)</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">کد رهگیری پست</th>
                  <th className="p-4 text-center">عملیات و تغییر وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] font-medium">
                {filteredOrders.map((order: any) => {
                  const items = order.items || order.cart_items || [];
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                      <td className="p-4 font-mono font-bold text-[var(--accent-blue)]">{order.id}</td>
                      <td className="p-4">
                        <div className="font-black text-[var(--text-primary)]">
                          {order.customer_name || order.customerName || "بدون نام"}
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                          {items.length} قلم کالا
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[var(--text-primary)]">
                        {order.customer_phone || order.customerPhone || "---"}
                      </td>
                      <td className="p-4 font-mono font-black text-[var(--accent-blue)]">
                        {Number(order.total_amount || order.totalAmount || 0).toLocaleString("fa-IR")}
                      </td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                      <td className="p-4 font-mono text-[11px] text-[var(--text-secondary)]">
                        {order.tracking_code ? (
                          <span className="px-2 py-0.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)]">
                            {order.tracking_code}
                          </span>
                        ) : (
                          "---"
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] font-bold transition cursor-pointer"
                            title="مشاهده جزئیات کامل"
                          >
                            👁️ جزئیات
                          </button>

                          <button
                            onClick={() => printOrderInvoice(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-emerald-500 text-[11px] font-bold transition cursor-pointer"
                            title="چاپ فاکتور رسمی"
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

      {/* مدال نمایش جزئیات کامل سفارش */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="max-w-2xl w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-6 shadow-2xl text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <span>📦</span> جزئیات کامل سفارش:{" "}
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
                <h4 className="font-black text-[var(--accent-blue)]">👤 مشخصات گیرنده:</h4>
                <p><strong>نام خریدار:</strong> {selectedOrder.customer_name || (selectedOrder as any).customerName}</p>
                <p><strong>تلفن همراه:</strong> <span className="font-mono">{selectedOrder.customer_phone || (selectedOrder as any).customerPhone}</span></p>
                <p><strong>آدرس گیرنده:</strong> {selectedOrder.shipping_address || (selectedOrder as any).shippingAddress || (selectedOrder as any).address || "ثبت نشده"}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <h4 className="font-black text-[var(--accent-blue)]">💳 اطلاعات مالی:</h4>
                <p><strong>مبلغ کل:</strong> <span className="font-mono font-black">{Number(selectedOrder.total_amount || (selectedOrder as any).totalAmount || 0).toLocaleString("fa-IR")} تومان</span></p>
                <p><strong>وضعیت فعلی:</strong> {getStatusBadge(selectedOrder.status)}</p>
                <p><strong>کد مرسوله پستی:</strong> <span className="font-mono">{selectedOrder.tracking_code || "هنوز صادر نشده"}</span></p>
              </div>
            </div>

            {/* لیست کالاهای خریداری شده */}
            <div className="space-y-3">
              <h4 className="font-black text-xs text-[var(--text-primary)]">🛍️ اقلام خریداری شده در این سفارش:</h4>
              <div className="divide-y divide-[var(--card-border)] border border-[var(--card-border)] rounded-2xl overflow-hidden bg-[var(--input-bg)]">
                {(selectedOrder.items || (selectedOrder as any).cart_items || []).map((item: any, i: number) => (
                  <div key={i} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-10 h-10 object-contain rounded-lg bg-[var(--modal-bg)] p-1" />
                      )}
                      <div>
                        <div className="font-black text-[var(--text-primary)]">{item.title || item.name}</div>
                        {item.selectedColor && (
                          <div className="text-[10px] text-[var(--text-secondary)]">رنگ: {item.selectedColor}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-left font-mono">
                      <div className="font-bold">{item.quantity} عدد</div>
                      <div className="text-[11px] text-[var(--accent-blue)] font-black">
                        {Number(item.price || 0).toLocaleString("fa-IR")} تومان
                      </div>
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
                <span>چاپ فاکتور</span>
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

      {/* مدال ثبت بارنامه پستی و ارسال خودکار پیامک */}
      {trackingModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 shadow-2xl text-[var(--text-primary)]">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
              <span className="text-2xl">📮</span>
              <div>
                <h3 className="font-black text-sm">ارسال سفارش به شرکت ملی پست</h3>
                <p className="text-[10px] text-[var(--text-secondary)]">صدور پیامک خودکار کد رهگیری برای خریدار</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              لطفاً کد ۲۴ رقمی بارنامه پستی را وارد نمایید. به محض تایید، وضعیت سفارش به «ارسال شده» تغییر کرده و پیامک رهگیری به شماره{" "}
              <strong className="text-[var(--text-primary)] font-mono">
                {trackingModal.order?.customer_phone || (trackingModal.order as any)?.customerPhone}
              </strong>{" "}
              ارسال می‌گردد.
            </p>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-[var(--text-secondary)]">
                شماره مرسوله / بارنامه پستی:
              </label>
              <input
                type="text"
                placeholder="مثلاً: 123456789012345678901234"
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
                تایید و ارسال پیامک 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}