// File Path: components/ProductReviewsSection.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";

interface Review {
  id: string | number;
  user_name?: string;
  author_name?: string;
  authorName?: string;
  rating: number;
  comment?: string;
  body?: string;
  admin_reply?: string;
  created_at?: string;
  is_approved?: boolean;
}

interface Props {
  productId: string | number;
  reviews: Review[];
  onNewReview?: () => void;
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-600 fill-transparent"
          }
        />
      ))}
    </div>
  );
}

export default function ProductReviewsSection({
  productId,
  reviews: initialReviews,
  onNewReview,
}: Props) {
  const [reviewsList, setReviewsList] = useState<Review[]>(
    Array.isArray(initialReviews) ? initialReviews : []
  );
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const loadLatestReviews = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/reviews?productId=${encodeURIComponent(String(productId))}&t=${Date.now()}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.reviews)) {
        setReviewsList(json.reviews);
      }
    } catch {}
  }, [productId]);

  useEffect(() => {
    if (Array.isArray(initialReviews) && initialReviews.length > 0) {
      setReviewsList(initialReviews);
    }
    loadLatestReviews();
  }, [initialReviews, loadLatestReviews]);

  const avgRating =
    reviewsList.length > 0
      ? reviewsList.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviewsList.length
      : 0;

  const satisfiedPct =
    reviewsList.length > 0
      ? Math.round(
          (reviewsList.filter((r) => Number(r.rating) >= 4).length /
            reviewsList.length) *
            100
        )
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          user_name: authorName.trim(),
          author_name: authorName.trim(),
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setAuthorName("");
        setComment("");
        setRating(5);
        await loadLatestReviews();
        if (onNewReview) onNewReview();
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="space-y-6 mt-8" dir="rtl">
      <div className="border-t border-[var(--card-border)] pt-6">
        <h2 className="text-base font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Star size={18} className="text-amber-400 fill-amber-400" />
          دیدگاه‌ها و امتیازات خریداران
        </h2>

        {reviewsList.length > 0 && (
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-wrap items-center gap-6 mb-6 text-xs">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-black font-mono text-amber-400">
                {avgRating.toFixed(1)}
              </span>
              <StarRating value={avgRating} />
              <span className="text-[var(--text-secondary)] font-bold">
                {reviewsList.length} دیدگاه
              </span>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewsList.filter(
                  (r) => Math.round(Number(r.rating)) === star
                ).length;
                const pct =
                  reviewsList.length > 0 ? (count / reviewsList.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-3 text-right text-slate-400 font-mono">
                      {star}
                    </span>
                    <Star
                      size={10}
                      className="text-amber-400 fill-amber-400 shrink-0"
                    />
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--card-border)] overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-slate-400 font-mono text-[10px]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl font-black text-emerald-500">
                {satisfiedPct}٪
              </span>
              <span className="text-[var(--text-secondary)] font-bold text-[11px]">
                رضایت خریداران
              </span>
            </div>
          </div>
        )}

        {reviewsList.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)] font-bold rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            هنوز دیدگاهی ثبت نشده است. اولین نفر باشید!
          </div>
        ) : (
          <div className="space-y-3">
            {reviewsList.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[var(--text-primary)]">
                    {r.user_name || r.author_name || r.authorName || "خریدار محصول"}
                  </span>
                  <div className="flex items-center gap-2">
                    <StarRating value={Number(r.rating)} />
                    {r.created_at && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(r.created_at).toLocaleDateString("fa-IR")}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                  {r.comment || r.body}
                </p>
                {r.admin_reply && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs leading-relaxed">
                    <strong>🛡️ پاسخ رسمی پشتیبانی آکسون کور:</strong> {r.admin_reply}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* فرم ثبت نظر جدید */}
      <div className="p-5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4">
        <h3 className="text-sm font-black">✍️ ثبت دیدگاه جدید</h3>

        {status === "success" && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
            ✓ دیدگاه شما با موفقیت ثبت شد و زیر محصول نمایش داده می‌شود.
          </div>
        )}
        {status === "error" && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold">
            خطا در ثبت دیدگاه. لطفاً مجدداً تلاش کنید.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            placeholder="نام و نام خانوادگی شما"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
          />

          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-[var(--text-secondary)] ml-2">
              امتیاز شما:
            </span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                className="cursor-pointer"
              >
                <Star
                  size={20}
                  className={
                    s <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-600 fill-transparent"
                  }
                />
              </button>
            ))}
          </div>

          <textarea
            required
            rows={3}
            placeholder="تجربه خرید یا دیدگاه فنی خود را بنویسید..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)] resize-none"
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-md"
          >
            {status === "loading" ? "در حال ثبت..." : "ثبت دیدگاه ✓"}
          </button>
        </form>
      </div>
    </div>
  );
}