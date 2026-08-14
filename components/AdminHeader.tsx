"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminHeader() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/30 dark:bg-black/30 border-b border-[var(--glass-border)] transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-lg tracking-tight flex items-center gap-2 select-none">
          <span className="p-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs">Bit</span>
          <span>BitByPouria <span className="text-xs opacity-60 font-normal">(پنل مدیریت)</span></span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition font-bold"
          >
            🏠 مشاهده فروشگاه
          </Link>
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition cursor-pointer text-sm"
            title="تغییر تم"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>
        </div>
      </div>
    </header>
  );
}