// File Path: components/ColorGamutSimulator.tsx
"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface ColorGamutSimulatorProps {
  productTitle: string;
}

export default function ColorGamutSimulator({ productTitle }: ColorGamutSimulatorProps) {
  const [selectedGamut, setSelectedGamut] = useState<"srgb" | "p3" | "rec2020" | "adobe">("p3");
  const [testPattern, setTestPattern] = useState<"gradient" | "skin" | "neon" | "hdr">("gradient");
  const [gammaCorrection, setGammaCorrection] = useState<number>(2.2);

  const gamuts = {
    srgb: {
      name: "sRGB (Standard Web)",
      coverage: "۱۰۰٪",
      deltaE: "< ۰.۸",
      description: "فضای استاندارد نمایشگرهای خانگی و وب، مناسب برای تولید محتوای شبکه‌های اجتماعی و کاربری روزمره.",
      badgeColor: "text-blue-400 bg-blue-500/15 border-blue-500/30",
      filterStyle: "saturate(95%) contrast(100%)",
    },
    p3: {
      name: "Display P3 (Apple Wide Color)",
      coverage: "۹۹.۲٪",
      deltaE: "< ۰.۴ (استودیویی)",
      description: "طیف رنگی وسیع هالیوودی با ۲۵٪ گستره رنگ بیشتر از sRGB، ایده‌آل برای کالرگریدینگ در DaVinci Resolve و Final Cut.",
      badgeColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      filterStyle: "saturate(135%) contrast(108%) brightness(102%)",
    },
    adobe: {
      name: "Adobe RGB (Print & Photography)",
      coverage: "۹۸.۵٪",
      deltaE: "< ۰.۵",
      description: "گستره رنگ اختصاصی برای عکاسان حرفه‌ای و صنعت چاپ با پوشش بی‌نظیر طیف‌های فیروزه‌ای و سبز عمیق (Cyan & Emerald).",
      badgeColor: "text-purple-400 bg-purple-500/15 border-purple-500/30",
      filterStyle: "saturate(125%) hue-rotate(-8deg) contrast(105%)",
    },
    rec2020: {
      name: "Rec.2020 (8K Ultra HDR)",
      coverage: "۸۴.۰٪",
      deltaE: "< ۰.۹",
      description: "استاندارد آینده‌نگرانه سینمای دیجیتال با بیشترین دامنه دینامیکی ممکن برای رندرینگ پروژه‌های ۸K HDR.",
      badgeColor: "text-amber-400 bg-amber-500/15 border-amber-500/30",
      filterStyle: "saturate(160%) contrast(115%) brightness(105%)",
    },
  };

  const testImages = {
    gradient: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&auto=format&fit=crop&q=80",
    skin: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80",
    neon: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1000&auto=format&fit=crop&q=80",
    hdr: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80",
  };

  const handleGamutChange = (key: "srgb" | "p3" | "rec2020" | "adobe") => {
    soundEngine.playClick();
    setSelectedGamut(key);
  };

  return (
    <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-500/25">
            🎨
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base">
              شبیه‌ساز زنده گاموت رنگی و کالیبراسیون سخت‌افزاری (Color Gamut Engine)
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
              تست تعاملی پوشش رنگی پنل در نرم‌افزارهای تدوین برای: <strong className="text-[var(--text-primary)]">{productTitle}</strong>
            </p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs self-start sm:self-auto">
          Factory Calibrated (Delta E &lt; 1)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {(Object.keys(gamuts) as Array<keyof typeof gamuts>).map((key) => {
          const item = gamuts[key];
          const isSelected = selectedGamut === key;
          return (
            <button
              key={key}
              onClick={() => handleGamutChange(key)}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                isSelected
                  ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-xl shadow-blue-500/25 scale-[1.02]"
                  : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-blue)]"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono font-black text-xs">{key.toUpperCase()}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isSelected ? "bg-white/20 text-white" : item.badgeColor}`}>
                  {item.coverage}
                </span>
              </div>
              <span className="text-[11px] font-bold truncate block">{item.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 relative h-72 sm:h-96 rounded-3xl overflow-hidden bg-black border border-[var(--card-border)] shadow-inner flex items-center justify-center group">
          <img
            src={testImages[testPattern]}
            alt="Color Gamut Test Pattern"
            className="w-full h-full object-cover transition-all duration-700"
            style={{
              filter: `${gamuts[selectedGamut].filterStyle} contrast(${gammaCorrection / 2.2 * 100}%)`,
            }}
          />

          <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 text-white font-mono text-[11px] font-bold shadow-xl">
            Space: <span className="text-[var(--accent-blue)]">{gamuts[selectedGamut].name}</span> | Gamma: {gammaCorrection}
          </div>

          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
            {[
              { id: "gradient", label: "طیف گرادیانت" },
              { id: "skin", label: "تن پوست (Skin Tone)" },
              { id: "neon", label: "نور نئون و کنتراست" },
              { id: "hdr", label: "منظره HDR" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  soundEngine.playClick();
                  setTestPattern(t.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer ${
                  testPattern === t.id ? "bg-[var(--accent-blue)] text-white shadow-md" : "text-slate-300 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <span className="font-black text-[var(--accent-blue)] block text-xs">
              📊 تحلیل مهندسی پروفایل انتخابی:
            </span>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              {gamuts[selectedGamut].description}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-secondary)]">تنظیم منحنی گاما (Gamma Curve):</span>
              <span className="font-mono font-black text-[var(--accent-blue)]">{gammaCorrection}</span>
            </div>
            <input
              type="range"
              min="1.8"
              max="2.6"
              step="0.1"
              value={gammaCorrection}
              onChange={(e) => setGammaCorrection(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[9px] text-[var(--text-secondary)] font-mono">
              <span>Gamma 1.8 (Apple Classic)</span>
              <span>Gamma 2.2 (Standard)</span>
              <span>Gamma 2.6 (Cinema)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-1">
            <span className="font-black block">🎯 خطای رنگی Delta E: {gamuts[selectedGamut].deltaE}</span>
            <p className="text-[10px] text-slate-300 dark:text-emerald-300 font-medium">
              تضمین تفکیک بیش از ۱.۰۷ میلیارد رنگ بدون شکستگی شیب (Banding-Free).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}