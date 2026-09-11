"use client";

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
                  className={`p-2.5 rounded-xl border text-right transition truncate ${
                    selectedLayer?.id === l.id
                      ? "bg-blue-600/25 border-blue-500 text-white font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
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
