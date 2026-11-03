/**
 * fix18.js — رفع کامل مشکلات موبایل
 * 1. globals.css — تعریف تمیز ai-chat-float-btn
 * 2. AIAssistantChat.tsx — inline style + class برای موقعیت دکمه
 * 3. CartDrawer.tsx — padding فوتر برای نمایش دکمه پرداخت
 * 4. MobileSlider.tsx — اسلایدر موبایل کاملاً جدید
 * 5. DynamicHomeSections.tsx — ادغام MobileSlider در موبایل
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const R    = (p) => path.join(__dirname, p);

// ═══════════════════════════════════════════════════════════
// 1. globals.css  (کامل، بدون بلوک تکراری)
// ═══════════════════════════════════════════════════════════
const GLOBALS_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* ══ AXON — Liquid Glass Design System ══════════════════════ */

:root {
  --bg-primary:         #f0f4ff;
  --bg-secondary:       #e8eeff;
  --text-primary:       #0a0f1e;
  --text-secondary:     #4b5680;
  --modal-bg:           rgba(255,255,255,0.92);
  --input-bg:           rgba(240,244,255,0.9);
  --card-border:        rgba(0,66,200,0.12);
  --card-border-hover:  rgba(0,102,255,0.45);
  --card-hover:         rgba(0,102,255,0.08);
  --accent-blue:        #0066ff;
  --accent-violet:      #7c3aed;
  --accent-cyan:        #06b6d4;
  --accent-glow:        rgba(0,102,255,0.22);
  --accent-glow-v:      rgba(124,58,237,0.18);
  --glass-bg:           rgba(255,255,255,0.72);
  --glass-bg-strong:    rgba(255,255,255,0.92);
  --glass-border:       rgba(255,255,255,0.85);
  --glass-border-inner: rgba(0,102,255,0.18);
  --glass-shadow:       0 8px 32px rgba(0,50,180,0.12),0 2px 8px rgba(0,0,0,0.06);
  --glass-surface:      rgba(255,255,255,0.75);
}
.dark {
  --bg-primary:         #04060f;
  --bg-secondary:       #080c1a;
  --text-primary:       #f0f4ff;
  --text-secondary:     #8896c8;
  --modal-bg:           rgba(8,12,26,0.92);
  --input-bg:           rgba(20,28,60,0.8);
  --card-border:        rgba(59,130,246,0.14);
  --card-border-hover:  rgba(59,130,246,0.55);
  --card-hover:         rgba(59,130,246,0.08);
  --accent-blue:        #3b82f6;
  --accent-violet:      #a78bfa;
  --accent-cyan:        #22d3ee;
  --accent-glow:        rgba(59,130,246,0.35);
  --accent-glow-v:      rgba(167,139,250,0.25);
  --glass-bg:           rgba(10,15,40,0.65);
  --glass-bg-strong:    rgba(8,12,26,0.92);
  --glass-border:       rgba(255,255,255,0.10);
  --glass-border-inner: rgba(59,130,246,0.22);
  --glass-shadow:       0 8px 40px rgba(0,0,0,0.55),0 2px 12px rgba(0,0,0,0.4);
  --glass-surface:      rgba(10,15,40,0.72);
}

html,body { width:100%; max-width:100vw; scroll-behavior:smooth; background-color:var(--bg-primary); color:var(--text-primary); -webkit-tap-highlight-color:transparent; overflow-x:hidden !important; touch-action:pan-y; }
body { font-family:'Vazirmatn',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; transition:background-color .3s ease,color .3s ease; }

/* ══ Glass ═══════════════════════════════════════════════════ */
.glass-morphism { background:var(--glass-bg); backdrop-filter:blur(20px) saturate(180%); -webkit-backdrop-filter:blur(20px) saturate(180%); border:1px solid var(--glass-border); box-shadow:var(--glass-shadow); }
.glass-morphism-strong { background:var(--glass-bg-strong); backdrop-filter:blur(28px) saturate(200%); -webkit-backdrop-filter:blur(28px) saturate(200%); border:1px solid var(--glass-border); box-shadow:var(--glass-shadow); }
.glass-header { background:var(--glass-bg); backdrop-filter:blur(24px) saturate(200%); -webkit-backdrop-filter:blur(24px) saturate(200%); border:1px solid var(--glass-border); box-shadow:0 4px 24px rgba(0,102,255,.10),0 1px 4px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.6); }
.dark .glass-header { box-shadow:0 4px 32px rgba(0,0,0,.6),0 1px 4px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.07); }

