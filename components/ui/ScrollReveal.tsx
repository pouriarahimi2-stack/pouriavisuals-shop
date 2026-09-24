"use client";
import { useEffect, useRef, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  type?: "slide" | "scale" | "right" | "fade";
  threshold?: number;
}

const TYPE_CLASS = {
  slide: "axon-reveal",
  scale: "axon-reveal-scale",
  right: "axon-reveal-right",
  fade:  "axon-reveal",
};

export default function ScrollReveal({ children, className = "", delay = 0, type = "slide", threshold = 0.12 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("revealed"), delay);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <div ref={ref} className={TYPE_CLASS[type] + " " + className}>
      {children}
    </div>
  );
}

// ── StaggerReveal: برای گرید محصولات ────────────────────────────
interface StaggerProps { children: ReactNode[]; className?: string; type?: "slide"|"scale"; }
export function StaggerReveal({ children, className = "", type = "scale" }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <ScrollReveal key={i} type={type} delay={i * 55} threshold={0.08}>
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}