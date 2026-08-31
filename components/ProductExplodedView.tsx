"use client";

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
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${autoRotate ? "bg-blue-600 border-blue-500 text-white shadow-md" : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"}`}
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
                transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
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
                    className={`absolute inset-0 rounded-3xl border transition-all duration-500 cursor-pointer flex flex-col justify-between p-4 backdrop-blur-md ${
                      isSelected
                        ? "border-blue-400 bg-blue-600/35 shadow-[0_0_35px_rgba(59,130,246,0.7)] ring-2 ring-blue-400/60 scale-105"
                        : "border-slate-600/60 bg-slate-800/40 hover:border-blue-400 hover:bg-slate-800/80"
                    }`}
                    style={{
                      transform: `translateZ(${offsetFactor}px) translateY(${(layer.depthIndex - 3.5) * 6}px)`,
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
