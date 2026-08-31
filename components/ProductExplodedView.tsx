"use client";

import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface HardwareComponent {
  id: string;
  name: string;
  nameFa: string;
  category: "optics" | "camera" | "logicboard" | "battery" | "audio" | "chassis";
  depthIndex: number;
  role: string;
  specifications: Record<string, string>;
  engineeringHighlight: string;
  material: string;
  renderType: "display" | "camera" | "chipset" | "battery" | "audio" | "chassis";
}

export default function ProductExplodedView({
  productId,
  productTitle,
  category,
  isOpen,
  onClose,
}: {
  productId: string;
  productTitle: string;
  category?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [explosionDistance, setExplosionDistance] = useState<number>(65);
  const [rotationX, setRotationX] = useState<number>(16);
  const [rotationY, setRotationY] = useState<number>(-24);
  const [selectedComp, setSelectedComp] = useState<HardwareComponent | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [isExpanding, setIsExpanding] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // قطعات سخت‌افزاری فیزیکی بر اساس معماری دستگاه
  const components: HardwareComponent[] = [
    {
      id: "hw-1",
      name: "Ultra Retina XDR Tandem OLED Front Display",
      nameFa: "پنل نمایشگر اولد تاندم دو لایه با شیشه محافظ نانوتکستچر",
      category: "optics",
      depthIndex: 1,
      renderType: "display",
      role: "تولید تصویر با دو لایه ساطع‌کننده نور ارگانیک، کنتراست بی‌نهایت ۲,۰۰۰,۰۰۰:۱ و اوج روشنایی ۱۶۰۰ نیت",
      specifications: {
        "رزولوشن": "2752 در 2064 پیکسل (264 PPI)",
        "روشنایی پیک": "1600 Nits در حالت HDR",
        "فناوری پنل": "Tandem OLED دو لایه سریعی",
        "نرخ نوسازی": "10 تا 120 هرتز داینامیک ProMotion"
      },
      engineeringHighlight: "تلفیق نور دو پنل اولد جهت دستیابی به روشنایی مداوم ۱۰۰۰ نیت بدون پدیده Burn-in",
      material: "شیشه آلومینوسیلیکات تقویت‌شده با پوشش اولئوفوبیک ضد لک"
    },
    {
      id: "hw-2",
      name: "LiDAR Scanner & 12MP TrueDepth Camera Array",
      nameFa: "آرایه سنسورهای دوربین TrueDepth، فلاش تطبیقی و اسکنر LiDAR",
      category: "camera",
      depthIndex: 2,
      renderType: "camera",
      role: "ثبت نقشه سه‌بعدی محیط در کسری از نانوثانیه، احراز هویت Face ID و فیلم‌برداری سینمایی 4K ProRes",
      specifications: {
        "سنسور اصلی": "12MP با دیافراگم f/1.8",
        "اسکنر LiDAR": "برد موثر ۵ متر با پالس فوتونی مادون قرمز",
        "ضبط ویدیو": "4K ProRes تا ۶۰ فریم با تاخیر صفر"
      },
      engineeringHighlight: "محفظه ماژولار لنز با روکش بلور یاقوت کبود و لرزش‌گیر الکترونیکی",
      material: "شیشه اپتیکال یاقوت کبود و محفظه تیتانیومی"
    },
    {
      id: "hw-3",
      name: "Main Logic Board with Apple Silicon Neural Die",
      nameFa: "مادربرد مرکزی با پردازنده ۳ نانومتری و هسته‌های پردازش عصبی",
      category: "logicboard",
      depthIndex: 3,
      renderType: "chipset",
      role: "پردازش ۳۸ تریلیون عملیات هوش مصنوعی در ثانیه، رندرینگ رهگیری پرتو سخت‌افزاری (Ray Tracing) و مدیریت رم یکپارچه",
      specifications: {
        "تراشه مرکزی": "Apple Silicon 3nm با ۱۰ هسته CPU و ۱۰ هسته GPU",
        "موتور عصبی": "16-Core Neural Engine (38 TOPS)",
        "پهنای باند رم": "150 گیگابایت بر ثانیه Unified Memory",
        "درگاه ارتباطی": "Thunderbolt / USB4 با سرعت 40Gbps"
      },
      engineeringHighlight: "معماری انباشته ۳ نانومتری نسل دوم با تراکم ترانزیستوری فوق‌العاده بالا",
      material: "برد ۱۰ لایه مدار چاپی فایبرگلاس با آبکاری طلای غوطه‌ور ENIG"
    },
    {
      id: "hw-4",
      name: "High-Density Multi-Cell Battery Pack with Flex Rails",
      nameFa: "پک باتری چندسلولی لیتیوم-پلیمر با خطوط اتصال سریع مسی",
      category: "battery",
      depthIndex: 4,
      renderType: "battery",
      role: "تامین انرژی بدون افت تا ۱۰ ساعت رندر مداوم، پایش هوشمند سلامت سلول‌ها و شارژ سریع ۳۰ وات",
      specifications: {
        "ظرفیت انرژی": "38.99 وات ساعت پیوسته",
        "ساختار شیمیایی": "لیتیوم کبالت اکسید چگالی بالا",
        "پروتکل حفاظتی": "مدار کنترل حرارتی با ۶ سنسور دما"
      },
      engineeringHighlight: "توزیع بار متقارن در دو سلول مستقل جهت خنک‌کاری بهینه مادربرد",
      material: "فویل گرافیت فشرده، سلول لیتیوم-پلیمر و ریل‌های مسی خالص"
    },
    {
      id: "hw-5",
      name: "Four-Speaker Studio Sound Enclosures with Force Cancelling",
      nameFa: "سیستم صوتی ۴ اسپیکر استودیویی با محفظه بازتاب فرکانس پایین",
      category: "audio",
      depthIndex: 5,
      renderType: "audio",
      role: "تولید بیس عمیق و صدای سه‌بعدی فراگیر بدون انتقال ارتعاش به پنل تصویر و لنزها",
      specifications: {
        "درایورها": "۴ ووفر با مگنت‌های نئودیمیوم N52",
        "پاسخ فرکانسی": "۶۰ هرتز تا ۲۰ کیلوهرتز",
        "فناوری": "پشتیبانی کامل از Spatial Audio و Dolby Atmos"
      },
      engineeringHighlight: "محفظه مهروموم‌شده رزینی برای تقویت خطی فرکانس‌های بم",
      material: "پلیمر رزین تقویت‌شده و آهن‌رباهای نئودیمیوم صنعتی"
    },
    {
      id: "hw-6",
      name: "Precision CNC Recycled Aluminum Unibody Chassis",
      nameFa: "شاسی یکپارچه آلومینیوم سری ۶۰۰۰ با شبکه آنتن و سیستم دفع حرارت",
      category: "chassis",
      depthIndex: 6,
      renderType: "chassis",
      role: "پایداری ساختار فیزیکی با ضخامت ۵.۱ میلی‌متر، جذب نویز الکترومغناطیسی و دفع یکنواخت گرما",
      specifications: {
        "ضخامت شاسی": "فقط 5.1 میلی‌متر (باریک‌ترین محصول تاریخ اپل)",
        "روش ساخت": "تراشکاری تمام‌اتوماتیک ۵ محوره CNC",
        "آلیاژ": "آلومینیوم ۱۰۰٪ بازیافتی سری ۶۰۰۰ هوافضا"
      },
      engineeringHighlight: "خطوط آنتن نانوپلیمری تزریقی بدون ایجاد گسستگی در ساختار فلز",
      material: "آلومینیوم آنودایز مات با پوشش ضد خش"
    }
  ];

  useEffect(() => {
    if (!isOpen) return;
    setSelectedComp(components[0]);
    setIsExpanding(true);

    // انیمیشن سینمایی انفصال قطعات از دل هم در بدو ورود
    setExplosionDistance(0);
    soundEngine.playExplodeShift(1.2);

    const timer = setTimeout(() => {
      setExplosionDistance(65);
      setIsExpanding(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, productTitle]);

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setRotationY((prev) => (prev + 0.35) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [autoRotate]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setAutoRotate(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    setRotationY((prev) => prev + deltaX * 0.4);
    setRotationX((prev) => Math.max(-40, Math.min(60, prev - deltaY * 0.4)));
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => { isDraggingRef.current = false; };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/95 backdrop-blur-3xl font-sans select-none animate-fadeIn text-slate-100" dir="rtl">
      <div className="relative w-full max-w-7xl h-[94vh] max-h-[900px] bg-slate-900/95 border border-slate-700/60 rounded-[2.8rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden backdrop-blur-3xl">
        
        {/* سربرگ سینمایی */}
        <header className="p-4 sm:p-6 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-500/30 animate-pulse">
              🧬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  کالبدشکافی سه‌بعدی سخت‌افزار (Cinema 3D Hardware Teardown)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px]">
                  60 FPS WebGL Perspective
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                تفکیک انفجاری لایه‌های فیزیکی و مهندسی: <strong className="text-blue-400">{productTitle}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { soundEngine.playClick(); setAutoRotate(!autoRotate); }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 ${
                autoRotate ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <span>{autoRotate ? "توقف چرخش ⏸️" : "چرخش ۳۶۰ درجه ▶️"}</span>
            </button>

            <button
              onClick={() => { soundEngine.playClick(); onClose(); }}
              className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-rose-600 hover:text-white border border-slate-700 flex items-center justify-center text-sm font-black transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </header>

        {/* بوم رندر سه‌بعدی قطعات فیزیکی */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* بوم نمایش اجزای منفجر شده */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="lg:col-span-8 h-[380px] lg:h-full relative flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden bg-radial from-blue-950/30 via-slate-950 to-slate-950 border-b lg:border-b-0 lg:border-l border-slate-800/80 touch-none"
          >
            <div className="absolute top-4 right-4 z-20 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 backdrop-blur-md">
              🖱️ درگ کنید تا زاویه تغییر کند (X: {Math.round(rotationX)}°, Y: {Math.round(rotationY)}°)
            </div>

            {/* صحنه ۳ بعدی قطعات فیزیکی */}
            <div
              className="relative w-72 h-96 sm:w-80 sm:h-[420px] transition-transform duration-100 ease-out"
              style={{
                perspective: "1400px",
                transformStyle: "preserve-3d",
                transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
              }}
            >
              {components.map((comp) => {
                const isSelected = selectedComp?.id === comp.id;
                const offsetFactor = (comp.depthIndex - 3.5) * (explosionDistance * 3.2);

                return (
                  <div
                    key={comp.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playExplodeShift(comp.depthIndex * 0.3);
                      setSelectedComp(comp);
                    }}
                    className={`absolute inset-0 rounded-[2.5rem] transition-all duration-700 cursor-pointer flex flex-col justify-between overflow-hidden select-none ${
                      isSelected
                        ? "ring-4 ring-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.85)] scale-105"
                        : "hover:ring-2 hover:ring-blue-400 hover:scale-[1.02]"
                    }`}
                    style={{
                      transform: `translateZ(${offsetFactor}px) translateY(${(comp.depthIndex - 3.5) * 8}px)`,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* رندر واقعی نمایشگر اولد تاندم */}
                    {comp.renderType === "display" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-black p-2.5 border border-slate-700/80 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                        <div className="absolute inset-0 bg-cover bg-center rounded-[2.2rem]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800')" }} />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/20 pointer-events-none rounded-[2.2rem]" />
                        <div className="z-10 flex justify-between items-center text-[10px] text-white p-2">
                          <span className="font-mono font-bold">9:41</span>
                          <span className="font-mono">5G 100%</span>
                        </div>
                        <div className="z-10 p-3 text-center bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 m-2">
                          <span className="font-black text-xs text-white block">Tandem OLED Display</span>
                          <span className="text-[9px] text-blue-300 font-mono">1600 Nits ProMotion</span>
                        </div>
                      </div>
                    )}

                    {/* رندر ماژول دوربین و سنسور LiDAR */}
                    {comp.renderType === "camera" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-slate-900/90 border border-slate-700/80 p-4 flex flex-col justify-between backdrop-blur-md">
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-1 rounded-lg bg-black text-white font-mono text-[9px]">Camera & LiDAR Module</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 my-auto p-3 bg-black/70 rounded-2xl border border-white/10">
                          <div className="w-16 h-16 rounded-full border-4 border-slate-600 bg-radial from-blue-900 via-black to-slate-950 mx-auto flex items-center justify-center shadow-inner relative">
                            <div className="w-8 h-8 rounded-full border border-blue-400/50 bg-blue-500/20" />
                          </div>
                          <div className="w-16 h-16 rounded-full border-4 border-slate-600 bg-radial from-indigo-900 via-black to-slate-950 mx-auto flex items-center justify-center shadow-inner relative">
                            <div className="w-8 h-8 rounded-full border border-indigo-400/50 bg-indigo-500/20" />
                          </div>
                        </div>
                        <span className="text-center font-mono text-[9px] text-slate-400">12MP Wide + LiDAR Optical Unit</span>
                      </div>
                    )}

                    {/* رندر مادربرد مرکزی و تراشه درخشان Apple Silicon */}
                    {comp.renderType === "logicboard" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-[#0c1a2e] border-2 border-blue-500/40 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        {/* خطوط مدار مسی */}
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
                        <div className="z-10 flex justify-between items-center text-[9px] font-mono text-blue-400">
                          <span>PCB 12-LAYER</span>
                          <span>THUNDERBOLT 40Gbps</span>
                        </div>
                        {/* چیپست نورانی M-Series */}
                        <div className="z-10 w-28 h-28 mx-auto rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-black border-2 border-blue-400 p-2 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.8)] animate-pulse">
                          <span className="text-2xl">⚡</span>
                          <span className="font-black text-xs text-white font-mono mt-1">M4 / M5 DIE</span>
                          <span className="text-[8px] text-blue-400 font-mono">3nm NEURAL</span>
                        </div>
                        <span className="z-10 text-center font-mono text-[9px] text-blue-300">16-Core Neural Processing Hub</span>
                      </div>
                    )}

                    {/* رندر سلول‌های باتری لیتیوم پلیمر */}
                    {comp.renderType === "battery" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-slate-900/95 border border-slate-700/80 p-4 flex flex-col justify-between backdrop-blur-md">
                        <span className="font-mono text-[9px] text-slate-400">Dual-Cell Li-Ion Battery System</span>
                        <div className="space-y-3 my-auto">
                          <div className="h-16 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 border border-slate-700 p-2 flex items-center justify-between text-xs font-mono text-emerald-400 shadow-inner">
                            <span>CELL-A: 19.5Wh</span>
                            <span>⚡ ACTIVE</span>
                          </div>
                          <div className="h-16 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 border border-slate-700 p-2 flex items-center justify-between text-xs font-mono text-emerald-400 shadow-inner">
                            <span>CELL-B: 19.5Wh</span>
                            <span>⚡ ACTIVE</span>
                          </div>
                        </div>
                        <span className="text-center font-mono text-[9px] text-emerald-400">38.99Wh High-Density Polymer</span>
                      </div>
                    )}

                    {/* رندر سیستم صوتی ۴ اسپیکر */}
                    {comp.renderType === "audio" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-slate-950 border border-slate-700/80 p-4 flex flex-col justify-between">
                        <span className="font-mono text-[9px] text-slate-400">Four-Speaker Studio Chamber</span>
                        <div className="grid grid-cols-2 gap-4 my-auto p-2">
                          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-center">
                            <span className="text-2xl block">🔊</span>
                            <span className="text-[9px] font-mono text-slate-300">Woofer Left</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-center">
                            <span className="text-2xl block">🔊</span>
                            <span className="text-[9px] font-mono text-slate-300">Woofer Right</span>
                          </div>
                        </div>
                        <span className="text-center font-mono text-[9px] text-blue-400">Spatial Audio with Dolby Atmos</span>
                      </div>
                    )}

                    {/* رندر شاسی آلومینیومی ۵.۱ میلی‌متری CNC با لوگوی اپل */}
                    {comp.renderType === "chassis" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-500 p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <span className="font-mono text-[9px] text-slate-300">5.1mm Ultra-Slim Unibody</span>
                        <div className="my-auto text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-slate-950/80 border border-slate-600 flex items-center justify-center shadow-2xl">
                            <span className="text-3xl text-slate-200"></span>
                          </div>
                          <span className="font-bold text-xs text-white block mt-3">iPad Pro Unibody</span>
                        </div>
                        <span className="text-center font-mono text-[9px] text-slate-300">Aerospace Grade 6000 Aluminum</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* کنترلر اسلایدر انفصال قطعات */}
            <div className="absolute bottom-5 left-5 right-5 sm:left-auto sm:right-6 bg-slate-950/90 border border-slate-800 p-4 rounded-3xl backdrop-blur-2xl space-y-2 z-30 sm:w-80 shadow-2xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-black text-white flex items-center gap-1.5">
                  <span>💥</span><span>انفصال و بازسازی سه‌بعدی:</span>
                </span>
                <span className="font-mono font-black text-blue-400 text-sm">{explosionDistance}٪</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={explosionDistance}
                onChange={(e) => {
                  setExplosionDistance(Number(e.target.value));
                  soundEngine.playExplodeShift(Number(e.target.value) / 100);
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>دستگاه یکپارچه (0%)</span>
                <span>انفصال کامل (100%)</span>
              </div>
            </div>
          </div>

          {/* سایدبار اطلاعات مهندسی قطعه فعال */}
          <div className="lg:col-span-4 p-5 sm:p-7 space-y-5 overflow-y-auto bg-slate-950/70 flex flex-col justify-between text-xs">
            {selectedComp ? (
              <div className="space-y-4">
                <div className="space-y-1.5 border-b border-slate-800 pb-3.5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black">
                      قطعه شماره {selectedComp.depthIndex} از {components.length}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {selectedComp.category.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white leading-snug">{selectedComp.nameFa}</h4>
                  <p className="text-slate-400 font-mono text-[11px] font-medium">{selectedComp.name}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <span className="font-black text-blue-400 block text-[11px]">🎯 نقش کلیدی در دستگاه:</span>
                  <p className="text-slate-300 leading-relaxed font-medium">{selectedComp.role}</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="font-black text-emerald-400 block text-[11px]">💡 نوآوری و هایلایت مهندسی:</span>
                  <p className="text-emerald-300 leading-relaxed font-medium">{selectedComp.engineeringHighlight}</p>
                </div>

                <div className="space-y-2">
                  <span className="font-black text-slate-300 block">⚙️ پارامترهای فنی و متالورژی:</span>
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">متریال ساخت:</span>
                      <span className="font-bold text-slate-200">{selectedComp.material}</span>
                    </div>
                    {Object.entries(selectedComp.specifications || {}).map(([k, v]) => (
                      <div key={k} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">{k}:</span>
                        <span className="font-mono font-bold text-blue-400">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 font-bold">
                روی هر یک از قطعات سه‌بعدی کلیک کنید تا آنالیز سخت‌افزاری آن فعال شود.
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 space-y-2 mt-4 text-[11px] text-slate-400">
              <div className="flex justify-between items-center">
                <span>امتیاز مهندسی ماژولار:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">10 / 10 Apple Tier</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
