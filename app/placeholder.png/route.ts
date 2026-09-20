import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // به جای صفحه سیاه با نوشته review، یک آیکون مدرن و جذاب گجت دیجیتال رندر می‌شود
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#0f172a"/>
    <circle cx="200" cy="200" r="120" fill="#1e293b" />
    <path d="M160 140h80c11 0 20 9 20 20v80c0 11-9 20-20 20h-80c-11 0-20-9-20-20v-80c0-11 9-20 20-20z" fill="none" stroke="#0284c7" stroke-width="8" stroke-linejoin="round"/>
    <circle cx="200" cy="200" r="28" fill="#38bdf8"/>
    <text x="200" y="300" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14" font-weight="bold">AXON DIGITAL GADGET</text>
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
