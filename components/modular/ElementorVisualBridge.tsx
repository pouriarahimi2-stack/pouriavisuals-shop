"use client";

import { useEffect } from "react";

export default function ElementorVisualBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.self === window.top) return;

    let selectedElement: HTMLElement | null = null;
    let overlay: HTMLDivElement | null = null;
    let toolbar: HTMLDivElement | null = null;

    const createInspectorUI = () => {
      overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.pointerEvents = "none";
      overlay.style.border = "2px dashed #0284c7";
      overlay.style.backgroundColor = "rgba(2, 132, 199, 0.08)";
      overlay.style.zIndex = "999998";
      overlay.style.display = "none";
      overlay.style.transition = "all 0.15s ease";
      document.body.appendChild(overlay);

      toolbar = document.createElement("div");
      toolbar.style.position = "absolute";
      toolbar.style.zIndex = "999999";
      toolbar.style.display = "none";
      toolbar.style.gap = "4px";
      toolbar.style.backgroundColor = "#0f172a";
      toolbar.style.border = "1px solid #38bdf8";
      toolbar.style.borderRadius = "12px";
      toolbar.style.padding = "4px 8px";
      toolbar.style.boxShadow = "0 10px 25px rgba(0,0,0,0.5)";
      
      const btnScaleUp = document.createElement("button");
      btnScaleUp.innerText = "➕ بزرگتر";
      btnScaleUp.style.cssText = "background:#1e293b; color:#fff; border:none; border-radius:6px; padding:3px 8px; cursor:pointer; font-size:11px; font-weight:bold;";

      const btnScaleDown = document.createElement("button");
      btnScaleDown.innerText = "➖ کوچکتر";
      btnScaleDown.style.cssText = "background:#1e293b; color:#fff; border:none; border-radius:6px; padding:3px 8px; cursor:pointer; font-size:11px; font-weight:bold;";

      const btnUp = document.createElement("button");
      btnUp.innerText = "▲";
      btnUp.style.cssText = "background:#1e293b; color:#fff; border:none; border-radius:6px; padding:3px 8px; cursor:pointer; font-size:11px;";

      const btnDown = document.createElement("button");
      btnDown.innerText = "▼";
      btnDown.style.cssText = "background:#1e293b; color:#fff; border:none; border-radius:6px; padding:3px 8px; cursor:pointer; font-size:11px;";

      const btnDel = document.createElement("button");
      btnDel.innerText = "🗑️";
      btnDel.style.cssText = "background:#f43f5e; color:#fff; border:none; border-radius:6px; padding:3px 8px; cursor:pointer; font-size:11px; font-weight:bold;";

      toolbar.appendChild(btnScaleUp);
      toolbar.appendChild(btnScaleDown);
      toolbar.appendChild(btnUp);
      toolbar.appendChild(btnDown);
      toolbar.appendChild(btnDel);

      document.body.appendChild(toolbar);

      btnScaleUp.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!selectedElement) return;
        const currentScale = parseFloat(selectedElement.getAttribute("data-axon-scale") || "1");
        const nextScale = (currentScale + 0.1).toFixed(1);
        selectedElement.setAttribute("data-axon-scale", nextScale);
        selectedElement.style.transform = "scale(" + nextScale + ")";
        selectedElement.style.transformOrigin = "center center";
        updateUI();
        notifyAdmin("resize", { scale: nextScale });
      });

      btnScaleDown.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!selectedElement) return;
        const currentScale = parseFloat(selectedElement.getAttribute("data-axon-scale") || "1");
        const nextScale = Math.max(0.5, currentScale - 0.1).toFixed(1);
        selectedElement.setAttribute("data-axon-scale", nextScale);
        selectedElement.style.transform = "scale(" + nextScale + ")";
        selectedElement.style.transformOrigin = "center center";
        updateUI();
        notifyAdmin("resize", { scale: nextScale });
      });

      btnUp.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!selectedElement || !selectedElement.parentElement) return;
        const prev = selectedElement.previousElementSibling;
        if (prev) {
          selectedElement.parentElement.insertBefore(selectedElement, prev);
          updateUI();
          notifyAdmin("reorder", { dir: "up" });
        }
      });

      btnDown.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!selectedElement || !selectedElement.parentElement) return;
        const next = selectedElement.nextElementSibling;
        if (next) {
          selectedElement.parentElement.insertBefore(next, selectedElement);
          updateUI();
          notifyAdmin("reorder", { dir: "down" });
        }
      });

      btnDel.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!selectedElement) return;
        selectedElement.style.display = "none";
        hideUI();
        notifyAdmin("delete", {});
      });
    };

    const updateUI = () => {
      if (!selectedElement || !overlay || !toolbar) return;
      const rect = selectedElement.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      overlay.style.top = (rect.top + scrollTop) + "px";
      overlay.style.left = (rect.left + scrollLeft) + "px";
      overlay.style.width = rect.width + "px";
      overlay.style.height = rect.height + "px";
      overlay.style.display = "block";

      toolbar.style.top = Math.max(10, rect.top + scrollTop - 38) + "px";
      toolbar.style.left = (rect.left + scrollLeft) + "px";
      toolbar.style.display = "flex";
    };

    const hideUI = () => {
      if (overlay) overlay.style.display = "none";
      if (toolbar) toolbar.style.display = "none";
      selectedElement = null;
    };

    const notifyAdmin = (action: string, payload: any) => {
      window.parent.postMessage({ type: "AXON_ELEMENT_MUTATED", action, payload }, "*");
    };

    createInspectorUI();

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest("button") === toolbar?.querySelector("button")) return;
      if (toolbar && toolbar.contains(target)) return;

      e.preventDefault();
      e.stopPropagation();

      selectedElement = target;
      if (["P", "H1", "H2", "H3", "H4", "SPAN", "BUTTON", "A"].includes(target.tagName)) {
        target.contentEditable = "true";
        target.style.outline = "2px solid #38bdf8";
        target.focus();
      }

      updateUI();
      window.parent.postMessage({
        type: "AXON_ELEMENT_SELECTED",
        tagName: target.tagName,
        text: target.innerText ? target.innerText.slice(0, 40) : ""
      }, "*");
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("scroll", updateUI);
    window.addEventListener("resize", updateUI);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("scroll", updateUI);
      window.removeEventListener("resize", updateUI);
      if (overlay) overlay.remove();
      if (toolbar) toolbar.remove();
    };
  }, []);

  return null;
}
