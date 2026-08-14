"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    postalCode: "",
    note: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("در حال انتقال به درگاه پرداخت امن بانکی...");
    // در فاز اتصال به بک‌اند، اینجا درخواست به API درگاه ارسال می‌شود.
  };

  return (
    <main className="min-h-screen flex flex-col justify-between">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] mb-8">
          تکمیل سفارش و تسویه‌حساب
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* ستون راست: فرم اطلاعات خریدار */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} id="checkout-form" className="space-y-6">
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                  اطلاعات گیرنده و تحویل
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: پوریا احمدی"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                      شماره موبایل *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                    آدرس دقیق پستی *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="استان، شهر، خیابان اصلی، کوچه، پلاک، واحد"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                      کد پستی (۱۰ رقمی)
                    </label>
                    <input
                      type="text"
                      placeholder="۱۲۳۴۵۶۷۸۹۰"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                      یادداشت سفارش (اختیاری)
                    </label>
                    <input
                      type="text"
                      placeholder="نکات خاص برای ارسال"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* ستون چپ: خلاصه فاکتور و پرداخت */}
          <div>
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 space-y-6 sticky top-24">
              <h2 className="text-lg font-bold text-[var(--text-primary)] pb-4 border-b border-[var(--border-color)]">
                خلاصه فاکتور
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>مجموع اقلام:</span>
                  <span className="font-semibold text-[var(--text-primary)]">۷۷,۵۰۰,۰۰۰ تومان</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>هزینه ارسال:</span>
                  <span className="font-semibold text-[var(--accent-blue)]">رایگان</span>
                </div>
                <div className="border-t border-[var(--border-color)] pt-3 flex justify-between items-center text-base font-extrabold text-[var(--text-primary)]">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-xl text-[var(--accent-blue)]">۷۷,۵۰۰,۰۰۰ تومان</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                className="w-full bg-[var(--accent-blue)] text-white py-4 rounded-full font-bold hover:opacity-90 transition shadow-lg text-center"
              >
                پرداخت و ثبت نهایی
              </button>

              <div className="text-center text-xs text-[var(--text-secondary)] space-y-1">
                <p>🔒 پرداخت امن از طریق درگاه‌های عضو شتاب</p>
                <p>⚡ تحویل سریع با پست پیشتاز / پیک</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}