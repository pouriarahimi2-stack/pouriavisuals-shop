"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

export interface DockKeyItem {
  id: string;
  letter: string;
  title: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  url: string;
}

const DEFAULT_DOCK_KEYS: DockKeyItem[] = [
  { id: "k1", letter: "C", title: "تماس تلفنی", subtitle: "پشتیبانی فوری", icon: "📞", accentColor: "#0071e3", url: "tel:09376110200" },
  { id: "k2", letter: "O", title: "سفارش‌ها", subtitle: "رهگیری پیشتاز", icon: "📦", accentColor: "#6366f1", url: "/track-order" },
  { id: "k3", letter: "N", title: "اخبار فناوری", subtitle: "رادار جهانی", icon: "⚡", accentColor: "#a855f7", url: "/news" },
  { id: "k4", letter: "T", title: "تلگرام استودیو", subtitle: "ارتباط مستقیم", icon: "✈️", accentColor: "#0ea5e9", url: "https://t.me/axoncore" },
  { id: "k5", letter: "A", title: "درباره آکسون", subtitle: "اصالت و تعهدات", icon: "🏢", accentColor: "#10b981", url: "/about" },
  { id: "k6", letter: "C", title: "تیکت مشاوره", subtitle: "پاسخ آنلاین", icon: "💬", accentColor: "#f59e0b", url: "/contact" },
  { id: "k7", letter: "T", title: "کاتالوگ کالا", subtitle: "تجهیزات ۵K", icon: "🛍️", accentColor: "#ec4899", url: "/products" },
];

export default function ContactDock() {
  const [dockKeys, setDockKeys] = useState<DockKeyItem[]>(DEFAULT_DOCK_KEYS);
  const [headerTitle, setHeaderTitle] = useState("شبکه‌های ارتباطی و اجتماعی استودیو:");
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);

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
      if (info) {
        if ((info as any).contact_dock_title) {
          setHeaderTitle((info as any).contact_dock_title);
        }
        if ((info as any).contact_dock_items && Array.isArray((info as any).contact_dock_items) && (info as any).contact_dock_items.length > 0) {
          setDockKeys((info as any).contact_dock_items);
          if (typeof window !== "undefined") {
            localStorage.setItem("axon_contact_dock_keys_v2026", JSON.stringify((info as any).contact_dock_items));
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadDockSettings();

    const handleUpdate = (e: any) => {
      if (e.detail?.contact_dock_items && Array.isArray(e.detail.contact_dock_items)) {
        setDockKeys(e.detail.contact_dock_items);
      }
      if (e.detail?.contact_dock_title) {
        setHeaderTitle(e.detail.contact_dock_title);
      }
    };
    window.addEventListener("site_info_updated", handleUpdate);

    const channel = supabase
      .channel("realtime-dock-keys-popup")
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
    <div className="flex flex-col items-center justify-center space-y-4 font-sans select-none py-6 overflow-visible" dir="rtl">
      
      {/* عنوان بالای داک با نشانگر نئونی پالس‌دار */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-blue)] shadow-[0_0_12px_var(--accent-blue)] animate-pulse" />
        <span className="text-xs font-black text-[var(--text-primary)]">
          {headerTitle}
        </span>
      </div>

      {/* محفظه کپسولی تیره با استایل دقیق شبیه ویدیو و ترتیب LTR */}
      <div
        className="p-3 sm:p-3.5 px-4 sm:px-6 rounded-full bg-[#0b0f19]/95 border border-slate-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex items-center justify-center gap-2 sm:gap-3 relative overflow-visible"
        dir="ltr"
      >
        {dockKeys.map((k) => {
          const isActive = activeKeyId === k.id;
          const accent = k.accentColor || "#0071e3";

          return (
            <div
              key={k.id}
              className="relative flex flex-col items-center overflow-visible"
              onMouseEnter={() => {
                soundEngine.playClick();
                setActiveKeyId(k.id);
              }}
              onMouseLeave={() => setActiveKeyId(null)}
              onClick={() => {
                soundEngine.playClick();
                if (k.url) {
                  if (k.url.startsWith("http")) window.open(k.url, "_blank");
                  else window.location.href = k.url;
                }
              }}
            >
              {/* پاپ‌آپ کارتی شناور بالا (دقیقاً مطابق رفتار ویدیو) */}
              <div
                className={`absolute -top-20 pointer-events-none transition-all duration-300 ease-out z-50 flex flex-col items-center ${
                  isActive
                    ? "opacity-100 -translate-y-2 scale-100"
                    : "opacity-0 translate-y-2 scale-90"
                }`}
                dir="rtl"
              >
                <div
                  className="px-3.5 py-2 rounded-2xl bg-[#0f172a]/95 border text-white shadow-2xl backdrop-blur-xl flex items-center gap-2 whitespace-nowrap"
                  style={{
                    borderColor: accent,
                    boxShadow: isActive ? `0 10px 25px -5px ${accent}40` : "none",
                  }}
                >
                  <span className="text-base">{k.icon || "🔗"}</span>
                  <div className="flex flex-col text-right">
                    <span className="font-black text-xs text-white leading-tight">{k.title}</span>
                    {k.subtitle && (
                      <span className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">{k.subtitle}</span>
                    )}
                  </div>
                </div>

                {/* فلش یا مثلث پایین پاپ‌آپ */}
                <div
                  className="w-2.5 h-2.5 -mt-1 rotate-45 bg-[#0f172a] border-r border-b"
                  style={{ borderColor: accent }}
                />
              </div>

              {/* کلید مکانیکی با افکت جهش به بالا و روشن شدن نئونی هنگام هاور */}
              <button
                type="button"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base text-white transition-all duration-300 cursor-pointer relative group"
                style={{
                  backgroundColor: isActive ? "#1e293b" : "#111827",
                  borderWidth: "1.5px",
                  borderColor: isActive ? accent : "#1f2937",
                  transform: isActive ? "translateY(-6px) scale(1.08)" : "translateY(0) scale(1)",
                  boxShadow: isActive
                    ? `0 12px 25px -5px ${accent}60, inset 0 1px 1px rgba(255,255,255,0.3)`
                    : "0 6px 12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)",
                }}
              >
                <span
                  className="transition-colors duration-300"
                  style={{ color: isActive ? accent : "#f3f4f6" }}
                >
                  {k.letter}
                </span>

                {/* خط نورانی باریک زیر دکمه فعال */}
                {isActive && (
                  <span
                    className="absolute bottom-1 w-2.5 h-0.5 rounded-full"
                    style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <span className="text-[10px] text-slate-400 font-medium">
        برای مشاهده امکانات، ماوس را روی کلیدها ببرید یا کلیک کنید
      </span>
    </div>
  );
}
