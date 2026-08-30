// File Path: components/admin/AdminCustomers.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export interface CustomerSummary {
  phone: string;
  name: string;
  orderCount: number;
  totalSpent: number;
  tier: "VIP الماس" | "طلایی" | "نقره‌ای" | "برنزی";
  lastOrderDate: string;
  postalCode?: string;
  address?: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("customer_name, phone, postal_code, address, total_amount, final_amount, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const customerMap = new Map<string, CustomerSummary>();
      (data || []).forEach((order: any) => {
        const phone = order.phone || "نامشخص";
        const fullName = order.customer_name || "مشتری گرامی";
        const amount = Number(order.final_amount || order.total_amount || 0);

        if (customerMap.has(phone)) {
          const existing = customerMap.get(phone)!;
          existing.orderCount += 1;
          existing.totalSpent += amount;
          if (existing.totalSpent > 100000000) existing.tier = "VIP الماس";
          else if (existing.totalSpent > 50000000) existing.tier = "طلایی";
          else if (existing.totalSpent > 20000000) existing.tier = "نقره‌ای";
        } else {
          let tier: CustomerSummary["tier"] = "برنزی";
          if (amount > 100000000) tier = "VIP الماس";
          else if (amount > 50000000) tier = "طلایی";
          else if (amount > 20000000) tier = "نقره‌ای";

          customerMap.set(phone, {
            phone,
            name: fullName,
            orderCount: 1,
            totalSpent: amount,
            tier,
            lastOrderDate: order.created_at,
            postalCode: order.postal_code,
            address: order.address,
          });
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (e) {
      console.error("Error loading customers CRM:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    const handleOrdersUpdate = () => fetchCustomers();
    window.addEventListener("orders_updated", handleOrdersUpdate);
    return () => {
      window.removeEventListener("orders_updated", handleOrdersUpdate);
    };
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const getTierBadge = (tier: CustomerSummary["tier"]) => {
    switch (tier) {
      case "VIP الماس":
        return <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-500 font-black text-[10px]">💎 VIP الماس</span>;
      case "طلایی":
        return <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 font-black text-[10px]">🥇 مشتری طلایی</span>;
      case "نقره‌ای":
        return <span className="px-3 py-1 rounded-full bg-slate-300/15 border border-slate-300/30 text-slate-300 font-black text-[10px]">🥈 مشتری نقره‌ای</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-black text-[10px]">🥉 مشتری عادی</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>👥</span> باشگاه مخاطبان و مدیریت ارتباط با مشتریان (CRM)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            دسته‌بندی خودکار وفاداری، پایش حجم خرید و مشاهده پرونده هر خریدار
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="🔍 جستجوی نام یا شماره تماس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">در حال تحلیل سوابق مشتریان...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">مشتری با این مشخصات یافت نشد.</div>
        ) : (
          <table className="w-full text-right text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                <th className="p-3.5">نام و نام خانوادگی</th>
                <th className="p-3.5">شماره همراه</th>
                <th className="p-3.5 text-center">سطح عضویت</th>
                <th className="p-3.5 text-center">تعداد فاکتور</th>
                <th className="p-3.5">مجموع خریدهای موفق</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)] font-medium">
              {filtered.map((c, i) => (
                <tr key={i} className="hover:bg-[var(--input-bg)] transition">
                  <td className="p-3.5 font-bold">{c.name}</td>
                  <td className="p-3.5 font-mono text-[var(--accent-blue)] font-bold">{c.phone}</td>
                  <td className="p-3.5 text-center">{getTierBadge(c.tier)}</td>
                  <td className="p-3.5 font-mono text-center font-bold">{c.orderCount} سفارش</td>
                  <td className="p-3.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {c.totalSpent.toLocaleString("fa-IR")} تومان
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedCustomer(c);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-xs transition cursor-pointer"
                    >
                      👁️ پرونده مشتری
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* مدال پرونده جامع مشتری */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 text-xs text-[var(--text-primary)] shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <h3 className="font-black text-sm">پرونده خریدار: {selectedCustomer.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <div><span className="text-[var(--text-secondary)] font-bold">شماره تماس:</span> <span className="font-mono font-bold mr-1">{selectedCustomer.phone}</span></div>
              <div><span className="text-[var(--text-secondary)] font-bold">کد پستی ۱۰ رقمی:</span> <span className="font-mono mr-1">{selectedCustomer.postalCode || "---"}</span></div>
              <div><span className="text-[var(--text-secondary)] font-bold">نشانی ارسال:</span> <span className="mr-1 leading-relaxed">{selectedCustomer.address || "ثبت نشده"}</span></div>
              <div><span className="text-[var(--text-secondary)] font-bold">مجموع خرید:</span> <span className="font-mono font-black text-emerald-600 mr-1">{selectedCustomer.totalSpent.toLocaleString("fa-IR")} تومان</span></div>
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full py-3 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-md"
            >
              بستن پرونده
            </button>
          </div>
        </div>
      )}
    </div>
  );
}