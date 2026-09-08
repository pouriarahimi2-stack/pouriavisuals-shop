"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

export interface DockKeyItem {
  id: string;
  letter: string;
  title: string;
  icon?: string;
  url: string;
}

const DEFAULT_DOCK_KEYS: DockKeyItem[] = [
  { id: "k1", letter: "C", title: "تماس تلفنی", icon: "📞", url: "tel:09376110200" },
  { id: "k2", letter: "O", title: "رهگیری سفارشات", icon: "📦", url: "/track-order" },
  { id: "k3", letter: "N", title: "اخبار استودیو", icon: "⚡", url: "/news" },
  { id: "k4", letter: "T", title: "پشتیبانی تلگرام", icon: "✈️", url: "https://t.me/axoncore" },
  { id: "k5", letter: "A", title: "درباره آکسون", icon: "🏢", url: "/about" },
  { id: "k6", letter: "C", title: "مشاوره آنلاین", icon: "💬", url: "/contact" },
  { id: "k7", letter: "T", title: "کاتالوگ محصولات", icon: "🛍️", url: "/products" },
];

export default function ContactDock() {
  const [dockKeys, setDockKeys] = useState<DockKeyItem[]>(DEFAULT_DOCK_KEYS);
  const [flippedKeyId, setFlippedKeyId] = useState<string | null>(null);

  const loadDockSettings = async () => {
    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("axon_contact_dock_keys_v2026");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) setDockKeys(parsed);
        }
      }

      const info = await siteInfoService.getSiteInfo();
      if (info && (info as any).contact_dock_items && Array.isArray((info as any).contact_dock_items) && (info as any).contact_dock_items.length > 0) {
        setDockKeys((info as any).contact_dock_items);
        if (typeof window !== "undefined") {
          localStorage.setItem("axon_contact_dock_keys_v2026", JSON.stringify((info as any).contact_dock_items));
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadDockSettings();

    const handleUpdate = (e: any) => {
      if (e.detail?.contact_dock_items && Array.isArray(e.detail.contact_dock_items)) {
        setDockKeys(e.detail.contact_dock_items);
      } else {
        loadDockSettings();
      }
    };
    window.addEventListener("site_info_updated", handleUpdate);

    const channel = supabase
      .channel("realtime-dock-keys-footer")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        loadDockSettings();
      })
      .subscribe();

    return () => {
      window.removeEventListener("site_info_updated", handleUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  if (!dockKeys || dockKeys.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-3 font-sans select-none py-2" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
        <span className="text-xs font-black text-[var(--text-primary)]">شبکه‌های ارتباطی و اجتماعی استودیو:</span>
      </div>

      <div
        className="p-2 sm:p-2.5 px-3 sm:px-4 rounded-full bg-slate-950/95 border border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex items-center justify-center gap-1.5 sm:gap-2 relative"
        dir="ltr"
      >
        {dockKeys.map((k) => {
          const isFlipped = flippedKeyId === k.id;

          return (
            <div
              key={k.id}
              className="relative [perspective:1000px] w-9 h-9 sm:w-11 sm:h-11 cursor-pointer"
              onMouseEnter={() => {
                soundEngine.playClick();
                setFlippedKeyId(k.id);
              }}
              onMouseLeave={() => setFlippedKeyId(null)}
              onClick={() => {
                soundEngine.playClick();
                if (k.url) {
                  if (k.url.startsWith("http")) window.open(k.url, "_blank");
                  else window.location.href = k.url;
                }
              }}
            >
              <div
                className="w-full h-full relative transition-transform duration-500 ease-out [transform-style:preserve-3d] rounded-2xl"
                style={{
                  transform: isFlipped ? "rotateY(180deg) translateZ(8px)" : "rotateY(0deg)",
                }}
              >
                <div className="absolute inset-0 [backface-visibility:hidden] flex items-center justify-center rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700/80 text-white font-black text-xs sm:text-sm shadow-[0_5px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  {k.letter}
                </div>

                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black border border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.7)] p-0.5">
                  <span className="text-xs">{k.icon || "🔗"}</span>
                  <span className="text-[8px] font-bold truncate max-w-[34px] leading-tight text-center">
                    {k.letter}
                  </span>
                </div>
              </div>

              {isFlipped && (
                <div
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-slate-900/95 border border-slate-700 text-white text-[10px] font-bold whitespace-nowrap shadow-2xl z-50 pointer-events-none animate-fadeIn"
                  dir="rtl"
                >
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
