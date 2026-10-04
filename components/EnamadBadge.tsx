// File Path: components/EnamadBadge.tsx
"use client";
import React from "react";

interface EnamadBadgeProps {
  code?: string;
  link?: string;
  className?: string;
}

const EXACT_ENAMAD_HTML =
  "<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD' alt='' style='cursor:pointer' code='RqxtofLwJnKsvqQACWz1mvYVVKykOrtD'></a>";

export default function EnamadBadge({ className = "" }: EnamadBadgeProps) {
  return (
    <div
      className={"inline-flex items-center justify-center " + className}
      dangerouslySetInnerHTML={{ __html: EXACT_ENAMAD_HTML }}
    />
  );
}
