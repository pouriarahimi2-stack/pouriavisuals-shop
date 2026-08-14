"use client";

import React, { useState, useEffect } from "react";
import { orderService, Order } from "@/services/orderService";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // استیت‌های مدال‌ها
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // مدال جزئیات سریع
  const [editingOrder, setEditingOrder] = useState<Order | null>(null); // مدال ویرایش هوشمند

  // استیت‌های پیام نوتیفیکیشن و مدال پرسش
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadOrders = () => {
    setOrders(orderService.getOrders());
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // تغییر وضعیت سریع سفارش
  const handleQuickStatusChange = (id: string, newStatus: Order["status"]) => {
    orderService.updateOrderStatus(id, newStatus);
    loadOrders();
    showToast(`🔄 وضعیت سفارش #${id} بروزرسانی شد.`);
  };

  // حذف سفارش با مدال تأیید
  const handleDeleteOrder = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "حذف سفارش",
      message: `آیا از حذف سفارش #${id} اطمینان دارید؟ این عملیات قابل بازگشت نیست.`,
      onConfirm: () => {
        const allOrders = orderService.getOrders();
        const updated = allOrders.filter((o) => o.id !== id);
        orderService.saveOrders(updated);
        loadOrders();
        if (selectedOrder?.id === id) setSelectedOrder(null);
        showToast(`🗑️ سفارش #${id} با موفقیت حذف شد.`);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ذخیره فرم ویرایش هوشمند سفارش
  const handleSaveEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setConfirmModal({
      isOpen: true,
      title: "ذخیره تغییرات سفارش",
      message: `آیا از ذخیره تغییرات جدید برای سفارش #${editingOrder.id} اطمینان دارید؟`,
      onConfirm: () => {
        const allOrders = orderService.getOrders();
        const updated = allOrders.map((o) => (o.id === editingOrder.id ? editingOrder : o));
        orderService.saveOrders(updated);
        loadOrders();
        setEditingOrder(null);
        showToast(`✅ تغییرات سفارش #${editingOrder.id} با موفقیت ذخیره شد.`);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 📊 خروجی اکسل (CSV)
  const exportToCSV = () => {
    if (orders.length === 0) {
      showToast("⚠️ سفارشی برای خروجی گرفتن وجود ندارد.");
      return;
    }

    const headers = ["کد سفارش", "نام خریدار", "شماره تماس", "مبلغ کل (تومان)", "وضعیت", "تاریخ ثبت", "آدرس"];
    const rows = orders.map((o) => [
      o.id,
      o.customerName || "نامشخص",
      o.customerPhone || "نامشخص",
      o.finalAmount || 0,
      o.status === "pending" ? "در حال پردازش" : o.status === "completed" ? "تکمیل شده" : "لغو شده",
      new Date(o.createdAt).toLocaleDateString("fa-IR"),
      `"${(o.customerAddress || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Orders_Export_${new Date().toLocaleDateString("fa-IR")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("📊 خروجی اکسل با موفقیت دانلود شد.");
  };

  // 🖨️ چاپ فاکتور رسمی پستی PDF
  const printInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.title}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">${((item.discountPrice ?? item.price) * item.quantity).toLocaleString("fa-IR")} تومان</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاکتور فروش - #${order.id}</title>
          <style>
            body { font-family: tahoma, sans-serif; padding: 30px; color: #222; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
            .info-box { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; line-height: 1.8; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #eee; padding: 10px; text-align: right; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🛍️ فاکتور رسمی فروشگاه</h2>
            <p>شماره سفارش: <strong>#${order.id}</strong> | تاریخ: ${new Date(order.createdAt).toLocaleDateString("fa-IR")}</p>
          </div>
          
          <div class="info-box">
            <strong>مشخصات تحویل‌گیرنده:</strong><br/>
            نام و نام خانوادگی: ${order.customerName || "نامشخص"}<br/>
            شماره تماس: ${order.customerPhone || "نامشخص"}<br/>
            آدرس پستی: ${order.customerAddress || "نامشخص"}<br/>
            کد پستی: ${order.postalCode || "نامشخص"}
          </div>

          <table>
            <thead>
              <tr>
                <th>نام کالا</th>
                <th style="text-align: center;">تعداد</th>
                <th style="text-align: left;">قیمت کل</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: left; margin-top: 15px; font-size: 14px; font-weight: bold;">
            مبلغ قابل پرداخت: ${(order.finalAmount || 0).toLocaleString("fa-IR")} تومان
          </div>

          <div class="footer">
            با تشکر از خرید شما - این فاکتور به‌صورت خودکار صادر شده است.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const totalSales = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, curr) => acc + curr.finalAmount, 0);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 select-none relative text-xs font-sans">
      {/* پیام Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold shadow-2xl border border-white/20 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* مدال تأیید هوشمند */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="liquid-glass-card p-6 max-w-sm w-full space-y-4 border-white/20 shadow-2xl">
            <h4 className="font-bold text-base text-[var(--accent-blue)]">{confirmModal.title}</h4>
            <p className="opacity-80 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold hover:opacity-90 transition cursor-pointer"
              >
                بله، انجام بشه
              </button>
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* آمار کادر بالا */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass-card p-4 space-y-1">
          <span className="opacity-60 font-bold block">💰 فروش کل</span>
          <span className="text-lg font-black text-[var(--accent-blue)]">
            {totalSales.toLocaleString("fa-IR")} تومان
          </span>
        </div>

        <div className="liquid-glass-card p-4 space-y-1">
          <span className="opacity-60 font-bold block">📦 تعداد سفارش‌ها</span>
          <span className="text-lg font-black">{orders.length} سفارش</span>
        </div>

        <div className="liquid-glass-card p-4 space-y-1">
          <span className="opacity-60 font-bold block">⏳ در انتظار پردازش</span>
          <span className="text-lg font-black text-yellow-500">{pendingCount} سفارش</span>
        </div>

        <div className="liquid-glass-card p-4 space-y-1">
          <span className="opacity-60 font-bold block">✅ تکمیل شده</span>
          <span className="text-lg font-black text-green-400">{completedCount} سفارش</span>
        </div>
      </div>

      {/* نوار جستجو و فیلترها + دکمه خروجی اکسل */}
      <div className="liquid-glass-card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="🔍 جستجو بر اساس کد سفارش، نام یا شماره تلفن..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none font-bold cursor-pointer"
        >
          <option value="all">🌐 همه وضعیت‌ها</option>
          <option value="pending">⏳ در حال پردازش</option>
          <option value="completed">✅ تکمیل شده</option>
          <option value="cancelled">❌ لغو شده</option>
        </select>

        <button
          onClick={exportToCSV}
          className="px-4 py-2.5 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <span>📊</span> خروجی اکسل (CSV)
        </button>
      </div>

      {/* لیست کارت‌های خلوت و مرتب سفارشات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full liquid-glass-card p-8 text-center opacity-60">
            سفارشی مطابق با این مشخصات یافت نشد.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="liquid-glass-card p-4 space-y-3 flex flex-col justify-between border border-[var(--glass-border)] hover:border-[var(--accent-blue)] transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2">
                  <span className="font-mono font-bold text-sm text-[var(--accent-blue)]">
                    #{order.id}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleQuickStatusChange(order.id, e.target.value as Order["status"])}
                    className="p-1 rounded-lg bg-black/10 dark:bg-white/10 text-[10px] font-bold outline-none cursor-pointer border border-[var(--glass-border)]"
                  >
                    <option value="pending">⏳ در حال پردازش</option>
                    <option value="completed">✅ تکمیل شده</option>
                    <option value="cancelled">❌ لغو شده</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-sm">{order.customerName}</h4>
                  <p className="opacity-70 font-mono">📞 {order.customerPhone}</p>
                  <p className="opacity-60 text-[11px]">
                    🗓️ {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--glass-border)] space-y-3">
                <div className="flex justify-between items-center font-bold">
                  <span className="opacity-70">مبلغ کل:</span>
                  <span className="text-[var(--accent-blue)]">
                    {order.finalAmount.toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                {/* دکمه‌های کنترلی کارت شامل دکمه چاپ فاکتور */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 py-2 rounded-xl bg-blue-500/10 text-[var(--accent-blue)] font-bold hover:bg-blue-500/20 transition cursor-pointer"
                  >
                    👁️ جزئیات
                  </button>
                  <button
                    onClick={() => setEditingOrder({ ...order })}
                    className="flex-1 py-2 rounded-xl bg-amber-500/10 text-amber-400 font-bold hover:bg-amber-500/20 transition cursor-pointer"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => printInvoice(order)}
                    className="p-2 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition cursor-pointer"
                    title="چاپ فاکتور PDF"
                  >
                    🖨️
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition cursor-pointer"
                    title="حذف سفارش"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* مدال نمای سریع جزئیات سفارش (Quick Details Modal) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="liquid-glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border-white/20 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <span>📦</span> جزئیات کامل سفارش #{selectedOrder.id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold hover:bg-white/20 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 space-y-1.5 border border-[var(--glass-border)]">
                <p><strong>خریدار:</strong> {selectedOrder.customerName}</p>
                <p><strong>شماره تماس:</strong> <span className="font-mono">{selectedOrder.customerPhone}</span></p>
                <p><strong>کد پستی:</strong> <span className="font-mono">{selectedOrder.postalCode || "-"}</span></p>
                <p><strong>آدرس تحویل:</strong> {selectedOrder.customerAddress}</p>
              </div>

              {/* لاگ‌های امنیتی */}
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1 font-mono text-[11px]">
                <span className="font-bold text-[var(--accent-blue)] block font-sans">🛡️ لوگ‌های امنیتی و پیامک:</span>
                <p>وضعیت تایید تلفن: {selectedOrder.isPhoneVerified ? "✅ تایید شده با کد OTP" : "❌ تایید نشده"}</p>
                {selectedOrder.otpHash && <p>هش پیامک: {selectedOrder.otpHash}</p>}
                {selectedOrder.otpSentAt && <p>زمان ارسال: {new Date(selectedOrder.otpSentAt).toLocaleTimeString("fa-IR")}</p>}
              </div>

              {/* اقلام خریداری شده */}
              <div className="space-y-2">
                <span className="font-bold opacity-80 block">اقلام سفارش:</span>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)]">
                    <div className="flex items-center gap-2">
                      {item.image && <img src={item.image} alt={item.title} className="w-8 h-8 object-cover rounded-lg" />}
                      <span className="font-bold">{item.title}</span>
                    </div>
                    <span className="font-mono">{item.quantity} عدد × {((item.discountPrice ?? item.price)).toLocaleString("fa-IR")} تومان</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 font-bold space-y-1">
                <div className="flex justify-between">
                  <span>مبلغ کل:</span>
                  <span className="text-[var(--accent-blue)]">{selectedOrder.finalAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => printInvoice(selectedOrder)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer hover:bg-indigo-500 transition"
              >
                🖨️ چاپ فاکتور PDF
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold cursor-pointer hover:bg-white/20 transition"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مدال ویرایش هوشمند همه مشخصات سفارش (Smart Edit Modal) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleSaveEditOrder} className="liquid-glass-card max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 border-white/20 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-3">
              <h3 className="font-black text-base text-[var(--accent-blue)] flex items-center gap-2">
                <span>✏️</span> ویرایش هوشمند سفارش #{editingOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold hover:bg-white/20 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block mb-1 opacity-70 font-bold">نام و نام خانوادگی خریدار</label>
              <input
                type="text"
                value={editingOrder.customerName}
                onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 opacity-70 font-bold">شماره تماس</label>
                <input
                  type="text"
                  value={editingOrder.customerPhone}
                  onChange={(e) => setEditingOrder({ ...editingOrder, customerPhone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block mb-1 opacity-70 font-bold">کد پستی</label>
                <input
                  type="text"
                  value={editingOrder.postalCode || ""}
                  onChange={(e) => setEditingOrder({ ...editingOrder, postalCode: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 opacity-70 font-bold">آدرس دقیق ارسال</label>
              <textarea
                rows={2}
                value={editingOrder.customerAddress}
                onChange={(e) => setEditingOrder({ ...editingOrder, customerAddress: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 opacity-70 font-bold">وضعیت سفارش</label>
                <select
                  value={editingOrder.status}
                  onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value as Order["status"] })}
                  className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none font-bold cursor-pointer"
                >
                  <option value="pending">⏳ در حال پردازش</option>
                  <option value="completed">✅ تکمیل شده</option>
                  <option value="cancelled">❌ لغو شده</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 opacity-70 font-bold">وضعیت پرداخت</label>
                <select
                  value={editingOrder.paymentStatus}
                  onChange={(e) => setEditingOrder({ ...editingOrder, paymentStatus: e.target.value as Order["paymentStatus"] })}
                  className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none font-bold cursor-pointer"
                >
                  <option value="paid">✅ پرداخت شده</option>
                  <option value="unpaid">⏳ پرداخت نشده</option>
                  <option value="failed">❌ ناموفق</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer hover:opacity-90 transition shadow-md"
              >
                ذخیره تغییرات 💾
              </button>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="py-3 px-4 rounded-xl bg-white/10 text-white font-bold cursor-pointer hover:bg-white/20 transition"
              >
                لغو
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}