// components/ProductExplodedView.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { TeardownData, TeardownComponent } from "@/app/api/ai-teardown/route";

interface ProductExplodedViewProps {
  productId: string;
  productTitle: string;
  category?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductExplodedView({
  productId,
  productTitle,
  category,
  isOpen,
  onClose,
}: ProductExplodedViewProps) {
  const [data, setData] = useState<TeardownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [explosionDistance, setExplosionDistance] = useState<number>(65); // درصد انفصال لایه‌ها (۰ تا ۱۰۰)
  const [rotationX, setRotationX] = useState<number>(18);
  const [rotationY, setRotationY] = useState<number>(-24);
  const [selectedComponent, setSelectedComponent] = useState<TeardownComponent | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) return;

    async function loadTeardown() {
      setLoading(true);
      try {
        const res = await fetch("/api/ai-teardown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, productTitle, category }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          if (json.data.components?.length > 0) {
            setSelectedComponent(json.data.components[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load exploded view data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTeardown();
  }, [isOpen, productId, productTitle, category]);

  // چرخش خودکار نرم سه‌بعدی
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setRotationY((prev) => (prev + 0.4) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [autoRotate]);

  // کنترل چرخش سه‌بعدی با درگ ماوس و تاچ لمسی موبایل
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setAutoRotate(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;

    setRotationY((prev) => prev + deltaX * 0.45);
    setRotationX((prev) => Math.max(-45, Math.min(65, prev - deltaY * 0.45)));

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  if (!isOpen) return null;

  const components = data?.components || [];
  const filteredComponents = filterCategory === "all"
    ? components
    : components.filter((c) => c.category === filterCategory);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-2xl font-sans select-none animate-fadeIn text-slate-100"
      dir="rtl"
    >
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[850px] bg-slate-900/90 border border-slate-700/70 rounded-[2.5rem] shadow-2xl flex flex-col justify-between overflow-hidden backdrop-blur-3xl">
        
        {/* سربرگ هوشمند نمای انفجاری */}
        <header className="p-4 sm:p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xl shadow-lg animate-pulse">
              🧬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  کالبدشکافی هوشمند و نمای انفجاری ۳D (AI Spatial Teardown)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px]">
                  ۶۰ FPS Hardware Accelerated
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                کالبدشکافی معماری قطعات، مدارات نوری و مهندسی: <strong className="text-white">{productTitle}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                autoRotate
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              {autoRotate ? "توقف چرخش خودکار ⏸️" : "چرخش ۳۶۰ درجه ▶️"}
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 hover:text-white transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent animate-spin rounded-full shadow-lg" />
            <p className="text-xs font-bold text-slate-400">
              در حال رندر لایه‌های سه‌بعدی و تجزیه ساختار مهندسی قطعات توسط هوش مصنوعی...
            </p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            
            {/* بوم نمایش تعاملی ۳D Exploded View */}
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="lg:col-span-7 h-[360px] lg:h-full relative flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden bg-radial from-blue-950/20 via-slate-950 to-slate-950 border-b lg:border-b-0 lg:border-l border-slate-800"
            >
              {/* نشانگرهای راهنما */}
              <div className="absolute top-4 right-4 z-10 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 backdrop-blur-md">
                🖱️ درگ کنید تا زاویه تغییر کند (X: {Math.round(rotationX)}°, Y: {Math.round(rotationY)}°)
              </div>

              {/* کانتینر پرسپکتیو سه‌بعدی */}
              <div
                className="relative w-64 h-64 sm:w-80 sm:h-80 transition-transform duration-75 ease-out"
                style={{
                  perspective: "1200px",
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
                }}
              >
                {components.map((comp) => {
                  const isSelected = selectedComponent?.id === comp.id;
                  // محاسبه جابجایی هر لایه در محور Z بر اساس اسلایدر انفصال
                  const offsetFactor = (comp.depthIndex - 3.5) * (explosionDistance * 2.6);
                  const opacity = filterCategory === "all" || filterCategory === comp.category ? 1 : 0.2;

                  return (
                    <div
                      key={comp.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedComponent(comp);
                      }}
                      className={`absolute inset-0 rounded-3xl border transition-all duration-500 cursor-pointer flex flex-col justify-between p-4 backdrop-blur-md ${
                        isSelected
                          ? "border-blue-400 bg-blue-600/30 shadow-[0_0_35px_rgba(59,130,246,0.6)] ring-2 ring-blue-400/60 scale-105"
                          : "border-slate-600/60 bg-slate-800/40 hover:border-blue-400 hover:bg-slate-800/80"
                      }`}
                      style={{
                        transform: `translateZ(${offsetFactor}px) translateY(${(comp.depthIndex - 3.5) * 6}px)`,
                        transformStyle: "preserve-3d",
                        opacity,
                      }}
                    >
                      {/* هدر لایه */}
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-slate-300 font-mono font-bold">
                          لایه #{comp.depthIndex}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                      </div>

                      {/* گرافیک بصری ماکت قطعه */}
                      <div className="flex flex-col items-center justify-center space-y-1.5 my-auto">
                        <span className="text-3xl sm:text-4xl drop-shadow-md">
                          {comp.category === "optics"
                            ? "💎"
                            : comp.category === "panel"
                            ? "🖥️"
                            : comp.category === "chipset"
                            ? "🧠"
                            : comp.category === "audio"
                            ? "🔊"
                            : comp.category === "power"
                            ? "⚡"
                            : "🛡️"}
                        </span>
                        <h5 className="font-black text-xs text-center text-white truncate max-w-[90%]">
                          {comp.nameFa}
                        </h5>
                        <span className="text-[9px] font-mono text-blue-300/80 truncate max-w-[95%]">
                          {comp.name}
                        </span>
                      </div>

                      {/* فوتر لایه */}
                      <div className="text-center">
                        <span className="text-[9px] text-slate-400 font-medium truncate block">
                          {comp.material}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* کنترلر شناور فاصله انفصال لایه‌ها */}
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-xl space-y-2 z-10 sm:w-72 shadow-2xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-white flex items-center gap-1.5">
                    <span>💥</span>
                    <span>شدت انفصال لایه‌ها:</span>
                  </span>
                  <span className="font-mono font-black text-blue-400">{explosionDistance}٪</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={explosionDistance}
                  onChange={(e) => setExplosionDistance(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>مونتاژ کامل (۰٪)</span>
                  <span>انفجار حداکثری (۱۰۰٪)</span>
                </div>
              </div>
            </div>

            {/* سایدبار اطلاعات و آنالیز مهندسی لایه انتخاب‌شده */}
            <div className="lg:col-span-5 p-5 sm:p-7 space-y-5 overflow-y-auto bg-slate-950/50 flex flex-col justify-between text-xs">
              {selectedComponent ? (
                <div className="space-y-4">
                  
                  {/* عنوان و نقش قطعه */}
                  <div className="space-y-1.5 border-b border-slate-800 pb-3.5">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black">
                        لایه شماره {selectedComponent.depthIndex} از {data?.totalLayers || 6}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        Category: {selectedComponent.category.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white leading-snug">
                      {selectedComponent.nameFa}
                    </h4>
                    <p className="text-slate-400 font-mono text-[11px] font-medium">
                      {selectedComponent.name}
                    </p>
                  </div>

                  {/* عملکرد و وظیفه قطعه */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="font-black text-blue-400 block text-[11px]">
                      🎯 نقش استراتژیک در دستگاه:
                    </span>
                    <p className="text-slate-300 leading-relaxed font-medium">
                      {selectedComponent.role}
                    </p>
                  </div>

                  {/* نکته فوق‌العاده مهندسی */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <span className="font-black text-emerald-400 block text-[11px] flex items-center gap-1">
                      <span>💡</span>
                      <span>نوآوری و هایلایت مهندسی:</span>
                    </span>
                    <p className="text-emerald-300 leading-relaxed font-medium">
                      {selectedComponent.engineeringHighlight}
                    </p>
                  </div>

                  {/* جدول مشخصات فنی لایه */}
                  <div className="space-y-2">
                    <span className="font-black text-slate-300 block">
                      ⚙️ پارامترهای فنی و متالورژی:
                    </span>
                    <div className="space-y-1.5">
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">جنس متریال:</span>
                        <span className="font-bold text-slate-200">{selectedComponent.material}</span>
                      </div>
                      {Object.entries(selectedComponent.specifications || {}).map(([k, v]) => (
                        <div
                          key={k}
                          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between"
                        >
                          <span className="text-slate-400">{k}:</span>
                          <span className="font-mono font-bold text-blue-400">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 font-bold">
                  روی یکی از لایه‌های سه‌بعدی کلیک کنید تا آنالیز مهندسی آن بارگذاری شود.
                </div>
              )}

              {/* خلاصه معماری و امتیاز تعمیرپذیری در فوتر سایدبار */}
              <div className="pt-4 border-t border-slate-800 space-y-3 mt-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold">امتیاز تعمیرپذیری (iFixit Grade):</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    {data?.repairabilityScore || "9.0"} / 10
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                  ❄️ <strong>سیستم دفع حرارت:</strong> {data?.coolingEfficiency}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}