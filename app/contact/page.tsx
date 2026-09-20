"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Phone, Clock, MapPin, Send, CheckCircle2, MessageCircle } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, phone, message }),
      });
      if (res.ok) {
        setSent(true);
      }
    } catch {}
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 dir-rtl font-sans select-none">
      <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6 font-bold">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)]">تماس و پشتیبانی</span>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        <div className="pb-6 border-b border-[var(--card-border)]">
          <h1 className="text-xl sm:text-3xl font-black text-[var(--text-primary)]">مرکز پشتیبانی و ارتباط با آکسون کور</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium leading-relaxed">
            کارشناسان ما همواره آماده پاسخگویی به سوالات شما، مشاوره پیش از خرید و پیگیری سفارشات هستند.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-[var(--accent-blue)] flex items-center justify-center">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)] font-bold">تلفن پشتیبانی و سفارشات</div>
                  <div className="text-sm font-black font-mono text-[var(--text-primary)] mt-0.5">09376110200</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)] font-bold">ساعات پاسخگویی</div>
                  <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5">شنبه تا چهارشنبه ۹ الی ۱۸</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)] font-bold">نشانی دفتر مرکزی</div>
                  <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5">شیراز، خیابان ستارخان</div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-5 text-center space-y-2 shadow-sm">
              <MessageCircle size={28} className="text-[var(--accent-blue)] mx-auto" />
              <div className="text-xs font-black text-[var(--text-primary)]">اطلاع‌رسانی پیامکی خودکار</div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                کلیه پیامک‌های تایید خرید و صدور بارنامه به صورت خودکار به شماره شما ارسال می‌گردد.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-md">
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-4">ارسال پیام یا درخواست مشاوره خرید</h2>
            {sent ? (
              <div className="py-16 text-center text-emerald-500 text-xs font-bold flex flex-col items-center justify-center gap-3">
                <CheckCircle2 size={40} />
                پیام شما با موفقیت در سیستم ثبت گردید. به زودی با شما تماس خواهیم گرفت.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1.5 font-bold">نام و نام خانوادگی *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="پوریا رحیمی"
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent-blue)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1.5 font-bold">شماره تماس همراه *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09123456789"
                      dir="ltr"
                      className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-mono font-bold outline-none focus:border-[var(--accent-blue)] text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1.5 font-bold">متن پیام یا سوال شما *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="درخواست یا سوال خود را اینجا بنویسید..."
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium outline-none focus:border-[var(--accent-blue)] leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition disabled:opacity-50"
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
