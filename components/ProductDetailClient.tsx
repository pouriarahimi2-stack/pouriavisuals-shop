"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, ChevronRight, ChevronLeft, Star, Play, X, ShoppingCart, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

interface ProductDetailClientProps {
  initialProduct?: any;
  productId?: string;
}

// تابع اختصاصی و تضمینی استخراج متادیتا و تمیزکاری توضیحات
function cleanAndExtractProduct(raw: any) {
  if (!raw) return null;

  let rawDesc = String(raw.description || "");
  let extractedImages: string[] = [];
  let extractedWarranty = raw.warranty || "";
  let extractedVideo = raw.video_url || "";
  let extractedSpecs: Record<string, string> = raw.specs || {};

  // ۱. جداسازی کامل بخش JSON متادیتا
  if (rawDesc.includes("MEDIA_METADATA")) {
    const parts = rawDesc.split(/<!--MEDIA_METADATA:|MEDIA_METADATA:/i);
    rawDesc = parts[0] ? parts[0].trim() : "";
    if (parts[1]) {
      const cleanJsonStr = parts[1].replace(/-->[sS]*$/g, "").trim();
      const firstBrace = cleanJsonStr.indexOf("{");
      const lastBrace = cleanJsonStr.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          const meta = JSON.parse(cleanJsonStr.slice(firstBrace, lastBrace + 1));
          if (Array.isArray(meta.images) && meta.images.length > 0) extractedImages = meta.images;
          if (meta.video_url) extractedVideo = meta.video_url;
          if (meta.specs && typeof meta.specs === "object") extractedSpecs = meta.specs;
          if (meta.warranty) extractedWarranty = meta.warranty;
        } catch (e) {
          console.warn("Metadata JSON parse warning:", e);
        }
      }
    }
  }

  // ۲. حذف هرگونه تگ نشت‌کرده دیگر
  rawDesc = rawDesc
    .replace(/<!--[sS]*?-->/g, "")
    .replace(/MEDIA_METADATA:[sS]*$/g, "")
    .replace(/images":[[sS]*$/g, "")
    .trim();

  // ۳. تضمین وجود عکس‌ها
  if (extractedImages.length === 0) {
    if (Array.isArray(raw.images) && raw.images.length > 0) {
      extractedImages = raw.images;
    } else if (raw.image_url || raw.image) {
      extractedImages = [raw.image_url || raw.image];
    } else {
      extractedImages = ["/placeholder.png"];
    }
  }

  return {
    ...raw,
    cleanDescription: rawDesc,
    parsedImages: extractedImages,
    parsedWarranty: extractedWarranty,
    parsedVideo: extractedVideo,
    parsedSpecs: extractedSpecs,
  };
}

