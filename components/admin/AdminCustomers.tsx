"use client";

import React, { useState, useEffect } from "react";
import { orderService, Order } from "@/services/orderService";
import { supabase } from "@/lib/supabase";

export interface CustomerProfile {
  id: string;
  fullName: string;
  phone: string;
  address?: string;
  totalOrdersCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  tier: "bronze" | "silver" | "gold" | "vip";
  notes?: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // فرم ثبت دستی مشتری
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const calculateTier = (spent: number): CustomerProfile["tier"] => {
    if (spent >= 50000000) return "vip";
    if (spent >= 20000000) return "gold";
    if (spent >= 5000000) return "silver";
    return "bronze";
  };

  const loadCustomersData = async () => {
    setLoading(true);
    try {
      // ۱. تجمیع داده‌ها از سفارش‌های واقعی
      const orders = await orderService.getAll();
      const customerMap = new Map<string, CustomerProfile>();

      orders.forEach((ord) => {
        const phone = ord.phone.trim();
        if (!phone) return;

        const existing = customerMap.get(phone);
        const spent = ord.status !== "cancelled" ? (ord.totalAmount || 0) : 0;

        if (existing) {
          existing.totalOrdersCount += 1;
          existing.totalSpent += spent;
          existing.tier = calculateTier(existing.totalSpent);
          if (!existing.address && ord.address) existing.address = ord.address;
          if (new Date(ord.createdAt) > new Date(existing.lastOrderDate || 0)) {
            existing.lastOrderDate = ord.createdAt;
          }
        } else {
          customerMap.set(phone, {
            id: `cust_${phone}`,
            fullName: ord.customerName || "کاربر مهمان",
            phone: phone,
            address: ord.address,
            totalOrdersCount: 1,
            totalSpent: spent,
            lastOrderDate: ord.createdAt,
            tier: calculateTier(spent),
          });
        }
      });

      // ۲. دریافت مخاطبان ذخیره‌شده در دیتابیس Supabase
      if (supabase) {
        const { data: dbCustomers } = await supabase.from("customers").select("*");
        if (dbCustomers) {
          dbCustomers.forEach((dbC: any) => {
            const phone = dbC.phone.trim();
            const existing = customerMap.get(phone);
            if (existing) {
              existing.fullName = dbC.full_name || existing.fullName;
              existing.notes = dbC.notes || existing.notes;
            } else {
              customerMap.set(phone, {
                id: dbC.id,
                fullName: dbC.full_name,
                phone: phone,
                address: dbC.address,
                totalOrdersCount: dbC.total_orders_count || 0,
                totalSpent: dbC.total_spent || 0,
                lastOrderDate: dbC.last_order_date,
                tier: calculateTier(dbC.total_spent || 0),
                notes: dbC.notes,
              });
            }
          });
        }
      }

      setCustomers(Array.from(customerMap.values()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomersData();

    const handleOrdersUpdate = () => loadCustomersData();
    window.addEventListener("orders_updated", handleOrdersUpdate);
    return () => window.removeEventListener("orders_updated", handleOrdersUpdate);
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim()) return;

    setSubmitting(true);
    try {
      const newCust: CustomerProfile = {
        id: `cust_${Date.now()}`,
        fullName: newFullName.trim(),
        phone: newPhone.trim(),
        address: newAddress.trim() || undefined,
        totalOrdersCount: 0,
        totalSpent: 0,
        tier: "bronze",
        notes: newNotes.trim() || undefined,
      };

      if (supabase) {
        await supabase.from("customers").insert([
          {
            id: newCust.id,
            full_name: newCust.fullName,
            phone: newCust.phone,
            address: newCust.address,
            notes: newCust.notes,
            total_spent: 0,
            total_orders_count: 0,
          },
        ]);
      }

      setCustomers((prev) => [newCust, ...prev]);
      showToast(`مخاطب «${newCust.fullName}» با موفقیت در باشگاه مشتریان ثبت گردید.`);
      setNewFullName("");
      setNewPhone("");
      setNewAddress("");
      setNewNotes("");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchTier = tierFilter === "all" || c.tier === tierFilter;
    const matchSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()));
    return matchTier && matchSearch;
  });

