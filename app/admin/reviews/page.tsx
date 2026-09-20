"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Star, Trash2, MessageSquare, CheckCircle2, User } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reviews");
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این نظر اطمینان دارید؟")) return;
    try {
      await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-10 dir-rtl font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--card-border)]">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-sm font-bold flex items-center gap-2">
              <ArrowRight size={18} />
              پیشخوان
            </Link>
            <h1 className="text-xl sm:text-2xl font-black">مدیریت دیدگاه‌ها و نظرات خریداران</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">
            پایش و مدیریت نظرات ثبت‌شده خریداران در صفحات محصولات
          </p>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="text-center py-20 text-xs font-bold text-slate-400">در حال بارگذاری نظرات...</div>
        ) : reviews.length === 0 ? (
          <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center text-xs font-bold text-[var(--text-secondary)] space-y-2 shadow-sm">
            <MessageSquare size={36} className="mx-auto text-slate-400 mb-2" />
            <p>هنوز دیدگاهی از سمت خریداران ثبت نشده است.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-sm text-xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center">
                        <User size={15} />
                      </div>
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{rev.author_name || rev.user_name}</div>
                        <div className="text-[10px] text-slate-400">{new Date(rev.created_at).toLocaleDateString("fa-IR")}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-400">
                      <span>★</span>
                      <span className="font-bold">{rev.rating}</span>
                    </div>
                  </div>

                  <p className="text-[var(--text-secondary)] mt-3 leading-relaxed font-medium">{rev.comment}</p>
                </div>

                <div className="pt-3 border-t border-[var(--card-border)] flex justify-end">
                  <button onClick={() => handleDelete(rev.id)} className="p-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer">
                    <Trash2 size={14} />
                    <span>حذف نظر</span>
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
