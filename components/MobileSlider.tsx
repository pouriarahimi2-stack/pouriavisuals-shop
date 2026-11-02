"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

export interface MobileSlide {
  id: string | number;
  title?: string;
  subtitle?: string;
  image?: string;
  link?: string;
  price?: number | null;
  badge?: string;
  cta?: string;
  gradient?: string;
}

interface SliderConfig {
  autoPlay?: boolean;
  interval?: number;
  height?: number;
  showDots?: boolean;
  borderRadius?: number;
}

interface Props {
  slides: MobileSlide[];
  config?: SliderConfig;
}

const GRADS = [
  "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)",
  "linear-gradient(135deg,#000428 0%,#004e92 100%)",
  "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
  "linear-gradient(135deg,#0d0d0d 0%,#1a0533 50%,#2d1b69 100%)",
  "linear-gradient(135deg,#141e30 0%,#243b55 100%)",
];

export default function MobileSlider({ slides, config = {} }: Props) {
  const {
    autoPlay   = true,
    interval   = 4200,
    height     = 224,
    showDots   = true,
    borderRadius = 20,
  } = config;

  const [active,  setActive]  = useState(0);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startX    = useRef(0);
  const startY    = useRef(0);
  const dragging  = useRef(false);

  const goTo = useCallback((i: number) => {
    setActive(((i % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  const startTimer = useCallback(() => {
    if (!autoPlay || slides.length <= 1) return;
    timerRef.current = setInterval(
      () => setActive(p => (p + 1) % slides.length),
      interval
    );
  }, [autoPlay, interval, slides.length]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => { startTimer(); return stopTimer; }, [startTimer, stopTimer]);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current   = e.touches[0].clientX;
    startY.current   = e.touches[0].clientY;
    dragging.current = true;
    stopTimer();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = startX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(startY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 44 && dy < 70) goTo(dx > 0 ? active + 1 : active - 1);
    startTimer();
  };

  if (!slides.length) return null;

  return (
    <div
      style={{
        height,
        borderRadius,
        overflow: "hidden",
        position: "relative",
        direction: "rtl",
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
      } as React.CSSProperties}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((s, i) => {
        const grad = s.gradient || GRADS[i % GRADS.length];
        const isActive = i === active;
        return (
          <div
            key={s.id}
            aria-hidden={!isActive}
            style={{
              position:    "absolute",
              inset:       0,
              background:  grad,
              opacity:     isActive ? 1 : 0,
              transition:  "opacity 0.52s cubic-bezier(.4,0,.2,1)",
              pointerEvents: isActive ? "auto" : "none",
              display:     "flex",
              alignItems:  "center",
              padding:     "0 20px",
              gap:         14,
            }}
          >
            {/* متن */}
            <div style={{ flex: "1 1 56%", minWidth: 0, paddingRight: 4 }}>
              {s.badge && (
                <div style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  marginBottom:   8,
                  padding:        "3px 10px",
                  borderRadius:   9999,
                  background:     "rgba(255,255,255,.18)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border:         "1px solid rgba(255,255,255,.28)",
                  color:          "#fff",
                  fontSize:       10,
                  fontWeight:     700,
                }}>
                  {s.badge}
                </div>
              )}
              {s.title && (
                <h2 style={{
                  margin:      "0 0 6px",
                  color:       "#fff",
                  fontSize:    "clamp(14px,3.8vw,20px)",
                  fontWeight:  800,
                  lineHeight:  1.3,
                  textShadow:  "0 2px 10px rgba(0,0,0,.6)",
                  overflow:    "hidden",
                  display:     "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                } as React.CSSProperties}>
                  {s.title}
                </h2>
              )}
              {s.subtitle && (
                <p style={{
                  margin:      "0 0 14px",
                  color:       "rgba(255,255,255,.78)",
                  fontSize:    "clamp(10px,2.8vw,13px)",
                  lineHeight:  1.5,
                  overflow:    "hidden",
                  display:     "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                } as React.CSSProperties}>
                  {s.subtitle}
                </p>
              )}
              {s.cta && (
                <a
                  href={s.link || "#"}
                  onClick={e => !s.link && e.preventDefault()}
                  style={{
                    display:        "inline-flex",
                    alignItems:     "center",
                    gap:            4,
                    background:     "rgba(255,255,255,.2)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    color:          "#fff",
                    fontSize:       12,
                    fontWeight:     700,
                    padding:        "7px 18px",
                    borderRadius:   9999,
                    border:         "1px solid rgba(255,255,255,.32)",
                    textDecoration: "none",
                    whiteSpace:     "nowrap",
                  }}
                >
                  {s.cta}
                  <span style={{ fontSize: 14, opacity: 0.8 }}>←</span>
                </a>
              )}
            </div>

            {/* تصویر */}
            {s.image && s.image !== "/placeholder.png" && (
              <div style={{ flex: "0 0 38%", height: "82%", position: "relative", flexShrink: 0 }}>
                <img
                  src={s.image}
                  alt={s.title || ""}
                  loading="lazy"
                  style={{
                    width:  "100%",
                    height: "100%",
                    objectFit:   "contain",
                    filter: "drop-shadow(0 6px 22px rgba(0,0,0,.55))",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* نشانگرها (dots) */}
      {showDots && slides.length > 1 && (
        <div style={{
          position:  "absolute",
          bottom:    10,
          left:      "50%",
          transform: "translateX(-50%)",
          display:   "flex",
          gap:       5,
          zIndex:    10,
        }}>
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`اسلاید ${i + 1}`}
              onClick={() => { stopTimer(); goTo(i); startTimer(); }}
              style={{
                width:        i === active ? 20 : 6,
                height:       6,
                borderRadius: 9999,
                background:   i === active ? "#fff" : "rgba(255,255,255,.38)",
                border:       "none",
                padding:      0,
                cursor:       "pointer",
                transition:   "all .3s ease",
                flexShrink:   0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
