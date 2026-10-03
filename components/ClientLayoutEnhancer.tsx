// File Path: components/ClientLayoutEnhancer.tsx
"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

const DRAFT_STORAGE_PREFIX = "axon_form_memory_v2026_";

export function ClientLayoutEnhancer({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;
    const storageKey = DRAFT_STORAGE_PREFIX + pathname;

    const getFieldKey = (
      el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
      idx: number
    ) => {
      return el.name || el.id || el.getAttribute("placeholder") || "field_" + idx;
    };

    const isSafeToPersist = (el: HTMLElement): boolean => {
      if (el instanceof HTMLInputElement) {
        const t = (el.type || "text").toLowerCase();
        if (
          t === "password" ||
          t === "file" ||
          t === "hidden" ||
          t === "submit" ||
          t === "button" ||
          t === "checkbox" ||
          t === "radio"
        ) {
          return false;
        }
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
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value"
            )?.set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype,
              "value"
            )?.set;

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
      const target = e.target as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null;
      if (!target || !isSafeToPersist(target)) return;
      try {
        const elements = Array.from(
          document.querySelectorAll<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >("input, textarea, select")
        );
        const idx = elements.indexOf(target);
        const k = getFieldKey(target, idx >= 0 ? idx : 0);
        const raw = localStorage.getItem(storageKey);
        const savedMap = raw ? JSON.parse(raw) : {};
        savedMap[k] = target.value;
        localStorage.setItem(storageKey, JSON.stringify(savedMap));
      } catch {}
    };

    document.addEventListener("input", handleInput, true);
    document.addEventListener("change", handleInput, true);

    return () => {
      clearTimeout(restoreTimer);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("change", handleInput, true);
    };
  }, [pathname]);

  return <>{children}</>;
}

export default ClientLayoutEnhancer;
