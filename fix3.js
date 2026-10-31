#!/usr/bin/env node
/**
 * fix3.js — رفع مشکلات موبایل ProductReviews + deploy
 * node fix3.js
 */
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.join(__dirname);

function write(rel, content) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("  [write] " + rel);
}

// ══════════════════════════════════════════════════════════════
// 1. ProductReviews.tsx
//    باگ: grid grid-cols-2 روی موبایل → فضای خالی سمت چپ
//    دکمه submit: rounded-xl flat → btn-glass-primary کپسولی
// ══════════════════════════════════════════════════════════════
console.log("\n1/2  ProductReviews.tsx ...");
const productReviewsTsx = `"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

export interface ProductReviewsProps {
  productId?: string | number;
  productTitle?: string;
  initialReviews?: any[];
  [key: string]: any;
}

export function ProductReviews(props: ProductReviewsProps) {
  const resolvedProductId = String(
    props.productId || props.product?.id || props.id || "default"
  );
  const resolvedTitle =
    props.productTitle || props.product?.title || props.product?.name || "این محصول";

  const [reviews, setReviews] = useState<any[]>(
    Array.isArray(props.initialReviews) ? props.initialReviews : []
  );
  const [stats, setStats] = useState({
    totalCount: 0,
    satisfiedCount: 0,
    satisfactionPercent: 98,
    averageRating: 4.9,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchProductReviews = async () => {
    try {
      const res = await fetch(
        "/api/reviews?productId=" + encodeURIComponent(resolvedProductId),
        { cache: "no-store" }
      );
      const json = await res.json();
      if (json.success) {
        setReviews(json.reviews || []);
        if (json.stats) setStats(json.stats);
      }
    } catch (e) {
      console.error("Error loading product reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductReviews();
    const channel = supabase
      .channel("realtime-product-reviews-" + resolvedProductId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => { fetchProductReviews(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [resolvedProductId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 3) return;
    soundEngine.playClick();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: resolvedProductId,
          user_name: userName.trim() || "خریدار محصول",
          rating,
          comment: comment.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFeedback({ type: "success", text: json.message });
        setComment("");
        fetchProductReviews();
      } else {
        setFeedback({
          type: "error",
          text: json.message || "خطا در ثبت دیدگاه.",
        });
      }
    } catch {
      setFeedback({ type: "error", text: "خطا در برقراری ارتباط با سرور." });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <section
      className="mt-10 p-5 sm:p-8 rounded-3xl border font-sans select-text space-y-6"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        border: "1px solid var(--glass-border)",
        color: "var(--text-primary)",
      }}
      dir="rtl"
    >
      {/* هدر آمار */}
      <div
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-5"
        style={{ borderBottom: "1px solid var(--glass-border)" }}
      >
        <div>
          <h3
            className="text-base sm:text-lg font-black flex items-center gap-2"
            style={{ color: "var(--accent-blue)" }}
          >
            <span>💬</span> دیدگاه‌ها، تجربیات خرید و میزان رضایت از{" "}
            {resolvedTitle}
          </h3>
          <p
            className="text-xs mt-1 font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            تمامی دیدگاه‌ها به صورت بلادرنگ (Realtime) نمایش داده می‌شوند و
            قابل پیگیری هستند
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto text-center text-xs">
          <div
            className="p-3 rounded-2xl"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <span
              className="font-mono font-black text-base block"
              style={{ color: "var(--accent-blue)" }}
            >
              {stats.totalCount}
            </span>
            <span
              className="text-[10px] font-bold"
              style={{ color: "var(--text-secondary)" }}
            >
              تعداد دیدگاه
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="font-mono font-black text-base text-emerald-400 block">
              {stats.satisfactionPercent}%
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              رضایت ({stats.satisfiedCount} نفر)
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <span className="font-mono font-black text-base text-amber-400 block">
              {stats.averageRating} ★
            </span>
            <span className="text-[10px] text-amber-400 font-bold">
              امتیاز کل
            </span>
          </div>
        </div>
      </div>

      {/* فیدبک ثبت */}
      {feedback && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (feedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-400")
          }
        >
          {feedback.text}
        </div>
      )}

      {/*
        ══ Layout ════════════════════════════════════════════
        موبایل: 1 ستون (فرم بالا، لیست پایین)
        دسکتاپ: 2 ستون (فرم 5/12، لیست 7/12)
        ═════════════════════════════════════════════════════
      */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* فرم ثبت دیدگاه */}
        <form
          onSubmit={handleSubmitReview}
          className="w-full lg:w-5/12 p-5 rounded-2xl space-y-4 h-fit"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <h4 className="font-black text-sm" style={{ color: "var(--text-primary)" }}>
            ✍️ ثبت دیدگاه و امتیاز شما برای این محصول
          </h4>

          <div>
            <label
              className="block mb-1 font-bold text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              نام شما:
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="نام و نام خانوادگی"
              className="w-full p-3 rounded-xl font-bold outline-none text-sm"
              style={{
                background: "var(--modal-bg)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label
              className="block mb-1 font-bold text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              میزان رضایت و امتیاز شما:
            </label>
            <div className="flex gap-1.5">
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setRating(star);
                  }}
                  className="flex-1 py-2 rounded-xl font-mono font-black transition cursor-pointer text-sm"
                  style={
                    rating === star
                      ? {
                          background:
                            "linear-gradient(135deg,#f59e0b,#d97706)",
                          color: "#fff",
                          boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
                        }
                      : {
                          background: "var(--modal-bg)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--glass-border)",
                        }
                  }
                >
                  {star} ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block mb-1 font-bold text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              متن دیدگاه *
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="تجربه خرید یا پرسش فنی خود درباره این محصول را بنویسید..."
              className="w-full p-3 rounded-xl outline-none leading-relaxed text-sm"
              style={{
                background: "var(--modal-bg)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* دکمه ثبت — گرادیان کپسولی */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-glass-primary w-full py-3.5 font-black text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "در حال ثبت..." : "ثبت دیدگاه زیر محصول 🚀"}
          </button>
        </form>

        {/* لیست دیدگاه‌ها */}
        <div className="w-full lg:w-7/12 space-y-3 lg:max-h-[520px] lg:overflow-y-auto">
          {loading ? (
            <div
              className="py-12 text-center font-bold text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              در حال بارگذاری دیدگاه‌های خریداران...
            </div>
          ) : reviews.length === 0 ? (
            <div
              className="p-8 rounded-2xl text-center font-bold text-sm"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-secondary)",
              }}
            >
              اولین نفری باشید که دیدگاه خود را برای این محصول ثبت
              می‌کند.
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl space-y-2.5"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-black text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {rev.user_name || rev.author_name || "خریدار محصول"}
                    </span>
                    {Number(rev.rating || 5) >= 4 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                        پیشنهاد می‌کنم 👍
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-mono font-bold text-xs self-start sm:self-auto">
                    {"★".repeat(
                      Math.max(1, Math.min(5, Number(rev.rating || 5)))
                    )}
                  </span>
                </div>

                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {rev.comment || rev.content}
                </p>

                {rev.admin_reply && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                    <strong>پاسخ رسمی پشتیبانی آکسون:</strong>{" "}
                    {rev.admin_reply}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductReviews;
`;
write("components/ProductReviews.tsx", productReviewsTsx);

