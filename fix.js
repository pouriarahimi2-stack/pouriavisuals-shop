/**
 * AXON CORE - Mobile & Tablet Ultra-Smooth 60fps & Touch Optimization (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره و بهینه‌سازی شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-MOBILE-ACCELERATION]\x1b[0m ۱. بهینه‌سازی شتاب سخت‌افزاری و روان‌سازی ۶۰fps...");

// =============================================================================
// ۱. ارتقای استایل‌های سراسری برای موبایل و تبلت در app/globals.css
// =============================================================================
const mobileOptimizedCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --card-border: rgba(15, 23, 42, 0.08);
  --card-border-hover: rgba(2, 132, 199, 0.35);
  --accent-blue: #0284c7;
  --accent-glow: rgba(2, 132, 199, 0.15);
  --modal-bg: #ffffff;
  --input-bg: #f1f5f9;
  --glass-surface: rgba(255, 255, 255, 0.88);
}

.dark {
  --bg-primary: #07090e;
  --bg-secondary: #0c1017;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --card-border: rgba(255, 255, 255, 0.08);
  --card-border-hover: rgba(56, 189, 248, 0.4);
  --accent-blue: #38bdf8;
  --accent-glow: rgba(56, 189, 248, 0.3);
  --modal-bg: #0c1017;
  --input-bg: rgba(255, 255, 255, 0.04);
  --glass-surface: rgba(12, 16, 23, 0.85);
}

html, body {
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100vw;
  scroll-behavior: smooth;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

body {
  font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-overflow-scrolling: touch;
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* شتاب‌دهی سخت‌افزاری برای کارت‌ها و المان‌های تعاملی موبایل */
.glass-morphism, [class*="rounded-"], button, input, select, textarea {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.glass-morphism {
  background: var(--glass-surface);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--card-border);
  box-shadow: 0 8px 30px 0 rgba(0, 0, 0, 0.06);
}

