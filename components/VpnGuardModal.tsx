// File Path: components/VpnGuardModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { useSiteInfo } from "@/context/SiteInfoContext";
import AnimatedLogo from "@/components/AnimatedLogo";

const DISMISS_STORAGE_KEY = "axon_vpn_notice_dismissed_v1";

export default function VpnGuardModal() {
  const pathname = usePathname() || "/";
  const { siteInfo } = useSiteInfo();
  const [vpnDetected, setVpnDetected] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_STORAGE_KEY) === "true") {
        setDismissed(true);
      }
    } catch {}
  }, []);

  const checkConnection = useCallback(async () => {
    if (isAdminRoute) {
      setVpnDetected(false);
      return;
    }
    setChecking(true);
    try {
      const res = await fetch("/api/security/vpn-check?t=" + Date.now(), {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setVpnDetected(Boolean(data.isVpn));
      }
    } catch {
    } finally {
      setChecking(false);
    }
  }, [isAdminRoute]);

  useEffect(() => {
    checkConnection();
    const onFocus = () => checkConnection();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [checkConnection]);

  const handleDismiss = () => {
    soundEngine.playClick();
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, "true");
    } catch {}
  };

  if (!vpnDetected || dismissed || isAdminRoute) return null;

  const storeTitle = String(
    siteInfo?.settings?.site_name ||
      siteInfo?.site_name ||
      "فروشگاه"
  ).trim();

  return (
    <aside
      aria-label="یادآوری اتصال اینترنت"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:w-[385px] z-40 pointer-events-auto font-sans select-text animate-fadeIn"
      dir="rtl"
    >
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--modal-bg)]/95 backdrop-blur-2xl border border-amber-500/40 shadow-2xl text-[var(--text-primary)] space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center p-1 shrink-0 shadow-inner">
              <AnimatedLogo
                variant="header"
                size={36}
                borderRadius="10px"
                fallback={<span className="text-lg text-amber-400">🛡️</span>}
              />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-[13px] text-amber-400">
                یادآوری محترمانه {storeTitle}
              </h3>
              <span className="text-[10px] text-[var(--text-secondary)] font-bold block">
                پیشنهاد بهینه‌سازی اتصال بانکی و پیامکی
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="بستن اعلان"
            className="w-7 h-7 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-amber-500/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center text-xs font-bold transition cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed font-medium text-justify">
          همراه گرامی، بازدید از تمامی بخش‌های فروشگاه با فیلترشکن (VPN) بدون هیچ‌گونه محدودیتی امکان‌پذیر است؛ با این حال، برای اتصال بی‌وقفه به درگاه پرداخت شاپرک و دریافت سریع پیامک‌های تایید، پیشنهاد می‌کنیم هنگام ثبت سفارش فیلترشکن خود را خاموش فرمایید.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-slate-950 font-black text-[11px] shadow-md cursor-pointer transition"
          >
            متوجه شدم، ادامه بازدید ✓
          </button>

          <button
            type="button"
            disabled={checking}
            onClick={() => {
              soundEngine.playClick();
              checkConnection();
            }}
            className="py-2.5 px-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] font-bold text-[11px] cursor-pointer transition disabled:opacity-50 shrink-0"
          >
            {checking ? "بررسی..." : "بررسی مجدد"}
          </button>
        </div>
      </div>
    </aside>
  );
}