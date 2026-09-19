"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-[#07090e] text-white font-sans min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl font-black">
            !
          </div>
          <h2 className="text-base font-black">خطای بحرانی در هسته سیستم</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error?.message || "اجرای برنامه با مشکل سیستمی روبرو شد."}
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 rounded-2xl bg-blue-600 text-white text-xs font-black shadow-lg hover:bg-blue-500 transition">
            بارگذاری مجدد صفحه
          </button>
        </div>
      </body>
    </html>
  );
}
