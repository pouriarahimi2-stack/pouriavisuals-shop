// File Path: app/admin/reviews/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

interface ReviewRecord {
  id: string;
  product_id?: string;
  product_title?: string;
  user_name?: string;
  author_name?: string;
  rating: number;
  comment?: string;
  content?: string;
  admin_reply?: string;
  is_approved?: boolean;
  status?: string;
  created_at?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/admin/reviews", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setReviews(json.reviews || json.data || []);
      }
    } catch (e) {
      console.error("Error loading reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();

    const channel = supabase
      .channel("realtime-admin-reviews")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggleApprove = async (rev: ReviewRecord) => {
    soundEngine.playClick();
    const currentlyApproved = rev.is_approved === true || rev.status === "approved";
    const nextApproved = !currentlyApproved;

    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rev.id,
          is_approved: nextApproved,
          status: nextApproved ? "approved" : "pending",
        }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        setFeedback(nextApproved ? "✓ دیدگاه تایید و در صفحه محصول منتشر شد." : "دیدگاه به حالت انتظار تغییر یافت.");
        fetchReviews();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {}
  };

  const handleSaveReply = async (id: string) => {
    soundEngine.playClick();
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          admin_reply: replyText.trim(),
          is_approved: true,
          status: "approved",
        }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        setFeedback("✓ پاسخ مدیریت ثبت و دیدگاه تایید شد.");
        setReplyingId(null);
        setReplyText("");
        fetchReviews();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این دیدگاه اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/admin/reviews?id=" + encodeURIComponent(id), {
        method: "DELETE",
      });
      if (res.ok) {
        soundEngine.playSuccess();
        fetchReviews();
      }
    } catch {}
  };

  const filtered = reviews.filter((r) => {
    const isApp = r.is_approved === true || r.status === "approved";
    if (filter === "approved") return isApp;
    if (filter === "pending") return !isApp;
    return true;
  });

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⭐</span> مدیریت دیدگاه‌ها، امتیازات و نظرات خریداران (Realtime)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تایید انتشار، ثبت پاسخ رسمی مدیریت و نظارت بلادرنگ بر دیدگاه‌های صفحات محصول
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto text-xs font-bold">
          <button
            onClick={() => setFilter("all")}
            className={
              "flex-1 sm:flex-initial px-4 py-2 rounded-xl transition cursor-pointer " +
              (filter === "all"
                ? "bg-[var(--accent-blue)] text-white shadow"
                : "bg-[var(--input-bg)] border border-[var(--card-border)]")
            }
          >
            همه ({reviews.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={
              "flex-1 sm:flex-initial px-4 py-2 rounded-xl transition cursor-pointer " +
              (filter === "pending"
                ? "bg-amber-500 text-slate-950 font-black"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-amber-400")
            }
          >
            در انتظار تایید
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={
              "flex-1 sm:flex-initial px-4 py-2 rounded-xl transition cursor-pointer " +
              (filter === "approved"
                ? "bg-emerald-600 text-white"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-emerald-400")
            }
          >
            تایید شده ✓
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold animate-fadeIn">
          {feedback}
        </div>
      )}

      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3 text-xs">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold">در حال دریافت دیدگاه‌ها...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold">هیچ دیدگاهی در این بخش وجود ندارد.</div>
        ) : (
          filtered.map((rev) => {
            const isApproved = rev.is_approved === true || rev.status === "approved";
            const author = rev.user_name || rev.author_name || "کاربر آکسون";
            const bodyText = rev.comment || rev.content || "";

            return (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[var(--text-primary)]">{author}</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 font-mono font-bold text-[11px]">
                      {"★".repeat(Math.max(1, Math.min(5, Number(rev.rating || 5))))}
                    </span>
                    <span
                      className={
                        "px-2.5 py-0.5 rounded-lg text-[10px] font-bold " +
                        (isApproved
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400")
                      }
                    >
                      {isApproved ? "منتشر شده ✓" : "در انتظار تایید"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleApprove(rev)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-emerald-500 font-bold cursor-pointer"
                    >
                      {isApproved ? "لغو انتشار" : "✓ تایید انتشار"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingId(replyingId === rev.id ? null : rev.id);
                        setReplyText(rev.admin_reply || "");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 font-bold cursor-pointer"
                    >
                      💬 پاسخ مدیریت
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rev.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <p className="text-[var(--text-secondary)] leading-relaxed">{bodyText}</p>

                {rev.admin_reply && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <strong>پاسخ فروشگاه آکسون:</strong> {rev.admin_reply}
                  </div>
                )}

                {replyingId === rev.id && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="پاسخ رسمی مدیریت به این دیدگاه..."
                      className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveReply(rev.id)}
                      className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer"
                    >
                      ثبت پاسخ 💾
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
