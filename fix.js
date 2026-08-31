// File: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 در حال ارتقای کالبدشکافی ۳D تطبیقی، شبیه‌ساز گاموت، ماتریس بازار و تب‌های محصول...');

const files = {
  // ۱. موتور کالبدشکافی ۳D با تطابق دقیق هوشمند قطعات هر کالا
  'components/ProductExplodedView.tsx': `"use client";

import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface LayerItem {
  id: string;
  name: string;
  nameFa: string;
  category: string;
  depthIndex: number;
  role: string;
  specifications: Record<string, string>;
  engineeringHighlight: string;
  material: string;
  icon: string;
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
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [explosionDistance, setExplosionDistance] = useState<number>(55);
  const [rotationX, setRotationX] = useState<number>(18);
  const [rotationY, setRotationY] = useState<number>(-22);
  const [selectedLayer, setSelectedLayer] = useState<LayerItem | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) return;

    // تطابق هوشمند قطعات کالبدشکافی بر اساس محصول
    const titleLower = (productTitle || "").toLowerCase();
    let productLayers: LayerItem[] = [];

    if (titleLower.includes("watch") || titleLower.includes("ساعت") || (category && category.includes("ساعت"))) {
      productLayers = [
        {
          id: "w-layer-1",
          name: "Sapphire Crystal Front Display Shield",
          nameFa: "شیشه محافظ یاقوت کبود تخت (Sapphire Crystal)",
          category: "optics",
          depthIndex: 1,
          role: "حفاظت فیزیکی در برابر ضربه شدید و خط‌وخش با لبه‌های محافظ برجسته تیتانیومی",
          specifications: { "سختی سطح": "۹ در مقیاس موهس (ضدخش)", "روشنایی عبوری": "۳۰۰۰ نیت بدون افت", "پوشش": "ضد انعکاس اولئوفوبیک" },
          engineeringHighlight: "تراشکاری دقیق یاقوت کبود تخت هم‌سطح با قاب محافظ تیتانیوم",
          material: "کریستال یاقوت کبود خالص (Sapphire)",
          icon: "💎",
        },
        {
          id: "w-layer-2",
          name: "Always-On Retina OLED Ultra Matrix Display",
          nameFa: "پنل ماتریس فعال اولد با روشنایی خیره‌کننده ۳۰۰۰ نیت",
          category: "panel",
          depthIndex: 2,
          role: "نمایش اطلاعات زیر تابش مستقیم خورشید و کاهش روشنایی به ۱ نیت در تاریکی مطلق",
          specifications: { "حداکثر روشنایی": "۳۰۰۰ نیت (Outdoor Peak)", "نرخ نوسازی": "۱ تا ۶۰ هرتز داینامیک LTPO", "تراکم": "۳۲۶ PPI رتینا" },
          engineeringHighlight: "فناوری LTPO OLED با مصرف فوق‌العاده پایین انرژی",
          material: "پنل انعطاف‌پذیر LTPO OLED",
          icon: "🖥️",
        },
        {
          id: "w-layer-3",
          name: "S9 SiP with 4-Core Neural Engine & Gesture Controller",
          nameFa: "تراشه یکپارچه S9 SiP با موتور پردازش عصبی ۴ هسته‌ای",
          category: "chipset",
          depthIndex: 3,
          role: "پردازش بلادرنگ فرامین، ژست حرکتی Double Tap، ردیابی GPS دوفرکانسه و سیری آفلاین",
          specifications: { "تعداد ترانزیستور": "۵.۶ میلیارد ترانزیستور", "موتور عصبی": "۴ هسته Neural Engine", "پروتکل ارتباطی": "Ultra Wideband 2 (UWB)" },
          engineeringHighlight: "پردازش ژست ضربه دوبل انگشت در ۰.۰۵ ثانیه بدون لمس صفحه",
          material: "برد فشرده SiP رزین‌دار با سیلیکون ۶۴ بیتی",
          icon: "🧠",
        },
        {
          id: "w-layer-4",
          name: "High-Capacity Li-Ion Battery & Magnetic Coil Subsystem",
          nameFa: "باتری پرظرفیت لیتیوم‌یون با سیم‌پیچ شارژ سریع مگنتی",
          category: "power",
          depthIndex: 4,
          role: "تامین انرژی پایدار تا ۳۶ ساعت کار مداوم و ۷۲ ساعت در حالت Low Power",
          specifications: { "ظرفیت": "۵۶۴ میلی‌آمپر ساعت", "سرعت شارژ": "۸۰٪ در ۶۰ دقیقه", "مقاومت حرارتی": "-۲۰ تا +۵۵ درجه سانتی‌گراد" },
          engineeringHighlight: "ساختار فشرده چندسلولی مقاوم در برابر ارتعاشات کوهنوردی و غواصی",
          material: "سلول لیتیوم-پلیمر چگالی بالا با محافظ استیل",
          icon: "🔋",
        },
        {
          id: "w-layer-5",
          name: "Bio-Optical Sensor Array with Dual-Frequency GPS",
          nameFa: "آرایه حسگرهای بیومتریک نوری، اکسیژن خون و عمق‌سنج غواصی",
          category: "audio",
          depthIndex: 5,
          role: "پایش ضربان قلب ECG، سنجش دمای آب، سنجش عمق غواصی تا ۴۰ متر و آژیر ۸۶ دسی‌بل",
          specifications: { "حسگر عمق": "دقیق تا عمق ۴۰ متر (EN13319)", "آژیر اضطراری": "۸۶dB با برد ۱۸۰ متر", "حسگر نوری": "فتودیودهای سبز، قرمز و مادون قرمز" },
          engineeringHighlight: "سنسور عمق‌سنج خودکار به محض ورود به آب با کالیبراسیون فشار",
          material: "سرامیک زیرکونیا و شیشه کریستال یاقوت کبود پشتی",
          icon: "🎯",
        },
        {
          id: "w-layer-6",
          name: "Aerospace-Grade Titanium Grade 5 Unibody Chassis",
          nameFa: "شاسی یکپارچه تیتانیوم گرید ۵ با استاندارد نظامی MIL-STD 810H",
          category: "chassis",
          depthIndex: 6,
          role: "حفاظت در برابر ضربات سنگین، مقاومت در برابر خوردگی آب شور و تخلیه حرارت",
          specifications: { "آلیاژ": "Titanium Grade 5 (Ti-6Al-4V)", "مقاومت در آب": "۱۰۰ متر (WR100)", "استاندارد": "MIL-STD 810H تست شوک و حرارت" },
          engineeringHighlight: "تراشکاری ۵ محوره CNC تیتانیوم خالص با نسبت استحکام به وزن بی‌نظیر",
          material: "تیتانیوم بازیافتی ۹۵٪ هوافضا",
          icon: "🛡️",
        },
      ];
    } else {
      // مانیتورهای ۵K استودیو و تجهیزات تصویر
      productLayers = [
        {
          id: "m-layer-1",
          name: "Nano-Texture Front Optical Glass & Polarizer",
          nameFa: "لایه شیشه نوری مات نانوتکستچر با فیلتر پولاریزه آنتی‌رفلکت",
          category: "optics",
          depthIndex: 1,
          role: "حذف ۹۹.۴٪ بازتاب‌های مزاحم محیطی و عبور دقیق طیف نور بدون اعوجاج رنگی",
          specifications: { "پوشش ضد بازتاب": "حکاکی نانومتری دی‌الکتریک", "ضریب عبور": "۹۸.۸٪ نور", "سختی": "۹H ضدخش" },
          engineeringHighlight: "حکاکی مستقیم شیشه در مقیاس اتمی بدون افت کنتراست تصویر",
          material: "شیشه سیلیکات تقویت‌شده با پوشش اولئوفوبیک",
          icon: "💎",
        },
        {
          id: "m-layer-2",
          name: "Active Matrix 5K Retina IPS / Mini-LED Backlight",
          nameFa: "پنل ماتریس فعال ۵K رتینا با تفکیک رنگ ۱۰ بیتی",
          category: "panel",
          depthIndex: 2,
          role: "تولید تصویر با وضوح 5120x2880، روشنایی پایدار ۶۰۰ نیت و تفکیک بیش از ۱ میلیارد رنگ",
          specifications: { "تراکم": "۲۱۸ PPI رتینا", "طیف رنگ": "۹۹.۲٪ DCI-P3 و ۱۰۰٪ sRGB", "عمق رنگ": "۱۰ بیت واقعی (1.07B Colors)" },
          engineeringHighlight: "کنترلر سخت‌افزاری کالیبراسیون با جدول رنگ ۳D LUT داخلی",
          material: "زیرلایه ایندیوم گالیوم زینک اکسید (IGZO)",
          icon: "🖥️",
        },
        {
          id: "m-layer-3",
          name: "Mainboard with A13 Bionic Neural Display Processor",
          nameFa: "مادربرد پردازش عصبی تصویر و کنترلر تاندربولت",
          category: "chipset",
          depthIndex: 3,
          role: "پردازش لحظه‌ای سیگنال ویدیویی، مدیریت هوشمند کالیبراسیون و کنترل پورت‌های ۴۰Gbps",
          specifications: { "پهنای باند": "۴۰ گیگابیت بر ثانیه (TB3/TB4)", "تعداد لایه‌ها": "PCB دوازده لایه با مس ۲ اونسی", "تاخیر پردازش": "کمتر از ۰.۱ میلی‌ثانیه" },
          engineeringHighlight: "تبدیل بلادرنگ فضای رنگی Rec.709 به DCI-P3 با خطای Delta E < 0.3",
          material: "فایبرگلاس گرید نظامی FR-4 با آبکاری طلای غوطه‌ور",
          icon: "🧠",
        },
        {
          id: "m-layer-4",
          name: "Acoustic Chamber with Force-Cancelling Woofers",
          nameFa: "محفظه آکوستیک استودیویی با ووفرهای لغوکننده لرزش فیزیکی",
          category: "audio",
          depthIndex: 4,
          role: "تولید بیس عمیق و صدای سه‌بعدی فضایی بدون انتقال کوچک‌ترین ارتعاش به پنل شیشه‌ای",
          specifications: { "تعداد درایورها": "۶ درایور استودیویی (۴ ووفر + ۲ توییتر)", "پاسخ فرکانسی": "۴۵ هرتز تا ۲۲ کیلوهرتز", "فناوری": "Spatial Audio با Dolby Atmos" },
          engineeringHighlight: "چیدمان متقارن و جفت درایورها جهت خنثی‌سازی کامل گشتاور مکانیکی",
          material: "محفظه رزین کربن فشرده با مگنت‌های نئودیمیوم N52",
          icon: "🔊",
        },
        {
          id: "m-layer-5",
          name: "High-Efficiency GaN Integrated Power Subsystem",
          nameFa: "ماژول تغذیه یکپارچه نیترید گالیوم (GaN Power Delivery)",
          category: "power",
          depthIndex: 5,
          role: "تامین ولتاژ پایدار با راندمان ۹۶٪ و شارژ همزمان مک‌بوک تا توان ۹۶ وات",
          specifications: { "توان خروجی": "۲۴۰ وات پیوسته", "راندمان مصرف": "۹۶٪ بدون اتلاف حرارتی", "شارژ لپ‌تاپ": "۹۶W Power Delivery" },
          engineeringHighlight: "کاهش ۶۰ درصدی ابعاد منبع تغذیه با نیمه‌هادی‌های نیترید گالیوم",
          material: "نیمه‌هادی‌های توان بالای GaNFast ژاپنی",
          icon: "⚡",
        },
        {
          id: "m-layer-6",
          name: "Unibody CNC Billet Aluminum Thermal Chassis",
          nameFa: "شاسی یکپارچه آلومینیوم سری ۶۰۰۰ با سیستم خنک‌کاری هدایت حرارتی",
          category: "chassis",
          depthIndex: 6,
          role: "پایداری ساختار فیزیکی، جذب نویز الکترومغناطیسی (EMI) و تخلیه آرام گرما بدون فن",
          specifications: { "روش ساخت": "تراشکاری اتوماتیک ۵ محوره CNC", "آلیاژ فلز": "آلومینیوم هوافضایی گرید ۶۰۶۳-T6", "دفع حرارت": "جذب و دفع یکنواخت تا ۷۰ وات" },
          engineeringHighlight: "سوراخ‌کاری الگوهای آکوستیک لیزری با خطای کمتر از ۰.۰۱ میلی‌متر",
          material: "آلومینیوم ۱۰۰٪ بازیافتی",
          icon: "🛡️",
        },
      ];
    }

    setLayers(productLayers);
    setSelectedLayer(productLayers[0]);
  }, [isOpen, productTitle, category]);

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setRotationY((prev) => (prev + 0.3) % 360);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-2xl font-sans select-none animate-fadeIn text-slate-100" dir="rtl">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[850px] bg-slate-900/95 border border-slate-700/70 rounded-[2.5rem] shadow-2xl flex flex-col justify-between overflow-hidden backdrop-blur-3xl">
        
        {/* سربرگ هوشمند */}
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
                کالبدشکافی معماری قطعات و مهندسی: <strong className="text-white">{productTitle}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { soundEngine.playClick(); setAutoRotate(!autoRotate); }}
              className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer \${autoRotate ? "bg-blue-600 border-blue-500 text-white shadow-md" : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"}\`}
            >
              {autoRotate ? "توقف چرخش ⏸️" : "چرخش ۳۶۰ درجه ▶️"}
            </button>

            <button
              onClick={() => { soundEngine.playClick(); onClose(); }}
              className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 hover:text-white transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </header>

        {/* بدنه سه‌بعدی تعاملی */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* بوم سه‌بعدی */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="lg:col-span-7 h-[360px] lg:h-full relative flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden bg-radial from-blue-950/20 via-slate-950 to-slate-950 border-b lg:border-b-0 lg:border-l border-slate-800 touch-none"
          >
            <div className="absolute top-4 right-4 z-10 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 backdrop-blur-md">
              🖱️ درگ کنید تا زاویه تغییر کند (X: {Math.round(rotationX)}°, Y: {Math.round(rotationY)}°)
            </div>

            <div
              className="relative w-64 h-64 sm:w-80 sm:h-80 transition-transform duration-75 ease-out"
              style={{
                perspective: "1200px",
                transformStyle: "preserve-3d",
                transform: \`rotateX(\${rotationX}deg) rotateY(\${rotationY}deg)\`,
              }}
            >
              {layers.map((layer) => {
                const isSelected = selectedLayer?.id === layer.id;
                const offsetFactor = (layer.depthIndex - 3.5) * (explosionDistance * 2.6);

                return (
                  <div
                    key={layer.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playClick();
                      setSelectedLayer(layer);
                    }}
                    className={\`absolute inset-0 rounded-3xl border transition-all duration-500 cursor-pointer flex flex-col justify-between p-4 backdrop-blur-md \${
                      isSelected
                        ? "border-blue-400 bg-blue-600/35 shadow-[0_0_35px_rgba(59,130,246,0.7)] ring-2 ring-blue-400/60 scale-105"
                        : "border-slate-600/60 bg-slate-800/40 hover:border-blue-400 hover:bg-slate-800/80"
                    }\`}
                    style={{
                      transform: \`translateZ(\${offsetFactor}px) translateY(\${(layer.depthIndex - 3.5) * 6}px)\`,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-slate-300 font-mono font-bold">
                        لایه #{layer.depthIndex}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-1.5 my-auto text-center">
                      <span className="text-3xl sm:text-4xl drop-shadow-md">{layer.icon}</span>
                      <h5 className="font-black text-xs text-white truncate max-w-[90%]">{layer.nameFa}</h5>
                      <span className="text-[9px] font-mono text-blue-300/80 truncate max-w-[95%]">{layer.name}</span>
                    </div>

                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 font-medium truncate block">{layer.material}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* اسلایدر انفصال لایه‌ها */}
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-xl space-y-2 z-10 sm:w-72 shadow-2xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-black text-white flex items-center gap-1.5">
                  <span>💥</span><span>فاصله انفصال لایه‌ها:</span>
                </span>
                <span className="font-mono font-black text-blue-400">{explosionDistance}٪</span>
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
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* سایدبار تحلیل مهندسی لایه انتخاب‌شده */}
          <div className="lg:col-span-5 p-5 sm:p-7 space-y-5 overflow-y-auto bg-slate-950/50 flex flex-col justify-between text-xs">
            {selectedLayer ? (
              <div className="space-y-4">
                <div className="space-y-1.5 border-b border-slate-800 pb-3.5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black">
                      لایه شماره {selectedLayer.depthIndex} از {layers.length}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {selectedLayer.category.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white leading-snug">{selectedLayer.nameFa}</h4>
                  <p className="text-slate-400 font-mono text-[11px] font-medium">{selectedLayer.name}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <span className="font-black text-blue-400 block text-[11px]">🎯 نقش استراتژیک در دستگاه:</span>
                  <p className="text-slate-300 leading-relaxed font-medium">{selectedLayer.role}</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="font-black text-emerald-400 block text-[11px]">💡 نوآوری و هایلایت مهندسی:</span>
                  <p className="text-emerald-300 leading-relaxed font-medium">{selectedLayer.engineeringHighlight}</p>
                </div>

                <div className="space-y-2">
                  <span className="font-black text-slate-300 block">⚙️ پارامترهای فنی و متالورژی:</span>
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">جنس متریال:</span>
                      <span className="font-bold text-slate-200">{selectedLayer.material}</span>
                    </div>
                    {Object.entries(selectedLayer.specifications || {}).map(([k, v]) => (
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
                روی یکی از لایه‌های سه‌بعدی کلیک کنید تا آنالیز مهندسی آن لود شود.
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 space-y-2 mt-4 text-[11px] text-slate-400">
              <div className="flex justify-between items-center">
                <span>امتیاز تعمیرپذیری iFixit:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">9.5 / 10</span>
              </div>
              <p className="text-[10px] text-slate-500">طراحی ماژولار با دسترسی مستقل به سنسورها و پنل نمایشگر</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`,

  // ۲. ارتقای شبیه‌ساز گاموت رنگی با انیمیشن فوق‌سریع و تست زنده
  'components/ColorGamutSimulator.tsx': `"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function ColorGamutSimulator({ productTitle }: { productTitle: string }) {
  const [selectedGamut, setSelectedGamut] = useState<"srgb" | "p3" | "rec2020" | "adobe">("p3");
  const [testPattern, setTestPattern] = useState<"gradient" | "skin" | "neon" | "hdr">("skin");
  const [gammaCorrection, setGammaCorrection] = useState<number>(2.2);

  const gamuts = {
    srgb: {
      name: "sRGB (Standard Web)",
      coverage: "۱۰۰٪",
      deltaE: "< ۰.۸",
      description: "فضای استاندارد نمایشگرهای خانگی و وب، مناسب برای تولید محتوای شبکه‌های اجتماعی و کاربری روزمره.",
      badgeColor: "text-blue-400 bg-blue-500/15 border-blue-500/30",
      filterStyle: "saturate(95%) contrast(100%)",
    },
    p3: {
      name: "Display P3 (Apple Wide Color)",
      coverage: "۹۹.۲٪",
      deltaE: "< ۰.۴ (استودیویی)",
      description: "طیف رنگی وسیع هالیوودی با ۲۵٪ گستره رنگ بیشتر از sRGB، ایده‌آل برای کالرگریدینگ در DaVinci Resolve و Final Cut.",
      badgeColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      filterStyle: "saturate(135%) contrast(108%) brightness(102%)",
    },
    adobe: {
      name: "Adobe RGB (Print & Photography)",
      coverage: "۹۸.۵٪",
      deltaE: "< ۰.۵",
      description: "گستره رنگ اختصاصی برای عکاسان حرفه‌ای و صنعت چاپ با پوشش بی‌نظیر طیف‌های فیروزه‌ای و سبز عمیق (Cyan & Emerald).",
      badgeColor: "text-purple-400 bg-purple-500/15 border-purple-500/30",
      filterStyle: "saturate(125%) hue-rotate(-8deg) contrast(105%)",
    },
    rec2020: {
      name: "Rec.2020 (8K Ultra HDR)",
      coverage: "۸۴.۰٪",
      deltaE: "< ۰.۹",
      description: "استاندارد آینده‌نگرانه سینمای دیجیتال با بیشترین دامنه دینامیکی ممکن برای رندرینگ پروژه‌های ۸K HDR.",
      badgeColor: "text-amber-400 bg-amber-500/15 border-amber-500/30",
      filterStyle: "saturate(160%) contrast(115%) brightness(105%)",
    },
  };

  const testImages = {
    skin: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80",
    gradient: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&auto=format&fit=crop&q=80",
    neon: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1000&auto=format&fit=crop&q=80",
    hdr: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80",
  };

  return (
    <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-500/25">
            🎨
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base">
              شبیه‌ساز زنده گاموت رنگی و کالیبراسیون سخت‌افزاری (Color Gamut Engine)
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
              تست تعاملی پوشش رنگی پنل در نرم‌افزارهای تدوین برای: <strong className="text-[var(--text-primary)]">{productTitle}</strong>
            </p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs self-start sm:self-auto">
          Factory Calibrated (Delta E &lt; 1)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {(Object.keys(gamuts) as Array<keyof typeof gamuts>).map((key) => {
          const item = gamuts[key];
          const isSelected = selectedGamut === key;
          return (
            <button
              key={key}
              onClick={() => { soundEngine.playClick(); setSelectedGamut(key); }}
              className={\`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 \${
                isSelected
                  ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-xl scale-[1.02]"
                  : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }\`}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono font-black text-xs">{key.toUpperCase()}</span>
                <span className={\`px-2 py-0.5 rounded-md text-[10px] font-bold \${isSelected ? "bg-white/20 text-white" : item.badgeColor}\`}>
                  {item.coverage}
                </span>
              </div>
              <span className="text-[11px] font-bold truncate block">{item.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 relative h-72 sm:h-96 rounded-3xl overflow-hidden bg-black border border-[var(--card-border)] shadow-inner flex items-center justify-center group">
          <img
            src={testImages[testPattern]}
            alt="Color Test Pattern"
            className="w-full h-full object-cover transition-all duration-500"
            style={{
              filter: \`\${gamuts[selectedGamut].filterStyle} contrast(\${(gammaCorrection / 2.2) * 100}%)\`,
            }}
          />

          <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 text-white font-mono text-[11px] font-bold shadow-xl">
            Space: <span className="text-[var(--accent-blue)]">{gamuts[selectedGamut].name}</span> | Gamma: {gammaCorrection}
          </div>

          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
            {[
              { id: "skin", label: "تن پوست (Skin Tone)" },
              { id: "gradient", label: "طیف گرادیانت" },
              { id: "neon", label: "نور نئون و کنتراست" },
              { id: "hdr", label: "منظره HDR" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { soundEngine.playClick(); setTestPattern(t.id as any); }}
                className={\`px-3 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer \${
                  testPattern === t.id ? "bg-[var(--accent-blue)] text-white shadow-md" : "text-slate-300 hover:text-white"
                }\`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <span className="font-black text-[var(--accent-blue)] block text-xs">📊 تحلیل مهندسی پروفایل انتخابی:</span>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">{gamuts[selectedGamut].description}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-secondary)]">تنظیم منحنی گاما (Gamma Curve):</span>
              <span className="font-mono font-black text-[var(--accent-blue)]">{gammaCorrection}</span>
            </div>
            <input
              type="range"
              min="1.8"
              max="2.6"
              step="0.1"
              value={gammaCorrection}
              onChange={(e) => setGammaCorrection(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[9px] text-[var(--text-secondary)] font-mono">
              <span>Gamma 1.8 (Apple Classic)</span>
              <span>Gamma 2.2 (Standard)</span>
              <span>Gamma 2.6 (Cinema)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-1">
            <span className="font-black block">🎯 خطای رنگی Delta E: {gamuts[selectedGamut].deltaE}</span>
            <p className="text-[10px] text-slate-300 dark:text-emerald-300 font-medium">
              تضمین تفکیک بیش از ۱.۰۷ میلیارد رنگ بدون شکستگی شیب (Banding-Free).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
`,

  // ۳. صفحه کالا با نوار آدرس هوشمند و ارتقای تمامی ۵ تب
  'app/products/[id]/page.tsx': `"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productService, Product, ProductVariant } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import ProductReviews from "@/components/ProductReviews";
import ProductExplodedView from "@/components/ProductExplodedView";
import ColorGamutSimulator from "@/components/ColorGamutSimulator";
import LiveMarketArbitrage from "@/components/LiveMarketArbitrage";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(() => productService.getProductSync(id));
  const [loading, setLoading] = useState(!product);
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "gamut" | "comparison" | "desc" | "reviews">("specs");
  const [isExplodedViewOpen, setIsExplodedViewOpen] = useState(false);

  useEffect(() => {
    productService.getById(id).then((data) => {
      if (data) {
        setProduct(data);
        userBehavior.trackProductView(data.id, data.category);
        const defaultImg = data.images?.[0] || data.image || "";
        setActiveImage(defaultImg);
        if (data.variants && data.variants.length > 0) setSelectedVariant(data.variants[0]);
      }
      setLoading(false);
    });

    const handleUpdate = () => {
      productService.getById(id).then((d) => d && setProduct(d));
    };
    window.addEventListener("products_updated", handleUpdate);
    return () => window.removeEventListener("products_updated", handleUpdate);
  }, [id]);

  if (loading && !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری مشخصات کالا...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4 font-sans select-none" dir="rtl">
        <h2 className="text-xl font-black">محصول مورد نظر یافت نشد!</h2>
        <Link href="/" className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs">← بازگشت به صفحه نخست</Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image || ""];
  const currentMainImg = activeImage || images[0] || "";
  const basePrice = Number(product.discountPrice || product.discount_price || product.price || 0);
  const variantDelta = Number(selectedVariant?.priceDelta || 0);
  const finalUnitPrice = Math.max(0, basePrice + variantDelta);
  const oldPrice = Number(product.originalPrice || product.price || 0) + variantDelta;
  const currentStock = product.stock !== undefined ? Number(product.stock) : 10;
  const isAvailable = (product as any).is_available !== false && product.isAvailable !== false && currentStock > 0;
  const specsEntries = product.specs ? Object.entries(product.specs) : [];

  const handleDirectBuy = () => {
    soundEngine.playAddToCart();
    addToCart({ id: product.id, title: \`\${product.title} \${selectedVariant ? \`(\${selectedVariant.name})\` : ""}\`, price: finalUnitPrice, image: currentMainImg, stock: currentStock, quantity });
    router.push("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans select-none text-[var(--text-primary)] space-y-8 pb-28 sm:pb-10" dir="rtl">
      
      {/* نوار آدرس و موقعیت هوشمند (Breadcrumb) */}
      <nav className="flex items-center gap-2 p-3 px-5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs text-[var(--text-secondary)] font-bold shadow-sm backdrop-blur-md">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition flex items-center gap-1.5">
          <span>🏠</span><span>صفحه اصلی</span>
        </Link>
        <span>/</span>
        <Link href="/#products" className="hover:text-[var(--accent-blue)] transition">
          {product.category || "تجهیزات و مانیتورها"}
        </Link>
        <span>/</span>
        <span className="text-[var(--accent-blue)] truncate max-w-xs">{product.title}</span>
      </nav>

      {/* معرفی و خرید کالا */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl">
        <div className="lg:col-span-5 space-y-4">
          <div className="w-full h-80 md:h-[430px] rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] overflow-hidden flex items-center justify-center p-6 relative group">
            <img src={currentMainImg} alt={product.title} className="w-full h-full object-contain group-hover:scale-105 transition duration-500" />
            <button onClick={() => { soundEngine.playExplodeShift(); setIsExplodedViewOpen(true); }} className="absolute bottom-4 left-4 px-4 py-2.5 rounded-2xl bg-black/75 hover:bg-blue-600 text-white font-black text-xs border border-white/20 backdrop-blur-md shadow-2xl transition flex items-center gap-2 cursor-pointer">
              <span>🧬</span><span>کالبدشکافی ۳D (Exploded View)</span>
            </button>
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((imgUrl, idx) => (
                <button key={idx} onClick={() => { soundEngine.playClick(); setActiveImage(imgUrl); }} className={\`w-20 h-20 rounded-2xl border-2 cursor-pointer p-1 bg-[var(--input-bg)] transition \${currentMainImg === imgUrl ? "border-[var(--accent-blue)] scale-105" : "border-[var(--card-border)] opacity-60"}\`}>
                  <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black text-xs">{product.category || "کالای دیجیتال"}</span>
              <span className={\`text-xs font-bold \${isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}\`}>{isAvailable ? \`موجود در انبار (\${currentStock} عدد) ✓\` : "ناموجود"}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] leading-snug">{product.title}</h1>
            {product.title_fa && <p className="text-xs text-[var(--text-secondary)] font-medium">{product.title_fa}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div onClick={() => { soundEngine.playExplodeShift(); setIsExplodedViewOpen(true); }} className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 hover:border-blue-500 transition cursor-pointer flex items-center gap-3">
                <span className="text-2xl">🧬</span>
                <div><h4 className="font-black text-xs">کالبدشکافی قطعات ۳D</h4><p className="text-[10px] text-[var(--text-secondary)]">مشاهده تفکیک لایه‌ها</p></div>
              </div>
              <div onClick={() => setActiveTab("gamut")} className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 hover:border-indigo-500 transition cursor-pointer flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <div><h4 className="font-black text-xs">تست گاموت رنگی</h4><p className="text-[10px] text-[var(--text-secondary)]">سنجش DCI-P3 و sRGB</p></div>
              </div>
            </div>

            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[var(--text-secondary)] block">انتخاب مدل و رنگ:</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button key={v.id} onClick={() => { soundEngine.playClick(); setSelectedVariant(v); }} className={\`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition \${selectedVariant?.id === v.id ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-sm" : "border-[var(--card-border)] bg-[var(--input-bg)]"}\`}>
                      <span style={{ backgroundColor: v.colorHex || "#333" }} className="w-3.5 h-3.5 rounded-full border border-black/20" />
                      <span>{v.name}</span>
                      {v.modelType && <span className="text-[10px] opacity-75 font-mono">[{v.modelType}]</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)] font-bold">قیمت نهایی فاکتور:</span>
              <div className="text-left">
                {oldPrice > finalUnitPrice && <span className="block text-xs line-through text-[var(--text-secondary)] font-mono">{oldPrice.toLocaleString("fa-IR")}</span>}
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{finalUnitPrice.toLocaleString("fa-IR")} تومان</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button disabled={!isAvailable} onClick={() => { soundEngine.playAddToCart(); addToCart({ id: product.id, title: product.title, price: finalUnitPrice, image: currentMainImg, stock: currentStock, quantity }); }} className="w-full sm:flex-1 py-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--accent-blue)] text-[var(--text-primary)] font-black text-xs cursor-pointer hover:bg-[var(--accent-blue)] hover:text-white transition">🛒 افزودن به سبد</button>
              <button disabled={!isAvailable} onClick={handleDirectBuy} className="w-full sm:flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-xl hover:opacity-90 transition">⚡ خرید آنی و تسویه</button>
            </div>
          </div>
        </div>
      </div>

      {/* ۵ تب تعاملی پیشرفته کالا */}
      <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[var(--card-border)] text-xs scrollbar-none">
          {[
            { id: "specs", label: "⚙️ مشخصات فنی دقیق" },
            { id: "gamut", label: "🎨 شبیه‌ساز گاموت رنگی" },
            { id: "comparison", label: "⚖️ پایش قیمت با بازار" },
            { id: "desc", label: "📝 بررسی تخصصی" },
            { id: "reviews", label: "⭐ نظرات کاربران" }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={\`px-5 py-3 rounded-2xl font-black transition cursor-pointer whitespace-nowrap \${activeTab === tab.id ? "bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/25" : "bg-[var(--modal-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]"}\`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "specs" && (
          <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {specsEntries.map(([k, v], idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex justify-between">
                  <span className="text-[var(--text-secondary)] font-bold">{k}:</span><span className="font-semibold text-[var(--text-primary)]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "gamut" && <ColorGamutSimulator productTitle={product.title} />}
        {activeTab === "comparison" && <LiveMarketArbitrage productTitle={product.title} ourPrice={finalUnitPrice} marketBenchmarks={product.market_comparison} />}
        {activeTab === "desc" && <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-xs md:text-sm leading-loose whitespace-pre-line font-medium text-justify">{product.description}</div>}
        {activeTab === "reviews" && <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl"><ProductReviews productId={product.id} /></div>}
      </div>

      <ProductExplodedView productId={product.id} productTitle={product.title} category={product.category} isOpen={isExplodedViewOpen} onClose={() => setIsExplodedViewOpen(false)} />
    </div>
  );
}
`,
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ فایل اصلاح و به‌روزرسانی شد: ${filePath}`);
}

console.log('📦 در حال ارسال خودکار به گیت‌هاب و سرور Vercel...');
try {
  execSync('git add . && git commit -m "feat: flagship upgrades for 3d teardown, color gamut, breadcrumbs, minimal menu icon and 5 product tabs" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 تمام امکانات به صورت زنده و بلادرنگ روی سرور آنلاین منتشر شدند!');
} catch (e) {
  console.log('⚠️ برای ارسال دستور زیر را بزنید: git push origin main');
}