// ══════════════════════════════════════════════════════════════
// 2. حذف nav قدیمی (dead code)
// ══════════════════════════════════════════════════════════════
console.log("\n2/2  حذف nav قدیمی ...");
const oldNav = path.join(ROOT, "components/layout/MobileBottomNav.tsx");
if (fs.existsSync(oldNav)) {
  fs.unlinkSync(oldNav);
  console.log("  [delete] components/layout/MobileBottomNav.tsx");
} else {
  console.log("  [skip] already removed");
}

// ══════════════════════════════════════════════════════════════
// Build
// ══════════════════════════════════════════════════════════════
console.log("\n🔨 در حال بیلد ...\n");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("\n✅ بیلد موفق!\n");
} catch (err) {
  console.error("\n❌ بیلد شکست خورد.\n");
  process.exit(1);
}

// ══════════════════════════════════════════════════════════════
// Git commit
// ══════════════════════════════════════════════════════════════
console.log("📦 git commit ...");
try {
  const msgFile = path.join(ROOT, ".git", "AXON_FIX3.txt");
  fs.writeFileSync(
    msgFile,
    [
      "fix(mobile): ProductReviews grid layout and submit button",
      "",
      "- Fix grid-cols-2 on mobile causing blank white space",
      "  Changed to flex flex-col lg:flex-row layout",
      "- Fix submit button: rounded-xl flat -> btn-glass-primary capsule gradient",
      "- Fix review list max-h only on lg: (not mobile)",
      "- Remove dead code: components/layout/MobileBottomNav.tsx",
      "",
      "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>",
      "Claude-Session: https://claude.ai/code/session_01GPCkuddNi1nS597FzKS4FV",
    ].join("\n"),
    "utf8"
  );
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -F ".git/AXON_FIX3.txt"', { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit" });
  console.log("✅ push انجام شد!");
} catch (e) {
  console.warn("⚠️ git:", e && e.message ? e.message : String(e));
}

// ══════════════════════════════════════════════════════════════
// Vercel deploy
// ══════════════════════════════════════════════════════════════
console.log("\n🚀 در حال deploy به Vercel ...\n");
try {
  execSync("npx vercel --prod --yes", { stdio: "inherit" });
  console.log("\n✅ Deploy کامل شد! axoncore.ir آپدیت شد.\n");
} catch (e) {
  console.warn("⚠️ vercel deploy:", e && e.message ? e.message : String(e));
}

console.log(`
╔══════════════════════════════════════════════════╗
║   ✅ مشکلات موبایل رفع شد!                      ║
║                                                  ║
║  رفع‌شده:                                       ║
║  • فضای خالی موبایل → flex-col (1 ستون)         ║
║  • دکمه ثبت دیدگاه → گرادیان کپسولی             ║
║  • nav قدیمی حذف شد                             ║
║                                                  ║
║  بعد از اجرا: کش موبایل رو پاک کن              ║
║  Safari: Settings → Safari → Clear History      ║
╚══════════════════════════════════════════════════╝
`);