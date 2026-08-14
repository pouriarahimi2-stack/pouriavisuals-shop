"use client";

import { useState } from "react";

export interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  postalCode?: string;
  date: string;
  totalPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingFee?: number;
  status: "pending" | "processing" | "shipped" | "completed" | "cancelled";
  trackingCode?: string;
  items: {
    sku: string;
    title: string;
    variant: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }[];
}

export default function OrderManager() {
  const generateRandomOrderNumber = () => `ST-${Math.floor(10000 + Math.random() * 90000)}`;
  const generateRandomTrackingCode = () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 10)).join("");

  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: "ord-101",
      orderNumber: generateRandomOrderNumber(),
      customerName: "پوریا احمدی",
      customerPhone: "09123456789",
      customerAddress: "تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۱۲، واحد ۴",
      postalCode: "1993754321",
      date: "۱۴۰۵/۰۵/۲۰ - ۱۴:۳۰",
      totalPrice: 65000000,
      discountAmount: 2000000,
      taxAmount: 0,
      shippingFee: 50000,
      status: "processing",
      trackingCode: generateRandomTrackingCode(),
      items: [
        {
          sku: "IPH-15PM-256",
          title: "آیفون ۱۵ پرو مکس",
          variant: "۲۵۶ گیگابایت | تیتانیوم طبیعی",
          quantity: 1,
          unitPrice: 67000000,
          discount: 2000000,
        },
      ],
    },
  ]);

  const [selectedInvoice, setSelectedInvoice] = useState<OrderItem | null>(null);

  const [newOrder, setNewOrder] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    productTitle: "",
    productPrice: "",
  });

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName || !newOrder.productTitle || !newOrder.productPrice) return;

    const price = Number(newOrder.productPrice);
    const createdOrder: OrderItem = {
      id: Date.now().toString(),
      orderNumber: generateRandomOrderNumber(),
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone || "09120000000",
      customerAddress: newOrder.customerAddress || "ثبت نشده",
      postalCode: "1234567890",
      date: new Date().toLocaleDateString("fa-IR"),
      totalPrice: price,
      discountAmount: 0,
      shippingFee: 50000,
      status: "pending",
      trackingCode: "",
      items: [
        {
          sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          title: newOrder.productTitle,
          variant: "استاندارد",
          quantity: 1,
          unitPrice: price,
          discount: 0,
        },
      ],
    };

    setOrders([createdOrder, ...orders]);
    setNewOrder({ customerName: "", customerPhone: "", customerAddress: "", productTitle: "", productPrice: "" });
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm("آیا از حذف این سفارش اطمینان دارید؟")) {
      setOrders(orders.filter((o) => o.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: OrderItem["status"]) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
  };

  const handleTrackingCodeChange = (id: string, code: string) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, trackingCode: code } : o)));
  };

  const handleGenerateTrackingCode = (id: string) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, trackingCode: generateRandomTrackingCode() } : o)));
  };

  const handleDeleteTrackingCode = (id: string) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, trackingCode: "" } : o)));
  };

  const getStatusBadge = (status: OrderItem["status"]) => {
    switch (status) {
      case "pending":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">در انتظار پرداخت</span>;
      case "processing":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">در حال پردازش</span>;
      case "shipped":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">تحویل به پست</span>;
      case "completed":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">تکمیل شده</span>;
      case "cancelled":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">لغو شده</span>;
    }
  };

  return (
    <div className="space-y-8 dir-rtl">
      {/* فرم ثبت دستی سفارش */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-4 print:hidden">
        <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3">
          ➕ ثبت دستی سفارش جدید
        </h2>
        <form onSubmit={handleAddOrder} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="text"
            suppressHydrationWarning
            placeholder="نام خریدار *"
            required
            value={newOrder.customerName}
            onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
            className="bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs focus:outline-none"
          />
          <input
            type="text"
            suppressHydrationWarning
            placeholder="شماره تماس"
            value={newOrder.customerPhone}
            onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
            className="bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs focus:outline-none"
          />
          <input
            type="text"
            suppressHydrationWarning
            placeholder="آدرس خریدار"
            value={newOrder.customerAddress}
            onChange={(e) => setNewOrder({ ...newOrder, customerAddress: e.target.value })}
            className="bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs focus:outline-none"
          />
          <input
            type="text"
            suppressHydrationWarning
            placeholder="نام محصول *"
            required
            value={newOrder.productTitle}
            onChange={(e) => setNewOrder({ ...newOrder, productTitle: e.target.value })}
            className="bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs focus:outline-none"
          />
          <input
            type="number"
            suppressHydrationWarning
            placeholder="مبلغ کل (تومان) *"
            required
            value={newOrder.productPrice}
            onChange={(e) => setNewOrder({ ...newOrder, productPrice: e.target.value })}
            className="bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs focus:outline-none"
          />
          <button
            type="submit"
            className="bg-[var(--accent-blue)] text-white py-2 rounded-xl text-xs font-bold hover:opacity-90 transition shadow-md"
          >
            ثبت سفارش در سیستم
          </button>
        </form>
      </div>

      {/* جدول لیست سفارش‌ها */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-6 print:hidden">
        <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">📦 مرکز مدیریت و رهگیری سفارش‌ها</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">مدیریت پویای کد مرسوله پستی، صدور فاکتور و حذف سفارش</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)]">
                <th className="pb-3 px-2">شماره سفارش</th>
                <th className="pb-3 px-2">خریدار</th>
                <th className="pb-3 px-2">مبلغ کل</th>
                <th className="pb-3 px-2">وضعیت</th>
                <th className="pb-3 px-2">کد مرسوله پستی</th>
                <th className="pb-3 px-2 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-white/5 transition">
                  <td className="py-4 px-2 font-mono font-bold text-[var(--accent-blue)]">{o.orderNumber}</td>
                  <td className="py-4 px-2">
                    <div className="font-bold text-[var(--text-primary)]">{o.customerName}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{o.customerPhone}</div>
                  </td>
                  <td className="py-4 px-2 font-extrabold text-[var(--text-primary)]">{o.totalPrice.toLocaleString("fa-IR")} تومان</td>
                  <td className="py-4 px-2">{getStatusBadge(o.status)}</td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        suppressHydrationWarning
                        placeholder="وارد کردن کد..."
                        value={o.trackingCode || ""}
                        onChange={(e) => handleTrackingCodeChange(o.id, e.target.value)}
                        className="w-36 bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-2 py-1 text-[11px] font-mono focus:outline-none"
                      />
                      <button
                        onClick={() => handleGenerateTrackingCode(o.id)}
                        title="تولید خودکار کد رندوم"
                        className="bg-white/10 px-2 py-1 rounded-lg text-[10px] hover:bg-white/20 transition"
                      >
                        🎲
                      </button>
                      {o.trackingCode && (
                        <button
                          onClick={() => handleDeleteTrackingCode(o.id)}
                          title="حذف کد مرسوله"
                          className="text-red-500 hover:bg-red-500/10 px-1.5 py-1 rounded-lg text-[10px] transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-left space-x-2 space-x-reverse">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value as OrderItem["status"])}
                      className="bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-2 py-1 text-[11px] focus:outline-none"
                    >
                      <option value="pending">در انتظار پرداخت</option>
                      <option value="processing">در حال پردازش</option>
                      <option value="shipped">تحویل به پست</option>
                      <option value="completed">تکمیل شده</option>
                      <option value="cancelled">لغو شده</option>
                    </select>

                    <button
                      onClick={() => setSelectedInvoice(o)}
                      className="bg-[var(--accent-blue)] text-white px-3 py-1 rounded-xl text-[11px] font-bold hover:opacity-90 transition shadow-sm"
                    >
                      🧾 فاکتور رسمی
                    </button>

                    <button
                      onClick={() => handleDeleteOrder(o.id)}
                      className="text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-xl text-[11px] font-bold transition border border-red-500/20"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= فاکتور رسمی بهینه و استاندارد سازمانی (Print Optimized) ================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white text-black rounded-3xl p-6 sm:p-10 max-w-4xl w-full space-y-6 shadow-2xl relative border border-gray-200 dir-rtl print:shadow-none print:border-none print:rounded-none print:p-0">
            
            {/* دکمه‌های کنترلی فاکتور (هنگام پرینت پنهان می‌شوند) */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧾</span>
                <h3 className="text-base font-extrabold text-gray-800">پیش‌نمایش فاکتور رسمی فروشگاه</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-1.5"
                >
                  🖨️ چاپ فاکتور (A4)
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-xl text-xs font-bold transition"
                >
                  ✕ بستن
                </button>
              </div>
            </div>

            {/* سربرگ رسمی فاکتور */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💎</span>
                  <h1 className="text-xl font-black tracking-tight text-gray-900">فروشگاه اینترنتی استور</h1>
                </div>
                <p className="text-[11px] text-gray-600 font-medium">صورت‌حساب فروش کالا و خدمات (صورت‌حساب رسمی)</p>
              </div>

              <div className="text-left space-y-1 text-xs font-mono text-gray-700">
                <div><span className="font-sans text-gray-500">شماره فاکتور:</span> <strong className="text-gray-900">{selectedInvoice.orderNumber}</strong></div>
                <div><span className="font-sans text-gray-500">تاریخ صدور:</span> {selectedInvoice.date}</div>
                <div><span className="font-sans text-gray-500">کد مرسوله:</span> {selectedInvoice.trackingCode || "در حال ثبت"}</div>
              </div>
            </div>

            {/* جدول مشخصات فروشنده و خریدار */}
            <div className="grid grid-cols-2 gap-4 text-xs border border-gray-300 rounded-2xl p-4 bg-gray-50/50">
              {/* اطلاعات فروشنده */}
              <div className="space-y-1.5 border-l border-gray-200 pl-4">
                <h4 className="font-extrabold text-gray-900 border-b border-gray-200 pb-1 text-[11px] uppercase tracking-wider text-blue-700">مشخصات فروشنده</h4>
                <div><span className="text-gray-500">فروشگاه:</span> <strong className="text-gray-800">استور (Store.ir)</strong></div>
                <div><span className="text-gray-500">شناسه ملی / ثبت:</span> <span className="font-mono">10380912345</span></div>
                <div><span className="text-gray-500">پشتیبانی:</span> <span className="font-mono">021-91000000</span></div>
                <div><span className="text-gray-500">آدرس:</span> تهران، خیابان ولیعصر، برج فناوری استور</div>
              </div>

              {/* اطلاعات خریدار */}
              <div className="space-y-1.5 pr-2">
                <h4 className="font-extrabold text-gray-900 border-b border-gray-200 pb-1 text-[11px] uppercase tracking-wider text-blue-700">مشخصات خریدار</h4>
                <div><span className="text-gray-500">نام شخص/مجموعه:</span> <strong className="text-gray-900">{selectedInvoice.customerName}</strong></div>
                <div><span className="text-gray-500">شماره تماس:</span> <span className="font-mono">{selectedInvoice.customerPhone}</span></div>
                <div><span className="text-gray-500">کد پستی:</span> <span className="font-mono">{selectedInvoice.postalCode || "1234567890"}</span></div>
                <div><span className="text-gray-500">آدرس تحویل:</span> {selectedInvoice.customerAddress}</div>
              </div>
            </div>

            {/* جدول ریز کالاها و خدمات */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white font-bold">
                    <th className="py-2.5 px-3 border border-gray-800 text-center w-10">#</th>
                    <th className="py-2.5 px-3 border border-gray-800">کد کالا (SKU)</th>
                    <th className="py-2.5 px-3 border border-gray-800">شرح کالا یا خدمات</th>
                    <th className="py-2.5 px-3 border border-gray-800 text-center">تعداد</th>
                    <th className="py-2.5 px-3 border border-gray-800">قیمت واحد (تومان)</th>
                    <th className="py-2.5 px-3 border border-gray-800">تخفیف</th>
                    <th className="py-2.5 px-3 border border-gray-800">مبلغ کل (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 border border-gray-300">
                  {selectedInvoice.items.map((item, idx) => {
                    const totalItemPrice = item.quantity * item.unitPrice - item.discount;
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3 px-3 border border-gray-300 text-center font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 border border-gray-300 font-mono text-[11px] text-gray-600">{item.sku}</td>
                        <td className="py-3 px-3 border border-gray-300">
                          <div className="font-bold text-gray-900">{item.title}</div>
                          <div className="text-[10px] text-gray-500">{item.variant}</div>
                        </td>
                        <td className="py-3 px-3 border border-gray-300 text-center font-bold">{item.quantity}</td>
                        <td className="py-3 px-3 border border-gray-300 font-mono">{item.unitPrice.toLocaleString("fa-IR")}</td>
                        <td className="py-3 px-3 border border-gray-300 font-mono text-red-600">
                          {item.discount > 0 ? `${item.discount.toLocaleString("fa-IR")}` : "0"}
                        </td>
                        <td className="py-3 px-3 border border-gray-300 font-mono font-bold text-gray-900">
                          {totalItemPrice.toLocaleString("fa-IR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* بخش خلاصه‌حساب مالی و مهر رسمی */}
            <div className="grid grid-cols-2 gap-6 items-end pt-2">
              {/* بخش مهر و امضا و QR Code */}
              <div className="border border-gray-300 rounded-2xl p-4 flex items-center justify-between bg-gray-50/30">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 block">مهر و امضای الکترونیکی فروشگاه:</span>
                  <div className="border-2 border-dashed border-blue-600/30 rounded-xl p-2 text-center text-blue-600 font-bold text-xs bg-blue-50/50 inline-block">
                    ✓ تایید شده توسط سامانه مرکزی
                  </div>
                </div>

                <div className="text-center space-y-1">
                  {/* کد QR فرضی جهت استعلام فاکتور */}
                  <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center text-white text-[10px] font-mono p-1 text-center leading-none">
                    QR-VERIFY
                  </div>
                  <span className="text-[9px] text-gray-400 block font-mono">اصالت فاکتور</span>
                </div>
              </div>

              {/* جدول محاسبات جمع کل */}
              <div className="border border-gray-300 rounded-2xl p-4 space-y-2 bg-gray-50 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>جمع کل کالاها:</span>
                  <span className="font-mono">{(selectedInvoice.totalPrice + (selectedInvoice.discountAmount || 0)).toLocaleString("fa-IR")} تومان</span>
                </div>

                {selectedInvoice.discountAmount ? (
                  <div className="flex justify-between text-red-600">
                    <span>مجموع تخفیف‌ها:</span>
                    <span className="font-mono">- {selectedInvoice.discountAmount.toLocaleString("fa-IR")} تومان</span>
                  </div>
                ) : null}

                <div className="flex justify-between text-gray-600">
                  <span>هزینه ارسال و بسته‌بندی:</span>
                  <span className="font-mono">{selectedInvoice.shippingFee ? `${selectedInvoice.shippingFee.toLocaleString("fa-IR")} تومان` : "رایگان"}</span>
                </div>

                <div className="flex justify-between font-black text-sm text-gray-900 border-t border-gray-300 pt-2">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-blue-700 font-mono text-base">{selectedInvoice.totalPrice.toLocaleString("fa-IR")} تومان</span>
                </div>
              </div>
            </div>

            {/* پانویس حقوقی */}
            <div className="text-center border-t border-gray-200 pt-3 text-[10px] text-gray-500 space-y-1">
              <p>این فاکتور صادر شده از سیستم استور بوده و مطابق با قوانین تجارت الکترونیک کشور دارای اعتبار قانونی می‌باشد.</p>
              <p className="font-mono">www.store.ir | پشتیبانی ۲۴ ساعته: ۰۲۱-۹۱۰00000</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}