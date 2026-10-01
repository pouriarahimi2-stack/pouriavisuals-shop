// File Path: components/ProductReviews.tsx
"use client";

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
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        fetchProductReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        setFeedback({ type: "error", text: json.message || "خطا در ثبت دیدگاه." });
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
      className="mt-10 p-5 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl font-sans select-none text-[var(--text-primary)] space-y-6"
      dir="rtl"
    >
      {/* هدر آمار رضایت خریداران و تعداد کل دیدگاه‌ها */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-5">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>💬</span> دیدگاه‌ها، تجربیات خرید و میزان رضایت از {resolvedTitle}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تمامی دیدگاه‌ها به صورت بلادرنگ (Realtime) نمایش داده می‌شوند و قابل پیگیری هستند
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto text-center text-xs">
          <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            <span className="font-mono font-black text-base text-[var(--accent-blue)] block">
              {stats.totalCount}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-bold">تعداد دیدگاه</span>
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
            <span className="text-[10px] text-amber-400 font-bold">امتیاز کل</span>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* فرم ثبت دیدگاه جدید */}
        <form
          onSubmit={handleSubmitReview}
          className="lg:col-span-5 p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4 h-fit"
        >
          <h4 className="font-black text-sm text-[var(--text-primary)]">
            ✍️ ثبت دیدگاه و امتیاز شما برای این محصول
          </h4>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام شما:</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="نام و نام خانوادگی"
              className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">
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
                  className={
                    "flex-1 py-2 rounded-xl font-mono font-black transition cursor-pointer " +
                    (rating === star
                      ? "bg-amber-500 text-slate-950 shadow"
                      : "bg-[var(--modal-bg)] text-slate-400 border border-[var(--card-border)]")
                  }
                >
                  {star} ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">متن دیدگاه *</label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="تجربه خرید یا پرسش فنی خود درباره این محصول را بنویسید..."
              className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {submitting ? "در حال ثبت..." : "ثبت دیدگاه زیر محصول 🚀"}
          </button>
        </form>

        {/* لیست دیدگاه‌های ثبت‌شده */}
        <div className="lg:col-span-7 space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-bold">
              در حال بارگذاری دیدگاه‌های خریداران...
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center text-slate-400 font-bold">
              اولین نفری باشید که دیدگاه خود را برای این محصول ثبت می‌کند.
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm">
                      {rev.user_name || rev.author_name || "خریدار محصول"}
                    </span>
                    {Number(rev.rating || 5) >= 4 && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                        پیشنهاد می‌کنم 👍
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 font-mono font-bold">
                    {"★".repeat(Math.max(1, Math.min(5, Number(rev.rating || 5))))}
                  </span>
                </div>

                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {rev.comment || rev.content}
                </p>

                {rev.admin_reply && (
                  <div className="p-3 rounded-xl bg-[var(--modal-bg)] border border-emerald-500/30 text-emerald-400 text-[11px]">
                    <strong>پاسخ رسمی پشتیبانی آکسون:</strong> {rev.admin_reply}
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
