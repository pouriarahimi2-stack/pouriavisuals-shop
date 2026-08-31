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
  accentText: string;
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

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const titleLower = (productTitle || "").toLowerCase();
  const isWatch = titleLower.includes("watch") || titleLower.includes("ساعت");
  const isMacBook = titleLower.includes("macbook") || titleLower.includes("مک‌بوک");
  const isDisplay = titleLower.includes("display") || titleLower.includes("مانیتور") || titleLower.includes("xdr");

  // قطعات سخت‌افزاری کاملاً منطبق با محصول کلیک‌شده
  const components: HardwareComponent[] = isWatch ? [
    {
      id: "w-1",
      name: "Flat Sapphire Crystal Front Lens with Raised Edge",
      nameFa: "شیشه تخت یاقوت کبود با لبه‌های محافظ برجسته تیتانیومی",
      category: "optics",
      depthIndex: 1,
      renderType: "display",
      accentText: "3000 Nits Sapphire",
      role: "محافظت در برابر سایش صخره‌نوردی و ضربات شدید بدون افت شفافیت ۳۰۰۰ نیتی اولد",
      specifications: { "سختی": "۹ در مقیاس موهس (فقط با الماس خراشیده می‌شود)", "روشنایی عبوری": "۳۰۰۰ نیت", "پوشش": "اولئوفوبیک ضد اثر انگشت" },
      engineeringHighlight: "تراشکاری نانومتری یاقوت کبود هم‌سطح با لبه‌های شاسی تیتانیوم",
      material: "کریستال یاقوت کبود خالص (Sapphire Crystal)"
    },
    {
      id: "w-2",
      name: "Always-On Retina LTPO OLED Ultra Display Matrix",
      nameFa: "نمایشگر رتینا LTPO OLED همیشه‌روشن ۳۰۰۰ نیت",
      category: "camera",
      depthIndex: 2,
      renderType: "camera",
      accentText: "LTPO OLED 1-60Hz",
      role: "خوانایی کامل در نور شدید خورشید و کاهش روشنایی به ۱ نیت در تاریکی مطلق",
      specifications: { "حداکثر روشنایی": "3000 Nits", "تراکم": "326 PPI", "حداقل روشنایی": "1 Nit" },
      engineeringHighlight: "کاهش مصرف انرژی به ۱ هرتز در حالت استندبای",
      material: "پنل انعطاف‌پذیر LTPO OLED"
    },
    {
      id: "w-3",
      name: "S9 SiP with 4-Core Neural Engine & Gesture Sensor",
      nameFa: "تراشه مرکزی S9 SiP با موتور پردازش عصبی ۴ هسته‌ای",
      category: "logicboard",
      depthIndex: 3,
      renderType: "chipset",
      accentText: "Apple S9 SiP",
      role: "پردازش ژست حرکتی Double Tap، ردیابی دقیق GPS دوفرکانسه و سیری آفلاین",
      specifications: { "ترانزیستور": "۵.۶ میلیارد", "هسته‌های عصبی": "۴ هسته Neural Engine", "ردیابی": "Dual-Frequency L1/L5 GPS" },
      engineeringHighlight: "پردازش بدون لمس ژست ضربه انگشتان در کمتر از ۰.۰۵ ثانیه",
      material: "سیلیکون ۶۴ بیتی با برد فشرده SiP"
    },
    {
      id: "w-4",
      name: "High-Density Li-Ion Battery & Wireless Charging Coil",
      nameFa: "باتری پرظرفیت ۵۶۴ میلی‌آمپری با سیم‌پیچ شارژ مگنتی",
      category: "battery",
      depthIndex: 4,
      renderType: "battery",
      accentText: "36h Battery Life",
      role: "شارژدهی تا ۳۶ ساعت کار مداوم و ۷۲ ساعت در حالت Low Power",
      specifications: { "ظرفیت": "564 mAh", "شارژ سریع": "80% در 60 دقیقه", "مقاومت دمایی": "-20 تا +55 درجه" },
      engineeringHighlight: "سلول فشرده مقاوم در برابر تغییرات شدید فشار اتمسفر غواصی",
      material: "لیتیوم-پلیمر با عایق استیل"
    },
    {
      id: "w-5",
      name: "Bio-Optical Sensor Array & 86dB Emergency Siren",
      nameFa: "آرایه حسگرهای نوری ضربان، اکسیژن خون و آژیر اضطراری",
      category: "audio",
      depthIndex: 5,
      renderType: "audio",
      accentText: "ECG & 86dB Siren",
      role: "پایش نوار قلب ECG، سنجش عمق غواصی تا ۴۰ متر و پخش صدای کمک‌خواهی تا ۱۸۰ متر",
      specifications: { "حسگر عمق": "دقیق تا 40 متر (EN13319)", "آژیر": "86dB با برد 180 متر", "سنسور دما": "دقت 0.01 درجه" },
      engineeringHighlight: "فعال‌سازی خودکار اپلیکیشن عمق‌سنج به محض ورود به آب",
      material: "سرامیک زیرکونیا و بلور یاقوت کبود پشتی"
    },
    {
      id: "w-6",
      name: "Aerospace-Grade Titanium Grade 5 Unibody Enclosure",
      nameFa: "شاسی یکپارچه تیتانیوم گرید ۵ با دکمه Action نارنجی",
      category: "chassis",
      depthIndex: 6,
      renderType: "chassis",
      accentText: "Titanium Grade 5",
      role: "مقاومت در برابر ضربات سنگین، مقاومت کامل در آب شور تا عمق ۱۰۰ متر",
      specifications: { "آلیاژ": "Titanium Grade 5 (Ti-6Al-4V)", "مقاومت آب": "100 متر (WR100)", "استاندارد": "MIL-STD 810H" },
      engineeringHighlight: "تراشکاری اتوماتیک ۵ محوره CNC تیتانیوم بدون ایجاد درز",
      material: "تیتانیوم بازیافتی ۹۵٪ هوافضا"
    }
  ] : isMacBook ? [
    {
      id: "mb-1",
      name: "Liquid Retina XDR Mini-LED Display Lid Assembly",
      nameFa: "مجموعه درب بالایی با پنل Liquid Retina XDR مینی‌ال‌ای‌دی",
      category: "optics",
      depthIndex: 1,
      renderType: "display",
      accentText: "1600 Nits XDR 120Hz",
      role: "تفکیک رنگ ۱۰ بیتی، اوج روشنایی ۱۶۰۰ نیت، رفرش ریت ۱۲۰ هرتز و کنتراست ۱,۰۰۰,۰۰۰:۱",
      specifications: { "رزولوشن": "3456 در 2234 پیکسل", "نوردهی": "بیش از 10,000 Mini-LED", "فناوری": "ProMotion 120Hz" },
      engineeringHighlight: "شاسی فوق‌باریک آلومینیومی ماشین‌کاری‌شده با ضخامت میلی‌متری",
      material: "شیشه نوری تقویت‌شده و شاسی آلومینیوم ۶۰۰۰"
    },
    {
      id: "mb-2",
      name: "Magic Keyboard with Force Touch Trackpad Assembly",
      nameFa: "کیبورد مکانیسم قیچی مشکی مات و ترک‌پد فورس‌تاچ شیشه‌ای",
      category: "camera",
      depthIndex: 2,
      renderType: "camera",
      accentText: "Force Touch Trackpad",
      role: "تایپ دقیق با پیمایش ۱ میلی‌متر، سنسور اثر انگشت Touch ID و بازخورد لمسی هاپتیک",
      specifications: { "مکانیزم": "Scissor Switch 1mm", "موتور هاپتیک": "Taptic Engine الکترومغناطیسی", "امنیت": "Touch ID با Secure Enclave" },
      engineeringHighlight: "سنسورهای فشار چندمرحله‌ای زیر ترک‌پد شیشه‌ای بدون حرکت مکانیکی",
      material: "شیشه صیقلی مات و کلیدهای پلی‌کربنات مقاوم"
    },
    {
      id: "mb-3",
      name: "M4 Max Motherboard with Dual Vapor Chamber Heatpipes",
      nameFa: "مادربرد پردازنده ۱۶ هسته‌ای M4 Max با خنک‌کاری دوگانه مس و محفظه بخار",
      category: "logicboard",
      depthIndex: 3,
      renderType: "chipset",
      accentText: "M4 Max (128GB RAM)",
      role: "رندر بی‌درنگ ویدیوهای 8K ProRes، پردازش گرافیکی با ۴۰ هسته GPU و پهنای باند ۵۴۶GB/s",
      specifications: { "ترانزیستور": "بیش از ۹۰ میلیارد", "رم یکپارچه": "128GB Unified Memory", "سرعت حافظه": "546 GB/s" },
      engineeringHighlight: "دو فن سانتریفیوژ بی صدا با تیغه‌های آیرودینامیک نامتقارن",
      material: "برد ۱۲ لایه فایبرگلاس با هیت‌پایپ‌های مسی"
    },
    {
      id: "mb-4",
      name: "100Wh High-Capacity 6-Cell Lithium Polymer Battery",
      nameFa: "سیستم باتری ۱۰۰ وات ساعت ۶ سلولی با کنترلر مدیریت شارژ",
      category: "battery",
      depthIndex: 4,
      renderType: "battery",
      accentText: "100Wh Battery (22h)",
      role: "شارژدهی تا ۲۲ ساعت کار پیوسته و حداکثر مجاز طبق قوانین هوانوردی فدرال آمریکا",
      specifications: { "ظرفیت": "100 Watt-Hour", "شارژ سریع": "140W با کابل MagSafe 3", "تعداد سلول": "۶ سلول مجزا" },
      engineeringHighlight: "چیدمان پلکانی سلول‌ها جهت استفاده از ۱۰۰٪ حجم خالی بدنه",
      material: "لیتیوم-کبالت چگالی بالا با پوشش عایق آلومینیوم"
    },
    {
      id: "mb-5",
      name: "Six-Speaker Sound System with Force-Cancelling Woofers",
      nameFa: "سیستم صوتی ۶ اسپیکر استودیویی با ووفرهای لغوکننده لرزش فیزیکی",
      category: "audio",
      depthIndex: 5,
      renderType: "audio",
      accentText: "6-Speaker Studio Audio",
      role: "تولید بیس تا نیم اکتاو عمیق‌تر و پوشش کامل فرکانس‌های صدای فراگیر Dolby Atmos",
      specifications: { "تعداد اسپیکر": "۴ ووفر + ۲ توییتر", "پشتیبانی": "Spatial Audio", "میکروفون": "۳ میکروفون استودیو با نسبت سیگنال به نویز بالا" },
      engineeringHighlight: "خنثی‌سازی کامل لرزش گشتاوری هنگام گوش دادن به موسیقی با ولوم بالا",
      material: "رزین آکوستیک با مگنت‌های نئودیمیوم"
    },
    {
      id: "mb-6",
      name: "Precision CNC Aluminum Unibody Bottom Enclosure",
      nameFa: "شاسی یکپارچه زیرین با شیارهای تهویه جانبی و پایه‌های سیلیکونی",
      category: "chassis",
      depthIndex: 6,
      renderType: "chassis",
      accentText: "Space Black Aluminum",
      role: "جریان هوای Laminar خنک‌کاری، خروجی درگاه‌های HDMI 2.1 و تاندربولت و دوام ساختاری",
      specifications: { "رنگ بدنه": "مشکی فضایی (Space Black) ضد لک", "تراشکاری": "تراشکاری یکپارچه تمام اتوماتیک CNC", "پورت‌ها": "3x TB4 + HDMI + SDXC" },
      engineeringHighlight: "آبکاری آنودایز تیره با شیمی اختصاصی جذب‌کننده اثر انگشت",
      material: "آلومینیوم ۱۰۰٪ بازیافتی سری ۶۰۰۰"
    }
  ] : [
    // پیش‌فرض: آیپد پرو و مانیتورهای ۵K استودیو
    {
      id: "pad-1",
      name: "Ultra Retina XDR Tandem OLED Front Display",
      nameFa: "پنل نمایشگر اولد تاندم دو لایه با شیشه محافظ نانوتکستچر",
      category: "optics",
      depthIndex: 1,
      renderType: "display",
      accentText: "Tandem OLED 1600 Nits",
      role: "تولید تصویر با دو لایه ساطع‌کننده نور ارگانیک، کنتراست ۲,۰۰۰,۰۰۰:۱ و اوج روشنایی ۱۶۰۰ نیت",
      specifications: { "رزولوشن": "2752 در 2064 پیکسل (264 PPI)", "روشنایی": "1600 Nits Peak", "فناوری": "Tandem OLED ProMotion 120Hz" },
      engineeringHighlight: "تلفیق نور دو پنل اولد برای روشنایی پایدار ۱۰۰۰ نیت بدون Burn-in",
      material: "شیشه نانوتکستچر با پوشش اولئوفوبیک"
    },
    {
      id: "pad-2",
      name: "LiDAR Scanner & 12MP TrueDepth Camera Module",
      nameFa: "ماژول دوربین TrueDepth، فلاش نوری تطبیقی و اسکنر LiDAR",
      category: "camera",
      depthIndex: 2,
      renderType: "camera",
      accentText: "LiDAR + 12MP 4K ProRes",
      role: "ثبت نقشه سه‌بعدی محیط در کسری از ثانیه و فیلم‌برداری سینمایی 4K ProRes",
      specifications: { "سنسور": "12MP f/1.8", "اسکنر": "LiDAR مادون قرمز برد ۵ متر", "ویدیو": "4K ProRes تا 60fps" },
      engineeringHighlight: "محفظه ماژولار لنز با روکش بلور یاقوت کبود",
      material: "شیشه اپتیکال یاقوت کبود و تیتانیوم"
    },
    {
      id: "pad-3",
      name: "Main Logic Board with Apple Silicon M4 Die",
      nameFa: "مادربرد مرکزی با تراشه ۳ نانومتری M4 و موتور عصبی",
      category: "logicboard",
      depthIndex: 3,
      renderType: "chipset",
      accentText: "Apple M4 Silicon Die",
      role: "پردازش ۳۸ تریلیون عملیات عصبی در ثانیه و رندرینگ رهگیری پرتو سخت‌افزاری",
      specifications: { "تراشه": "Apple M4 (3nm)", "موتور عصبی": "16-Core Neural Engine (38 TOPS)", "پورت": "Thunderbolt 4 (40Gbps)" },
      engineeringHighlight: "معماری انباشته نسل دوم ۳ نانومتری با تراکم فوق‌العاده",
      material: "برد ۱۰ لایه مدار چاپی با طلاکاری ENIG"
    },
    {
      id: "pad-4",
      name: "High-Density Dual-Cell Polymer Battery Pack",
      nameFa: "پک باتری دو سلولی لیتیوم-پلیمر با ریل‌های خنک‌کاری",
      category: "battery",
      depthIndex: 4,
      renderType: "battery",
      accentText: "38.99Wh Li-Polymer",
      role: "تامین انرژی پایدار تا ۱۰ ساعت کار سنگین و شارژ سریع ۳۰ وات",
      specifications: { "ظرفیت": "38.99 Watt-Hour", "سلول‌ها": "۲ سلول متقارن", "حفاظت": "سنسورهای پایش دمای گرافیتی" },
      engineeringHighlight: "توزیع بار متقارن در دو سلول جهت خنک‌کاری یکنواخت مادربرد",
      material: "فویل گرافیت فشرده و سلول لیتیوم-پلیمر"
    },
    {
      id: "pad-5",
      name: "Four-Speaker Studio Sound Enclosure",
      nameFa: "سیستم صوتی ۴ اسپیکر استودیویی با محفظه بازتاب فرکانس بم",
      category: "audio",
      depthIndex: 5,
      renderType: "audio",
      accentText: "4-Speaker Spatial Audio",
      role: "تولید بیس عمیق و صدای سه‌بعدی فراگیر بدون انتقال لرزش به لنزها",
      specifications: { "اسپیکرها": "۴ درایور با مگنت نئودیمیوم N52", "فناوری": "Spatial Audio با Dolby Atmos" },
      engineeringHighlight: "محفظه مهروموم‌شده رزینی برای پاسخ فرکانسی خطی",
      material: "پلیمر رزین تقویت‌شده و آهن‌رباهای N52"
    },
    {
      id: "pad-6",
      name: "5.1mm Ultra-Slim Recycled CNC Aluminum Chassis",
      nameFa: "شاسی یکپارچه آلومینیوم سری ۶۰۰۰ با ضخامت رکوردشکن ۵.۱ میلی‌متر",
      category: "chassis",
      depthIndex: 6,
      renderType: "chassis",
      accentText: "5.1mm Unibody Chassis",
      role: "پایداری ساختار فیزیکی، جذب امواج نویز و خنک‌کاری مداوم بدون فن",
      specifications: { "ضخامت": "فقط 5.1 میلی‌متر (باریک‌ترین محصول تاریخ اپل)", "روش ساخت": "تراشکاری ۵ محوره CNC" },
      engineeringHighlight: "لوگوی برش‌خورده با خطای کمتر از ۰.۰۱ میلی‌متر",
      material: "آلومینیوم ۱۰۰٪ بازیافتی سری ۶۰۰۰"
    }
  ];

  useEffect(() => {
    if (!isOpen) return;
    setSelectedComp(components[0]);
    setExplosionDistance(0);
    soundEngine.playExplodeShift(1.2);
    const timer = setTimeout(() => setExplosionDistance(65), 120);
    return () => clearTimeout(timer);
  }, [isOpen, productTitle]);

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => setRotationY((prev) => (prev + 0.35) % 360), 30);
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
        
        {/* سربرگ هوشمند */}
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
                  60 FPS WebGL Engine
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
                    {/* لایه اولد */}
                    {comp.renderType === "display" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-black p-2.5 border border-slate-700/80 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                        <div className="absolute inset-0 bg-cover bg-center rounded-[2.2rem]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800')" }} />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/20 pointer-events-none rounded-[2.2rem]" />
                        <div className="z-10 flex justify-between items-center text-[10px] text-white p-2">
                          <span className="font-mono font-bold">9:41</span>
                          <span className="font-mono">5G 100%</span>
                        </div>
                        <div className="z-10 p-3 text-center bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 m-2">
                          <span className="font-black text-xs text-white block">{comp.accentText}</span>
                          <span className="text-[9px] text-blue-300 font-mono">Ultra Retina ProMotion</span>
                        </div>
                      </div>
                    )}

                    {/* ماژول دوربین و سنسورها */}
                    {comp.renderType === "camera" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-slate-900/90 border border-slate-700/80 p-4 flex flex-col justify-between backdrop-blur-md">
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-1 rounded-lg bg-black text-white font-mono text-[9px]">{comp.accentText}</span>
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
                        <span className="text-center font-mono text-[9px] text-slate-400">Precision Optical Array</span>
                      </div>
                    )}

                    {/* مادربرد و پردازنده مرکزی */}
                    {comp.renderType === "chipset" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-[#0c1a2e] border-2 border-blue-500/40 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
                        <div className="z-10 flex justify-between items-center text-[9px] font-mono text-blue-400">
                          <span>PCB 12-LAYER</span>
                          <span>TB4 40Gbps</span>
                        </div>
                        <div className="z-10 w-28 h-28 mx-auto rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-black border-2 border-blue-400 p-2 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.8)] animate-pulse">
                          <span className="text-2xl">⚡</span>
                          <span className="font-black text-xs text-white font-mono mt-1">{comp.accentText}</span>
                          <span className="text-[8px] text-blue-400 font-mono">3nm NEURAL</span>
                        </div>
                        <span className="z-10 text-center font-mono text-[9px] text-blue-300">Neural Engine & Ray Tracing</span>
                      </div>
                    )}

                    {/* باتری چندسلولی */}
                    {comp.renderType === "battery" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-slate-900/95 border border-slate-700/80 p-4 flex flex-col justify-between backdrop-blur-md">
                        <span className="font-mono text-[9px] text-slate-400">{comp.accentText}</span>
                        <div className="space-y-3 my-auto">
                          <div className="h-16 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 border border-slate-700 p-2 flex items-center justify-between text-xs font-mono text-emerald-400 shadow-inner">
                            <span>CELL-A: 50%</span><span>⚡ ACTIVE</span>
                          </div>
                          <div className="h-16 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 border border-slate-700 p-2 flex items-center justify-between text-xs font-mono text-emerald-400 shadow-inner">
                            <span>CELL-B: 50%</span><span>⚡ ACTIVE</span>
                          </div>
                        </div>
                        <span className="text-center font-mono text-[9px] text-emerald-400">High-Density Polymer System</span>
                      </div>
                    )}

                    {/* اسپیکرهای استودیویی */}
                    {comp.renderType === "audio" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-slate-950 border border-slate-700/80 p-4 flex flex-col justify-between">
                        <span className="font-mono text-[9px] text-slate-400">{comp.accentText}</span>
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

                    {/* شاسی پشتی آلومینیوم / تیتانیوم */}
                    {comp.renderType === "chassis" && (
                      <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-500 p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <span className="font-mono text-[9px] text-slate-300">{comp.accentText}</span>
                        <div className="my-auto text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-slate-950/80 border border-slate-600 flex items-center justify-center shadow-2xl">
                            <span className="text-3xl text-slate-200"></span>
                          </div>
                          <span className="font-bold text-xs text-white block mt-3">{productTitle}</span>
                        </div>
                        <span className="text-center font-mono text-[9px] text-slate-300">Precision Unibody Structure</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* کنترلر اسلایدر انفصال */}
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

          {/* سایدبار تحلیل مهندسی */}
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
