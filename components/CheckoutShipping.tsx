// File Path: components/CheckoutShipping.tsx
"use client";

import React, { useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { IRAN_PROVINCES_CITIES } from "@/lib/iranLocations";

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
  const isPostalValid = /^\d{10}$/.test((formData.postalCode || "").trim());
  const provinces = Object.keys(IRAN_PROVINCES_CITIES);
  const activeProvince =
    formData.province && IRAN_PROVINCES_CITIES[formData.province] ? formData.province : "تهران";
  const cities = IRAN_PROVINCES_CITIES[activeProvince] || ["تهران"];

  useEffect(() => {
    if (!formData.province || !IRAN_PROVINCES_CITIES[formData.province]) {
      onChange("province", "تهران");
      onChange("city", "تهران");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMethodChange = (method: "express" | "regular") => {
    soundEngine.playClick();
    onChange("shippingMethod", method);
  };

  return (
    <div
      className="p-5 sm:p-8 rounded-[2.5rem] sm:rounded-[2.5rem] bg-white/70 dark:bg-black/40 backdrop-blur-2xl border border-[var(--card-border)] shadow-xl space-y-6 font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
        <span className="p-2.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-lg">
          📍
        </span>
        <div>
          <h3 className="font-black text-sm">مشخصات گیرنده و نشانی پستی</h3>
          <p className="text-[11px] text-[var(--text-secondary)] font-medium">لطفاً آدرس دقیق خود را برای ارسال کالا وارد نمایید.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 text-xs">
        <div>
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
            نام و نام خانوادگی تحویل‌گیرنده *
          </label>
          <input
            type="text"
            name="shipping_full_name"
            required
            value={formData.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            placeholder="مثال: پوریا رحیمی"
            className="w-full p-3.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
          />
        </div>

        <div>
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
            شماره موبایل (جهت دریافت پیامک رهگیری) *
          </label>
          <input
            type="tel"
            name="shipping_phone"
            required
            dir="ltr"
            maxLength={11}
            value={formData.phone}
            onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, ""))}
            placeholder="09123456789"
            className="w-full p-3.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
          />
        </div>

        <div>
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">انتخاب استان *</label>
          <select
            name="shipping_province"
            value={activeProvince}
            onChange={(e) => {
              soundEngine.playClick();
              const nextProv = e.target.value;
              onChange("province", nextProv);
              const nextCities = IRAN_PROVINCES_CITIES[nextProv] || [];
              onChange("city", nextCities[0] || "");
            }}
            className="w-full p-3.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer transition"
          >
            {provinces.map((prov) => (
              <option key={prov} value={prov}>
                📍 استان {prov}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">انتخاب شهر *</label>
          <select
            name="shipping_city"
            value={formData.city || cities[0]}
            onChange={(e) => {
              soundEngine.playClick();
              onChange("city", e.target.value);
            }}
            className="w-full p-3.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer transition"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                🏙️ {c}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
            کد پستی ۱۰ رقمی (بدون خط تیره) *
          </label>
          <input
            type="text"
            name="shipping_postal_code"
            required
            dir="ltr"
            maxLength={10}
            value={formData.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value.replace(/\D/g, ""))}
            placeholder="1234567890"
            className="w-full p-3.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
          />
          {formData.postalCode && !isPostalValid && (
            <p className="text-[10px] text-rose-500 font-bold mt-1">
              کد پستی باید دقیقاً ۱۰ رقم عددی باشد.
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
            نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) *
          </label>
          <textarea
            rows={3}
            name="shipping_address"
            required
            value={formData.address}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder="نشانی کامل جهت تحویل مرسوله..."
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition leading-relaxed"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
            توضیحات و یادداشت سفارش (اختیاری)
          </label>
          <input
            type="text"
            name="shipping_notes"
            value={formData.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            placeholder="نکات تحویل، زمان تحویل و..."
            className="w-full p-3.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-[var(--card-border)]">
        <label className="block font-black text-xs text-[var(--text-secondary)]">روش ارسال مرسوله:</label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => handleMethodChange("regular")}
            className={
              "p-4 rounded-full border transition cursor-pointer flex items-center justify-between " +
              (formData.shippingMethod === "regular"
                ? "bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] text-[var(--text-primary)] shadow-md"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            <div className="space-y-1">
              <span className="font-extrabold text-xs block text-[var(--text-primary)]">
                📦 پست پیشتاز
              </span>
              <span className="text-[10px] opacity-80"></span>
            </div>
            <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              رایگان
            </span>
          </div>

          <div
            onClick={() => handleMethodChange("express")}
            className={
              "p-4 rounded-full border transition cursor-pointer flex items-center justify-between " +
              (formData.shippingMethod === "express"
                ? "bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] text-[var(--text-primary)] shadow-md"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            <div className="space-y-1">
              <span className="font-extrabold text-xs block text-[var(--text-primary)]">
                ⚡ ارسال اکسپرس و فوری
              </span>
              <span className="text-[10px] opacity-80">تحویل ویژه و سریع</span>
            </div>
            <span className="font-mono font-bold text-xs whitespace-nowrap">پس‌کرایه</span>
          </div>
        </div>
      </div>
    </div>
  );
}
