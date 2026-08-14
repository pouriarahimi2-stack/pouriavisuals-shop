"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function ContactPage() {
  const [info, setInfo] = useState<SiteInfo | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setInfo(siteInfoService.getSiteInfo());
  }, []);

  if (!info) return null;

  return (
    <main className="min-h-screen pb-16">
      <Header />

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black">📞 تماس با ما</h1>
          <p className="text-xs opacity-70">راه‌های ارتباطی و فرم ارسال پیام مستقیم</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* اطلاعات ارتباطی */}
          <div className="liquid-glass-card p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[var(--accent-blue)]">اطلاعات ارتباطی:</h3>

            <div className="space-y-3 opacity-90">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-blue-500/10 text-lg">📞</span>
                <div>
                  <span className="opacity-60 block text-[10px]">شماره تماس:</span>
                  <span className="font-bold">{info.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-blue-500/10 text-lg">✉️</span>
                <div>
                  <span className="opacity-60 block text-[10px]">ایمیل:</span>
                  <span className="font-mono font-bold">{info.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-blue-500/10 text-lg">📍</span>
                <div>
                  <span className="opacity-60 block text-[10px]">آدرس:</span>
                  <span className="font-bold">{info.address}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--glass-border)] flex gap-2">
              <a
                href={info.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-[var(--glass-border)] text-center font-bold hover:bg-white/10 transition"
              >
                📷 اینستاگرام
              </a>
              <a
                href={info.telegram}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-[var(--glass-border)] text-center font-bold hover:bg-white/10 transition"
              >
                ✈️ تلگرام
              </a>
            </div>
          </div>

          {/* فرم ارسال پیام */}
          <div className="liquid-glass-card p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[var(--accent-blue)]">ارسال پیام مستقیم:</h3>

            {sent ? (
              <div className="p-6 text-center space-y-2 bg-green-500/10 text-green-400 rounded-2xl border border-green-500/20">
                <span className="text-3xl block">✅</span>
                <p className="font-bold">پیام شما با موفقیت ارسال شد.</p>
                <p className="text-[10px] opacity-70">در اسرع وقت با شما تماس خواهیم گرفت.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  placeholder="نام و نام خانوادگی *"
                  required
                  className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none"
                />
                <input
                  type="text"
                  placeholder="شماره تماس یا ایمیل *"
                  required
                  className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none"
                />
                <textarea
                  rows={4}
                  placeholder="متن پیام شما..."
                  required
                  className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer hover:opacity-90 transition shadow-md"
                >
                  ارسال پیام 🚀
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}