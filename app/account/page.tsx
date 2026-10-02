// File Path: app/account/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

interface CustomerOrder {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  items: any[];
  total_amount: number;
  discount_amount?: number;
  shipping_cost?: number;
  final_amount: number;
  status: string;
  tracking_code?: string;
  created_at: string;
}

function AccountDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightOrderId = searchParams.get("orderId") || "";

  const [user, setUser] = useState<{
    phone?: string;
    name?: string;
    full_name?: string;
    username?: string;
  } | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  const fetchCustomerOrders = async (phoneVal: string) => {
    const cleanPhone = String(phoneVal || "").replace(/\D/g, "");
    if (!cleanPhone) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("phone", cleanPhone)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        setOrders(data as any);
        if (highlightOrderId) {
          const match = data.find((o: any) => String(o.id) === String(highlightOrderId));
          if (match) setSelectedOrder(match as any);
        } else if (data.length > 0 && !selectedOrder) {
          setSelectedOrder(data[0] as any);
        }
      }
    } catch (e) {
      console.error("Account orders fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    let activePhone = "";

    try {
      const raw = localStorage.getItem("axon_user_session");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        activePhone = String(parsed.phone || "").replace(/\D/g, "");
      }
    } catch {}

    if (activePhone) {
      fetchCustomerOrders(activePhone);
    } else {
      fetch("/api/user/session", { cache: "no-store" })
        .then((r) => r.json())
        .then((json) => {
          if (json.authenticated && json.user) {
            setUser(json.user);
            if (json.user.phone) {
              fetchCustomerOrders(json.user.phone);
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    }

    // وب‌سوکت بلادرنگ برای به‌روزرسانی آنی وضعیت سفارش و کد رهگیری پستی در پنل مشتری
    const channel = supabase
      .channel("realtime-customer-account-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        if (activePhone) fetchCustomerOrders(activePhone);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [highlightOrderId]);

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      await fetch("/api/user/session", { method: "POST" });
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("axon_user_session");
      window.dispatchEvent(new CustomEvent("user_auth_changed", { detail: null }));
    }
    router.push("/login");
  };

  const getStatusLabel = (st: string) => {
    switch (st) {
      case "paid":
        return { text: "پرداخت شده و در حال آماده‌سازی ✓", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
      case "processing":
        return { text: "در حال بسته‌بندی مرسوله 📦", cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" };
      case "shipped":
        return { text: "تحویل به پست پیشتاز 🚚", cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" };
      case "delivered":
        return { text: "تحویل شده به مشتری 🎉", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
      case "cancelled":
        return { text: "لغو شده", cls: "bg-rose-500/15 text-rose-400 border-rose-500/30" };
      case "pending_manual_review":
        return { text: "در حال بررسی فیش واریزی ⏳", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
      default:
        return { text: "در انتظار تکمیل پرداخت", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    }
  };

  if (!loading && !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center font-sans space-y-4 text-[var(--text-primary)]" dir="rtl">
        <div className="p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <span className="text-4xl block">🔐</span>
          <h1 className="text-lg font-black">ورود به حساب کاربری</h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            برای مشاهده سوابق خرید، فاکتورها و کد پیگیری پستی، لطفاً وارد حساب کاربری خود شوید.
          </p>
          <Link
            href="/login"
            className="block w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg"
          >
            ورود یا ثبت‌نام سریع ←
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 font-sans select-text text-[var(--text-primary)] space-y-6" dir="rtl">
      {/* هدر حساب کاربری */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-lg">
            👤
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black">
              پنل کاربری و پیگیری سفارشات {user?.full_name || user?.name || user?.username || ""}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">
              شماره همراه متصل: <strong className="text-[var(--accent-blue)]">{user?.phone || "---"}</strong> (همگام‌سازی زنده وب‌سوکت فعال ✓)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto text-xs font-bold">
          <Link
            href="/products"
            className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition"
          >
            🛍️ ادامه خرید
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition cursor-pointer"
          >
            خروج از حساب
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* لیست سفارشات کاربر */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3 h-fit">
          <h2 className="font-black text-sm border-b border-[var(--card-border)] pb-3">
            📦 سفارش‌های ثبت‌شده شما ({orders.length})
          </h2>

          {loading ? (
            <div className="py-12 text-center text-slate-400 font-bold">در حال دریافت سفارشات...</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <p className="font-bold">هنوز سفارشی با این شماره ثبت نشده است.</p>
              <Link
                href="/products"
                className="inline-block px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black"
              >
                مشاهده کاتالوگ محصولات
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {orders.map((ord) => {
                const badge = getStatusLabel(ord.status);
                const isSelected = selectedOrder?.id === ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedOrder(ord);
                    }}
                    className={
                      "p-4 rounded-2xl border transition cursor-pointer space-y-2 " +
                      (isSelected
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 shadow-md"
                        : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-black text-[var(--accent-blue)]">{ord.id}</span>
                      <span className={"px-2.5 py-0.5 rounded-lg border text-[10px] font-bold " + badge.cls}>
                        {badge.text}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-secondary)]">
                        {new Date(ord.created_at).toLocaleDateString("fa-IR")}
                      </span>
                      <span className="font-mono font-black text-emerald-400">
                        {Number(ord.final_amount || ord.total_amount || 0).toLocaleString("fa-IR")} تومان
                      </span>
                    </div>

                    {ord.tracking_code && (
                      <div className="pt-1 border-t border-[var(--card-border)] flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">کد پیگیری:</span>
                        <span className="font-mono font-black text-sky-400">{ord.tracking_code}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* جزئیات کامل سفارش انتخاب‌شده و کد پیگیری */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 h-fit">
          {selectedOrder ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
                <div>
                  <h3 className="font-black text-sm sm:text-base">
                    جزئیات فاکتور: <span className="font-mono text-[var(--accent-blue)]">{selectedOrder.id}</span>
                  </h3>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    ثبت شده در: {new Date(selectedOrder.created_at).toLocaleString("fa-IR")}
                  </span>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-black text-xs">
                  کد پیگیری خرید: {selectedOrder.tracking_code || selectedOrder.id}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <div>
                  <strong className="text-[var(--text-secondary)]">تحویل‌گیرنده:</strong>{" "}
                  <span className="font-bold">{selectedOrder.customer_name}</span>
                </div>
                <div>
                  <strong className="text-[var(--text-secondary)]">نشانی ارسال مرسوله:</strong>{" "}
                  <span>{selectedOrder.address}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-xs text-[var(--accent-blue)]">اقلام خریداری‌شده در این سفارش:</h4>
                <div className="space-y-2">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold">{item.title || item.name || "کالای دیجیتال"}</div>
                        <span className="text-[10px] font-mono text-slate-400">
                          تعداد: {item.quantity || 1} عدد
                        </span>
                      </div>
                      <span className="font-mono font-black text-emerald-400">
                        {(
                          Number(item.discount_price || item.discountPrice || item.price || 0) *
                          Number(item.quantity || 1)
                        ).toLocaleString("fa-IR")}{" "}
                        تومان
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between text-sm font-black">
                <span>مبلغ کل فاکتور:</span>
                <span className="font-mono text-emerald-400">
                  {Number(selectedOrder.final_amount || selectedOrder.total_amount || 0).toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 font-bold">
              یک سفارش را از لیست سمت راست جهت مشاهده جزئیات و کد پیگیری انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">
          در حال بارگذاری پنل کاربری...
        </div>
      }
    >
      <AccountDashboardContent />
    </Suspense>
  );
}
