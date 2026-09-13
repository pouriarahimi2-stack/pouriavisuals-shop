/**
 * AXON CORE - Order Tracking Feature & Secure Lookup Route (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

function writeFile(relPath, content) {
  const fullPath = path.join(ROOT, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ایجاد/اصلاح شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[35m[ORDER-TRACKING]\x1b[0m ایجاد سامانه پیگیری وضعیت سفارش برای خریداران...");

// =============================================================================
// ۱. ساخت اندپوینت استعلام رهگیری (app/api/orders/track/route.ts)
// =============================================================================
const trackApiCode = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId, phone } = await req.json();

    if (!orderId || !phone) {
      return NextResponse.json(
        { success: false, message: "شناسه سفارش و شماره موبایل الزامی است." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim().replace("+98", "0");
    const cleanId = String(orderId).trim();

    // جستجوی سفارش بر اساس تطبیق دوگانه (شناسه و شماره موبایل)
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, total_amount, discount_amount, final_amount, created_at, items, customer_name")
      .eq("id", cleanId)
      .eq("customer_phone", cleanPhone)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { success: false, message: "سفارشی با این مشخصات یافت نشد." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در استعلام وضعیت سفارش." },
      { status: 500 }
    );
  }
}
`;
writeFile('app/api/orders/track/route.ts', trackApiCode);

// =============================================================================
// ۲. ساخت صفحه پیگیری سفارش (app/track-order/page.tsx)
// =============================================================================
const trackPageCode = `"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface TrackedOrder {
  id: string;
  status: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  created_at: string;
  customer_name: string;
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

const STEPS = [
  { key: "pending_manual_review", title: "بررسی پرداخت", desc: "در انتظار تایید فیش واریزی" },
  { key: "paid", title: "پرداخت تایید شد", desc: "سفارش آماده‌سازی در انبار" },
  { key: "shipped", title: "ارسال شد", desc: "تحویل به مامور ارسال یا تیپاکس" },
  { key: "delivered", title: "تحویل داده شد", desc: "سفارش با موفقیت تحویل شد" },
];

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMsg(null);
    setOrder(null);
    setLoading(true);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phone }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setOrder(json.order);
      } else {
        setErrorMsg(json.message || "سفارش مورد نظر یافت نشد.");
      }
    } catch {
      setErrorMsg("خطا در برقراری ارتباط با سامانه رهگیری.");
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    if (status === "cancelled") return -1;
    if (status === "pending" || status === "pending_manual_review") return 0;
    if (status === "paid" || status === "processing") return 1;
    if (status === "shipped") return 2;
    if (status === "delivered") return 3;
    return 0;
  };

  const activeStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-screen py-16 px-4 max-w-3xl mx-auto space-y-8 font-sans" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-[var(--text-primary)]">📦 پیگیری وضعیت سفارش</h1>
        <p className="text-xs text-[var(--text-secondary)]">
          جهت استعلام آخرین وضعیت ارسال، شماره تماس و کد پیگیری سفارش خود را وارد کنید.
        </p>
      </div>

      <form
        onSubmit={handleTrack}
        className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">کد پیگیری سفارش:</label>
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="مثال: 550e8400-e29b-..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">شماره تماس خریدار:</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09123456789"
              className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md cursor-pointer disabled:opacity-50"
        >
          {loading ? "در حال استعلام اطلاعات..." : "رهگیری آنلاین سفارش 🔍"}
        </button>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}
      </form>

      {order && (
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--card-border)] pb-4">
            <div>
              <span className="text-xs text-[var(--text-secondary)]">سفارش بنام:</span>
              <span className="font-black text-sm text-[var(--text-primary)] mr-2">{order.customer_name}</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              ثبت: {new Date(order.created_at).toLocaleDateString("fa-IR")}
            </span>
          </div>

          {/* نوار وضعیت چندمرحله‌ای (Stepper) */}
          {order.status === "cancelled" ? (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 font-bold text-xs text-center">
              ⚠️ این سفارش لغو شده است.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STEPS.map((step, idx) => {
                const isPassed = idx <= activeStep;
                const isCurrent = idx === activeStep;
                return (
                  <div
                    key={step.key}
                    className={\`p-3 rounded-2xl border text-center transition \${
                      isCurrent
                        ? "bg-[var(--accent-blue)]/15 border-[var(--accent-blue)] text-[var(--accent-blue)]"
                        : isPassed
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] text-slate-500"
                    }\`}
                  >
                    <span className="text-xs font-black block">{step.title}</span>
                    <span className="text-[10px] mt-1 block opacity-80">{step.desc}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* اقلام فاکتور */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] block">اقلام سفارش:</span>
            <div className="space-y-2">
              {Array.isArray(order.items) &&
                order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs"
                  >
                    <span className="font-bold text-[var(--text-primary)]">
                      {item.title} × {item.quantity}
                    </span>
                    <span className="font-mono text-slate-400">
                      {Number(item.total_price || item.unit_price * item.quantity).toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* مجموع مبالغ */}
          <div className="border-t border-[var(--card-border)] pt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">مبلغ نهایی فاکتور:</span>
            <span className="text-sm font-black text-emerald-500 font-mono">
              {Number(order.final_amount || order.total_amount).toLocaleString("fa-IR")} تومان
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
`;
writeFile('app/track-order/page.tsx', trackPageCode);

// =============================================================================
// ۳. کامپایل بیلد و پوش به گیت‌هاب
// =============================================================================
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "feat(orders): implement public order tracking endpoint and interactive stepper page"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ سامانه پیگیری سفارشات با موفقیت روی سرور ورسل مستقر گردید!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}