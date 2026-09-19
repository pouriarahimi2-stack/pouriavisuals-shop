"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Phone, Clock, MapPin, Send, CheckCircle2, MessageCircle } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 dir-rtl">
      <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-bold">تماس و پشتیبانی</span>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="pb-6 border-b border-[var(--card-border)] mb-8">
          <h1 className="text-xl sm:text-2xl font-black text-white">مرکز پشتیبانی و ارتباط با آکسون</h1>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            کارشناسان ما همواره آماده پاسخگویی به سوالات پیش از خرید، هماهنگی ارسال سفارشات و پشتیبانی فنی هستند.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-xs text-zinc-400 font-bold">تلفن پشتیبانی و سفارشات</div>
                  <div className="text-sm font-black text-white mt-0.5 font-mono">021-91000000</div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-xs text-zinc-400 font-bold">ساعات پاسخگویی</div>
                  <div className="text-xs font-bold text-white mt-0.5">شنبه تا پنجشنبه: ۹ الی ۱۸</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-xs text-zinc-400 font-bold">نشانی دفتر مرکزی</div>
                  <div className="text-xs font-bold text-white mt-0.5">تهران، فروشگاه اینترنتی آکسون کور</div>
                </div>
              </div>
            </div>

            <div className="bg-[#0071e3]/10 border border-[#0071e3]/20 rounded-3xl p-5 text-center">
              <MessageCircle size={28} className="text-[#0071e3] mx-auto mb-2" />
              <div className="text-xs font-black text-white">پشتیبانی پیامکی خودکار</div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                کلیه پیامک‌های تایید و اطلاع‌رسانی از طریق سرشماره رسمی 3000505 ارسال می‌گردد.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-sm font-black text-white mb-4">ارسال پیام یا درخواست مشاوره</h2>
            {sent ? (
              <div className="py-12 text-center text-emerald-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
                <CheckCircle2 size={36} />
                پیام شما دریافت شد. در اسرع وقت با شما تماس خواهیم گرفت.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-bold">نام و نام خانوادگی *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="پوریا رحیمی"
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-white outline-none focus:border-[#0071e3]"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-bold">شماره تماس همراه *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09123456789"
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-white outline-none focus:border-[#0071e3] text-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1.5 font-bold">متن پیام یا سوال شما *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="درخواست خود را اینجا بنویسید..."
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-white outline-none focus:border-[#0071e3]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Send size={15} />
                  ارسال پیام به کارشناسان
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
