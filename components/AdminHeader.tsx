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
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[var(--nav-bg)] border-b border-[var(--card-border)] text-[var(--text-primary)] transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-lg tracking-tight flex items-center gap-2 select-none text-[var(--text-primary)]">
          <span className="p-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black">Bit</span>
          <span>BitByPouria <span className="text-xs text-[var(--text-secondary)] font-normal">(پنل مدیریت)</span></span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] transition font-bold"
          >
            🏠 مشاهده فروشگاه
          </Link>
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] transition cursor-pointer text-sm font-bold"
            title="تغییر تم"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>
        </div>
      </div>
    </header>
  );
}