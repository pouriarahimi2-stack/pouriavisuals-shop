// File Path: components/VpnGuardModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

export default function VpnGuardModal() {
  const pathname = usePathname() || "/";
  const [vpnDetected, setVpnDetected] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState("");
  const [checking, setChecking] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin");

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
        if (data.isVpn) {
          setVpnDetected(true);
          setDetectedCountry(data.country || "NON-IR");
          if (typeof document !== "undefined") {
            document.body.style.overflow = "hidden";
          }
        } else {
          setVpnDetected(false);
          if (typeof document !== "undefined") {
            document.body.style.overflow = "";
          }
        }
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
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [checkConnection]);

  if (!vpnDetected || isAdminRoute) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl font-sans select-none animate-fadeIn"
      dir="rtl"
    >
      <div className="max-w-md w-full p-6 sm:p-8 rounded-[2.5rem] bg-slate-900 border-2 border-amber-500/40 shadow-[0_0_80px_rgba(245,158,11,0.25)] text-center space-y-5 text-white">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner animate-pulse">
          🛡️
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono text-[10px] font-black">
            SECURITY SHIELD • IP: {detectedCountry}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-amber-400">
            لطفاً فیلترشکن (VPN) خود را خاموش فرمایید
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium text-justify">
            همراه گرامی، به منظور تضمین امنیت کامل تراکنش‌های بانکی شما در شبکه شاپرک، دریافت بی‌وقفه پیامک‌های کد تایید و تجربه مرور وب‌سایت با بالاترین سرعت، دسترسی به فروشگاه تنها با آی‌پی داخلی ایران امکان‌پذیر است.
          </p>
          <p className="text-xs text-amber-300/90 font-bold pt-1">
            خواهشمندیم فیلترشکن یا ابزار تغییر آی‌پی خود را غیرفعال نموده و سپس روی دکمه زیر کلیک کنید.
          </p>
        </div>

        <button
          type="button"
          disabled={checking}
          onClick={() => {
            soundEngine.playClick();
            checkConnection();
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-slate-950 font-black text-xs sm:text-sm shadow-xl cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>{checking ? "در حال بررسی مجدد اتصال..." : "🔄 فیلترشکن را خاموش کردم (ورود به سایت)"}</span>
        </button>
      </div>
    </div>
  );
}
