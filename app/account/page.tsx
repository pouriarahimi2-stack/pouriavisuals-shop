"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User, Package, Truck, Phone, ShieldCheck, LogOut, ArrowRight, Hash } from "lucide-react";

export default function UserAccountPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // خواندن نشست کاربر
    try {
      const match = document.cookie.match(/(^|;)\s*axon_user_session=([^;]+)/);
      if (match) {
        const u = JSON.parse(decodeURIComponent(match[2]));
        setUser(u);
        fetchUserOrders(u.phone);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  }, []);

  const fetchUserOrders = async (phone: string) => {
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: phone }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "axon_user_session=; path=/; max-age=0;";
    localStorage.removeItem("axon_user");
    window.dispatchEvent(new Event("user_session_updated"));
    window.location.href = "/";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">تایید شده</span>;
      case "shipped":
        return <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">تحویل به پست</span>;
      case "delivered":
        return <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold">تحویل داده شده</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">در انتظار بررسی</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 dir-rtl flex items-center justify-center">
        <div className="text-xs font-bold text-zinc-400">در حال دریافت اطلاعات حساب کاربری...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 dir-rtl flex items-center justify-center">
        <div className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 text-zinc-400">
            <User size={32} />
          </div>
          <h2 className="text-base font-bold text-white">وارد حساب کاربری نشده‌اید</h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            جهت مشاهده سوابق خرید، می‌توانید از طریق تسویه حساب یا پیگیری سفارش اقدام فرمایید.
          </p>
          <div className="mt-6">
            <Link
              href="/track"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#0071e3] text-white text-xs font-bold"
            >
              پیگیری سریع با شماره تماس
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 dir-rtl">
      <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-bold">حساب کاربری من</span>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* کارت مشخصات کاربر */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 h-fit">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--card-border)]">
            <div className="w-12 h-12 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-black">
              <User size={24} />
            </div>
            <div>
              <div className="font-black text-sm text-white">{user.name || "مشتری گرامی"}</div>
              <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1 font-mono">
                <Phone size={12} />
                {user.phone}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>وضعیت شماره:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck size={14} /> تأیید پیامکی
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>تعداد کل سفارشات:</span>
              <span className="text-white font-bold">{orders.length}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-6 py-2.5 rounded-2xl bg-white/5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <LogOut size={14} />
            خروج از حساب
          </button>
        </div>

        {/* لیست سفارشات کاربر */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-black text-white flex items-center gap-2 mb-2">
            <Package size={18} className="text-[#0071e3]" />
            سوابق سفارشات شما
          </h2>

          {orders.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 text-center text-xs text-zinc-400 font-bold">
              هنوز سفارشی به ثبت نرسیده است.
            </div>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[var(--card-border)]">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 font-black text-xs flex items-center gap-1 font-mono">
                      <Hash size={13} />
                      {ord.order_number}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(ord.created_at).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  <div>{getStatusBadge(ord.payment_status)}</div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400 text-[11px]">اقلام سفارش:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {Array.isArray(ord.items) && ord.items.map((it: any, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 bg-black/30 rounded-xl text-zinc-300 border border-white/5 text-[11px]">
                          {it.title} × {it.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="sm:text-left mt-2 sm:mt-0">
                    <span className="text-zinc-400 text-[11px]">مبلغ پرداختی:</span>
                    <div className="text-sm font-black text-emerald-400 mt-0.5">
                      {Number(ord.total_price || 0).toLocaleString("fa-IR")} تومان
                    </div>
                  </div>
                </div>

                {ord.tracking_code && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs">
                    <Truck size={14} className="text-blue-400" />
                    <span className="text-zinc-400">کد مرسوله پستی:</span>
                    <span className="font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded-lg text-[11px]">
                      {ord.tracking_code}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
