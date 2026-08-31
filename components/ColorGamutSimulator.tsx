"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function ColorGamutSimulator({ productTitle }: { productTitle: string }) {
  const [selectedGamut, setSelectedGamut] = useState<string>("p3");
  const [testPattern, setTestPattern] = useState<string>("skin");
  const [refreshRate, setRefreshRate] = useState<number>(120);
  const [gammaCorrection, setGammaCorrection] = useState<number>(2.2);

  const gamutProfiles: Record<string, { name: string; coverage: string; deltaE: string; desc: string; filter: string }> = {
    srgb: { name: "sRGB (Standard Web)", coverage: "100%", deltaE: "< 0.6", desc: "استاندارد مرجع وب و شبکه‌های اجتماعی.", filter: "saturate(95%) contrast(100%)" },
    p3: { name: "Display P3 (Apple Wide Color)", coverage: "99.4%", deltaE: "< 0.3", desc: "طیف وسیع سینمایی با ۲۵٪ گستره رنگ بیشتر از sRGB.", filter: "saturate(135%) contrast(108%)" },
    adobe: { name: "Adobe RGB (Print & Photo)", coverage: "98.8%", deltaE: "< 0.4", desc: "استاندارد صنعت چاپ با پوشش بی‌نظیر فیروزه‌ای و سبز عمیق.", filter: "saturate(125%) hue-rotate(-8deg)" },
    dci: { name: "DCI-P3 (Cinema Projector)", coverage: "99.8%", deltaE: "< 0.3", desc: "پروفایل اختصاصی کالرگریدینگ DaVinci Resolve.", filter: "saturate(140%) contrast(110%)" },
    rec2020: { name: "Rec.2020 (8K Ultra HDR)", coverage: "85.2%", deltaE: "< 0.8", desc: "استاندارد آینده‌نگرانه ویدیوهای 8K HDR.", filter: "saturate(165%) contrast(115%)" },
    ntsc: { name: "NTSC (Broadcast 1953)", coverage: "94.0%", deltaE: "< 0.9", desc: "استاندارد کلاسیک پخش تلویزیونی جهانی.", filter: "saturate(110%) sepia(8%)" },
    pal: { name: "PAL / SECAM (Broadcast)", coverage: "95.5%", deltaE: "< 0.8", desc: "سیستم استاندارد پخش سیگنال تلویزیون اروپا و خاورمیانه.", filter: "saturate(105%) contrast(104%)" },
  };

  const testImages: Record<string, string> = {
    skin: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80",
    gradient: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&auto=format&fit=crop&q=80",
    neon: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1000&auto=format&fit=crop&q=80",
    hdr: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80",
  };

  const profile = gamutProfiles[selectedGamut] || gamutProfiles.p3;

  return (
    <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/25">
            🎨
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base">
              شبیه‌ساز کالیبراسیون سخت‌افزاری و پلت‌های جهانی رنگ (Color Space Lab)
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
              تست تعاملی تفکیک بیش از ۱.۰۷ میلیارد رنگ برای: <strong className="text-blue-500">{productTitle}</strong>
            </p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs self-start sm:self-auto">
          Factory Calibrated (Delta E &lt; 0.5)
        </span>
      </div>

      {/* انتخاب پلت‌های جهانی */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {Object.entries(gamutProfiles).map(([key, p]) => (
          <button
            key={key}
            onClick={() => { soundEngine.playClick(); setSelectedGamut(key); }}
            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
              selectedGamut === key
                ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-lg scale-105"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-mono font-black text-xs">{key.toUpperCase()}</span>
              <span className="text-[9px] font-bold opacity-80">{p.coverage}</span>
            </div>
            <span className="text-[10px] font-bold truncate block">{p.name}</span>
          </button>
        ))}
      </div>

      {/* بوم نمایش و تست فریم ریت */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 relative h-72 sm:h-96 rounded-3xl overflow-hidden bg-black border border-[var(--card-border)] shadow-inner flex items-center justify-center group">
          <img
            src={testImages[testPattern]}
            alt="Color Test Pattern"
            className="w-full h-full object-cover transition-all duration-300"
            style={{
              filter: `${profile.filter} contrast(${(gammaCorrection / 2.2) * 100}%)`,
            }}
          />

          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 text-white font-mono text-[11px] font-bold shadow-xl flex items-center gap-2">
            <span>{profile.name}</span>
            <span className="text-blue-400">| {refreshRate}Hz ProMotion</span>
            <span className="text-emerald-400">| γ: {gammaCorrection}</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
            {[
              { id: "skin", label: "تن پوست (Skin Tone)" },
              { id: "gradient", label: "شیب گرادیانت (Banding)" },
              { id: "neon", label: "کنتراست نئون" },
              { id: "hdr", label: "منظره 8K HDR" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { soundEngine.playClick(); setTestPattern(t.id); }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer ${
                  testPattern === t.id ? "bg-[var(--accent-blue)] text-white shadow-md" : "text-slate-300 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* کنترل‌های تخصصی گاما و رفرش ریت */}
        <div className="lg:col-span-4 space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1.5">
            <span className="font-black text-[var(--accent-blue)] block">📊 آنالیز متالورژی رنگ:</span>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">{profile.desc}</p>
          </div>

          {/* اسلایدر رفرش ریت تصویر */}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-secondary)]">شبیه‌ساز نرخ نوسازی (Refresh Rate):</span>
              <span className="font-mono font-black text-[var(--accent-blue)]">{refreshRate} Hz</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[60, 120, 144, 240].map((rate) => (
                <button
                  key={rate}
                  onClick={() => { soundEngine.playClick(); setRefreshRate(rate); }}
                  className={`py-1.5 rounded-xl font-mono text-[10px] font-black border transition cursor-pointer ${
                    refreshRate === rate ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]" : "bg-[var(--modal-bg)] border-[var(--card-border)]"
                  }`}
                >
                  {rate}Hz
                </button>
              ))}
            </div>
          </div>

          {/* اسلایدر گاما */}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-secondary)]">منحنی گاما (Gamma Curve):</span>
              <span className="font-mono font-black text-emerald-500">{gammaCorrection}</span>
            </div>
            <input
              type="range" min="1.8" max="2.6" step="0.1"
              value={gammaCorrection}
              onChange={(e) => setGammaCorrection(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
