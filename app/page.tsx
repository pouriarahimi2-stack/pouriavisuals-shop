"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { bannerService, Banner } from "@/services/bannerService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { addToCart } = useCart();

  const loadData = async () => {
    try {
      const [prods, bans, info] = await Promise.all([
        productService.getAll ? productService.getAll() : productService.getProducts(),
        bannerService.getAll ? bannerService.getAll() : (bannerService.getActive ? bannerService.getActive() : []),
        siteInfoService.getSiteInfo(),
      ]);

      setProducts(prods || []);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
      if (info) setSiteInfo(info);
    } catch (e) {
      console.error("Error loading home page data:", e);
    }
  };

  useEffect(() => {
    // خواندن فوری از کش بدون تاخیر
    const initialSite = siteInfoService.getSiteInfoSync();
    if (initialSite) setSiteInfo(initialSite);

    loadData();

    // دریافت بلادرنگ انتخاب دسته‌بندی از هدر
    const handleCategoryChange = (e: any) => {
      setSelectedCategory(e.detail || "all");
    };

    // دریافت بلادرنگ آپدیت کالاها و بنرها از پنل ادمین
    const handleProductsUpdate = (e: any) => {
      if (e.detail) setProducts(e.detail);
      else loadData();
    };

    const handleBannersUpdate = (e: any) => {
      if (e.detail) setBanners(e.detail.filter((b: any) => b.is_active !== false && b.isActive !== false));
      else loadData();
    };

    const handleSiteUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };

    window.addEventListener("category_selected", handleCategoryChange);
    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("banners_updated", handleBannersUpdate);
    window.addEventListener("site_info_updated", handleSiteUpdate);

    // کانال هماهنگی زنده بین تب‌های مرورگر
    let prodChannel: BroadcastChannel | null = null;
    let banChannel: BroadcastChannel | null = null;
    let siteChannel: BroadcastChannel | null = null;

    if ("BroadcastChannel" in window) {
      prodChannel = new BroadcastChannel("products_sync_channel");
      prodChannel.onmessage = (event) => {
        if (event.data?.type === "SYNC_PRODUCTS") setProducts(event.data.data);
      };

      banChannel = new BroadcastChannel("banners_sync_channel");
      banChannel.onmessage = (event) => {
        if (event.data?.type === "SYNC_BANNERS") {
          setBanners(event.data.data.filter((b: any) => b.is_active !== false && b.isActive !== false));
        }
      };

      siteChannel = new BroadcastChannel("pv_site_sync");
      siteChannel.onmessage = (event) => {
        if (event.data?.type === "SITE_INFO_CHANGE") {
          setSiteInfo(event.data.data);
        }
      };
    }

    return () => {
      window.removeEventListener("category_selected", handleCategoryChange);
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("banners_updated", handleBannersUpdate);
      window.removeEventListener("site_info_updated", handleSiteUpdate);
      if (prodChannel) prodChannel.close();
      if (banChannel) banChannel.close();
      if (siteChannel) siteChannel.close();
    };
  }, []);

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true;
    const cat = (product.category || product.category_name || product.category_id || "").toLowerCase();
    const target = selectedCategory.toLowerCase();
    return cat === target || cat.includes(target) || target.includes(cat);
  });

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-none pb-20 transition-colors duration-300" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 space-y-10 mt-6">
        {/* ویترین بنرهای اصلی */}
        {banners.length > 0 ? (
          <section className="space-y-4">
            {banners.map((banner: any) => (
              <div
                key={banner.id}
                className="relative overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] p-8 md:p-14 min-h-[340px] flex items-center bg-cover bg-center shadow-2xl backdrop-blur-3xl group transition-all duration-500"
                style={{
                  backgroundImage: `linear-gradient(to left, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.4)), url(${banner.image || banner.image_url || banner.imageUrl})`,
                }}
              >
                <div className="max-w-xl space-y-4 z-10 text-white">
                  {(banner.badge || banner.badgeText || banner.badge_text) && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 text-white border border-white/30 text-[11px] font-black tracking-wide backdrop-blur-md shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {banner.badge || banner.badgeText || banner.badge_text}
                    </span>
                  )}
                  <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-white drop-shadow-md">
                    {banner.title}
                  </h1>
                  <p className="text-xs md:text-sm text-slate-200 leading-relaxed max-w-lg font-medium drop-shadow-sm">
                    {banner.subtitle}
                  </p>
                  <div className="pt-2">
                    <a
                      href={banner.link || banner.link_url || banner.buttonLink || "/#products"}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-gray-900 font-extrabold text-xs hover:bg-slate-100 transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95"
                    >
                      <span>{banner.button_text || banner.buttonText || "مشاهده و بررسی"}</span>
                      <span>←</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : (
          /* بنر پویای اطلاعات سایت در صورت نبود اسلایدر */
          <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] p-8 md:p-12 min-h-[260px] flex items-center bg-gradient-to-l from-neutral-900 to-neutral-800 text-white shadow-2xl">
            <div className="max-w-xl space-y-3 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold">
                ضمانت اصالت و سلامت ۱۰۰٪
              </span>
              <h1 className="text-2xl md:text-4xl font-black">
                {siteInfo?.site_name || siteInfo?.siteName || "فروشگاه تخصصی تجهیزات دیجیتال"}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium">
                {siteInfo?.tagline || "ارائه جدیدترین و برترین کالاها با گارانتی معتبر و ارسال سریع"}
              </p>
            </div>
          </section>
        )}

        {/* کاتالوگ محصولات با نشانگر دسته فعال */}
        <section id="products" className="space-y-6 relative">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4 px-1">
            <div>
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
                <span>📦</span> محصولات ویژه‌ی فروشگاه
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                {selectedCategory === "all" ? "تمامی کالاهای موجود با گارانتی معتبر" : `نمایش دسته‌بندی: ${selectedCategory}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCategory !== "all" && (
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    window.dispatchEvent(new CustomEvent("category_selected", { detail: "all" }));
                  }}
                  className="text-xs text-[var(--accent-blue)] hover:underline font-bold cursor-pointer"
                >
                  نمایش همه
                </button>
              )}
              <span className="px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold text-[var(--text-secondary)]">
                {filteredProducts.length} کالا
              </span>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl liquid-glass-card p-16 text-center text-[var(--text-secondary)] text-xs font-bold space-y-2">
              <span className="text-3xl block">🔍</span>
              <p>هیچ محصولی در این دسته‌بندی یافت نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <HomeProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  onOpenDetails={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* بخش مجله و مقالات تخصصی */}
        <section className="p-8 rounded-[2.5rem] liquid-glass-card space-y-6 my-12 border border-[var(--card-border)] bg-[var(--modal-bg)]/40 shadow-xl">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
            <div>
              <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span>📚</span> مجله تخصصی و راهنمای خرید
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">جدیدترین تحلیل‌های بازار و راهنمای انتخاب کالا</p>
            </div>
            <Link
              href="/blog"
              className="px-4 py-2 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-bold hover:bg-[var(--accent-blue)] hover:text-white transition shadow-sm"
            >
              مشاهده همه مقالات ←
            </Link>
          </div>

          <HomeBlogSection />
        </section>
      </div>

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      <AIAssistantChat />
    </div>
  );
}

function HomeBlogSection() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        let combined: any[] = [];
        try {
          const res = await fetch("/api/blogs");
          const data = await res.json();
          if (data.data) combined = [...data.data];
          else if (data.posts) combined = [...data.posts];
        } catch {}

        const localBlogs = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("site_blogs") || "[]") : [];
        combined = [...combined, ...localBlogs];
        const visiblePosts = combined.filter((p) => p.isVisible !== false && p.published !== false);
        const unique = Array.from(
          new Map(visiblePosts.map((item) => [item.id || item.title, item])).values()
        );
        setPosts(unique.slice(0, 3));
      } catch (e) {
        console.error("Error loading home blogs:", e);
      }
    }
    load();
  }, []);

  if (posts.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-[var(--text-muted)] font-bold">
        هنوز مقاله‌ای منتشر نشده است.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {posts.map((post) => (
        <article
          key={post.id || post.title}
          className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between hover:border-[var(--accent-blue)] transition duration-300"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-bold">
              <span>📅 {post.createdAt || post.created_at || "امروز"}</span>
              <span className="text-[var(--accent-blue)]">{post.category || "مقاله تخصصی"}</span>
            </div>
            <h4 className="font-extrabold text-xs line-clamp-2 text-[var(--text-primary)] leading-snug">
              {post.title}
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-medium">
              {post.metaDescription || post.excerpt || post.summary || post.content?.substring(0, 80) + "..."}
            </p>
          </div>
          <Link
            href={`/blog/${post.id}`}
            className="text-[11px] font-bold text-[var(--accent-blue)] hover:underline inline-block pt-2 border-t border-[var(--card-border)]"
          >
            ادامه مطلب ←
          </Link>
        </article>
      ))}
    </div>
  );
}

function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    role: "user" | "model";
    text: string;
    image?: string;
    matchedProduct?: Product | null;
  }>>([
    { role: "model", text: "سلام! من دستیار هوشمند فروشگاه هستم. می‌تونید عکس محصولی که می‌خواید رو بفرستید تا سریعاً براتون پیداش کنم! 📸🛍️" },
  ]);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || loading) return;

    const userMsg = input.trim();
    const currentImg = selectedImage;

    setInput("");
    setSelectedImage(null);

    const updatedMessages = [
      ...messages,
      { role: "user" as const, text: userMsg, image: currentImg || undefined },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const productsData = await productService.getAll();

      const validHistory = updatedMessages
        .slice(0, -1)
        .filter((m, index) => !(index === 0 && m.role === "model"))
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text || "تصویر ارسالی کاربر" }],
        }));

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          prompt: userMsg,
          role: "customer",
          productsData: productsData,
          history: validHistory,
          imageBase64: currentImg,
        }),
      });

      const data = await res.json();

      let matchedProductObj: Product | null = null;
      if (data.matchedProductId) {
        matchedProductObj = productsData.find((p) => p.id === data.matchedProductId) || null;
      }

      if (data.response || data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: data.response || data.reply,
            matchedProduct: matchedProductObj,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "متأسفانه مشکلی در پردازش عکس یا ارتباط رخ داد." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full bg-[var(--accent-blue)] text-white shadow-2xl hover:scale-105 transition cursor-pointer flex items-center gap-2 text-xs font-black border border-white/20"
        >
          <span>📸</span>
          <span>دستیار هوشمند و جستجوی عکس</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 h-[520px] rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)] backdrop-blur-2xl animate-fadeIn">
          <div className="p-4 border-b border-[var(--card-border)] flex justify-between items-center bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs">🔍</span>
              <span className="font-extrabold text-xs">دستیار و جستجوی تصویری</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed space-y-2 ${
                    m.role === "user"
                      ? "mr-auto bg-[var(--accent-blue)] text-white font-medium"
                      : "ml-auto bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--card-border)]"
                  }`}
                >
                  {m.image && (
                    <img
                      src={m.image}
                      alt="User Upload"
                      className="w-full max-h-36 object-cover rounded-xl border border-white/20"
                    />
                  )}
                  {m.text && <p className="font-medium whitespace-pre-line">{m.text}</p>}
                </div>

                {m.matchedProduct && (
                  <div className="ml-auto w-[85%] p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)] space-y-2 animate-fadeIn">
                    <div className="flex gap-2 items-center">
                      <img
                        src={m.matchedProduct.images?.[0] || m.matchedProduct.image || ""}
                        alt={m.matchedProduct.name || m.matchedProduct.title || ""}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 overflow-hidden">
                        <h5 className="font-bold truncate text-[11px] text-[var(--text-primary)]">
                          {m.matchedProduct.name || m.matchedProduct.title}
                        </h5>
                        <p className="text-[var(--accent-blue)] font-extrabold text-[11px]">
                          {(m.matchedProduct.price || 0).toLocaleString("fa-IR")} تومان
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        addToCart({
                          id: m.matchedProduct!.id,
                          name: m.matchedProduct!.name || m.matchedProduct!.title || "",
                          price: m.matchedProduct!.price,
                          image: m.matchedProduct!.images?.[0] || m.matchedProduct!.image || "",
                        })
                      }
                      className="w-full py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[10px] hover:opacity-90 transition cursor-pointer shadow-md"
                    >
                      افزودن مستقیم به سبد خرید 🛒
                    </button>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-[10px] text-[var(--text-muted)] animate-pulse font-bold">در حال آنالیز تصویر و جستجو در کالاها... 🔍</div>
            )}
          </div>

          {selectedImage && (
            <div className="px-4 py-2 bg-black/5 dark:bg-black/30 flex items-center justify-between border-t border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <img src={selectedImage} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-[10px] text-[var(--text-muted)] font-bold">تصویر آماده ارسال</span>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-xs text-rose-500 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="p-3 border-t border-[var(--card-border)] flex gap-2 items-center">
            <label className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition">
              📷
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="توضیح یا سوال (اختیاری)..."
              className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs text-[var(--text-primary)] font-medium"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition cursor-pointer"
            >
              ارسال
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeProductCard({
  product,
  onAddToCart,
  onOpenDetails,
}: {
  product: Product;
  onAddToCart: (item: any) => void;
  onOpenDetails: (product: Product) => void;
}) {
  const images = product.images && product.images.length > 0 ? product.images : [product.image || ""];
  const displayImage = images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
  const isAvailable = (product as any).is_available !== false && (product.stock === undefined || product.stock > 0);
  const productName = product.title || (product as any).name || "";

  return (
    <div className="rounded-[2rem] liquid-glass-card p-5 flex flex-col justify-between space-y-4 hover:border-[var(--accent-blue)] transition duration-300 group border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-xl">
      <div
        onClick={() => onOpenDetails(product)}
        className="relative w-full h-56 rounded-2xl overflow-hidden bg-black/5 dark:bg-black/40 flex items-center justify-center cursor-pointer border border-[var(--card-border)]"
      >
        <img
          src={displayImage}
          alt={productName}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition duration-500"
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[2px]">
          <span className="px-4 py-2 rounded-xl bg-white text-gray-900 text-xs font-extrabold border border-white/30 shadow-2xl">
            🔍 بررسی کامل کالا
          </span>
        </div>
      </div>

      <div className="space-y-2.5 cursor-pointer" onClick={() => onOpenDetails(product)}>
        <div className="flex items-center justify-between text-[10px]">
          <span className="bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 px-3 py-0.5 rounded-full font-bold">
            {product.category_name || product.category_id || (product as any).category || "کالای دیجیتال"}
          </span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-full ${
              isAvailable
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
            }`}
          >
            {isAvailable ? "موجود در انبار" : "ناموجود"}
          </span>
        </div>

        <h4 className="font-extrabold text-sm hover:text-[var(--accent-blue)] transition text-[var(--text-primary)] leading-snug line-clamp-1">
          {productName}
        </h4>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-medium">
          {(product as any).title_fa || product.description}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <span className="font-black text-base text-[var(--accent-blue)]">
            {(product.discount_price || product.price || 0).toLocaleString("fa-IR")} تومان
          </span>
          {product.discount_price && product.discount_price < product.price && (
            <span className="text-xs line-through text-[var(--text-muted)] font-mono">
              {product.price.toLocaleString("fa-IR")}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          onAddToCart({
            id: product.id,
            name: productName,
            price: product.discount_price || product.price,
            image: displayImage,
            stock: product.stock ?? 10,
          });
        }}
        disabled={!isAvailable}
        className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs cursor-pointer hover:opacity-90 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isAvailable ? "افزودن به سبد خرید 🛒" : "ناموجود"}
      </button>
    </div>
  );
}

function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: any) => void;
}) {
  const images = product.images && product.images.length > 0 ? product.images : [product.image || ""];
  const [activeImage, setActiveImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "shipping">("desc");

  const specsEntries = (product as any).specs ? Object.entries((product as any).specs) : [];
  const isAvailable = (product as any).is_available !== false && (product.stock === undefined || product.stock > 0);
  const productName = product.title || (product as any).name || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-8 text-[var(--text-primary)] overflow-y-auto shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-xs font-bold transition cursor-pointer z-10"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="w-full h-72 md:h-96 rounded-3xl overflow-hidden bg-black/5 dark:bg-black/40 flex items-center justify-center border border-[var(--card-border)]">
              <img
                src={activeImage || product.image || ""}
                alt={productName}
                className="w-full h-full object-contain p-4"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 cursor-pointer transition shrink-0 ${
                      activeImage === imgUrl
                        ? "border-[var(--accent-blue)] scale-105 shadow-md"
                        : "border-[var(--card-border)] opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 px-3 py-1 rounded-full font-bold">
                  {product.category_name || product.category_id || (product as any).category || "کالای دیجیتال"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    isAvailable
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isAvailable ? "موجود در انبار" : "ناموجود"}
                </span>
              </div>
              <h2 className="text-2xl font-black mt-1 leading-snug text-[var(--text-primary)]">{productName}</h2>
              {(product as any).title_fa && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{(product as any).title_fa}</p>
              )}
            </div>

            <div className="flex gap-2 border-b border-[var(--card-border)] pb-3">
              <button
                onClick={() => setActiveTab("desc")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "desc"
                    ? "bg-[var(--accent-blue)] text-white shadow-md"
                    : "bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                📝 توضیحات
              </button>
              <button
                onClick={() => setActiveTab("specs")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "specs"
                    ? "bg-[var(--accent-blue)] text-white shadow-md"
                    : "bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                ⚙️ مشخصات فنی ({specsEntries.length})
              </button>
              <button
                onClick={() => setActiveTab("shipping")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "shipping"
                    ? "bg-[var(--accent-blue)] text-white shadow-md"
                    : "bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                🚚 ارسال و گارانتی
              </button>
            </div>

            <div className="min-h-[120px]">
              {activeTab === "desc" && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line font-medium">
                  {product.description || "توضیحات برای این محصول ثبت نشده است."}
                </p>
              )}

              {activeTab === "specs" && (
                <div className="space-y-2">
                  {specsEntries.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {specsEntries.map(([key, val], idx) => (
                        <div
                          key={idx}
                          className="flex justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs"
                        >
                          <span className="text-[var(--text-secondary)] font-bold">{key}:</span>
                          <span className="font-semibold text-[var(--text-primary)]">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] font-bold">مشخصات فنی برای این محصول ثبت نشده است.</p>
                  )}
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
                  <p>✅ {(product as any).warranty || "۱۸ ماه گارانتی شرکتی و سلامت فیزیکی"}</p>
                  <p>✅ ارسال سریع اکسپرس با بسته‌بندی ایمن ضدضربه</p>
                  <p>✅ ضمانت ۱۰۰٪ اصالت فیزیکی و ریجستری رسمی</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)] font-bold">قیمت نهایی:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[var(--accent-blue)]">
                    {(product.discount_price || product.price || 0).toLocaleString("fa-IR")} تومان
                  </span>
                  {product.discount_price && product.discount_price < product.price && (
                    <span className="text-xs line-through text-[var(--text-muted)] font-mono">
                      {product.price.toLocaleString("fa-IR")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-3 bg-black/5 dark:bg-white/10 rounded-2xl px-4 py-2.5 font-bold text-xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="hover:text-[var(--accent-blue)] cursor-pointer px-1 text-sm font-black"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="hover:text-[var(--accent-blue)] cursor-pointer px-1 text-sm font-black"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    for (let i = 0; i < quantity; i++) {
                      onAddToCart({
                        id: product.id,
                        name: productName,
                        price: product.discount_price || product.price,
                        image: activeImage || product.image || "",
                        stock: product.stock ?? 10,
                      });
                    }
                    onClose();
                  }}
                  disabled={!isAvailable}
                  className="flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <span>افزودن به سبد خرید ({quantity})</span> 🛒
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}