/* ══ Capsule Buttons ════════════════════════════════════════ */
.btn-glass { display:inline-flex; align-items:center; justify-content:center; gap:6px; border-radius:9999px; padding:8px 18px; font-weight:700; font-size:13px; background:var(--glass-bg); backdrop-filter:blur(16px) saturate(180%); -webkit-backdrop-filter:blur(16px) saturate(180%); border:1px solid var(--glass-border); color:var(--text-primary); cursor:pointer; transition:all .22s cubic-bezier(.22,1,.36,1); box-shadow:0 2px 12px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.5); white-space:nowrap; user-select:none; }
.btn-glass:hover { background:var(--glass-bg-strong); box-shadow:0 4px 20px var(--accent-glow),inset 0 1px 0 rgba(255,255,255,.6); transform:translateY(-1px); }
.btn-glass:active { transform:scale(.96) translateY(0); }
.btn-glass-primary { display:inline-flex; align-items:center; justify-content:center; gap:6px; border-radius:9999px; padding:8px 18px; font-weight:700; font-size:13px; background:linear-gradient(135deg,var(--accent-blue) 0%,var(--accent-violet) 100%); border:1px solid rgba(255,255,255,.25); color:#fff; cursor:pointer; transition:all .22s cubic-bezier(.22,1,.36,1); box-shadow:0 4px 20px var(--accent-glow),0 1px 4px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.25); white-space:nowrap; user-select:none; }
.btn-glass-primary:hover { box-shadow:0 6px 28px var(--accent-glow),0 2px 8px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.3); filter:brightness(1.07); transform:translateY(-2px); }
.btn-glass-primary:active { transform:scale(.96) translateY(0); }
.btn-glass-primary:disabled { opacity:.45; cursor:not-allowed; transform:none; filter:none; }

/* ══ Cards ══════════════════════════════════════════════════ */
.card-glass { background:var(--glass-bg); backdrop-filter:blur(16px) saturate(160%); -webkit-backdrop-filter:blur(16px) saturate(160%); border:1px solid var(--glass-border); border-radius:1.5rem; box-shadow:var(--glass-shadow); transition:all .30s cubic-bezier(.22,1,.36,1); }
.card-glass:hover { border-color:var(--card-border-hover); box-shadow:0 12px 40px var(--accent-glow),0 4px 16px rgba(0,0,0,.12); transform:translateY(-4px); }
.card-hover-glow { transition:box-shadow .35s ease,border-color .3s ease,transform .3s cubic-bezier(.22,1,.36,1); }
.card-hover-glow:hover { transform:translateY(-4px); box-shadow:0 12px 36px -4px var(--accent-glow),0 2px 8px -2px rgba(0,0,0,.10); border-color:var(--card-border-hover) !important; }
.dark .card-hover-glow:hover { box-shadow:0 12px 36px -4px var(--accent-glow),0 4px 16px rgba(0,0,0,.5); }

