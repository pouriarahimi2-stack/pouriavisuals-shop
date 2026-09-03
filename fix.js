// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🌟 استقرار نهایی هیرو سه‌بعدی Three.js، لوگوهای متحرک SVG، اصلاح قیمت‌ها و موتور کالبدشکافی Draftly');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

function writeProjectFile(relativePath, fileContent) {
  const targetPath = path.join(__dirname, relativePath);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(targetPath, fileContent, 'utf8');
  console.log(`  \x1b[32m[SAVED ✓]\x1b[0m ${relativePath.padEnd(50)} \x1b[36m(بروزرسانی کامل)\x1b[0m`);
}

// ۱. به‌روزرسانی package.json با پکیج رسمی Three.js
writeProjectFile('package.json', JSON.stringify({
  name: "my-apple-store",
  version: "0.1.0",
  private: true,
  scripts: {
    dev: "next dev",
    build: "next build",
    start: "next start",
    lint: "next lint",
    push: "git add . && git commit -m \"update: auto commit changes\" && git push"
  },
  dependencies: {
    "@google/generative-ai": "^0.24.0",
    "@supabase/supabase-js": "^2.49.1",
    "lucide-react": "^0.475.0",
    "next": "^15.1.7",
    "nodemailer": "^6.10.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "three": "^0.173.0"
  },
  devDependencies: {
    "@types/node": "^20.17.19",
    "@types/nodemailer": "^6.4.17",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "@types/three": "^0.173.0",
    "autoprefixer": "^10.5.4",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3"
  }
}, null, 2));

// ۲. کامپوننت لوگوی متحرک اختصاصی SVG برای هدر و فوتر
writeProjectFile('components/AnimatedLogo.tsx', `"use client";

import React from "react";

interface AnimatedLogoProps {
  customLogoUrl?: string;
  size?: number;
  className?: string;
}

export default function AnimatedLogo({ customLogoUrl, size = 38, className = "" }: AnimatedLogoProps) {
  if (customLogoUrl && customLogoUrl.length > 5) {
    return (
      <div
        className={"relative flex items-center justify-center overflow-hidden shrink-0 " + className}
        style={{ width: size, height: size }}
      >
        <img
          src={customLogoUrl}
          alt="Axon"
          className="w-full h-full object-contain animate-pulse"
        />
      </div>
    );
  }

  // لوگوی متحرک برداری فوق‌مدرن آکسون با هسته کوانتومی چرخشی و حلقه‌های الکترونی
  return (
    <div
      className={"relative flex items-center justify-center shrink-0 select-none " + className}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(2,132,199,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="axonNeonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="axonNeonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <filter id="axonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* حلقه مداری چرخشی ۱ */}
        <ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="18"
          stroke="url(#axonNeonGrad1)"
          strokeWidth="2.5"
          strokeDasharray="12 6"
          transform="rotate(-30 50 50)"
          className="origin-center"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="8s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* حلقه مداری چرخشی ۲ */}
        <ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="18"
          stroke="url(#axonNeonGrad2)"
          strokeWidth="2"
          strokeDasharray="8 8"
          transform="rotate(30 50 50)"
          className="origin-center"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 50 50"
            to="0 50 50"
            dur="6s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* شش‌ضلعی هندسی تیتانیوم مرکزی */}
        <polygon
          points="50,22 74,36 74,64 50,78 26,64 26,36"
          stroke="url(#axonNeonGrad1)"
          strokeWidth="3.5"
          fill="rgba(2, 132, 199, 0.12)"
          filter="url(#axonGlow)"
        >
          <animate
            attributeName="stroke-width"
            values="3;4.5;3"
            dur="2s"
            repeatCount="indefinite"
          />
        </polygon>

        {/* هسته کوانتومی درخشان */}
        <circle cx="50" cy="50" r="8" fill="url(#axonNeonGrad1)">
          <animate
            attributeName="r"
            values="7;10;7"
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;1;0.8"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
`);