  const getTierBadge = (tier: CustomerProfile["tier"]) => {
    switch (tier) {
      case "vip":
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-black text-[10px] border border-purple-500/30">💎 مشتری VIP</span>;
      case "gold":
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-[10px] border border-amber-500/30">🥇 طلایی</span>;
      case "silver":
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-black text-[10px] border border-blue-500/30">🥈 نقره‌ای</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-gray-500/15 text-gray-500 font-bold text-[10px] border border-gray-500/30">🥉 برنزی</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* هدر بخش باشگاه مشتریان */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base flex items-center gap-2 text-[var(--accent-blue)]">
            <span>👥</span> باشگاه مشتریان و مدیریت ارتباط با خریداران (CRM)
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            دسته‌بندی خودکار وفاداری، تحلیل مجموع تراکنش‌ها، لاگ سفارش‌ها و ثبت دستی مخاطبان
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none cursor-pointer"
          >
            <option value="all">همه سطوح وفاداری ({customers.length})</option>
            <option value="vip">سطح VIP</option>
            <option value="gold">سطح طلایی</option>
            <option value="silver">سطح نقره‌ای</option>
            <option value="bronze">سطح برنزی</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در نام، شماره یا نشانی..."
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] w-60"
          />
        </div>
      </div>

      {/* فرم افزودن مخاطب جدید */}
      <form onSubmit={handleCreateCustomer} className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <h4 className="font-black text-xs text-[var(--text-primary)]">➕ ثبت اطلاعات مخاطب یا خریدار جدید</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی *</label>
            <input
              type="text"
              required
              placeholder="مثال: سهراب سپهری"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شماره تلفن همراه *</label>
            <input
              type="tel"
              required
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نشانی پستی (اختیاری)</label>
            <input
              type="text"
              placeholder="شهر، خیابان..."
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">یادداشت اداری مخاطب</label>
            <input
              type="text"
              placeholder="نکات خاص درباره مشتری..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
          >
            {submitting ? "در حال ثبت..." : "+ افزودن به مخاطبان"}
          </button>
        </div>
      </form>

      {/* جدول نمایش لیست مشتریان */}
      <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری باشگاه مشتریان...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">مشتری یا مخاطبی یافت نشد.</div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                <th className="pb-3 px-2">نام مشتری</th>
                <th className="pb-3 px-2">شماره تماس</th>
                <th className="pb-3 px-2">سطح مشتری</th>
                <th className="pb-3 px-2">تعداد سفارش‌ها</th>
                <th className="pb-3 px-2">مجموع خرید (تومان)</th>
                <th className="pb-3 px-2">آخرین خرید</th>
                <th className="pb-3 px-2 text-center">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <td className="py-3 px-2 font-bold text-[var(--text-primary)]">{cust.fullName}</td>
                  <td className="py-3 px-2 font-mono text-[var(--accent-blue)]">{cust.phone}</td>
                  <td className="py-3 px-2">{getTierBadge(cust.tier)}</td>
                  <td className="py-3 px-2 font-mono font-bold">{cust.totalOrdersCount} سفارش</td>
                  <td className="py-3 px-2 font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {cust.totalSpent.toLocaleString("fa-IR")} تومان
                  </td>
                  <td className="py-3 px-2 font-mono text-[11px] text-[var(--text-secondary)]">
                    {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString("fa-IR") : "فاقد خرید"}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => setSelectedCustomer(cust)}
                      className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold transition cursor-pointer text-[11px]"
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

      {/* مدال پرونده تفصیلی مشتری */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 shadow-2xl text-[var(--text-primary)] text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <h4 className="font-black text-sm text-[var(--accent-blue)]">پرونده خریدار: {selectedCustomer.fullName}</h4>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-7 h-7 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] space-y-2.5 text-[11px] leading-relaxed">
              <p><strong className="text-[var(--text-secondary)]">شماره موبایل:</strong> <span className="font-mono">{selectedCustomer.phone}</span></p>
              <p><strong className="text-[var(--text-secondary)]">سطح وفاداری:</strong> {getTierBadge(selectedCustomer.tier)}</p>
              <p><strong className="text-[var(--text-secondary)]">مجموع خرید موفق:</strong> <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedCustomer.totalSpent.toLocaleString("fa-IR")} تومان</span></p>
              <p><strong className="text-[var(--text-secondary)]">تعداد فاکتورها:</strong> <span className="font-mono">{selectedCustomer.totalOrdersCount} عدد</span></p>
              <p><strong className="text-[var(--text-secondary)]">نشانی ثبت‌شده:</strong> {selectedCustomer.address || "آدرسی ثبت نشده است"}</p>
              {selectedCustomer.notes && (
                <p><strong className="text-[var(--text-secondary)]">یادداشت اداری:</strong> {selectedCustomer.notes}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-md cursor-pointer"
              >
                بستن پرونده
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}