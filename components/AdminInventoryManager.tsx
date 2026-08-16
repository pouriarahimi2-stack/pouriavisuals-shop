"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";

interface StockLog {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out";
  quantity: number;
  date: string;
  time: string;
  reason: string;
  operator: string;
}

export default function AdminInventoryManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [type, setType] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const prods = await productService.getAll();
    setProducts(prods || []);
    if (prods && prods.length > 0) setSelectedProductId(prods[0].id);

    const savedLogs = JSON.parse(localStorage.getItem("inventory_stock_logs") || "[]");
    setLogs(savedLogs);
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) return;

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const now = new Date();
    const newLog: StockLog = {
      id: `log-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      type,
      quantity,
      date: now.toLocaleDateString("fa-IR"),
      time: now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      reason: reason.trim() || (type === "in" ? "ورود به انبار (خرید جدید)" : "ترخیص و ارسال به مشتری"),
      operator: "مدیر ارشد",
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem("inventory_stock_logs", JSON.stringify(updatedLogs));

    setQuantity(1);
    setReason("");
    alert("✅ گردش انبار با موفقیت ثبت گردید.");
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]">
      {/* فرم ثبت ورود/خروج جدید */}
      <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-2xl space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            📥
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">سامانه مدیریت ورود و خروج انبار</h3>
            <p className="text-[11px] text-zinc-400 font-medium">ثبت تاریخ، ساعت دقیق، تعداد و دلیل ورود یا ترخیص کالا</p>
          </div>
        </div>

        <form onSubmit={handleStockSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block mb-1.5 font-bold text-zinc-300">انتخاب کالا:</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-bold outline-none focus:border-blue-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-zinc-300">نوع عملیات:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("in")}
                className={`flex-1 py-2.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                  type === "in" ? "bg-emerald-600 text-white shadow-md" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                ➕ ورود کالا
              </button>
              <button
                type="button"
                onClick={() => setType("out")}
                className={`flex-1 py-2.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                  type === "out" ? "bg-rose-600 text-white shadow-md" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                ➖ خروج کالا
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-zinc-300">تعداد:</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono font-bold outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-zinc-300">علت یا شماره حواله:</label>
            <input
              type="text"
              placeholder="مثلاً: فاکتور خرید پارت جدید"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-medium outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black transition cursor-pointer shadow-lg shadow-blue-600/30 text-xs flex items-center gap-1.5"
            >
              <span>⚡ ثبت رسمی در لاگ انبار</span>
            </button>
          </div>
        </form>
      </div>

      {/* لیست و جدول لاگ‌های ثبت شده */}
      <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-2xl space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h4 className="text-xs font-black text-white">تاریخچه و دفتر کل گردش انبار</h4>
          <span className="text-[11px] font-bold text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
            {logs.length} رکورد
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-500 font-bold">
            هیچ لاگ ورود و خروجی هنوز ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="p-3 font-bold">نوع</th>
                  <th className="p-3 font-bold">نام کالا</th>
                  <th className="p-3 font-bold">تعداد</th>
                  <th className="p-3 font-bold">تاریخ و ساعت</th>
                  <th className="p-3 font-bold">دلیل / شرح حواله</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition">
                    <td className="p-3">
                      {log.type === "in" ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                          + ورود
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                          - خروج
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-white">{log.productName}</td>
                    <td className="p-3 font-mono font-extrabold text-blue-400">{log.quantity} عدد</td>
                    <td className="p-3 font-mono text-zinc-400 text-[11px]">{log.date} - {log.time}</td>
                    <td className="p-3 text-zinc-300 font-medium">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}