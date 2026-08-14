"use client";

import React, { useState, useEffect } from "react";
import "./globals.css";
import Header from "@/components/Header";
import { productService, Product } from "@/services/productService";
import { bannerService, HeroBanner } from "@/services/bannerService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { categoryService, Category } from "@/services/categoryService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { addToCart } = useCart();

  const loadData = () => {
    setProducts(productService.getProducts());
    const activeBanners = bannerService.getBanners().filter((b) => b.isActive);
    setBanners(activeBanners);
    setSiteInfo(siteInfoService.getSiteInfo());

    if (categoryService && typeof categoryService.getCategories === "function") {
      setCategories(categoryService.getCategories());
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("siteInfoUpdated", loadData);
    return () => window.removeEventListener("siteInfoUpdated", loadData);
  }, []);

  const isMaintenance = siteInfo?.maintenanceMode ?? false;

  // 🛠️ رندر هوشمند صفحه تعمیرات در صورت فعال بودن سوئیچ در پنل ادمین
  if (isMaintenance) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#07090e] text-white text-center font-sans select-none relative overflow-hidden">
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 blur-[160px] pointer-events-none rounded-full" />
        <div className="max-w-md w-full space-y-6 p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl relative z-10">
          <div className="text-5xl mb-2 animate-bounce">🛠️</div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            سایت در حال به‌روزرسانی است
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            ما در حال ارتقا و بهبود فروشگاه هستیم. به زودی با امکانات و محصولات جدید بازمی‌گردیم!
          </p>
          <div className="pt-4 border-t border-white/10">
            <span className="inline-flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              حالت تعمیرات فعال است
            </span>
          </div>
        </div>
      </main>
    );
  }

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true;
    return product.category === selectedCategory;
  });

  return (
    <main className="min-h-screen flex flex-col justify-between relative font-sans overflow-x-hidden bg-[#07090e] text-white select-none">
      {/* هاله‌های نور محیطی در پس‌زمینه (Ambient Glows) */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[160px] pointer-events-none rounded-full" />

      <div className="relative z-10">
        <Header />

        <div className="max-w-6xl mx-auto px-4 space-y-12 mt-8">
          {/* ویترین بنرهای عریض اصلی */}
          {banners.length > 0 && (
            <section className="space-y-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="relative overflow-hidden rounded-[2.5rem] border border-white/10 p-8 md:p-12 min-h-[320px] flex items-center bg-cover bg-center shadow-2xl backdrop-blur-3xl group transition-all duration-500 hover:border-white/20"
                  style={{
                    backgroundImage: `linear-gradient(to left, rgba(7,9,14,0.92) 20%, rgba(7,9,14,0.3)), url(${banner.imageUrl})`,
                  }}
                >
                  <div className="max-w-xl space-y-4 z-10">
                    {banner.badgeText && (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-black tracking-wide backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                        {banner.badgeText}
                      </span>
                    )}
                    <h1 className="text-3xl md:text-5xl font-black leading-tight text-white tracking-tight">
                      {banner.title}
                    </h1>
                    <p className="text-xs md:text-sm text-slate-300/80 leading-relaxed max-w-lg">
                      {banner.subtitle}
                    </p>
                    <div className="pt-2">
                      <a
                        href={banner.buttonLink}
                        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-black font-extrabold text-xs hover:bg-slate-200 transition-all duration-300 shadow-xl hover:scale-105 active:scale-95"
                      >
                        <span>{banner.buttonText}</span>
                        <span>←</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* نوار دسته‌بندی شیشه‌ای با طراحی کپسولی (Apple Capsule Menu) */}
          <section className="flex justify-center">
            <div className="p-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl inline-flex items-center gap-1.5 overflow-x-auto max-w-full scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-6 py-2.5 rounded-full text-xs transition-all duration-300 whitespace-nowrap cursor-pointer select-none ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30 scale-105"
                    : "text-slate-400 hover:text-white font-semibold hover:bg-white/5"
                }`}
              >
                🌐 همه محصولات
              </button>

              {categories.map((cat) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-6 py-2.5 rounded-full text-xs transition-all duration-300 whitespace-nowrap cursor-pointer select-none ${
                      isActive
                        ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30 scale-105"
                        : "text-slate-400 hover:text-white font-semibold hover:bg-white/5"
                    }`}
                  >
                    📂 {cat.name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* لیست کارت‌های محتوا و محصولات */}
          <section id="products" className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 px-1">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>📦</span> محصولات ویژه‌ی فروشگاه
                </h3>
                <p className="text-xs opacity-50 mt-1">تجهیزات و کالاهای اورجینال با ضمانت اصلی</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-slate-400">
                {filteredProducts.length} کالا
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-16 text-center opacity-60 text-xs font-bold space-y-2">
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

          {/* ویترین مجله و مقالات تخصصی سئو */}
          <section className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 space-y-6 my-12 backdrop-blur-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>📚</span> مجله تخصصی و راهنمای خرید
                </h3>
                <p className="text-xs opacity-60 mt-1">جدیدترین تحلیل‌های بازار و راهنمای انتخاب کالا</p>
              </div>
              <Link
                href="/blog"
                className="px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-600 hover:text-white transition shadow-lg"
              >
                مشاهده همه مقالات ←
              </Link>
            </div>

            <HomeBlogSection />
          </section>
        </div>
      </div>

      {/* فوتر مینیمال و پاک */}
      {siteInfo && (
        <footer className="mt-20 border-t border-white/10 bg-black/40 backdrop-blur-2xl py-12 relative z-10">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10 text-xs">
            <div className="space-y-3">
              <h4 className="font-black text-base text-indigo-400">
                {siteInfo.storeName}
              </h4>
              <p className="opacity-70 leading-relaxed">{siteInfo.aboutText}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-white">دسترسی سریع</h4>
              <ul className="space-y-2 opacity-80 font-bold">
                <li><Link href="/" className="hover:text-indigo-400 transition">صفحه اصلی</Link></li>
                <li><Link href="/blog" className="hover:text-indigo-400 transition">مجله تخصصی</Link></li>
                <li><Link href="/track-order" className="hover:text-indigo-400 transition">پیگیری سفارش</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-white">ارتباط با ما</h4>
              <div className="space-y-2 opacity-80">
                <p>📞 تلفن: {siteInfo.phone}</p>
                <p>✉️ ایمیل: {siteInfo.email}</p>
                <p>📍 آدرس: {siteInfo.address}</p>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 pt-8 mt-8 border-t border-white/5 text-center text-[11px] opacity-40 font-medium">
            © تمامی حقوق برای BitByPouria محفوظ است.
          </div>
        </footer>
      )}

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      <AIAssistantChat />
    </main>
  );
}

