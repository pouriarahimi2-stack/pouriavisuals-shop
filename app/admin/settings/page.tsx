// File Path: app/admin/settings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import MediaUploadModal from "@/components/admin/MediaUploadModal";
import { applyFaviconToDOM } from "@/lib/realtimeSync";

interface SystemSettingsFormState {
  // ۱. حالت تعمیرات و ربات‌های جستجو
  maintenanceMode: boolean;
  maintenanceAdminBypass: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceEndTime: string;
  noIndex: boolean;
  disallowRobots: boolean;

  // ۲. هویت بصری، آیکون‌ها، لوگوها و خرده‌ریزها
  logo_url: string;
  footer_logo_url: string;
  favicon_url: string;
  apple_touch_icon_url: string;
  og_image_url: string;
  header_announcement: string;
  header_announcement_enabled: boolean;
  footer_text: string;

  // ۳. سئو، متاتگ‌ها و کدهای تاییدیه
  site_name: string;
  tagline: string;
  description: string;
  meta_description: string;
  metaKeywords: string;
  canonicalBaseUrl: string;
  googleSiteVerification: string;
  enamadCode: string;

  // ۴. لجستیک، هزینه‌های ارسال، مالیات و سبد خرید
  postShippingCost: string;
  tipaxShippingCost: string;
  defaultShippingCost: string;
  freeShippingThreshold: string;
  vatPercent: string;
  currencyLabel: string;
  allowGuestCheckout: boolean;
  autoSendOrderSms: boolean;
  codEnabled: boolean;
  supportCardNumber: string;
  supportCardHolder: string;

  // ۵. اطلاعات تماس، پشتیبانی و شبکه‌های اجتماعی
  phone: string;
  mobile_support: string;
  email: string;
  working_hours: string;
  address: string;
  postal_code: string;
  instagram_url: string;
  telegram_url: string;
  whatsapp_url: string;
  youtube_url: string;
  aparat_url: string;
  floatingChatEnabled: boolean;
}

type SettingsTab =
  | "all"
  | "maintenance_robots"
  | "icons_branding"
  | "seo_identity"
  | "shipping_checkout"
  | "contact_socials";

