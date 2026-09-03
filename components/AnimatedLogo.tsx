"use client";

import React from "react";

interface AnimatedLogoProps {
  customLogoUrl?: string;
  size?: number;
  className?: string;
}

export default function AnimatedLogo({ customLogoUrl, size = 38, className = "" }: AnimatedLogoProps) {
  if (customLogoUrl && customLogoUrl.length > 5) {
    return (
      <div
        className={"relative flex items-center justify-center overflow-hidden shrink-0 " + className}
        style={{ width: size, height: size }}
      >
        <img
          src={customLogoUrl}
          alt="Axon"
          className="w-full h-full object-contain animate-pulse"
        />
      </div>
    );
  }

  // لوگوی متحرک برداری فوق‌مدرن آکسون با هسته کوانتومی چرخشی و حلقه‌های الکترونی
  return (
    <div
      className={"relative flex items-center justify-center shrink-0 select-none " + className}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(2,132,199,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="axonNeonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="axonNeonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <filter id="axonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* حلقه مداری چرخشی ۱ */}
        <ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="18"
          stroke="url(#axonNeonGrad1)"
          strokeWidth="2.5"
          strokeDasharray="12 6"
          transform="rotate(-30 50 50)"
          className="origin-center"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="8s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* حلقه مداری چرخشی ۲ */}
        <ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="18"
          stroke="url(#axonNeonGrad2)"
          strokeWidth="2"
          strokeDasharray="8 8"
          transform="rotate(30 50 50)"
          className="origin-center"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 50 50"
            to="0 50 50"
            dur="6s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* شش‌ضلعی هندسی تیتانیوم مرکزی */}
        <polygon
          points="50,22 74,36 74,64 50,78 26,64 26,36"
          stroke="url(#axonNeonGrad1)"
          strokeWidth="3.5"
          fill="rgba(2, 132, 199, 0.12)"
          filter="url(#axonGlow)"
        >
          <animate
            attributeName="stroke-width"
            values="3;4.5;3"
            dur="2s"
            repeatCount="indefinite"
          />
        </polygon>

        {/* هسته کوانتومی درخشان */}
        <circle cx="50" cy="50" r="8" fill="url(#axonNeonGrad1)">
          <animate
            attributeName="r"
            values="7;10;7"
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;1;0.8"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
