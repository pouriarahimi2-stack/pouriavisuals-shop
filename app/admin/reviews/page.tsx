"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Star, Trash2, MessageSquare, CheckCircle2, User } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این نظر اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      alert("خطا در حذف نظر");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-10 dir-rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--card-border)]">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-hover)] text-sm font-bold flex items-center gap-2"
            >
              <ArrowRight size={18} />
              پیشخوان
            </Link>
            <h1 className="text-xl sm:text-2xl font-black">مدیریت دیدگاه‌ها و نظرات</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            پایش و مدیریت نظرات ثبت‌شده کاربران برای محصولات فروشگاه
          </p>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="text-center py-20 text-xs font-bold text-zinc-400">
            در حال بارگذاری نظرات...
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center text-xs text-zinc-500 font-bold">
            <MessageSquare size={36} className="mx-auto text-zinc-600 mb-3" />
            هنوز دیدگاهی ثبت نشده است.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300">
                        <User size={15} />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white">{rev.user_name}</div>
                        <div className="text-[10px] text-zinc-500">
                          {new Date(rev.created_at).toLocaleDateString("fa-IR")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-zinc-700"}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                    کالا: {rev.products?.title || "محصول فروشگاه"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(rev.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Trash2 size={14} />
                    حذف نظر
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
