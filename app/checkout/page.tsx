"use client";
import SecurityCaptchaBox from "@/components/SecurityCaptchaBox";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";
import { IRAN_PROVINCES_CITIES } from "@/lib/iranProvinces";
import { supabase } from "@/lib/supabase";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, totalPrice, finalPayable } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("فارس");
  const [city, setCity] = useState("شیراز");
  const [address, setAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"post" | "tipax" | null>(null);

  const [finRules, setFinRules] = useState({ post: 120000, tipax: 150000, vat: 10 });
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(data => {
      const s = data.settings || {};
      setFinRules({ post: Number(s.postShippingCost || 120000), tipax: Number(s.tipaxShippingCost || 150000), vat: Number(s.vatPercent || 10) });
    }).catch(()=>{});
  }, []);

  let shippingCost = 0;
  if (shippingMethod === "post") shippingCost = finRules.post;
  else if (shippingMethod === "tipax") shippingCost = finRules.tipax;

  const vatAmount = finalPayable > 0 ? Math.round((finalPayable * finRules.vat) / 100) : 0;
  const grandTotal = Math.max(0, finalPayable + vatAmount + shippingCost);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault(); soundEngine.playClick(); setErrorMsg(null);
    if (!shippingMethod) return setErrorMsg("لطفاً نوع روش ارسال (پست پیشتاز یا تیپاکس) را انتخاب نمایید.");
    if (!captchaVerified) return setErrorMsg("لطفاً کپچا را تایید کنید.");
    if (cartItems.length === 0) return;
    router.push(`/checkout/payment?amount=${grandTotal}&phone=${phone}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-sans text-[var(--text-primary)] space-y-6" dir="rtl">
      <h1 className="text-xl font-black text-[var(--accent-blue)]">🛡️ تکمیل سفارش</h1>
      {errorMsg && <div className="p-4 bg-rose-500/15 text-rose-500 rounded-2xl font-bold text-xs">{errorMsg}</div>}
      
      <form onSubmit={handleCheckout} className="space-y-6">
        <div className="p-5 bg-[var(--modal-bg)] rounded-3xl border shadow-xl space-y-4 text-xs">
          <h2 className="font-black text-sm">۱. مشخصات و نشانی</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" required placeholder="نام کامل" value={fullName} onChange={e=>setFullName(e.target.value)} className="p-3 rounded-2xl border bg-[var(--input-bg)] outline-none" />
            <input type="tel" required placeholder="موبایل" value={phone} onChange={e=>setPhone(e.target.value)} className="p-3 rounded-2xl border bg-[var(--input-bg)] outline-none font-mono text-center" />
            <select value={province} onChange={e=>{setProvince(e.target.value); setCity(IRAN_PROVINCES_CITIES[e.target.value][0])}} className="p-3 rounded-2xl border bg-[var(--input-bg)] outline-none">
              {Object.keys(IRAN_PROVINCES_CITIES).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={city} onChange={e=>setCity(e.target.value)} className="p-3 rounded-2xl border bg-[var(--input-bg)] outline-none">
              {(IRAN_PROVINCES_CITIES[province] || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea required rows={2} placeholder="آدرس دقیق..." value={address} onChange={e=>setAddress(e.target.value)} className="sm:col-span-2 p-3 rounded-2xl border bg-[var(--input-bg)] outline-none" />
          </div>
        </div>

        <div className="p-5 bg-[var(--modal-bg)] rounded-3xl border shadow-xl space-y-4 text-xs">
          <h2 className="font-black text-sm">۲. انتخاب روش ارسال (اجباری)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={"p-4 rounded-2xl border-2 cursor-pointer transition flex gap-3 " + (shippingMethod === "post" ? "border-emerald-500 bg-emerald-500/10" : "bg-[var(--input-bg)]")}>
              <input type="radio" name="ship" checked={shippingMethod==="post"} onChange={()=>{setShippingMethod("post"); soundEngine.playClick();}} className="w-4 h-4 accent-emerald-500" />
              <div><div className="font-black">پست پیشتاز</div><div className="text-emerald-500 font-mono mt-1">{formatPrice(finRules.post)} تومان</div></div>
            </label>
            <label className={"p-4 rounded-2xl border-2 cursor-pointer transition flex gap-3 " + (shippingMethod === "tipax" ? "border-amber-500 bg-amber-500/10" : "bg-[var(--input-bg)]")}>
              <input type="radio" name="ship" checked={shippingMethod==="tipax"} onChange={()=>{setShippingMethod("tipax"); soundEngine.playClick();}} className="w-4 h-4 accent-amber-500" />
              <div><div className="font-black">تیپاکس (پس‌کرایه)</div><div className="text-amber-500 font-mono mt-1">{formatPrice(finRules.tipax)} تومان</div></div>
            </label>
          </div>
        </div>

        <div className="p-5 bg-[var(--modal-bg)] rounded-3xl border shadow-xl space-y-4 text-xs">
          <h2 className="font-black text-sm">۳. صورتحساب</h2>
          <div className="flex justify-between"><span>اقلام:</span><span className="font-mono">{formatPrice(totalPrice)} تومان</span></div>
          <div className="flex justify-between text-emerald-500"><span>ارسال:</span><span className="font-mono">{shippingCost === 0 && !shippingMethod ? "---" : formatPrice(shippingCost) + " ت"}</span></div>
          <div className="flex justify-between text-amber-500"><span>مالیات ({finRules.vat}%):</span><span className="font-mono">+{formatPrice(vatAmount)} ت</span></div>
          <div className="flex justify-between border-t pt-3 font-black text-sm text-[var(--accent-blue)]"><span>نهایی:</span><span className="font-mono">{formatPrice(grandTotal)} تومان</span></div>
          
          <SecurityCaptchaBox onVerifyChange={setCaptchaVerified} />
          <button type="submit" disabled={!captchaVerified} className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black shadow-lg cursor-pointer">پرداخت و ثبت نهایی</button>
        </div>
      </form>
    </div>
  );
}