function HomeBlogSection() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/blogs");
        const data = await res.json();
        const localBlogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
        const combined = [...(data.posts || []), ...localBlogs];
        const visiblePosts = combined.filter((p) => p.isVisible !== false);
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
      <div className="text-center py-6 text-xs opacity-50">
        هنوز مقاله‌ای منتشر نشده است.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {posts.map((post) => (
        <article
          key={post.id || post.title}
          className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 flex flex-col justify-between hover:bg-white/[0.07] hover:border-white/20 transition duration-300"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] opacity-60">
              <span>📅 {post.createdAt || "امروز"}</span>
              <span className="text-indigo-400 font-bold">مقاله تخصصی</span>
            </div>
            <h4 className="font-extrabold text-xs line-clamp-2 text-indigo-100 leading-snug">
              {post.title}
            </h4>
            <p className="text-[11px] opacity-70 line-clamp-2 leading-relaxed">
              {post.metaDescription || post.content?.substring(0, 80) + "..."}
            </p>
          </div>
          <Link
            href={`/blog/${post.id}`}
            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 inline-block pt-2 border-t border-white/5"
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
    { role: "model", text: "سلام! من دستیار هوشمند هستم. می‌تونید عکس محصولی که می‌خواید رو بفرستید تا توی سایت براتون پیدا کنم! 📸🛍️" },
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
      const productsData = productService.getProducts();

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

      if (data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: data.response,
            matchedProduct: matchedProductObj,
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "متأسفانه مشکلی در پردازش عکس یا ارتباط رخ داد." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full bg-indigo-600 text-white shadow-2xl hover:scale-105 transition cursor-pointer flex items-center gap-2 text-xs font-black border border-white/20"
        >
          <span>📸</span>
          <span>جستجوی هوشمند با عکس</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 h-[520px] rounded-3xl bg-slate-950/95 border border-white/20 shadow-2xl flex flex-col justify-between overflow-hidden text-white backdrop-blur-2xl">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-600 text-white text-xs">🔍</span>
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
                      ? "mr-auto bg-indigo-600 text-white font-medium"
                      : "ml-auto bg-white/5 text-white border border-white/10"
                  }`}
                >
                  {m.image && (
                    <img
                      src={m.image}
                      alt="User Upload"
                      className="w-full max-h-36 object-cover rounded-xl border border-white/20"
                    />
                  )}
                  {m.text && <p>{m.text}</p>}
                </div>

                {m.matchedProduct && (
                  <div className="ml-auto w-[85%] p-3 rounded-2xl bg-white/10 border border-indigo-500 space-y-2 animate-fadeIn">
                    <div className="flex gap-2 items-center">
                      <img
                        src={m.matchedProduct.image}
                        alt={m.matchedProduct.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 overflow-hidden">
                        <h5 className="font-bold truncate text-[11px]">{m.matchedProduct.title}</h5>
                        <p className="text-indigo-400 font-extrabold text-[11px]">
                          {(m.matchedProduct.discountPrice ?? m.matchedProduct.price).toLocaleString("fa-IR")} تومان
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        addToCart({
                          id: m.matchedProduct!.id,
                          title: m.matchedProduct!.title,
                          price: m.matchedProduct!.price,
                          discountPrice: m.matchedProduct!.discountPrice,
                          image: m.matchedProduct!.image,
                        })
                      }
                      className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-[10px] hover:opacity-90 transition cursor-pointer shadow-md"
                    >
                      افزودن مستقیم به سبد خرید 🛒
                    </button>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-[10px] opacity-50 animate-pulse">در حال آنالیز تصویر و جستجو در کالاها... 🔍</div>
            )}
          </div>

          {selectedImage && (
            <div className="px-4 py-2 bg-black/30 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-2">
                <img src={selectedImage} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-[10px] opacity-70">تصویر آماده ارسال</span>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-xs text-red-400 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="p-3 border-t border-white/10 flex gap-2 items-center">
            <label className="p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition">
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
              className="flex-1 p-2.5 rounded-xl bg-white/5 border border-white/10 outline-none text-xs text-white"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:opacity-90 transition cursor-pointer"
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
  const rawMediaList =
    product.mediaList && product.mediaList.length > 0
      ? product.mediaList.filter((m) => m.url && m.url.trim() !== "")
      : [];

  const mediaList =
    rawMediaList.length > 0
      ? rawMediaList
      : [{ type: "image" as const, url: product.image }];

  const [activeMedia, setActiveMedia] = useState(mediaList[0]);

  useEffect(() => {
    if (mediaList.length > 0) {
      setActiveMedia(mediaList[0]);
    }
  }, [product]);

  return (
    <div className="rounded-[2rem] bg-white/[0.03] border border-white/10 p-5 flex flex-col justify-between space-y-4 hover:border-white/20 hover:bg-white/[0.05] transition duration-300 group shadow-xl backdrop-blur-xl">
      {mediaList.length > 1 && (
        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          {mediaList.map((m, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveMedia(m)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                activeMedia?.url === m.url
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {m.type === "image" ? "📷 عکس" : m.type === "gif" ? "🎞️ گیف" : "🎥 ویدیو"}
            </button>
          ))}
        </div>
      )}

      <div
        onClick={() => onOpenDetails(product)}
        className="relative w-full h-56 rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer border border-white/5"
      >
        {activeMedia?.type === "video" ? (
          <video
            key={activeMedia.url}
            src={activeMedia.url}
            controls={false}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <img
            src={activeMedia?.url || product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[2px]">
          <span className="px-4 py-2 rounded-xl bg-white/20 text-white text-xs font-extrabold border border-white/30 shadow-2xl">
            🔍 بررسی کامل کالا
          </span>
        </div>
      </div>

      <div className="space-y-2.5 cursor-pointer" onClick={() => onOpenDetails(product)}>
        <div className="flex items-center justify-between text-[10px]">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-0.5 rounded-full font-bold">
            {product.category}
          </span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-full ${
              product.inStock !== false ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
            }`}
          >
            {product.inStock !== false ? "موجود در انبار" : "ناموجود"}
          </span>
        </div>

        <h4 className="font-extrabold text-sm hover:text-indigo-300 transition text-white leading-snug line-clamp-1">
          {product.title}
        </h4>
        <p className="text-xs opacity-60 line-clamp-2 leading-relaxed">{product.description}</p>

        <div className="flex items-center gap-2 pt-1">
          <span className="font-black text-base text-indigo-300">
            {(product.discountPrice ?? product.price).toLocaleString("fa-IR")} تومان
          </span>
          {product.discountPrice && (
            <span className="text-xs line-through opacity-40 font-mono">
              {product.price.toLocaleString("fa-IR")}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          const validImg =
            product.image ||
            mediaList.find((m) => m.type === "image" && m.url)?.url ||
            mediaList[0]?.url;

          onAddToCart({
            id: product.id,
            title: product.title,
            price: product.price,
            discountPrice: product.discountPrice,
            image: validImg,
          });
        }}
        disabled={product.inStock === false}
        className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs cursor-pointer hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {product.inStock !== false ? "افزودن به سبد خرید 🛒" : "ناموجود"}
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
  const rawMediaList =
    product.mediaList && product.mediaList.length > 0
      ? product.mediaList.filter((m) => m.url && m.url.trim() !== "")
      : [];

  const mediaList =
    rawMediaList.length > 0
      ? rawMediaList
      : [{ type: "image" as const, url: product.image }];

  const [activeMedia, setActiveMedia] = useState(mediaList[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "shipping">("desc");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-white/20 rounded-[2.5rem] p-8 text-white overflow-y-auto shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold transition cursor-pointer z-10"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="w-full h-72 md:h-96 rounded-3xl overflow-hidden bg-black/40 flex items-center justify-center border border-white/10 shadow-inner">
              {activeMedia?.type === "video" ? (
                <video
                  key={activeMedia.url}
                  src={activeMedia.url}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeMedia?.url || product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {mediaList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaList.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMedia(m)}
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 cursor-pointer transition shrink-0 ${
                      activeMedia?.url === m.url
                        ? "border-indigo-500 scale-105 shadow-md"
                        : "border-white/10 opacity-50 hover:opacity-100"
                    }`}
                  >
                    {m.type === "video" ? (
                      <div className="w-full h-full bg-black/60 flex items-center justify-center text-[10px] font-bold">
                        🎥 ویدیو
                      </div>
                    ) : (
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-bold">
                  {product.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    product.inStock !== false ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {product.inStock !== false ? "موجود در انبار" : "ناموجود"}
                </span>
              </div>
              <h2 className="text-2xl font-black mt-1 leading-snug">{product.title}</h2>
            </div>

            <div className="flex gap-2 border-b border-white/10 pb-3">
              <button
                onClick={() => setActiveTab("desc")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "desc"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                📝 توضیحات
              </button>
              <button
                onClick={() => setActiveTab("specs")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "specs"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                ⚙️ مشخصات فنی ({product.specs?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("shipping")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "shipping"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                🚚 ارسال و گارانتی
              </button>
            </div>

            <div className="min-h-[120px]">
              {activeTab === "desc" && (
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {product.description || "توضیحات برای این محصول ثبت نشده است."}
                </p>
              )}

              {activeTab === "specs" && (
                <div className="space-y-2">
                  {product.specs && product.specs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {product.specs.map((spec, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between p-3 rounded-2xl bg-white/5 border border-white/10 text-xs"
                        >
                          <span className="text-white/60 font-bold">{spec.title}:</span>
                          <span className="font-semibold text-indigo-200">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/50">مشخصات فنی برای این محصول ثبت نشده است.</p>
                  )}
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-2 text-xs text-slate-300">
                  <p>✅ ارسال سریع اکسپرس به سراسر کشور</p>
                  <p>✅ ضمانت اصالت و ۷ روز مهلت بازگشت کالا</p>
                  <p>✅ پشتیبانی ۲۴ ساعته پس از فروش</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60 font-bold">قیمت نهایی:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-indigo-300">
                    {(product.discountPrice ?? product.price).toLocaleString("fa-IR")} تومان
                  </span>
                  {product.discountPrice && (
                    <span className="text-xs line-through opacity-40 font-mono">
                      {product.price.toLocaleString("fa-IR")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-2.5 font-bold text-xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="hover:text-indigo-400 cursor-pointer px-1 text-sm font-black"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="hover:text-indigo-400 cursor-pointer px-1 text-sm font-black"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    const validImg =
                      product.image ||
                      mediaList.find((m) => m.type === "image" && m.url)?.url ||
                      mediaList[0]?.url;

                    for (let i = 0; i < quantity; i++) {
                      onAddToCart({
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        discountPrice: product.discountPrice,
                        image: validImg,
                      });
                    }
                    onClose();
                  }}
                  disabled={product.inStock === false}
                  className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs cursor-pointer hover:bg-indigo-500 transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-40"
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