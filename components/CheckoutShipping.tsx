// File Path: components/CheckoutShipping.tsx
"use client";

import React, { useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

const IRAN_PROVINCES_MAP: Record<string, string[]> = {
  "تهران": ["تهران", "شهریار", "اسلامشهر", "قدس", "ملارد", "پاکدشت", "ری", "ورامین", "پردیس", "دماوند", "رباط‌کریم", "شمیرانات"],
  "فارس": ["شیراز", "مرودشت", "جهرم", "فسا", "کازرون", "داراب", "لار", "آباده", "نورآباد", "اقلید", "صدرا"],
  "اصفهان": ["اصفهان", "کاشان", "خمینی‌شهر", "نجف‌آباد", "شاهین‌شهر", "شهرضا", "فولادشهر", "بهارستان", "مبارکه", "زرین‌شهر"],
  "خراسان رضوی": ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "کاشمر", "قوچان", "تربت جام", "تایباد", "چناران", "گلبهار"],
  "آذربایجان شرقی": ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب", "سراب", "آذرشهر", "سهند", "شبستر"],
  "مازندران": ["ساری", "بابل", "آمل", "قائم‌شهر", "بهشهر", "چالوس", "نکا", "بابلسر", "تنکابن", "رامسر", "نوشهر"],
  "البرز": ["کرج", "فردیس", "کمال‌شهر", "نظرآباد", "محمدشهر", "ماهدشت", "هشتگرد", "طالقان"],
  "خوزستان": ["اهواز", "دزفول", "آبادان", "بندر ماهشهر", "خرمشهر", "اندیمشک", "ایذه", "بهبهان", "شوشتر", "امیدیه"],
  "گیلان": ["رشت", "بندر انزلی", "لاهیجان", "لنگرود", "تالش", "آستارا", "صومعه‌سرا", "آستانه اشرفیه", "رودسر", "فومن"],
  "کرمان": ["کرمان", "سیرجان", "رفسنجان", "جیرفت", "بم", "زرند", "کهنوج", "شهربابک", "بافت"],
  "آذربایجان غربی": ["ارومیه", "خوی", "بوکان", "مهاباد", "میاندوآب", "سلماس", "پیرانشهر", "نقده", "ماکو"],
  "هرمزگان": ["بندرعباس", "میناب", "قشم", "کیش", "بندر لنگه", "رودان", "حاجی‌آباد", "جاسک"],
  "مرکزی": ["اراک", "ساوه", "خمین", "محلات", "دلیجان", "شازند", "تفرش"],
  "همدان": ["همدان", "ملایر", "نهاوند", "اسدآباد", "تویسرکان", "بهار", "کبودرآهنگ"],
  "یزد": ["یزد", "میبد", "اردکان", "بافق", "مهریز", "ابرکوه", "طبس"],
  "کرمانشاه": ["کرمانشاه", "اسلام‌آباد غرب", "جوانرود", "کنگاور", "سرپل ذهاب", "سنقر", "هرسین"],
  "قزوین": ["قزوین", "الوند", "تاکستان", "بوئین‌زهرا", "آبیک", "محمدیه"],
  "سیستان و بلوچستان": ["زاهدان", "زابل", "ایرانشهر", "چابهار", "سراوان", "خاش", "کنارک"],
  "قم": ["قم", "قنوات", "جعفریه", "کهک", "دستجرد"],
  "گلستان": ["گرگان", "گنبد کاووس", "بندر ترکمن", "علی‌آباد کتول", "آق‌قلا", "کردکوی", "کلاله"],
  "کردستان": ["سنندج", "سقز", "مریوان", "بانه", "قروه", "کامیاران", "بیجار"],
  "لرستان": ["خرم‌آباد", "بروجرد", "دورود", "کوهدشت", "الیگودرز", "نورآباد", "ازنا"],
  "بوشهر": ["بوشهر", "برازجان", "بندر گناوه", "بندر کنگان", "عسلویه", "خورموج", "جم"],
  "زنجان": ["زنجان", "ابهر", "خرمدره", "قیدار", "ماه‌نشان"],
  "اردبیل": ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال", "گرمی"],
  "سمنان": ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدی‌شهر"],
  "چهارمحال و بختیاری": ["شهرکرد", "بروجن", "فرخ‌شهر", "فارسان", "لردگان"],
  "ایلام": ["ایلام", "دهلران", "ایوان", "آبدانان", "دره‌شهر"],
  "کهگیلویه و بویراحمد": ["یاسوج", "دوگنبدان", "دهدشت", "سی‌سخت"],
  "خراسان شمالی": ["بجنورد", "شیروان", "اسفراین", "آشخانه"],
  "خراسان جنوبی": ["بیرجند", "قائن", "فردوس", "نهبندان", "طبس"],
};

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
  const provinces = Object.keys(IRAN_PROVINCES_MAP);
  const activeProvince =
    formData.province && IRAN_PROVINCES_MAP[formData.province] ? formData.province : "تهران";
  const cities = IRAN_PROVINCES_MAP[activeProvince] || ["تهران"];

  useEffect(() => {
    if (!formData.province || !IRAN_PROVINCES_MAP[formData.province]) {
      onChange("province", "تهران");
      onChange("city", "تهران");
    }
  }, []);

  const handleMethodChange = (method: "express" | "regular") => {
    soundEngine.playClick();
    onChange("shippingMethod", method);
  };

  return (
    <div
      className="p-5 sm:p-8 rounded-[2.2rem] sm:rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 font-sans select-none text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
        <span className="p-2.5 rounded-2xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-lg">
          📍
        </span>
        <div>
          <h3 className="font-black text-sm">مشخصات گیرنده و نشانی پستی</h3>
          <p className="text-[11px] text-[var(--text-secondary)] font-medium">
            انتخاب استاندارد استان و شهر جهت صدور بارنامه پست پیشتاز (مجهز به حافظه فرم)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
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
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
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
              const nextCities = IRAN_PROVINCES_MAP[nextProv] || [];
              onChange("city", nextCities[0] || "");
            }}
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer transition"
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
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer transition"
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
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
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
            className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-[var(--card-border)]">
        <label className="block font-black text-xs text-[var(--text-secondary)]">روش ارسال مرسوله:</label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => handleMethodChange("regular")}
            className={
              "p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between " +
              (formData.shippingMethod === "regular"
                ? "bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] text-[var(--text-primary)] shadow-md"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            <div className="space-y-1">
              <span className="font-extrabold text-xs block text-[var(--text-primary)]">
                📦 پست پیشتاز سراسری
              </span>
              <span className="text-[10px] opacity-80">تحویل ۲ الی ۴ روز کاری</span>
            </div>
            <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
              رایگان
            </span>
          </div>

          <div
            onClick={() => handleMethodChange("express")}
            className={
              "p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between " +
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
            <span className="font-mono font-bold text-xs">۸۵,۰۰۰ تومان</span>
          </div>
        </div>
      </div>
    </div>
  );
}
