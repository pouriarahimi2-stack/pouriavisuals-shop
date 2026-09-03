// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   👑 ارتقای جامع به دیزاین سینمایی اپل/ویژن‌او‌اس، هیرو سه‌بعدی کوانتومی و کارت‌های بنتو (VisionOS Edition)');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

function writeProjectFile(relativePath, fileContent) {
  const targetPath = path.join(__dirname, relativePath);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(targetPath, fileContent, 'utf8');
  console.log(`  \x1b[32m[SAVED ✓]\x1b[0m ${relativePath.padEnd(50)} \x1b[36m(استقرار کامل)\x1b[0m`);
}

// ۱. به‌روزرسانی globals.css با استایل‌های عمیق Glassmorphism و پالت رنگی Obsidian
writeProjectFile('app/globals.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #07090e;
  --bg-secondary: #0c1017;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --card-border: rgba(255, 255, 255, 0.08);
  --card-border-hover: rgba(56, 189, 248, 0.35);
  --accent-blue: #0284c7;
  --accent-glow: rgba(2, 132, 199, 0.35);
  --modal-bg: #0c1017;
  --input-bg: rgba(255, 255, 255, 0.04);
  --glass-surface: rgba(12, 16, 23, 0.7);
}

.light {
  --bg-primary: #f8fafc;
  --bg-secondary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --card-border: rgba(15, 23, 42, 0.08);
  --card-border-hover: rgba(2, 132, 199, 0.4);
  --accent-blue: #0284c7;
  --accent-glow: rgba(2, 132, 199, 0.15);
  --modal-bg: #ffffff;
  --input-bg: #f1f5f9;
  --glass-surface: rgba(255, 255, 255, 0.8);
}

html, body {
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100vw;
  scroll-behavior: smooth;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
}

body {
  font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-overflow-scrolling: touch;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* کارت‌های شیشه‌ای بلورین اپل ویژن او اس */
.glass-morphism {
  background: var(--glass-surface);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid var(--card-border);
  box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.45);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-morphism:hover {
  border-color: var(--card-border-hover);
  box-shadow: 0 16px 50px 0 var(--accent-glow);
}

.text-gradient-hero {
  background: linear-gradient(135deg, #ffffff 20%, #cbd5e1 60%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-gradient-cyan {
  background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`);

// ۲. هیرو سکشن پروسیدورال Three.js سینمایی با هسته کوانتومی و امواج نوری
writeProjectFile('components/3d/Hero3DCanvas.tsx', `"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Hero3DCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 6.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // سیستم نورپردازی استودیویی ۳ بعدی
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keySpot = new THREE.SpotLight(0x0284c7, 28, 40, Math.PI / 3, 0.4);
    keySpot.position.set(6, 6, 6);
    scene.add(keySpot);

    const cyanPoint = new THREE.PointLight(0x38bdf8, 18, 30);
    cyanPoint.position.set(-6, -3, 5);
    scene.add(cyanPoint);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 8);
    rimLight.position.set(0, 8, -5);
    scene.add(rimLight);

    // هسته کریستالی اپتیکال شکست نور
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const coreGeo = new THREE.IcosahedronGeometry(1.65, 4);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x031024,
      emissiveIntensity: 0.5,
      roughness: 0.06,
      metalness: 0.1,
      transmission: 0.94,
      ior: 1.54,
      thickness: 1.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // وایرفریم نئونی هندسی
    const wireGeo = new THREE.IcosahedronGeometry(1.68, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireMesh);

    // حلقه‌های تیتانیومی مداری چرخشی
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const ringGeo1 = new THREE.TorusGeometry(2.4, 0.025, 16, 120);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.95,
      roughness: 0.2,
      transparent: true,
      opacity: 0.45,
    });
    const ringGeo2 = new THREE.TorusGeometry(2.85, 0.02, 16, 120);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // ماتریس ذرات نئونی
    const particleCount = 200;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 14;
      particlePositions[i + 1] = (Math.random() - 0.5) * 9;
      particlePositions[i + 2] = (Math.random() - 0.5) * 7;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // تعامل پارالاکس با ماوس
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseX = (x / rect.width) * 2;
      mouseY = -(y / rect.height) * 2;
    };

    window.addEventListener("pointermove", handlePointerMove);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      coreMesh.rotation.y = elapsedTime * 0.28;
      coreMesh.rotation.x = Math.sin(elapsedTime * 0.25) * 0.2;
      wireMesh.rotation.y = -elapsedTime * 0.32;
      wireMesh.rotation.z = elapsedTime * 0.16;

      ring1.rotation.z = elapsedTime * 0.22;
      ring1.rotation.y = Math.sin(elapsedTime * 0.3) * 0.45;

      ring2.rotation.x = -elapsedTime * 0.18;
      ring2.rotation.z = Math.cos(elapsedTime * 0.25) * 0.35;

      particles.rotation.y = elapsedTime * 0.06;

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      coreGroup.rotation.y = targetX * 0.6;
      coreGroup.rotation.x = -targetY * 0.6;
      camera.position.x = targetX * 0.3;
      camera.position.y = targetY * 0.3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.85 }}
    />
  );
}
`);

// ۳. بازنویسی صفحه اصلی (Home) با چیدمان فوق‌العاده سینمایی و لوکس
writeProjectFile('app/page.tsx', `"use client";

