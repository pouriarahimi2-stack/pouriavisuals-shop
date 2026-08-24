"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface CustomerSummary {
  phone: string;
  name: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  postalCode?: string;
  address?: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("first_name, last_name, phone, postal_code, address, total_amount, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // تجمیع مشتریان بر اساس شماره تلفن یکتا
      const customerMap = new Map<string, CustomerSummary>();

      (data || []).forEach((order: any) => {
        const phone = order.phone || "نامشخص";
        const fullName = `${order.first_name || ""} ${order.last_name || ""}`.trim() || "مشتری فروشگاه";
        const amount = Number(order.total_amount || 0);
        const orderDate = order.created_at;

        if (customerMap.has(phone)) {
          const existing = customerMap.get(phone)!;
          existing.orderCount += 1;
          existing.totalSpent += amount;
          if (new Date(orderDate) > new Date(existing.lastOrderDate)) {
            existing.lastOrderDate = orderDate;
          }
        } else {
          customerMap.set(phone, {
            phone,
            name: fullName,
            orderCount: 1,
            totalSpent: amount,
            lastOrderDate: orderDate,
            postalCode: order.postal_code,
            address: order.address,
          });
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (e) {
      console.error("Error fetching customers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    // همگام‌سازی بلادرنگ مخاطبان با وب‌سوکت
    const channel = supabase
      .channel("admin-customers-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchCustomers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 font-sans select-none" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">👥 باشگاه مخاطبان و مشتریان وفادار</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">پایش خریداران تاییدشده با پیامک، تاریخچه سفارش‌ها و حجم معاملات</p>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="جستجوی نام یا شماره تماس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm overflow-x-auto">
        {loading ? (
          <p className="text-xs text-center py-8 text-[var(--text-muted)] font-bold animate-pulse">در حال فراخوانی لیست مشتریان...</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="text-xs text-center py-8 text-[var(--text-muted)] font-bold">هیچ مخاطبی یافت نشد.</p>
        ) : (
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black pb-3">
                <th className="p-3">نام و نام خانوادگی</th>
                <th className="p-3">شماره تماس (تایید OTP)</th>
                <th className="p-3">تعداد سفارش</th>
                <th className="p-3">مجموع خرید</th>
                <th className="p-3">آخرین فعالیت</th>
                <th className="p-3">کد پستی ثبت‌شده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredCustomers.map((customer, idx) => (
                <tr key={idx} className="hover:bg-[var(--input-bg)]/50 transition">
                  <td className="p-3 font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center font-black text-[11px]">
                      {customer.name.charAt(0)}
                    </span>
                    <span>{customer.name}</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-[var(--accent-blue)]">
                    {customer.phone}
                  </td>
                  <td className="p-3 font-mono font-extrabold">
                    {customer.orderCount} سفارش
                  </td>
                  <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {customer.totalSpent.toLocaleString("fa-IR")} تومان
                  </td>
                  <td className="p-3 text-[var(--text-muted)] font-medium">
                    {new Date(customer.lastOrderDate).toLocaleDateString("fa-IR")}
                  </td>
                  <td className="p-3 font-mono text-[var(--text-secondary)]">
                    {customer.postalCode || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}