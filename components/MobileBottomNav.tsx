// File Path: components/MobileBottomNav.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { soundEngine } from '@/lib/soundEngine';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, toggleCart } = useCart();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass-morphism rounded-full p-2 flex justify-around items-center z-50 shadow-2xl backdrop-blur-2xl" dir="rtl">
      <Link href="/" onClick={() => soundEngine.playClick()} className={`p-3 rounded-full transition-all ${pathname === "/" ? "text-[#1b90ff] bg-white/10" : "opacity-60 text-white"}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      </Link>
      <Link href="/#products" onClick={() => soundEngine.playClick()} className={`p-3 rounded-full transition-all ${pathname === "/products" ? "text-[#1b90ff] bg-white/10" : "opacity-60 text-white"}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
      </Link>
      <button onClick={() => { soundEngine.playClick(); toggleCart(); }} className="p-3 text-white opacity-60 hover:opacity-100 relative cursor-pointer">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        {totalItems > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-[#1b90ff] text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">{totalItems}</span>}
      </button>
      <Link href="/track-order" onClick={() => soundEngine.playClick()} className={`p-3 rounded-full transition-all ${pathname === "/track-order" ? "text-[#1b90ff] bg-white/10" : "opacity-60 text-white"}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </Link>
    </nav>
  );
}
