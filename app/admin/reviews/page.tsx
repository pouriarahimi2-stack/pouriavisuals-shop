"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle, Trash2, Star, MessageSquare } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();

    // وب‌سوکت بلادرنگ برای دریافت آنی نظرات جدید در پنل ادمین
    if (supabaseBrowser && typeof supabaseBrowser.channel === "function") {
      const client = supabaseBrowser;
      const channel = client
        .channel("admin-reviews-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reviews" },
          () => {
            fetchReviews();
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [fetchReviews]);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_approved: !currentStatus }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, is_approved: !currentStatus } : r))
        );
      }
    } catch (err) {
      alert("خطا در تغییر وضعیت تایید دیدگاه");
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("آیا از حذف کامل این دیدگاه مطمئن هستید؟")) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      alert("خطا در حذف دیدگاه");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 lg:p-10 dir-rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[var(--card-border)]">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-hover)] text-sm font-bold flex items-center gap-2">
              <ArrowRight size={18} />
              پیشخوان
            </Link>
            <h1 className="text-2xl font-black">مدیریت و تایید دیدگاه‌های کاربران</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            بررسی بلادرنگ نقدها و امتیازهای ثبت‌شده برای کالاها
          </p>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="text-center py-20 text-sm font-bold text-[var(--text-secondary)]">
            در حال بارگذاری دیدگاه‌ها...
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center">
            <MessageSquare size={40} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-sm font-bold text-[var(--text-secondary)]">
              هنوز دیدگاهی ثبت نشده است.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{rev.author_name}</span>
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      <Star size={14} className="fill-amber-400" />
                      <span>{rev.rating} از ۵</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 mt-3 leading-relaxed whitespace-pre-line bg-black/20 p-3.5 rounded-2xl border border-white/5">
                    {rev.comment}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>وضعیت انتشار:</span>
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold ${
                        rev.is_approved
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {rev.is_approved ? "منتشر شده در سایت" : "در انتظار تایید"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--card-border)] flex items-center justify-end gap-2">
                  <button
                    onClick={() => toggleApproval(rev.id, Boolean(rev.is_approved))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      rev.is_approved
                        ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    {rev.is_approved ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                    {rev.is_approved ? "لغو تایید" : "تایید و انتشار"}
                  </button>
                  <button
                    onClick={() => deleteReview(rev.id)}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                    title="حذف دیدگاه"
                  >
                    <Trash2 size={15} />
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
