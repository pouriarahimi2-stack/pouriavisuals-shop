// File Path: components/ContactDock.tsx
"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import AIAssistantChat from "@/components/AIAssistantChat";

export default function ContactDock() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="fixed bottom-20 sm:bottom-6 left-3.5 sm:left-6 z-40 select-none"
        dir="rtl"
      >
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setIsOpen(true);
          }}
          className="group flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border border-white/20 backdrop-blur-md"
          title="دستیار هوشمند آکسون"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 relative">
            <svg
              className="w-5 h-5 text-white animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2a10 10 0 0 1 7.54 16.6l1.46 2.4-3.02-.9A10 10 0 1 1 12 2z" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
              <path d="M9 14s1 1.5 3 1.5 3-1.5 3-1.5" strokeLinecap="round" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="text-right pr-0.5 sm:pr-1">
            <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider opacity-85 block">
              LIVE AI
            </span>
            <span className="text-[11px] sm:text-xs font-black tracking-tight block whitespace-nowrap">
              دستیار هوشمند آکسون
            </span>
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsOpen(false);
              }}
              className="absolute top-3.5 left-3.5 z-10 w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)] hover:bg-rose-500 hover:text-white transition cursor-pointer"
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
