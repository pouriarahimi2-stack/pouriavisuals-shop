"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center dir-rtl font-sans select-none bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center text-3xl mb-4 shadow-lg">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-lg font-black text-[var(--text-primary)] mb-2">خطایی در پردازش درخواست رخ داد</h2>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
        سیستم با یک خطای غیرمنتظره روبرو شد. می‌توانید مجدداً تلاش کنید یا به صفحه نخست بازگردید.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-lg flex items-center gap-2 cursor-pointer hover:opacity-90 transition">
          <RotateCcw size={14} />
          تلاش مجدد
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold flex items-center gap-2 hover:border-[var(--accent-blue)] transition">
          <Home size={14} />
          صفحه نخست
        </Link>
      </div>
    </div>
  );
}
