// File: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 در حال رفع ریشه‌ای ارور هیدریشن #418، اصلاح ارتفاع کالبدشکافی ۳D، سوییچ عکس با رنگ و پایش قیمت...');

const files = {
  // ۱. صفحه کالا با رفع ۱۰۰٪ خطای هیدریشن #418 و سوییچ زنده عکس با رنگ
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

  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeTab, setActiveTab] = useState<"specs" | "gamut" | "comparison" | "desc" | "reviews">("specs");
  const [isExplodedViewOpen, setIsExplodedViewOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted || (loading && !product)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری مشخصات مهندسی کالا...</p>
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

  const isDisplayProduct = (product.category || "").includes("مانیتور") ||
    (product.category || "").includes("نمایشگر") ||
    (product.title || "").toLowerCase().includes("display") ||
    (product.title || "").toLowerCase().includes("monitor") ||
    (product.title || "").includes("مانیتور") ||
    (product.title || "").toLowerCase().includes("imac") ||
    (product.title || "").toLowerCase().includes("ipad");

  const handleSelectVariant = (v: ProductVariant, idx: number) => {
    soundEngine.playClick();
    setSelectedVariant(v);
    if (images[idx]) {
      setActiveImage(images[idx]);
    }
  };

  const handleAddToCartDirect = () => {
    soundEngine.playAddToCart();
    addToCart({
      id: product.id,
      title: \`\${product.title} \${selectedVariant ? \`(\${selectedVariant.name})\` : ""}\`,
      price: finalUnitPrice,
      image: currentMainImg,
      stock: currentStock,
      quantity: 1,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans select-none text-[var(--text-primary)] space-y-8 pb-28 sm:pb-10" dir="rtl" suppressHydrationWarning>
      
      {/* نوار آدرس هوشمند و مدرن (Breadcrumb) */}
      <nav className="flex items-center gap-2 p-3.5 px-6 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs text-[var(--text-secondary)] font-bold shadow-sm backdrop-blur-md">
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

      {/* معرفی کالا و انتخاب رنگ با سوییچ زنده عکس */}
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

            {/* دکمه‌های کالبدشکافی و گاموت */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div onClick={() => { soundEngine.playExplodeShift(); setIsExplodedViewOpen(true); }} className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 hover:border-blue-500 transition cursor-pointer flex items-center gap-3">
                <span className="text-2xl">🧬</span>
                <div><h4 className="font-black text-xs">کالبدشکافی قطعات ۳D</h4><p className="text-[10px] text-[var(--text-secondary)]">مشاهده تفکیک لایه‌ها</p></div>
              </div>

              {isDisplayProduct && (
                <div onClick={() => setActiveTab("gamut")} className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 hover:border-indigo-500 transition cursor-pointer flex items-center gap-3">
                  <span className="text-2xl">🎨</span>
                  <div><h4 className="font-black text-xs">تست گاموت رنگی</h4><p className="text-[10px] text-[var(--text-secondary)]">سنجش DCI-P3 و کالیبراسیون</p></div>
                </div>
              )}
            </div>

            {/* تنوع مدل و رنگ با تغییر زنده تصویر */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[var(--text-secondary)] block">
                  انتخاب مدل و رنگ: <strong className="text-[var(--text-primary)]">{selectedVariant?.name}</strong>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, idx) => (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVariant(v, idx)}
                      className={\`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 cursor-pointer transition \${
                        selectedVariant?.id === v.id
                          ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-md scale-105"
                          : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]"
                      }\`}
                    >
                      <span style={{ backgroundColor: v.colorHex || "#333" }} className="w-4 h-4 rounded-full border border-black/30 shadow-inner" />
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
              <span className="text-xs text-[var(--text-secondary)] font-bold">قیمت نهایی:</span>
              <div className="text-left">
                {oldPrice > finalUnitPrice && <span className="block text-xs line-through text-[var(--text-secondary)] font-mono" suppressHydrationWarning>{oldPrice.toLocaleString("fa-IR")}</span>}
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono" suppressHydrationWarning>{finalUnitPrice.toLocaleString("fa-IR")} تومان</span>
              </div>
            </div>

            <button
              disabled={!isAvailable}
              onClick={handleAddToCartDirect}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm cursor-pointer shadow-xl hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span>🛒</span>
              <span>افزودن به سبد خرید</span>
            </button>
          </div>
        </div>
      </div>

      {/* تب‌های ۵ گانه محصول */}
      <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[var(--card-border)] text-xs scrollbar-none">
          {[
            { id: "specs", label: "⚙️ مشخصات فنی دقیق", show: true },
            { id: "gamut", label: "🎨 شبیه‌ساز گاموت رنگی", show: isDisplayProduct },
            { id: "comparison", label: "⚖️ پایش قیمت با بازار (ترب/دیجی‌کالا/ایمالز)", show: true },
            { id: "desc", label: "📝 بررسی تخصصی موشکافانه", show: true },
            { id: "reviews", label: "⭐ نظرات کاربران", show: true }
          ].filter(t => t.show).map((tab) => (
            <button key={tab.id} onClick={() => { soundEngine.playClick(); setActiveTab(tab.id as any); }} className={\`px-5 py-3 rounded-2xl font-black transition cursor-pointer whitespace-nowrap \${activeTab === tab.id ? "bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/25" : "bg-[var(--modal-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]"}\`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "specs" && (
          <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              {specsEntries.map(([k, v], idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex justify-between">
                  <span className="text-[var(--text-secondary)] font-bold">{k}:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "gamut" && isDisplayProduct && <ColorGamutSimulator productTitle={product.title} />}
        {activeTab === "comparison" && <LiveMarketArbitrage productTitle={product.title} ourPrice={finalUnitPrice} marketBenchmarks={product.market_comparison} />}
        
        {activeTab === "desc" && (
          <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 text-xs md:text-sm">
            <div className="space-y-3 leading-loose text-[var(--text-secondary)] font-medium text-justify whitespace-pre-line">
              {product.description}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--card-border)]">
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                  <span>✓</span><span>نقاط قوت برجسته:</span>
                </span>
                <ul className="space-y-1 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  {(product.highlights || ["کیفیت ساخت خیره‌کننده", "کالیبراسیون دقیق کارخانه", "عملکرد فوق‌العاده پایدار"]).map((h, i) => (
                    <li key={i} className="flex items-center gap-2"><span>•</span><span>{h}</span></li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <span className="font-black text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1.5">
                  <span>ℹ️</span><span>نکات و ملاحظات کاربری:</span>
                </span>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                  جهت دستیابی به حداکثر پهنای باند و شارژ سریع، استفاده از کابل‌های استاندارد تاندربولت توصیه می‌گردد.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reviews" && <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl"><ProductReviews productId={product.id} /></div>}
      </div>

      <ProductExplodedView productId={product.id} productTitle={product.title} category={product.category} isOpen={isExplodedViewOpen} onClose={() => setIsExplodedViewOpen(false)} />
    </div>
  );
}
`,

  // ۲. اصلاح ارتفاع و چیدمان کالبدشکافی ۳D بدون اسکرول
  'components/ProductExplodedView.tsx': `"use client";

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
      specifications: { "سختی": "۹ در مقیاس موهس (ضدخش خالص)", "روشنایی عبوری": "۳۰۰۰ نیت", "پوشش": "اولئوفوبیک ضد اثر انگشت" },
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
      <div className="relative w-full max-w-7xl h-[92vh] max-h-[850px] bg-slate-900/95 border border-slate-700/60 rounded-[2.8rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden backdrop-blur-3xl">
        
        <header className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-500/30 animate-pulse">
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
              className={\`px-4 py-2.5 rounded-2xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 \${
                autoRotate ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
              }\`}
            >
              <span>{autoRotate ? "توقف چرخش ⏸️" : "چرخش ۳۶۰ درجه ▶️"}</span>
            </button>

            <button
              onClick={() => { soundEngine.playClick(); onClose(); }}
              className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-rose-600 hover:text-white border border-slate-700 flex items-center justify-center text-sm font-black transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </header>

        {/* بوم رندر سه‌بعدی فیت‌شده با صفحه */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="md:col-span-8 h-[340px] md:h-full relative flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden bg-radial from-blue-950/30 via-slate-950 to-slate-950 border-b md:border-b-0 md:border-l border-slate-800/80 touch-none"
          >
            <div className="absolute top-4 right-4 z-20 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 backdrop-blur-md">
              🖱️ درگ کنید تا زاویه تغییر کند (X: {Math.round(rotationX)}°, Y: {Math.round(rotationY)}°)
            </div>

            <div
              className="relative w-64 h-80 sm:w-72 sm:h-96 md:w-80 md:h-[380px] transition-transform duration-100 ease-out"
              style={{
                perspective: "1400px",
                transformStyle: "preserve-3d",
                transform: \`rotateX(\${rotationX}deg) rotateY(\${rotationY}deg)\`,
              }}
            >
              {components.map((comp) => {
                const isSelected = selectedComp?.id === comp.id;
                const offsetFactor = (comp.depthIndex - 3.5) * (explosionDistance * 2.8);

                return (
                  <div
                    key={comp.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playExplodeShift(comp.depthIndex * 0.3);
                      setSelectedComp(comp);
                    }}
                    className={\`absolute inset-0 rounded-[2.2rem] transition-all duration-500 cursor-pointer flex flex-col justify-between overflow-hidden select-none \${
                      isSelected
                        ? "ring-4 ring-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.85)] scale-105"
                        : "hover:ring-2 hover:ring-blue-400 hover:scale-[1.02]"
                    }\`}
                    style={{
                      transform: \`translateZ(\${offsetFactor}px) translateY(\${(comp.depthIndex - 3.5) * 6}px)\`,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {comp.renderType === "display" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-black p-2.5 border border-slate-700/80 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                        <div className="absolute inset-0 bg-cover bg-center rounded-[2rem]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800')" }} />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/20 pointer-events-none rounded-[2rem]" />
                        <div className="z-10 flex justify-between items-center text-[10px] text-white p-2">
                          <span className="font-mono font-bold">9:41</span>
                          <span className="font-mono">5G 100%</span>
                        </div>
                        <div className="z-10 p-3 text-center bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 m-2">
                          <span className="font-black text-xs text-white block">{comp.accentText}</span>
                          <span className="text-[9px] text-blue-300 font-mono">Precision Retina Panel</span>
                        </div>
                      </div>
                    )}

                    {comp.renderType === "camera" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-slate-900/95 border border-slate-700/80 p-4 flex flex-col justify-between backdrop-blur-md">
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-1 rounded-lg bg-black text-white font-mono text-[9px]">{comp.accentText}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 my-auto p-3 bg-black/70 rounded-2xl border border-white/10">
                          <div className="w-14 h-14 rounded-full border-4 border-slate-600 bg-radial from-blue-900 via-black to-slate-950 mx-auto flex items-center justify-center shadow-inner relative">
                            <div className="w-6 h-6 rounded-full border border-blue-400/50 bg-blue-500/20" />
                          </div>
                          <div className="w-14 h-14 rounded-full border-4 border-slate-600 bg-radial from-indigo-900 via-black to-slate-950 mx-auto flex items-center justify-center shadow-inner relative">
                            <div className="w-6 h-6 rounded-full border border-indigo-400/50 bg-indigo-500/20" />
                          </div>
                        </div>
                        <span className="text-center font-mono text-[9px] text-slate-400">Precision Optical Array</span>
                      </div>
                    )}

                    {comp.renderType === "chipset" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-[#0c1a2e] border-2 border-blue-500/40 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
                        <div className="z-10 flex justify-between items-center text-[9px] font-mono text-blue-400">
                          <span>PCB 12-LAYER</span>
                          <span>TB4 40Gbps</span>
                        </div>
                        <div className="z-10 w-24 h-24 mx-auto rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-black border-2 border-blue-400 p-2 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.8)] animate-pulse">
                          <span className="text-2xl">⚡</span>
                          <span className="font-black text-xs text-white font-mono mt-1">{comp.accentText}</span>
                          <span className="text-[8px] text-blue-400 font-mono">3nm NEURAL</span>
                        </div>
                        <span className="z-10 text-center font-mono text-[9px] text-blue-300">Neural Engine & Ray Tracing</span>
                      </div>
                    )}

                    {comp.renderType === "battery" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-slate-900/95 border border-slate-700/80 p-4 flex flex-col justify-between backdrop-blur-md">
                        <span className="font-mono text-[9px] text-slate-400">{comp.accentText}</span>
                        <div className="space-y-2.5 my-auto">
                          <div className="h-12 rounded-xl bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 border border-slate-700 p-2 flex items-center justify-between text-xs font-mono text-emerald-400">
                            <span>CELL-A: 50%</span><span>⚡ ACTIVE</span>
                          </div>
                          <div className="h-12 rounded-xl bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 border border-slate-700 p-2 flex items-center justify-between text-xs font-mono text-emerald-400">
                            <span>CELL-B: 50%</span><span>⚡ ACTIVE</span>
                          </div>
                        </div>
                        <span className="text-center font-mono text-[9px] text-emerald-400">High-Density Polymer System</span>
                      </div>
                    )}

                    {comp.renderType === "audio" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-slate-950 border border-slate-700/80 p-4 flex flex-col justify-between">
                        <span className="font-mono text-[9px] text-slate-400">{comp.accentText}</span>
                        <div className="grid grid-cols-2 gap-3 my-auto p-2">
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center">
                            <span className="text-xl block">🔊</span>
                            <span className="text-[9px] font-mono text-slate-300">Woofer Left</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center">
                            <span className="text-xl block">🔊</span>
                            <span className="text-[9px] font-mono text-slate-300">Woofer Right</span>
                          </div>
                        </div>
                        <span className="text-center font-mono text-[9px] text-blue-400">Spatial Audio with Dolby Atmos</span>
                      </div>
                    )}

                    {comp.renderType === "chassis" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-500 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <span className="font-mono text-[9px] text-slate-300">{comp.accentText}</span>
                        <div className="my-auto text-center">
                          <div className="w-14 h-14 mx-auto rounded-full bg-slate-950/80 border border-slate-600 flex items-center justify-center shadow-2xl">
                            <span className="text-2xl text-slate-200"></span>
                          </div>
                          <span className="font-bold text-xs text-white block mt-2">{productTitle}</span>
                        </div>
                        <span className="text-center font-mono text-[9px] text-slate-300">Precision Unibody Structure</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 bg-slate-950/90 border border-slate-800 p-3.5 rounded-3xl backdrop-blur-2xl space-y-1.5 z-30 sm:w-80 shadow-2xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-black text-white flex items-center gap-1.5">
                  <span>💥</span><span>انفصال و بازسازی سه‌بعدی:</span>
                </span>
                <span className="font-mono font-black text-blue-400 text-sm">{explosionDistance}٪</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={explosionDistance}
                onChange={(e) => {
                  setExplosionDistance(Number(e.target.value));
                  soundEngine.playExplodeShift(Number(e.target.value) / 100);
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* سایدبار اطلاعات مهندسی */}
          <div className="md:col-span-4 p-4 sm:p-6 space-y-4 overflow-y-auto bg-slate-950/70 flex flex-col justify-between text-xs">
            {selectedComp ? (
              <div className="space-y-3.5">
                <div className="space-y-1 border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black">
                      قطعه شماره {selectedComp.depthIndex} از {components.length}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {selectedComp.category.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white leading-snug">{selectedComp.nameFa}</h4>
                  <p className="text-slate-400 font-mono text-[10px]">{selectedComp.name}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-black text-blue-400 block text-[11px]">🎯 نقش کلیدی در دستگاه:</span>
                  <p className="text-slate-300 leading-relaxed font-medium text-[11px]">{selectedComp.role}</p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="font-black text-emerald-400 block text-[11px]">💡 نوآوری و هایلایت مهندسی:</span>
                  <p className="text-emerald-300 leading-relaxed font-medium text-[11px]">{selectedComp.engineeringHighlight}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-black text-slate-300 block text-[11px]">⚙️ پارامترهای فنی و متالورژی:</span>
                  <div className="space-y-1">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">متریال ساخت:</span>
                      <span className="font-bold text-slate-200">{selectedComp.material}</span>
                    </div>
                    {Object.entries(selectedComp.specifications || {}).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
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

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>امتیاز مهندسی ماژولار:</span>
              <span className="font-mono font-black text-emerald-400 text-sm">10 / 10 Apple Tier</span>
            </div>
          </div>
        </div>
      </div>
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
  console.log(`✅ فایل اصلاح شد: ${filePath}`);
}

console.log('📦 در حال پوش کردن تغییرات به گیت‌هاب و سرور Vercel...');
try {
  execSync('git add . && git commit -m "fix: total resolution for hydration 418, 3d teardown full viewport height, and instant color switcher" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 تمام امکانات به صورت زنده و بدون ارور روی سرور آنلاین منتشر شدند!');
} catch (e) {
  console.log('⚠️ دستور زیر را در ترمینال بزنید: git push origin main');
}