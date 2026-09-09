"use client";

import { useEffect } from "react";

export default function ElementorVisualBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.self === window.top) return;

    let selectedElement: HTMLElement | null = null;
    let overlay: HTMLDivElement | null = null;

    const createOverlay = () => {
      overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.pointerEvents = "none";
      overlay.style.border = "2px solid #38bdf8";
      overlay.style.backgroundColor = "rgba(56, 189, 248, 0.08)";
      overlay.style.zIndex = "999998";
      overlay.style.display = "none";
      overlay.style.borderRadius = "8px";
      overlay.style.transition = "all 0.1s ease";
      document.body.appendChild(overlay);
    };

    const updateOverlay = () => {
      if (!selectedElement || !overlay) return;
      const rect = selectedElement.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      overlay.style.top = (rect.top + scrollTop - 2) + "px";
      overlay.style.left = (rect.left + scrollLeft - 2) + "px";
      overlay.style.width = (rect.width + 4) + "px";
      overlay.style.height = (rect.height + 4) + "px";
      overlay.style.display = "block";
    };

    createOverlay();

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === overlay) return;

      e.preventDefault();
      e.stopPropagation();

      selectedElement = target;
      if (["P", "H1", "H2", "H3", "H4", "H5", "SPAN", "BUTTON", "A"].includes(target.tagName)) {
        target.contentEditable = "true";
        target.focus();
      }

      updateOverlay();

      const computed = window.getComputedStyle(target);
      window.parent.postMessage({
        type: "AXON_ELEMENT_SELECTED",
        payload: {
          tagName: target.tagName,
          text: target.innerText ? target.innerText.slice(0, 50) : "",
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: parseInt(computed.fontSize, 10) || 16,
          fontWeight: computed.fontWeight,
          borderRadius: parseInt(computed.borderRadius, 10) || 0,
          paddingTop: parseInt(computed.paddingTop, 10) || 0,
          paddingBottom: parseInt(computed.paddingBottom, 10) || 0,
          paddingLeft: parseInt(computed.paddingLeft, 10) || 0,
          paddingRight: parseInt(computed.paddingRight, 10) || 0,
          marginTop: parseInt(computed.marginTop, 10) || 0,
          marginBottom: parseInt(computed.marginBottom, 10) || 0,
        }
      }, "*");
    };

    // دریافت دستورات تغییر زنده استایل از سایدبار پنل ادمین
    const handleAdminMessage = (e: MessageEvent) => {
      if (!selectedElement) return;

      if (e.data?.type === "AXON_APPLY_STYLE") {
        const { key, value } = e.data.payload || {};
        if (key && value !== undefined) {
          (selectedElement.style as any)[key] = value;
          updateOverlay();
        }
      }

      if (e.data?.type === "AXON_ELEMENT_ACTION") {
        const { action } = e.data || {};
        if (action === "delete") {
          selectedElement.style.display = "none";
          if (overlay) overlay.style.display = "none";
          selectedElement = null;
        } else if (action === "moveUp" && selectedElement.parentElement) {
          const prev = selectedElement.previousElementSibling;
          if (prev) {
            selectedElement.parentElement.insertBefore(selectedElement, prev);
            updateOverlay();
          }
        } else if (action === "moveDown" && selectedElement.parentElement) {
          const next = selectedElement.nextElementSibling;
          if (next) {
            selectedElement.parentElement.insertBefore(next, selectedElement);
            updateOverlay();
          }
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("scroll", updateOverlay);
    window.addEventListener("resize", updateOverlay);
    window.addEventListener("message", handleAdminMessage);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("scroll", updateOverlay);
      window.removeEventListener("resize", updateOverlay);
      window.removeEventListener("message", handleAdminMessage);
      if (overlay) overlay.remove();
    };
  }, []);

  return null;
}
