"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { orderService, Order } from "@/services/orderService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const paramOrderId = searchParams.get("orderId");
  const paymentStatus = searchParams.get("payment");

  const [searchCode, setSearchCode] = useState("");
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSiteInfo(siteInfoService.getSiteInfo());

    if (paramOrderId) {
      setSearchCode(paramOrderId);
      const order = orderService.getOrderById(paramOrderId);
      if (order) setFoundOrder(order);
    }
  }, [paramOrderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFoundOrder(null);

    const cleanCode = searchCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg("لطفاً شماره سفارش را وارد کنید.");
      return;
    }

    const matchOrder = orderService.getOrderById(cleanCode);
    if (matchOrder) {
      setFoundOrder(matchOrder);
    } else {
      setErrorMsg("هیچ سفارشی با این شماره پیدا نشد.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen pb-16 select-none">
      {/* هدر هنگام پرینت مخفی می‌شود */}
      <div className="print:hidden">
        <Header />
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
        {/* پیام تشکر پس از پرداخت موفق - در پرینت مخفی است */}
        {paymentStatus === "success" && foundOrder && (
          <div className="print:hidden liquid-glass-card p-6 text-center space-y-3 border-green-500/30 bg-green-500/10 text-green-400 animate-fadeIn shadow-2xl">
            <span className="text-4xl block">🎉</span>
            <h2 className="text-base font-black leading-relaxed">
              {foundOrder.customerName} عزیز، ممنونیم بابت اعتماد شما؛ در اسرع وقت محصول شما به دستتون خواهد رسید. ✨
            </h2>
            <p className="text-xs opacity-80">
              شماره پیگیری سفارش شما: <span className="font-mono font-bold text-white">#{foundOrder.id}</span>
            </p>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="print:hidden liquid-glass-card p-6 text-center space-y-2 border-red-500/30 bg-red-500/10 text-red-400 animate-fadeIn">
            <span className="text-4xl block">❌</span>
            <h2 className="text-base font-black">پرداخت ناموفق یا لغو شد!</h2>
            <p className="text-xs opacity-80">در صورت کسر وجه از حساب، مبلغ طی ۷۲ ساعت به حساب شما بازمی‌گردد.</p>
          </div>
        )}

        {/* بخش جستجو و عنوان - در پرینت مخفی است */}
        <div className="print:hidden space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black">📦 پیگیری سفارش و فاکتور فروشگاه</h1>
            <p className="text-xs opacity-70">
              شماره سفارش خود (مثلاً <span className="font-mono">ORD-849201</span>) را وارد کنید.
            </p>
          </div>

          <form onSubmit={handleSearch} className="liquid-glass-card p-4 flex gap-2">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="کد سفارش..."
              className="flex-1 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] text-xs font-mono uppercase outline-none focus:border-[var(--accent-blue)]"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs cursor-pointer hover:opacity-90 transition shadow-md shrink-0"
            >
              جستجو 🔍
            </button>
          </form>

          {errorMsg && (
            <div className="liquid-glass-card p-4 text-center text-xs text-red-400 font-bold border-red-500/20">
              {errorMsg}
            </div>
          )}
        </div>

        {/* فاکتور رسمی قابل چاپ */}
        {foundOrder && (
          <div className="space-y-4">
            {/* دکمه پرینت فاکتور - در چاپ مخفی می‌شود */}
            <div className="print:hidden flex justify-end">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 transition shadow-lg cursor-pointer flex items-center gap-2"
              >
                🖨️ چاپ فاکتور رسمی / دریافت PDF
              </button>
            </div>

            {/* کارت اصلی فاکتور رسمی */}
            <div className="liquid-glass-card print:bg-white print:text-black print:border-black/20 print:shadow-none p-8 space-y-6 text-xs animate-fadeIn border border-[var(--glass-border)] rounded-3xl">
              
              {/* سربرگ فاکتور */}
              <div className="flex justify-between items-start border-b border-white/10 print:border-black/20 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {siteInfo?.logoUrl && (
                      <img src={siteInfo.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                    )}
                    <h2 className="text-xl font-black text-[var(--accent-blue)] print:text-black">
                      {siteInfo?.storeName || "BitByPouria"}
                    </h2>
                  </div>
                  <p className="text-[11px] opacity-70 print:opacity-100">فاکتور رسمی فروش کالا و خدمات</p>
                </div>

                <div className="text-left space-y-1 font-mono text-[11px]">
                  <p><strong className="font-sans opacity-70">شماره فاکتور:</strong> #{foundOrder.id}</p>
                  <p><strong className="font-sans opacity-70">تاریخ صدور:</strong> {new Date(foundOrder.createdAt).toLocaleDateString("fa-IR")}</p>
                  <p>
                    <strong className="font-sans opacity-70">وضعیت پرداخت:</strong>{" "}
                    <span className={foundOrder.paymentStatus === "paid" ? "text-green-400 print:text-black font-bold" : "text-red-400 print:text-black"}>
                      {foundOrder.paymentStatus === "paid" ? "✅ پرداخت شده" : "❌ پرداخت نشده"}
                    </span>
                  </p>
                </div>
              </div>

              {/* جدول مشخصات فروشنده و خریدار */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] p-4 rounded-2xl bg-black/5 dark:bg-white/5 print:bg-gray-100 border border-[var(--glass-border)] print:border-black/10">
                {/* مشخصات فروشنده */}
                <div className="space-y-1">
                  <span className="font-bold text-[var(--accent-blue)] print:text-black block border-b border-white/10 print:border-black/10 pb-1 mb-2">
                    🏢 مشخصات فروشنده:
                  </span>
                  <p><strong>فروشگاه:</strong> {siteInfo?.storeName || "BitByPouria"}</p>
                  <p><strong>تلفن پشتیبانی:</strong> {siteInfo?.phone || "۰۲۱-۸۸۸۸۸۸۸۸"}</p>
                  <p><strong>ایمیل:</strong> {siteInfo?.email || "support@bitbypouria.com"}</p>
                  <p><strong>آدرس:</strong> {siteInfo?.address || "تهران، خیابان ولیعصر"}</p>
                </div>

                {/* مشخصات خریدار */}
                <div className="space-y-1">
                  <span className="font-bold text-[var(--accent-blue)] print:text-black block border-b border-white/10 print:border-black/10 pb-1 mb-2">
                    👤 مشخصات خریدار:
                  </span>
                  <p><strong>نام و نام خانوادگی:</strong> {foundOrder.customerName}</p>
                  <p><strong>شماره تماس:</strong> <span className="font-mono">{foundOrder.customerPhone}</span></p>
                  <p><strong>کد پستی ده رقمی:</strong> <span className="font-mono">{foundOrder.postalCode || "-"}</span></p>
                  <p><strong>آدرس تحویل:</strong> {foundOrder.customerAddress}</p>
                </div>
              </div>

              {/* جدول اقلام فاکتور */}
              <div className="space-y-3">
                <h4 className="font-bold opacity-80">📋 جدول اقلام خریداری شده:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 print:border-black/20 bg-black/10 dark:bg-white/5 print:bg-gray-200">
                        <th className="p-2.5 font-bold">ردیف</th>
                        <th className="p-2.5 font-bold">شرح کالا / خدمات</th>
                        <th className="p-2.5 font-bold text-center">تعداد</th>
                        <th className="p-2.5 font-bold text-left">قیمت واحد (تومان)</th>
                        <th className="p-2.5 font-bold text-left">مبلغ کل (تومان)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 print:divide-black/10">
                      {foundOrder.items.map((item, idx) => {
                        const unitPrice = item.discountPrice ?? item.price;
                        const totalPrice = unitPrice * item.quantity;
                        return (
                          <tr key={idx}>
                            <td className="p-2.5 text-center font-mono">{idx + 1}</td>
                            <td className="p-2.5 font-bold flex items-center gap-2">
                              {item.image && (
                                <img src={item.image} alt={item.title} className="w-8 h-8 object-cover rounded-lg print:hidden" />
                              )}
                              <span>{item.title}</span>
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold">{item.quantity}</td>
                            <td className="p-2.5 text-left font-mono">{unitPrice.toLocaleString("fa-IR")}</td>
                            <td className="p-2.5 text-left font-mono font-bold">{totalPrice.toLocaleString("fa-IR")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* جمع محاسبات فاکتور */}
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 print:bg-gray-100 border border-[var(--glass-border)] print:border-black/10 space-y-2 text-xs">
                <div className="flex justify-between opacity-80">
                  <span>جمع کل اقلام:</span>
                  <span className="font-mono">{foundOrder.totalAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
                {foundOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-green-400 print:text-black font-bold">
                    <span>مبلغ تخفیف:</span>
                    <span className="font-mono">- {foundOrder.discountAmount.toLocaleString("fa-IR")} تومان</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-[var(--accent-blue)] print:text-black pt-2 border-t border-white/10 print:border-black/10">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="font-mono">{foundOrder.finalAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
              </div>

              {/* پانویس فاکتور */}
              <div className="pt-4 border-t border-white/10 print:border-black/20 flex justify-between items-end text-[10px] opacity-70 print:opacity-100">
                <div>
                  <p>• این فاکتور به‌صورت الکترونیکی و هوشمند صادر شده و معتبر می‌باشد.</p>
                  <p>• از اعتماد و خرید شما سپاسگزاریم.</p>
                </div>
                <div className="text-center font-bold">
                  <p>مهر و امضای فروشگاه</p>
                  <span className="block mt-4 text-[var(--accent-blue)] print:text-black font-black">
                    {siteInfo?.storeName || "BitByPouria"}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">درحال بارگذاری فاکتور...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}