.dark .glass-morphism {
  box-shadow: 0 10px 35px 0 rgba(0, 0, 0, 0.45);
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* تاچ تارگت‌های ارگونومیک برای موبایل و تبلت */
@media (max-width: 768px) {
  button, input, select, textarea {
    min-height: 44px;
    font-size: 13px !important;
  }
}
`;
writeFile('app/globals.css', mobileOptimizedCss);

// =============================================================================
// ۲. بهینه‌سازی سبک و کم‌مصرف DraftlyProceduralTeardown.tsx برای موبایل
// =============================================================================
const mobileTeardownCode = `"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { soundEngine } from "@/lib/soundEngine";
import { classifyProductArchetype, generateDraftlyLayers, DraftlyLayerInfo } from "@/components/3d/DraftlyProceduralTeardown";

interface DraftlyTeardownProps {
  productTitle: string;
  productCategory?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DraftlyProceduralTeardown({
  productTitle,
  productCategory = "",
  isOpen,
  onClose,
}: DraftlyTeardownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [explosionDistance, setExplosionDistance] = useState<number>(55);
  const [selectedLayer, setSelectedLayer] = useState<DraftlyLayerInfo | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  const archetype = classifyProductArchetype(productTitle, productCategory);
  const layers = generateDraftlyLayers(archetype, productTitle);

  const meshesRef = useRef<THREE.Mesh[]>([]);
  const rotationRef = useRef({ x: 0.3, y: -0.5 });
  const isInteractingRef = useRef(false);
  const lastTouchRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) return;
    setSelectedLayer(layers[0]);
    setExplosionDistance(55);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, isMobile ? 8.5 : 7.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile, // در موبایل برای ۶۰ فریم روان آنتی‌الیاسینگ غیرفعال می‌شود
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const keySpot = new THREE.DirectionalLight(0x38bdf8, 2.5);
    keySpot.position.set(5, 5, 5);
    scene.add(keySpot);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    meshesRef.current = [];
    layers.forEach((layer) => {
      const geo = new THREE.BoxGeometry(
        layer.meshScale[0],
        layer.meshScale[1],
        layer.meshScale[2]
      );

      // متریال سریع و سازگار با چیپ گرافیکی موبایل
      const mat = new THREE.MeshStandardMaterial({
        color: layer.colorHex,
        metalness: isMobile ? 0.3 : layer.metalness,
        roughness: isMobile ? 0.4 : layer.roughness,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { layerId: layer.id, baseZ: layer.meshZOffset };
      mesh.position.set(0, 0, layer.meshZOffset);

      mainGroup.add(mesh);
      meshesRef.current.push(mesh);
    });

    // رویدادهای لمسی بدون تداخل با اسکرول صفحه
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isInteractingRef.current = true;
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setAutoRotate(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isInteractingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - lastTouchRef.current.x;
      const deltaY = e.touches[0].clientY - lastTouchRef.current.y;
      rotationRef.current.y += deltaX * 0.007;
      rotationRef.current.x = Math.max(-0.8, Math.min(0.8, rotationRef.current.x - deltaY * 0.007));
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      isInteractingRef.current = false;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate) {
        rotationRef.current.y += 0.005;
      }

      mainGroup.rotation.x = rotationRef.current.x;
      mainGroup.rotation.y = rotationRef.current.y;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);

      meshesRef.current.forEach((m) => {
        m.geometry.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
        else m.material.dispose();
      });

      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen, productTitle]);

  useEffect(() => {
    const factor = explosionDistance / 50;
    meshesRef.current.forEach((mesh) => {
      const baseZ = mesh.userData.baseZ || 0;
      mesh.position.z = baseZ * factor;
    });
  }, [explosionDistance]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-2xl font-sans select-none animate-fadeIn text-slate-100" dir="rtl">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[820px] bg-slate-900 border border-slate-700/60 rounded-[2rem] shadow-2xl flex flex-col justify-between overflow-hidden">
        
        <header className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80 shrink-0">
          <div>
            <h3 className="font-black text-xs sm:text-sm text-white truncate max-w-xs sm:max-w-md">{productTitle}</h3>
            <span className="text-[10px] text-blue-400 font-mono">3D Procedural Engine (60fps Touch Mode)</span>
          </div>

          <button
            onClick={() => { soundEngine.playClick(); onClose(); }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          <div
            ref={containerRef}
            className="md:col-span-8 h-[340px] md:h-full relative flex items-center justify-center overflow-hidden touch-none"
          >
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 border border-slate-800 p-3 rounded-2xl backdrop-blur-md space-y-1.5 z-20">
              <div className="flex justify-between text-xs font-black text-white">
                <span>انفصال لایه‌ها:</span>
                <span className="text-blue-400 font-mono">{explosionDistance}٪</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={explosionDistance}
                onChange={(e) => setExplosionDistance(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          <div className="md:col-span-4 p-4 space-y-3 overflow-y-auto bg-slate-950/60 text-xs">
            <span className="font-bold text-slate-400 text-[11px] block">لایه‌های ساختاری:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {layers.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { soundEngine.playClick(); setSelectedLayer(l); }}
                  className={\`p-2.5 rounded-xl border text-right transition truncate \${
                    selectedLayer?.id === l.id
                      ? "bg-blue-600/25 border-blue-500 text-white font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }\`}
                >
                  {l.nameFa}
                </button>
              ))}
            </div>

            {selectedLayer && (
              <div className="space-y-2 border-t border-slate-800 pt-3 text-[11px]">
                <h4 className="font-black text-white">{selectedLayer.nameFa}</h4>
                <p className="text-slate-300 leading-relaxed font-medium">{selectedLayer.role}</p>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">متریال:</span>
                    <span className="font-bold text-blue-400">{selectedLayer.metallurgyMaterial}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`;
writeFile('components/3d/DraftlyProceduralTeardown.tsx', mobileTeardownCode);

// =============================================================================
// ۳. بیلد نهایی پروژه و انتشار در Vercel
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و انتشار در ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "perf(mobile-touch): optimize 60fps scrolling, ergonomic touch targets and threejs mobile acceleration"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ بهینه‌سازی موبایل و تبلت با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}