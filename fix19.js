#!/usr/bin/env node
/**
 * fix19.js — رفع باگ‌های موبایل آکسون
 * 1. دوتا اسلایدر دسکتاپ → CSS utility کلاس‌های صریح + بروزرسانی DynamicHomeSections
 * 2. دکمه پرداخت CartDrawer زیر نوار پایین → padding-bottom صحیح
 * 3. صفحه checkout داغون موبایل → اصلاح grid layout و padding
 * 4. AddToCartButton → اصلاح استایل موبایل
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const write = (rel, content) => {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
  console.log("✅ نوشته شد:", rel);
};

// ─────────────────────────────────────────────────────────────────
// 1. globals.css — اضافه کردن کلاس‌های axon-mobile-only و axon-desktop-only
// ─────────────────────────────────────────────────────────────────
const globalsPath = path.join(ROOT, "app/globals.css");
let globalsCss = fs.readFileSync(globalsPath, "utf8");

// حذف بلوک‌های قبلی اگر وجود داشت
globalsCss = globalsCss.replace(/\/\* axon-breakpoint-utils[\s\S]*?\*\//g, "").trimEnd();

const axonBreakpointUtils = `

/* axon-breakpoint-utils — جایگزین Tailwind lg:hidden / hidden lg:block برای قابلیت اطمینان بیشتر */
.axon-mobile-only {
  display: block !important;
}
@media (min-width: 1024px) {
  .axon-mobile-only {
    display: none !important;
  }
}

