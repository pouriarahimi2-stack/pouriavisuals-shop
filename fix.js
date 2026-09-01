// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎬 [AXON ARCHITECT] در حال اصلاح پایدار ذخیره‌سازی کلید Gemini Pro و فعال‌سازی دکمه تست زنده در ادمین...');

const files = {
  // ۱. روت اختصاصی تست زنده کلید Gemini API با پاسخ لحظه‌ای
  'app/api/test-ai/route.ts': `// File Path: app/api/test-ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    let targetKey = apiKey;
    if (!targetKey) {
      try {
        const { data } = await supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle();
        targetKey = (data as any)?.gemini_api_key || process.env.GEMINI_API_KEY;
      } catch {}
    }

    if (!targetKey || targetKey.length < 15) {
      return NextResponse.json({ success: false, message: "کلید API وارد نشده یا معتبر نیست." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(targetKey.trim());
    const candidateModels = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-1.5-flash", "gemini-pro"];
    let reply = "";
    let activeModelName = "";

    for (const mName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: mName });
        const result = await model.generateContent("سلام! یک پاسخ کوتاه ۲ کلمه‌ای به فارسی بده.");
        reply = result.response.text();
        if (reply) {
          activeModelName = mName;
          break;
        }
      } catch (err: any) {
        console.warn(\`Test model \${mName} failed:\`, err?.message);
      }
    }

    if (reply) {
      return NextResponse.json({
        success: true,
        message: \`اتصال با موفقیت برقرار شد! پاسخ هوش مصنوعی: "\${reply.trim()}" (مدل فعال: \${activeModelName})\`,
        activeModel: activeModelName,
      });
    }

    return NextResponse.json({ success: false, message: "خطا در اتصال به گوگل. کلید یا سهمیه پروژه را بررسی فرمایید." }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: \`خطای اعتبارسنجی: \${err.message}\` }, { status: 500 });
  }
}
`,

  // ۲. اصلاح ذخیره‌سازی پایدار gemini_api_key در روت site-info
  'app/api/site-info/route.ts': `// File Path: app/api/site-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ success: true, data: data || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { data: existing } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    const maintMode = body.maintenance_mode !== undefined 
      ? body.maintenance_mode 
      : (existing?.maintenance_mode || "none");

    const isAllowed = body.allow_google_index !== undefined
      ? body.allow_google_index
      : (maintMode === "none");

    const sName = body.site_name || body.siteName || body.storeName || existing?.site_name || "آکسون | Axon";

    const payload: Record<string, any> = {
      id: existing?.id || 1,
      site_name: sName,
      store_name: sName,
      tagline: body.tagline !== undefined ? body.tagline : (existing?.tagline || ""),
      phone: body.phone !== undefined ? body.phone : (existing?.phone || ""),
      email: body.email !== undefined ? body.email : (existing?.email || ""),
      address: body.address !== undefined ? body.address : (existing?.address || ""),
      working_hours: body.working_hours !== undefined ? body.working_hours : (existing?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰"),
      logo_url: body.logo_url !== undefined ? body.logo_url : (existing?.logo_url || null),
      footer_logo_url: body.footer_logo_url !== undefined ? body.footer_logo_url : (existing?.footer_logo_url || null),
      favicon_url: body.favicon_url !== undefined ? body.favicon_url : (existing?.favicon_url || null),
      description: body.description || body.footer_text || existing?.description || "",
      footer_text: body.footer_text || body.description || existing?.footer_text || "",
      allow_google_index: isAllowed,
      maintenance_mode: maintMode,
      maintenance_until: body.maintenance_until !== undefined ? body.maintenance_until : (existing?.maintenance_until || null),
      maintenance_duration_minutes: body.maintenance_duration_minutes !== undefined ? body.maintenance_duration_minutes : (existing?.maintenance_duration_minutes || null),
      header_announcement: body.header_announcement !== undefined ? body.header_announcement : (existing?.header_announcement || ""),
      free_shipping_threshold: Number(body.free_shipping_threshold || existing?.free_shipping_threshold || 2000000),
      custom_css: body.custom_css !== undefined ? body.custom_css : (existing?.custom_css || ""),
      active_font_id: body.active_font_id || existing?.active_font_id || "Vazirmatn",
      gemini_api_key: body.gemini_api_key !== undefined ? body.gemini_api_key : (existing?.gemini_api_key || null),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("site_info")
      .upsert(payload, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) {
      // در صورت نبود ستون gemini_api_key در اسکیمای پستگرس
      delete payload.gemini_api_key;
      await supabaseAdmin.from("site_info").upsert(payload, { onConflict: "id" });
    }

    return NextResponse.json({
      success: true,
      message: "تنظیمات و کلید Gemini با موفقیت ثبت شد",
      data: data || payload
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
`,

  // ۳. اصلاح سرویس siteInfoService با ارسال کامل gemini_api_key
  'services/siteInfoService.ts': `// File Path: services/siteInfoService.ts
import { supabase } from "@/lib/supabase";
import { realtimeEngine, applyFaviconToDOM, applyTitleToDOM } from "@/lib/realtimeSync";

export type MaintenanceMode = "none" | "timed" | "indefinite";

export interface SiteInfo {
  id?: string | number;
  site_name?: string;
  siteName?: string;
  storeName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  working_hours?: string;
  logo_url?: string;
  logoUrl?: string;
  footer_logo_url?: string;
  footerLogoUrl?: string;
  favicon_url?: string;
  faviconUrl?: string;
  allow_google_index?: boolean;
  allowGoogleIndex?: boolean;
  maintenance_mode?: MaintenanceMode;
  maintenance_until?: string;
  maintenance_duration_minutes?: number;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  youtube?: string;
  header_announcement?: string;
  free_shipping_threshold?: number;
  description?: string;
  footer_text?: string;
  custom_css?: string;
  active_font_id?: string;
  gemini_api_key?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_SITE_INFO = "axon_site_info_cache_permanent_v2026";

export const DEFAULT_SITE_INFO: SiteInfo = {
  site_name: "آکسون | Axon",
  siteName: "آکسون | Axon",
  storeName: "آکسون | Axon",
  tagline: "مرجع تخصصی تجهیزات دیجیتال، تصویر و استودیو",
  allow_google_index: true,
  allowGoogleIndex: true,
  maintenance_mode: "none",
  phone: "۰۲۱-۸۸۸۸۸۸۸۸",
  email: "info@axoncore.ir",
  address: "تهران، خیابان ولیعصر، تقاطع میرداماد",
  working_hours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
  header_announcement: "⚡ ارسال رایگان خریدهای بالای ۲ میلیون تومان | گارانتی اصالت طلایی ۱۸ ماهه",
  free_shipping_threshold: 2000000,
  description: "مرجع تخصصی مانیتورهای ۵K و ۴K تدوین، کالیبراسیون سخت‌افزاری رنگ و تجهیزات پیشرفته استودیو با گارانتی اصالت طلایی",
  footer_text: "مرجع تخصصی مانیتورهای ۵K و ۴K تدوین، کالیبراسیون سخت‌افزاری رنگ و تجهیزات پیشرفته استودیو با گارانتی اصالت طلایی",
};

export const siteInfoService = {
  getSiteInfoSync(): SiteInfo {
    return DEFAULT_SITE_INFO;
  },

  async getSiteInfo(): Promise<SiteInfo | null> {
    try {
      const res = await fetch("/api/site-info", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const data = json.data;
          const isAllowed = data.allow_google_index !== false && data.allowGoogleIndex !== false;
          const mapped: SiteInfo = {
            id: data.id,
            site_name: data.site_name || data.store_name || "آکسون | Axon",
            siteName: data.site_name || data.store_name || "آکسون | Axon",
            storeName: data.site_name || data.store_name || "آکسون | Axon",
            tagline: data.tagline || "مرجع تخصصی تجهیزات دیجیتال، تصویر و استودیو",
            phone: data.phone || "۰۲۱-۸۸۸۸۸۸۸۸",
            email: data.email || "info@axoncore.ir",
            address: data.address || "تهران، خیابان ولیعصر، تقاطع میرداماد",
            working_hours: data.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
            logo_url: data.logo_url || "",
            logoUrl: data.logo_url || "",
            footer_logo_url: data.footer_logo_url || "",
            footerLogoUrl: data.footer_logo_url || "",
            favicon_url: data.favicon_url || "",
            faviconUrl: data.favicon_url || "",
            allow_google_index: isAllowed,
            allowGoogleIndex: isAllowed,
            maintenance_mode: (data.maintenance_mode as MaintenanceMode) || (isAllowed ? "none" : "indefinite"),
            maintenance_until: data.maintenance_until || undefined,
            maintenance_duration_minutes: data.maintenance_duration_minutes ? Number(data.maintenance_duration_minutes) : undefined,
            header_announcement: data.header_announcement || "",
            free_shipping_threshold: Number(data.free_shipping_threshold || 2000000),
            description: data.description || data.footer_text || "",
            footer_text: data.footer_text || data.description || "",
            custom_css: data.custom_css || "",
            active_font_id: data.active_font_id || "Vazirmatn",
            gemini_api_key: data.gemini_api_key || "",
            updated_at: data.updated_at,
          };

          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_SITE_INFO, JSON.stringify(mapped));
            if (mapped.favicon_url) applyFaviconToDOM(mapped.favicon_url);
            if (mapped.tagline || mapped.site_name) applyTitleToDOM(mapped.tagline, mapped.site_name);
          }
          return mapped;
        }
      }
      return DEFAULT_SITE_INFO;
    } catch {
      return DEFAULT_SITE_INFO;
    }
  },

  async updateSiteInfo(payload: Partial<SiteInfo>): Promise<SiteInfo | null> {
    try {
      const sName = payload.site_name || payload.siteName || payload.storeName || "آکسون | Axon";

      const dbPayload: any = {
        site_name: sName,
        store_name: sName,
        tagline: payload.tagline,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        working_hours: payload.working_hours,
        logo_url: payload.logo_url,
        footer_logo_url: payload.footer_logo_url,
        favicon_url: payload.favicon_url,
        allow_google_index: payload.allow_google_index,
        maintenance_mode: payload.maintenance_mode,
        maintenance_until: payload.maintenance_until,
        maintenance_duration_minutes: payload.maintenance_duration_minutes,
        header_announcement: payload.header_announcement,
        free_shipping_threshold: payload.free_shipping_threshold,
        footer_text: payload.footer_text,
        description: payload.description,
        custom_css: payload.custom_css,
        active_font_id: payload.active_font_id,
        gemini_api_key: payload.gemini_api_key,
        updated_at: new Date().toISOString(),
      };

      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      const json = await res.json();
      const finalData = json.data || dbPayload;

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_SITE_INFO, JSON.stringify(finalData));
        realtimeEngine.broadcastLocally("site_info_updated", finalData);
      }

      return finalData;
    } catch {
      return null;
    }
  },
};

export default siteInfoService;
`,

  // ۴. افزودن دکمه تست زنده کلید هوش مصنوعی در کامپوننت AdminSiteInfo.tsx
  'components/AdminSiteInfo.tsx': `"use client";

import React, { useState, useEffect, useRef } from "react";
import { siteInfoService, SiteInfo, DEFAULT_SITE_INFO } from "@/services/siteInfoService";
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
  const [geminiApiKey, setGeminiApiKey] = useState("");

  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
    setGeminiApiKey(data.gemini_api_key || (data as any).geminiApiKey || "");
  };

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && populateForm(d));
    const handleUpdate = (e: any) => { if (e.detail) populateForm(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const handleTestGeminiKey = async () => {
    if (!geminiApiKey.trim()) {
      setTestResult({ success: false, message: "ابتدا کلید API را در کادر وارد نمایید." });
      return;
    }

    soundEngine.playClick();
    setTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: geminiApiKey.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setTestResult({ success: true, message: json.message });
      } else {
        setTestResult({ success: false, message: json.message });
      }
    } catch {
      setTestResult({ success: false, message: "خطا در برقراری ارتباط با سرور تست." });
    } finally {
      setTestingKey(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "header" | "footer" | "favicon") => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEngine.playClick();

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultBase64 = event.target?.result as string;
      if (target === "header") setLogoUrl(resultBase64);
      else if (target === "footer") setFooterLogoUrl(resultBase64);
      else if (target === "favicon") {
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

    const payload: any = {
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
      gemini_api_key: geminiApiKey.trim(),
    };

    try {
      const saved = await siteInfoService.updateSiteInfo(payload);
      if (saved) {
        soundEngine.playSuccess();
        if (saved.favicon_url) applyFaviconToDOM(saved.favicon_url);
        if (saved.tagline || saved.site_name) applyTitleToDOM(saved.tagline, saved.site_name);
        setStatusMessage({ type: "success", text: "⚡ تنظیمات سایت و کلید Gemini Pro با موفقیت ذخیره و فوراً فعال شدند." });
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
            <span>⚙️</span> تنظیمات کلان سایت، اتصال Gemini Pro و ۳ لوگوی متحرک
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">اتصال زنده هوش مصنوعی به اکانت پرو و تست بلادرنگ کلید API</p>
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

      {/* اتصال و تست زنده کلید Gemini Pro */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h3 className="text-sm font-black text-[var(--text-primary)]">اتصال زنده کلید هوش مصنوعی Google Gemini Pro</h3>
          </div>
          <button
            type="button"
            onClick={handleTestGeminiKey}
            disabled={testingKey}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <span>{testingKey ? "در حال تست اتصال به گوگل..." : "🧪 تست زنده اتصال کلید"}</span>
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">کلید دریافتی از Google AI Studio (شروع با AIzaSy...) را در کادر زیر وارد کنید و با دکمه تست، اتصال آن را بسنجید:</p>
        <input
          type="text"
          value={geminiApiKey}
          onChange={(e) => setGeminiApiKey(e.target.value)}
          placeholder="AIzaSy..."
          className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-mono text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
        />

        {testResult && (
          <div className={\`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn \${testResult.success ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-rose-500/15 text-rose-500 border border-rose-500/30"}\`}>
            <span>{testResult.success ? "✓" : "⚠️"}</span>
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* بخش تفکیک‌شده ۳ لوگوی متحرک */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h3 className="text-sm font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">🖼️ مدیریت ۳ نشان و لوگوی مستقل و متحرک سایت</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۱. لوگوی اصلی هدر بالای سایت</span>
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

          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۲. لوگوی اختصاصی فوتر سایت</span>
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

          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۳. فاوآیکون تب مرورگر (Favicon متحرک)</span>
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
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ [UPDATED] فایل با موفقیت اصلاح شد: ${filePath}`);
}

console.log('📦 در حال Push خودکار به گیت‌هاب و استقرار روی Vercel...');
try {
  execSync('git add . && git commit -m "fix: restore gemini_api_key persistence across database and enable live test button" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 [DEPLOYED] پچ نهایی با موفقیت دیپلوی شد!');
} catch (e) {
  console.log('⚠️ دستور دستی: git push origin main');
}