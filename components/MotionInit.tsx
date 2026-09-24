"use client";
import { useEffect } from "react";

/**
 * MotionInit — کامپوننت سراسری انیمیشن
 * روی همه المان‌هایی که کلاس axon-reveal* دارن IntersectionObserver اعمال میکنه
 * در layout.tsx یک‌بار اضافه میشه و کل سایت رو پوشش میده
 */
export default function MotionInit() {
  useEffect(() => {
    const SELECTORS = ".axon-reveal, .axon-reveal-scale, .axon-reveal-right";

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );

    const observe = () => {
      document.querySelectorAll(SELECTORS).forEach((el) => {
        if (!el.classList.contains("revealed")) io.observe(el);
      });
    };

    // اول اجرا
    observe();

    // برای محتوای dynamic که بعداً لود میشه
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, []);

  return null;
}