// ۳. کامپوننت هیرو سه‌بعدی Three.js کاملاً برجسته و واکنش‌گرا
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

    // ۱. ساخت صحنه و رندرر WebGL
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 6.2);

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

    // ۲. نورپردازی استودیویی اپل (Studio Lighting Rig)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const keySpot = new THREE.SpotLight(0x0284c7, 24, 35, Math.PI / 3, 0.4);
    keySpot.position.set(6, 6, 6);
    scene.add(keySpot);

    const fillCyan = new THREE.PointLight(0x38bdf8, 16, 25);
    fillCyan.position.set(-6, -3, 4);
    scene.add(fillCyan);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 6);
    rimLight.position.set(0, 8, -5);
    scene.add(rimLight);

    // ۳. گروه اصلی هسته سه‌بعدی (3D Core Group)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // کره شیشه‌ای شکست نور کوانتومی (Optical Glass Icosahedron)
    const coreGeo = new THREE.IcosahedronGeometry(1.65, 4);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x071529,
      emissiveIntensity: 0.4,
      roughness: 0.08,
      metalness: 0.15,
      transmission: 0.9,
      ior: 1.52,
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

    // ۴. حلقه‌های تیتانیومی مداری چرخشی (Orbital Gyro Rings)
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const ringGeo1 = new THREE.TorusGeometry(2.35, 0.03, 16, 120);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.95,
      roughness: 0.2,
      transparent: true,
      opacity: 0.5,
    });
    const ringGeo2 = new THREE.TorusGeometry(2.75, 0.025, 16, 120);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // ۵. ماتریس ذرات نئونی معلق (Quantum Particle Matrix)
    const particleCount = 180;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 12;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 6;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ۶. رهگیری تعاملی حرکت ماوس و لمس
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

    // ۷. حلقه رندرینگ ۶۰ فریم
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      coreMesh.rotation.y = elapsedTime * 0.3;
      coreMesh.rotation.x = Math.sin(elapsedTime * 0.25) * 0.25;
      wireMesh.rotation.y = -elapsedTime * 0.35;
      wireMesh.rotation.z = elapsedTime * 0.2;

      ring1.rotation.z = elapsedTime * 0.25;
      ring1.rotation.y = Math.sin(elapsedTime * 0.35) * 0.5;

      ring2.rotation.x = -elapsedTime * 0.2;
      ring2.rotation.z = Math.cos(elapsedTime * 0.3) * 0.4;

      particles.rotation.y = elapsedTime * 0.08;

      targetX += (mouseX - targetX) * 0.06;
      targetY += (mouseY - targetY) * 0.06;

      coreGroup.rotation.y = targetX * 0.7;
      coreGroup.rotation.x = -targetY * 0.7;
      camera.position.x = targetX * 0.35;
      camera.position.y = targetY * 0.35;
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
      className="w-full h-full min-h-[300px] sm:min-h-[360px] relative flex items-center justify-center select-none"
    />
  );
}
`);

// ۴. اصلاح کاتالوگ محصولات با قیمت‌های رسمی و تصاویر باکیفیت
writeProjectFile('services/productService.ts', `"use client";

import { supabase } from "@/lib/supabase";
import { realtimeEngine } from "@/lib/realtimeSync";

export interface ProductVariant {
  id: string;
  name: string;
  colorHex?: string;
  modelType?: string;
  priceDelta?: number;
  stock?: number;
}

export interface MarketBenchmark {
  storeName: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  warranty: string;
  isOurStore?: boolean;
  deliveryTime?: string;
  logo?: string;
}

