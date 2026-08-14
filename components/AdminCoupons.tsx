"use client";

import React, { useState, useEffect } from "react";

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  amount: number;
  minOrderAmount?: number;
  expireDate?: string;
  isActive: boolean;
  createdAt: string;
}

const COUPONS_KEY = "site_coupons";
const RANDOM_LOGS_KEY = "site_random_coupons_history";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [randomHistory, setRandomHistory] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // استیت فرم
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [amount, setAmount] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [expireDate, setExpireDate] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadCoupons();
    loadRandomHistory();
  }, []);

  const loadCoupons = () => {
    const data = localStorage.getItem(COUPONS_KEY);
    if (data) {
      setCoupons(JSON.parse(data));
    } else {
      const initialCoupons: Coupon[] = [
        {
          id: "coup-1",
          code: "OFF10",
          type: "percent",
          amount: 10,
          minOrderAmount: 200000,
          isActive: true,
          createdAt: new Date().toLocaleDateString("fa-IR"),
        },
      ];
      localStorage.setItem(COUPONS_KEY, JSON.stringify(initialCoupons));
      setCoupons(initialCoupons);
    }
  };

  const loadRandomHistory = () => {
    const history = localStorage.getItem(RANDOM_LOGS_KEY);
    if (history) {
      setRandomHistory(JSON.parse(history));
    }
  };

  const saveCouponsToStorage = (updated: Coupon[]) => {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(updated));
    setCoupons(updated);
  };

  // 🎲 الگوریتم تولید کد تخفیف رندوم و ثبت در حافظه
  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "VIP-";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setCode(result);

    // ثبت در تاریخچه حافظه
    const updatedHistory = [result, ...randomHistory];
    setRandomHistory(updatedHistory);
    localStorage.setItem(RANDOM_LOGS_KEY, JSON.stringify(updatedHistory));

    showToast(`🎲 کد رندوم جدید "${result}" ساخته و در فرم درج شد!`);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !amount) {
      showToast("⚠️ لطفاً کد تخفیف و میزان تخفیف را وارد کنید.");
      return;
    }

    const newCoupon: Coupon = {
      id: "coup-" + Date.now(),
      code: code.trim().toUpperCase(),
      type,
      amount: Number(amount),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      expireDate: expireDate || undefined,
      isActive: true,
      createdAt: new Date().toLocaleDateString("fa-IR"),
    };

    const updated = [newCoupon, ...coupons];
    saveCouponsToStorage(updated);

    // ریست فرم
    setCode("");
    setAmount("");
    setMinOrderAmount("");
    setExpireDate("");
    showToast(`🎉 کد تخفیف "${newCoupon.code}" با موفقیت ساخته شد.`);
  };

  const toggleCouponStatus = (id: string) => {
    const updated = coupons.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    saveCouponsToStorage(updated);
    showToast("🔄 وضعیت کد تخفیف بروزرسانی شد.");
  };

  const handleDeleteCoupon = (id: string, couponCode: string) => {
    if (confirm(`آیا از حذف کد تخفیف "${couponCode}" اطمینان دارید؟`)) {
      const updated = coupons.filter((c) => c.id !== id);
      saveCouponsToStorage(updated);
      showToast("🗑️ کد تخفیف با موفقیت حذف شد.");
    }
  };

  return (
    <div className="space-y-6 select-none text-xs font-sans text-white">
      {/* توست نوتیفیکیشن */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold shadow-2xl border border-white/20 animate-bounce">
          {toastMessage}
        </div>
      )}

      <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-black text-indigo-300 flex items-center gap-2">
              <span>🏷️</span> مدیریت کدهای تخفیف و ژنراتور رندوم
            </h3>
            <p className="text-xs opacity-60 mt-1">ساخت هوشمند، تعیین سقف خرید، تاریخ انقضا و آرشیو ژنراتور</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold">
              🎲 {randomHistory.length} کد رندوم ساخته‌شده
            </span>
            <span className="px-3 py-1 bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-bold">
              {coupons.length} کد تخفیف فعال
            </span>
          </div>
        </div>

        {/* فرم ساخت کد تخفیف به‌همراه ژنراتور رندوم */}
        <form onSubmit={handleCreateCoupon} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="font-extrabold text-xs text-indigo-200 block">➕ تعریف یا ساخت هوشمند کد تخفیف:</span>
            <button
              type="button"
              onClick={generateRandomCode}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold transition cursor-pointer flex items-center gap-1.5 text-[11px]"
            >
              <span>🎲</span> ساخت اتوماتیک کد رندوم
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold opacity-70">کد تخفیف (به انگلیسی) *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="مثلاً: BLACKFRIDAY"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">نوع تخفیف *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "percent" | "fixed")}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 outline-none font-bold cursor-pointer"
              >
                <option value="percent">درصدی (%)</option>
                <option value="fixed">مبلغ ثابت (تومان)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">
                {type === "percent" ? "درصد تخفیف (مثلاً ۲۰)" : "مبلغ تخفیف (تومان)"} *
              </label>
              <input
                type="number"
                required
                placeholder={type === "percent" ? "20" : "50000"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">حداقل مبلغ سفارش (تومان)</label>
              <input
                type="number"
                placeholder="مثلاً ۲۰۰,۰۰۰"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">تاریخ انقضا (اختیاری)</label>
              <input
                type="text"
                placeholder="مثلا: ۱۴۰۵/۱۲/۲۹"
                value={expireDate}
                onChange={(e) => setExpireDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold transition cursor-pointer shadow-md"
              >
                🚀 ثبت و انتشار کد تخفیف
              </button>
            </div>
          </div>
        </form>

        {/* 📚 تاریخچه حافظه کدهای رندوم تولیدشده */}
        {randomHistory.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-black/20 border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-amber-300">
                📜 تاریخچه کدهای رندوم تولیدشده توسط ژنراتور ({randomHistory.length} کد):
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem(RANDOM_LOGS_KEY);
                  setRandomHistory([]);
                  showToast("🧹 حافظه کدهای رندوم پاک‌سازی شد.");
                }}
                className="text-[10px] text-rose-400 hover:underline font-bold"
              >
                پاک‌سازی حافظه
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pt-1">
              {randomHistory.map((item, idx) => (
                <span
                  key={idx}
                  onClick={() => {
                    setCode(item);
                    showToast(`📋 کد "${item}" روی فرم اعمال شد.`);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400 font-mono text-[10px] cursor-pointer text-amber-200 transition"
                  title="کلیک برای اعمال روی فرم"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* لیست کدهای تخفیف فعال */}
        <div className="space-y-3 pt-2">
          <span className="font-bold opacity-70 block">کدهای تخفیف فعال فروشگاه:</span>

          {coupons.length === 0 ? (
            <div className="text-center py-8 text-white/50">هنوز هیچ کد تخفیفی ثبت نشده است.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center gap-3 hover:border-indigo-400 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">
                        {c.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {c.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </div>

                    <p className="text-[11px] opacity-80">
                      میزان تخفیف:{" "}
                      <strong className="text-white">
                        {c.type === "percent"
                          ? `${c.amount}%`
                          : `${c.amount.toLocaleString("fa-IR")} تومان`}
                      </strong>
                    </p>

                    {c.minOrderAmount && (
                      <p className="text-[10px] opacity-60">
                        حداقل سفارش: {c.minOrderAmount.toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCouponStatus(c.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] cursor-pointer ${
                        c.isActive
                          ? "bg-amber-600/30 text-amber-200 border border-amber-500/30 hover:bg-amber-600"
                          : "bg-emerald-600/30 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-600"
                      }`}
                    >
                      {c.isActive ? "مخفی‌سازی" : "فعال‌سازی"}
                    </button>

                    <button
                      onClick={() => handleDeleteCoupon(c.id, c.code)}
                      className="p-1.5 rounded-xl bg-rose-600/30 text-rose-200 border border-rose-500/30 hover:bg-rose-600 transition cursor-pointer"
                      title="حذف"
                    >
                      🗑️
                    </button>
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