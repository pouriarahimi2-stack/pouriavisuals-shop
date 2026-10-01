// File Path: components/MotionInit.tsx
"use client";

import React, { useEffect } from "react";

export function MotionInit(_props?: any) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    // تزریق استایل‌ها و میکرو-اینتراکشن‌های مدرن الهام‌گرفته از 21st.dev و motionsites.ai
    let styleEl = document.getElementById("axon-21st-motion-engine") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "axon-21st-motion-engine";
      styleEl.textContent = [
        ":root { --mouse-x: 50vw; --mouse-y: 50vh; }",
        "@keyframes axonFloatGlow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }",
        "@keyframes axonPulseBorder { 0%, 100% { border-color: rgba(56, 189, 248, 0.22); } 50% { border-color: rgba(56, 189, 248, 0.55); } }",
        "button, a, input, select, textarea { transition: all 0.24s cubic-bezier(0.22, 1, 0.36, 1); }",
        "button:active { transform: scale(0.97); }",
        ".group:hover { box-shadow: 0 14px 40px -12px rgba(2, 132, 199, 0.22); }",
      ].join("\n");
      document.head.appendChild(styleEl);
    }

    const handlePointerMove = (e: PointerEvent) => {
      document.documentElement.style.setProperty("--mouse-x", e.clientX + "px");
      document.documentElement.style.setProperty("--mouse-y", e.clientY + "px");
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return null;
}

export default MotionInit;
