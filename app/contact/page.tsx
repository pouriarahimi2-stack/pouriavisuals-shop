"use client";

import React, { useState, useEffect } from "react";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import Link from "next/link";

export default function ContactPage() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    async function loadInfo() {
      try {
        const info = await siteInfoService.getAll();
        setSiteInfo(info);
      } catch (e) {
        console.error("Contact load error:", e);
      }
    }
    loadInfo();

    const handleUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !message.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccessMsg(true);
      setFullName("");
      setPhone("");
      setSubject("");
      setMessage("");
    }, 600);
  };

  const phoneNum = siteInfo?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
  const emailAddr = siteInfo?.email || "info@pouriavisuals.ir";
  const addressText = siteInfo?.address || "تهران، خیابان ولیعصر";
  const siteName = siteInfo?.site_name || "پوریا ویژوالز";

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-10" dir="rtl">
      
      {/* هدر صفحه تماس */}
      <div className="text-center space-y-2">
        <span className="p-3 rounded-2xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] inline-block text-2xl">
          📞
        </span>
        <h1 className="text-2xl md:text-3xl font-black">تماس با پشتیبانی و مشاوره تخصصی</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          پاسخگوی سوالات شما در خصوص تجهیزات، مانیتورهای تدوین و هماهنگی سفارشات هستیم
        </p>
      </div>

      {successMsg && (
        <div className="p-5 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 space-y-1 shadow-xl animate-fadeIn text-xs font-bold">
          <p className="font-black text-sm">✓ پیام شما با موفقیت دریافت گردید.</p>
          <p className="font-medium opacity-90">کارشناسان تیم پشتیبانی به‌زودی با شماره همراه شما تماس خواهند گرفت.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ستون راست: اطلاعات تماس و آدرس */}
        <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          <h3 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            🏢 اطلاعات دفتر مرکزی {siteName}
          </h3>

          <div className="space-y-4 text-[var(--text-secondary)] font-medium leading-relaxed">
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">📞</span>
              <div>
                <strong className="text-[var(--text-primary)] block mb-0.5">شماره تماس پشتیبانی:</strong>
                <span className="font-mono font-bold text-[var(--accent-blue)] text-sm">{phoneNum}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">✉️</span>
              <div>
                <strong className="text-[var(--text-primary)] block mb-0.5">ایمیل ارتباطی:</strong>
                <span className="font-mono font-bold">{emailAddr}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">📍</span>
              <div>
                <strong className="text-[var(--text-primary)] block mb-0.5">نشانی حضوری:</strong>
                <span>{addressText}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">⏰</span>
              <div>
                <strong className="text-[var(--text-primary)] block mb-0.5">ساعات کاری:</strong>
                <span>شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--card-border)]">
            <Link
              href="/track-order"
              className="w-full py-3 rounded-2xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold text-center block transition"
            >
              🔍 رهگیری مرسولات پستی ←
            </Link>
          </div>
        </div>

        {/* ستون چپ: فرم ارسال پیام و تیکت */}
        <form onSubmit={handleSubmitTicket} className="lg:col-span-2 p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
          <h3 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            ✉️ ارسال پیام یا درخواست مشاوره
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: پوریا رسولی"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شماره موبایل جهت پاسخگویی *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">موضوع پیام</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: استعلام گارانتی مانیتور، همکاری سازمانی و..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">متن پیام یا پرسش شما *</label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="توضیحات خود را بنویسید..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] leading-relaxed focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl cursor-pointer disabled:opacity-50"
            >
              {submitting ? "در حال ارسال..." : "ارسال پیام به واحد پشتیبانی 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}