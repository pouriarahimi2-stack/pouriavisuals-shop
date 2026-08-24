"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  productId?: string | number;
  id?: string | number;
  title?: string;
  name?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderData {
  id: string | number;
  orderNumber?: string;
  customerName: string;
  phone: string;
  address: string;
  postalCode?: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingCode?: string;
  createdAt?: string;
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";
  const isSuccessRedirect = searchParams.get("success") === "true";

  const [searchQuery, setSearchQuery] = useState(initialOrderId);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchOrders = async (queryText: string) => {
    if (!queryText.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(queryText.trim())}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
      } else {
        setErrorMessage(json.message || "فاکتوری با این مشخصات یافت نشد.");
        setOrders([]);
      }
    } catch {
      setErrorMessage("خطا در برقراری ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      setSearchQuery(initialOrderId);
      fetchOrders(initialOrderId);
    }
  }, [initialOrderId]);

  useEffect(() => {
    if (orders.length === 0 || !supabase) return;

    const orderIds = orders.map((o) => String(o.id));

    const channel = supabase
      .channel("realtime_track_orders")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload: any) => {
          const updatedOrder = payload.new;
          if (updatedOrder && orderIds.includes(String(updatedOrder.id))) {
            setOrders((prevOrders) =>
              prevOrders.map((o) =>
                String(o.id) === String(updatedOrder.id)
                  ? {
                      ...o,
                      status: updatedOrder.status || o.status,
                      trackingCode: updatedOrder.tracking_code || updatedOrder.trackingCode || o.trackingCode,
                    }
                  : o
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(searchQuery);
  };

  const getStatusBadge = (status: OrderData["status"]) => {
    switch (status) {
      case "processing":
        return <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30 font-bold text-xs">📦 در حال پردازش و بسته‌بندی</span>;
      case "shipped":
        return <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 font-bold text-xs">🚚 تحویل به شرکت پست</span>;
      case "delivered":
        return <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs">✅ تحویل مرسوله به مشتری</span>;
      case "cancelled":
        return <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs">❌ سفارش لغو شده</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30 font-bold text-xs">⏳ در انتظار تأیید و پرداخت</span>;
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 max-w-4xl mx-auto space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* پیام ثبت موفق فاکتور */}
      {isSuccessRedirect && (
        <div className="p-5 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-4 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl font-bold shadow-md">✓</span>
            <div>
              <h3 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">سفارش شما با موفقیت ثبت شد!</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">فاکتور رسمی صادر گردید و پیامک رهگیری برای شما ارسال خواهد شد.</p>
            </div>
          </div>
          <Link href="/" className="px-4 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-emerald-500 transition">
            بازگشت به خانه
          </Link>
        </div>
      )}

      {/* هدر بخش پیگیری */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 flex items-center justify-center text-2xl text-[var(--accent-blue)] shadow-lg">
          🔍
        </div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">پیگیری و استعلام وضعیت مرسوله</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          جهت مشاهده آخرین وضعیت بسته، شماره فاکتور یا شماره موبایل ثبت‌شده در هنگام خرید را وارد نمایید
        </p>
      </div>

      {/* فرم جستجو */}
      <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="مثال: AXN-419556 یا 09123456789"
          className="flex-1 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)] shadow-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>{loading ? "در حال استعلام..." : "استعلام وضعیت فاکتور 🚀"}</span>
        </button>
      </form>

      {/* نمایش خطا */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold text-center animate-fadeIn">
          {errorMessage}
        </div>
      )}

      {/* لیست نتایج فاکتورها */}
      <div className="space-y-6">
        {orders.map((order) => {
          const displayOrderNum = order.orderNumber || order.id;
          return (
            <div
              key={order.id}
              className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 animate-fadeIn"
            >
              {/* سربرگ فاکتور */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[var(--text-primary)]">شماره فاکتور:</span>
                    <span className="font-mono font-black text-sm text-[var(--accent-blue)]">{displayOrderNum}</span>
                  </div>
                  {order.createdAt && (
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                      تاریخ ثبت: {new Date(order.createdAt).toLocaleDateString("fa-IR")} - {new Date(order.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>

                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* اطلاعات کد رهگیری پستی ۲۴ رقمی */}
              {order.trackingCode ? (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                    <span>📮 کد رهگیری پست پیشتاز:</span>
                    <span className="font-mono font-black text-sm text-[var(--accent-blue)] tracking-wider">{order.trackingCode}</span>
                  </div>
                  <a
                    href={`https://tracking.post.ir/?id=${order.trackingCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold hover:opacity-90 transition shadow-md flex items-center gap-1"
                  >
                    <span>سامانه رهگیری پست ایران</span>
                    <span>↗</span>
                  </a>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-secondary)] font-medium flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>کد رهگیری پستی به محض تحویل بسته به اداره پست در این بخش قرار خواهد گرفت.</span>
                </div>
              )}

              {/* مشخصات خریدار و نشانی تحویل */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                  <span className="font-bold text-[var(--text-secondary)] block">👤 مشخصات گیرنده:</span>
                  <p className="font-black text-[var(--text-primary)]">{order.customerName}</p>
                  <p className="font-mono text-[var(--text-secondary)] font-bold">{order.phone}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                  <span className="font-bold text-[var(--text-secondary)] block">📍 نشانی پستی ارسال:</span>
                  <p className="font-medium text-[var(--text-primary)] leading-relaxed">{order.address}</p>
                  {order.postalCode && (
                    <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                      کد پستی: <strong className="text-[var(--text-primary)]">{order.postalCode}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* اقلام خریداری شده */}
              <div className="space-y-3">
                <span className="font-extrabold text-xs text-[var(--text-secondary)] block">📦 اقلام فاکتور:</span>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img src={item.image} alt="" className="w-11 h-11 rounded-xl object-contain bg-[var(--modal-bg)] border border-[var(--card-border)] p-1 shrink-0" />
                        )}
                        <div>
                          <h4 className="font-black text-[var(--text-primary)]">{item.title || item.name}</h4>
                          <span className="text-[11px] text-[var(--text-secondary)] font-medium">تعداد: {item.quantity} عدد</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* جمع کل و تخفیف */}
              <div className="pt-4 border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                {order.discountAmount ? (
                  <div className="text-rose-500 font-bold">
                    تخفیف اعمال‌شده: <span className="font-mono">{order.discountAmount.toLocaleString("fa-IR")} تومان</span>
                  </div>
                ) : <div />}

                <div className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                  <span>مبلغ نهایی فاکتور:</span>
                  <span className="font-mono text-base text-[var(--accent-blue)]">
                    {order.totalAmount.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {hasSearched && orders.length === 0 && !loading && !errorMessage && (
          <div className="py-16 text-center space-y-3 text-[var(--text-secondary)]">
            <span className="text-5xl block">🔍</span>
            <h4 className="font-black text-sm text-[var(--text-primary)]">فاکتوری با این مشخصات یافت نشد!</h4>
            <p className="text-xs font-medium">لطفاً از صحت شناسه فاکتور یا شماره تلفن اطمینان حاصل فرمایید.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">در حال بارگذاری اطلاعات فاکتور...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}