"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Hash, 
  ShieldCheck, 
  Save, 
  Search,
  Filter
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [savingTracking, setSavingTracking] = useState<Record<string, boolean>>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
        const initialTracking: Record<string, string> = {};
        data.orders.forEach((o: any) => {
          initialTracking[o.id] = o.tracking_code || "";
        });
        setTrackingInputs(initialTracking);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    if (supabaseBrowser && typeof supabaseBrowser.channel === "function") {
      const client = supabaseBrowser;
      const channel = client
        .channel("admin-orders-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [fetchOrders]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, payment_status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, payment_status: newStatus } : o))
        );
      }
    } catch (err) {
      alert("خطا در تغییر وضعیت سفارش");
    }
  };

  const handleSaveTracking = async (id: string) => {
    const code = (trackingInputs[id] || "").trim();
    setSavingTracking((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, tracking_code: code }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => 
            o.id === id 
              ? { ...o, tracking_code: code, payment_status: code ? "shipped" : o.payment_status } 
              : o
          )
        );
        alert("کد مرسوله ذخیره گردید و وضعیت سفارش به ارسال پستی تغییر یافت.");
      } else {
        alert("خطا در ذخیره کد مرسوله");
      }
    } catch (err) {
      alert("خطا در ارتباط با سرور");
    } finally {
      setSavingTracking((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesFilter = filterStatus === "all" || ord.payment_status === filterStatus;
    const matchesSearch = 
      !searchTerm ||
      (ord.customer_name && ord.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ord.customer_phone && ord.customer_phone.includes(searchTerm)) ||
      (ord.order_number && ord.order_number.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 lg:p-10 dir-rtl">
      {/* هدر پیشخوان سفارشات */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[var(--card-border)]">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-hover)] text-sm font-bold flex items-center gap-2">
              <ArrowRight size={18} />
              پیشخوان
            </Link>
            <h1 className="text-2xl font-black">مدیریت سفارشات و بارنامه‌ها</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            محاسبه خالص به تومان | تفکیک شماره‌های تأییدشده پیامکی | صدور بارنامه
          </p>
        </div>
      </div>

      {/* نوار جستجو و فیلترهای وضعیت */}
      <div className="mt-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-3xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: "all", label: "همه سفارشات" },
            { id: "pending", label: "در انتظار بررسی" },
            { id: "paid", label: "تایید شده" },
            { id: "shipped", label: "ارسال شده به پست" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                filterStatus === tab.id
                  ? "bg-[#0071e3] text-white shadow-md"
                  : "bg-black/20 text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="جستجوی شماره، نام یا موبایل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/20 border border-[var(--card-border)] text-xs text-white outline-none focus:border-[#0071e3]"
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>

      {/* لیست سفارشات */}
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-20 text-sm font-bold text-[var(--text-secondary)]">
            در حال بارگذاری لیست سفارشات...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center">
            <Package size={40} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-sm font-bold text-[var(--text-secondary)]">
              سفارشی مطابق با فیلتر انتخابی یافت نشد.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord) => (
              <div key={ord.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--card-border)]">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 font-black text-xs flex items-center gap-1 font-mono">
                      <Hash size={14} />
                      {ord.order_number}
                    </span>
                    <span className="font-bold text-sm text-white">{ord.customer_name}</span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Phone size={13} />
                      {ord.customer_phone}
                    </span>
                    {ord.phone_verified ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <ShieldCheck size={12} />
                        تأیید پیامکی شده
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                        ثبت عادی
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">وضعیت:</span>
                    <select
                      value={ord.payment_status || "pending"}
                      onChange={(e) => updateStatus(ord.id, e.target.value)}
                      className="bg-[#1c1c1f] border border-[#27272a] text-xs font-bold text-white px-3 py-1.5 rounded-xl outline-none"
                    >
                      <option value="pending">در انتظار بررسی / هماهنگی</option>
                      <option value="paid">تایید شده / آماده ارسال</option>
                      <option value="shipped">تحویل به شرکت پست</option>
                      <option value="delivered">تحویل داده شده</option>
                      <option value="cancelled">لغو شده</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-zinc-400 mb-1 flex items-center gap-1">
                      <MapPin size={13} />
                      نشانی تحویل:
                    </div>
                    <div className="text-white font-medium">{ord.shipping_address}</div>
                  </div>

                  <div className="text-left flex flex-col justify-end">
                    <div className="text-zinc-400">مجموع سفارش:</div>
                    <div className="text-lg font-black text-emerald-400 mt-0.5">
                      {Number(ord.total_price || 0).toLocaleString("fa-IR")} تومان
                    </div>
                  </div>
                </div>

                {/* لیست کالاها */}
                {Array.isArray(ord.items) && ord.items.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                    {ord.items.map((it: any, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-black/30 rounded-xl text-[11px] text-zinc-300 border border-white/5">
                        {it.title} × {it.quantity}
                      </span>
                    ))}
                  </div>
                )}

                {/* ثبت و ذخیره کد رهگیری پستی */}
                <div className="mt-4 pt-4 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-black/20 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <Truck size={16} className="text-blue-400" />
                    <span>کد مرسوله پستی:</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="۲۴ رقم کد رهگیری پست"
                      value={trackingInputs[ord.id] || ""}
                      onChange={(e) =>
                        setTrackingInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))
                      }
                      className="flex-1 sm:w-64 px-3 py-1.5 rounded-xl bg-[#121214] border border-[#27272a] text-xs font-mono text-white outline-none focus:border-[#0071e3]"
                    />
                    <button
                      type="button"
                      disabled={savingTracking[ord.id]}
                      onClick={() => handleSaveTracking(ord.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold flex items-center gap-1 transition disabled:opacity-50"
                    >
                      <Save size={13} />
                      {savingTracking[ord.id] ? "در حال ثبت..." : "ثبت و ارسال به پست"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
