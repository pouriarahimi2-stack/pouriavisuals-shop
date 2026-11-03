"use client";
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
