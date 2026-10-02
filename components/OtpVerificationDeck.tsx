// File Path: components/OtpVerificationDeck.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

interface OtpDeckProps {
  phone: string;
  otpTicket?: string;
  onSuccess: (token: string) => void;
  onCancel?: () => void;
  onResend?: () => void;
}

export default function OtpVerificationDeck({
  phone,
  otpTicket,
  onSuccess,
  onCancel,
  onResend,
}: OtpDeckProps) {
  const [otpLength, setOtpLength] = useState<number>(4);
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const syncDeckLength = (info: any) => {
    const len = Number(info?.auth_security_config?.userDeck?.otpLength || 4);
    const validLen = len === 6 || len === 8 ? len : 4;
    setOtpLength(validLen);
    setDigits((prev) => (prev.length === validLen ? prev : Array(validLen).fill("")));
  };

  useEffect(() => {
    siteInfoService.getSiteInfo().then(syncDeckLength).catch(() => {});

    const ch = supabase
      .channel("realtime-otp-deck-config")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, (payload: any) => {
        if (payload?.new) syncDeckLength(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/\D/g, "")
      .slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);
    soundEngine.playClick();
    setErrorMsg("");

    if (clean && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d.length === 1)) {
      triggerVerification(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerVerification = async (code: string) => {
    setIsVerifying(true);
    soundEngine.playClick();

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, action: "verify", otpTicket }),
      });
      const data = await res.json();

      if (res.ok && (data.verified || data.success)) {
        soundEngine.playSuccess();
        setIsVerified(true);
        setTimeout(() => {
          onSuccess(data.token || "OTP-VERIFIED");
        }, 1100);
      } else {
        setErrorMsg(data.message || "کد تایید اشتباه است.");
        setDigits(Array(otpLength).fill(""));
        inputRefs.current[0]?.focus();
        setIsVerifying(false);
      }
    } catch {
      setErrorMsg("خطا در تایید کد.");
      setIsVerifying(false);
    }
  };

  const slotSizeClass =
    otpLength >= 8
      ? "w-9 h-12 sm:w-10 sm:h-14 text-lg"
      : otpLength >= 6
      ? "w-11 h-14 sm:w-12 sm:h-16 text-xl"
      : "w-13 h-15 sm:w-14 sm:h-16 text-2xl";

  return (
    <div className="w-full max-w-md mx-auto select-text font-sans px-2" dir="rtl">
      <div className="relative w-full [perspective:1000px] min-h-[290px]">
        <div
          className={
            "w-full rounded-[2.2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border transition-all duration-700 [transform-style:preserve-3d] shadow-2xl " +
            (isVerified
              ? "bg-slate-950 border-emerald-500/80 shadow-[0_0_60px_rgba(16,185,129,0.4)] [transform:rotateY(180deg)]"
              : "bg-slate-900/95 border-slate-700/60")
          }
        >
          <div className={"space-y-5 text-center " + (isVerified ? "hidden" : "block")}>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                SECURITY • OTP VERIFICATION
              </span>
              <h3 className="text-base font-black text-white">کد تایید پیامکی را وارد کنید</h3>
              <p className="text-xs text-slate-400 font-mono">ارسال شده به {phone}</p>
            </div>

            {errorMsg && (
              <div className="text-rose-400 text-xs font-bold animate-fadeIn">⚠️ {errorMsg}</div>
            )}

            <div className="flex justify-center flex-wrap gap-1.5 sm:gap-2.5" dir="ltr">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  disabled={isVerifying}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={
                    "rounded-2xl bg-slate-950 border text-center font-mono font-black text-white outline-none transition-all " +
                    slotSizeClass +
                    " " +
                    (digit
                      ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105"
                      : "border-slate-800 focus:border-blue-400")
                  }
                />
              ))}
            </div>

            <div className="text-xs text-slate-400 flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="hover:text-white transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResend) onResend();
                }}
                className="text-blue-400 font-bold hover:underline cursor-pointer"
              >
                ارسال مجدد کد 🔄
              </button>
            </div>
          </div>

          <div
            className={
              "absolute inset-0 p-8 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 [transform:rotateY(180deg)] " +
              (isVerified ? "flex" : "hidden")
            }
          >
            <div className="relative w-20 h-20 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.8)] animate-pulse">
              <svg className="w-10 h-10 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-black text-emerald-400 tracking-tight">Verified</h3>
            <p className="text-xs text-slate-400 font-medium">تایید هویت با موفقیت انجام شد</p>
          </div>
        </div>
      </div>
    </div>
  );
}