export default function ProductDetailClient({ initialProduct, productId }: ProductDetailClientProps) {
  const params = useParams();
  const router = useRouter();
  const id = ((params?.id as string) || productId || "") as string;

  const { addToCart } = useCart();

  // از همان ابتدا محصول را تمیزکاری و پارس شده مقداردهی می‌کنیم تا در رندر اول هم متن خراب دیده نشود
  const [product, setProduct] = useState<any>(() => cleanAndExtractProduct(initialProduct));
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const [existingReviews, setExistingReviews] = useState<any[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState("");
  const [commentStatus, setCommentStatus] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleAddToCartAndCheckout = () => {
    if (!product || isRedirecting) return;

    soundEngine.playAddToCart();
    setIsRedirecting(true);

    const itemPrice = Number(product.discount_price || product.discountPrice || product.price || 0);
    const itemImage = (Array.isArray(product.parsedImages) && product.parsedImages.length > 0 && product.parsedImages[0]) ||
      product.image_url ||
      product.image ||
      "/placeholder.png";

    addToCart({
      id: String(product.id),
      title: product.title || product.name || "کالای دیجیتال",
      name: product.title || product.name,
      price: itemPrice,
      discountPrice: product.discount_price ? Number(product.discount_price) : undefined,
      image: itemImage,
      images: [itemImage],
      stock: product.stock !== undefined ? Number(product.stock) : 10,
      category: product.category || "عمومی",
      quantity: 1,
    }, false);

    setTimeout(() => {
      router.push("/checkout");
    }, 400);
  };

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/products?id=${id}`);
      const data = await res.json();
      let found = null;
      if (data.product) found = data.product;
      else if (data.data) {
        if (Array.isArray(data.data)) found = data.data.find((p: any) => String(p.id) === String(id));
        else found = data.data;
      }

      if (found) {
        setProduct(cleanAndExtractProduct(found));
      }
    } catch {}
  }, [id]);

  const fetchApprovedReviews = useCallback(async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/reviews?product_id=${id}`);
      const d = await r.json();
      if (d.success && Array.isArray(d.reviews)) {
        setExistingReviews(d.reviews.filter((item: any) => item.is_approved !== false));
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchDetail();
    fetchApprovedReviews();

    if (supabaseBrowser && typeof supabaseBrowser.channel === "function") {
      const client = supabaseBrowser;
      const channel = client
        .channel(`product-${id}-realtime`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products", filter: `id=eq.${id}` },
          () => fetchDetail()
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [id, fetchDetail, fetchApprovedReviews]);

  if (!product && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dir-rtl text-xs font-bold text-[var(--text-secondary)]">
        در حال بارگذاری اطلاعات کالا...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dir-rtl gap-4 font-sans select-none">
        <p className="text-sm font-bold text-[var(--text-primary)]">کالای مورد نظر یافت نشد.</p>
        <Link href="/products" className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs">
          بازگشت به کاتالوگ محصولات
        </Link>
      </div>
    );
  }

  const gallery: string[] = product.parsedImages && product.parsedImages.length > 0
    ? product.parsedImages 
    : ["/placeholder.png"];

  const handleNext = () => setActiveImageIndex((prev) => (prev + 1) % gallery.length);
  const handlePrev = () => setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);

  const getEmbedUrl = (raw: string) => {
    if (!raw) return "";
    let url = raw.trim();
    if (url.includes("aparat.com/v/")) {
      const hash = url.split("aparat.com/v/")[1]?.split("/")[0]?.split("?")[0];
      return `https://www.aparat.com/video/video/embed/videohash/${hash}/vt/frame`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("watch?v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const embedVideo = getEmbedUrl(product.parsedVideo);

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
        fetchApprovedReviews();
      } else {
        setCommentStatus("error");
      }
    } catch {
      setCommentStatus("error");
    }
  };

  const finalPrice = Number(product.discount_price || product.discountPrice || product.price || 0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 dir-rtl font-sans select-none">
      <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6 font-bold">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <Link href="/products" className="hover:underline">کاتالوگ کالاها</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)]">{product.title || product.name}</span>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* گالری تصاویر همراه با دکمه‌های اسلاید و ویدیوی دستگاه */}
        <div className="flex flex-col items-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 relative shadow-md">
          <div className="w-full h-64 sm:h-80 md:h-96 relative flex items-center justify-center overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5">
            <img
              src={gallery[activeImageIndex]}
              alt={product.title}
              className="w-full h-full object-contain transition-all duration-300 select-none p-2"
            />

            {embedVideo && (
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="absolute bottom-3 left-3 px-4 py-2 rounded-2xl bg-black/75 hover:bg-black text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-lg border border-white/10 transition cursor-pointer z-20"
              >
                <Play size={14} className="text-rose-500 fill-rose-500" />
                ویدیوی معرفی دستگاه
              </button>
            )}

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black text-white transition z-10 cursor-pointer shadow-lg"
                  title="تصویر قبلی"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black text-white transition z-10 cursor-pointer shadow-lg"
                  title="تصویر بعدی"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto p-2 max-w-full">
              {gallery.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-1 bg-black/5 dark:bg-white/5 cursor-pointer ${
                    activeImageIndex === idx ? "border-[var(--accent-blue)] scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* مشخصات و دکمه خرید با هدایت مستقیم به چک‌اوت */}
        <div className="flex flex-col space-y-6">
          <div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/15 text-[var(--accent-blue)]">
              {product.category || "لوازم دیجیتال و هوشمند"}
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black mt-3 leading-snug">{product.title || product.name}</h1>
          </div>

          {product.parsedWarranty && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-blue-500 w-fit">
              <ShieldCheck size={18} />
              <span>{product.parsedWarranty}</span>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-[var(--text-secondary)]">قیمت محصول:</span>
            <div className="text-left font-black font-mono">
              <div className="text-2xl text-emerald-500" suppressHydrationWarning>
                {formatPrice(finalPrice)} تومان
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCartAndCheckout}
            className={`w-full py-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
              isRedirecting 
                ? "bg-emerald-600 text-white scale-[0.99]" 
                : "bg-[var(--accent-blue)] hover:opacity-90 text-white shadow-blue-500/25"
            }`}
          >
            {isRedirecting ? (
              <>
                <Check size={20} />
                <span>در حال انتقال به صفحه ثبت سفارش و پرداخت...</span>
              </>
            ) : (
              <>
                <ShoppingCart size={20} />
                <span>ثبت سفارش و ادامه خرید ←</span>
              </>
            )}
          </button>

          {/* توضیحات تمیز بدون هیچ‌گونه متن نشت‌کرده */}
          {product.cleanDescription && (
            <div>
              <h2 className="text-sm font-black mb-3">توضیحات و مشخصات کالا</h2>
              <div className="text-xs leading-loose text-[var(--text-secondary)] font-medium whitespace-pre-line bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
                {product.cleanDescription}
              </div>
            </div>
          )}

          {/* مشخصات فنی تفکیک‌شده */}
          {product.parsedSpecs && Object.keys(product.parsedSpecs).length > 0 && (
            <div>
              <h2 className="text-sm font-black mb-3">مشخصات فنی دستگاه</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(product.parsedSpecs).map(([k, v]: any) => (
                  <div key={k} className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex justify-between text-xs shadow-sm">
                    <span className="text-[var(--text-secondary)] font-bold">{k}:</span>
                    <span className="font-bold text-[var(--text-primary)]">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* مدال ویدیو */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#27272a] flex justify-between items-center">
              <h3 className="text-sm font-black text-white">ویدیوی معرفی محصول</h3>
              <button onClick={() => setIsVideoModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={embedVideo}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
