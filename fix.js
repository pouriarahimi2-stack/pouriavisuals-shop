/**
 * AXON CORE - Privacy Masking & Admin Security Hardening (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(msg) {
  console.log(`\x1b[36m[AXON-CORE]\x1b[0m ${msg}`);
}

function success(msg) {
  console.log(`\x1b[32m✔ ${msg}\x1b[0m`);
}

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  success(`اصلاح شد: ${relPath}`);
}

log("شروع ماسک‌کردن شماره تماس خریداران و تقویت امنیت حریم خصوصی...");

// =============================================================================
// ۱. اصلاح app/track-order/page.tsx: ماسک‌کردن شماره موبایل و نام کامل برای حفظ حریم خصوصی
// =============================================================================
const trackOrderPageContent = `"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Order, orderService } from "@/services/orderService";
import { soundEngine } from "@/lib/soundEngine";

function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 11) return phone || "---";
  const clean = phone.replace(/\\D/g, "");
  if (clean.length === 11) {
    return clean.slice(0, 4) + "***" + clean.slice(7);
  }
  return phone.slice(0, 3) + "***" + phone.slice(-4);
}

function maskName(name: string): string {
  if (!name) return "خریدار گرامی";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return parts[0] + " " + parts[1].charAt(0) + "***";
  }
  return name.charAt(0) + "***";
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";
  const isSuccessRedirect = searchParams.get("success") === "true";

  const [searchQuery, setSearchQuery] = useState(initialOrderId);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchOrders = async (queryText: string) => {
    if (!queryText.trim()) return;

    soundEngine.playClick();
    setLoading(true);
    setErrorMessage(null);

    try {
      const results = await orderService.trackOrder(queryText.trim());

      if (results && results.length > 0) {
        setOrders(results);
      } else {
        setErrorMessage("فاکتوری با این مشخصات در پایگاه داده یافت نشد.");
        setOrders([]);
      }
    } catch {
      setErrorMessage("خطا در برقراری ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      setSearchQuery(initialOrderId);
      fetchOrders(initialOrderId);
    }
  }, [initialOrderId]);

  useEffect(() => {
    const handleOrdersUpdate = () => {
      if (searchQuery.trim()) {
        orderService.trackOrder(searchQuery.trim()).then((res) => {
          if (res && res.length > 0) setOrders(res);
        });
      }
    };

    window.addEventListener("orders_updated", handleOrdersUpdate);
    return () => {
      window.removeEventListener("orders_updated", handleOrdersUpdate);
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(searchQuery);
  };

  const copyToClipboard = (text: string) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const trackingSteps = [
    { key: "pending", title: "ثبت فاکتور", desc: "سفارش در انتظار تایید", icon: "📄" },
    { key: "paid", title: "پرداخت موفق", desc: "تاییدیه پرداخت شاپرک", icon: "💳" },
    { key: "processing", title: "بسته‌بندی استودیویی", desc: "تست سلامت و پک ضدضربه", icon: "📦" },
    { key: "shipped", title: "تحویل به شرکت پست", desc: "صدور بارنامه پیشتاز ۲۴ رقمی", icon: "🚚" },
    { key: "delivered", title: "تحویل به مشتری", desc: "پایان چرخه سفارش", icon: "✅" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending": return 0;
      case "paid": return 1;
      case "processing": return 2;
      case "shipped": return 3;
      case "delivered": return 4;
      default: return 1;
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 max-w-4xl mx-auto space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {isSuccessRedirect && (
        <div className="p-6 rounded-[2.5rem] bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-4 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <span className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl font-black shadow-lg">
              ✓
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                پرداخت و ثبت سفارش شما با موفقیت تایید شد!
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                فاکتور رسمی صادر گردید و کد رهگیری پستی به زودی پیامک خواهد شد.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-emerald-500 transition"
          >
            صفحه اصلی
          </Link>
        </div>
      )}

      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 flex items-center justify-center text-2xl text-[var(--accent-blue)] shadow-lg">
          🔍
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">رهگیری بلادرنگ مرسولات و استعلام فاکتور</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-md mx-auto">
          شماره فاکتور یا تلفن همراه را وارد نمایید تا آخرین وضعیت ارسال به صورت زنده استعلام شود
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="مثال: ORD-419556 یا 09123456789"
          className="flex-1 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)] shadow-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>{loading ? "در حال استعلام..." : "استعلام وضعیت فاکتور 🚀"}</span>
        </button>
      </form>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold text-center animate-fadeIn">
          {errorMessage}
        </div>
      )}

      <div className="space-y-6">
        {orders.map((order) => {
          const currentStep = getStepIndex(order.status);
          const trackCode = order.trackingCode || order.tracking_code;
          const rawPhone = order.customer?.phone || order.phone || "";
          const rawName = order.customer?.fullName || order.customerName || "";

          return (
            <div
              key={order.id}
              className="p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-8 animate-fadeIn"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[var(--text-primary)]">شماره فاکتور:</span>
                    <span className="font-mono font-black text-base text-[var(--accent-blue)]">
                      {order.orderNumber || order.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                    تاریخ ثبت: {new Date(order.created_at || Date.now()).toLocaleDateString("fa-IR")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 font-black text-xs">
                    {order.status === "shipped" ? "تحویل به پست 🚚" : order.status === "delivered" ? "تحویل داده شده ✓" : "در حال آماده‌سازی 📦"}
                  </span>
                </div>
              </div>

              <div className="py-2">
                <div className="grid grid-cols-5 gap-2 text-center relative">
                  {trackingSteps.map((step, idx) => {
                    const isPassed = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div key={step.key} className="space-y-2 flex flex-col items-center relative z-10">
                        <div
                          className={"w-10 h-10 rounded-2xl flex items-center justify-center text-base transition-all duration-500 border " + (
                            isCurrent
                              ? "bg-[var(--accent-blue)] border-white text-white shadow-xl shadow-blue-500/40 scale-110 ring-4 ring-blue-500/20"
                              : isPassed
                              ? "bg-emerald-500 border-emerald-400 text-white shadow-md"
                              : "bg-[var(--input-bg)] border-[var(--card-border)] text-slate-500"
                          )}
                        >
                          {step.icon}
                        </div>
                        <div>
                          <span className={"block font-extrabold text-[11px] " + (isPassed ? "text-[var(--text-primary)]" : "text-slate-500")}>
                            {step.title}
                          </span>
                          <span className="text-[9px] text-[var(--text-secondary)] hidden sm:block mt-0.5">
                            {step.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {trackCode ? (
                <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📮</span>
                      <span className="font-extrabold text-xs text-[var(--text-primary)]">شماره بارنامه پست پیشتاز:</span>
                      <span className="font-mono font-black text-sm text-[var(--accent-blue)] tracking-wider">
                        {trackCode}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] font-medium pr-7">
                      مرسوله شما با بیمه کامل استودیویی تحویل شرکت ملی پست گردیده است.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => copyToClipboard(trackCode)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold transition cursor-pointer"
                    >
                      {copiedCode === trackCode ? "✓ کپی شد" : "کپی بارکد"}
                    </button>
                    <a
                      href={"https://tracking.post.ir/?id=" + trackCode}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] hover:opacity-90 text-white text-xs font-black transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>سامانه رهگیری پست</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-secondary)] font-medium flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>کد رهگیری ۲۴ رقمی پس از تحویل مرسوله به شرکت پست، پیامک و در اینجا نمایش داده خواهد شد.</span>
                </div>
              )}

              {/* مشخصات گیرنده با ماسک امنیتی */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                  <span className="font-bold text-[var(--text-secondary)] block">👤 تحویل‌گیرنده:</span>
                  <p className="font-black text-[var(--text-primary)]">{maskName(rawName)}</p>
                  <p className="font-mono text-[var(--text-secondary)] font-bold">{maskPhoneNumber(rawPhone)}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                  <span className="font-bold text-[var(--text-secondary)] block">📍 محدوده ارسال:</span>
                  <p className="font-medium text-[var(--text-primary)] leading-relaxed">
                    {order.customer?.province ? "استان " + order.customer.province + "، شهرستان " + (order.customer.city || "") : "نشانی ثبت‌شده در سیستم"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-extrabold text-xs text-[var(--text-secondary)] block">📦 اقلام خریداری شده:</span>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="w-11 h-11 rounded-xl object-contain bg-[var(--modal-bg)] border border-[var(--card-border)] p-1 shrink-0"
                          />
                        )}
                        <div>
                          <h4 className="font-black text-[var(--text-primary)]">{item.title || item.name}</h4>
                          <span className="text-[10px] text-[var(--text-secondary)] font-medium">تعداد: {item.quantity} عدد</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--card-border)] flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--text-secondary)]">مبلغ نهایی فاکتور:</span>
                <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                  {Number(order.finalAmount || order.totalAmount).toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">در حال بارگذاری فاکتور...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
`;
writeFile('app/track-order/page.tsx', trackOrderPageContent);

// =============================================================================
// ۲. افزودن قابلیت تغییر مستقیم پین‌کد مدیریت در تنظیمات ادمین
// =============================================================================
const adminChangePinApi = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { newPin } = await req.json();
    const cleanPin = String(newPin || "").trim();

    if (!cleanPin || cleanPin.length < 4) {
      return NextResponse.json({ success: false, message: "پین‌کد باید حداقل ۴ رقم باشد." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("admin_users")
      .update({ password: cleanPin, updated_at: new Date().toISOString() })
      .or("username.eq.admin,role.eq.superadmin");

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "پین‌کد ورود با موفقیت تغییر یافت." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در تغییر پین‌کد." }, { status: 500 });
  }
}
`;
writeFile('app/api/admin/change-pin/route.ts', adminChangePinApi);

// =============================================================================
// ۳. تست بیلد و پوش مستقیم به گیت‌هاب
// =============================================================================
log("تست بیلد محلی برای اطمینان از صحت فایل‌ها...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  success("بیلد با موفقیت کامل انجام شد.");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

log("ارسال و پوش به گیت‌هاب...");
try {
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(privacy): mask sensitive customer info in order tracking and add admin pin change endpoint"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  success("تغییرات با موفقیت به گیت‌هاب ارسال و روی سرور مستقر شد!");
} catch (e) {
  console.error("خطای گیت:", e.message);
}