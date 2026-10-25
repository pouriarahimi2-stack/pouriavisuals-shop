"use client";
import React from "react";
import Link from "next/link";
import { MapPin, Clock, ShieldCheck, Truck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#f4f7fb] dark:bg-[#0b0f17] border-t border-[var(--card-border)] pt-12 pb-24 sm:pb-6 text-[var(--text-primary)] font-sans select-text mt-auto relative z-10" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-right">
          
          {/* ستون اول: لوگو و معرفی */}
          <div className="space-y-6 lg:col-span-1 flex flex-col items-center lg:items-start text-center lg:text-right">
            <Link href="/" className="flex items-center gap-3">
              <img src="/favicon.ico" alt="AXON CORE" className="w-12 h-12 object-contain rounded-xl bg-black p-1" />
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight font-mono">AXON CORE</h2>
            </Link>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-loose">
              مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center lg:justify-start w-full">
              <div className="flex items-center justify-center gap-2 bg-white dark:bg-[#161d2b] px-4 py-2.5 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm w-full sm:w-auto">
                <ShieldCheck size={16} className="text-blue-500" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">ضمانت اصالت کالا</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white dark:bg-[#161d2b] px-4 py-2.5 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm w-full sm:w-auto">
                <Truck size={16} className="text-rose-500" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">ارسال سریع سراسری</span>
              </div>
            </div>
          </div>

          {/* ستون دوم: دسترسی سریع */}
          <div className="space-y-5 text-center lg:text-right pt-2">
            <h3 className="text-sm font-black text-blue-600">دسترسی سریع</h3>
            <ul className="space-y-4 inline-block text-right">
              <li><Link href="/products" className="text-xs font-bold text-[var(--text-secondary)] hover:text-blue-600 transition flex items-center gap-2"><span className="text-[10px]">🛍️</span> کاتالوگ محصولات دیجیتال</Link></li>
              <li><Link href="/news" className="text-xs font-bold text-[var(--text-secondary)] hover:text-blue-600 transition flex items-center gap-2"><span className="text-[10px]">📡</span> رادار اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="text-xs font-bold text-[var(--text-secondary)] hover:text-blue-600 transition flex items-center gap-2"><span className="text-[10px]">📚</span> مجله تخصصی و راهنمای خرید</Link></li>
              <li><Link href="/track-order" className="text-xs font-bold text-[var(--text-secondary)] hover:text-blue-600 transition flex items-center gap-2"><span className="text-[10px]">🎯</span> پیگیری لحظه‌ای سفارشات</Link></li>
            </ul>
          </div>

          {/* ستون سوم: مرکز ارتباط */}
          <div className="space-y-5 text-center lg:text-right pt-2">
            <h3 className="text-sm font-black text-blue-600">مرکز ارتباط و پشتیبانی</h3>
            <div className="space-y-3 max-w-[260px] mx-auto lg:mx-0">
              <div className="flex items-center justify-between bg-white dark:bg-[#161d2b] p-3.5 rounded-[1rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                <span className="text-[10px] font-bold text-[var(--text-secondary)]">ایمیل رسمی:</span>
                <span className="text-xs font-bold font-mono">Pouriarahimi@yahoo.com</span>
              </div>
              <div className="flex flex-col gap-2.5 bg-white dark:bg-[#161d2b] p-3.5 rounded-[1rem] border border-gray-100 dark:border-gray-800 shadow-sm text-right">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-primary)]">
                  <MapPin size={16} className="text-rose-500" />
                  نشانی: شیراز - ستارخان
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                  <Clock size={14} />
                  ساعات کاری: شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰
                </div>
              </div>
            </div>
          </div>

          {/* ستون چهارم: اینماد */}
          <div className="flex justify-center lg:justify-end items-start pt-2">
            <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-md w-32 flex justify-center items-center hover:shadow-lg transition">
              <img src="https://trustseal.enamad.ir/logo.aspx?id=346513&Code=R9g5Z2Z2G" alt="eNamad" className="w-full h-auto object-contain mix-blend-multiply" />
            </div>
          </div>
          
        </div>
        
        {/* نوار پایینی */}
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-[var(--text-secondary)] font-bold">
          <p>تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026</p>
          <p className="font-mono text-blue-500 tracking-widest uppercase">AXON CORE SECURE E-COMMERCE</p>
        </div>
      </div>
    </footer>
  );
}