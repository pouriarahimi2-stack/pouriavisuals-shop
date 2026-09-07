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
  const [smsText, setSmsText] = useState("");
  const [sendingSms, setSendingSms] = useState(false);
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
      console.error("CRM error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSendRewardSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !smsText.trim()) return;

    soundEngine.playClick();
    setSendingSms(true);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: selectedCustomer.phone,
          message: smsText.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        alert("پیامک پاداش و کد تخفیف با موفقیت به مشتری ارسال گردید.");
        setSmsText("");
      } else {
        alert(json.message || "خطا در ارسال پیامک.");
      }
    } catch {
      alert("خطا در برقراری ارتباط با سرور.");
    } finally {
      setSendingSms(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>👥</span> باشگاه مخاطبان، CRM و پاداش وفاداری
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            دسته‌بندی خودکار وفاداری، پایش حجم خرید و ارسال مستقیم پیامک پاداش
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
        <table className="w-full text-right text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black pb-3">
              <th className="p-3.5">نام و نام خانوادگی</th>
              <th className="p-3.5">شماره همراه</th>
              <th className="p-3.5 text-center">سطح عضویت</th>
              <th className="p-3.5 text-center">تعداد سفارش</th>
              <th className="p-3.5">مجموع خریدهای موفق</th>
              <th className="p-3.5 text-center">پرونده و پیامک پاداش</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)] font-medium">
            {filtered.map((c, i) => (
              <tr key={i} className="hover:bg-[var(--input-bg)] transition">
                <td className="p-3.5 font-bold">{c.name}</td>
                <td className="p-3.5 font-mono text-[var(--accent-blue)] font-bold">{c.phone}</td>
                <td className="p-3.5 text-center">
                  <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-500 font-black text-[10px]">
                    {c.tier}
                  </span>
                </td>
                <td className="p-3.5 font-mono text-center font-bold">{c.orderCount} سفارش</td>
                <td className="p-3.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {c.totalSpent.toLocaleString("fa-IR")} تومان
                </td>
                <td className="p-3.5 text-center">
                  <button
                    onClick={() => { soundEngine.playClick(); setSelectedCustomer(c); }}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-xs transition cursor-pointer"
                  >
                    🎁 ارسال پاداش / پرونده
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 text-xs text-[var(--text-primary)] shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
              <h3 className="font-black text-sm">پرونده و ارسال پاداش به: {selectedCustomer.name}</h3>
              <button onClick={() => setSelectedCustomer(null)} className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold">✕</button>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <div><span className="text-[var(--text-secondary)] font-bold">شماره تماس:</span> <span className="font-mono font-bold mr-1">{selectedCustomer.phone}</span></div>
              <div><span className="text-[var(--text-secondary)] font-bold">مجموع خرید:</span> <span className="font-mono font-black text-emerald-600 mr-1">{selectedCustomer.totalSpent.toLocaleString("fa-IR")} تومان</span></div>
            </div>

            <form onSubmit={handleSendRewardSms} className="space-y-3">
              <label className="block font-bold text-[var(--text-secondary)]">متن پیامک یا کد تخفیف اختصاصی به این مشتری:</label>
              <textarea
                rows={3}
                required
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="مشتری گرامی آکسون، به پاس وفاداری شما کد تخفیف VIP15 با ۱۵٪ تخفیف تقدیم می‌گردد..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-medium outline-none focus:border-[var(--accent-blue)]"
              />
              <button
                type="submit"
                disabled={sendingSms}
                className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-lg cursor-pointer disabled:opacity-50"
              >
                {sendingSms ? "در حال ارسال پیامک..." : "ارسال پیامک پاداش 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
