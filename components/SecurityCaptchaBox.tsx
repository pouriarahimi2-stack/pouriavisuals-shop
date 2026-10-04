// File Path: components/SecurityCaptchaBox.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface SecurityCaptchaBoxProps {
  onVerifyChange: (verified: boolean) => void;
}

function toEnglishDigits(str: string): string {
  return String(str || "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

export default function SecurityCaptchaBox({ onVerifyChange }: SecurityCaptchaBoxProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [targetCode, setTargetCode] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isHumanChecked, setIsHumanChecked] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const generateNewCaptcha = useCallback(() => {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTargetCode(code);
    setUserInput("");
    setIsVerified(false);
    onVerifyChange(false);

    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(1, "#1e293b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // خطوط نویز ضد ربات OCR
      for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = i % 2 === 0 ? "rgba(56,189,248,0.35)" : "rgba(129,140,248,0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }

      // نقاط نویز
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.beginPath();
        ctx.arc(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          1.2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // رسم کاراکترهای کپچا با زاویه تصادفی
      ctx.font = "bold 22px monospace";
      ctx.textBaseline = "middle";
      const step = canvas.width / (code.length + 1);
      for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        ctx.save();
        const x = step * (i + 0.85);
        const y = canvas.height / 2 + (Math.random() * 6 - 3);
        const angle = (Math.random() - 0.5) * 0.35;
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = i % 2 === 0 ? "#38bdf8" : "#34d399";
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      }
    }, 30);
  }, [onVerifyChange]);

  useEffect(() => {
    generateNewCaptcha();
  }, [generateNewCaptcha]);

  const handleInputChange = (val: string) => {
    const clean = toEnglishDigits(val);
    setUserInput(clean);
    const matched = clean === targetCode && targetCode.length === 5;
    if (matched) {
      soundEngine.playSuccess();
      setIsHumanChecked(true);
      setIsVerified(true);
      onVerifyChange(true);
    } else {
      setIsVerified(false);
      onVerifyChange(false);
    }
  };

  return (
    <div
      className={
        "p-4 rounded-2xl border transition-all space-y-3 text-xs " +
        (isVerified
          ? "bg-emerald-500/10 border-emerald-500/40"
          : "bg-[var(--input-bg)] border-[var(--card-border)]")
      }
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-black">
          <span className="text-base">{isVerified ? "✅" : "🛡️"}</span>
          <span className={isVerified ? "text-emerald-500" : "text-[var(--text-primary)]"}>
            {isVerified
              ? "تایید هویت امنیتی انجام شد (شما ربات نیستید)"
              : "تایید امنیتی ضد ربات (جهت جلوگیری از ثبت سفارش جعلی)"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            generateNewCaptcha();
          }}
          className="px-2.5 py-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[10px] font-bold cursor-pointer"
          title="تغییر تصویر امنیتی"
        >
          🔄 کد جدید
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <canvas
            ref={canvasRef}
            width={155}
            height={46}
            onClick={() => {
              soundEngine.playClick();
              generateNewCaptcha();
            }}
            className="rounded-xl border border-slate-700 cursor-pointer shadow-inner"
            title="برای دریافت کد جدید کلیک کنید"
          />
        </div>

        <input
          type="text"
          dir="ltr"
          maxLength={5}
          value={userInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="کد ۵ رقمی تصویر را وارد کنید"
          className={
            "w-full p-3 rounded-xl bg-[var(--modal-bg)] border font-mono font-black text-sm text-center tracking-widest uppercase outline-none transition " +
            (isVerified
              ? "border-emerald-500 text-emerald-500"
              : "border-[var(--card-border)] focus:border-[var(--accent-blue)]")
          }
        />
      </div>

      <label className="flex items-center gap-2 font-bold text-[11px] text-[var(--text-secondary)] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isHumanChecked && isVerified}
          onChange={() => {
            if (!isVerified) {
              soundEngine.playClick();
            }
          }}
          readOnly
          className="w-4 h-4 accent-emerald-500 rounded"
        />
        <span>من ربات نیستم و صحت اطلاعات سفارش را تایید می‌کنم</span>
      </label>
    </div>
  );
}