export interface Product {
  id: string;
  title: string;
  name?: string;
  title_fa?: string;
  sku?: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  discount_price?: number;
  originalPrice?: number;
  stock: number;
  category: string;
  category_id?: string;
  category_name?: string;
  description: string;
  short_description?: string;
  highlights?: string[];
  image: string;
  image_url?: string;
  images: string[];
  variants?: ProductVariant[];
  specs: Record<string, string>;
  warranty?: string;
  badge?: string;
  isAvailable: boolean;
  is_available?: boolean;
  is_featured?: boolean;
  market_comparison?: MarketBenchmark[];
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_PRODUCTS_CACHE = "axon_products_registry_cache_v2026";

export const FLAGSHIP_7_PRODUCTS: Product[] = [
  {
    id: "prod-macbook-pro-m5-max",
    title: "MacBook Pro 16 Inch (Apple M4 Max, 128GB RAM, 2TB SSD)",
    name: "MacBook Pro 16 Inch (Apple M4 Max, 128GB RAM, 2TB SSD)",
    title_fa: "لپ‌تاپ پرچمدار ۱۶ اینچ با تراشه M4 Max، حافظه رم ۱۲۸ گیگابایت و ۲ ترابایت SSD",
    brand: "Apple",
    category: "لپ‌تاپ و اولترابوک",
    price: 310000000,
    discountPrice: 208500000,
    discount_price: 208500000,
    originalPrice: 310000000,
    stock: 8,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی آکسون + مهلت تست ۷ روزه",
    badge: "⚡ ابرقدرت پردازش",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800"
    ],
    description: "ورک‌استیشن پرتابل ۱۶ اینچ با صفحه Liquid Retina XDR، پردازشگر ۱۶ هسته‌ای M4 Max با ۴۰ هسته گرافیکی و پهنای باند حافظه ۵۴۶ گیگابایت بر ثانیه.",
    highlights: [
      "تراشه ۳ نانومتری با ۴۰ هسته گرافیکی",
      "رم یکپارچه ۱۲۸ گیگابایت فوق‌سریع",
      "صفحه نمایش ۱۲۰ هرتز Liquid Retina XDR",
      "باتری با دوام تا ۲۲ ساعت کار مداوم"
    ],
    specs: {
      "پردازنده مرکزی": "Apple M4 Max (16-Core CPU, 40-Core GPU)",
      "حافظه رم": "128GB Unified Memory",
      "حافظه ذخیره‌سازی": "2TB NVMe SSD",
      "نمایشگر": "16.2 Inch Liquid Retina XDR (120Hz ProMotion)"
    }
  },
  {
    id: "prod-studio-display-5k",
    title: "Apple Studio Display 27 Inch 5K Retina (Nano-Texture)",
    name: "Apple Studio Display 27 Inch 5K Retina (Nano-Texture)",
    title_fa: "نمایشگر ۲۷ اینچ ۵K رتینا با شیشه مات نانوتکستچر و کالیبراسیون سخت‌افزاری",
    brand: "Apple",
    category: "صوتی و تصویر",
    price: 135000000,
    discountPrice: 128500000,
    discount_price: 128500000,
    originalPrice: 135000000,
    stock: 6,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی آکسون",
    badge: "🖥️ وضوح شگفت‌انگیز 5K",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"],
    description: "نمایشگر حرفه‌ای ۲۷ اینچ با تفکیک رنگ ۱۰ بیتی، پوشش کامل گاموت DCI-P3، درگاه تاندربولت ۳ و سیستم صوتی ۶ درایور استودیو.",
    highlights: ["پنل 5K رتینا با ۲۱۸ PPI", "پوشش ۹۹.۲٪ گاموت DCI-P3", "شیشه نانوتکستچر ضد انعکاس"],
    specs: { "رزولوشن": "5120 در 2880 پیکسل", "روشنایی": "600 نیت پایدار", "پورت‌ها": "Thunderbolt 3 + USB-C" }
  },
  {
    id: "prod-apple-watch-ultra-3",
    title: "Apple Watch Ultra 2 (Titanium Case, 49mm GPS)",
    name: "Apple Watch Ultra 2 (Titanium Case, 49mm GPS)",
    title_fa: "ساعت هوشمند پرچمدار بدنه تیتانیوم ۴۹ میلی‌متری با روشنایی ۳۰۰۰ نیت",
    brand: "Apple",
    category: "گجت‌های هوشمند",
    price: 58500000,
    discountPrice: 55800000,
    discount_price: 55800000,
    originalPrice: 58500000,
    stock: 12,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی تعویض طلایی شرکتی",
    badge: "🏔️ مقاوم‌ترین ساعت هوشمند",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
    description: "ساعت هوشمند پرچمدار با بدنه تیتانیوم گرید هوافضا، شیشه یاقوت کبود، روشنایی نمایشگر ۳۰۰۰ نیت و مقاومت در برابر آب تا عمق ۱۰۰ متر.",
    highlights: ["روشنایی خیره‌کننده ۳۰۰۰ نیت", "بدنه تیتانیوم گرید ۵", "عمق‌سنج خودکار و آژیر اضطراری"],
    specs: { "جنس بدنه": "Titanium Grade 5", "روشنایی": "3000 Nits OLED", "مقاومت آب": "100 متر (WR100)" }
  },
  {
    id: "prod-ipad-pro-13-m5",
    title: "iPad Pro 13 Inch (Apple M4, Tandem OLED, 256GB)",
    name: "iPad Pro 13 Inch (Apple M4, Tandem OLED, 256GB)",
    title_fa: "تبلت پرچمدار ۱۳ اینچ با نمایشگر Tandem OLED و تراشه M4",
    brand: "Apple",
    category: "گجت‌های هوشمند",
    price: 98500000,
    discountPrice: 94900000,
    discount_price: 94900000,
    originalPrice: 98500000,
    stock: 9,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی",
    badge: "🎨 باریک‌ترین تبلت دنیا",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800"],
    description: "باریک‌ترین دستگاه تاریخ با ضخامت ۵.۱ میلی‌متر، نمایشگر Ultra Retina XDR با دو لایه اولد تاندم و قدرت پردازش تراشه M4.",
    highlights: ["فناوری Tandem OLED", "ضخامت شگفت‌انگیز ۵.۱ میلی‌متر", "پردازنده پرقدرت M4"],
    specs: { "نمایشگر": "13.0 Inch Tandem OLED", "روشنایی": "1600 Nits Peak", "ضخامت": "5.1 میلی‌متر" }
  },
  {
    id: "prod-pro-display-xdr-6k",
    title: "Apple Pro Display XDR 32 Inch 6K Retina (HDR 1600 Nits)",
    name: "Apple Pro Display XDR 32 Inch 6K Retina (HDR 1600 Nits)",
    title_fa: "نمایشگر پرچمدار ۳۲ اینچ ۶K با روشنایی ۱۶۰۰ نیت و کنتراست ۱,۰۰۰,۰۰۰:۱",
    brand: "Apple",
    category: "صوتی و تصویر",
    price: 295000000,
    discountPrice: 279000000,
    discount_price: 279000000,
    originalPrice: 295000000,
    stock: 4,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی تعویض طلایی",
    badge: "💎 استاندارد 6K HDR",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"],
    description: "نمایشگر ۶K حرفه‌ای با ماتریس نوردهی موضعی ۵۷۶ زون، کنتراست ۱,۰۰۰,۰۰۰:۱ و پوشش ۱۰۰٪ فضای رنگی سینمایی.",
    highlights: ["رزولوشن 6K با ۲۰.۴ میلیون پیکسل", "روشنایی ۱۶۰۰ نیت", "کنتراست بی‌نهایت ۱,۰۰۰,۰۰۰:۱"],
    specs: { "رزولوشن": "6016 در 3384 پیکسل", "روشنایی پیک": "1600 نیت", "تعداد زون‌ها": "576 ناحیه مستقل" }
  },
  {
    id: "prod-decklink-8k-pro",
    title: "Blackmagic DeckLink 8K Pro Capture Card",
    name: "Blackmagic DeckLink 8K Pro",
    title_fa: "کارت کپچر و پردازش ویدیویی 8K با درگاه چهارگانه 12G-SDI",
    brand: "Blackmagic Design",
    category: "سخت‌افزار و پردازش",
    price: 68000000,
    discountPrice: 63500000,
    discount_price: 63500000,
    originalPrice: 68000000,
    stock: 5,
    isAvailable: true,
    is_available: true,
    is_featured: false,
    warranty: "۲ سال گارانتی معتبر شرکتی",
    badge: "🎬 پردازش 8K RAW",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
    images: ["https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"],
    description: "کارت کپچر PCIe نسل جدید با پشتیبانی از استریم‌های 8K DCI تا ۶۰ فریم در ثانیه با عمق رنگ ۱۲ بیت RGB 4:4:4.",
    highlights: ["پشتیبانی تا 8K DCI", "چهار پورت دوطرفه 12G-SDI", "رابط PCIe Gen3 x8 با تاخیر صفر"],
    specs: { "رزولوشن کپچر": "8K DCI 60p", "عمق رنگ": "12-Bit RGB 4:4:4", "درگاه‌ها": "4x 12G-SDI" }
  },
  {
    id: "prod-calibrite-colorchecker",
    title: "Calibrite ColorChecker Display Plus Sensor",
    name: "Calibrite ColorChecker Display Plus",
    title_fa: "سنسور کالیبراسیون سخت‌افزاری نمایشگرها تا ۲۰۰۰ نیت",
    brand: "Calibrite",
    category: "هوش مصنوعی و دیجیتال",
    price: 29500000,
    discountPrice: 27800000,
    discount_price: 27800000,
    originalPrice: 29500000,
    stock: 7,
    isAvailable: true,
    is_available: true,
    is_featured: false,
    warranty: "۱ سال گارانتی تعویض شرکتی",
    badge: "🎯 دقت سنجش رنگ",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800",
    images: ["https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800"],
    description: "حسگر کالیبراسیون اپتیکال برای سنجش دقیق نمایشگرهای HDR، OLED و Mini-LED تا روشنایی ۲۰۰۰ نیت.",
    highlights: ["سنجش شدت نور تا ۲۰۰۰ نیت", "فیلتر اپتیکال شیشه‌ای", "سازگار با ویندوز و مک"],
    specs: { "دامنه سنجش": "0.05 تا 2000 cd/m2", "دقت": "Delta E < 0.2", "اتصال": "USB-C" }
  }
];

