/**
 * AXON CORE - Definitive Production Restoration & Deployment Engine (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(msg) {
  console.log(`\x1b[36m[AXON-CORE]\x1b[0m ${msg}`);
}

function success(msg) {
  console.log(`\x1b[32m✔ ${msg}\x1b[0m`);
}

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  success(`اصلاح شد: ${relPath}`);
}

log("شروع اعمال اصلاحات لاگین ادمین، کلیک محصولات، تفکیک قیمت و چیدمان...");

// ۱. اصلاح لاگین ادمین و پذیرش پین‌کد
const adminLoginApi = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pin = String(body.pin || body.password || "").trim();
    const username = String(body.username || "admin").trim().toLowerCase();

    let { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .or("username.eq." + username + ",role.eq.superadmin")
      .limit(1)
      .maybeSingle();

    if (!adminUser) {
      const { data: createdUser } = await supabaseAdmin
        .from("admin_users")
        .insert({
          username: "admin",
          password: "1234",
          full_name: "مدیر ارشد آکسون",
          role: "superadmin",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      adminUser = createdUser;
    }

    const isValid = adminUser && (adminUser.password === pin || pin === "1234");

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "پین‌کد وارد شده صحیح نمی‌باشد." },
        { status: 401 }
      );
    }

    const token = signPayload({
      id: String(adminUser?.id || "admin_master"),
      username: adminUser?.username || "admin",
      role: adminUser?.role || "superadmin",
      full_name: adminUser?.full_name || "مدیر سیستم",
    });

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد.",
      redirectUrl: "/admin",
      user: {
        id: adminUser?.id || "admin_master",
        username: adminUser?.username || "admin",
        role: adminUser?.role || "superadmin",
      },
    });

    response.cookies.set("admin_session_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.set("pv_admin_session", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "خطای سرور در احراز هویت." },
      { status: 500 }
    );
  }
}
`;
writeFile('app/api/admin/login/route.ts', adminLoginApi);

// ۲. اصلاح صفحه اصلی (حذف Price Match و قرارگیری استاندارد هیرو و محصولات)
const mainHomePage = `"use client";

import React, { Suspense } from "react";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductList from "@/components/ProductList";
import TechRadarFeed from "@/components/TechRadarFeed";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen space-y-16 font-sans select-none text-[var(--text-primary)] pb-12" dir="rtl">
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[var(--modal-bg)] to-[var(--input-bg)] border border-[var(--card-border)] p-6 sm:p-12 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 z-10 text-right">
              <span className="px-3.5 py-1.5 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-black inline-block">
                ⚡ مرجع تخصصی مانیتورهای تدوین رنگ ۵K و ۴K
              </span>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
                دقت بی‌نهایت رنگ، <br className="hidden sm:block" />
                استاندارد حرفه‌ای استودیو
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-lg">
                تامین، کالیبراسیون و مشاوره تخصصی نمایشگرهای رتینا، کابل‌های تاندربولت و تجهیزات استودیویی با ضمانت اصالت طلایی.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="#products"
                  className="px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl shadow-blue-500/25 flex items-center gap-2"
                >
                  <span>🛒</span>
                  <span>مشاهده کاتالوگ و خرید</span>
                </a>
                <Link
                  href="/products"
                  className="px-6 py-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition"
                >
                  آرشیو کامل محصولات ←
                </Link>
              </div>
            </div>

            <div className="relative h-72 sm:h-96 w-full flex items-center justify-center">
              <Suspense fallback={<div className="text-xs text-[var(--text-secondary)] animate-pulse">در حال آماده‌سازی مدل سه‌بعدی...</div>}>
                <Hero3DCanvas />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4" id="products">
        <ProductList />
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <TechRadarFeed />
      </section>
    </div>
  );
}
`;
writeFile('app/page.tsx', mainHomePage);

// ۳. اصلاح ProductList و ایجاد امکان کلیک به صفحه تکی محصول
const productListFix = `"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart } = useCart();

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadProducts();
    };

    window.addEventListener("products_updated", handleUpdate);
    return () => {
      window.removeEventListener("products_updated", handleUpdate);
    };
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category || "عمومی"))).filter(Boolean);

  const filtered = products.filter((p) => {
    const isAvail = p.is_available !== false && (p.stock ?? 1) > 0;
    const matchCat = selectedCategory === "all" || (p.category || "عمومی") === selectedCategory;
    const matchSearch =
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return isAvail && matchCat && matchSearch;
  });

  return (
    <section className="py-8 space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--card-border)] pb-6">
        <div>
          <span className="text-xs font-black text-[var(--accent-blue)] block mb-1">PRO DISPLAY & GEARS</span>
          <h2 className="text-2xl md:text-3xl font-black">کاتالوگ تجهیزات تصویر و مانیتورها</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
            تمامی کالاها با گارانتی اصالت طلایی، تست سلامت فیزیکی و ارسال پیشتاز عرضه می‌شوند
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => {
                soundEngine.playClick();
                setSelectedCategory("all");
              }}
              className={"px-4 py-2 rounded-2xl font-black transition cursor-pointer whitespace-nowrap " + (selectedCategory === "all" ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")}
            >
              همه ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedCategory(cat);
                }}
                className={"px-4 py-2 rounded-2xl font-black transition cursor-pointer whitespace-nowrap " + (selectedCategory === cat ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 جستجو در مدل یا مشخصات..."
            className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] w-full md:w-56"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="p-5 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4">
              <div className="w-full h-48 rounded-3xl bg-[var(--input-bg)]" />
              <div className="h-4 w-3/4 bg-[var(--input-bg)] rounded-full" />
              <div className="h-3 w-1/2 bg-[var(--input-bg)] rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-[var(--text-secondary)]">
          کالایی در این دسته‌بندی یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((prod) => {
            const displayImg = prod.images?.[0] || prod.image || "";
            return (
              <div
                key={prod.id}
                className="p-5 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl hover:border-[var(--accent-blue)] transition duration-300 flex flex-col justify-between group"
              >
                <Link href={"/products/" + prod.id} className="space-y-4 block cursor-pointer">
                  <div className="w-full h-48 rounded-3xl bg-[var(--input-bg)] p-3 border border-[var(--card-border)] flex items-center justify-center relative overflow-hidden">
                    {displayImg ? (
                      <img
                        src={displayImg}
                        alt={prod.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <span className="text-3xl opacity-40">🖼️</span>
                    )}

                    {prod.is_featured && (
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] shadow-lg">
                        🔥 پیشنهاد ویژه
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[var(--accent-blue)] font-extrabold block">
                      {prod.category || "تجهیزات"}
                    </span>
                    <h3 className="font-extrabold text-xs text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-[var(--accent-blue)] transition">
                      {prod.title}
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">
                      {prod.description || "دارای گارانتی اصالت طلایی و تست سلامت فیزیکی"}
                    </p>
                  </div>
                </Link>

                <div className="pt-4 border-t border-[var(--card-border)] space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold">قیمت نهایی:</span>
                    <div className="text-left">
                      {prod.discountPrice && prod.discountPrice < prod.price && (
                        <span className="block text-[10px] text-[var(--text-secondary)] line-through font-mono">
                          {prod.price.toLocaleString("fa-IR")}
                        </span>
                      )}
                      <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {Number(prod.discountPrice || prod.price || 0).toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      soundEngine.playAddToCart();
                      addToCart({
                        id: prod.id,
                        title: prod.title,
                        price: prod.discountPrice || prod.price,
                        image: displayImg,
                        stock: prod.stock ?? 10,
                      });
                    }}
                    className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>🛒</span>
                    <span>افزودن به سبد خرید</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
`;
writeFile('components/ProductList.tsx', productListFix);

// ۴. اصلاح صفحه محصول و قرارگیری پایش قیمت داخل آن
const productDetailsPage = `"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import LiveMarketArbitrage from "@/components/LiveMarketArbitrage";
import ProductReviews from "@/components/ProductReviews";
import ColorGamutSimulator from "@/components/ColorGamutSimulator";
import ProductExplodedView from "@/components/ProductExplodedView";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");
  const { addToCart } = useCart();

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const found = await productService.getById(id);
        if (found) {
          setProduct(found);
          const firstImg = found.images?.[0] || found.image || "";
          setActiveImage(firstImg);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans text-xs font-bold text-[var(--text-secondary)]">
        در حال دریافت مشخصات کالا...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans space-y-4" dir="rtl">
        <h2 className="text-xl font-black">کالای مورد نظر یافت نشد.</h2>
        <Link href="/" className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold">
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  const allImages = product.images && product.images.length > 0 ? product.images : [product.image || ""];
  const currentPrice = Number(product.discountPrice || product.price || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-6 sm:p-10 shadow-2xl">
        <div className="space-y-4">
          <div className="w-full h-80 sm:h-96 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] p-4 flex items-center justify-center overflow-hidden">
            <img src={activeImage || allImages[0]} alt={product.title} className="w-full h-full object-contain" />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveImage(img);
                  }}
                  className={"w-16 h-16 rounded-2xl border p-1 bg-[var(--input-bg)] transition " + (activeImage === img ? "border-[var(--accent-blue)] ring-2 ring-blue-500/30" : "border-[var(--card-border)]")}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-xs font-black">
              {product.category || "تجهیزات استودیویی"}
            </span>
            <h1 className="text-xl sm:text-3xl font-black leading-snug">{product.title}</h1>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
              {product.description || "ارائه شده با ضمانت اصالت فیزیکی و پشتیبانی تخصصی استودیو."}
            </p>
          </div>

          <div className="space-y-4 p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[var(--text-secondary)]">قیمت نهایی:</span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {currentPrice.toLocaleString("fa-IR")} تومان
              </span>
            </div>

            <button
              onClick={() => {
                soundEngine.playAddToCart();
                addToCart({
                  id: product.id,
                  title: product.title,
                  price: currentPrice,
                  image: activeImage || allImages[0],
                  stock: product.stock ?? 10,
                });
              }}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🛒</span>
              <span>افزودن به سبد خرید</span>
            </button>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <LiveMarketArbitrage />
      </section>

      <section className="space-y-4">
        <ColorGamutSimulator />
      </section>

      <section className="space-y-4">
        <ProductExplodedView productId={product.id} />
      </section>

      <section className="space-y-4">
        <ProductReviews productId={product.id} />
      </section>
    </div>
  );
}
`;
writeFile('app/products/[id]/page.tsx', productDetailsPage);

// ۵. بیلد محلی و پوش نهایی به گیت‌هاب
log("اجرای بیلد محلی برای تایید صحت فایل‌ها...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  success("بیلد با موفقیت پاس شد.");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

log("ارسال تغییرات به گیت‌هاب...");
try {
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "fix: restore pin 1234 auth, enable product link navigation, isolate arbitrage component"', { stdio: 'inherit' });
  
  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  success("تغییرات با موفقیت به گیت‌هاب ارسال شد!");
} catch (e) {
  console.error("خطای گیت:", e.message);
}