/**
 * AXON CORE - Definitive Double-Check & Security Patch Script (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ اصلاح شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[DOUBLE-CHECK-AUDIT]\x1b[0m رفع رخنه روت‌های ادمین و ایجاد API اعتبارسنجی کوپن...");

// =============================================================================
// ۱. رفع باگ امنیتی در app/api/news/route.ts (افزودن await)
// =============================================================================
const fixedNewsRoute = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { ensureFreshAutonomousNews } from "@/lib/techNewsHarvester";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureFreshAutonomousNews();

    const { data, error } = await supabaseAdmin
      .from("tech_news")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const cleanTitle = String(body.title || "").trim();

    if (!cleanTitle) {
      return NextResponse.json({ success: false, message: "تیتر خبر الزامی است." }, { status: 400 });
    }

    const newsId = body.id && body.id.length > 10 ? body.id : randomUUID();
    const cleanSlug = String(body.slug || cleanTitle)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\\u0600-\\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload: Record<string, any> = {
      id: newsId,
      title: cleanTitle,
      slug: cleanSlug,
      summary: body.summary ? String(body.summary).trim() : cleanTitle,
      content: body.content ? String(body.content).trim() : "",
      category: body.category || "hardware",
      source_name: body.source_name ? String(body.source_name).trim() : "آکسون تک",
      image_url: body.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      tags: Array.isArray(body.tags) ? body.tags : ["تکنولوژی", "سخت افزار"],
      is_published: true,
      trending_score: body.trending_score ? Number(body.trending_score) : 95,
      updated_at: new Date().toISOString(),
    };

    if (body.id) {
      const { data, error } = await supabaseAdmin.from("tech_news").update(payload).eq("id", body.id).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, message: "خبر با موفقیت به‌روزرسانی شد.", data });
    } else {
      payload.published_at = new Date().toISOString();
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin.from("tech_news").insert([payload]).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, message: "خبر با موفقیت منتشر گردید.", data });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه خبر الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("tech_news").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "خبر با موفقیت از سیستم حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/news/route.ts', fixedNewsRoute);

// =============================================================================
// ۲. رفع باگ امنیتی در app/api/site-info/route.ts (افزودن await)
// =============================================================================
const fixedSiteInfoRoute = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1);

    const payload: Record<string, any> = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    if (existing && existing.length > 0) {
      await supabaseAdmin.from("site_info").update(payload).eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("site_info").insert([payload]);
    }

    return NextResponse.json({ success: true, message: "تنظیمات با موفقیت ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/site-info/route.ts', fixedSiteInfoRoute);

// =============================================================================
// ۳. پیاده‌سازی روت اعتبارسنجی زنده کوپن (app/api/coupons/validate/route.ts)
// =============================================================================
const couponValidateRoute = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, totalAmount } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ success: false, message: "کد تخفیف معتبر نیست." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const orderTotal = Number(totalAmount || 0);

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", cleanCode)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json({ success: false, message: "کد تخفیف وارد شده یافت نشد یا غیرفعال است." }, { status: 404 });
    }

    // بررسی حداقل میزان خرید
    const minOrder = Number(coupon.min_order_amount || 0);
    if (minOrder > 0 && orderTotal < minOrder) {
      return NextResponse.json({
        success: false,
        message: "حداقل مبلغ سفارش برای اعمال این کوپن " + minOrder.toLocaleString("fa-IR") + " تومان است."
      }, { status: 400 });
    }

    // بررسی تاریخ انقضا
    if (coupon.expires_at) {
      const expiry = new Date(coupon.expires_at);
      if (expiry < new Date()) {
        return NextResponse.json({ success: false, message: "مهلت استفاده از این کد تخفیف به پایان رسیده است." }, { status: 400 });
      }
    }

    // محاسبه تخفیف
    let discount = 0;
    const val = Number(coupon.value || coupon.discount_value || 0);
    const type = coupon.type || coupon.discount_type || "percent";

    if (type === "percent") {
      discount = Math.round((orderTotal * val) / 100);
      const maxDiscount = Number(coupon.max_discount_amount || coupon.max_discount || 0);
      if (maxDiscount > 0 && discount > maxDiscount) {
        discount = maxDiscount;
      }
    } else {
      discount = val;
    }

    if (discount > orderTotal) {
      discount = orderTotal;
    }

    return NextResponse.json({
      success: true,
      message: "کد تخفیف با موفقیت تایید شد.",
      discount,
      code: cleanCode
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در پردازش کوپن." }, { status: 500 });
  }
}
`;
writeFile('app/api/coupons/validate/route.ts', couponValidateRoute);

// =============================================================================
// ۴. بهینه‌سازی پاکسازی استیت در app/payment/page.tsx
// =============================================================================
const fixedPaymentReturnPage = `"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { orderService } from "@/services/orderService";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

function PaymentGatewayForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const [order, setOrder] = useState<any>(null);
  const [amount, setAmount] = useState<number>(0);
  const [cardNumber, setCardNumber] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(120);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "failed">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [txnRef, setTxnRef] = useState("");

  useEffect(() => {
    async function loadOrderInfo() {
      if (orderId) {
        try {
          const found = await orderService.getById(orderId);
          if (found) {
            setOrder(found);
            const finalPayable = Number(found.finalAmount || (found as any).final_amount || found.totalAmount || 0);
            setAmount(finalPayable);
            return;
          }
        } catch (e) {
          console.error("Order load error:", e);
        }
      }

      const savedAmount = sessionStorage.getItem("pending_payment_amount");
      if (savedAmount) {
        setAmount(Number(savedAmount));
      }
    }

    loadOrderInfo();

    const timer = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMsg("");

    const cleanCard = cardNumber.replace(/\\D/g, "");
    if (cleanCard.length !== 16) {
      setErrorMsg("شماره کارت بانکی باید ۱۶ رقم کامل باشد.");
      return;
    }

    if (cvv2.length < 3 || cvv2.length > 4) {
      setErrorMsg("کد CVV2 نامعتبر است.");
      return;
    }

    if (!otp || otp.length < 5) {
      setErrorMsg("رمز پویای پیامک‌شده را وارد نمایید.");
      return;
    }

    setIsProcessing(true);

    try {
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          authority: "AUTH_" + Date.now().toString().slice(-8),
        }),
      });

      const resJson = await verifyRes.json();
      if (!verifyRes.ok || !resJson.success) {
        throw new Error(resJson.message || "تراکنش بانکی تایید نشد.");
      }

      setTxnRef(resJson.trackingRef || Date.now().toString().slice(-8));

      // پاکسازی کامل ذخیره‌سازی محلی و فراخوانی همگام‌سازی سبد
      if (typeof window !== "undefined") {
        localStorage.removeItem("axon_cart_store_v2026");
        localStorage.removeItem("axon_active_coupon_v2026");
        sessionStorage.removeItem("pending_payment_amount");
        sessionStorage.removeItem("pending_payment_order_id");
        window.dispatchEvent(new CustomEvent("cart_updated", { detail: [] }));
      }

      soundEngine.playSuccess();
      setStatus("success");
    } catch (err: any) {
      setStatus("failed");
      setErrorMsg(err.message || "تراکنش توسط بانک رد شد.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl font-sans text-slate-100" dir="rtl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
            💳
          </span>
          <div>
            <h2 className="text-sm font-black text-white">درگاه پرداخت الکترونیک شتاب</h2>
            <span className="text-[10px] text-slate-400 font-mono font-bold">شاپرک (پرداخت امن و رمزنگاری‌شده)</span>
          </div>
        </div>
        <div className="text-left">
          <span className="text-[10px] text-slate-400 block font-bold">شناسه فاکتور:</span>
          <span className="text-xs font-mono font-black text-amber-400">{orderId || "ORD-PENDING"}</span>
        </div>
      </div>

      {status === "success" ? (
        <div className="text-center py-8 space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-3xl flex items-center justify-center mx-auto shadow-lg">
            ✓
          </div>
          <h3 className="text-base font-black text-white">پرداخت شما با موفقیت تایید شد!</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            سفارش شما در مرحله بسته‌بندی استودیویی و صدور بارنامه پیشتاز قرار گرفت.
          </p>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1">
            <p className="text-slate-400">کد پیگیری تراکنش بانکی: {txnRef}</p>
            <p className="text-emerald-400 font-bold" suppressHydrationWarning>مبلغ واریزی: {formatPrice(amount)} تومان</p>
          </div>
          <button
            onClick={() => router.push(\`/track-order?orderId=\${orderId}&success=true\`)}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg cursor-pointer"
          >
            پیگیری لحظه‌ای بسته پستی 📦
          </button>
        </div>
      ) : (
        <form onSubmit={handlePay} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold">
              {errorMsg}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400 font-bold">مبلغ فاکتور قابل پرداخت:</span>
            <span className="text-base font-black text-emerald-400 font-mono" suppressHydrationWarning>
              {formatPrice(amount)} تومان
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-300">شماره کارت بانکی (۱۶ رقم):</label>
            <input
              type="text"
              required
              maxLength={19}
              placeholder="6037 - 9975 - **** - ****"
              value={cardNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\\D/g, "").slice(0, 16);
                const formatted = val.match(/.{1,4}/g)?.join(" - ") || val;
                setCardNumber(formatted);
              }}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center text-sm font-black text-white tracking-widest outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">کد CVV2:</label>
              <input
                type="password"
                required
                maxLength={4}
                placeholder="***"
                value={cvv2}
                onChange={(e) => setCvv2(e.target.value.replace(/\\D/g, ""))}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center font-bold text-white outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">تاریخ انقضا (ماه / سال):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  maxLength={2}
                  placeholder="ماه"
                  value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value.replace(/\\D/g, ""))}
                  className="w-1/2 p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center font-bold text-white outline-none focus:border-amber-500 transition"
                />
                <input
                  type="text"
                  required
                  maxLength={2}
                  placeholder="سال"
                  value={expYear}
                  onChange={(e) => setExpYear(e.target.value.replace(/\\D/g, ""))}
                  className="w-1/2 p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center font-bold text-white outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-300">رمز دوم پویا:</label>
              <span className="text-[10px] font-mono text-amber-400 font-bold" suppressHydrationWarning>
                {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, "0")} مانده
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                required
                maxLength={7}
                placeholder="رمز پیامک‌شده"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ""))}
                className="flex-1 p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center font-black text-white outline-none focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setOtp("584920");
                  setOtpTimer(120);
                }}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-400 transition cursor-pointer"
              >
                دریافت رمز پیامکی
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <span>پرداخت نهایی و تایید فاکتور 🔒</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PaymentGatewayPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans select-none">
      <Suspense fallback={<div className="text-xs text-slate-400 animate-pulse">در حال اتصال به شاپرک...</div>}>
        <PaymentGatewayForm />
      </Suspense>
    </div>
  );
}
`;
writeFile('app/payment/page.tsx', fixedPaymentReturnPage);

// =============================================================================
// ۵. بیلد کامل نهایی، بررسی نوع‌ها و ارسال به مخزن و ورسل
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ تمام مراحل کامپایل با موفقیت ۱۰۰٪ تایید شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات اصلاح‌شده به مخزن گیت‌هاب و انتشار در ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "fix(security-doublecheck): patch news & site-info admin verification, create coupons validate endpoint, sync cart state"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ بازرسی مجدد کامل شد؛ پچ‌ها با موفقیت اعمال و در ورسل مستقر شدند!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}