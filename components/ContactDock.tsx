// File Path: components/ContactDock.tsx
"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import AIAssistantChat from "@/components/AIAssistantChat";

export default function ContactDock() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 select-none" dir="rtl">
        <button
          onClick={() => {
            soundEngine.playClick();
            setIsOpen(true);
          }}
          className="group flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border border-white/20 backdrop-blur-md"
          title="دستیار هوشمند آکسون"
        >
          {/* لوگو یا آیکون SVG زنده متحرک */}
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 relative">
            <svg className="w-5 h-5 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 0 1 7.54 16.6l1.46 2.4-3.02-.9A10 10 0 1 1 12 2z" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
              <path d="M9 14s1 1.5 3 1.5 3-1.5 3-1.5" strokeLinecap="round" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="text-right pr-1">
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-85 block">Live AI</span>
            <span className="text-xs font-black tracking-tight block">دستیار هوشمند آکسون</span>
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl overflow-hidden">
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsOpen(false);
              }}
              className="absolute top-4 left-4 z-10 w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)] hover:bg-rose-500 hover:text-white transition cursor-pointer"
            >
              ✕
            </button>
            <AIAssistantChat />
          </div>
        </div>
      )}
    </>
  );
}
