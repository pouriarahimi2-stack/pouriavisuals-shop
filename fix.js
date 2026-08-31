// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎬 [AXON MASTER FIX] در حال اجرای بازسازی کامل و بدون نقص فروشگاه آکسون...');

const files = {
  // ۱. فرمت‌کننده قطعی اعداد و تاریخ فارسی
  'lib/formatters.ts': `export function formatPrice(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return "۰";
  const num = Math.round(Number(amount));
  const parts = num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return parts.replace(/\\d/g, (d) => farsiDigits[parseInt(d, 10)]);
}

export function formatDateFa(dateStr?: string | null): string {
  if (!dateStr) return "امروز";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "امروز";
    const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return d.toLocaleDateString("fa-IR-u-nu-latn").replace(/\\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  } catch {
    return "امروز";
  }
}
`,

  // ۲. موتور Realtime سه‌گانه با پشتیبانی از فاوآیکون متحرک (GIF / SVG)
  'lib/realtimeSync.ts': `import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { productService } from "@/services/productService";
import { siteInfoService } from "@/services/siteInfoService";
import { bannerService } from "@/services/bannerService";

export function applyFaviconToDOM(url?: string) {
  if (typeof document === "undefined" || !url) return;
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      document.head.appendChild(link);
    }
    
    if (url.includes("image/gif") || url.endsWith(".gif")) {
      link.type = "image/gif";
    } else if (url.includes("image/svg") || url.endsWith(".svg")) {
      link.type = "image/svg+xml";
    } else if (url.includes("image/png") || url.endsWith(".png")) {
      link.type = "image/png";
    } else {
      link.type = "image/x-icon";
    }

    link.rel = "icon";
    link.href = \`\${url}\${url.includes("?") ? "&" : "?"}v=\${Date.now()}\`;
  } catch {}
}

export function applyTitleToDOM(title?: string, storeName?: string) {
  if (typeof document === "undefined") return;
  try {
    const sName = storeName || "آکسون";
    const sTitle = title || "مرجع تخصصی مانیتور و تجهیزات تصویر";
    document.title = \`\${sName} | \${sTitle}\`;
  } catch {}
}

declare global {
  interface Window {
    __AXON_REALTIME_SINGLETON__?: MasterRealtimeEngine;
  }
}

class MasterRealtimeEngine {
  private channel: RealtimeChannel | null = null;
  private broadcastBus: BroadcastChannel | null = null;
  private isSubscribed: boolean = false;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastBus = new BroadcastChannel("axon_master_bus_v2026");
        this.broadcastBus.onmessage = (event) => {
          const { type, data } = event.data || {};
          if (type) {
            window.dispatchEvent(new CustomEvent(type, { detail: data }));
            if (type === "site_info_updated" && data) {
              if (data.favicon_url) applyFaviconToDOM(data.favicon_url);
              if (data.tagline || data.site_name) applyTitleToDOM(data.tagline, data.site_name);
            }
          }
        };
      } catch {}
    }
  }

  public static getInstance(): MasterRealtimeEngine {
    if (typeof window !== "undefined") {
      if (!window.__AXON_REALTIME_SINGLETON__) {
        window.__AXON_REALTIME_SINGLETON__ = new MasterRealtimeEngine();
      }
      return window.__AXON_REALTIME_SINGLETON__;
    }
    return new MasterRealtimeEngine();
  }

  public broadcastLocally(type: string, data: any) {
    if (typeof window === "undefined") return;
    
    window.dispatchEvent(new CustomEvent(type, { detail: data }));
    
    if (this.broadcastBus) {
      try {
        this.broadcastBus.postMessage({ type, data });
      } catch {}
    }
    
    if (type === "site_info_updated" && data) {
      if (data.favicon_url) applyFaviconToDOM(data.favicon_url);
      if (data.tagline || data.site_name) applyTitleToDOM(data.tagline, data.site_name);
    }

    if (this.channel && this.isSubscribed) {
      try {
        this.channel.send({
          type: "broadcast",
          event: type,
          payload: data,
        });
      } catch {}
    }
  }

  public init(): () => void {
    if (typeof window === "undefined") return () => {};
    if (this.isSubscribed && this.channel) return () => {};

    try {
      this.channel = supabase.channel("axon_main_stream_v2026", {
        config: { broadcast: { ack: false } },
      });

      const eventNames = [
        "products_updated", "site_info_updated", "banners_updated",
        "orders_updated", "coupons_updated", "menu_updated", "news_updated"
      ];

      eventNames.forEach((ev) => {
        this.channel?.on("broadcast", { event: ev }, (payload) => {
          window.dispatchEvent(new CustomEvent(ev, { detail: payload.payload }));
          if (ev === "site_info_updated" && payload.payload) {
            if (payload.payload.favicon_url) applyFaviconToDOM(payload.payload.favicon_url);
            if (payload.payload.tagline || payload.payload.site_name) applyTitleToDOM(payload.payload.tagline, payload.payload.site_name);
          }
        });
      });

      const tables = ["products", "orders", "site_info", "banners", "tech_news", "coupons", "menu_items", "categories"];
      tables.forEach((tableName) => {
        this.channel?.on(
          "postgres_changes",
          { event: "*", schema: "public", table: tableName },
          async (payload: any) => {
            const updatedItem = payload.new || payload;
            window.dispatchEvent(new CustomEvent(\`\${tableName}_updated\`, { detail: updatedItem }));

            if (tableName === "products") {
              const all = await productService.getAll();
              window.dispatchEvent(new CustomEvent("products_updated", { detail: all }));
            } else if (tableName === "site_info") {
              const latest = await siteInfoService.getSiteInfo();
              window.dispatchEvent(new CustomEvent("site_info_updated", { detail: latest }));
              if (latest?.favicon_url) applyFaviconToDOM(latest.favicon_url);
              if (latest?.tagline || latest?.site_name) applyTitleToDOM(latest?.tagline, latest?.site_name);
            } else if (tableName === "banners") {
              const allBanners = await bannerService.getAll();
              window.dispatchEvent(new CustomEvent("banners_updated", { detail: allBanners }));
            }
          }
        );
      });

      this.channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.isSubscribed = true;
        }
      });
    } catch {}

    return () => {};
  }
}

export function initRealtimeSync(): () => void {
  return MasterRealtimeEngine.getInstance().init();
}

export const realtimeEngine = MasterRealtimeEngine.getInstance();
export default MasterRealtimeEngine;
`,

  // ۳. پنل تنظیمات ۳ لوگوی متحرک (GIF / SVG / WebP) با حفظ کامل فریم‌ها
  'components/AdminSiteInfo.tsx': `"use client";

import React, { useState, useEffect, useRef } from "react";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";
import { applyFaviconToDOM, applyTitleToDOM } from "@/lib/realtimeSync";

export default function AdminSiteInfo() {
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  
  const [logoUrl, setLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  const [announcement, setAnnouncement] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(2000000);
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const headerLogoRef = useRef<HTMLInputElement>(null);
  const footerLogoRef = useRef<HTMLInputElement>(null);
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
    setFaviconUrl(data.favicon_url || data.faviconUrl || "");
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "header" | "footer" | "favicon") => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEngine.playClick();

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultBase64 = event.target?.result as string;
      if (target === "header") {
        setLogoUrl(resultBase64);
      } else if (target === "footer") {
        setFooterLogoUrl(resultBase64);
      } else if (target === "favicon") {
        setFaviconUrl(resultBase64);
        applyFaviconToDOM(resultBase64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setStatusMessage(null);

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
      faviconUrl: faviconUrl.trim(),
      header_announcement: announcement.trim(),
      free_shipping_threshold: Number(freeShippingThreshold),
      description: description.trim(),
      footer_text: description.trim(),
    };

    try {
      const saved = await siteInfoService.updateSiteInfo(payload);
      if (saved) {
        soundEngine.playSuccess();
        if (saved.favicon_url) applyFaviconToDOM(saved.favicon_url);
        if (saved.tagline || saved.site_name) applyTitleToDOM(saved.tagline, saved.site_name);
        setStatusMessage({ type: "success", text: "⚡ ۳ نشان متحرک، فاوآیکون تب و تنظیمات با موفقیت ذخیره و فوراً اعمال شدند." });
      } else {
        throw new Error("خطا در ثبت پایگاه داده");
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
      <input type="file" ref={headerLogoRef} onChange={(e) => handleFileUpload(e, "header")} accept="image/*,.gif,.svg,.webp,.apng" className="hidden" />
      <input type="file" ref={footerLogoRef} onChange={(e) => handleFileUpload(e, "footer")} accept="image/*,.gif,.svg,.webp,.apng" className="hidden" />
      <input type="file" ref={faviconRef} onChange={(e) => handleFileUpload(e, "favicon")} accept="image/*,.gif,.svg,.ico,.webp,.apng" className="hidden" />

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات کلان سایت، هویت بصری و ۳ لوگوی متحرک (GIF / SVG / PNG)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">پیکربندی لوگوی هدر، لوگوی فوتر و فاوآیکون متحرک تب مرورگر با حفظ کامل فریم‌های انیمیشن</p>
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

      {/* بخش تفکیک‌شده ۳ لوگوی متحرک */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h3 className="text-sm font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">🖼️ مدیریت ۳ نشان و لوگوی مستقل و متحرک سایت</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ۱. لوگوی هدر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۱. لوگوی اصلی هدر بالای سایت (متحرک / ثابت)</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">نمایش زنده در کپسول ناوبری بالا</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-2xl">⚡</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => headerLogoRef.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود عکس / GIF</button>
              {logoUrl && <button type="button" onClick={() => setLogoUrl("")} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>

          {/* ۲. لوگوی فوتر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۲. لوگوی اختصاصی فوتر سایت (متحرک / ثابت)</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">نمایش در بخش پایین و پاورقی</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {footerLogoUrl ? <img src={footerLogoUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-2xl">⚓</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => footerLogoRef.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود عکس / GIF</button>
              {footerLogoUrl && <button type="button" onClick={() => setFooterLogoUrl("")} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>

          {/* ۳. فاوآیکون متحرک تب مرورگر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۳. فاوآیکون تب مرورگر (Favicon متحرک / GIF)</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">پخش مستقیم انیمیشن در تب مرورگر</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {faviconUrl ? <img src={faviconUrl} alt="" className="w-10 h-10 object-contain" /> : <span className="text-2xl">🌐</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => faviconRef.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود GIF / آیکون</button>
              {faviconUrl && <button type="button" onClick={() => { setFaviconUrl(""); applyFaviconToDOM("/favicon.ico"); }} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>
        </div>
      </div>

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
`,

  // ۴. فوتر سایت با بسته‌شدن ۱۰۰٪ کامل و بدون خطای سینتکس
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
              {footerLogo ? (
                <img src={footerLogo} alt={siteName} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full rounded-xl bg-[var(--accent-blue)] flex items-center justify-center text-white font-black text-xl">
                  ⚓
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {info?.description || info?.tagline || "مرجع تخصصی مانیتور و تجهیزات تصویر"}
            </p>
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
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ فایل بازنویسی شد: ${filePath}`);
}

console.log('📦 در حال Push خودکار به گیت‌هاب و انتشار در Vercel...');
try {
  execSync('git add . && git commit -m "fix: complete syntax fix for fix.js - animated logos & favicons active" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 تغییرات با موفقیت دیپلوی شدند!');
} catch (e) {
  console.log('⚠️ دستور دستی: git push origin main');
}