import React, { useState, useEffect } from "react";
import { productService, Product, FLAGSHIP_7_PRODUCTS } from "@/services/productService";
import { bannerService, Banner } from "@/services/bannerService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import AIAssistantChat from "@/components/AIAssistantChat";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import ProductCard from "@/components/ProductCard";
import TechRadarFeed from "@/components/TechRadarFeed";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import { soundEngine } from "@/lib/soundEngine";

export default function HomePage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>(FLAGSHIP_7_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const loadData = async () => {
    try {
      const [prods, bans] = await Promise.all([
        productService.getAll(),
        bannerService.getAll(),
      ]);
      if (prods && prods.length > 0) setProducts(prods);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
    } catch {}
  };

  useEffect(() => {
    loadData();

    const handleCategoryChange = (e: any) => setSelectedCategory(e.detail || "all");
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };

    window.addEventListener("category_selected", handleCategoryChange);
    window.addEventListener("products_updated", handleProductsUpdate);

    return () => {
      window.removeEventListener("category_selected", handleCategoryChange);
      window.removeEventListener("products_updated", handleProductsUpdate);
    };
  }, []);

  const toggleCompare = (p: Product) => {
    soundEngine.playClick();
    if (compareList.some((item) => item.id === p.id)) {
      setCompareList(compareList.filter((item) => item.id !== p.id));
    } else {
      if (compareList.length >= 4) {
        alert("حداکثر ۴ کالا را می‌توانید همزمان مقایسه نمایید.");
        return;
      }
      setCompareList([...compareList, p]);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true;
    const cat = (product.category || (product as any).category_name || "").toLowerCase();
    const target = selectedCategory.toLowerCase();
    return cat === target || cat.includes(target) || target.includes(cat);
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-28 transition-colors duration-300" dir="rtl">
      <main className="pt-4 sm:pt-6 px-3 sm:px-6 max-w-7xl mx-auto space-y-8 sm:space-y-12">
        
        {/* هاب اخبار تکنولوژی */}
        <TechRadarFeed />

        {/* هیرو سکشن سینمایی اپل/ویژن‌او‌اس با نورپردازی سه‌بعدی Three.js در پس‌زمینه */}
        <section className="w-full rounded-[2.8rem] overflow-hidden glass-morphism p-8 sm:p-14 lg:p-16 shadow-2xl border border-[var(--card-border)] relative min-h-[380px] sm:min-h-[460px] flex flex-col justify-center">
          
          {/* بوم سه‌بعدی تعاملی Three.js */}
          <Hero3DCanvas />

          <div className="relative z-10 space-y-5 max-w-2xl text-right">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-gradient-hero">
              مرجع تخصصی خرید جدیدترین گجت‌ها و سخت‌افزار نوین
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
              تامین مستقیم انواع مانیتورهای ۵K رتینا، لپ‌تاپ‌های حرفه‌ای M4 Max، ساعت‌های اولترا و تجهیزات ضبط استودیویی با ۱۸ ماه گارانتی اصالت طلایی و ارسال پیشتاز.
            </p>

            <div className="pt-3">
              <Link
                href="/#products"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:opacity-95 text-white px-9 py-4 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/30"
              >
                <span>مشاهده کاتالوگ محصولات</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        </section>

        {/* بخش کاتالوگ محصولات */}
        <section id="products" className="space-y-6">
          <div className="border-b border-[var(--card-border)] pb-4 px-1 flex justify-between items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                محصولات و تجهیزات تکنولوژی
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                تمامی کالاها با گارانتی اصالت طلایی و ارسال سریع پیشتاز عرضه می‌شوند
              </p>
            </div>
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="text-xs font-bold text-[var(--accent-blue)] hover:underline cursor-pointer"
              >
                نمایش همه کالاها ({products.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* مجله سئو */}
        <section className="glass-morphism rounded-[2.5rem] p-6 sm:p-8 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">مجله و مقالات تحلیلی فناوری</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium">جدیدترین بررسی‌های تخصصی سخت‌افزار و راهنمای خرید گجت‌ها</p>
            </div>
            <Link href="/blog" className="text-xs font-bold text-[var(--accent-blue)] hover:underline">
              مشاهده همه مقالات ←
            </Link>
          </div>
          <HomeBlogSection />
        </section>
      </main>

      <ProductComparisonModal products={compareList} isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} onRemoveProduct={(id) => setCompareList(compareList.filter((item) => item.id !== id))} />
      <AIAssistantChat />
    </div>
  );
}

