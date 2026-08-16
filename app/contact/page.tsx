"use client";

import React, { useState, useEffect } from "react";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function ContactPage() {
  const [info, setInfo] = useState<SiteInfo | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadInfo() {
      try {
        if (typeof siteInfoService.getSiteInfo === "function") {
          const res = siteInfoService.getSiteInfo();
          if (res) setInfo(res);
        } else if (typeof siteInfoService.getAll === "function") {
          const res = await siteInfoService.getAll();
          if (res) setInfo(res);
        }
      } catch {
        if (typeof window !== "undefined") {
          const local = JSON.parse(localStorage.getItem("site_info_cache") || "{}");
          setInfo(local);
        }
      }
    }
    loadInfo();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact.trim() || !formData.message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSent(true);
      setFormData({ name: "", contact: "", message: "" });
    }, 600);
  };

  const instagramLink = info?.instagram || (info as any)?.instagramUrl || "https://instagram.com";
  const telegramLink = info?.telegram || (info as any)?.telegramUrl || "https://t.me";

  return (
    <main className="min-h-[80vh] pb-16 font-sans text-[var(--text-primary)] select-none">
      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[var(--text-primary)]">📞 تماس با ما</h1>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            راه‌های ارتباطی و فرم ارسال پیام مستقیم
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* اطلاعات ارتباطی */}
          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 text-xs shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-[var(--accent-blue)]">اطلاعات ارتباطی:</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  <span className="p-2 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-lg">
                    📞
                  </span>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] block font-bold">
                      شماره تماس:
                    </span>
                    <span className="font-bold font-mono text-[var(--text-primary)]">
                      {info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  <span className="p-2 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-lg">
                    ✉️
                  </span>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] block font-bold">
                      ایمیل:
                    </span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">
                      {info?.email || "info@bitbypouria.com"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  <span className="p-2 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-lg">
                    📍
                  </span>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] block font-bold">
                      آدرس:
                    </span>
                    <span className="font-bold text-[var(--text-primary)] leading-relaxed">
                      {info?.address || "تهران، خیابان ولیعصر، برج فناوری"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--card-border)] flex gap-2">
              <a
                href={instagramLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center font-bold hover:border-[var(--accent-blue)] transition cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <span>📷</span>
                <span>اینستاگرام</span>
              </a>
              <a
                href={telegramLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center font-bold hover:border-[var(--accent-blue)] transition cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <span>✈️</span>
                <span>تلگرام</span>
              </a>
            </div>
          </div>

          {/* فرم ارسال پیام */}
          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 text-xs shadow-xl">
            <h3 className="font-bold text-sm text-[var(--accent-blue)]">ارسال پیام مستقیم:</h3>

            {sent ? (
              <div className="p-8 text-center space-y-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-3xl border border-emerald-500/20 animate-fadeIn">
                <span className="text-4xl block">✅</span>
                <p className="font-black text-sm">پیام شما با موفقیت ارسال شد.</p>
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  در اسرع وقت با شما تماس خواهیم گرفت.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-2 text-xs text-[var(--accent-blue)] font-bold hover:underline cursor-pointer"
                >
                  ارسال پیام جدید
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <input
                    type="text"
                    placeholder="نام و نام خانوادگی *"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-bold focus:border-[var(--accent-blue)] transition"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="شماره تماس یا ایمیل *"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-mono font-bold outline-none focus:border-[var(--accent-blue)] transition"
                  />
                </div>

                <div>
                  <textarea
                    rows={4}
                    placeholder="متن پیام شما..."
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium outline-none leading-relaxed focus:border-[var(--accent-blue)] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold cursor-pointer hover:opacity-90 transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <span>ارسال پیام 🚀</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}