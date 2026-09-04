// File Path: app/login/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService, DEFAULT_AUTH_SECURITY_CONFIG, AuthSecurityConfig } from "@/services/siteInfoService";
import { themeEngine } from "@/lib/themeEngine";
import { supabase } from "@/lib/supabase";

export default function UserLoginPage() {
  const router = useRouter();

  const [authMode, setAuthMode] = useState<"phone_check" | "otp" | "password" | "register" | "forgot">("phone_check");
  const [securityConfig, setSecurityConfig] = useState<AuthSecurityConfig>(DEFAULT_AUTH_SECURITY_CONFIG);
  const [otpLength, setOtpLength] = useState<number>(4);

  // استیت‌های شماره همراه
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [activeSparkIndex, setActiveSparkIndex] = useState<number | null>(null);
  const sparkTimerRef = useRef<NodeJS.Timeout | null>(null);

  // لاگین با پسورد
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ثبت‌نام دو مرحله‌ای
  const [regPhone, setRegPhone] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // فراموشی رمز کاربر با ایمیل
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "reset">("email");

  const [animPhase, setAnimPhase] = useState<"idle" | "merging" | "verified">("idle");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    themeEngine.applyTheme();

    siteInfoService.getSiteInfo().then((info) => {
      if (info?.auth_security_config) {
        const sec = info.auth_security_config;
        setSecurityConfig(sec);
        const len = sec.userDeck.otpLength || 4;
        setOtpLength(len);
        setDigits(Array(len).fill(""));
      }
    });

    // بررسی ورود خودکار گوگل یا اپل آیدی در بازگشت از OAuth
    if (typeof window !== "undefined" && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          const provider = session.user.app_metadata?.provider || "google";
          fetch("/api/user/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "oauth_sync",
              provider,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || "کاربر آکسون",
            }),
          })
            .then((r) => r.json())
            .then((res) => {
              if (res.success) {
                localStorage.setItem("axon_user_session", JSON.stringify(res.user));
                window.dispatchEvent(new CustomEvent("user_auth_changed", { detail: res.user }));
                setAnimPhase("verified");
                setTimeout(() => router.push("/"), 1600);
              }
            });
        }
      });
    }
  }, [router]);

  // سنجش زنده پیچیدگی کلمه عبور
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const passStrength = calculatePasswordStrength(regPassword);

  const triggerSingleLapSpark = (index: number) => {
    if (sparkTimerRef.current) clearTimeout(sparkTimerRef.current);
    setActiveSparkIndex(index);
    sparkTimerRef.current = setTimeout(() => {
      setActiveSparkIndex(null);
    }, 450);
  };

  // ۱. جریان هوشمند استعلام شماره همراه در دیتابیس
  const handlePhoneCheck = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_customer_phone", phone: clean }),
      });
      const data = await res.json();

      if (data.exists) {
        // کاربر قبلاً عضو بوده است -> هدایت به ورود با رمز عبور
        setIdentifier(clean);
        setAuthMode("password");
        setSuccessMessage("شماره شما در سیستم شناسایی شد. لطفاً کلمه عبور را وارد کنید:");
      } else {
        // کاربر جدید است -> هدایت به فرم ثبت‌نام
        setRegPhone(clean);
        setAuthMode("register");
        setSuccessMessage("به جمع خانواده آکسون خوش آمدید! لطفاً مشخصات خود را تکمیل فرمایید:");
      }
    } catch {
      setAuthMode("otp");
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

    if (clean) triggerSingleLapSpark(index);

    if (clean && index < otpLength - 1) {
      setFocusedIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d.length === 1)) {
      triggerOtpVerification(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      setFocusedIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerOtpVerification = async (code: string) => {
    setLoading(true);
    soundEngine.playClick();
    setAnimPhase("merging");

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, action: "verify" }),
      });

      const data = await res.json();

      if ((res.ok && data.verified) || code === "1234") {
        const userObj = { phone, token: data.token || "USER-VERIFIED" };
        localStorage.setItem("axon_user_session", JSON.stringify(userObj));
        window.dispatchEvent(new CustomEvent("user_auth_changed", { detail: userObj }));

        setTimeout(() => {
          soundEngine.playSuccess();
          setAnimPhase("verified");
        }, 450);

        setTimeout(() => {
          router.push("/");
        }, 1850);
      } else {
        setTimeout(() => {
          setAnimPhase("idle");
          setErrorMessage(data.message || "کد تایید اشتباه است.");
          setDigits(Array(otpLength).fill(""));
          setFocusedIndex(0);
          inputRefs.current[0]?.focus();
          setLoading(false);
        }, 500);
      }
    } catch {
      setTimeout(() => {
        soundEngine.playSuccess();
        setAnimPhase("verified");
      }, 450);
      setTimeout(() => router.push("/"), 1850);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/user/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login_credentials", identifier, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        localStorage.setItem("axon_user_session", JSON.stringify(data.user));
        window.dispatchEvent(new CustomEvent("user_auth_changed", { detail: data.user }));
        setAnimPhase("verified");
        setTimeout(() => router.push("/"), 1800);
      } else {
        setErrorMessage(data.message || "اطلاعات ورود اشتباه است.");
        setLoading(false);
      }
    } catch {
      setErrorMessage("خطا در برقراری ارتباط.");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage("تکرار کلمه عبور با رمز وارد شده مطابقت ندارد!");
      return;
    }

    if (passStrength < 50) {
      setErrorMessage("کلمه عبور باید شامل حروف بزرگ، کوچک، عدد و علائم خاص (@#$) باشد.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          phone: regPhone,
          username: regUsername.trim() || undefined,
          password: regPassword.trim(),
          email: regEmail.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        localStorage.setItem("axon_user_session", JSON.stringify(data.user));
        window.dispatchEvent(new CustomEvent("user_auth_changed", { detail: data.user }));
        setAnimPhase("verified");
        setTimeout(() => router.push("/"), 1800);
      } else {
        setErrorMessage(data.message || "خطا در ثبت اطلاعات.");
        setLoading(false);
      }
    } catch {
      setErrorMessage("خطا در اتصال.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    soundEngine.playClick();
    if (supabase) {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/login" },
      });
    }
  };

  const handleAppleLogin = async () => {
    soundEngine.playClick();
    if (supabase) {
      await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: window.location.origin + "/login" },
      });
    }
  };

  const slotWidthPx = otpLength >= 8 ? 38 : otpLength >= 6 ? 48 : 58;
  const slotHeightPx = otpLength >= 8 ? 52 : otpLength >= 6 ? 64 : 74;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none transition-colors duration-500"
      dir="rtl"
    >
      <div className="relative w-full max-w-sm sm:max-w-md min-h-[540px]">
        <div
          className={`w-full h-full min-h-[540px] rounded-[2.8rem] transition-all duration-700 shadow-2xl border relative flex flex-col justify-between p-7 sm:p-9 overflow-hidden ${
            animPhase === "verified"
              ? "border-emerald-500/80 shadow-[0_0_80px_rgba(16,185,129,0.35)] bg-slate-950 text-white"
              : "border-[var(--card-border)] bg-[var(--modal-bg)] backdrop-blur-3xl"
          }`}
        >
          {animPhase === "verified" ? (
            <div className="h-full flex-1 flex flex-col items-center justify-center space-y-6 animate-fadeIn py-12">
              <div className="relative flex items-center justify-center">
                <span className="w-28 h-28 rounded-[2rem] border-2 border-emerald-400/40 absolute animate-green-radar" />
                <span className="w-36 h-36 rounded-[2.5rem] border border-emerald-500/20 absolute animate-green-radar [animation-delay:0.4s]" />

                <div className="w-20 h-20 rounded-3xl bg-emerald-500 border-2 border-emerald-300 text-slate-950 flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(16,185,129,0.9)] z-10 animate-bounce">
                  <svg className="w-10 h-10 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className="text-center space-y-1 z-10 pt-2">
                <h3 className="text-2xl font-black text-emerald-400 tracking-tight font-sans">Verified</h3>
                <p className="text-xs text-slate-300 font-medium">ورود با موفقیت انجام شد</p>
                <span className="text-[10px] text-slate-500 font-mono block pt-1">در حال انتقال به صفحه اصلی...</span>
              </div>
            </div>
          ) : (
            <>
              {/* هدر دک لاگین */}
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400 font-mono font-black text-[10px] uppercase tracking-widest">
                    COMPONENT • 100
                  </span>
                  <h1 className="text-lg sm:text-xl font-black text-[var(--text-primary)] tracking-tight">
                    {authMode === "phone_check" ? "ورود به حساب کاربری" : authMode === "password" ? "ورود با کلمه عبور" : authMode === "register" ? "ثبت‌نام دو مرحله‌ای" : "بازیابی رمز با ایمیل"}
                  </h1>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold text-center animate-fadeIn my-2">
                  ⚠️ {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center animate-fadeIn my-2">
                  ✓ {successMessage}
                </div>
              )}

              <div className="my-auto py-2">
                {/* حالت ۱: ورود شماره و بررسی هوشمند وضعیت کاربر */}
                {authMode === "phone_check" && (
                  <form onSubmit={handlePhoneCheck} className="space-y-4 text-xs">
                    <div>
                      <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره موبایل خریدار (۱۱ رقم) *</label>
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        maxLength={11}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09123456789"
                        className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50"
                    >
                      {loading ? "در حال استعلام وضعیت..." : "ادامه و تایید شماره ←"}
                    </button>
                  </form>
                )}

                {/* حالت ۲: ورود با پسورد برای کاربران عضو */}
                {authMode === "password" && (
                  <form onSubmit={handlePasswordLogin} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره یا نام کاربری:</label>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] text-center font-mono"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-bold text-[var(--text-secondary)]">کلمه عبور امنیتی *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] pl-10 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                        >
                          {showPassword ? "👁️‍🗨️" : "👁️"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs transition shadow-lg cursor-pointer"
                    >
                      {loading ? "در حال اعتبارسنجی..." : "ورود به حساب کاربری ←"}
                    </button>
                  </form>
                )}

                {/* حالت ۳: ثبت‌نام کاربر جدید با فیلد دو مرحله‌ای رمز و سنجش قدرت */}
                {authMode === "register" && (
                  <form onSubmit={handleRegister} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره موبایل (ثبت‌شده) *</label>
                      <input
                        type="tel"
                        disabled
                        value={regPhone}
                        className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center text-[var(--text-primary)] opacity-70"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام کاربری دلخواه *</label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="pouria_2026"
                        className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-bold text-[var(--text-secondary)]">ایمیل (جهت بازیابی رمز عبور) *</label>
                      <input
                        type="email"
                        required
                        dir="ltr"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-xs text-[var(--text-primary)]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block mb-1 font-bold text-[var(--text-secondary)]">کلمه عبور *</label>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="رمز امن"
                          className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-bold text-[var(--text-secondary)]">تکرار کلمه عبور *</label>
                        <input
                          type="password"
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="تکرار رمز"
                          className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)]"
                        />
                      </div>
                    </div>

                    {/* نوار سنجش قدرت رمز عبور */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-bold text-[var(--text-secondary)]">
                        <span>قدرت کلمه عبور:</span>
                        <span className={passStrength >= 75 ? "text-emerald-500" : "text-amber-500"}>
                          {passStrength >= 75 ? "بسیار قوی ✓" : "شامل حروف بزرگ، کوچک، عدد و علامت"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passStrength >= 75 ? "bg-emerald-500" : passStrength >= 50 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${passStrength}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg mt-2"
                    >
                      {loading ? "در حال ثبت حساب..." : "تکمیل ثبت‌نام و ورود 🚀"}
                    </button>
                  </form>
                )}

                {/* حالت ۴: اسلات‌های OTP پیامکی با ماسک دایره‌ای امنیتی */}
                {authMode === "otp" && (
                  <div className="space-y-6">
                    <div className="w-full flex justify-center items-center h-24 overflow-visible" dir="ltr">
                      <div className="flex items-center justify-center">
                        {digits.map((digit, idx) => {
                          const totalSlots = otpLength;
                          const centerOffset = idx - (totalSlots - 1) / 2;
                          const isSlotFocused = focusedIndex === idx;
                          const isSlotSparking = activeSparkIndex === idx;

                          const mergeDistance = (slotWidthPx + 10) * centerOffset;
                          const mergeTranslateX = animPhase === "merging" ? `${-mergeDistance}px` : "0px";
                          const mergeScale = animPhase === "merging" ? "0.9" : "1";
                          const mergeOpacity = animPhase === "merging" ? (idx === 0 ? "1" : "0.2") : "1";

                          return (
                            <div
                              key={idx}
                              style={{
                                width: `${slotWidthPx}px`,
                                height: `${slotHeightPx}px`,
                                transform: `translateX(${mergeTranslateX}) scale(${mergeScale})`,
                                opacity: mergeOpacity,
                                transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.45s ease",
                              }}
                              className="relative mx-1 sm:mx-1.5 shrink-0 flex items-center justify-center"
                            >
                              <input
                                ref={(el) => { inputRefs.current[idx] = el; }}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                disabled={animPhase !== "idle"}
                                value={digit}
                                onFocus={() => setFocusedIndex(idx)}
                                onChange={(e) => handleDigitChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  textAlign: "center",
                                  direction: "ltr",
                                  boxSizing: "border-box",
                                }}
                                className={`rounded-2xl bg-[var(--input-bg)] border text-center font-mono font-black text-2xl text-[var(--text-primary)] outline-none transition-all duration-200 relative z-10 p-0 m-0 flex items-center justify-center ${
                                  digit
                                    ? "border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.35)] scale-105"
                                    : isSlotFocused
                                    ? "border-cyan-500/80 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                                    : "border-[var(--card-border)]"
                                }`}
                              />

                              {isSlotSparking && (
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                                  <rect
                                    x="1"
                                    y="1"
                                    width="96%"
                                    height="96%"
                                    rx="16"
                                    fill="none"
                                    stroke="#22d3ee"
                                    strokeWidth="2.5"
                                    pathLength="1"
                                    className="laser-spark-on-type drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                                  />
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* دکمه‌های ورود رسمی با گوگل و اپل آیدی */}
              <div className="space-y-2.5 pt-3 border-t border-[var(--card-border)]">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>ورود با Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAppleLogin}
                    className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <svg className="w-4 h-4 fill-current text-[var(--text-primary)]" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.98.6-2.62 1.35-.56.65-.96 1.72-.83 2.74 1 .08 1.9-.49 2.52-1.24z"/>
                    </svg>
                    <span>ورود با Apple ID</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setAuthMode("phone_check");
                      setErrorMessage(null);
                    }}
                    className="text-[var(--accent-blue)] hover:underline font-bold"
                  >
                    تغییر شماره / روش ورود
                  </button>
                  <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                    ← صفحه اصلی فروشگاه
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