/* ══ Badges ══════════════════════════════════════════════════ */
.badge-capsule { display:inline-flex; align-items:center; justify-content:center; border-radius:9999px; padding:3px 10px; font-size:11px; font-weight:800; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); box-shadow:0 2px 8px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.25); }
.badge-discount { background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff; border:1px solid rgba(255,255,255,.2); }
.badge-warning  { background:linear-gradient(135deg,rgba(245,158,11,.9),rgba(217,119,6,.9)); color:#fff; border:1px solid rgba(255,255,255,.2); }
.badge-new      { background:linear-gradient(135deg,var(--accent-blue),var(--accent-violet)); color:#fff; border:1px solid rgba(255,255,255,.2); }

/* ══ Gradients ══════════════════════════════════════════════ */
.axon-bg-gradient { background:radial-gradient(ellipse 80% 50% at 20% -10%,rgba(0,102,255,.12) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 110%,rgba(124,58,237,.10) 0%,transparent 55%),var(--bg-primary); }
.dark .axon-bg-gradient { background:radial-gradient(ellipse 80% 50% at 20% -10%,rgba(59,130,246,.18) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 110%,rgba(167,139,250,.14) 0%,transparent 55%),var(--bg-primary); }
.axon-gradient-text { background:linear-gradient(135deg,var(--accent-blue) 0%,var(--accent-violet) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.axon-gradient-text-cyan { background:linear-gradient(135deg,var(--accent-cyan) 0%,var(--accent-blue) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

/* ══ Animations ════════════════════════════════════════════ */
@keyframes fadeIn    { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
@keyframes axon-page-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes axonReveal { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes liquid-shimmer { 0%{transform:translateX(-100%) skewX(-15deg)} 100%{transform:translateX(200%) skewX(-15deg)} }
@keyframes axon-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes axon-float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
@keyframes axon-glow-pulse { 0%,100%{box-shadow:0 0 0 0 var(--accent-glow)} 50%{box-shadow:0 0 24px 8px var(--accent-glow)} }
@keyframes kinetic-cart-left { 0%{transform:translateX(0) scale(1)} 30%{transform:translateX(-5px) scale(1.1)} 60%{transform:translateX(30px) scale(0.8) rotate(-10deg)} 100%{transform:translateX(60px) scale(0.5) rotate(-20deg);opacity:0} }
@keyframes kinetic-item-drop { 0%{transform:translateY(-24px) scale(0.8);opacity:0} 40%{transform:translateY(4px) scale(1.1);opacity:1} 70%{transform:translateY(-3px) scale(0.95)} 100%{transform:translateY(0) scale(1);opacity:0} }
@keyframes kinetic-counter-bump { 0%,100%{transform:scale(1)} 40%{transform:scale(1.4) rotate(-3deg)} 70%{transform:scale(0.9) rotate(2deg)} }

.animate-fadeIn         { animation:fadeIn .2s cubic-bezier(.16,1,.3,1) forwards; }
.axon-page-enter        { animation:axon-page-in .35s cubic-bezier(.22,1,.36,1) forwards; }
.axon-float             { animation:axon-float 4s ease-in-out infinite; }
.animate-kinetic-cart-left  { animation:kinetic-cart-left .8s cubic-bezier(.5,0,.75,0) forwards; }
.animate-kinetic-item-drop  { animation:kinetic-item-drop .7s cubic-bezier(.5,0,.75,0) forwards; }
.animate-kinetic-counter-bump { animation:kinetic-counter-bump .5s cubic-bezier(.5,0,.75,0) forwards; }

/* ══ Reveal ════════════════════════════════════════════════ */
.axon-reveal { opacity:0; transform:translateY(24px); transition:opacity .55s cubic-bezier(.22,1,.36,1),transform .55s cubic-bezier(.22,1,.36,1); }
.axon-reveal.revealed { opacity:1; transform:translateY(0); }
.axon-reveal-scale { opacity:0; transform:scale(.92); animation:axonReveal .45s ease both; }
.axon-reveal-scale.revealed { opacity:1; transform:scale(1); }
.stagger-0{transition-delay:0ms;animation-delay:0ms} .stagger-1{transition-delay:60ms;animation-delay:50ms}
.stagger-2{transition-delay:120ms;animation-delay:100ms} .stagger-3{transition-delay:180ms;animation-delay:150ms}
.stagger-4{transition-delay:240ms;animation-delay:200ms} .stagger-5{transition-delay:300ms;animation-delay:250ms}
.stagger-6{transition-delay:360ms;animation-delay:300ms} .stagger-7{transition-delay:420ms;animation-delay:350ms}

/* ══ Skeleton ═══════════════════════════════════════════════ */
.axon-skeleton { background:linear-gradient(90deg,var(--card-border) 25%,var(--input-bg) 50%,var(--card-border) 75%); background-size:200% 100%; animation:axon-shimmer 1.4s ease-in-out infinite; }

/* ══ Liquid Shine ═══════════════════════════════════════════ */
.card-liquid-shine { position:relative; overflow:hidden; }
.card-liquid-shine::before { content:''; position:absolute; top:0; left:0; width:40%; height:100%; background:linear-gradient(105deg,transparent 20%,rgba(255,255,255,.12) 50%,transparent 80%); transform:translateX(-100%) skewX(-15deg); pointer-events:none; border-radius:inherit; }
.card-liquid-shine:hover::before { animation:liquid-shimmer .75s ease forwards; }

/* ══ Safe area / scroll ════════════════════════════════════ */
.pb-safe { padding-bottom:calc(0.5rem + env(safe-area-inset-bottom)); }
@supports (padding-bottom:env(safe-area-inset-bottom)) { .mobile-bottom-nav { padding-bottom:env(safe-area-inset-bottom); } }
.scrollbar-none::-webkit-scrollbar { display:none; } .scrollbar-none { -ms-overflow-style:none; scrollbar-width:none; }

/* ══ Admin table ════════════════════════════════════════════ */
.admin-table-wrapper { overflow-x:auto; -webkit-overflow-scrolling:touch; border-radius:1rem; }
.admin-table-wrapper table { min-width:600px; }

/* ══ Mobile — glass فعال ═══════════════════════════════════ */
@media screen and (max-width:768px) {
  input,select,textarea { font-size:16px !important; }
  button,input,select,textarea { min-height:44px; }
  @supports (backdrop-filter:blur(1px)) {
    .glass-morphism,.glass-header,.card-glass,.glass-morphism-strong { backdrop-filter:blur(18px) saturate(180%); -webkit-backdrop-filter:blur(18px) saturate(180%); }
  }
  @supports not (backdrop-filter:blur(1px)) {
    .glass-morphism,.glass-header { background:var(--glass-bg-strong) !important; }
  }
}

/* ══ AI Chat Float Button ═══════════════════════════════════
   یک تعریف منحصربه‌فرد — بدون تکرار در جای دیگری از این فایل
   ═══════════════════════════════════════════════════════════ */
.ai-chat-float-btn {
  position: fixed !important;
  bottom: 80px !important;
  right: 16px !important;
  z-index: 45 !important;
  width: 46px !important;
  height: 46px !important;
  border-radius: 50% !important;
  background: linear-gradient(135deg, #0066ff 0%, #7c3aed 100%) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  box-shadow: 0 4px 20px rgba(0,102,255,0.40), 0 2px 8px rgba(0,0,0,0.20) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
  border: 1px solid rgba(255,255,255,0.25) !important;
  outline: none !important;
}
.ai-chat-float-btn:hover {
  transform: scale(1.08) !important;
  box-shadow: 0 6px 28px rgba(0,102,255,0.55), 0 2px 10px rgba(0,0,0,0.25) !important;
}
.ai-chat-float-btn:active {
  transform: scale(0.94) !important;
}
@media (min-width: 768px) {
  .ai-chat-float-btn {
    bottom: 28px !important;
    right: 28px !important;
    width: 50px !important;
    height: 50px !important;
  }
}
`;

// ═══════════════════════════════════════════════════════════
// 2. AIAssistantChat.tsx — inline style روی دکمه
// ═══════════════════════════════════════════════════════════
const AI_ASSISTANT_CHAT_TSX = `"use client";
// File Path: components/AIAssistantChat.tsx
import React, { useState, useRef, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AIAssistantChat() {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "سلام! دستیار هوشمند آکسون کور هستم. چطور می‌توانم کمکتان کنم؟" },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    soundEngine.playClick();
    const userText = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user" as const, text: userText }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: userText, history: newMsgs }),
      });
      const data = await res.json();
      setMessages([...newMsgs, {
        role: "bot",
        text: data.reply || data.message || "متأسفم، پاسخی دریافت نشد.",
      }]);
    } catch {
      setMessages([...newMsgs, { role: "bot", text: "خطا در اتصال. مجدداً تلاش کنید." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ─── دکمه شناور: class + inline style برای اطمینان کامل ─── */}
      <button
        className="ai-chat-float-btn"
        style={{
          position: "fixed",
          bottom:   "80px",
          right:    "16px",
          zIndex:   45,
        }}
        onClick={() => { soundEngine.playClick(); setIsOpen(!isOpen); }}
        aria-label="دستیار هوشمند آکسون"
        title="دستیار هوشمند"
      >
        <span style={{ color: "#fff", fontSize: "18px", lineHeight: 1 }}>
          {isOpen ? "✕" : "🤖"}
        </span>
      </button>

      {/* ─── پنل چت ─── */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "fixed",
              bottom:   "140px",
              right:    "12px",
              left:     "12px",
              zIndex:   50,
              height:   "58vh",
              maxHeight: "480px",
              borderRadius: "1.5rem",
              display:  "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "var(--modal-bg)",
              border:   "1px solid var(--card-border)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
            className="md:left-auto md:right-20 md:w-80 md:h-[420px] md:bottom-20"
            dir="rtl"
          >
            {/* هدر */}
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--card-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(135deg,#0066ff,#7c3aed)",
              borderRadius: "1.5rem 1.5rem 0 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff" }}>
                <span style={{ fontSize: "18px" }}>🤖</span>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 900, margin: 0 }}>دستیار هوشمند آکسون</p>
                  <p style={{ fontSize: "10px", opacity: 0.8, margin: 0 }}>آنلاین و آماده پاسخگویی</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "18px", fontWeight: 900, background: "none", border: "none", lineHeight: 1 }}
              >✕</button>
            </div>

            {/* پیام‌ها */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-start" : "flex-end" }}>
                  <div style={{
                    maxWidth: "80%",
                    padding: "8px 12px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    background: m.role === "user" ? "#0066ff" : "var(--input-bg)",
                    color:      m.role === "user" ? "#fff"    : "var(--text-primary)",
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "var(--input-bg)", padding: "8px 14px", borderRadius: "16px", display: "flex", gap: "4px" }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: "#0066ff", display: "inline-block",
                        animation: "bounce 1s infinite",
                        animationDelay: i * 150 + "ms",
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ورودی */}
            <form onSubmit={handleSend} style={{
              padding: "10px 12px",
              borderTop: "1px solid var(--card-border)",
              display: "flex",
              gap: "8px",
            }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="سؤال یا درخواست خود را بنویسید..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "9999px",
                  background: "var(--input-bg)",
                  border: "1px solid var(--card-border)",
                  fontSize: "14px",
                  fontWeight: 600,
                  outline: "none",
                  color: "var(--text-primary)",
                  minHeight: "unset",
                  height: "36px",
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  padding: "0 14px",
                  borderRadius: "9999px",
                  background: "linear-gradient(135deg,#0066ff,#7c3aed)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "16px",
                  cursor: "pointer",
                  border: "none",
                  height: "36px",
                  opacity: (loading || !input.trim()) ? 0.5 : 1,
                }}
              >←</button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
`;

// ═══════════════════════════════════════════════════════════
// 3. CartDrawer.tsx — پدینگ فوتر برای نمایش دکمه پرداخت
// ═══════════════════════════════════════════════════════════
const CART_DRAWER_TSX = `"use client";
// File Path: components/CartDrawer.tsx
import React, { useEffect, useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

export default function CartDrawer() {
  const { isCartOpen, closeCart, cartItems, updateQuantity, removeFromCart, finalPayable } = useCart() as any;
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end md:flex-row md:justify-end font-sans select-none" dir="rtl">

      {/* پس‌زمینه */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => { soundEngine?.playClick?.(); closeCart(); }}
      />

      {/* بدنه کشو */}
      <div className="relative w-full md:w-[420px] md:h-full bg-white rounded-t-[2.5rem] md:rounded-none md:rounded-l-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "90dvh", height: "auto", minHeight: "60dvh" }}
      >
        {/* دستگیره موبایل */}
        <div className="w-full flex justify-center pt-3 md:hidden">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* هدر */}
        <div className="flex items-center justify-between p-5 pt-4 md:pt-5 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <ShoppingBag className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h2 className="font-black text-base text-slate-900">سبد خرید</h2>
              <p className="text-xs font-bold text-slate-400">{cartItems.length} کالا</p>
            </div>
          </div>
          <button
            onClick={() => { soundEngine?.playClick?.(); closeCart(); }}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* لیست */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50" style={{ WebkitOverflowScrolling: "touch" }}>
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 opacity-60 py-16">
              <ShoppingBag size={56} strokeWidth={1} />
              <p className="font-bold text-sm">سبد خرید خالی است!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item: any) => (
                <div key={item.id} className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-sm flex gap-3 relative group">
                  <button
                    onClick={() => { soundEngine?.playClick?.(); removeFromCart(item.id); }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-slate-100 text-rose-500 rounded-full shadow flex items-center justify-center cursor-pointer hover:bg-rose-50 z-10"
                  >
                    <Trash2 size={13} />
                  </button>
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl p-1.5 shrink-0 border border-slate-100/50 flex items-center justify-center">
                    <img src={item.image || "/placeholder.png"} alt={item.title} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">{item.title}</h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-black text-sm text-slate-900">
                        {Number(item.price || 0).toLocaleString("fa-IR")} <span className="text-[9px] font-normal text-slate-400">ت</span>
                      </span>
                      <div className="flex items-center bg-slate-50 border border-slate-100 rounded-full p-0.5">
                        <button onClick={() => { soundEngine?.playClick?.(); updateQuantity(item.id, item.quantity - 1); }} className="w-7 h-7 flex items-center justify-center bg-white text-slate-600 rounded-full shadow-sm cursor-pointer hover:bg-slate-100">
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                        <button onClick={() => { soundEngine?.playClick?.(); updateQuantity(item.id, item.quantity + 1); }} className="w-7 h-7 flex items-center justify-center bg-white text-slate-600 rounded-full shadow-sm cursor-pointer hover:bg-slate-100">
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* فوتر — با پدینگ کافی برای نمایش روی موبایل */}
        {cartItems.length > 0 && (
          <div
            className="bg-white border-t border-slate-100 p-5"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-bold text-sm">مبلغ قابل پرداخت:</span>
              <span className="text-xl font-black text-slate-900">
                {Number(finalPayable).toLocaleString("fa-IR")} <span className="text-xs font-normal text-slate-400">تومان</span>
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={() => { soundEngine?.playClick?.(); closeCart(); }}
              className="w-full h-14 flex items-center justify-center gap-2 font-black text-sm text-white rounded-2xl cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
              style={{ background: "linear-gradient(135deg,#0066ff 0%,#7c3aed 100%)" }}
            >
              <span>تسویه حساب و تکمیل سفارش</span>
              <ArrowLeft size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
`;

// ═══════════════════════════════════════════════════════════
// 4. MobileSlider.tsx — اسلایدر کامل موبایل (inline styles)
// ═══════════════════════════════════════════════════════════
const MOBILE_SLIDER_TSX = `"use client";
// File Path: components/MobileSlider.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
  price?: number | null;
  badge?: string;
  cta?: string;
}

interface MobileSliderConfig {
  height?: number;
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
}

interface Props {
  slides: Slide[];
  config?: MobileSliderConfig;
}

const GRADS = [
  "linear-gradient(135deg,#0a0f2e 0%,#1a1040 50%,#0d1a4a 100%)",
  "linear-gradient(135deg,#0d1a3a 0%,#1e0a40 50%,#0a1a2e 100%)",
  "linear-gradient(135deg,#0a1e3a 0%,#001a35 50%,#0f1428 100%)",
  "linear-gradient(135deg,#140a2e 0%,#0a1428 50%,#1e1040 100%)",
  "linear-gradient(135deg,#001428 0%,#0a0f2e 50%,#140e3a 100%)",
];

export default function MobileSlider({ slides, config = {} }: Props) {
  const { height = 220, autoPlay = true, interval = 4500, showDots = true } = config;
  const [active, setActive] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((idx: number) => {
    setActive(((idx % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoPlay && slides.length > 1) {
      timerRef.current = setInterval(() => {
        setActive(prev => (prev + 1) % slides.length);
      }, interval);
    }
  }, [autoPlay, interval, slides.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dragging.current = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - startY.current);
    if (Math.abs(dx) < 40 || dy > Math.abs(dx)) return;
    if (dx > 0) goTo(active - 1);
    else        goTo(active + 1);
    resetTimer();
  };

  if (!slides || slides.length === 0) return null;

  const slide = slides[active];

  return (
    <div
      style={{ position: "relative", width: "100%", height: height + "px", borderRadius: "20px", overflow: "hidden", userSelect: "none" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* پس‌زمینه گرادیان */}
      <div style={{
        position: "absolute", inset: 0,
        background: GRADS[active % GRADS.length],
        transition: "background 0.5s ease",
      }} />

      {/* محتوای اسلاید */}
      <Link
        href={slide.link || "/products"}
        style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "16px 14px", textDecoration: "none" }}
      >
        {/* متن */}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: "8px" }}>
          {slide.badge && (
            <span style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: "9999px",
              background: "rgba(0,102,255,0.25)",
              border: "1px solid rgba(0,102,255,0.4)",
              color: "#60a5fa",
              fontSize: "10px",
              fontWeight: 800,
              marginBottom: "6px",
            }}>🔥 {slide.badge}</span>
          )}
          <h2 style={{
            color: "#f0f4ff",
            fontSize: "14px",
            fontWeight: 900,
            lineHeight: 1.3,
            margin: "0 0 4px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>{slide.title}</h2>
          {slide.subtitle && (
            <p style={{
              color: "rgba(240,244,255,0.65)",
              fontSize: "10px",
              fontWeight: 500,
              lineHeight: 1.4,
              margin: "0 0 8px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>{slide.subtitle}</p>
          )}
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 14px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg,#0066ff,#7c3aed)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 800,
            boxShadow: "0 4px 14px rgba(0,102,255,0.4)",
          }}>
            {slide.cta || "مشاهده و خرید"} ←
          </span>
          {slide.price && slide.price > 0 && (
            <p style={{ color: "#34d399", fontSize: "11px", fontWeight: 900, marginTop: "6px" }}>
              {slide.price.toLocaleString("fa-IR")} ت
            </p>
          )}
        </div>

        {/* تصویر */}
        <div style={{
          width: "100px",
          height: (height - 32) + "px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          padding: "8px",
        }}>
          <img
            src={slide.image || "/placeholder.png"}
            alt={slide.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.5))",
              transition: "transform 0.4s ease",
            }}
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
          />
        </div>
      </Link>

      {/* نقطه‌های ناوبری */}
      {showDots && slides.length > 1 && (
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "5px",
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
          padding: "4px 10px",
          borderRadius: "9999px",
          border: "1px solid rgba(255,255,255,0.10)",
        }}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => { e.preventDefault(); goTo(idx); resetTimer(); }}
              style={{
                height: "6px",
                width:  idx === active ? "20px" : "6px",
                borderRadius: "9999px",
                background: idx === active ? "#0066ff" : "rgba(255,255,255,0.4)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.3s ease, background 0.3s ease",
                minHeight: "unset",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
`;

// ═══════════════════════════════════════════════════════════
// 5. DynamicHomeSections.tsx — کامل با MobileSlider
// ═══════════════════════════════════════════════════════════
const DYNAMIC_HOME_SECTIONS_TSX = `"use client";
// File Path: components/DynamicHomeSections.tsx
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import MobileSlider from "@/components/MobileSlider";
import { useSiteInfo } from "@/context/SiteInfoContext";
import { DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";
import { formatPrice } from "@/lib/formatters";

interface Props {
  initialProducts?: any[];
  initialBanners?: any[];
  initialSiteInfo?: any;
}

export interface ResponsiveSectionItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
}

export interface BannerSizingConfig {
  mobileHeight: number;
  tabletHeight: number;
  desktopHeight: number;
  mobileImageSize: number;
  desktopImageSize: number;
  mobileLayout: "horizontal" | "vertical";
}

export const DEFAULT_BANNER_SIZING: BannerSizingConfig = {
  mobileHeight: 220,
  tabletHeight: 280,
  desktopHeight: 360,
  mobileImageSize: 100,
  desktopImageSize: 240,
  mobileLayout: "horizontal",
};

export const DEFAULT_SECTIONS_ORDER: ResponsiveSectionItem[] = [
  {
    id: "sec_banners",
    type: "banners_slider",
    title: "اسلایدر بنرهای تبلیغاتی",
    subtitle: "نمایش بنرهای کلیک‌پذیر متصل به محصولات",
    enabled: true,
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true,
  },
  {
    id: "sec_perspective",
    type: "NativePerspectiveSlider",
    title: "نمایشگاه تعاملی سه‌بعدی محصولات",
    subtitle: "پیمایش لمسی جهت بررسی مشخصات و گارانتی",
    enabled: true,
    showOnMobile: false,
    showOnTablet: false,
    showOnDesktop: true,
  },
  {
    id: "sec_catalog",
    type: "NativeProductCatalog",
    title: "محصولات ویژه آکسون کور",
    subtitle: "با گارانتی اصالت طلایی و ارسال سریع",
    enabled: true,
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true,
  },
];

function normalizeProductRow(p: any) {
  if (!p || typeof p !== "object") return p;
  let rawDesc = String(p.description || "");
  let meta: Record<string, any> = {};
  const match = rawDesc.match(/<!--MEDIA_METADATA:([\\s\\S]*?)-->/);
  if (match && match[1]) {
    try { meta = JSON.parse(match[1]); } catch {}
    rawDesc = rawDesc.replace(/<!--MEDIA_METADATA:[\\s\\S]*?-->/g, "").trim();
  }
  const primaryImg =
    p.image || p.image_url ||
    (Array.isArray(p.images) && p.images[0]) ||
    (Array.isArray(meta.images) && meta.images[0]) ||
    "/placeholder.png";
  return {
    ...p,
    id: String(p.id),
    title: p.title || p.name || "کالای دیجیتال",
    image: primaryImg,
    image_url: primaryImg,
    images: Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : Array.isArray(meta.images) && meta.images.length > 0
      ? meta.images
      : [primaryImg],
    description: rawDesc,
  };
}

export default function DynamicHomeSections({
  initialProducts = [],
  initialBanners  = [],
  initialSiteInfo = null,
}: Props) {
  const { siteInfo: ctxSiteInfo } = useSiteInfo();
  const activeSiteInfo = ctxSiteInfo && Object.keys(ctxSiteInfo).length > 0 ? ctxSiteInfo : initialSiteInfo;
  const layoutCfg = activeSiteInfo?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
  const tbCfg     = activeSiteInfo?.theme_builder_config   || layoutCfg?.theme_builder_config || {};

  const bannerSizing: BannerSizingConfig = { ...DEFAULT_BANNER_SIZING, ...(tbCfg?.bannerSizing || layoutCfg?.bannerSizing || {}) };

  const [products, setProducts] = useState<any[]>(() => (initialProducts || []).map(normalizeProductRow));
  const [banners,  setBanners]  = useState<any[]>(initialBanners);
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchLiveHomeData = useCallback(async () => {
    try {
      const [pRes, bRes] = await Promise.all([
        fetch("/api/products",       { cache: "no-store" }).catch(() => null),
        fetch("/api/public/banners", { cache: "no-store" }).catch(() => null),
      ]);
      if (pRes?.ok) {
        const pJson = await pRes.json();
        const pList = pJson.data || pJson.products || [];
        if (Array.isArray(pList)) setProducts(pList.map(normalizeProductRow));
      }
      if (bRes?.ok) {
        const bJson = await bRes.json();
        const bList = (bJson.banners || bJson.data || []).filter((b: any) => b.is_active !== false);
        setBanners(bList);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (initialProducts.length === 0) fetchLiveHomeData();
    window.addEventListener("banners_updated",  fetchLiveHomeData);
    window.addEventListener("products_updated", fetchLiveHomeData);
    const ch = supabase
      .channel("realtime-home-unified")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchLiveHomeData)
      .on("postgres_changes", { event: "*", schema: "public", table: "banners"  }, fetchLiveHomeData)
      .subscribe();
    return () => {
      window.removeEventListener("banners_updated",  fetchLiveHomeData);
      window.removeEventListener("products_updated", fetchLiveHomeData);
      supabase.removeChannel(ch);
    };
  }, [fetchLiveHomeData, initialProducts.length]);

  const effectiveSlides = banners.length > 0
    ? banners.map((b: any) => ({
        id:       String(b.id),
        title:    b.title    || "پیشنهاد ویژه آکسون",
        subtitle: b.subtitle || "مشاهده مشخصات و خرید آنلاین با گارانتی اصالت",
        image:    b.image_url || b.image || "/placeholder.png",
        link:     b.link_url  || b.link  || "/products",
        price:    b.price ? Number(b.price) : null,
        badge:    b.badge_text || b.badge || "پیشنهاد ویژه",
        cta:      b.cta_text  || "مشاهده و خرید",
      }))
    : products.slice(0, 5).map((p: any) => ({
        id:       String(p.id),
        title:    p.title || p.name || "محصول ویژه",
        subtitle: p.short_description || (p.description ? String(p.description).slice(0, 110) : "خرید مستقیم با گارانتی اصالت"),
        image:    p.image || p.image_url || "/placeholder.png",
        link:     "/products/" + p.id,
        price:    Number(p.discount_price || p.discountPrice || p.price || 0),
        badge:    p.category || "ویژه",
        cta:      "مشاهده و خرید محصول",
      }));

  // آتو‌پلی دسکتاپ اسلایدر
  useEffect(() => {
    if (effectiveSlides.length <= 1) return;
    const t = setInterval(() => setActiveSlide(prev => (prev + 1) % effectiveSlides.length), 5000);
    return () => clearInterval(t);
  }, [effectiveSlides.length]);

  const rawSections: ResponsiveSectionItem[] =
    Array.isArray(tbCfg?.homeSections)    && tbCfg.homeSections.length > 0    ? tbCfg.homeSections    :
    Array.isArray(layoutCfg?.homeSections) && layoutCfg.homeSections.length > 0 ? layoutCfg.homeSections :
    DEFAULT_SECTIONS_ORDER;

  const renderSection = (sec: ResponsiveSectionItem) => {
    if (sec.enabled === false) return null;

    // ─── اسلایدر بنر ───────────────────────────────────────
    if (sec.type === "banners_slider") {
      if (effectiveSlides.length === 0) return null;
      return (
        <div key={sec.id}>
          {/* موبایل و تبلت: MobileSlider جدید */}
          <div className="block lg:hidden">
            <MobileSlider
              slides={effectiveSlides}
              config={{ height: bannerSizing.mobileHeight || 220, autoPlay: true, interval: 4500, showDots: true }}
            />
          </div>

          {/* دسکتاپ: اسلایدر کلاسیک با کارت glass */}
          <div className="hidden lg:block">
            <section className="relative w-full rounded-[2.5rem] overflow-hidden border border-[var(--card-border)] shadow-xl bg-[var(--modal-bg)] flex items-center"
              style={{ minHeight: bannerSizing.desktopHeight + "px" }}
            >
              {effectiveSlides.map((slide, idx) => {
                const isActive = idx === activeSlide;
                return (
                  <Link
                    key={slide.id + "_" + idx}
                    href={slide.link}
                    onClick={() => soundEngine.playClick()}
                    className={"w-full h-full transition-all duration-700 " + (isActive ? "opacity-100 relative z-10 block" : "opacity-0 absolute inset-0 z-0 pointer-events-none")}
                  >
                    <div className="flex flex-row items-center justify-between gap-8 p-10">
                      <div className="flex-1 min-w-0 space-y-3 text-right">
                        <span className="inline-block px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] text-xs font-black">
                          🔥 {slide.badge}
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-black leading-snug text-[var(--text-primary)] line-clamp-2">
                          {slide.title}
                        </h2>
                        {slide.subtitle && (
                          <p className="text-sm text-[var(--text-secondary)] line-clamp-2 max-w-xl">{slide.subtitle}</p>
                        )}
                        <div className="pt-2 flex items-center gap-4">
                          <span className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm shadow-md hover:opacity-90 transition inline-flex items-center gap-2">
                            <span>{slide.cta}</span><span>←</span>
                          </span>
                          {slide.price ? (
                            <span className="font-mono font-black text-lg text-emerald-500">{formatPrice(slide.price)} تومان</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center justify-center">
                        <div style={{ width: bannerSizing.desktopImageSize + "px", height: bannerSizing.desktopImageSize + "px" }}
                          className="rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] p-4 flex items-center justify-center overflow-hidden shadow-inner"
                        >
                          <img src={slide.image} alt={slide.title} className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {effectiveSlides.length > 1 && (
                <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                  {effectiveSlides.map((_, idx) => (
                    <button key={idx} type="button"
                      onClick={(e) => { e.preventDefault(); soundEngine.playClick(); setActiveSlide(idx); }}
                      className={"h-2 rounded-full transition-all cursor-pointer " + (idx === activeSlide ? "w-6 bg-[var(--accent-blue)]" : "w-2 bg-white/50")}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      );
    }

    // ─── اسلایدر سه‌بعدی (فقط دسکتاپ) ───────────────────
    if (sec.type === "NativePerspectiveSlider") {
      if (products.length === 0) return null;
      return (
        <div key={sec.id} className="hidden lg:block">
          <ProductPerspectiveSlider products={products} customTitle={sec.title} customSubtitle={sec.subtitle} />
        </div>
      );
    }

    // ─── کاتالوگ محصولات ───────────────────────────────────
    if (sec.type === "NativeProductCatalog") {
      return (
        <div key={sec.id}>
          <ProductList initialProducts={products} customHeading={sec.title} customSubtitle={sec.subtitle} />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-10 pb-32 md:pb-16 font-sans select-text"
      dir="rtl"
    >
      {rawSections.map((sec: any) => renderSection(sec))}
    </div>
  );
}
`;

// ═══════════════════════════════════════════════════════════
// نوشتن فایل‌ها
// ═══════════════════════════════════════════════════════════
const files = [
  ["app/globals.css",                    GLOBALS_CSS],
  ["components/AIAssistantChat.tsx",     AI_ASSISTANT_CHAT_TSX],
  ["components/CartDrawer.tsx",          CART_DRAWER_TSX],
  ["components/MobileSlider.tsx",        MOBILE_SLIDER_TSX],
  ["components/DynamicHomeSections.tsx", DYNAMIC_HOME_SECTIONS_TSX],
];

for (const [rel, content] of files) {
  const full = R(rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("✅ نوشته شد:", rel);
}

// تأیید اولیه
console.log("\n═══ تأیید ═══");
const css = fs.readFileSync(R("app/globals.css"), "utf8");
const chatCount = (css.match(/\.ai-chat-float-btn/g) || []).length;
console.log(".ai-chat-float-btn تعداد:", chatCount, chatCount === 3 ? "✅" : "❌ باید 3 باشد");
const aiFile = fs.readFileSync(R("components/AIAssistantChat.tsx"), "utf8");
console.log("AIAssistantChat bottom:80px:", aiFile.includes('bottom:   "80px"') ? "✅" : "❌");
const dhs = fs.readFileSync(R("components/DynamicHomeSections.tsx"), "utf8");
console.log("DynamicHomeSections MobileSlider import:", dhs.includes('import MobileSlider') ? "✅" : "❌");
console.log("DynamicHomeSections block lg:hidden:", dhs.includes('block lg:hidden') ? "✅" : "❌");

// ─── Build ────────────────────────────────────────────────
console.log("\n🔨 Build شروع شد...\n");
try {
  execSync("npm run build", { stdio: "inherit" });
} catch (err) {
  console.error("\n❌ Build ناموفق — commit لغو شد");
  process.exit(1);
}
console.log("\n✅ Build موفق");

// ─── Git ──────────────────────────────────────────────────
const msg = [
  "fix(mobile): complete mobile fixes — slider, chat btn, cart drawer",
  "",
  "- MobileSlider: standalone touch-swipe slider for mobile/tablet",
  "- DynamicHomeSections: MobileSlider on mobile, classic on desktop",
  "- globals.css: single clean .ai-chat-float-btn at bottom:80px",
  "- AIAssistantChat: inline style + class for reliable positioning",
  "- CartDrawer: z-[200] + proper footer padding, gradient CTA btn",
  "",
  "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>",
  "Claude-Session: https://claude.ai/code/session_01GPCkucxnVMX9p4m8F7jjL4",
].join("\n");

fs.writeFileSync(".git/AXON_COMMIT.txt", msg, "utf8");
execSync("git add -A");
execSync('git commit -F ".git/AXON_COMMIT.txt"');
execSync("git push origin main");
console.log("\n🚀 Push شد — Vercel در حال deploy است!");