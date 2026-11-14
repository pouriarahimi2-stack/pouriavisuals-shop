// File Path: app/admin/reviews/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

interface ReviewRecord {
  id: string;
  product_id?: string;
  product_title?: string;
  product_image?: string;
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

interface CatalogProductOption {
  id: string;
  title: string;
  image: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [products, setProducts] = useState<CatalogProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  // فیلترها
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // پاسخ و ویرایش دیدگاه
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editRatingVal, setEditRatingVal] = useState<number>(5);

  // فرم ثبت دیدگاه جدید توسط ادمین
  const [newProdId, setNewProdId] = useState<string>("");
  const [newUserName, setNewUserName] = useState<string>("");
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>("");
  const [newAdminReply, setNewAdminReply] = useState<string>("");
  const [submittingNew, setSubmittingNew] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);

  // فرم ارسال پیامک دعوت به ثبت نظر
  const [smsPhone, setSmsPhone] = useState<string>("");
  const [smsCustomerName, setSmsCustomerName] = useState<string>("");
  const [smsProductId, setSmsProductId] = useState<string>("");
  const [sendingSms, setSendingSms] = useState<boolean>(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchReviewsAndProducts = useCallback(async () => {
    try {
      const [revRes, prodRes] = await Promise.all([
        fetch("/api/admin/reviews?t=" + Date.now(), { cache: "no-store" }).catch(
          () => null
        ),
        fetch("/api/products?t=" + Date.now(), { cache: "no-store" }).catch(
          () => null
        ),
      ]);

      if (revRes && revRes.ok) {
        const json = await revRes.json();
        if (json.success) {
          setReviews(json.reviews || json.data || []);
        }
      }

      if (prodRes && prodRes.ok) {
        const pJson = await prodRes.json();
        const pList = pJson.data || pJson.products || [];
        if (Array.isArray(pList)) {
          const mapped = pList.map((p: any) => ({
            id: String(p.id),
            title: p.title || p.name || "محصول کاتالوگ",
            image: p.image || "/placeholder.png",
          }));
          setProducts(mapped);
          if (mapped.length > 0) {
            setNewProdId((prev) => prev || mapped[0].id);
            setSmsProductId((prev) => prev || mapped[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Error loading reviews:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewsAndProducts();

    const channel = supabase
      .channel("realtime-admin-reviews-hub")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => fetchReviewsAndProducts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_reviews" },
        () => fetchReviewsAndProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReviewsAndProducts]);

  const handleSeedCatalogReviews = async () => {
    soundEngine.playClick();
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_catalog_reviews" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        await fetchReviewsAndProducts();
      } else {
        notify(json.message || "خطا در تولید دیدگاه‌های اولیه.", "error");
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateAdminReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdId || !newComment.trim()) return;
    soundEngine.playClick();
    setSubmittingNew(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: newProdId,
          user_name: newUserName.trim() || "خریدار تاییدشده آکسون",
          rating: newRating,
          comment: newComment.trim(),
          admin_reply: newAdminReply.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        setNewUserName("");
        setNewComment("");
        setNewAdminReply("");
        setNewRating(5);
        await fetchReviewsAndProducts();
      } else {
        notify(json.message || "خطا در ثبت دیدگاه.", "error");
      }
    } finally {
      setSubmittingNew(false);
    }
  };

  const handleSendReviewInviteSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsPhone.trim()) return;
    soundEngine.playClick();
    setSendingSms(true);
    try {
      const targetProd = products.find((p) => p.id === smsProductId);
      const res = await fetch("/api/admin/sms/review-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: smsPhone.trim(),
          customerName: smsCustomerName.trim(),
          productId: smsProductId,
          productTitle: targetProd?.title || "",
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        setSmsPhone("");
        setSmsCustomerName("");
      } else {
        notify(json.message || "خطا در ارسال پیامک نظرسنجی.", "error");
      }
    } finally {
      setSendingSms(false);
    }
  };

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
        notify(
          nextApproved
            ? "✓ دیدگاه تایید و در صفحه محصول منتشر شد."
            : "دیدگاه به حالت در انتظار تایید تغییر یافت."
        );
        await fetchReviewsAndProducts();
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
        notify("✓ پاسخ رسمی مدیریت ثبت و دیدگاه تایید شد.");
        setReplyingId(null);
        setReplyText("");
        await fetchReviewsAndProducts();
      }
    } catch {}
  };

  const handleSaveEditedReview = async (id: string) => {
    if (!editCommentText.trim()) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          comment: editCommentText.trim(),
          rating: editRatingVal,
        }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        notify("✓ متن و امتیاز دیدگاه با موفقیت ویرایش شد.");
        setEditingId(null);
        await fetchReviewsAndProducts();
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف کامل این دیدگاه اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/admin/reviews?id=" + encodeURIComponent(id), {
        method: "DELETE",
      });
      if (res.ok) {
        soundEngine.playSuccess();
        notify("✓ دیدگاه با موفقیت حذف گردید.");
        await fetchReviewsAndProducts();
      }
    } catch {}
  };

  const approvedCount = reviews.filter(
    (r) => r.is_approved === true || r.status === "approved"
  ).length;
  const pendingCount = Math.max(0, reviews.length - approvedCount);
  const avgStoreRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) /
          reviews.length
        ).toFixed(1)
      : "5.0";

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const isApp = r.is_approved === true || r.status === "approved";
      if (filter === "approved" && !isApp) return false;
      if (filter === "pending" && isApp) return false;
      if (productFilter !== "all" && String(r.product_id) !== productFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (r.user_name || r.author_name || "").toLowerCase().includes(q) ||
        (r.comment || r.content || "").toLowerCase().includes(q) ||
        (r.product_title || "").toLowerCase().includes(q)
      );
    });
  }, [reviews, filter, productFilter, searchQuery]);

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      {/* هدر اصلی و دکمه تولید هوشمند دیدگاه‌های سئو */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⭐</span> مدیریت دیدگاه‌ها، امتیازات و نظرات خریداران (Realtime)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تایید انتشار، ثبت پاسخ رسمی مدیریت، افزودن دیدگاه‌های تاییدشده و ارسال پیامک نظرسنجی به خریداران
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto text-xs font-bold">
          <button
            type="button"
            onClick={handleSeedCatalogReviews}
            disabled={seeding}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer transition disabled:opacity-50"
          >
            {seeding
              ? "⏳ در حال ثبت دیدگاه‌ها..."
              : "⚡ تولید دیدگاه‌های اولیه سئو برای کاتالوگ"}
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={
              "px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (filter === "all"
                ? "bg-[var(--accent-blue)] text-white shadow"
                : "bg-[var(--input-bg)] border border-[var(--card-border)]")
            }
          >
            همه ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={
              "px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (filter === "pending"
                ? "bg-amber-500 text-slate-950 font-black"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-amber-400")
            }
          >
            در انتظار تایید ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("approved")}
            className={
              "px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (filter === "approved"
                ? "bg-emerald-600 text-white"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-emerald-400")
            }
          >
            تایید شده ✓ ({approvedCount})
          </button>
        </div>
      </div>

      {/* کارت‌های آماری KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md">
          <span className="text-[var(--text-secondary)] font-bold block">کل دیدگاه‌های ثبت‌شده</span>
          <span className="text-2xl font-black font-mono text-[var(--accent-blue)] mt-1 block">
            {reviews.length}
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md">
          <span className="text-[var(--text-secondary)] font-bold block">منتشرشده در صفحات کالا</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
            {approvedCount}
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md">
          <span className="text-[var(--text-secondary)] font-bold block">در انتظار بررسی</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
            {pendingCount}
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md">
          <span className="text-[var(--text-secondary)] font-bold block">میانگین امتیاز رضایت کل</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
            {avgStoreRating} ★
          </span>
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

      {/* گرید ۱۲ ستونی استاندارد: ۴ ستون ابزارهای ثبت دیدگاه و پیامک نظرسنجی، ۸ ستون لیست دیدگاه‌ها */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
        {/* ستون راست (۴ ستون): ثبت دیدگاه جدید + ارسال پیامک دعوت به نظرسنجی */}
        <div className="lg:col-span-4 space-y-6">
          {/* فرم ثبت مستقیم دیدگاه برای محصول */}
          <form
            onSubmit={handleCreateAdminReview}
            className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3.5"
          >
            <h2 className="font-black text-sm text-[var(--accent-blue)]">
              ✍️ ثبت مستقیم دیدگاه برای محصول کاتالوگ
            </h2>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">
                انتخاب محصول *
              </label>
              <select
                required
                value={newProdId}
                onChange={(e) => setNewProdId(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer text-[var(--text-primary)]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    📦 {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">
                  نام خریدار
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: علی حسینی"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">
                  امتیاز (۱ تا ۵)
                </label>
                <select
                  value={newRating}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none cursor-pointer"
                >
                  {[5, 4, 3, 2, 1].map((s) => (
                    <option key={s} value={s}>
                      {s} ★ ستاره
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">
                متن دیدگاه خریدار *
              </label>
              <textarea
                rows={3}
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="تجربه خرید و کیفیت محصول..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">
                پاسخ رسمی مدیریت (اختیاری)
              </label>
              <input
                type="text"
                value={newAdminReply}
                onChange={(e) => setNewAdminReply(e.target.value)}
                placeholder="پاسخ فروشگاه آکسون کور در زیر این نظر..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingNew}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer hover:opacity-95 transition disabled:opacity-50"
            >
              {submittingNew ? "در حال ثبت..." : "+ ثبت و انتشار دیدگاه در صفحه کالا"}
            </button>
          </form>

          {/* فرم ارسال پیامک دعوت به ثبت دیدگاه برای خریداران */}
          <form
            onSubmit={handleSendReviewInviteSms}
            className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3.5"
          >
            <h2 className="font-black text-sm text-emerald-400">
              📲 ارسال پیامک دعوت به نظرسنجی خریدار
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              ارسال مستقیم لینک محصول به موبایل مشتری جهت ثبت امتیاز و تجربه خرید:
            </p>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">
                شماره موبایل خریدار *
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="09123456789"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">
                نام خریدار (اختیاری)
              </label>
              <input
                type="text"
                value={smsCustomerName}
                onChange={(e) => setSmsCustomerName(e.target.value)}
                placeholder="مثال: جناب رضایی"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">
                محصول خریداری‌شده
              </label>
              <select
                value={smsProductId}
                onChange={(e) => setSmsProductId(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={sendingSms}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer transition disabled:opacity-50"
            >
              {sendingSms ? "در حال ارسال پیامک..." : "ارسال پیامک دعوت به ثبت نظر 🚀"}
            </button>
          </form>
        </div>

        {/* ستون چپ (۸ ستون): لیست دیدگاه‌ها و فیلتر بر اساس محصول */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 pb-3 border-b border-[var(--card-border)]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 جستجو در نام کاربر، متن دیدگاه یا نام محصول..."
              className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
            />
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="sm:w-64 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              <option value="all">همه محصولات کاتالوگ</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  📦 {p.title}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 font-bold">
              در حال دریافت دیدگاه‌ها...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-bold space-y-3">
              <p>هیچ دیدگاهی در این بخش وجود ندارد.</p>
              <button
                type="button"
                onClick={handleSeedCatalogReviews}
                disabled={seeding}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-black cursor-pointer shadow-md"
              >
                ⚡ تولید خودکار دیدگاه‌های اولیه برای محصولات کاتالوگ
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[760px] overflow-y-auto pr-1">
              {filtered.map((rev) => {
                const isApproved =
                  rev.is_approved === true || rev.status === "approved";
                const author = rev.user_name || rev.author_name || "کاربر آکسون";
                const bodyText = rev.comment || rev.content || "";

                return (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3"
                  >
                    {/* نوار اطلاعات محصول مرتبط */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--card-border)]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={rev.product_image || "/placeholder.png"}
                          alt=""
                          className="w-9 h-9 rounded-xl object-contain bg-white/5 border border-[var(--card-border)] p-1 shrink-0"
                        />
                        <div className="truncate">
                          <span className="text-[10px] text-[var(--text-secondary)] block">
                            دیدگاه ثبت‌شده برای محصول:
                          </span>
                          <Link
                            href={`/products/${rev.product_id}`}
                            target="_blank"
                            className="font-black text-xs text-[var(--accent-blue)] hover:underline truncate block"
                          >
                            📦 {rev.product_title || "محصول فروشگاه"} 🔗
                          </Link>
                        </div>
                      </div>

                      {rev.created_at && (
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          📅 {new Date(rev.created_at).toLocaleDateString("fa-IR")}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[var(--text-primary)]">
                          👤 {author}
                        </span>
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

                      <div className="flex flex-wrap items-center gap-1.5">
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
                            setEditingId(editingId === rev.id ? null : rev.id);
                            setEditCommentText(bodyText);
                            setEditRatingVal(Number(rev.rating || 5));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
                        >
                          ✏️ ویرایش
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
                          title="حذف دیدگاه"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {editingId === rev.id ? (
                      <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">امتیاز:</span>
                          <select
                            value={editRatingVal}
                            onChange={(e) => setEditRatingVal(Number(e.target.value))}
                            className="p-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold"
                          >
                            {[5, 4, 3, 2, 1].map((s) => (
                              <option key={s} value={s}>
                                {s} ★
                              </option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          rows={3}
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--accent-blue)] outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEditedReview(rev.id)}
                            className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer"
                          >
                            ذخیره تغییرات ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
                          >
                            انصراف
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        {bodyText}
                      </p>
                    )}

                    {rev.admin_reply && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 leading-relaxed">
                        <strong>🛡️ پاسخ فروشگاه آکسون کور:</strong> {rev.admin_reply}
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
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}