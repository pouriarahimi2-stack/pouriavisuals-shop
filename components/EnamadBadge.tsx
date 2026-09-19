"use client";

import React from "react";

export default function EnamadBadge() {
  return (
    <div className="flex items-center justify-center p-2 rounded-2xl bg-white/5 border border-white/10 hover:border-[#0071e3] transition">
      <a
        referrerPolicy="origin"
        target="_blank"
        href="https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
        rel="noopener noreferrer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          referrerPolicy="origin"
          src="https://trustseal.enamad.ir/logo.aspx?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
          alt="نماد اعتماد الکترونیکی"
          style={{ cursor: "pointer" }}
          // @ts-ignore
          code="RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
        />
      </a>
    </div>
  );
}
