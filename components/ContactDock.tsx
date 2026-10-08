"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

export default function ContactDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatConfig, setChatConfig] = useState({
    svg: "",
    sizeMob: 44,
    sizeDesk: 60,
    side: "left",
    bottomPx: 24
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMob = () => setIsMobile(window.innerWidth < 768);
    checkMob();
    window.addEventListener("resize", checkMob);

    const loadConfig = async () => {
      try {
        const res = await fetch("/api/theme-builder", { cache: "no-store" });
        const json = await res.json();
        const bg = json?.config?.globalBackground || {};
        setChatConfig({
          svg: bg.chatIconSvg || "",
          sizeMob: Number(bg.chatSizeMobile ?? 44),
          sizeDesk: Number(bg.chatSizeDesktop ?? 60),
          side: bg.chatButtonSide === "right" ? "right" : "left",
          bottomPx: Number(bg.chatButtonBottomPx ?? 24)
        });
      } catch {}
    };
    loadConfig();
    window.addEventListener("theme_builder_updated", loadConfig);

    return () => {
      window.removeEventListener("resize", checkMob);
      window.removeEventListener("theme_builder_updated", loadConfig);
    };
  }, []);

  const currentSize = isMobile ? chatConfig.sizeMob : chatConfig.sizeDesk;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          soundEngine.playClick();
          setIsOpen(true);
        }}
        style={{
          width: `${currentSize}px`,
          height: `${currentSize}px`,
          bottom: `${chatConfig.bottomPx}px`,
          left: chatConfig.side === "left" ? "20px" : "auto",
          right: chatConfig.side === "right" ? "20px" : "auto",
        }}
        className="fixed z-[9999] rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_8px_30px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer border-2 border-white/20"
      >
        <span className="relative flex items-center justify-center w-full h-full">
          {chatConfig.svg ? (
             <div 
               dangerouslySetInnerHTML={{ __html: chatConfig.svg }} 
               className="w-3/5 h-3/5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current text-white" 
             />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3/5 h-3/5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          )}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-indigo-700 animate-pulse shadow-md" />
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex flex-col bg-[var(--bg-primary)] sm:bg-black/60 sm:p-4 sm:justify-end sm:items-start backdrop-blur-sm animate-fadeIn">
          <div className="w-full h-full sm:w-[380px] sm:h-[600px] bg-[var(--modal-bg)] sm:rounded-[2rem] shadow-2xl flex flex-col border border-[var(--card-border)] overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="font-black text-sm">پشتیبانی آنلاین آکسون</div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">✕</button>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
               <span className="text-4xl">👋</span>
               <h3 className="font-black text-[var(--text-primary)]">به پشتیبانی آکسون خوش آمدید</h3>
               <p className="text-xs text-[var(--text-secondary)]">لطفاً برای شروع گفتگو وارد حساب کاربری خود شوید.</p>
               <Link href="/login" onClick={() => setIsOpen(false)} className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg w-full">
                 ورود و شروع گفتگو ←
               </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
