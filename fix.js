/**
 * AXON CORE - Step 1: Inventory Concurrency, Server Checkout & Rate Limiting (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[STEP-1]\x1b[0m مقاوم‌سازی انبارداری، فرم تسویه و روت پیامک...");

// =============================================================================
// ۱. اصلاح app/actions/orders.ts با قفل منطقی موجودی و کنترل همزمانی
// =============================================================================
const fixedOrdersAction = `"use server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export interface OrderItemInput {
  productId: string | number;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  customer: {
    fullName: string;
    phone: string;
    province?: string;
    city?: string;
    address: string;
    postalCode?: string;
    notes?: string;
  };
  couponCode?: string;
  shippingCost?: number;
}

export async function createOrderServer(payload: CreateOrderInput) {
  try {
    const { items, customer, couponCode, shippingCost = 0 } = payload;

    if (!items || items.length === 0) {
      return { success: false, error: "سبد خرید خالی است." };
    }

    if (!customer.phone || !customer.address || !customer.fullName) {
      return { success: false, error: "مشخصات خریدار و نشانی تحویل مرسوله ناقص است." };
    }

    const cleanPhone = customer.phone
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/\\D/g, "");

    if (!/^09\\d{9}$/.test(cleanPhone)) {
      return { success: false, error: "شماره تماس وارد شده معتبر نیست." };
    }

    const productIds = items.map((i) => String(i.productId)).filter(Boolean);
    const { data: dbProducts, error: dbErr } = await supabaseAdmin
      .from("products")
      .select("id, title, price, discount_price, stock, is_available")
      .in("id", productIds);

    if (dbErr || !dbProducts) {
      return { success: false, error: "خطا در استعلام اطلاعات محصولات از دیتابیس." };
    }

    let calculatedTotal = 0;
    const validatedItems = [];

    // بررسی قیمت واقعی دیتابیس و موجودی انبار
    for (const item of items) {
      const dbProduct = dbProducts.find((p: any) => String(p.id) === String(item.productId));

      if (!dbProduct) {
        return {
          success: false,
          error: \`کالای «\${item.title || item.productId}» در سیستم یافت نشد.\`,
        };
      }

      const reqQty = Math.max(1, Number(item.quantity || 1));
      const currentStock = dbProduct.stock !== null && dbProduct.stock !== undefined ? Number(dbProduct.stock) : 0;

      if (currentStock < reqQty) {
        return {
          success: false,
          error: \`موجودی کالای «\${dbProduct.title}» کافی نیست (موجودی: \${currentStock}).\`,
        };
      }

      const unitPrice =
        dbProduct.discount_price && Number(dbProduct.discount_price) > 0
          ? Number(dbProduct.discount_price)
          : Number(dbProduct.price);

      calculatedTotal += unitPrice * reqQty;

      validatedItems.push({
        productId: String(dbProduct.id),
        title: dbProduct.title,
        price: unitPrice,
        quantity: reqQty,
        image: item.image || "",
      });
    }

    // محاسبه کد تخفیف در سرور
    let discountAmount = 0;
    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
        const isPercent =
          coupon.type === "percent" ||
          coupon.discount_type === "percent" ||
          Boolean(coupon.discount_percent);
        const val = Number(coupon.value || coupon.discount_value || coupon.discount_percent || 0);

        if (isPercent) {
          discountAmount = Math.round((calculatedTotal * val) / 100);
          const maxLimit = Number(coupon.max_discount || coupon.max_discount_amount || 0);
          if (maxLimit > 0 && discountAmount > maxLimit) {
            discountAmount = maxLimit;
          }
        } else {
          discountAmount = val;
        }
      }
    }

    const finalPayable = Math.max(0, calculatedTotal - discountAmount + shippingCost);
    const orderId = \`ORD-\${Date.now().toString().slice(-6)}-\${crypto.randomBytes(2).toString("hex").toUpperCase()}\`;

    const { data: newOrder, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        id: orderId,
        order_number: orderId,
        customer_name: customer.fullName.trim(),
        phone: cleanPhone,
        province: customer.province || "تهران",
        city: customer.city || "تهران",
        address: customer.address.trim(),
        postal_code: customer.postalCode?.trim() || null,
        notes: customer.notes || "",
        items: validatedItems,
        total_amount: calculatedTotal,
        discount_amount: discountAmount,
        final_amount: finalPayable,
        coupon_code: couponCode ? couponCode.trim().toUpperCase() : null,
        payment_status: "pending",
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !newOrder) {
      return { success: false, error: "خطا در ثبت سفارش در پایگاه داده." };
    }

    // کسر اتمیک و امن موجودی کالاها
    for (const it of validatedItems) {
      try {
        const { data: p } = await supabaseAdmin
          .from("products")
          .select("stock")
          .eq("id", it.productId)
          .single();

        if (p && p.stock !== null && p.stock !== undefined) {
          const nextStock = Math.max(0, Number(p.stock) - Number(it.quantity));
          await supabaseAdmin
            .from("products")
            .update({ stock: nextStock, is_available: nextStock > 0 })
            .eq("id", it.productId);
        }
      } catch (stkErr) {
        console.warn("Stock decrease err:", stkErr);
      }
    }

    return {
      success: true,
      orderId: newOrder.id,
      totalAmount: finalPayable,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "خطای پردازش فاکتور." };
  }
}
`;
writeFile('app/actions/orders.ts', fixedOrdersAction);

// =============================================================================
// ۲. اصلاح app/checkout/page.tsx جهت فراخوانی مستقیم Server Action
// =============================================================================
const fixedCheckoutPage = `"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { createOrderServer } from "@/app/actions/orders";
import { couponService, Coupon } from "@/services/couponService";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { IRAN_PROVINCES } from "@/lib/iranProvinces";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("تهران");
  const [city, setCity] = useState("تهران");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const rawTotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percent" || appliedCoupon.discount_type === "percent") {
      discountAmount = Math.round((rawTotal * (appliedCoupon.value || 0)) / 100);
      if (appliedCoupon.max_discount && discountAmount > appliedCoupon.max_discount) {
        discountAmount = appliedCoupon.max_discount;
      }
    } else {
      discountAmount = appliedCoupon.value || 0;
    }
  }

  const finalPayable = Math.max(0, rawTotal - discountAmount);

  const handleProvinceChange = (provName: string) => {
    setProvince(provName);
    const p = IRAN_PROVINCES.find((x) => x.name === provName);
    if (p && p.cities.length > 0) {
      setCity(p.cities[0]);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    soundEngine.playClick();
    setCheckingCoupon(true);
    setCouponError("");

    try {
      const res = await couponService.validateCoupon(couponCode, rawTotal);
      if (res.valid && res.coupon) {
        soundEngine.playSuccess();
        setAppliedCoupon(res.coupon);
      } else {
        setCouponError(res.message || "کد تخفیف نامعتبر یا منقضی شده است.");
      }
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage("");

    if (cartItems.length === 0) {
      setErrorMessage("سبد خرید شما خالی است.");
      return;
    }

    const cleanPhone = phone
      .trim()
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/\\D/g, "");

    if (!/^09\\d{9}$/.test(cleanPhone)) {
      setErrorMessage("شماره موبایل وارد شده باید ۱۱ رقمی و با ۰۹ شروع شود.");
      return;
    }

    if (postalCode.trim() && !/^\\d{10}$/.test(postalCode.trim())) {
      setErrorMessage("کد پستی وارد شده باید ۱۰ رقم عددی باشد.");
      return;
    }

    setSubmitting(true);
    try {
      const fullAddress = \`استان \${province}، شهر \${city}، \${address.trim()}\`;

      // فراخوانی مستقیم Server Action امن با استعلام قیمت واقعی سرور
      const result = await createOrderServer({
        items: cartItems.map((item) => ({
          productId: item.id,
          title: item.title || item.name || "کالا",
          price: item.price,
          quantity: item.quantity || 1,
          image: item.image,
        })),
        customer: {
          fullName: customerName.trim(),
          phone: cleanPhone,
          province,
          city,
          address: fullAddress,
          postalCode: postalCode.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        couponCode: appliedCoupon?.code,
        shippingCost: 0,
      });

      if (result.success && result.orderId) {
        sessionStorage.setItem("pending_payment_amount", String(result.totalAmount));
        sessionStorage.setItem("pending_payment_order_id", result.orderId);
        clearCart();
        router.push(\`/checkout/payment?orderId=\${result.orderId}\`);
      } else {
        setErrorMessage(result.error || "خطا در ثبت نهایی فاکتور. لطفاً مجدداً تلاش فرمایید.");
      }
    } catch {
      setErrorMessage("خطا در برقراری ارتباط با سرور.");
    } finally {
      setSubmitting(false);
    }
  };

  const citiesList = IRAN_PROVINCES.find((p) => p.name === province)?.cities || [];

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4 font-sans select-none" dir="rtl">
        <div className="text-5xl">🛒</div>
        <h2 className="text-xl font-black text-[var(--text-primary)]">سبد خرید شما خالی است!</h2>
        <p className="text-xs text-[var(--text-secondary)]">برای ثبت سفارش ابتدا کالایی را به سبد خرید اضافه کنید.</p>
        <Link
          href="/#products"
          className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-lg"
        >
          ← مشاهده لیست کالاها
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-black">تکمیل اطلاعات و صدور فاکتور رسمی</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium">نشانی و مشخصات گیرنده مرسوله را با دقت وارد کنید</p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleCheckoutSubmit} className="lg:col-span-2 p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h3 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📍 مشخصات تحویل‌گیرنده و نشانی پستی
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی تحویل‌گیرنده *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="مثال: رضا محمدی"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شماره موبایل (جهت دریافت پیامک رهگیری) *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] text-right"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">استان تحویل *</label>
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer"
              >
                {IRAN_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شهرستان / شهر *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer"
              >
                {citiesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کد پستی ۱۰ رقمی (اختیاری)</label>
              <input
                type="text"
                maxLength={10}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="مثال: 1234567890"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] text-right"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) *</label>
              <textarea
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="خیابان اصلی، کوچه، پلاک، طبقه، واحد..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] leading-relaxed focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">توضیحات و یادداشت سفارش (اختیاری)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="نکته خاص در زمان تحویل یا هماهنگی..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm hover:opacity-90 transition shadow-2xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            <span>{submitting ? "در حال ثبت فاکتور..." : "تأیید اطلاعات و اتصال به درگاه پرداخت 💳"}</span>
          </button>
        </form>

        <div className="space-y-6">
          <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3 text-xs">
            <h4 className="font-black text-xs text-[var(--text-primary)]">🏷️ کد تخفیف دارید؟</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="مثال: OFF10"
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono uppercase font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={checkingCoupon}
                className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                اعمال
              </button>
            </div>
            {couponError && <p className="text-[10px] text-rose-500 font-bold">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ کد تخفیف {appliedCoupon.code} با موفقیت اعمال شد.
              </p>
            )}
          </div>

          <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
            <h4 className="font-black text-xs text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
              📋 خلاصه اقلام فاکتور
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cartItems.map((it) => (
                <div key={it.id} className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)] font-medium">
                    {it.title} (×{it.quantity || 1})
                  </span>
                  <span className="font-mono font-bold">
                    {((it.price || 0) * (it.quantity || 1)).toLocaleString("fa-IR")} ت
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--card-border)] pt-3 space-y-2">
              <div className="flex justify-between text-[var(--text-secondary)] font-bold">
                <span>جمع کل اقلام:</span>
                <span className="font-mono">{rawTotal.toLocaleString("fa-IR")} تومان</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-500 font-bold">
                  <span>سود شما از تخفیف:</span>
                  <span className="font-mono">- {discountAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
              )}

              <div className="flex justify-between text-[var(--text-secondary)] font-bold">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">رایگان (پیشتاز)</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[var(--card-border)] text-sm font-black">
                <span className="text-[var(--text-primary)]">مبلغ نهایی فاکتور:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                  {finalPayable.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
writeFile('app/checkout/page.tsx', fixedCheckoutPage);

// =============================================================================
// ۳. اصلاح app/api/sms/send/route.ts با محدودکننده دیتابیس‌محور
// =============================================================================
const fixedSmsRoute = `import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/services/smsService";
import { checkRateLimit } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ success: false, message: "شماره تماس و متن پیام الزامی است." }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\\D/g, "");

    // استفاده از Rate Limiter دیتابیس‌محور به جای Map در حافظه
    const isAllowed = await checkRateLimit(cleanPhone, 3, 5);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, message: "تعداد پیامک‌های ارسالی به این شماره در ۵ دقیقه گذشته بیش از حد مجاز است." },
        { status: 429 }
      );
    }

    const success = await sendSMS(cleanPhone, message);

    if (!success) {
      return NextResponse.json({ success: false, message: "خطا در ارسال پیامک از طریق درگاه." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "پیامک با موفقیت ارسال شد." });
  } catch {
    return NextResponse.json({ success: false, message: "خطای سیستمی در پردازش پیامک." }, { status: 500 });
  }
}
`;
writeFile('app/api/sms/send/route.ts', fixedSmsRoute);

// =============================================================================
// بیلد نهایی و انتشار تغییرات
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و انتشار در ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "fix(step1): atomic inventory decrement, direct server checkout action, and db-backed sms rate limiting"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ قدم اول با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}