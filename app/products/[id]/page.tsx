"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, ChevronRight, ChevronLeft, Star, ShoppingCart, Video } from "lucide-react";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState("");
  const [commentStatus, setCommentStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/products?id=${id}`);
        const data = await res.json();
        let found = null;
        if (data.product) found = data.product;
        else if (data.products) found = data.products.find((p: any) => p.id === id);

        if (found) {
          let rawDesc = found.description || "";
          let extractedImages: string[] = [];
          let extractedWarranty = found.warranty || "";
          let extractedVideo = found.video_url || "";
          let extractedSpecs = found.specs || {};

          const metaMatch = rawDesc.match(/<!--MEDIA_METADATA:([\s\S]*?)-->/);
          if (metaMatch) {
            try {
              const meta = JSON.parse(metaMatch[1]);
              if (Array.isArray(meta.images) && meta.images.length > 0) extractedImages = meta.images;
              if (meta.warranty) extractedWarranty = meta.warranty;
              if (meta.video_url) extractedVideo = meta.video_url;
              if (meta.specs) extractedSpecs = meta.specs;
              rawDesc = rawDesc.replace(metaMatch[0], "").trim();
            } catch (e) {}
          }

          if (extractedImages.length === 0 && found.image_url) {
            extractedImages = [found.image_url];
          }

          found.parsedImages = extractedImages;
          found.parsedWarranty = extractedWarranty;
          found.parsedVideo = extractedVideo;
          found.parsedSpecs = extractedSpecs;
          found.cleanDescription = rawDesc;

          setProduct(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center dir-rtl text-sm font-bold">در حال بارگذاری اطلاعات کالا...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dir-rtl gap-4">
        <p className="text-base font-bold">کالای مورد نظر یافت نشد.</p>
        <Link href="/products" className="px-5 py-2.5 rounded-2xl bg-[#0071e3] text-white font-bold text-xs">
          بازگشت به کاتالوگ
        </Link>
      </div>
    );
  }

  const gallery: string[] = product.parsedImages && product.parsedImages.length > 0
    ? product.parsedImages 
    : ["/placeholder.png"];

  const handleNext = () => setActiveImageIndex((prev) => (prev + 1) % gallery.length);
  const handlePrev = () => setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) return;
    try {
      setCommentStatus("submitting");
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          author_name: authorName,
          rating,
          comment: commentText,
        }),
      });
      if (res.ok) {
        setCommentStatus("success");
        setAuthorName("");
        setCommentText("");
      } else {
        setCommentStatus("error");
      }
    } catch (e) {
      setCommentStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 lg:p-12 dir-rtl">
      <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-8">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <Link href="/products" className="hover:underline">کاتالوگ</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-bold">{product.title || product.name}</span>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* اسلایدر با قابلیت ورق زدن تصاویر متعدد */}
        <div className="flex flex-col items-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 relative shadow-sm">
          <div className="w-full h-80 sm:h-96 relative flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-950/40">
            <img
              src={gallery[activeImageIndex]}
              alt={product.title}
              className="w-full h-full object-contain transition-all duration-300 select-none"
            />
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white transition z-10"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white transition z-10"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>

          {/* تصاویر بندانگشتی جهت ورق‌زدن مستقیم */}
          {gallery.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto p-2 max-w-full">
              {gallery.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? "border-[#0071e3] scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-contain bg-black/20" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* مشخصات و قیمت */}
        <div className="flex flex-col space-y-6">
          <div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400">
              {product.category || "عمومی"}
            </span>
            <h1 className="text-2xl lg:text-3xl font-black mt-3 leading-snug">{product.title || product.name}</h1>
          </div>

          {/* مدت گارانتی در صورت تعریف شدن */}
          {product.parsedWarranty && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs font-bold text-blue-400 w-fit">
              <ShieldCheck size={18} />
              <span>{product.parsedWarranty}</span>
            </div>
          )}

          {/* باکس قیمت بدون کلمات هاردکد اضافه */}
          <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">قیمت:</span>
            <div className="text-left font-black">
              <div className="text-2xl text-emerald-400">{Number(product.price || 0).toLocaleString("fa-IR")} تومان</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">
                {(Number(product.price || 0) * 10).toLocaleString("fa-IR")} ریال
              </div>
            </div>
          </div>

          {/* توضیحات کالا */}
          {product.cleanDescription && (
            <div>
              <h2 className="text-sm font-black mb-3">توضیحات کالا</h2>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-line bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-3xl">
                {product.cleanDescription}
              </p>
            </div>
          )}

          {/* مشخصات تفکیک شده */}
          {product.parsedSpecs && Object.keys(product.parsedSpecs).length > 0 && (
            <div>
              <h2 className="text-sm font-black mb-3">مشخصات فنی</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(product.parsedSpecs).map(([k, v]: any) => (
                  <div key={k} className="p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">{k}:</span>
                    <span className="font-bold text-[var(--text-primary)]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ویدیو محصول در صورت وجود */}
          {product.parsedVideo && (
            <div className="pt-2">
              <h2 className="text-sm font-black mb-3 flex items-center gap-2">
                <Video size={18} className="text-rose-500" />
                ویدیوی معرفی دستگاه
              </h2>
              <div className="rounded-2xl overflow-hidden border border-[var(--card-border)] aspect-video bg-black flex items-center justify-center">
                <iframe src={product.parsedVideo} className="w-full h-full" allowFullScreen />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* بخش ثبت دیدگاه */}
      <div className="max-w-4xl mx-auto mt-16 pt-10 border-t border-[var(--card-border)]">
        <h2 className="text-lg font-black mb-6 flex items-center gap-2">
          <Star size={20} className="text-amber-400" />
          ثبت نظر و تجربه استفاده
        </h2>

        <form onSubmit={handleCommentSubmit} className="space-y-4 bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-2">نام و نام خانوادگی *</label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="مثال: علی محمدی"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[#0071e3]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2">امتیاز کیفی</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[#0071e3]"
              >
                <option value={5}>عالی (۵ از ۵)</option>
                <option value={4}>خیلی خوب (۴ از ۵)</option>
                <option value={3}>متوسط (۳ از ۵)</option>
                <option value={2}>ضعیف (۲ از ۵)</option>
                <option value={1}>بسیار ضعیف (۱ از ۵)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-2">متن دیدگاه یا نقد شما *</label>
            <textarea
              required
              rows={4}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="دیدگاه خود را بنویسید..."
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[#0071e3]"
            />
          </div>

          <button type="submit" className="px-6 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold text-xs">
            {commentStatus === "submitting" ? "در حال ثبت..." : "ثبت و ارسال دیدگاه"}
          </button>

          {commentStatus === "success" && (
            <p className="text-xs font-bold text-emerald-400 mt-2">دیدگاه شما ثبت گردید.</p>
          )}
        </form>
      </div>
    </div>
  );
}
