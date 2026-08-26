// components/CartDrawer.tsx
"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { orderService } from "@/services/orderService";
import { couponService } from "@/services/couponService";
import { IRAN_PROVINCES } from "@/lib/iranProvinces";
import { useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CartDrawer({ isOpen: propIsOpen, onClose: propOnClose }: CartDrawerProps = {}) {
  const router = useRouter();
  const cartContext = useCart();
  const cartItems = cartContext?.cartItems || [];
  const isCartOpen = propIsOpen !== undefined ? propIsOpen : (cartContext?.isCartOpen || false);
  const setIsCartOpen = propOnClose || cartContext?.setIsCartOpen || (() => {});
  const removeFromCart = cartContext?.removeFromCart || (() => {});
  const updateQuantity = cartContext?.updateQuantity || (() => {});
  const clearCart = cartContext?.clearCart || (() => {});
  const totalPrice = cartContext?.totalPrice || 0;

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("فارس");
  const [selectedCity, setSelectedCity] = useState("شیراز");
  const [streetAddress, setStreetAddress] = useState("");
  const [buildingNo, setBuildingNo] = useState("");
  const [unitNo, setUnitNo] = useState("");
  const [floorNo, setFloorNo] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalItemUnits = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleProvinceChange = (provName: string) => {
    setSelectedProvince(provName);
    const prov = IRAN_PROVINCES.find((p) => p.name === provName);
    if (prov && prov.cities.length > 0) {
      setSelectedCity(prov.cities[0]);
    }
  };

  if (!isCartOpen) return null;

  const handleIncreaseQuantity = (item: any) => {
    const currentStock = item.stock !== undefined && item.stock !== null ? Number(item.stock) : 999;
    if (item.quantity >= currentStock) {
      alert(`⚠️ حداکثر موجودی قابل سفارش برای این کالا ${currentStock} عدد می‌باشد.`);
      return;
    }
    soundEngine.playClick();
    updateQuantity(item.id, 1);
  };

  const handleDecreaseQuantity = (item: any) => {
    soundEngine.playClick();
    updateQuantity(item.id, -1);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponMsg(null);
    soundEngine.playClick();

    try {
      const res = await couponService.validateCoupon(couponCode, totalPrice);
      if (res.valid) {
        soundEngine.playSuccess();
        setDiscountAmount(res.discount);
        setAppliedCoupon(couponCode.trim().toUpperCase());
        setCouponMsg({ type: "success", text: res.message });
      } else {
        setCouponMsg({ type: "error", text: res.message });
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } catch {
      setCouponMsg({ type: "error", text: "خطا در بررسی کد تخفیف." });
    }
  };

  const finalPayable = Math.max(0, totalPrice - discountAmount);

  // ثبت آنی سفارش و انتقال مستقیم به درگاه پرداخت بدون فرم تکراری
  const handleFinalCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!customerName.trim()) {
      setValidationError("لطفاً نام و نام خانوادگی خود را وارد نمایید.");
      return;
    }

    const cleanPhone = phone
      .trim()
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/\D/g, "");

    if (!/^09\d{9}$/.test(cleanPhone)) {
      setValidationError("شماره موبایل وارد شده باید ۱۱ رقم و با 09 شروع شود.");
      return;
    }

    if (!streetAddress.trim()) {
      setValidationError("لطفاً نشانی دقیق خیابان و کوچه را وارد نمایید.");
      return;
    }

    if (!buildingNo.trim()) {
      setValidationError("لطفاً پلاک ساختمان را وارد نمایید.");
      return;
    }

    if (cartItems.length === 0) return;

    const fullConstructedAddress = `استان ${selectedProvince}، شهر ${selectedCity}، ${streetAddress.trim()}، پلاک ${buildingNo.trim()}${
      unitNo.trim() ? `، واحد ${unitNo.trim()}` : ""
    }${floorNo.trim() ? `، طبقه ${floorNo.trim()}` : ""}`;

    setSubmitting(true);
    soundEngine.playClick();

    try {
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const orderPayload = {
        id: orderId,
        order_number: orderId,
        customer_name: customerName.trim(),
        phone: cleanPhone,
        province: selectedProvince,
        city: selectedCity,
        address: fullConstructedAddress,
        postal_code: postalCode.trim() || null,
        items: cartItems.map((item) => ({
          productId: item.id,
          product_id: item.id,
          title: item.title || item.name || "کالا",
          name: item.name || item.title || "کالا",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: item.image || item.images?.[0] || "",
        })),
        total_amount: totalPrice,
        discount_amount: discountAmount,
        final_amount: finalPayable,
        coupon_code: appliedCoupon || null,
        status: "pending" as const,
        payment_status: "pending" as const,
      };

      const newOrder = await orderService.create(orderPayload);

      if (newOrder) {
        if (typeof setIsCartOpen === "function") setIsCartOpen(false);
        // انتقال مستقیم به صفحه شبیه‌ساز پرداخت
        router.push(`/checkout/payment?orderId=${newOrder.orderNumber || newOrder.id}`);
      } else {
        throw new Error("خطا در ایجاد فاکتور در سرور.");
      }
    } catch (err: any) {
      setValidationError(err?.message || "خطا در اتصال به سرور.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentCities = IRAN_PROVINCES.find((p) => p.name === selectedProvince)?.cities || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md font-sans select-none animate-fadeIn" dir="rtl">
      <div className="w-full max-w-lg bg-[var(--modal-bg)] border-r border-[var(--card-border)] h-full shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)]">
        
        {/* هدر کشو */}
        <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between">
          <button
            onClick={() => {
              if (typeof setIsCartOpen === "function") setIsCartOpen(false);
            }}
            className="w-9 h-9 rounded-2xl bg-[var(--input-bg)] flex items-center justify-center font-bold text-xs hover:border-[var(--accent-blue)] border border-[var(--card-border)] transition cursor-pointer text-[var(--text-primary)]"
          >
            ✕
          </button>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-[var(--text-primary)]">سبد خرید شما</span>
            <span className="text-[var(--accent-blue)] font-black text-xs font-mono">
              {totalItemUnits} قلم
            </span>
            <span className="text-lg">🛒</span>
          </div>
        </div>

        {/* لیست محصولات و فرم دریافت اطلاعات */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {cartItems.length === 0 ? (
            <div className="py-28 text-center text-[var(--text-secondary)] space-y-2 font-bold">
              <span className="text-4xl block">🛍️</span>
              <p>سبد خرید شما در حال حاضر خالی است.</p>
            </div>
          ) : (
            <>
              {/* لیست کالاها */}
              <div className="space-y-3">
                {cartItems.map((item: any) => {
                  const stockLimit = item.stock !== undefined && item.stock !== null ? Number(item.stock) : 999;
                  const isMaxReached = item.quantity >= stockLimit;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            removeFromCart(item.id);
                          }}
                          className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition cursor-pointer"
                          title="حذف کالا"
                        >
                          🗑️
                        </button>

                        <div className="flex items-center gap-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-2xl px-2.5 py-1 font-bold">
                          <button
                            onClick={() => handleDecreaseQuantity(item)}
                            className="hover:text-[var(--accent-blue)] cursor-pointer px-1 font-bold text-sm"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-xs px-1 text-[var(--text-primary)]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncreaseQuantity(item)}
                            disabled={isMaxReached}
                            className={`px-1 font-bold text-sm transition ${
                              isMaxReached ? "opacity-30 cursor-not-allowed text-gray-400" : "hover:text-[var(--accent-blue)] cursor-pointer"
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-left">
                        <div>
                          <h4 className="font-black text-xs text-[var(--text-primary)] line-clamp-1 text-right" dir="rtl">
                            {item.title || item.name}
                          </h4>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black block mt-0.5 text-right" dir="rtl">
                            {Number(item.discountPrice ?? item.price ?? 0).toLocaleString("fa-IR")} تومان
                          </span>
                        </div>

                        {(item.image || item.images?.[0]) && (
                          <img
                            src={item.image || item.images?.[0]}
                            alt=""
                            className="w-12 h-12 rounded-xl object-contain bg-[var(--modal-bg)] border border-[var(--card-border)] p-1 shrink-0"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* باکس کد تخفیف */}
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <span className="font-bold text-[11px] text-[var(--text-secondary)] block">کد تخفیف دارید؟</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition cursor-pointer shadow-md"
                  >
                    اعمال
                  </button>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="مثال: OFF10"
                    className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-xs outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)] uppercase"
                  />
                </div>
                {couponMsg && (
                  <p className={`text-[10px] font-bold ${couponMsg.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* فرم مشخصات دریافت‌کننده و نشانی پستی */}
              <form id="cart-checkout-form" onSubmit={handleFinalCheckout} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-2.5">
                  <span>📋</span>
                  <span>مشخصات تحویل‌گیرنده و نشانی پستی:</span>
                </div>

                {validationError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] leading-relaxed">
                    ⚠️ {validationError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">نام و نام خانوادگی تحویل‌گیرنده *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: پوریا رحیمی"
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">شماره موبایل جهت پیامک رهگیری *</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] text-right text-[var(--text-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">استان *</label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)] cursor-pointer"
                    >
                      {IRAN_PROVINCES.map((prov) => (
                        <option key={prov.name} value={prov.name}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">شهرستان / شهر *</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)] cursor-pointer"
                    >
                      {currentCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">خیابان و کوچه (نشانی دقیق) *</label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="مثال: خیابان ولیعصر، تقاطع میرداماد"
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-medium text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">پلاک *</label>
                    <input
                      type="text"
                      required
                      value={buildingNo}
                      onChange={(e) => setBuildingNo(e.target.value)}
                      placeholder="مثال: ۲۴"
                      className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">واحد (اختیاری)</label>
                    <input
                      type="text"
                      value={unitNo}
                      onChange={(e) => setUnitNo(e.target.value)}
                      placeholder="مثال: ۳"
                      className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">طبقه (اختیاری)</label>
                    <input
                      type="text"
                      value={floorNo}
                      onChange={(e) => setFloorNo(e.target.value)}
                      placeholder="مثال: ۲"
                      className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">کد پستی ۱۰ رقمی (اختیاری اما توصیه می‌شود)</label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={10}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="7138152316"
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] text-right text-[var(--text-primary)]"
                  />
                </div>
              </form>
            </>
          )}
        </div>

        {/* فوتر سبد و دکمه اتصال مستقیم به درگاه پرداخت */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[var(--card-border)] bg-[var(--modal-bg)] space-y-3 text-xs">
            <div className="space-y-1.5 font-bold">
              <div className="flex justify-between items-center text-[var(--text-secondary)]">
                <span>جمع کل اقلام:</span>
                <span className="font-mono text-sm text-[var(--text-primary)]">
                  {totalPrice.toLocaleString("fa-IR")} تومان
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-rose-500 font-black">
                  <span>تخفیف اعمال‌شده:</span>
                  <span className="font-mono">- {discountAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-[var(--card-border)]">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                  {finalPayable.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>

            <button
              form="cart-checkout-form"
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 active:scale-[0.99] transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>💳</span>
              <span>{submitting ? "در حال ثبت سفارش و انتقال به درگاه..." : "تأیید نهایی و انتقال به درگاه پرداخت شاپرک"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}