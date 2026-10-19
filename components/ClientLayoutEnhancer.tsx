// File Path: components/ClientLayoutEnhancer.tsx
"use client";
import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const DRAFT_STORAGE_PREFIX = "axon_form_memory_v2026_";

/** تشخیص دستگاه از User-Agent مرورگر */
function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) return "mobile";
  return "desktop";
}

/** تشخیص منبع ورودی از Referrer و UTM */
function getTrafficSource(): { source: string; referrer: string; utm_source: string } {
  if (typeof document === "undefined") return { source: "direct", referrer: "", utm_source: "" };
  const ref = (document.referrer || "").toLowerCase();
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const utm = (params.get("utm_source") || "").toLowerCase();

  let source: string;
  if (utm === "torob" || ref.includes("torob.com")) source = "torob";
  else if (ref.includes("google.") || utm === "google" || ref.includes("bing.") || ref.includes("yahoo.") || ref.includes("yandex.") || ref.includes("duckduckgo.")) source = "google";
  else if (!ref || ref === "" || utm === "direct") source = "direct";
  else source = "referral";

  return { source, referrer: document.referrer, utm_source: utm };
}

export function ClientLayoutEnhancer({ children }: { children?: React.ReactNode }) {
  const pathname    = usePathname();
  const beaconSent  = useRef(false);

  // ─── beacon: ارسال یک‌بار در بارگذاری صفحه ───
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname?.startsWith("/admin"))    return;
    if (beaconSent.current)               return;
    beaconSent.current = true;

    const device = getDeviceType();
    const { referrer, utm_source } = getTrafficSource();

    fetch("/api/analytics/device", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ device, event: "view", referrer, utm_source }),
      // keepalive تا در unload هم ارسال بشه
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  // ─── form memory persistence ───
  useEffect(() => {
    if (typeof window === "undefined" || !pathname || pathname.startsWith("/admin")) return;

    const storageKey = DRAFT_STORAGE_PREFIX + pathname;
    const getFieldKey = (
      el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
      idx: number
    ) => el.name || el.id || el.getAttribute("placeholder") || "field_" + idx;

    const isSafeToPersist = (el: HTMLElement): boolean => {
      if (el instanceof HTMLInputElement) {
        const t = (el.type || "text").toLowerCase();
        if (["password", "file", "hidden", "submit", "button", "checkbox", "radio"].includes(t)) return false;
        if (el.maxLength === 1) return false;
      }
      return true;
    };

    const restoreTimer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        const savedMap = JSON.parse(raw);
        if (!savedMap || typeof savedMap !== "object") return;
        const elements = document.querySelectorAll<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >("input, textarea, select");
        elements.forEach((el, idx) => {
          if (!isSafeToPersist(el)) return;
          const k = getFieldKey(el, idx);
          if (savedMap[k] !== undefined && savedMap[k] !== "" && !el.value) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
            if (el instanceof HTMLInputElement && nativeInputValueSetter) {
              nativeInputValueSetter.call(el, savedMap[k]);
              el.dispatchEvent(new Event("input", { bubbles: true }));
            } else if (el instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
              nativeTextAreaValueSetter.call(el, savedMap[k]);
              el.dispatchEvent(new Event("input", { bubbles: true }));
            } else {
              el.value = savedMap[k];
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        });
      } catch {}
    }, 250);

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (!target || !isSafeToPersist(target)) return;
      try {
        const elements = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select"));
        const idx = elements.indexOf(target);
        const k = getFieldKey(target, idx >= 0 ? idx : 0);
        const raw = localStorage.getItem(storageKey);
        const savedMap = raw ? JSON.parse(raw) : {};
        savedMap[k] = target.value;
        localStorage.setItem(storageKey, JSON.stringify(savedMap));
      } catch {}
    };

    document.addEventListener("input",  handleInput, true);
    document.addEventListener("change", handleInput, true);

    return () => {
      clearTimeout(restoreTimer);
      document.removeEventListener("input",  handleInput, true);
      document.removeEventListener("change", handleInput, true);
    };
  }, [pathname]);

  return <>{children}</>;
}

export default ClientLayoutEnhancer;
