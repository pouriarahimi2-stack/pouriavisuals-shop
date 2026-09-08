"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

export interface DockKeyItem {
  id: string;
  letter: string;
  title: string;
  url: string;
}

const DEFAULT_DOCK_KEYS: DockKeyItem[] = [
  { id: "k1", letter: "C", title: "تماس تلفنی", url: "tel:02188888888" },
  { id: "k2", letter: "O", title: "سفارش‌ها", url: "/track-order" },
  { id: "k3", letter: "N", title: "اخبار سخت‌افزار", url: "/news" },
  { id: "k4", letter: "T", title: "تلگرام پشتیبانی", url: "https://t.me/axoncore" },
  { id: "k5", letter: "A", title: "درباره استودیو", url: "/about" },
  { id: "k6", letter: "C", title: "مشاوره آنلاین", url: "/contact" },
  { id: "k7", letter: "T", title: "محصولات برتر", url: "/products" },
];

export default function ContactDock() {
  const [dockKeys, setDockKeys] = useState<DockKeyItem[]>(DEFAULT_DOCK_KEYS);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const loadDockSettings = async () => {
    try {
      const info = await siteInfoService.getSiteInfo();
      if (info && (info as any).contact_dock_items && Array.isArray((info as any).contact_dock_items) && (info as any).contact_dock_items.length > 0) {
        setDockKeys((info as any).contact_dock_items);
      }
    } catch {}
  };

  useEffect(() => {
    loadDockSettings();

    // شنونده رویدادهای محلی
    const handleUpdate = (e: any) => {
      if (e.detail?.contact_dock_items && Array.isArray(e.detail.contact_dock_items)) {
        setDockKeys(e.detail.contact_dock_items);
      } else {
        loadDockSettings();
      }
    };
    window.addEventListener("site_info_updated", handleUpdate);

    // وب‌سوکت بلادرنگ CDC دیتابیس Supabase
    const channel = supabase
      .channel("realtime-dock-keys")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        loadDockSettings();
      })
      .subscribe();

    return () => {
      window.removeEventListener("site_info_updated", handleUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  if (dockKeys.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-3 font-sans select-none py-4" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
        <span className="text-xs font-black text-[var(--text-primary)]">شبکه‌های ارتباطی و اجتماعی استودیو:</span>
      </div>

      <div className="p-2.5 px-4 rounded-full bg-slate-950/80 border border-slate-800/80 shadow-2xl backdrop-blur-2xl flex items-center gap-2 relative overflow-visible">
        {dockKeys.map((k) => {
          const isHovered = hoveredKey === k.id;
          return (
            <div key={k.id} className="relative group">
              <a
                href={k.url || "#"}
                target={k.url?.startsWith("http") ? "_blank" : "_self"}
                rel="noreferrer"
                onMouseEnter={() => {
                  soundEngine.playClick();
                  setHoveredKey(k.id);
                }}
                onMouseLeave={() => setHoveredKey(null)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900/90 border border-slate-700/60 hover:border-[var(--accent-blue)] text-white hover:text-[var(--accent-blue)] flex items-center justify-center font-black text-sm transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-lg shadow-black/40 cursor-pointer"
              >
                <span>{k.letter}</span>
              </a>

              {/* تولتیپ سه بعدی عنوان کلید */}
              {isHovered && (
                <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-white text-[10px] font-bold whitespace-nowrap shadow-xl animate-fadeIn z-50 pointer-events-none">
                  {k.title}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <span className="text-[10px] text-slate-400 font-medium">
        روی کلیدها نگه دارید تا فلیپ سه‌بعدی فعال شود
      </span>
    </div>
  );
}
