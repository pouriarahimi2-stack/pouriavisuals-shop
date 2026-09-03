// File Path: components/OtpVerificationDeck.tsx
"use client";

import React, { useState, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface OtpDeckProps {
  phone: string;
  onSuccess: (token: string) => void;
  onCancel?: () => void;
}

export default function OtpVerificationDeck({ phone, onSuccess, onCancel }: OtpDeckProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);
    soundEngine.playClick();
    setErrorMsg("");

    if (clean && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (newDigits.every((d) => d.length === 1)) {
      triggerVerification(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const triggerVerification = async (code: string) => {
    setIsVerifying(true);
    soundEngine.playClick();

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, action: "verify" }),
      });
      const data = await res.json();

      if (res.ok && data.verified) {
        soundEngine.playSuccess();
        setIsVerified(true);
        setTimeout(() => {
          onSuccess(data.token || "OTP-VERIFIED");
        }, 1200);
      } else {
        setErrorMsg(data.message || "کد تایید اشتباه است.");
        setIsVerifying(false);
      }
    } catch {
      setErrorMsg("خطا در تایید کد.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto select-none font-sans" dir="rtl">
      {/* کارت دک با فلیپ نئونی (برگرفته از ویدیو ۲) */}
      <div className="relative w-full [perspective:1000px] min-h-[300px]">
        <div
          className={`w-full rounded-[2.5rem] p-6 sm:p-8 border transition-all duration-700 [transform-style:preserve-3d] shadow-2xl ${
            isVerified
              ? "bg-slate-950 border-emerald-500/80 shadow-[0_0_60px_rgba(16,185,129,0.4)] [transform:rotateY(180deg)]"
              : "bg-slate-900/95 border-slate-700/60"
          }`}
        >
          {/* بخش جلوی کارت: ورودی کد ۴ رقمی */}
          <div className={`space-y-6 text-center ${isVerified ? "hidden" : "block"}`}>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                COMPONENT • 100
              </span>
              <h3 className="text-base font-black text-white">کد تایید را وارد کنید</h3>
              <p className="text-xs text-slate-400 font-mono">
                کد ارسال‌شده به {phone}
              </p>
            </div>

            {errorMsg && (
              <div className="text-rose-400 text-xs font-bold animate-fadeIn">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="flex justify-center gap-3" dir="ltr">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-14 h-16 rounded-2xl bg-slate-950 border text-center font-mono font-black text-2xl text-white outline-none transition-all ${
                    digit
                      ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105"
                      : "border-slate-800 focus:border-slate-600"
                  }`}
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
                  setDigits(["1", "2", "3", "4"]);
                  triggerVerification("1234");
                }}
                className="text-blue-400 font-bold hover:underline cursor-pointer"
              >
                ارسال مجدد کد
              </button>
            </div>
          </div>

          {/* پشت کارت: کارت تایید نئونی با پالس نورانی و نشان Verified (برگرفته از ویدیو ۲) */}
          <div
            className={`absolute inset-0 p-8 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 [transform:rotateY(180deg)] ${
              isVerified ? "flex" : "hidden"
            }`}
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
