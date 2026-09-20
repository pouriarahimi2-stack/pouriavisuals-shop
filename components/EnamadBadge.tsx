"use client";

import React, { useEffect, useState } from "react";

export default function EnamadBadge() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-slate-400 font-bold">
        اینماد
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--card-border)] shadow-sm hover:border-[var(--accent-blue)] transition w-fit">
      <a
        referrerPolicy="origin"
        target="_blank"
        rel="noopener noreferrer"
        href="https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
      >
        <img
          referrerPolicy="origin"
          src="https://trustseal.enamad.ir/logo.aspx?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
          alt="نماد اعتماد الکترونیکی رسمی"
          style={{ cursor: "pointer" }}
          className="w-16 h-16 object-contain"
        />
      </a>
    </div>
  );
}
