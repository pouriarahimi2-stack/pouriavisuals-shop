"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Clock, MapPin, Send, CheckCircle2, MessageCircle, Mail } from "lucide-react";
import { siteInfoService } from "@/services/siteInfoService";

export default function ContactPage() {
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [subject,    setSubject]    = useState("");
  const [message,    setMessage]    = useState("");
  const [sent,       setSent]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => { if (d) setSiteInfo(d); });
    window.addEventListener("site_info_updated", () =>
      siteInfoService.getSiteInfo().then((d) => { if (d) setSiteInfo(d); })
    );
  }, []);

  const storeName  = siteInfo?.storeName  || siteInfo?.site_name  || "آکسون کور";
  const storePhone = siteInfo?.phone      || "09376110200";
  const storeEmail = siteInfo?.email      || "info@axoncore.ir";
  const storeAddr  = siteInfo?.address    || "شیراز، خیابان ستارخان";
  const storeHours = siteInfo?.working_hours || "شنبه تا چهارشنبه ۹ الی ۱۸";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, phone, subject, message }),
      });
      if (res.ok) { setSent(true); }
      else {
        const d = await res.json().catch(() => ({}));
        setError(d.message || "خطا در ارسال پیام. لطفاً مجدداً تلاش کنید.");
      }
    } catch { setError("خطا در برقراری ارتباط با سرور."); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 dir-rtl font-sans select-none pb-32 md:pb-12" dir="rtl">

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6 font-bold">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)]">تماس و پشتیبانی</span>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">

        {/* عنوان صفحه */}
        <div className="pb-6 border-b border-[var(--card-border)]">
          <h1 className="text-2xl sm:text-3xl font-black">مرکز پشتیبانی و ارتباط با {storeName}</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium leading-relaxed max-w-2xl">
            کارشناسان ما همواره آماده پاسخگویی به سوالات، مشاوره پیش از خرید و پیگیری سفارشات شما هستند.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ستون اطلاعات تماس */}
          <div className="space-y-4">
            <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-md space-y-5">
              {[
                { icon: <Phone size={18} />, color: "bg-blue-500/15   text-[var(--accent-blue)]", label: "تلفن پشتیبانی",   value: storePhone, href: `tel:${storePhone}`     },
                { icon: <Mail  size={18} />, color: "bg-purple-500/15 text-purple-400",            label: "ایمیل",            value: storeEmail, href: `mailto:${storeEmail}` },
                { icon: <Clock size={18} />, color: "bg-emerald-500/15 text-emerald-500",          label: "ساعات پاسخگویی",  value: storeHours, href: null                   },
                { icon: <MapPin size={18} />, color: "bg-rose-500/15   text-rose-400",             label: "نشانی دفتر مرکزی",value: storeAddr,  href: null                   },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--text-secondary)] font-bold mb-0.5">{item.label}</div>
                    {item.href ? (
                      <a href={item.href} className="text-xs font-bold hover:underline">{item.value}</a>
                    ) : (
                      <div className="text-xs font-bold">{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-5 text-center space-y-2 shadow-sm">
              <MessageCircle size={28} className="text-[var(--accent-blue)] mx-auto" />
              <div className="text-xs font-black text-[var(--text-primary)]">اطلاع‌رسانی پیامکی خودکار</div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                پیامک‌های تأیید خرید و صدور بارنامه به‌صورت خودکار ارسال می‌شوند.
              </p>
            </div>
          </div>

          {/* فرم تماس */}
          <div className="lg:col-span-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-md">
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-5">ارسال پیام یا درخواست مشاوره خرید</h2>

            {sent ? (
              <div className="py-16 text-center text-emerald-500 text-xs font-bold flex flex-col items-center gap-3">
                <CheckCircle2 size={44} />
                <p className="font-black text-sm">پیام شما ثبت شد!</p>
                <p className="text-[var(--text-secondary)]">به زودی با شما تماس خواهیم گرفت.</p>
                <button
                  onClick={() => { setSent(false); setName(""); setPhone(""); setSubject(""); setMessage(""); }}
                  className="mt-2 px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs"
                >
                  ارسال پیام جدید
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {error && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
                    ⚠️ {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1.5 font-bold">نام و نام خانوادگی *</label>
                    <input
                      type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="نام کامل شما..."
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1.5 font-bold">شماره تماس *</label>
                    <input
                      type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xxxxxxxxx" dir="ltr"
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)] text-center transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1.5 font-bold">موضوع پیام (اختیاری)</label>
                  <input
                    type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: مشاوره خرید لپ‌تاپ / پیگیری سفارش..."
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] transition"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1.5 font-bold">متن پیام *</label>
                  <textarea
                    rows={5} required value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="پیام یا سوال خود را اینجا بنویسید..."
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] leading-relaxed transition"
                  />
                </div>

                <button
                  type="submit" disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send size={15} />
                  {submitting ? "در حال ارسال..." : "ارسال پیام به کارشناسان"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
