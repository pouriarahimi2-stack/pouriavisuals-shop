"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
      const { data, error } = await supabase.from("orders").select("customer_name, phone, postal_code, address, total_amount, created_at");
      if (error) throw error;

      const customerMap = new Map<string, CustomerSummary>();
      (data || []).forEach((order: any) => {
        const phone = order.phone || "نامشخص";
        const fullName = order.customer_name || "مشتری";
        const amount = Number(order.total_amount || 0);

        if (customerMap.has(phone)) {
          const existing = customerMap.get(phone)!;
          existing.orderCount += 1;
          existing.totalSpent += amount;
        } else {
          customerMap.set(phone, {
            phone,
            name: fullName,
            orderCount: 1,
            totalSpent: amount,
            tier: "برنزی",
            lastOrderDate: order.created_at,
            postalCode: order.postal_code,
            address: order.address,
          });
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    const channel = supabase
      .channel("admin-customers-realtime-master")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchCustomers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex justify-between items-center">
        <h2 className="text-lg font-black text-[var(--accent-blue)]">👥 باشگاه مشتریان و CRM</h2>
        <input type="text" placeholder="جستجو..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs" />
      </div>

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl overflow-x-auto">
        {loading ? <p className="text-xs text-center">بارگذاری...</p> : (
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                <th className="p-3">نام</th><th className="p-3">تلفن</th><th className="p-3">تعداد خرید</th><th className="p-3">مجموع خرید</th><th className="p-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filtered.map((c, i) => (
                <tr key={i} className="hover:bg-[var(--input-bg)]">
                  <td className="p-3 font-bold">{c.name}</td>
                  <td className="p-3 font-mono">{c.phone}</td>
                  <td className="p-3 font-mono text-center">{c.orderCount}</td>
                  <td className="p-3 font-mono text-emerald-600">{c.totalSpent.toLocaleString("fa-IR")} ت</td>
                  <td className="p-3 text-center"><button onClick={() => setSelectedCustomer(c)} className="px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">جزئیات</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 text-xs">
            <h3 className="font-black text-sm">پرونده مشتری: {selectedCustomer.name}</h3>
            <p><strong>تلفن:</strong> {selectedCustomer.phone}</p>
            <p><strong>آدرس:</strong> {selectedCustomer.address || "ثبت نشده"}</p>
            <button onClick={() => setSelectedCustomer(null)} className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold">بستن</button>
          </div>
        </div>
      )}
    </div>
  );
}