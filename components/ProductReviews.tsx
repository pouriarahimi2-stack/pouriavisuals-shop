"use client";

import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Send, CheckCircle2 } from "lucide-react";

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // خواندن نام کاربر در صورت لاگین بودن
    try {
      const match = document.cookie.match(/(^|;)\s*axon_user_session=([^;]+)/);
      if (match) {
        const u = JSON.parse(decodeURIComponent(match[2]));
        if (u.name) setUserName(u.name);
      }
    } catch (e) {}

    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (err) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: userName, rating, comment }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        setComment("");
        fetchReviews();
      }
    } catch (err) {
      alert("خطا در ثبت نظر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-[var(--card-border)] dir-rtl">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare size={20} className="text-[#0071e3]" />
        <h3 className="text-base font-black text-white">نظرات و امتیاز خریداران</h3>
        <span className="text-xs text-zinc-500 font-bold">({reviews.length})</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* فرم ثبت دیدگاه */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 sm:p-6 h-fit">
          <h4 className="text-xs font-bold text-white mb-4">ثبت تجربه خرید شما</h4>
          {submitted ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 text-xs text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              نظر شما با موفقیت ثبت گردید.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1.5 font-bold">نام شما</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="مثال: پوریا"
                  className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-white outline-none focus:border-[#0071e3]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 font-bold">امتیاز شما</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 text-zinc-500 hover:text-amber-400 transition"
                    >
                      <Star
                        size={20}
                        className={s <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-600"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 font-bold">متن دیدگاه</label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="کیفیت ساخت، عملکرد و نظر کلی درباره این کالا..."
                  className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-white outline-none focus:border-[#0071e3]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Send size={14} />
                {loading ? "در حال ثبت..." : "ارسال دیدگاه"}
              </button>
            </form>
          )}
        </div>

        {/* لیست نظرات ثبت‌شده */}
        <div className="lg:col-span-2 space-y-3">
          {reviews.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center text-xs text-zinc-500 font-bold">
              هنوز نظری برای این کالا ثبت نشده است. اولین نفری باشید که دیدگاه خود را مطرح می‌کند!
            </div>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-4 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{rev.user_name}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-zinc-700"}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{rev.comment}</p>
                <div className="text-[10px] text-zinc-500 text-left">
                  {new Date(rev.created_at).toLocaleDateString("fa-IR")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
