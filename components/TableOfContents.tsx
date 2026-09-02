// File Path: components/TableOfContents.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ contentHtml }: { contentHtml: string }) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!contentHtml) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(contentHtml, "text/html");
      const headingElements = doc.querySelectorAll("h2, h3");

      const items: TocItem[] = [];
      headingElements.forEach((el, index) => {
        const text = el.textContent?.trim() || "";
        if (text) {
          const id = "toc-heading-" + index;
          items.push({
            id,
            text,
            level: el.tagName.toLowerCase() === "h2" ? 2 : 3,
          });
        }
      });

      setHeadings(items);
      if (items.length > 0) setActiveId(items[0].id);
    } catch {}
  }, [contentHtml]);

  const scrollToHeading = (id: string, index: number) => {
    soundEngine.playClick();
    setActiveId(id);

    const articleHeadings = document.querySelectorAll("article h2, article h3, .blog-content h2, .blog-content h3");
    if (articleHeadings[index]) {
      articleHeadings[index].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className="my-6 p-5 sm:p-6 rounded-3xl bg-[var(--stitch-card)] border border-[var(--card-border)] shadow-md space-y-3 font-sans select-none" dir="rtl">
      <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📑</span>
          <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
            فهرست دسترسی سریع به بخش‌های مقاله (Table of Contents)
          </h4>
        </div>
        <button
          type="button"
          onClick={() => { soundEngine.playClick(); setIsOpen(!isOpen); }}
          className="text-xs font-bold text-[var(--accent-blue)] hover:underline cursor-pointer"
        >
          {isOpen ? "بستن فهرست ▲" : "نمایش فهرست ▼"}
        </button>
      </div>

      {isOpen && (
        <ul className="space-y-2 text-xs pt-1">
          {headings.map((item, idx) => (
            <li
              key={item.id}
              onClick={() => scrollToHeading(item.id, idx)}
              className={`cursor-pointer transition flex items-center gap-2 p-1.5 rounded-xl ${
                item.level === 3 ? "pr-5 text-[11px]" : "font-bold"
              } ${
                activeId === item.id
                  ? "text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 font-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] shrink-0" />
              <span className="truncate">{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
