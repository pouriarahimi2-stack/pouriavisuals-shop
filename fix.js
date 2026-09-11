/**
 * AXON CORE - Phase 8: Advanced Order Tracking System & Realtime Status (fix.js)
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

console.log("\x1b[36m[AXON-PHASE8]\x1b[0m پیاده‌سازی سامانه پیشرفته رهگیری لحظه‌ای مرسولات...");

// =============================================================================
// بازنویسی کامل app/track-order/page.tsx
// =============================================================================
const trackOrderPageCode = `"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";

  const [query, setQuery] = useState(initialOrderId);
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTrack = async (searchTarget?: string) => {
    const target = (searchTarget !== undefined ? searchTarget : query).trim();
    if (!target) return;

    soundEngine.playClick();
    setLoading(true);
    setErrorMessage(null);
    setOrderResult(null);

    try {
      // جستجو در API فاکتورها
      const res = await fetch(\`/api/orders/track?q=\${encodeURIComponent(target)}\`, { cache: "no-store" });
      const json = await res.json();

      if (json.success && json.order) {
        soundEngine.playSuccess();
        setOrderResult(json.order);
      } else {
        // جستجو در حافظه محلی لوکال به عنوان فال‌بک
        const localKeys = Object.keys(localStorage);
        let foundLocal = null;
        for (const k of localKeys) {
          if (k.startsWith("fallback_order_") || k.includes("order")) {
            try {
              const val = JSON.parse(localStorage.getItem(k) || "{}");
              if (String(val.id || "").includes(target) || String(val.phone || "").includes(target)) {
                foundLocal = val;
                break;
              }
            } catch {}
          }
        }

        if (foundLocal) {
          soundEngine.playSuccess();
          setOrderResult(foundLocal);
        } else {
          setErrorMessage("سفارشی با این مشخصات یا کد رهگیری در سیستم یافت نشد.");
        }
      }
    } catch {
      setErrorMessage("خطا در برقراری ارتباط با سرور رهگیری.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      setQuery(initialOrderId);
      handleTrack(initialOrderId);
    }
  }, [initialOrderId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      
      <div className="text-center space-y-3">
        <span className="p-3.5 rounded-2xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] inline-block text-2xl shadow-sm">
          📦
        </span>
        <h1 className="text-2xl md:text-3xl font-black">سامانه رهگیری لحظه‌ای مرسولات پستی و فاکتورها</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-lg mx-auto leading-relaxed">
          شماره سفارش، شماره موبایل یا کد رهگیری ۲۴ رقمی پست پیشتاز خود را جهت بررسی وضعیت ارسال وارد کنید
        </p>
      </div>

      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثال: AX-589201 یا 09123456789 یا کد پستی..."
            className="flex-1 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs text-[var(--text-primary)] focus:border-[var(--accent-blue)] shadow-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl cursor-pointer disabled:opacity-50 shrink-0"
          >
            {loading ? "در حال جستجو..." : "استعلام وضعیت بسته 🔍"}
          </button>
        </form>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold text-center animate-fadeIn">
            ⚠️ {errorMessage}
          </div>
        )}

        {orderResult && (
          <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-6 animate-fadeIn text-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
              <div>
                <span className="text-[var(--text-secondary)] font-bold block">شناسه فاکتور:</span>
                <span className="font-mono font-black text-sm text-[var(--accent-blue)]">{orderResult.id || orderResult.order_number}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] font-bold block">وضعیت سفارش:</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-[11px] border border-emerald-500/30">
                  {orderResult.status === "shipped" ? "ارسال شده به پست 🚚" : orderResult.status === "paid" ? "پرداخت شده (آماده‌سازی استودیویی) ✓" : "در انتظار پردازش"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[var(--text-secondary)] font-bold">نام خریدار:</span>
                <p className="font-black text-[var(--text-primary)]">{orderResult.customer_name || orderResult.customer?.fullName || "مشتری گرامی"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--text-secondary)] font-bold">شماره تماس:</span>
                <p className="font-mono font-bold text-[var(--text-primary)]">{orderResult.phone || orderResult.customer?.phone}</p>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <span className="text-[var(--text-secondary)] font-bold">نشانی تحویل مرسوله:</span>
                <p className="font-medium text-[var(--text-primary)] leading-relaxed">{orderResult.address || orderResult.customer?.address}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
              <span className="font-bold text-[var(--text-secondary)] block">کد رهگیری پست پیشتاز:</span>
              <p className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                {orderResult.tracking_code || orderResult.trackingCode || "بارنامه شما پس از تحویل به پست در این بخش درج خواهد شد."}
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end border-t border-[var(--card-border)]">
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition"
          >
            ← بازگشت به صفحه نخست
          </Link>
        </div>
      </div>
    </div>
  );
}
`;
writeFile('app/track-order/page.tsx', trackOrderPageCode);

// =============================================================================
// بیلد نهایی پروژه و انتشار در Vercel
// =============================================================================
console.log("تست بیلد کامل (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(tracking): upgrade order tracking page with robust database and local fallback search"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ سامانه رهگیری سفارشات با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}