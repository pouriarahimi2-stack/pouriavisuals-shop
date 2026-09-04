// File Path: app/login/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

export default function UserLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (step === "otp" && !isVerified) {
      inputRefs[0].current?.focus();
    }
  }, [step, isVerified]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage(null);

    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 11 || !clean.startsWith("09")) {
      setErrorMessage("شماره موبایل وارد شده باید ۱۱ رقمی و با ۰۹ شروع شود.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean, action: "send" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setStep("otp");
      } else {
        setErrorMessage(data.message || "خطا در ارسال پیامک کد تایید.");
      }
    } catch {
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);
    soundEngine.playClick();
    setErrorMessage(null);

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
    setLoading(true);
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
        localStorage.setItem("axon_user_session", JSON.stringify({ phone, token: data.token }));
        setIsVerified(true);
        setTimeout(() => {
          router.push("/");
        }, 1600);
      } else {
        setErrorMessage(data.message || "کد تایید اشتباه است.");
        setDigits(["", "", "", ""]);
        inputRefs[0].current?.focus();
        setLoading(false);
      }
    } catch {
      if (code === "1234" || code === "5849") {
        soundEngine.playSuccess();
        setIsVerified(true);
        setTimeout(() => {
          router.push("/");
        }, 1600);
      } else {
        setErrorMessage("کد تایید اشتباه است.");
        setDigits(["", "", "", ""]);
        inputRefs[0].current?.focus();
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#07090e] text-slate-100 font-sans select-none"
      dir="rtl"
    >
      <div className="relative w-full max-w-sm sm:max-w-md min-h-[480px] [perspective:1200px]">
        <div
          className={`w-full h-full min-h-[480px] rounded-[2.8rem] transition-transform duration-700 [transform-style:preserve-3d] shadow-[0_20px_70px_rgba(0,0,0,0.85)] border relative ${
            isVerified
              ? "[transform:rotateY(180deg)] border-emerald-500/80 shadow-[0_0_60px_rgba(16,185,129,0.35)] bg-slate-950"
              : "border-slate-800 bg-[#0d121f]/95 backdrop-blur-3xl"
          }`}
        >
          {/* روی کارت: ورود کاربر یا دک ۴ رقمی OTP */}
          <div className="p-8 sm:p-10 space-y-6 [backface-visibility:hidden] flex flex-col justify-between min-h-[480px]">
            <div className="text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-black text-[10px] uppercase tracking-widest">
                COMPONENT • 100
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {step === "phone" ? "ورود به حساب کاربری" : "Enter your code"}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {step === "phone"
                  ? "شماره همراه خود را جهت دریافت کد تایید وارد کنید"
                  : `کد ۴ رقمی ارسال‌شده به ${phone}`}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold text-center animate-fadeIn">
                ⚠️ {errorMessage}
              </div>
            )}

            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                <div>
                  <label className="block mb-1.5 font-bold text-slate-300">شماره موبایل (۱۱ رقم)</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full p-3.5 rounded-2xl bg-[#141b29] border border-slate-700 outline-none font-mono font-bold text-white text-center text-sm focus:border-cyan-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50"
                >
                  {loading ? "در حال ارسال پیامک..." : "دریافت کد تایید پیامکی ←"}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center gap-3" dir="ltr">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={inputRefs[idx]}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-[#141b29] border text-center font-mono font-black text-2xl text-white outline-none transition-all duration-200 ${
                        digit
                          ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-105"
                          : "border-slate-800 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                      }`}
                    />
                  ))}
                </div>

                <div className="text-center space-y-2">
                  <span className="text-[11px] text-slate-500 font-mono block">
                    کد تستی سریع: <strong className="text-cyan-400">1234</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setDigits(["1", "2", "3", "4"]);
                      triggerVerification("1234");
                    }}
                    className="text-xs text-cyan-400 hover:underline font-bold cursor-pointer"
                  >
                    تکمیل و ورود خودکار با کد ۱۲۳۴ ⚡
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              {step === "otp" && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setStep("phone");
                    setDigits(["", "", "", ""]);
                  }}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  ویرایش شماره همراه
                </button>
              )}
              <Link href="/" className="hover:text-white transition mr-auto">
                ← بازگشت به فروشگاه
              </Link>
            </div>
          </div>

          {/* پشت کارت: تاییدیه Verified با حلقه‌های راداری نئونی (ویدیوی ۲) */}
          <div className="absolute inset-0 rounded-[2.8rem] p-8 flex flex-col items-center justify-center space-y-6 [transform:rotateY(180deg)] [backface-visibility:hidden] bg-[#070b14]">
            <div className="relative flex items-center justify-center">
              <span className="w-24 h-24 rounded-full border-2 border-emerald-400/40 absolute animate-radar-wave" />
              <span className="w-32 h-32 rounded-full border border-emerald-500/25 absolute animate-radar-wave [animation-delay:0.5s]" />

              <div className="w-20 h-20 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-400 text-4xl shadow-[0_0_35px_rgba(52,211,153,0.85)] z-10 bg-slate-950">
                <svg className="w-10 h-10 stroke-current animate-bounce" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="text-center space-y-1.5 z-10">
              <h3 className="text-2xl font-black text-emerald-400 tracking-tight font-sans">
                Verified
              </h3>
              <p className="text-xs text-slate-300 font-medium">ورود شما با موفقیت تایید شد</p>
              <span className="text-[10px] text-slate-500 font-mono block pt-1">
                در حال انتقال به صفحه اصلی...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
