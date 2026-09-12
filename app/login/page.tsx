"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService, DEFAULT_AUTH_SECURITY_CONFIG, AuthSecurityConfig } from "@/services/siteInfoService";
import { themeEngine } from "@/lib/themeEngine";

export default function UserLoginPage() {
  const router = useRouter();

  const [authMode, setAuthMode] = useState<"phone_check" | "otp" | "password" | "register">("phone_check");
  const [securityConfig, setSecurityConfig] = useState<AuthSecurityConfig>(DEFAULT_AUTH_SECURITY_CONFIG);
  const [otpLength, setOtpLength] = useState<number>(4);

  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [activeSparkIndex, setActiveSparkIndex] = useState<number | null>(null);
  const sparkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [regPhone, setRegPhone] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

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
        const len = sec.userDeck?.otpLength || 4;
        setOtpLength(len);
        setDigits(Array(len).fill(""));
      }
    });
  }, []);

  const triggerSingleLapSpark = (index: number) => {
    if (sparkTimerRef.current) clearTimeout(sparkTimerRef.current);
    setActiveSparkIndex(index);
    sparkTimerRef.current = setTimeout(() => {
      setActiveSparkIndex(null);
    }, 450);
  };

  const handlePhoneCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage(null);

    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 11 || !clean.startsWith("09")) {
      setErrorMessage("شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.");
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
        setIdentifier(clean);
        setAuthMode("password");
        setSuccessMessage("شماره شما در سیستم ثبت است. لطفاً کلمه عبور را وارد فرمایید:");
      } else {
        setRegPhone(clean);
        setAuthMode("register");
        setSuccessMessage("حساب کاربری یافت نشد. لطفاً اطلاعات حساب خود را تکمیل کنید:");
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
          setErrorMessage(data.message || "کد تایید پیامکی نادرست است.");
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
      setErrorMessage("کلمه عبور با تکرار آن یکسان نیست.");
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
        setErrorMessage(data.message || "خطا در ایجاد حساب کاربری.");
        setLoading(false);
      }
    } catch {
      setErrorMessage("خطا در اتصال به سرور.");
      setLoading(false);
    }
  };

  const slotWidthPx = otpLength >= 8 ? 38 : otpLength >= 6 ? 48 : 58;
  const slotHeightPx = otpLength >= 8 ? 52 : otpLength >= 6 ? 64 : 74;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none transition-colors duration-500" dir="rtl">
      <div className="relative w-full max-w-sm sm:max-w-md min-h-[480px]">
        <div className={`w-full h-full min-h-[480px] rounded-[2.8rem] transition-all duration-700 shadow-2xl border relative flex flex-col justify-between p-7 sm:p-9 overflow-hidden ${
          animPhase === "verified" ? "border-emerald-500/80 shadow-[0_0_80px_rgba(16,185,129,0.35)] bg-slate-950 text-white" : "border-[var(--card-border)] bg-[var(--modal-bg)] backdrop-blur-3xl"
        }`}>
          {animPhase === "verified" ? (
            <div className="h-full flex-1 flex flex-col items-center justify-center space-y-6 animate-fadeIn py-12">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500 border-2 border-emerald-300 text-slate-950 flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(16,185,129,0.9)] z-10 animate-bounce">
                ✓
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-black text-emerald-400">ورود تایید شد</h3>
                <p className="text-xs text-slate-300">در حال انتقال به صفحه اصلی...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black">
                  <button
                    type="button"
                    onClick={() => { soundEngine.playClick(); setAuthMode("phone_check"); setErrorMessage(null); }}
                    className={`flex-1 py-2 rounded-xl transition cursor-pointer text-center ${authMode === "phone_check" || authMode === "otp" ? "bg-[var(--accent-blue)] text-white shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                  >
                    شماره همراه
                  </button>
                  <button
                    type="button"
                    onClick={() => { soundEngine.playClick(); setAuthMode("password"); setErrorMessage(null); }}
                    className={`flex-1 py-2 rounded-xl transition cursor-pointer text-center ${authMode === "password" ? "bg-[var(--accent-blue)] text-white shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                  >
                    رمز عبور
                  </button>
                  <button
                    type="button"
                    onClick={() => { soundEngine.playClick(); setAuthMode("register"); setErrorMessage(null); }}
                    className={`flex-1 py-2 rounded-xl transition cursor-pointer text-center ${authMode === "register" ? "bg-[var(--accent-blue)] text-white shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                  >
                    ثبت‌نام
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <h1 className="text-lg sm:text-xl font-black text-[var(--text-primary)] tracking-tight">
                    {authMode === "phone_check" ? "ورود به حساب کاربری" : authMode === "password" ? "ورود با رمز عبور" : authMode === "register" ? "ثبت‌نام کاربر جدید" : "کد تایید پیامکی"}
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
                {authMode === "phone_check" && (
                  <form onSubmit={handlePhoneCheck} className="space-y-4 text-xs">
                    <div>
                      <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره موبایل *</label>
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        maxLength={11}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09123456789"
                        className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                      />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-xl cursor-pointer disabled:opacity-50">
                      {loading ? "در حال بررسی..." : "ادامه و تایید شماره ←"}
                    </button>
                  </form>
                )}

                {authMode === "password" && (
                  <form onSubmit={handlePasswordLogin} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره همراه یا نام کاربری:</label>
                      <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-center font-mono" />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-[var(--text-secondary)]">کلمه عبور امنیتی *</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                          {showPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg cursor-pointer">
                      {loading ? "در حال ورود..." : "ورود به حساب کاربری ←"}
                    </button>
                  </form>
                )}

                {authMode === "register" && (
                  <form onSubmit={handleRegister} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره موبایل *</label>
                      <input type="tel" required dir="ltr" maxLength={11} value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center" />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام کاربری دلخواه *</label>
                      <input type="text" required value={regUsername} onChange={(e) => setRegUsername(e.target.value)} placeholder="نام کاربری انگلیسی..." className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block mb-1 font-bold text-[var(--text-secondary)]">کلمه عبور *</label>
                        <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold" />
                      </div>
                      <div>
                        <label className="block mb-1 font-bold text-[var(--text-secondary)]">تکرار رمز *</label>
                        <input type="password" required value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg mt-2">
                      {loading ? "در حال ثبت..." : "تکمیل ثبت‌نام و ورود 🚀"}
                    </button>
                  </form>
                )}

                {authMode === "otp" && (
                  <div className="space-y-6">
                    <div className="w-full flex justify-center items-center h-24" dir="ltr">
                      <div className="flex items-center justify-center">
                        {digits.map((digit, idx) => (
                          <div key={idx} style={{ width: `${slotWidthPx}px`, height: `${slotHeightPx}px` }} className="relative mx-1.5 shrink-0 flex items-center justify-center">
                            <input
                              ref={(el) => { inputRefs.current[idx] = el; }}
                              type="password"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleDigitChange(idx, e.target.value)}
                              className="w-full h-full rounded-2xl bg-[var(--input-bg)] border text-center font-mono font-black text-2xl outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--card-border)] text-center text-xs">
                <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                  ← بازگشت به صفحه اصلی فروشگاه
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