.axon-desktop-only {
  display: none !important;
}
@media (min-width: 1024px) {
  .axon-desktop-only {
    display: block !important;
  }
}
/* /axon-breakpoint-utils */`;

globalsCss += axonBreakpointUtils;
write("app/globals.css", globalsCss);

// ─────────────────────────────────────────────────────────────────
// 2. DynamicHomeSections.tsx — استفاده از کلاس‌های axon-mobile-only/axon-desktop-only
// ─────────────────────────────────────────────────────────────────
const dynamicHomeSectionsPath = path.join(ROOT, "components/DynamicHomeSections.tsx");
let dhs = fs.readFileSync(dynamicHomeSectionsPath, "utf8");

// جایگزینی "block lg:hidden" با "axon-mobile-only"
dhs = dhs.replace(/className="block lg:hidden"/g, 'className="axon-mobile-only"');
dhs = dhs.replace(/className="hidden lg:block"/g, 'className="axon-desktop-only"');

write("components/DynamicHomeSections.tsx", dhs);

// ─────────────────────────────────────────────────────────────────
// 3. CartDrawer.tsx — رفع مشکل دکمه پرداخت زیر MobileBottomNav
// ─────────────────────────────────────────────────────────────────
write("components/CartDrawer.tsx", `"use client";
import React, { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, removeFromCart, updateQuantity, totalPrice } =
    useCart() as any;

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCartOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const cartItems: any[] = Array.isArray(items) ? items : [];
  const total = typeof totalPrice === "number" ? totalPrice : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => { soundEngine.playClick(); closeCart(); }}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "480px",
          marginLeft: "auto",
          marginRight: "auto",
          background: "var(--modal-bg, #0f1117)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid var(--card-border, rgba(255,255,255,0.1))",
          borderBottom: "none",
          display: "flex",
          flexDirection: "column",
          maxHeight: "85dvh",
          /* مهم: padding پایین برای جلوگیری از زیر MobileBottomNav */
          paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 20px 14px",
          borderBottom: "1px solid var(--card-border, rgba(255,255,255,0.1))",
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 900, fontSize: "14px", color: "var(--text-primary,#fff)" }}>
            🛒 سبد خرید ({cartItems.length} قلم)
          </span>
          <button
            onClick={() => { soundEngine.playClick(); closeCart(); }}
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: "var(--input-bg,rgba(255,255,255,0.08))",
              border: "1px solid var(--card-border,rgba(255,255,255,0.1))",
              cursor: "pointer", fontWeight: 900, fontSize: 13,
              color: "var(--text-primary,#fff)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Items list - scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {cartItems.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-secondary,#aaa)", fontSize: 13, fontWeight: 700 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              سبد خرید شما خالی است
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cartItems.map((item: any) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 16,
                  background: "var(--input-bg,rgba(255,255,255,0.05))",
                  border: "1px solid var(--card-border,rgba(255,255,255,0.08))",
                }}>
                  {(item.image || item.image_url) && (
                    <img
                      src={item.image || item.image_url}
                      alt={item.title || ""}
                      style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: "var(--text-primary,#fff)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title || item.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--accent-blue,#0066ff)", fontWeight: 700, marginTop: 3 }}>
                      {formatPrice((item.discount_price || item.price || 0) * (item.quantity || 1))} تومان
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => { soundEngine.playClick(); updateQuantity(item.id, (item.quantity || 1) - 1); }}
                      style={{ width: 28, height: 28, borderRadius: 8, background: "var(--input-bg,rgba(255,255,255,0.08))", border: "1px solid var(--card-border,rgba(255,255,255,0.1))", cursor: "pointer", fontWeight: 900, fontSize: 16, color: "var(--text-primary,#fff)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >−</button>
                    <span style={{ minWidth: 20, textAlign: "center", fontWeight: 900, fontSize: 13, color: "var(--text-primary,#fff)" }}>
                      {item.quantity || 1}
                    </span>
                    <button
                      onClick={() => { soundEngine.playClick(); updateQuantity(item.id, (item.quantity || 1) + 1); }}
                      style={{ width: 28, height: 28, borderRadius: 8, background: "var(--input-bg,rgba(255,255,255,0.08))", border: "1px solid var(--card-border,rgba(255,255,255,0.1))", cursor: "pointer", fontWeight: 900, fontSize: 16, color: "var(--text-primary,#fff)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >+</button>
                    <button
                      onClick={() => { soundEngine.playClick(); removeFromCart(item.id); }}
                      style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — همیشه در پایین، بالاتر از MobileBottomNav */}
        {cartItems.length > 0 && (
          <div style={{
            padding: "14px 16px",
            borderTop: "1px solid var(--card-border,rgba(255,255,255,0.1))",
            flexShrink: 0,
            background: "var(--modal-bg,#0f1117)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: "var(--text-secondary,#aaa)" }}>مجموع سبد خرید:</span>
              <span style={{ fontWeight: 900, fontSize: 15, color: "var(--accent-blue,#0066ff)" }}>
                {formatPrice(total)} تومان
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={() => { soundEngine.playSuccess(); closeCart(); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "14px 20px", borderRadius: 16,
                background: "linear-gradient(135deg,#0066ff 0%,#7c3aed 100%)",
                color: "#fff", fontWeight: 900, fontSize: 14,
                textDecoration: "none", border: "none", cursor: "pointer",
                boxShadow: "0 4px 20px rgba(0,102,255,0.4)",
              }}
            >
              <span>💳</span>
              <span>تکمیل خرید و پرداخت</span>
              <span>←</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────
// 4. app/checkout/page.tsx — رفع کامل مشکلات موبایل
// ─────────────────────────────────────────────────────────────────
const checkoutPath = path.join(ROOT, "app/checkout/page.tsx");
let checkoutContent = fs.readFileSync(checkoutPath, "utf8");

// مشکل اصلی: outer container padding-bottom
checkoutContent = checkoutContent.replace(
  /className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 font-sans select-text text-\[var\(--text-primary\)\] space-y-6"/,
  'className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10 font-sans select-text text-[var(--text-primary)] space-y-6 pb-28 md:pb-10"'
);

// مشکل دوم: فرم اصلی grid که کلاس‌های متناقض دارد
checkoutContent = checkoutContent.replace(
  /className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:grid-cols-2 md:grid-cols-3 lg:grid-cols-42 gap-3 md:gap-6"/,
  'className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6"'
);

// بخش ۱ مشخصات: grid داخلی فرم
checkoutContent = checkoutContent.replace(
  /className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:grid-cols-2 gap-2 md:gap-4"(\s*>[\s\S]*?{\/\* آدرس کامل \*\/})/,
  (match) => match.replace(
    'className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:grid-cols-2 gap-2 md:gap-4"',
    'className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"'
  )
);

// بخش ۲ روش ارسال: grid داخلی
checkoutContent = checkoutContent.replace(
  /className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:grid-cols-2 gap-2 md:gap-4 pt-1"/,
  'className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1"'
);

// lg:col-span-7 — ستون اصلی (فرم)
checkoutContent = checkoutContent.replace(
  /className="lg:col-span-7 space-y-5"/,
  'className="lg:col-span-7 space-y-4 sm:space-y-5"'
);

// ستون راست صورتحساب (lg:col-span-5)
// اضافه شد h-fit → ضمنا در حالت موبایل، مطمئن بشیم order صحیح هست
checkoutContent = checkoutContent.replace(
  /className="lg:col-span-5 p-5 sm:p-7 rounded-3xl/,
  'className="lg:col-span-5 p-4 sm:p-7 rounded-3xl'
);

write("app/checkout/page.tsx", checkoutContent);

// ─────────────────────────────────────────────────────────────────
// 5. Build
// ─────────────────────────────────────────────────────────────────
console.log("\n🔨 در حال اجرای build ...\n");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ Build موفق بود!\n");
} catch (err) {
  console.error("\n❌ Build ناموفق بود. لطفاً خطاهای بالا را بررسی کنید.\n");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────
// 6. Git commit & push
// ─────────────────────────────────────────────────────────────────
console.log("📦 در حال commit و push ...");
try {
  execSync("git add -A", { cwd: ROOT, stdio: "inherit" });
  const msg = `fix(mobile): رفع دوتا اسلایدر دسکتاپ، CartDrawer checkout، checkout mobile layout

- globals.css: کلاس‌های axon-mobile-only/axon-desktop-only اضافه شد
- DynamicHomeSections: از کلاس‌های صریح CSS بجای Tailwind lg:hidden استفاده شد
- CartDrawer: بازنویسی کامل با inline styles، paddingBottom برای MobileBottomNav رفع شد
- checkout/page.tsx: grid اصلی اصلاح شد (grid-cols-1 lg:grid-cols-12)، pb-28 موبایل
- checkout/page.tsx: grid فیلدهای فرم از 4 ستون به 1-2 ستون موبایل‌پسند شد

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GPCkucxnVMX9p4m8F7jjL4`;

  fs.writeFileSync(path.join(ROOT, ".git/AXON_FIX19.txt"), msg, "utf8");
  execSync('git commit -F ".git/AXON_FIX19.txt"', { cwd: ROOT, stdio: "inherit" });
  execSync("git push origin main", { cwd: ROOT, stdio: "inherit" });
  console.log("\n🚀 Push به main انجام شد! Vercel در حال deploy است...\n");
} catch (err) {
  console.error("❌ خطا در git:", err.message);
  process.exit(1);
}