function HomeBlogSection() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/blogs").then((r) => r.json()).then((d) => setPosts((d.data || d.posts || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      {posts.map((post) => (
        <article key={post.id || post.title} className="glass-morphism p-5 rounded-3xl space-y-2 flex flex-col justify-between hover:border-[var(--card-border-hover)] transition duration-300">
          <h4 className="font-bold text-xs line-clamp-2 text-[var(--text-primary)]">{post.title}</h4>
          <Link href={"/blog/" + (post.id || "")} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-2 border-t border-[var(--card-border)]">
            مطالعه مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}
`);

// ۴. به‌روزرسانی ProductCard با کارت‌های بلورین Bento و دکمه ۳D Teardown
writeProjectFile('components/ProductCard.tsx', `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { formatPrice } from "@/lib/formatters";
import ProductExplodedView from "@/components/ProductExplodedView";

export default function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isTeardownOpen, setIsTeardownOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const title = product.title || product.title_fa || product.name || "کالای تکنولوژی";
  const price = Number(product.price) || 55800000;
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : (product.discount_price ? Number(product.discount_price) : undefined);
  const currentPrice = discountPrice || price;
  const stockCount = product.stock !== undefined ? Number(product.stock) : 10;
  const mainImage = product.images?.[0] || product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600";
  const category = product.category || "تکنولوژی";
  const isAvailable = product.is_available !== false && stockCount > 0;

  return (
    <>
      <div
        onClick={() => userBehavior.trackProductView(product.id, category)}
        className="glass-morphism rounded-[2.2rem] overflow-hidden p-5 flex flex-col justify-between group select-none relative"
        dir="rtl"
      >
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--input-bg)] mb-4 flex items-center justify-center p-3 border border-[var(--card-border)]">
          <Link href={"/products/" + product.id} className="w-full h-full flex items-center justify-center">
            <img src={mainImage} alt={title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
          </Link>
          
          <span className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold border border-white/10">
            {category}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playExplodeShift();
              setIsTeardownOpen(true);
            }}
            className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-blue-600 text-white font-bold text-[10px] border border-white/20 backdrop-blur-md transition flex items-center gap-1 shadow-md cursor-pointer"
            title="مشاهده کالبدشکافی ۳D"
          >
            <span>🧬</span>
            <span>کالبدشکافی ۳D</span>
          </button>
        </div>

        <div className="space-y-2 mb-4 text-right flex-grow">
          <span className="text-[var(--accent-blue)] text-xs font-bold block">{product.brand || "Apple"}</span>
          <Link href={"/products/" + product.id}>
            <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-snug hover:text-[var(--accent-blue)] transition">{title}</h3>
          </Link>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 font-medium leading-relaxed">{product.short_description || product.description || "دارای گارانتی اصالت طلایی و ارسال پیشتاز"}</p>
        </div>

        <div className="pt-3 border-t border-[var(--card-border)] space-y-3 mt-auto">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-base font-mono font-black text-[var(--text-primary)]" suppressHydrationWarning>{formatPrice(currentPrice)} تومان</span>
            <span className="text-[10px] font-bold text-emerald-500">{isAvailable ? "موجود ✓" : "ناموجود"}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                soundEngine.playAddToCart();
                addToCart({ id: product.id, title, name: title, price: currentPrice, image: mainImage, stock: stockCount, quantity: 1 });
              }}
              disabled={!isAvailable}
              className="py-2.5 bg-[var(--input-bg)] hover:bg-[var(--accent-blue)] hover:text-white text-[var(--text-primary)] text-xs font-bold rounded-xl border border-[var(--card-border)] transition cursor-pointer disabled:opacity-40"
            >
              🛒 سبد خرید
            </button>
            <button
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                soundEngine.playAddToCart();
                addToCart({ id: product.id, title, name: title, price: currentPrice, image: mainImage, stock: stockCount, quantity: 1 });
                router.push("/checkout");
              }}
              disabled={!isAvailable}
              className="py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/25 hover:opacity-90 transition cursor-pointer disabled:opacity-40"
            >
              ⚡ خرید فوری
            </button>
          </div>
        </div>
      </div>

      <ProductExplodedView
        productId={product.id}
        productTitle={title}
        category={category}
        isOpen={isTeardownOpen}
        onClose={() => setIsTeardownOpen(false)}
      />
    </>
  );
}
`);

// ۵. کامیت و استقرار روی ریپازیتوری
console.log('\n📦 در حال ثبت کامیت و استقرار روی گیت‌هاب / Vercel...');
try {
  execSync('git add . && git commit -m "feat(ui): deploy cinematic VisionOS obsidian theme with procedural Three.js hero" && git push origin main', { stdio: 'inherit' });
  console.log('\n🎉 [SUCCESS] استقرار نهایی با موفقیت ۱۰۰٪ کامل شد!');
} catch (e) {
  console.log('\nℹ️ در صورت لزوم دستور زیر را در ترمینال اجرا فرمایید:');
  console.log('git add . && git commit -m "feat(ui): deploy VisionOS theme" && git push');
}