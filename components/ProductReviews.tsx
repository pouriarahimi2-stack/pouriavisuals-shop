"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Review {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at?: string;
  is_approved?: boolean;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // استیت فرم ثبت نظر
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const STORAGE_KEY = `product_reviews_${productId}`;

  const loadReviews = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", productId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          setReviews(data);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Supabase reviews error:", e);
    }

    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      setReviews(JSON.parse(local));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    setSubmitting(true);
    setMsg(null);

    const newRev: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      product_id: productId,
      user_name: name.trim(),
      rating,
      comment: comment.trim(),
      created_at: new Date().toLocaleDateString("fa-IR"),
      is_approved: true,
    };

    try {
      if (supabase) {
        await supabase.from("reviews").insert([newRev]);
      }

      const updated = [newRev, ...reviews];
      setReviews(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      setName("");
      setComment("");
      setRating(5);
      setMsg("✅ دیدگاه شما با موفقیت ثبت شد.");
    } catch (e) {
      console.error(e);
      setMsg("خطا در ثبت دیدگاه.");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]">
      
      {/* سربرگ بخش نظرات */}
      <div className="flex justify-between items-center bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-xl">
        <div>
          <h3 className="text-base font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>💬</span> دیدگاه‌ها و تجربیات خریداران ({reviews.length})
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
            امتیاز میانگین کاربران: <strong className="text-[var(--accent-blue)] font-mono">{avgRating} از ۵</strong> ⭐
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* فرم ثبت دیدگاه */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 shadow-xl text-xs"
        >
          <h4 className="font-black text-sm text-[var(--text-primary)]">✍️ ثبت تجربه و نظر شما:</h4>

          {msg && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              {msg}
            </div>
          )}

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی:</label>
            <input
              type="text"
              required
              placeholder="مثلاً: پوریا"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">امتیاز شما به کالا:</label>
            <div className="flex gap-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`flex-1 py-2 rounded-xl font-bold transition cursor-pointer ${
                    rating === star
                      ? "bg-[var(--accent-blue)] text-white shadow-md"
                      : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {star} ⭐
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">متن دیدگاه:</label>
            <textarea
              rows={4}
              required
              placeholder="نقاط قوت، کیفیت ساخت و تجربه استفاده از این محصول..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed focus:border-[var(--accent-blue)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {submitting ? "در حال ثبت..." : "ارسال دیدگاه 🚀"}
          </button>
        </form>

        {/* فهرست نظرات ثبت شده */}
        <div className="lg:col-span-7 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl space-y-4">
          <h4 className="font-black text-sm text-[var(--text-primary)]">نظرات خریداران:</h4>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-secondary)] font-bold">
              هنوز نظری برای این کالا ثبت نشده است. اولین نفری باشید که نظر خود را به اشتراک می‌گذارد!
            </div>
          ) : (
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[var(--text-primary)]">{rev.user_name}</span>
                      <span className="text-[10px] text-[var(--accent-blue)] font-bold">
                        {"⭐".repeat(rev.rating)}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                      {rev.created_at || "اخیراً"}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}