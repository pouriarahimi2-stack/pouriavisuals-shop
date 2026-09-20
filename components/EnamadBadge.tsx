"use client";

import React from "react";

export default function EnamadBadge() {
  return (
    <div
      className="flex items-center justify-center p-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-sm hover:border-[var(--accent-blue)] transition"
      dangerouslySetInnerHTML={{
        __html: `<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD' alt='' style='cursor:pointer' code='RqxtofLwJnKsvqQACWz1mvYVVKykOrtD'></a>`,
      }}
    />
  );
}