export default function AdminGlobalSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("all");
  const [form, setForm] = useState<SystemSettingsFormState>({
    maintenanceMode: false,
    maintenanceAdminBypass: true,
    maintenanceTitle: "بروزرسانی زیرساخت فنی آکسون کور",
    maintenanceMessage:
      "فروشگاه آکسون در حال بروزرسانی زیرساخت‌های فنی است. به زودی باز می‌گردیم.",
    maintenanceEndTime: "",
    noIndex: false,
    disallowRobots: false,

    logo_url: "",
    footer_logo_url: "",
    favicon_url: "/favicon.ico",
    apple_touch_icon_url: "/favicon.ico",
    og_image_url: "",
    header_announcement: "",
    header_announcement_enabled: true,
    footer_text:
      "تمامی حقوق مادی و معنوی این وب‌سایت متعلق به فروشگاه آکسون کور (Axon Core) می‌باشد.",

    site_name: "آکسون کور | Axon Core",
    tagline: "مرجع تخصصی تجهیزات تکنولوژی و کالای دیجیتال",
    description: "",
    meta_description: "",
    metaKeywords:
      "آکسون کور, خرید آیفون, لوازم جانبی اپل, کالای دیجیتال, گجت هوشمند",
    canonicalBaseUrl: "https://axoncore.ir",
    googleSiteVerification: "",
    enamadCode: "",

    postShippingCost: "120000",
    tipaxShippingCost: "150000",
    defaultShippingCost: "0",
    freeShippingThreshold: "0",
    vatPercent: "10",
    currencyLabel: "تومان",
    allowGuestCheckout: true,
    autoSendOrderSms: true,
    codEnabled: false,
    supportCardNumber: "",
    supportCardHolder: "",

    phone: "",
    mobile_support: "",
    email: "",
    working_hours: "شنبه تا پنج‌شنبه — ساعت ۹ الی ۲۱",
    address: "",
    postal_code: "",
    instagram_url: "",
    telegram_url: "",
    whatsapp_url: "",
    youtube_url: "",
    aparat_url: "",
    floatingChatEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [uploadTargetField, setUploadTargetField] = useState<
    | null
    | "favicon_url"
    | "apple_touch_icon_url"
    | "logo_url"
    | "footer_logo_url"
    | "og_image_url"
  >(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings?t=" + Date.now(), {
        cache: "no-store",
      });
      const json = await res.json();
      const s = json.settings || json.system_settings || {};
      const seo = json.seo_identity || {};

      setForm({
        maintenanceMode: Boolean(s.maintenanceMode ?? false),
        maintenanceAdminBypass: Boolean(s.maintenanceAdminBypass ?? true),
        maintenanceTitle: String(
          s.maintenanceTitle || "بروزرسانی زیرساخت فنی آکسون کور"
        ),
        maintenanceMessage: String(
          s.maintenanceMessage ??
            "فروشگاه آکسون در حال بروزرسانی زیرساخت‌های فنی است. به زودی باز می‌گردیم."
        ),
        maintenanceEndTime: String(s.maintenanceEndTime || ""),
        noIndex: Boolean(s.noIndex ?? false),
        disallowRobots: Boolean(s.disallowRobots ?? s.noIndex ?? false),

        logo_url: String(s.logo_url || ""),
        footer_logo_url: String(s.footer_logo_url || ""),
        favicon_url: String(s.favicon_url || "/favicon.ico"),
        apple_touch_icon_url: String(
          s.apple_touch_icon_url || s.favicon_url || "/favicon.ico"
        ),
        og_image_url: String(s.og_image_url || ""),
        header_announcement: String(s.header_announcement || ""),
        header_announcement_enabled: Boolean(
          s.header_announcement_enabled ?? true
        ),
        footer_text: String(
          s.footer_text ||
            "تمامی حقوق مادی و معنوی این وب‌سایت متعلق به فروشگاه آکسون کور (Axon Core) می‌باشد."
        ),

        site_name: String(seo.site_name || s.site_name || ""),
        tagline: String(seo.tagline || s.tagline || ""),
        description: String(seo.description || s.description || ""),
        meta_description: String(
          seo.meta_description || s.meta_description || ""
        ),
        metaKeywords: String(seo.meta_keywords || s.metaKeywords || ""),
        canonicalBaseUrl: String(
          seo.canonicalBaseUrl || s.canonicalBaseUrl || "https://axoncore.ir"
        ),
        googleSiteVerification: String(
          seo.googleSiteVerification || s.googleSiteVerification || ""
        ),
        enamadCode: String(seo.enamadCode || s.enamadCode || ""),

        postShippingCost: String(s.postShippingCost ?? 120000),
        tipaxShippingCost: String(s.tipaxShippingCost ?? 150000),
        defaultShippingCost: String(s.defaultShippingCost ?? 0),
        freeShippingThreshold: String(s.freeShippingThreshold ?? 0),
        vatPercent: String(s.vatPercent ?? 10),
        currencyLabel: String(s.currencyLabel || "تومان"),
        allowGuestCheckout: Boolean(s.allowGuestCheckout ?? true),
        autoSendOrderSms: Boolean(s.autoSendOrderSms ?? true),
        codEnabled: Boolean(s.codEnabled ?? false),
        supportCardNumber: String(s.supportCardNumber || ""),
        supportCardHolder: String(s.supportCardHolder || ""),

        phone: String(s.phone || ""),
        mobile_support: String(s.mobile_support || ""),
        email: String(s.email || ""),
        working_hours: String(
          s.working_hours || "شنبه تا پنج‌شنبه — ساعت ۹ الی ۲۱"
        ),
        address: String(s.address || ""),
        postal_code: String(s.postal_code || ""),
        instagram_url: String(s.instagram_url || ""),
        telegram_url: String(s.telegram_url || ""),
        whatsapp_url: String(s.whatsapp_url || ""),
        youtube_url: String(s.youtube_url || ""),
        aparat_url: String(s.aparat_url || ""),
        floatingChatEnabled: Boolean(s.floatingChatEnabled ?? true),
      });
    } catch {
      setFeedback({ type: "err", text: "خطا در بارگذاری تنظیمات کلان سیستم." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const toNum = (v: string) =>
    Number(
      String(v)
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/,/g, "")
        .trim() || 0
    );

  const persistSettings = async (nextState: SystemSettingsFormState) => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        ...nextState,
        defaultShippingCost: toNum(nextState.defaultShippingCost),
        postShippingCost: toNum(nextState.postShippingCost),
        tipaxShippingCost: toNum(nextState.tipaxShippingCost),
        freeShippingThreshold: toNum(nextState.freeShippingThreshold),
        vatPercent: toNum(nextState.vatPercent),
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        if (nextState.favicon_url) {
          applyFaviconToDOM(nextState.favicon_url);
        }
        window.dispatchEvent(new CustomEvent("site_info_updated"));
        window.dispatchEvent(new CustomEvent("theme_builder_updated"));
        setFeedback({
          type: "ok",
          text:
            json.message ||
            "✓ تمامی تنظیمات کلان، آیکون‌ها، تگ‌های سئو و قوانین لجستیک ذخیره و در کل سایت اعمال شد.",
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({
          type: "err",
          text: json.message || "خطا در ذخیره تنظیمات کلان.",
        });
      }
    } catch {
      setFeedback({ type: "err", text: "خطا در ارتباط با سرور." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    await persistSettings(form);
  };

  const inputCls =
    "w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)] text-xs text-[var(--text-primary)]";
  const monoInputCls =
    "w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none focus:border-[var(--accent-blue)] text-xs text-[var(--text-primary)]";
  const labelCls =
    "block font-bold mb-1.5 text-[var(--text-secondary)] text-xs";

  const showSection = (sec: SettingsTab) =>
    activeTab === "all" || activeTab === sec;

  return (
    <form
      onSubmit={handleSaveSubmit}
      className="space-y-6 font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      {/* هدر اصلی و دکمه ذخیره سراسری */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> مرکز تنظیمات کلان سایت، حالت تعمیرات، آیکون‌ها و سئو تکنیکال
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            مدیریت ۱۰۰٪ یکپارچه حالت تعمیرات، ایندکس موتورهای جستجو، فاوآیکون و لوگوها، هزینه‌های پست/تیپاکس و اطلاعات تماس سراسری
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              loadSettings();
            }}
            className="px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold cursor-pointer transition"
          >
            🔄 بازخوانی
          </button>
          <button
            type="submit"
            disabled={saving || loading}
            className="flex-1 lg:flex-initial px-6 py-3 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white text-xs font-black shadow-xl cursor-pointer disabled:opacity-50 transition"
          >
            {saving
              ? "در حال ذخیره در دیتابیس..."
              : "💾 ذخیره و اعمال فوری تنظیمات در کل سایت"}
          </button>
        </div>
      </div>

      {/* کارت‌های وضعیت زنده (KPI Summary) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div
          className={
            "p-4 rounded-3xl border shadow-md flex items-center justify-between " +
            (form.maintenanceMode
              ? "bg-rose-500/10 border-rose-500/40"
              : "bg-[var(--modal-bg)] border-[var(--card-border)]")
          }
        >
          <span className="font-bold text-[var(--text-secondary)]">
            وضعیت فروشگاه:
          </span>
          <span
            className={
              "font-black px-2.5 py-1 rounded-xl " +
              (form.maintenanceMode
                ? "bg-rose-500/20 text-rose-400"
                : "bg-emerald-500/15 text-emerald-400")
            }
          >
            {form.maintenanceMode ? "🚧 روی حالت تعمیرات" : "🟢 فعال و آنلاین"}
          </span>
        </div>

        <div
          className={
            "p-4 rounded-3xl border shadow-md flex items-center justify-between " +
            (form.noIndex
              ? "bg-amber-500/10 border-amber-500/40"
              : "bg-[var(--modal-bg)] border-[var(--card-border)]")
          }
        >
          <span className="font-bold text-[var(--text-secondary)]">
            ربات‌های گوگل (Index):
          </span>
          <span
            className={
              "font-black px-2.5 py-1 rounded-xl " +
              (form.noIndex
                ? "bg-amber-500/20 text-amber-400"
                : "bg-emerald-500/15 text-emerald-400")
            }
          >
            {form.noIndex ? "🕵️‍♂️ مخفی (No-Index)" : "✅ باز برای گوگل"}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md flex items-center justify-between">
          <span className="font-bold text-[var(--text-secondary)]">
            پست پیشتاز / تیپاکس:
          </span>
          <span className="font-mono font-black text-[var(--accent-blue)]">
            {toNum(form.postShippingCost).toLocaleString("fa-IR")} /{" "}
            {toNum(form.tipaxShippingCost).toLocaleString("fa-IR")}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md flex items-center justify-between">
          <span className="font-bold text-[var(--text-secondary)]">
            ارسال رایگان بالای:
          </span>
          <span className="font-mono font-black text-indigo-400">
            {toNum(form.freeShippingThreshold) > 0
              ? `${toNum(form.freeShippingThreshold).toLocaleString("fa-IR")} ${
                  form.currencyLabel
                }`
              : "غیرفعال (۰)"}
          </span>
        </div>
      </div>

      {/* نوار تب‌های فیلتر سریع بخش‌ها */}
      <div className="flex flex-wrap gap-2 p-2 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-black">
        {[
          { id: "all", label: "📋 نمایش یکجای تمام بخش‌ها" },
          {
            id: "maintenance_robots",
            label: "۱. 🚧 حالت تعمیرات و مخفی‌سازی از گوگل",
          },
          {
            id: "icons_branding",
            label: "۲. 🎨 آیکون‌ها، لوگوها و خرده‌ریزها",
          },
          { id: "seo_identity", label: "۳. 🔍 هویت سئو و تگ‌های گوگل" },
          {
            id: "shipping_checkout",
            label: "۴. 🚚 هزینه‌های ارسال، مالیات و سبد خرید",
          },
          {
            id: "contact_socials",
            label: "۵. 📞 اطلاعات تماس و شبکه‌های اجتماعی",
          },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab(t.id as SettingsTab);
            }}
            className={
              "px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (activeTab === t.id
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (feedback.type === "ok"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-400")
          }
        >
          {feedback.text}
        </div>
      )}

      {/* ─── بخش ۱: حالت تعمیرات سایت و مخفی‌سازی از موتورهای جستجو ─── */}
      {showSection("maintenance_robots") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* کارت حالت تعمیرات */}
          <div
            className={
              "lg:col-span-6 p-6 rounded-3xl border shadow-xl space-y-4 text-xs transition " +
              (form.maintenanceMode
                ? "bg-rose-500/10 border-rose-500/40"
                : "bg-[var(--modal-bg)] border-[var(--card-border)]")
            }
          >
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div>
                <h2 className="font-black text-sm text-rose-400 flex items-center gap-2">
                  <span>🚧</span> استودیوی حالت تعمیرات سایت (Maintenance Mode)
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  هدایت موقت کاربران به صفحه تعمیرات هنگام بروزرسانی فنی فروشگاه
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.maintenanceMode}
                  onChange={(e) => {
                    soundEngine.playClick();
                    setForm({ ...form, maintenanceMode: e.target.checked });
                  }}
                  className="w-5 h-5 accent-rose-500 cursor-pointer"
                />
                <span className="font-black text-rose-400">
                  {form.maintenanceMode ? "فعال" : "غیرفعال"}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>عنوان صفحه تعمیرات:</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.maintenanceTitle}
                  onChange={(e) =>
                    setForm({ ...form, maintenanceTitle: e.target.value })
                  }
                  placeholder="بروزرسانی زیرساخت فنی آکسون کور"
                />
              </div>
              <div>
                <label className={labelCls}>
                  زمان/ساعت تقریبی بازگشایی (اختیاری):
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.maintenanceEndTime}
                  onChange={(e) =>
                    setForm({ ...form, maintenanceEndTime: e.target.value })
                  }
                  placeholder="مثال: امشب ساعت ۲۳:۰۰"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>متن پیام نمایشی به مراجعین:</label>
              <textarea
                rows={2}
                className={inputCls + " resize-none leading-relaxed"}
                value={form.maintenanceMessage}
                onChange={(e) =>
                  setForm({ ...form, maintenanceMessage: e.target.value })
                }
                placeholder="فروشگاه در حال بروزرسانی است..."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.maintenanceAdminBypass}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maintenanceAdminBypass: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
                <span>
                  اجازه مشاهده زنده فروشگاه به مدیر ارشد در حین تعمیرات (Admin Bypass)
                </span>
              </label>

              <Link
                href="/maintenance"
                target="_blank"
                className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-rose-400 text-rose-400 font-black transition"
              >
                👁️ پیش‌نمایش صفحه تعمیرات ↗
              </Link>
            </div>
          </div>

          {/* کارت پنهان کردن سایت از دید موتورهای جستجو */}
          <div
            className={
              "lg:col-span-6 p-6 rounded-3xl border shadow-xl space-y-4 text-xs transition " +
              (form.noIndex
                ? "bg-amber-500/10 border-amber-500/40"
                : "bg-[var(--modal-bg)] border-[var(--card-border)]")
            }
          >
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div>
                <h2 className="font-black text-sm text-amber-400 flex items-center gap-2">
                  <span>🕵️‍♂️</span> پنهان کردن سایت از موتورهای جستجو (No-Index & Robots)
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  کنترل مستقیم متاتگ robots و خروجی زنده فایل /robots.txt
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.noIndex}
                  onChange={(e) => {
                    soundEngine.playClick();
                    setForm({
                      ...form,
                      noIndex: e.target.checked,
                      disallowRobots: e.target.checked,
                    });
                  }}
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                />
                <span className="font-black text-amber-400">
                  {form.noIndex ? "مخفی (No-Index)" : "باز برای گوگل"}
                </span>
              </label>
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              با فعال کردن این گزینه، تگ{" "}
              <code className="font-mono text-amber-400">
                &lt;meta name=&quot;robots&quot; content=&quot;noindex, nofollow&quot;&gt;
              </code>{" "}
              در تمام صفحات قرار می‌گیرد و فایل{" "}
              <code className="font-mono text-amber-400">/robots.txt</code> به صورت
              خودکار روی <code className="font-mono">Disallow: /</code> تنظیم می‌شود تا
              سایت از دید خزنده‌های گوگل پنهان بماند.
            </p>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-[var(--text-secondary)]">
                  وضعیت متاتگ هدر صفحات:
                </span>
                <span
                  className={
                    form.noIndex
                      ? "text-amber-400 font-black"
                      : "text-emerald-400 font-black"
                  }
                >
                  {form.noIndex ? "noindex, nofollow ⛔" : "index, follow ✅"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-[var(--text-secondary)]">
                  قانون فعلی در /robots.txt:
                </span>
                <span
                  className={
                    form.noIndex
                      ? "text-amber-400 font-black"
                      : "text-emerald-400 font-black"
                  }
                >
                  {form.noIndex ? "User-agent: * / Disallow: /" : "Allow: /"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--accent-blue)] font-bold"
              >
                🤖 مشاهده زنده /robots.txt ↗
              </a>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-emerald-500 text-emerald-400 font-bold"
              >
                🗺️ مشاهده /sitemap.xml ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── بخش ۲: آیکون‌ها، لوگوها، نوار اعلان هدر و کپی‌رایت فوتر ─── */}
      {showSection("icons_branding") && (
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <div className="border-b border-[var(--card-border)] pb-3">
            <h2 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2">
              <span>🎨</span> مدیریت آیکون‌ها (Favicon / PWA)، لوگوها و خرده‌ریزهای هدر و فوتر
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              تغییر مستقیم آیکون تب مرورگر، لوگوی هدر، لوگوی فوتر، متن نوار اعلان بالای سایت و متن کپی‌رایت با قابلیت آپلود مستقیم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* فاوآیکون تب مرورگر */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-black text-[var(--accent-blue)]">
                  🌟 آیکون تب مرورگر (Favicon):
                </label>
                {form.favicon_url && (
                  <img
                    src={form.favicon_url}
                    alt="Favicon"
                    className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1 border border-[var(--card-border)]"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={form.favicon_url}
                  onChange={(e) =>
                    setForm({ ...form, favicon_url: e.target.value })
                  }
                  placeholder="/favicon.ico"
                  className={monoInputCls}
                />
                <button
                  type="button"
                  onClick={() => setUploadTargetField("favicon_url")}
                  className="px-3.5 py-2 rounded-2xl bg-[var(--accent-blue)] text-white font-black shrink-0 cursor-pointer"
                >
                  ☁️ آپلود
                </button>
              </div>
            </div>

            {/* لوگوی اصلی هدر */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-black text-[var(--accent-blue)]">
                  🖼️ لوگوی اصلی هدر سایت (logo_url):
                </label>
                {form.logo_url && (
                  <img
                    src={form.logo_url}
                    alt="Header Logo"
                    className="w-10 h-8 rounded-lg object-contain bg-white/10 p-1 border border-[var(--card-border)]"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={form.logo_url}
                  onChange={(e) =>
                    setForm({ ...form, logo_url: e.target.value })
                  }
                  placeholder="https://..."
                  className={monoInputCls}
                />
                <button
                  type="button"
                  onClick={() => setUploadTargetField("logo_url")}
                  className="px-3.5 py-2 rounded-2xl bg-[var(--accent-blue)] text-white font-black shrink-0 cursor-pointer"
                >
                  ☁️ آپلود
                </button>
              </div>
            </div>

            {/* لوگوی فوتر */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-black text-[var(--accent-blue)]">
                  🏛️ لوگوی فوتر سایت (footer_logo_url):
                </label>
                {form.footer_logo_url && (
                  <img
                    src={form.footer_logo_url}
                    alt="Footer Logo"
                    className="w-10 h-8 rounded-lg object-contain bg-white/10 p-1 border border-[var(--card-border)]"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={form.footer_logo_url}
                  onChange={(e) =>
                    setForm({ ...form, footer_logo_url: e.target.value })
                  }
                  placeholder="https://..."
                  className={monoInputCls}
                />
                <button
                  type="button"
                  onClick={() => setUploadTargetField("footer_logo_url")}
                  className="px-3.5 py-2 rounded-2xl bg-[var(--accent-blue)] text-white font-black shrink-0 cursor-pointer"
                >
                  ☁️ آپلود
                </button>
              </div>
            </div>

            {/* آیکون موبایل و PWA */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-black text-emerald-400">
                  📱 آیکون اپلیکیشن موبایل (Apple Touch / PWA):
                </label>
                {form.apple_touch_icon_url && (
                  <img
                    src={form.apple_touch_icon_url}
                    alt="Touch Icon"
                    className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1 border border-[var(--card-border)]"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={form.apple_touch_icon_url}
                  onChange={(e) =>
                    setForm({ ...form, apple_touch_icon_url: e.target.value })
                  }
                  placeholder="/favicon.ico"
                  className={monoInputCls}
                />
                <button
                  type="button"
                  onClick={() => setUploadTargetField("apple_touch_icon_url")}
                  className="px-3.5 py-2 rounded-2xl bg-emerald-600 text-white font-black shrink-0 cursor-pointer"
                >
                  ☁️ آپلود
                </button>
              </div>
            </div>

            {/* تصویر اشتراک‌گذاری OpenGraph */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-black text-indigo-400">
                  🌐 تصویر پیش‌نمایش لینک سایت در تلگرام و واتساپ (OpenGraph Image):
                </label>
                {form.og_image_url && (
                  <img
                    src={form.og_image_url}
                    alt="OG Preview"
                    className="w-12 h-8 rounded-lg object-cover border border-[var(--card-border)]"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={form.og_image_url}
                  onChange={(e) =>
                    setForm({ ...form, og_image_url: e.target.value })
                  }
                  placeholder="https://axoncore.ir/og-banner.jpg"
                  className={monoInputCls}
                />
                <button
                  type="button"
                  onClick={() => setUploadTargetField("og_image_url")}
                  className="px-4 py-2 rounded-2xl bg-indigo-600 text-white font-black shrink-0 cursor-pointer"
                >
                  ☁️ آپلود
                </button>
              </div>
            </div>
          </div>

          {/* نوار اعلان بالای سایت و متن کپی‌رایت فوتر */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-[var(--text-secondary)]">
                  📢 متن نوار اعلان بالای هدر سایت (Announcement Bar):
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-emerald-400">
                  <input
                    type="checkbox"
                    checked={form.header_announcement_enabled}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        header_announcement_enabled: e.target.checked,
                      })
                    }
                    className="accent-emerald-500 cursor-pointer"
                  />
                  <span>نمایش نوار اعلان</span>
                </label>
              </div>
              <input
                type="text"
                className={inputCls}
                value={form.header_announcement}
                onChange={(e) =>
                  setForm({ ...form, header_announcement: e.target.value })
                }
                placeholder="مثال: 🔥 ارسال رایگان سفارشات بالای ۵ میلیون تومان به سراسر کشور"
              />
            </div>

            <div>
              <label className={labelCls}>
                ©️ متن کپی‌رایت پایین فوتر (footer_text):
              </label>
              <input
                type="text"
                className={inputCls}
                value={form.footer_text}
                onChange={(e) =>
                  setForm({ ...form, footer_text: e.target.value })
                }
                placeholder="تمامی حقوق مادی و معنوی متعلق به آکسون کور می‌باشد."
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── بخش ۳: هویت سئو، تگ‌های گوگل و نماد اعتماد ─── */}
      {showSection("seo_identity") && (
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h2 className="font-black text-sm text-emerald-400 border-b border-[var(--card-border)] pb-3">
            🔍 هویت سئو، متاتگ‌های گوگل و کدهای تاییدیه (SEO & Verification Tags)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>نام سایت / برند (site_name):</label>
              <input
                className={inputCls}
                value={form.site_name}
                onChange={(e) =>
                  setForm({ ...form, site_name: e.target.value })
                }
                placeholder="آکسون کور | Axon Core"
              />
            </div>
            <div>
              <label className={labelCls}>
                شعار / تگ‌لاین تب مرورگر (tagline):
              </label>
              <input
                className={inputCls}
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="مرجع تخصصی تجهیزات تکنولوژی و کالای دیجیتال"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                توضیحات کلی برند در فوتر و درباره ما (description):
              </label>
              <textarea
                rows={2}
                className={inputCls + " resize-none"}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="توضیح کوتاه معرفی فروشگاه..."
              />
            </div>

            <div>
              <label className={labelCls}>
                متا دسکریپشن گوگل (meta_description — حداکثر ۱۵۰ کاراکتر):
              </label>
              <textarea
                rows={2}
                className={inputCls + " resize-none"}
                value={form.meta_description}
                onChange={(e) =>
                  setForm({ ...form, meta_description: e.target.value })
                }
                placeholder="خرید محصولات تکنولوژی، گوشی، لپ‌تاپ و لوازم جانبی با ضمانت اصالت کالا از آکسون کور"
              />
              <p
                className={
                  "text-[10px] mt-1 font-mono " +
                  (form.meta_description.length > 150
                    ? "text-rose-400 font-bold"
                    : "text-[var(--text-secondary)]")
                }
              >
                {form.meta_description.length} / 150 کاراکتر
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>
                کلمات کلیدی پایه سایت (با ویرگول جدا کنید):
              </label>
              <input
                type="text"
                className={inputCls}
                value={form.metaKeywords}
                onChange={(e) =>
                  setForm({ ...form, metaKeywords: e.target.value })
                }
                placeholder="آکسون کور, خرید آیفون, لوازم جانبی اپل, کالای دیجیتال"
              />
            </div>

            <div>
              <label className={labelCls}>
                دامنه اصلی کانونیکال (Canonical URL):
              </label>
              <input
                type="text"
                dir="ltr"
                className={monoInputCls}
                value={form.canonicalBaseUrl}
                onChange={(e) =>
                  setForm({ ...form, canonicalBaseUrl: e.target.value })
                }
                placeholder="https://axoncore.ir"
              />
            </div>

            <div>
              <label className={labelCls}>
                کد تایید سرچ کنسول گوگل (Google Verification):
              </label>
              <input
                type="text"
                dir="ltr"
                className={monoInputCls}
                value={form.googleSiteVerification}
                onChange={(e) =>
                  setForm({ ...form, googleSiteVerification: e.target.value })
                }
                placeholder="کد متاتگ google-site-verification"
              />
            </div>
          </div>

          {/* پیش‌نمایش زنده نتیجه گوگل */}
          {(form.site_name || form.tagline) && (
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-emerald-500/30 space-y-1.5">
              <p className="text-[10px] text-emerald-400 font-black">
                🔎 پیش‌نمایش زنده نمایش سایت شما در نتایج جستجوی گوگل (SERP):
              </p>
              <p className="text-sky-400 font-black text-sm truncate">
                {[form.site_name, form.tagline].filter(Boolean).join(" | ")}
              </p>
              <p className="text-emerald-500 font-mono text-[11px]" dir="ltr">
                {form.canonicalBaseUrl || "https://axoncore.ir"}
              </p>
              {(form.meta_description || form.description) && (
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed line-clamp-2">
                  {form.meta_description || form.description}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── بخش ۴: قوانین لجستیک، هزینه‌های ارسال، مالیات و سبد خرید ─── */}
      {showSection("shipping_checkout") && (
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            🚚 تنظیمات هزینه‌های ارسال (پست / تیپاکس / پیک)، مالیات و قوانین تسویه‌حساب
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className={labelCls}>هزینه ارسال پست پیشتاز (تومان):</label>
              <input
                type="text"
                dir="ltr"
                value={form.postShippingCost}
                onChange={(e) =>
                  setForm({ ...form, postShippingCost: e.target.value })
                }
                className={monoInputCls}
              />
            </div>

            <div>
              <label className={labelCls}>هزینه ارسال تیپاکس (تومان):</label>
              <input
                type="text"
                dir="ltr"
                value={form.tipaxShippingCost}
                onChange={(e) =>
                  setForm({ ...form, tipaxShippingCost: e.target.value })
                }
                className={monoInputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                هزینه ارسال پایه / پیک شهری (تومان):
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.defaultShippingCost}
                onChange={(e) =>
                  setForm({ ...form, defaultShippingCost: e.target.value })
                }
                className={monoInputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                سقف خرید برای ارسال رایگان (۰ = غیرفعال):
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.freeShippingThreshold}
                onChange={(e) =>
                  setForm({ ...form, freeShippingThreshold: e.target.value })
                }
                className={monoInputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                مالیات بر ارزش افزوده (درصد VAT):
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.vatPercent}
                onChange={(e) =>
                  setForm({ ...form, vatPercent: e.target.value })
                }
                className={monoInputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <label className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between cursor-pointer">
              <span className="font-bold">
                🛒 امکان ثبت سفارش مهمان (بدون ثبت‌نام قبلی)
              </span>
              <input
                type="checkbox"
                checked={form.allowGuestCheckout}
                onChange={(e) =>
                  setForm({ ...form, allowGuestCheckout: e.target.checked })
                }
                className="w-4 h-4 accent-[var(--accent-blue)] cursor-pointer"
              />
            </label>

            <label className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between cursor-pointer">
              <span className="font-bold">
                📲 ارسال خودکار پیامک تایید ثبت سفارش
              </span>
              <input
                type="checkbox"
                checked={form.autoSendOrderSms}
                onChange={(e) =>
                  setForm({ ...form, autoSendOrderSms: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </label>

            <label className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between cursor-pointer">
              <span className="font-bold">
                💵 فعال‌سازی پرداخت در محل / کارت‌به‌کارت
              </span>
              <input
                type="checkbox"
                checked={form.codEnabled}
                onChange={(e) =>
                  setForm({ ...form, codEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>
                شماره کارت رسمی جهت کارت‌به‌کارت (اختیاری):
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.supportCardNumber}
                onChange={(e) =>
                  setForm({ ...form, supportCardNumber: e.target.value })
                }
                placeholder="6037-XXXX-XXXX-XXXX"
                className={monoInputCls}
              />
            </div>
            <div>
              <label className={labelCls}>نام صاحب حساب / کارت:</label>
              <input
                type="text"
                value={form.supportCardHolder}
                onChange={(e) =>
                  setForm({ ...form, supportCardHolder: e.target.value })
                }
                placeholder="فروشگاه آکسون کور"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>عنوان واحد پول نمایشی سایت:</label>
              <input
                type="text"
                value={form.currencyLabel}
                onChange={(e) =>
                  setForm({ ...form, currencyLabel: e.target.value })
                }
                placeholder="تومان"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── بخش ۵: اطلاعات تماس، پشتیبانی و شبکه‌های اجتماعی سراسری ─── */}
      {showSection("contact_socials") && (
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
            <div>
              <h2 className="font-black text-sm text-indigo-400">
                📞 اطلاعات تماس، پشتیبانی و شبکه‌های اجتماعی سراسری
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                این اطلاعات به طور خودکار در فوتر، صفحه تماس با ما و صفحه حالت تعمیرات همگام می‌شوند
              </p>
            </div>
            <label className="flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={form.floatingChatEnabled}
                onChange={(e) =>
                  setForm({ ...form, floatingChatEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
              <span>نمایش ویجت شناور گفتگوی آنلاین در سایت</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>شماره تلفن پشتیبانی (phone):</label>
              <input
                type="text"
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="021-XXXXXXXX"
                className={monoInputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                شماره موبایل / واتساپ پشتیبانی:
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.mobile_support}
                onChange={(e) =>
                  setForm({ ...form, mobile_support: e.target.value })
                }
                placeholder="0912XXXXXXX"
                className={monoInputCls}
              />
            </div>

            <div>
              <label className={labelCls}>ایمیل رسمی پشتیبانی (email):</label>
              <input
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@axoncore.ir"
                className={monoInputCls}
              />
            </div>

            <div>
              <label className={labelCls}>ساعات پاسخگویی (working_hours):</label>
              <input
                type="text"
                value={form.working_hours}
                onChange={(e) =>
                  setForm({ ...form, working_hours: e.target.value })
                }
                placeholder="شنبه تا پنج‌شنبه — ۹ الی ۲۱"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>آدرس دفتر / فروشگاه (address):</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="تهران، خیابان..."
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>کد پستی (postal_code):</label>
              <input
                type="text"
                dir="ltr"
                value={form.postal_code}
                onChange={(e) =>
                  setForm({ ...form, postal_code: e.target.value })
                }
                placeholder="1234567890"
                className={monoInputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>📸 لینک اینستاگرام:</label>
              <input
                type="text"
                dir="ltr"
                value={form.instagram_url}
                onChange={(e) =>
                  setForm({ ...form, instagram_url: e.target.value })
                }
                placeholder="https://instagram.com/..."
                className={monoInputCls}
              />
            </div>

            <div>
              <label className={labelCls}>✈️ لینک تلگرام پشتیبانی:</label>
              <input
                type="text"
                dir="ltr"
                value={form.telegram_url}
                onChange={(e) =>
                  setForm({ ...form, telegram_url: e.target.value })
                }
                placeholder="https://t.me/..."
                className={monoInputCls}
              />
            </div>

            <div>
              <label className={labelCls}>💬 لینک واتساپ:</label>
              <input
                type="text"
                dir="ltr"
                value={form.whatsapp_url}
                onChange={(e) =>
                  setForm({ ...form, whatsapp_url: e.target.value })
                }
                placeholder="https://wa.me/989..."
                className={monoInputCls}
              />
            </div>

            <div>
              <label className={labelCls}>▶️ لینک کانال یوتیوب / آپارات:</label>
              <input
                type="text"
                dir="ltr"
                value={form.youtube_url}
                onChange={(e) =>
                  setForm({ ...form, youtube_url: e.target.value })
                }
                placeholder="https://youtube.com/..."
                className={monoInputCls}
              />
            </div>
          </div>
        </div>
      )}

      {/* دکمه ذخیره پایانی */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || loading}
          className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white text-xs font-black shadow-2xl cursor-pointer disabled:opacity-50 transition"
        >
          {saving
            ? "در حال ذخیره در دیتابیس..."
            : "💾 ذخیره و اعمال سراسری تمامی تنظیمات کلان سیستم"}
        </button>
      </div>

      <MediaUploadModal
        isOpen={Boolean(uploadTargetField)}
        bucket="banners"
        title="آپلود مستقیم آیکون / لوگوی سایت"
        currentValue={uploadTargetField ? form[uploadTargetField] : ""}
        onClose={() => setUploadTargetField(null)}
        onUploadSuccess={(url) => {
          if (uploadTargetField) {
            setForm((prev) => ({ ...prev, [uploadTargetField]: url }));
          }
          setUploadTargetField(null);
        }}
      />
    </form>
  );
}