"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Review {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("product_reviews")
          .select("*")
          .eq("product_id", productId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setReviews(data);
          return;
        }
      }

      // پشتیبان LocalStorage
      const local = localStorage.getItem(`reviews_${productId}`);
      if (local) {
        setReviews(JSON.parse(local));
      }
    } catch (e) {
      console.warn("Reviews load warning:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) return;

    setSubmitting(true);
    const newRev: Review = {
      id: `rev_${Date.now()}`,
      product_id: productId,
      user_name: userName.trim(),
      rating,
      comment: comment.trim(),
      created_at: new Date().toISOString(),
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    localStorage.setItem(`reviews_${productId}`, JSON.stringify(updated));

    try {
      if (supabase) {
        await supabase.from("product_reviews").insert([newRev]);
      }
      showToast("دیدگاه شما با موفقیت ثبت گردید.");
      setUserName("");
      setComment("");
      setRating(5);
    } catch {
      showToast("دیدگاه به صورت محلی ذخیره شد.", "success");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {toast && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-black text-white shadow-xl flex items-center gap-2 ${
            toast.type === "success" ? "bg-emerald-500" : "bg-rose-600"
          }`}
        >
          <span>✓</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* فرم ثبت دیدگاه */}
      <form onSubmit={handleSubmit} className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4 text-xs">
        <h4 className="font-black text-sm text-[var(--accent-blue)]">✍️ ثبت نظر و امتیاز برای این محصول</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی شما *</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="مثال: علی محمدی"
              className="w-full p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">امتیاز شما به کالا</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)]"
            >
              <option value={5}>⭐⭐⭐⭐⭐ (عالی - ۵ از ۵)</option>
              <option value={4}>⭐⭐⭐⭐ (خوب - ۴ از ۵)</option>
              <option value={3}>⭐⭐⭐ (متوسط - ۳ از ۵)</option>
              <option value={2}>⭐⭐ (ضعیف - ۲ از ۵)</option>
              <option value={1}>⭐ (خیلی ضعیف - ۱ از ۵)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-1 font-bold text-[var(--text-secondary)]">متن نظر شما *</label>
          <textarea
            rows={3}
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="تجربه خود را از کیفیت و کارایی این محصول بنویسید..."
            className="w-full p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-medium leading-relaxed focus:border-[var(--accent-blue)]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
        >
          {submitting ? "در حال ثبت..." : "ثبت دیدگاه ←"}
        </button>
      </form>

      {/* لیست دیدگاه‌های ثبت‌شده */}
      <div className="space-y-3">
        <h4 className="font-black text-xs text-[var(--text-secondary)]">نظرات ثبت‌شده کاربران ({reviews.length})</h4>

        {loading ? (
          <div className="py-8 text-center text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری نظرات...</div>
        ) : reviews.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-[var(--text-secondary)]">
            هنوز دیدگاهی برای این محصول ثبت نشده است. اولین نفری باشید که نظر می‌دهد!
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-[var(--text-primary)]">{rev.user_name}</span>
                <span className="text-amber-500 font-mono">{"⭐".repeat(rev.rating)}</span>
              </div>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}