export function normalizeProduct(p: any): Product {
  if (!p) return FLAGSHIP_7_PRODUCTS[0];

  const matchedFlagship = FLAGSHIP_7_PRODUCTS.find((f) => String(f.id) === String(p.id));

  let price = Number(p.price || 0);
  let discountPrice = p.discountPrice !== undefined ? Number(p.discountPrice) : (p.discount_price !== undefined ? Number(p.discount_price) : undefined);

  if ((!price || price <= 0) && matchedFlagship) {
    price = matchedFlagship.price;
    discountPrice = matchedFlagship.discountPrice;
  }

  const title = (p.title && p.title !== "کالای تکنولوژی") ? p.title : (matchedFlagship?.title || p.name || "کالای تکنولوژی آکسون");

  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : (matchedFlagship?.images || [p.image || p.image_url || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"]);

  const stock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 10;
  const isAvailable = p.is_available !== false && p.isAvailable !== false && stock > 0;

  return {
    ...p,
    id: String(p.id),
    title,
    name: title,
    title_fa: p.title_fa || matchedFlagship?.title_fa || "",
    sku: p.sku || \`SKU-\${String(p.id).slice(-6)}\`,
    brand: p.brand || matchedFlagship?.brand || "Apple",
    price: price > 0 ? price : 55800000,
    discountPrice: discountPrice && discountPrice > 0 ? discountPrice : undefined,
    discount_price: discountPrice && discountPrice > 0 ? discountPrice : undefined,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : price,
    stock,
    category: p.category || matchedFlagship?.category || "تکنولوژی",
    description: p.description || matchedFlagship?.description || "تجهیزات تخصصی و گجت‌های نوین با گارانتی اصالت طلایی آکسون",
    short_description: p.short_description || matchedFlagship?.short_description || "",
    highlights: Array.isArray(p.highlights) && p.highlights.length > 0 ? p.highlights : (matchedFlagship?.highlights || []),
    image: images[0],
    image_url: images[0],
    images,
    variants: Array.isArray(p.variants) ? p.variants : [],
    specs: p.specs && typeof p.specs === "object" ? p.specs : (matchedFlagship?.specs || {}),
    warranty: p.warranty || matchedFlagship?.warranty || "۱۸ ماه گارانتی اصالت طلایی آکسون",
    badge: p.badge || matchedFlagship?.badge || "",
    isAvailable,
    is_available: isAvailable,
    is_featured: Boolean(p.is_featured ?? matchedFlagship?.is_featured),
    market_comparison: Array.isArray(p.market_comparison) ? p.market_comparison : [],
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  };
}

export const productService = {
  getProductSync(id: string): Product | null {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE);
        if (cached) {
          const list: Product[] = JSON.parse(cached);
          const found = list.find((p) => p.id === id);
          if (found) return normalizeProduct(found);
        }
      } catch {}
    }
    const defaultItem = FLAGSHIP_7_PRODUCTS.find((p) => p.id === id);
    return defaultItem ? normalizeProduct(defaultItem) : null;
  },

  getAllSync(): Product[] {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(normalizeProduct);
          }
        }
      } catch {}
    }
    return FLAGSHIP_7_PRODUCTS.map(normalizeProduct);
  },

  async getAll(): Promise<Product[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const normalized = data.map(normalizeProduct);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(normalized));
          }
          return normalized;
        }
      }
      return this.getAllSync();
    } catch {
      return this.getAllSync();
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return normalizeProduct(data);
        }
      }
      return this.getProductSync(id);
    } catch {
      return this.getProductSync(id);
    }
  },

  async saveProduct(productData: Partial<Product>): Promise<Product | null> {
    try {
      const id = productData.id || \`prod_\${Date.now()}\`;
      const normalized = normalizeProduct({ ...productData, id });

      const dbPayload: any = {
        id: normalized.id,
        title: normalized.title,
        name: normalized.title,
        title_fa: normalized.title_fa || null,
        sku: normalized.sku || null,
        brand: normalized.brand || "Apple",
        price: normalized.price,
        discount_price: normalized.discountPrice || null,
        stock: normalized.stock,
        category: normalized.category,
        description: normalized.description,
        short_description: normalized.short_description || null,
        highlights: normalized.highlights || [],
        image: normalized.image,
        image_url: normalized.image,
        images: normalized.images,
        variants: normalized.variants || [],
        specs: normalized.specs || {},
        warranty: normalized.warranty || null,
        badge: normalized.badge || null,
        is_available: normalized.is_available,
        is_featured: normalized.is_featured,
        market_comparison: normalized.market_comparison || [],
        meta_title: normalized.meta_title || normalized.title,
        meta_description: normalized.meta_description || normalized.short_description || null,
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        await supabase.from("products").upsert(dbPayload, { onConflict: "id" });
      }

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = [normalized, ...all.filter((p) => p.id !== normalized.id)];
        localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(updated));
        realtimeEngine.broadcastLocally("products_updated", updated);
      }

      return normalized;
    } catch (e) {
      console.error("productService.saveProduct error:", e);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("products").delete().eq("id", id);
      }

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = all.filter((p) => p.id !== id);
        localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(updated));
        realtimeEngine.broadcastLocally("products_updated", updated);
      }
      return true;
    } catch (e) {
      console.error("productService.deleteProduct error:", e);
      return false;
    }
  },
};

export default productService;
`);

// ۵. بازنویسی هدر با لوگوی متحرک SVG
writeProjectFile('components/Header.tsx', `"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { siteInfoService, SiteInfo, DEFAULT_SITE_INFO } from "@/services/siteInfoService";
import { productService, Product } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { formatPrice } from "@/lib/formatters";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function Header() {
  const router = useRouter();
  const cartContext = useCart();
  const { totalItems, toggleCart, addToCart } = cartContext;

  const [mounted, setMounted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState<Record<string | number, boolean>>({});

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      applyTheme(isDark);
    } catch {}

    const initHeaderData = async () => {
      try {
        const [info, prods, cats] = await Promise.all([
          siteInfoService.getSiteInfo(),
          productService.getAll(),
          categoryService.getAll(),
        ]);
        if (info) setSiteInfo(info);
        if (prods) setAllProducts(prods);
        if (cats) setCategories(cats);
      } catch {}
    };

    initHeaderData();

    const handleSiteInfoUpdate = (e: any) => { if (e.detail) setSiteInfo(e.detail); };
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setAllProducts(e.detail);
    };

    window.addEventListener("site_info_updated", handleSiteInfoUpdate);
    window.addEventListener("products_updated", handleProductsUpdate);

    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) setIsCategoryOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteInfoUpdate);
      window.removeEventListener("products_updated", handleProductsUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    soundEngine.playClick();
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    applyTheme(nextDark);
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase().trim();
    userBehavior.trackSearch(q);
    const matches = allProducts.filter((p) =>
      (p.title || p.name || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    );
    setSearchResults(matches.slice(0, 5));
  }, [searchQuery, allProducts]);

  const handleSelectCategory = (catName: string) => {
    soundEngine.playClick();
    setIsCategoryOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("category_selected", { detail: catName }));
    }
    router.push("/#products");
  };

  const handleQuickAddFromSearch = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    soundEngine.playAddToCart();
    addToCart({
      id: product.id,
      title: product.title || product.name || "کالای دیجیتال",
      name: product.title || product.name || "کالای دیجیتال",
      price: Number(product.discountPrice ?? product.price ?? 0),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
      image: product.images?.[0] || product.image || "/placeholder.png",
      stock: Number(product.stock ?? 10),
      category: product.category || "عمومی",
      quantity: 1,
    });
    setAddedItemMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedItemMap((prev) => ({ ...prev, [product.id]: false })), 1500);
  };

  const navLinks = [
    { title: "کاتالوگ محصولات", href: "/#products" },
    { title: "اخبار تکنولوژی", href: "/news" },
    { title: "مجله سئو", href: "/blog" },
    { title: "پیگیری سفارش", href: "/track-order" },
    { title: "تماس با ما", href: "/contact" },
  ];

  const storeName = siteInfo?.site_name || siteInfo?.siteName || "AXON";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;

  return (
    <header className="sticky top-2 sm:top-4 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 font-sans text-[var(--text-primary)] select-none" dir="rtl" suppressHydrationWarning>
      <div className="w-full glass-morphism rounded-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => { soundEngine.playClick(); setIsCategoryOpen(!isCategoryOpen); }}
              className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm transition cursor-pointer text-[var(--text-primary)] shadow-sm"
              title="دسته‌بندی‌های کالا"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            {isCategoryOpen && (
              <div className="absolute top-12 right-0 w-64 p-2 rounded-2xl glass-morphism shadow-2xl z-50 animate-fadeIn space-y-1 bg-[var(--modal-bg)]">
                <button
                  onClick={() => handleSelectCategory("all")}
                  className="w-full text-right p-2.5 rounded-xl text-xs font-black text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
                >
                  ⚡ تمامی محصولات
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => handleSelectCategory(cat.name)}
                    className="w-full text-right p-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
                  >
                    🏷️ {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/" className="flex items-center gap-3 group">
            <AnimatedLogo customLogoUrl={logoUrl} size={40} />
            <div className="text-xl font-black text-[var(--text-primary)] tracking-tighter group-hover:text-[var(--accent-blue)] transition">{storeName}</div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-6 text-sm opacity-80">
          {navLinks.map((link, idx) => (
            <Link key={idx} href={link.href} className="hover:opacity-100 hover:text-[var(--accent-blue)] transition font-bold text-[var(--text-primary)]">
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block" ref={searchContainerRef}>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] focus-within:border-[var(--accent-blue)] transition w-48">
              <span className="text-xs opacity-70">🔍</span>
              <input type="text" placeholder="جستجوی کالا..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)} className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] placeholder-slate-400 font-bold" />
            </div>
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 p-2 rounded-2xl glass-morphism shadow-2xl z-50 animate-fadeIn space-y-1 w-72 bg-[var(--modal-bg)]">
                {searchResults.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--input-bg)] transition gap-2">
                    <Link href={"/products/" + p.id} onClick={() => setIsSearchFocused(false)} className="flex items-center gap-2 flex-1 min-w-0">
                      <img src={p.images?.[0] || p.image || "/placeholder.png"} alt="" className="w-8 h-8 object-contain rounded-lg bg-white/5 p-0.5 shrink-0" />
                      <div className="flex-1 min-w-0 text-right">
                        <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{p.title || p.name}</h4>
                        <span className="font-mono font-black text-[10px] text-[var(--accent-blue)]">{formatPrice(p.discountPrice || p.price || 0)} ت</span>
                      </div>
                    </Link>
                    <button type="button" onClick={(e) => handleQuickAddFromSearch(e, p)} className="px-2 py-1 rounded-lg text-[10px] font-black bg-[var(--accent-blue)] text-white">
                      {addedItemMap[p.id] ? "✓" : "+"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm text-[var(--text-primary)]"
            title={isDarkMode ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
            suppressHydrationWarning
          >
            {mounted ? (
              isDarkMode ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )
            ) : (
              <span className="w-4 h-4" />
            )}
          </button>

          <button onClick={() => { soundEngine.playClick(); toggleCart(); }} className="p-2 opacity-80 hover:opacity-100 transition relative cursor-pointer text-[var(--text-primary)]" title="سبد خرید">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            {mounted && totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--accent-blue)] rounded-full text-[10px] font-mono font-black flex items-center justify-center text-white shadow-lg animate-pulse" suppressHydrationWarning>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
`);

// ۶. بازنویسی فوتر با لوگوی متحرک SVG
writeProjectFile('components/Footer.tsx', `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setInfo(d));
    const handleUpdate = (e: any) => { if (e.detail) setInfo(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const siteName = info?.site_name || info?.siteName || "AXON";
  const footerLogo = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url;

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-auto select-none transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-morphism p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <AnimatedLogo customLogoUrl={footerLogo} size={42} />
              <div className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">{siteName}</div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">مرجع تخصصی خرید جدیدترین گجت‌های نوین، سخت‌افزار و ابزارهای تکنولوژی با گارانتی اصالت طلایی.</p>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-[var(--accent-blue)]">دسترسی سریع</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/#products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ محصولات</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">پیگیری سفارش</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله سئو</Link></li>
            </ul>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-[var(--accent-blue)]">اطلاعات تماس</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li>تلفن: {info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸"}</li>
              <li>ایمیل: {info?.email || "info@axoncore.ir"}</li>
              <li>ساعات کاری: {info?.working_hours || "۹:۰۰ الی ۱۸:۰۰"}</li>
            </ul>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">ضمانت رسمی</h5>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">۱۰۰٪ اصالت فیزیکی کالا، مهلت تست ۷ روزه سخت‌افزاری و ارسال سریع پیشتاز به سراسر ایران.</p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[var(--card-border)] text-center text-xs text-[var(--text-secondary)] font-bold">
          تمامی حقوق محفوظ است © {new Date().getFullYear()} {siteName}
        </div>
      </div>
    </footer>
  );
}
`);

// ۷. بازنویسی صفحه اصلی (Home) با هیرو اسپلیت ۳D گرید واقعی و برجسته
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-24 transition-colors duration-300" dir="rtl">
      <main className="pt-4 sm:pt-6 px-3 sm:px-6 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* هاب اخبار تکنولوژی ۶ ساعته */}
        <TechRadarFeed />

        {/* ۱. هیرو اسپلیت ۳D گرید واقعی (Right: تایپوگرافی شیشه‌ای | Left: کانواس ۳D کوانتومی) */}
        <section className="w-full rounded-[2.5rem] overflow-hidden glass-morphism p-6 sm:p-10 shadow-2xl border border-[var(--card-border)] relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* ستون راست: متن و دکمه‌های اقدام */}
          <div className="lg:col-span-7 space-y-4 text-right z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-bold text-xs border border-[var(--accent-blue)]/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>اکوسیستم تکنولوژی ۲۰۲۶ و کالبدشکافی ۳D اختصاصی</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight text-[var(--text-primary)]">
              مرجع تخصصی خرید جدیدترین گجت‌ها و سخت‌افزار نوین
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
              تامین مستقیم انواع مانیتورهای ۵K رتینا، مک‌بوک‌های ورک‌استیشن M4 Max، ساعت‌های اولترا و تجهیزات ضبط استودیویی با ۱۸ ماه گارانتی اصالت طلایی و ارسال پیشتاز به سراسر ایران.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link
                href="/#products"
                className="bg-[var(--accent-blue)] text-white px-8 py-3.5 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/25 flex items-center gap-2"
              >
                <span>مشاهده کاتالوگ محصولات</span>
                <span>←</span>
              </Link>
              
              <Link
                href="/products/prod-studio-display-5k"
                className="bg-[var(--input-bg)] hover:bg-[var(--accent-blue)]/10 text-[var(--text-primary)] px-6 py-3.5 rounded-full font-bold text-xs border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition flex items-center gap-1.5"
              >
                <span>🧬</span>
                <span>تست کالبدشکافی ۳D کالا</span>
              </Link>
            </div>
          </div>

          {/* ستون چپ: بوم تعاملی سه‌بعدی Three.js کاملاً شفاف و درخشان */}
          <div className="lg:col-span-5 h-[320px] sm:h-[400px] w-full relative flex items-center justify-center rounded-3xl bg-[var(--input-bg)]/40 border border-[var(--card-border)] overflow-hidden shadow-inner">
            <div className="absolute top-3 right-4 z-20 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-blue-300 font-bold">
              ⚡ Three.js Quantum Core
            </div>
            <Hero3DCanvas />
          </div>
        </section>

        {/* ۲. گرید محصولات */}
        <section id="products" className="space-y-6">
          <div className="border-b border-[var(--card-border)] pb-4 px-1 flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                محصولات و تجهیزات تکنولوژی
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
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

        {/* ۳. بخش مقالات سئو */}
        <section className="glass-morphism rounded-3xl p-6 sm:p-8 space-y-4">
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
        <article key={post.id || post.title} className="glass-morphism p-4 rounded-2xl space-y-2 flex flex-col justify-between hover:border-[var(--accent-blue)] transition duration-300">
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

// ۸. به‌روزرسانی ProductCard با دکمه ۳D Teardown و قیمت‌های دقیق
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
        className="glass-morphism rounded-3xl overflow-hidden p-5 flex flex-col justify-between group select-none relative"
        dir="rtl"
      >
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--input-bg)] mb-4 flex items-center justify-center p-3 border border-[var(--card-border)]">
          <Link href={"/products/" + product.id} className="w-full h-full flex items-center justify-center">
            <img src={mainImage} alt={title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
          </Link>
          
          <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
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
            className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-xl bg-black/70 hover:bg-blue-600 text-white font-bold text-[10px] border border-white/20 backdrop-blur-md transition flex items-center gap-1 shadow-md cursor-pointer"
            title="مشاهده کالبدشکافی ۳D"
          >
            <span>🧬</span>
            <span>۳D</span>
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
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{isAvailable ? "موجود ✓" : "ناموجود"}</span>
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
              className="py-2.5 bg-[var(--accent-blue)] text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-90 transition cursor-pointer disabled:opacity-40"
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

// ۹. کامیت و استقرار روی ریپازیتوری
console.log('\n📦 در حال ثبت کامیت و استقرار روی گیت‌هاب / Vercel...');
try {
  execSync('git add . && git commit -m "feat(3d): deploy split 3D hero grid, animated SVG logos, fixed pricing and Draftly teardown" && git push origin main', { stdio: 'inherit' });
  console.log('\n🎉 [SUCCESS] استقرار نهایی با موفقیت کامل ۱۰۰٪ انجام شد!');
} catch (e) {
  console.log('\nℹ️ در صورت لزوم دستور زیر را در ترمینال اجرا کنید:');
  console.log('git add . && git commit -m "feat(3d): deploy 3D engine" && git push');
}