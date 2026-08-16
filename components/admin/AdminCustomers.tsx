"use client";

import React, { useState, useEffect } from "react";
import { orderService } from "@/services/orderService";

export interface CustomerContact {
  phone: string;
  name: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [smsMessage, setSmsMessage] = useState("");
  const [selectedPhone, setSelectedPhone] = useState("all");
  const [sendingSms, setSendingSms] = useState(false);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      setLoading(true);
      try {
        let orders: any[] = [];
        if (typeof orderService.getAllOrders === "function") {
          orders = (await orderService.getAllOrders()) || [];
        }
        if (orders.length === 0) {
          orders = JSON.parse(
            localStorage.getItem("admin_orders_cache") ||
            localStorage.getItem("site_orders") ||
            "[]"
          );
        }

        const customerMap: { [key: string]: CustomerContact } = {};

        orders.forEach((o) => {
          const rawPhone = o.customer_phone || o.customerPhone;
          if (!rawPhone) return;

          const name = o.customer_name || o.customerName || "کاربر سایت";
          const amount = Number(o.total_amount || o.totalAmount || 0);
          const date = o.created_at || new Date().toISOString();

          if (customerMap[rawPhone]) {
            customerMap[rawPhone].orderCount += 1;
            customerMap[rawPhone].totalSpent += amount;
            customerMap[rawPhone].lastOrderDate = date;
          } else {
            customerMap[rawPhone] = {
              phone: rawPhone,
              name,
              orderCount: 1,
              totalSpent: amount,
              lastOrderDate: date,
            };
          }
        });

        setCustomers(Object.values(customerMap));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  const handleSendDirectSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsMessage.trim()) return;

    setSendingSms(true);
    setSmsStatus(null);

    const targetPhones =
      selectedPhone === "all"
        ? customers.map((c) => c.phone)
        : [selectedPhone];

    try {
      for (const ph of targetPhones) {
        await fetch("/api/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: ph,
            pattern: "marketing_notice",
            tokens: { token1: smsMessage.trim() },
          }),
        });
      }

      setSmsStatus(`✅ پیامک به ${targetPhones.length} شماره مخاطب با موفقیت ارسال شد.`);
      setSmsMessage("");
    } catch (e) {
      console.error(e);
      setSmsStatus("خطا در ارسال پیامک.");
    } finally {
      setSendingSms(false);
    }
  };

  const exportContactsToCSV = () => {
    if (customers.length === 0) {
      alert("مخاطبی جهت خروجی یافت نشد.");
      return;
    }

    const headers = ["نام خریدار,شماره تلفن همراه,تعداد سفارشات,مجموع خرید (تومان),آخرین خرید\n"];
    const rows = customers.map(
      (c) => `"${c.name}","${c.phone}","${c.orderCount}","${c.totalSpent}","${c.lastOrderDate}"\n`
    );

    const blob = new Blob(["\uFEFF" + headers.concat(rows).join("")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Contacts_Club_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printContactsPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="fa">
        <head>
          <title>لیست مخاطبان و مشتریان فروشگاه</title>
          <style>
            body { font-family: Tahoma, sans-serif; padding: 25px; direction: rtl; color: #0f172a; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>دفترچه تلفن و باشگاه مشتریان فروشگاه تخصصی Tech</h2>
            <p>تعداد کل مخاطبان: ${customers.length} نفر</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>ردیف</th>
                <th>نام و نام خانوادگی</th>
                <th>شماره موبایل</th>
                <th>تعداد سفارش</th>
                <th>مجموع خرید (تومان)</th>
              </tr>
            </thead>
            <tbody>
              ${customers.map((c, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${c.name}</td>
                  <td dir="ltr" style="text-align: right;">${c.phone}</td>
                  <td>${c.orderCount}</td>
                  <td>${Number(c.totalSpent).toLocaleString("fa-IR")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>👥</span> باشگاه مشتریان و سامانه پیامک انبوه
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            استخراج خودکار شماره مخاطبان از پایگاه داده، ارسال پیامک مناسبتی/کد تخفیف و گزارش‌گیری
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportContactsToCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <span>📊</span>
            <span>خروجی اکسل</span>
          </button>
          <button
            onClick={printContactsPDF}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🖨️</span>
            <span>چاپ / PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSendDirectSMS}
          className="lg:col-span-5 p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 shadow-xl text-xs"
        >
          <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
            <span>📲</span> ارسال پیامک جشنواره و کد تخفیف:
          </h3>

          {smsStatus && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              {smsStatus}
            </div>
          )}

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">گیرنده پیامک:</label>
            <select
              value={selectedPhone}
              onChange={(e) => setSelectedPhone(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs cursor-pointer"
            >
              <option value="all">ارسال به تمام مخاطبان ({customers.length} نفر)</option>
              {customers.map((c) => (
                <option key={c.phone} value={c.phone}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">متن پیامک یا کد تخفیف:</label>
            <textarea
              rows={4}
              required
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="مثال: مشتری گرامی! به مناسبت افتتاحیه با کد تخفیف OFF2026 از ۲۰٪ تخفیف در خرید خود بهره‌مند شوید..."
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium leading-relaxed focus:border-[var(--accent-blue)]"
            />
          </div>

          <button
            type="submit"
            disabled={sendingSms || customers.length === 0}
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sendingSms ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              <span>ارسال پیامک مستقیم به مخاطبان 🚀</span>
            )}
          </button>
        </form>

        <div className="lg:col-span-7 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-black text-sm text-[var(--text-primary)]">
              👥 مخاطبان ثبت‌شده در دیتابیس ({customers.length})
            </h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام یا شماره..."
              className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-secondary)] font-bold">
              مخاطبی یافت نشد.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filtered.map((c) => (
                <div
                  key={c.phone}
                  className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-black text-[var(--text-primary)]">{c.name}</div>
                    <div className="text-[11px] font-mono text-[var(--accent-blue)] font-bold mt-0.5">
                      {c.phone}
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <div className="font-bold text-[11px] text-[var(--text-secondary)]">
                      {c.orderCount} سفارش
                    </div>
                    <div className="font-black text-[11px]">
                      {Number(c.totalSpent).toLocaleString("fa-IR")} تومان
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}