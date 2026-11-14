// File Path: app/contact/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Phone,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  MessageCircle,
  Mail,
  Headphones,
} from "lucide-react";
import { siteInfoService } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";

export default function ContactPage() {
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInfo = () => {
      siteInfoService.getSiteInfo().then((d) => {
        if (d) setSiteInfo(d);
      });
    };
    loadInfo();
    window.addEventListener("site_info_updated", loadInfo);
    return () => window.removeEventListener("site_info_updated", loadInfo);
  }, []);

  const storeName = siteInfo?.storeName || siteInfo?.site_name || "آکسون کور";
  const storePhone = siteInfo?.phone || "09376110200";
  const storeEmail = siteInfo?.email || "info@axoncore.ir";
  const storeAddr = siteInfo?.address || "شیراز، خیابان ستارخان";
  const storeHours = siteInfo?.working_hours || "شنبه تا چهارشنبه ۹ الی ۱۸";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, phone, subject, message }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.success !== false) {
        soundEngine.playSuccess();
        setSent(true);
      } else {
        setError(d.message || "خطا در ارسال پیام. لطفاً مجدداً تلاش کنید.");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenLiveChat = () => {
    soundEngine.playClick();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("axon_open_live_chat"));
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 font-sans select-text pb-32 md:pb-12"
      dir="rtl"
    >
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6 font-bold">
        <Link href="/" className="hover:underline">
          خانه
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)]">تماس و پشتیبانی</span>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* عنوان صفحه */}
        <div className="pb-6 border-b border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">
              مرکز پشتیبانی و ارتباط با {storeName}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium leading-relaxed max-w-2xl">
              کارشناسان ما همواره آماده پاسخگویی به سوالات، مشاوره پیش از خرید و پیگیری سفارشات شما هستند.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenLiveChat}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Headphones size={16} />
            <span>شروع گفتگوی زنده آنلاین</span>
          </button>
        </div>

        {/* گرید استاندارد ۱۲ ستونی: ۴ ستون اطلاعات تماس، ۸ ستون فرم ارسال تیکت */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ستون اطلاعات تماس */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-md space-y-5">
              {[
                {
                  icon: <Phone size={18} />,
                  color: "bg-blue-500/15 text-[var(--accent-blue)]",
                  label: "تلفن پشتیبانی",
                  value: storePhone,
                  href: `tel:${storePhone}`,
                },
                {
                  icon: <Mail size={18} />,
                  color: "bg-purple-500/15 text-purple-400",
                  label: "ایمیل رسمی",
                  value: storeEmail,
                  href: `mailto:${storeEmail}`,
                },
                {
                  icon: <Clock size={18} />,
                  color: "bg-emerald-500/15 text-emerald-500",
                  label: "ساعات پاسخگویی",
                  value: storeHours,
                  href: null,
                },
                {
                  icon: <MapPin size={18} />,
                  color: "bg-rose-500/15 text-rose-400",
                  label: "نشانی دفتر مرکزی",
                  value: storeAddr,
                  href: null,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--text-secondary)] font-bold mb-0.5">
                      {item.label}
                    </div>
                    {item.href ? (
                      <a href={item.href} className="text-xs font-bold hover:underline">
                        {item.value}
                      </a>
                    ) : (
                      <div className="text-xs font-bold">{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-5 text-center space-y-3 shadow-sm">
              <MessageCircle size={28} className="text-[var(--accent-blue)] mx-auto" />
              <div className="text-xs font-black text-[var(--text-primary)]">
                پاسخگویی سریع پیامکی و آنلاین
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                به محض ثبت پاسخ توسط کارشناسان پشتیبانی، متن پاسخ به صورت پیامک (SMS) به شماره موبایل شما ارسال خواهد شد.
              </p>
            </div>
          </div>

          {/* فرم تماس و ثبت تیکت */}
          <div className="lg:col-span-8 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-md">
            <h2 className="text-sm sm:text-base font-black text-[var(--text-primary)] mb-5">
              📩 ارسال تیکت پشتیبانی یا درخواست مشاوره خرید
            </h2>

            {sent ? (
              <div className="py-16 text-center text-emerald-500 text-xs font-bold flex flex-col items-center gap-3">
                <CheckCircle2 size={48} />
                <p className="font-black text-base">تیکت شما با موفقیت ثبت شد!</p>
                <p className="text-[var(--text-secondary)] max-w-md leading-relaxed">
                  کارشناسان آکسون کور در کوتاه‌ترین زمان پیام شما را بررسی کرده و پاسخ را از طریق پیامک به شماره همراه شما اطلاع‌رسانی می‌کنند.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setName("");
                    setPhone("");
                    setSubject("");
                    setMessage("");
                  }}
                  className="mt-2 px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer"
                >
                  ارسال پیام جدید
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {error && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
                    ⚠️ {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1.5 font-bold">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="نام کامل شما..."
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1.5 font-bold">
                      شماره موبایل (جهت دریافت پیامک پاسخ) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xxxxxxxxx"
                      dir="ltr"
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)] text-center transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1.5 font-bold">
                    موضوع پیام (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: مشاوره خرید گجت هوشمند / پیگیری سفارش..."
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)] transition"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1.5 font-bold">
                    متن پیام یا سوال شما *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="پیام، مدل کالا یا سوال تخصصی خود را اینجا بنویسید..."
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] leading-relaxed transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send size={15} />
                  <span>{submitting ? "در حال ثبت تیکت..." : "ارسال پیام به کارشناسان"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}