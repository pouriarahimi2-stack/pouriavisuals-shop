// File Path: components/ClientLayoutEnhancer.tsx
"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DRAFT_STORAGE_PREFIX = "axon_form_memory_v2026_";

export function ClientLayoutEnhancer({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  // ۱. حافظه هوشمند فرم‌ها در کل سایت (ضد رفرش و ضد قطعی اینترنت)
  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;
    const storageKey = DRAFT_STORAGE_PREFIX + pathname;

    const getFieldKey = (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, idx: number) => {
      return el.name || el.id || el.getAttribute("placeholder") || ("field_" + idx);
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
        if (el.maxLength === 1) return false; // عدم ذخیره تک‌کاراکترهای OTP
      }
      return true;
    };

    // بازیابی مقادیر ذخیره‌شده پس از رفرش صفحه
    const restoreTimer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        const savedMap = JSON.parse(raw);
        if (!savedMap || typeof savedMap !== "object") return;

        const elements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          "input, textarea, select"
        );
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

    // ذخیره خودکار در لحظه تایپ
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (!target || !isSafeToPersist(target)) return;
      try {
        const elements = Array.from(
          document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
            "input, textarea, select"
          )
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

  // ۲. همگام‌سازی وب‌سوکت استایل‌ها و فاوآیکون در کل سایت (دسکتاپ، موبایل و تبلت)
  useEffect(() => {
    const syncGlobalStylesAndFavicon = async () => {
      try {
        const [stylesRes, themeRes] = await Promise.all([
          fetch("/api/styles", { cache: "no-store" }).catch(() => null),
          fetch("/api/theme-builder", { cache: "no-store" }).catch(() => null),
        ]);

        if (stylesRes && stylesRes.ok) {
          const sJson = await stylesRes.json();
          const st = sJson.data;
          if (st && typeof document !== "undefined") {
            const root = document.documentElement;
            if (st.primary_color) root.style.setProperty("--accent-blue", st.primary_color);
            if (st.secondary_color) root.style.setProperty("--secondary-color", st.secondary_color);
            if (st.border_radius) root.style.setProperty("--card-radius", st.border_radius);
            if (st.font_family) root.style.setProperty("--font-sans", st.font_family + ", sans-serif");

            let styleTag = document.getElementById("axon-live-custom-css") as HTMLStyleElement | null;
            if (!styleTag) {
              styleTag = document.createElement("style");
              styleTag.id = "axon-live-custom-css";
              document.head.appendChild(styleTag);
            }
            styleTag.textContent = st.custom_css || "";
          }
        }

        if (themeRes && themeRes.ok) {
          const tJson = await themeRes.json();
          const fav =
            tJson?.config?.globalHeader?.faviconUrl || tJson?.config?.globalHeader?.logoUrl;
          if (fav && typeof document !== "undefined") {
            const links = document.querySelectorAll("link[rel*='icon']");
            if (links.length > 0) {
              links.forEach((el) => {
                (el as HTMLLinkElement).href = fav;
              });
            }
          }
        }
      } catch {}
    };

    syncGlobalStylesAndFavicon();

    const chStyles = supabase
      .channel("realtime-global-styles-enhancer")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_styles" }, () => {
        syncGlobalStylesAndFavicon();
      })
      .subscribe();

    const chSiteInfo = supabase
      .channel("realtime-global-siteinfo-enhancer")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        syncGlobalStylesAndFavicon();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chStyles);
      supabase.removeChannel(chSiteInfo);
    };
  }, []);

  return <>{children}</>;
}

export default ClientLayoutEnhancer;
