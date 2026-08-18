"use client";

import React from "react";

interface ShippingProps {
  formData: {
    fullName: string;
    phone: string;
    province: string;
    city: string;
    address: string;
    postalCode: string;
    notes: string;
    shippingMethod: "express" | "regular";
  };
  onChange: (field: string, value: any) => void;
}

export default function CheckoutShipping({ formData, onChange }: ShippingProps) {
  const isPostalValid = /^\d{10}$/.test(formData.postalCode.trim());

  return (
    <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
        <span className="p-2.5 rounded-2xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-lg">
          📍
        </span>
        <div>
          <h3 className="font-black text-sm">مشخصات گیرنده و نشانی پستی</h3>
          <p className="text-[11px] text-[var(--text-secondary)] font-medium">اطلاعات دقیق پستی جهت صدور بارنامه پیشتاز</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی تحویل‌گیرنده *</label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            placeholder="مثال: پوریا احمدی"
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
          />
        </div>

        <div>
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شماره موبایل (جهت دریافت پیامک رهگیری) *</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
          />
        </div>

        <div>
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">استان *</label>
          <input
            type="text"
            required
            value={formData.province}
            onChange={(e) => onChange("province", e.target.value)}
            placeholder="مثال: تهران"
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
          />
        </div>

        <div>
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شهر *</label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="مثال: تهران"
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کد پستی ۱۰ رقمی (بدون خط تیره) *</label>
          <input
            type="text"
            required
            maxLength={10}
            value={formData.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value.replace(/\D/g, ""))}
            placeholder="۱۲۳۴۵۶۷۸۹۰"
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
          />
          {formData.postalCode && !isPostalValid && (
            <p className="text-[10px] text-rose-500 font-bold mt-1">کد پستی باید دقیقاً ۱۰ رقم عددی باشد.</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) *</label>
          <textarea
            rows={3}
            required
            value={formData.address}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder="نشانی کامل جهت تحویل مرسوله..."
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition leading-relaxed"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">توضیحات و یادداشت سفارش (اختیاری)</label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            placeholder="نکات تحویل، زمان تحویل و..."
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
          />
        </div>
      </div>

      {/* انتخاب روش ارسال */}
      <div className="space-y-3 pt-4 border-t border-[var(--card-border)]">
        <label className="block font-black text-xs text-[var(--text-secondary)]">روش ارسال مرسوله:</label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => onChange("shippingMethod", "regular")}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
              formData.shippingMethod === "regular"
                ? "bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] text-[var(--text-primary)] shadow-md"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
            }`}
          >
            <div className="space-y-1">
              <span className="font-extrabold text-xs block text-[var(--text-primary)]">📦 پست پیشتاز سراسری</span>
              <span className="text-[10px] opacity-80">تحویل ۲ الی ۴ روز کاری</span>
            </div>
            <span className="font-mono font-bold text-xs">۴۵,۰۰۰ تومان</span>
          </div>

          <div
            onClick={() => onChange("shippingMethod", "express")}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
              formData.shippingMethod === "express"
                ? "bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] text-[var(--text-primary)] shadow-md"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
            }`}
          >
            <div className="space-y-1">
              <span className="font-extrabold text-xs block text-[var(--text-primary)]">⚡ ارسال اکسپرس و فوری</span>
              <span className="text-[10px] opacity-80">تحویل همان روز (ویژه تهران)</span>
            </div>
            <span className="font-mono font-bold text-xs">۸۵,۰۰۰ تومان</span>
          </div>
        </div>
      </div>
    </div>
  );
}