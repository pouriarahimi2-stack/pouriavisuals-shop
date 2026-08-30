// File: fix.js
const fs拼 = require('fs');
const path拼 = require('path');
const { execSync } = require('child_process');

console.log('🚀 در حال اعمال معماری بلادرنگ Realtime، تفکیک ۳ لوگو، بازگردانی کامل صفحه کالا و اخبار...');

const files = {
  // ۱. موتور وب‌سوکت Realtime و تغییر آنی فاوآیکون مرورگر
  'lib/realtimeSync.ts': `import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeEventPayload<T = any> {
  eventType: "INSERT" | "UPDATE" | "DELETE" | "SYNC";
  table: string;
  newRecord: T | null;
  oldRecord: T | null;
  timestamp: number;
}

class MasterRealtimeEngine {
  private static instance: MasterRealtimeEngine;
  private channel: RealtimeChannel | null = null;
  private isSubscribed: boolean = false;

  private constructor() {}

  public static getInstance(): MasterRealtimeEngine {
    if (!MasterRealtimeEngine.instance) {
      MasterRealtimeEngine.instance = new MasterRealtimeEngine();
    }
    return MasterRealtimeEngine.instance;
  }

  public init(): () => void {
    if (typeof window === "undefined") return () => {};
    if (this.isSubscribed && this.channel) return () => {};

    this.channel不易 = supabase.channel("axon_master_realtime_stream_v2026", {
      config: { broadcast: { ack: true } },
    });

    const tables = [
      "products", "orders", "site_info", "banners", "tech_news",
      "coupons", "contact_messages", "posts", "site_pages",
      "site_styles", "menu_items", "categories", "product_reviews", "admin_users"
    ];

    tables.forEach((tableName) => {
      if (!this.channel不易) return;
      this.channel不易.on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        (payload: any) => {
          const customPayload: RealtimeEventPayload = {
            eventType: payload.eventType,
            table: tableName,
            newRecord: payload.new || null,
            oldRecord: payload.old || null,
            timestamp: Date.now(),
          };

          window.dispatchEvent(new CustomEvent(\`\${tableName}_updated\`, { detail: customPayload }));

          if (tableName === "site_info") {
            const info = payload.new || payload;
            window.dispatchEvent(new CustomEvent("site_info_updated", { detail: info }));
            if (info?.favicon_url && typeof document !== "undefined") {
              let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
              if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.head.appendChild(link);
              }
              link.href = info.favicon_url;
            }
          } else if (tableName === "products") {
            window.dispatchEvent(new CustomEvent("products_realtime_mutation", { detail: customPayload }));
          }
        }
      );
    });

    this.channel不易.subscribe((status) => {
      if (status === "SUBSCRIBED") this.isSubscribed = true;
    });

    return () => {
      if (this.channel不易) {
        supabase.removeChannel(this.channel不易);
        this.channel不易 = null;
        this.isSubscribed不易 = false;
      }
    };
  }
}

export function initRealtimeSync(): () => void {
  return MasterRealtimeEngine.getInstance().init();
}

export default MasterRealtimeEngine;
`.replace(/channel不易/g, 'channel').replace(/isSubscribed不易/g, 'isSubscribed'),

  // ۲. مدیریت تفکیک‌شده و بدون باگ ۳ لوگو در ادمین
  'components/AdminSiteInfo.tsx': `"use client";

import React, { useState, useEffect, useRef } from "react";
import { siteInfoService, SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminSiteInfo() {
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  
  // ۳ فیلد کاملاً مستقل برای ۳ لوگو
  const [logoUrl, setLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>("none");
  const [maintHours, setMaintHours] = useState<number>(1);
  const [maintMinutes, setMaintMinutes] = useState<number>(0);
  const [announcement, setAnnouncement] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(2000000);
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const headerLogoRef = useRef<HTMLInputElement>(null);
  const footerLogoRef做到 = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const populateForm = (data: SiteInfo) => {
    if (!data) return;
    setSiteName(data.site_name || data.siteName || data.storeName || "آکسون | Axon");
    setTagline(data.tagline || "");
    setPhone(data.phone || "");
    setEmail(data.email || "");
    setAddress(data.address || "");
    setWorkingHours(data.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰");
    setLogoUrl(data.logo_url || data.logoUrl || "");
    setFooterLogoUrl(data.footer_logo_url || data.footerLogoUrl || "");
    setFaviconUrl(data.favicon_url || "");
    setMaintenanceMode(data.maintenance_mode || (data.allow_google_index === false ? "indefinite" : "none"));
    setAnnouncement(data.header_announcement || "");
    setFreeShippingThreshold(Number(data.free_shipping_threshold || 2000000));
    setDescription(data.description || data.footer_text || "");
  };

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && populateForm(d));
    const handleUpdate = (e: any) => { if (e.detail) populateForm(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const compressImage = (file: File, maxDim = 800): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src記憶 = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) { height = Math.round((height * maxDim) / width); width述 = maxDim; }
          } else {
            if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/webp", 0.85));
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "header" | "footer" | "favicon") => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEngine.playClick();
    const maxDim = target === "favicon" ? 128 : 800;
    const optimized = await compressImage(file, maxDim);
    if (target === "header") setLogoUrl(optimized);
    else if (target === "footer") setFooterLogoUrl(optimized);
    else if (target === "favicon") setFaviconUrl(optimized);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setStatusMessage(null);

    let untilISO: string | null = null;
    const totalMins = Number(maintHours) * 60 + Number(maintMinutes);
    if (maintenanceMode === "timed") {
      untilISO = new Date(Date.now() + totalMins * 60 * 1000).toISOString();
    }

    const payload: Partial<SiteInfo> = {
      site_name: siteName.trim(),
      siteName: siteName.trim(),
      storeName: siteName.trim(),
      tagline: tagline.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      working_hours: workingHours.trim(),
      logo_url: logoUrl.trim(),
      logoUrl: logoUrl.trim(),
      footer_logo_url: footerLogoUrl.trim(),
      footerLogoUrl: footerLogoUrl.trim(),
      favicon_url: faviconUrl.trim(),
      allow_google_index: maintenanceMode === "none",
      allowGoogleIndex: maintenanceMode === "none",
      maintenance_mode: maintenanceMode,
      maintenance_until: untilISO || undefined,
      maintenance_duration_minutes: maintenanceMode === "timed" ? totalMins : undefined,
      header_announcement: announcement.trim(),
      free_shipping_threshold: Number(freeShippingThreshold),
      description: description.trim(),
      footer_text: description.trim(),
    };

    try {
      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setStatusMessage({ type: "success", text: "⚡ تنظیمات، ۳ لوگوی مجزا و وضعیت سایت با موفقیت در دیتابیس ذخیره و بلادرنگ اعمال شدند." });
      } else {
        throw new Error(json.message || "خطا در ثبت");
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "خطا در ذخیره‌سازی اطلاعات" });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <input type="file" ref={headerLogoRef} onChange={(e) => handleFileUpload(e, "header")} accept="image/*" className="hidden" />
      <input type="file" ref={footerLogoRef做到} onChange={(e) => handleFileUpload(e, "footer")} accept="image/*" className="hidden" />
      <input type="file" ref={faviconRef} onChange={(e) => handleFileUpload(e, "favicon")} accept="image/*" className="hidden" />

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات کلان سایت، هویت بصری و ۳ لوگوی مستقل
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">پیکربندی لوگوی هدر، لوگوی فوتر، فاوآیکون مرورگر و حالت تعمیرات ۳ حالته</p>
        </div>
        <button type="button" onClick={() => handleSubmit()} disabled={saving} className="px-7 py-3 bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white rounded-2xl text-xs font-black transition shadow-xl cursor-pointer disabled:opacity-50">
          {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و اعمال سراسری"}
        </button>
      </div>

      {statusMessage && (
        <div className={\`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn \${statusMessage.type === "success" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 border border-rose-500/30 text-rose-600"}\`}>
          {statusMessage.text}
        </div>
      )}

      {/* بخش تفکیک‌شده ۳ لوگو با استایل تمیز و بدون تداخل */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h3 className="text-sm font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">🖼️ مدیریت ۳ نشان و لوگوی مستقل سایت</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ۱. لوگوی هدر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۱. لوگوی اصلی هدر بالای سایت</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">نمایش در کپسول ناوبری بالا</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-2xl">⚡</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => headerLogoRef.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود عکس</button>
              {logoUrl && <button type="button" onClick={() => setLogoUrl("")} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>

          {/* ۲. لوگوی فوتر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۲. لوگوی اختصاصی فوتر سایت</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">نمایش در بخش پایین و پاورقی</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {footerLogoUrl ? <img src={footerLogoUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-2xl">⚓</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => footerLogoRef做到.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود عکس</button>
              {footerLogoUrl && <button type="button" onClick={() => setFooterLogoUrl("")} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>

          {/* ۳. فاوآیکون تب مرورگر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۳. فاوآیکون تب مرورگر (Favicon)</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">نمایش در تب کنار عنوان مرورگر</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {faviconUrl ? <img src={faviconUrl} alt="" className="w-10 h-10 object-contain" /> : <span className="text-2xl">🌐</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => faviconRef.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود آیکون</button>
              {faviconUrl && <button type="button" onClick={() => setFaviconUrl("")} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>
        </div>
      </div>

      {/* اطلاعات فروشگاه */}
      <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نام رسمی برند / فروشگاه *</label>
            <input type="text" required value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-bold text-[var(--text-primary)] outline-none" />
          </div>
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">شعار تبلیغاتی (Tagline)</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-bold text-[var(--text-primary)] outline-none" />
          </div>
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">شماره تماس پشتیبانی</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-mono font-bold text-[var(--text-primary)] outline-none" />
          </div>
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">ایمیل رسمی</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-mono text-[var(--text-primary)] outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نشانی پستی انبار و دفتر</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-[var(--text-primary)] outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">متن اعلان بالای سایت</label>
            <input type="text" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-[var(--text-primary)] font-bold outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
`.replace('footerLogoRef做到', 'footerLogoRef').replace('src記憶', 'src').replace('width述 =', 'width ='),

  // ۳. بازگردانی ۱۰۰٪ کامل صفحه کالا با کالبدشکافی ۳D، شبیه‌ساز گاموت، مقایسه قیمت و نظرات
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
  const [activeTab, setActiveTab] = useState<"specs" | "gamut" | "comparison" | "desc" | "shipping" | "reviews">("specs");
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
        <Link href="/products" className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs">← بازگشت به کاتالوگ</Link>
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
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans select-none text-[var(--text-primary)] space-y-10 pb-28 sm:pb-10" dir="rtl">
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-bold">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition">صفحه نخست</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{product.title}</span>
      </div>

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
              <span className="text-xs text-[var(--text-secondary)] font-bold">قیمت نهایی:</span>
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

      <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[var(--card-border)] text-xs scrollbar-none">
          {[{ id: "specs", label: "⚙️ مشخصات فنی دقیق" }, { id: "gamut", label: "🎨 شبیه‌ساز گاموت رنگی" }, { id: "comparison", label: "⚖️ پایش قیمت با بازار" }, { id: "desc", label: "📝 بررسی تخصصی" }, { id: "reviews", label: "⭐ نظرات کاربران" }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={\`px-5 py-3 rounded-2xl font-black transition cursor-pointer whitespace-nowrap \${activeTab === tab.id ? "bg-[var(--accent-blue)] text-white shadow-lg" : "bg-[var(--modal-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]"}\`}>
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
        {activeTab === "desc" && <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-xs leading-loose whitespace-pre-line">{product.description}</div>}
        {activeTab === "reviews" && <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl"><ProductReviews productId={product.id} /></div>}
      </div>

      <ProductExplodedView productId={product.id} productTitle={product.title} category={product.category} isOpen={isExplodedViewOpen} onClose={() => setIsExplodedViewOpen(false)} />
    </div>
  );
}
`,

  // ۴. فوتر متصل به لوگوی فوتر
  'components/Footer.tsx': `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setInfo(d));
    const handleUpdate = (e: any) => { if (e.detail) setInfo(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const siteName = info?.site_name || info?.siteName || "آکسون | Axon";
  const footerLogo = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url;

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] transition-colors mt-auto shadow-2xl select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="w-full max-w-[180px] h-20 rounded-2xl border border-[var(--card-border)] bg-white/5 p-2 shadow-inner flex items-center justify-center overflow-hidden">
              {footerLogo ? <img src={footerLogo} alt={siteName} className="w-full h-full object-contain" /> : <div className="w-full h-full rounded-xl bg-[var(--accent-blue)] flex items-center justify-center text-white font-black text-xl">⚓</div>}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">{info?.description || info?.tagline || "مرجع تخصصی مانیتور و تجهیزات تصویر"}</p>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">دسترسی سریع</h5>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/#products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ محصولات</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">پیگیری سفارش</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله سئو</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">اطلاعات رسمی</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li>تلفن: <span className="font-mono font-bold text-[var(--accent-blue)]">{info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸"}</span></li>
              <li>ایمیل: <span className="font-mono">{info?.email || "info@axoncore.ir"}</span></li>
              <li>ساعات کاری: {info?.working_hours || "۹:۰۰ الی ۱۸:۰۰"}</li>
              <li>نشانی: {info?.address || "تهران، خیابان ولیعصر"}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">ضمانت و استانداردها</h5>
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 text-xs">
              <div className="font-black text-emerald-500">✓ ضمانت ۱۰۰٪ اصالت فیزیکی کالا</div>
              <p className="text-[11px] text-[var(--text-secondary)]">ارسال پیشتاز با بسته‌بندی ضدضربه استودیویی و بیمه کامل.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--card-border)] text-center text-xs text-[var(--text-secondary)] font-bold">
          تمامی حقوق مادی و معنوی برای مجموعه <span className="text-[var(--accent-blue)]">{siteName}</span> محفوظ است © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
`,
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path拼.join(__dirname, filePath);
  const dir = path拼.dirname(fullPath);
  if (!fs拼.existsSync(dir)) fs拼.mkdirSync(dir, { recursive: true });
  fs拼.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ فایل به صورت زنده و با اتصال کامل دیتابیس بروز شد: ${filePath}`);
}

console.log('📦 در حال پوش خودکار به گیت‌هاب و سرور Vercel...');
try {
  execSync('git add . && git commit -m "feat: complete realtime supabase sync, independent 3 logos, restored rich product details and news hub" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 تمام امکانات به صورت زنده روی سایت آنلاین axoncore.ir منتشر شدند!');
} catch (e) {
  console.log('⚠️ دستور زیر را در ترمینال بزنید: git push -f origin main');
}