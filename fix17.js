/**
 * fix17.js — آکسون کور — فیکس جامع
 * ۱. globals.css: پاک‌سازی هسته‌ای همه بلوک‌های شکسته
 * ۲. MobileSlider.tsx: کامپوننت اسلایدر کاملاً جدید
 * ۳. DynamicHomeSections.tsx: جایگزینی اسلایدر قدیمی
 * ۴. AIAssistantChat.tsx: bottom 130px
 */
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.resolve(__dirname);
const log  = (m) => console.log(m);

function read(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { log(`NOT FOUND: ${rel}`); return null; }
  return fs.readFileSync(p, "utf8");
}
function write(rel, content) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
  log(`✅ نوشته شد: ${rel}`);
}

// ═══════════════════════════════════════════════════════════════
// 1. globals.css — پاک‌سازی هسته‌ای
// ═══════════════════════════════════════════════════════════════
{
  const rel = "app/globals.css";
  let src = read(rel);
  if (!src) { log("❌ globals.css نیافت"); process.exit(1); }

  const lines = src.split("\n");
  log(`📄 globals.css: ${lines.length} خط`);

  // پیدا کردن اولین خطی که .ai-chat-float-btn داره
  let cutAt = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(".ai-chat-float-btn") ||
        lines[i].includes(".axon-sl-wrap")) {
      cutAt = i;
      break;
    }
  }

  log(`✂️  برش در خط ${cutAt >= 0 ? cutAt + 1 : "نیافت"}`);

  // بریدن تا اولین خط مشکل‌دار (همه چیز بعدش میاد از نو)
  const cleanBase = cutAt >= 0
    ? lines.slice(0, cutAt).join("\n").trimEnd()
    : src.trimEnd();

  log(`📏 پایه تمیز: ${cleanBase.split("\n").length} خط`);

  // تعریف‌های جدید و تمیز
  const newDefs = `

/* ══ دکمه شناور چت ═══════════════════════════════════════════ */
.ai-chat-float-btn {
  position: fixed !important;
  bottom: 136px !important;
  right: 16px !important;
  z-index: 45 !important;
  width: 50px !important;
  height: 50px !important;
  border-radius: 9999px !important;
  background: linear-gradient(135deg, #0066ff 0%, #7c3aed 100%) !important;
  border: none !important;
  box-shadow: 0 4px 20px rgba(0,102,255,0.45), 0 0 0 2px rgba(255,255,255,0.12) !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}
.ai-chat-float-btn:hover {
  transform: scale(1.1) !important;
  box-shadow: 0 8px 32px rgba(124,58,237,0.55) !important;
}
@media (min-width: 768px) {
  .ai-chat-float-btn {
    bottom: 28px !important;
    right: 28px !important;
    width: 54px !important;
    height: 54px !important;
  }
}
`;

  write(rel, cleanBase + newDefs + "\n");

  const final = read(rel);
  log(`📄 globals.css جدید: ${final.split("\n").length} خط`);
  log(`ai-chat-float-btn تعداد: ${(final.match(/\.ai-chat-float-btn/g)||[]).length}`);
  log(`axon-sl-wrap تعداد: ${(final.match(/\.axon-sl-wrap/g)||[]).length}`);
}

// ═══════════════════════════════════════════════════════════════
// 2. MobileSlider.tsx — کامپوننت جدید، کاملاً clean
// ═══════════════════════════════════════════════════════════════
const MOBILE_SLIDER = `"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

export interface MobileSlide {
  id: string | number;
  title?: string;
  subtitle?: string;
  image?: string;
  link?: string;
  price?: number | null;
  badge?: string;
  cta?: string;
  gradient?: string;
}

interface SliderConfig {
  autoPlay?: boolean;
  interval?: number;
  height?: number;
  showDots?: boolean;
  borderRadius?: number;
}

interface Props {
  slides: MobileSlide[];
  config?: SliderConfig;
}

const GRADS = [
  "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)",
  "linear-gradient(135deg,#000428 0%,#004e92 100%)",
  "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
  "linear-gradient(135deg,#0d0d0d 0%,#1a0533 50%,#2d1b69 100%)",
  "linear-gradient(135deg,#141e30 0%,#243b55 100%)",
];

export default function MobileSlider({ slides, config = {} }: Props) {
  const {
    autoPlay   = true,
    interval   = 4200,
    height     = 224,
    showDots   = true,
    borderRadius = 20,
  } = config;

  const [active,  setActive]  = useState(0);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startX    = useRef(0);
  const startY    = useRef(0);
  const dragging  = useRef(false);

  const goTo = useCallback((i: number) => {
    setActive(((i % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  const startTimer = useCallback(() => {
    if (!autoPlay || slides.length <= 1) return;
    timerRef.current = setInterval(
      () => setActive(p => (p + 1) % slides.length),
      interval
    );
  }, [autoPlay, interval, slides.length]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => { startTimer(); return stopTimer; }, [startTimer, stopTimer]);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current   = e.touches[0].clientX;
    startY.current   = e.touches[0].clientY;
    dragging.current = true;
    stopTimer();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = startX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(startY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 44 && dy < 70) goTo(dx > 0 ? active + 1 : active - 1);
    startTimer();
  };

  if (!slides.length) return null;

  return (
    <div
      style={{
        height,
        borderRadius,
        overflow: "hidden",
        position: "relative",
        direction: "rtl",
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
      } as React.CSSProperties}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((s, i) => {
        const grad = s.gradient || GRADS[i % GRADS.length];
        const isActive = i === active;
        return (
          <div
            key={s.id}
            aria-hidden={!isActive}
            style={{
              position:    "absolute",
              inset:       0,
              background:  grad,
              opacity:     isActive ? 1 : 0,
              transition:  "opacity 0.52s cubic-bezier(.4,0,.2,1)",
              pointerEvents: isActive ? "auto" : "none",
              display:     "flex",
              alignItems:  "center",
              padding:     "0 20px",
              gap:         14,
            }}
          >
            {/* متن */}
            <div style={{ flex: "1 1 56%", minWidth: 0, paddingRight: 4 }}>
              {s.badge && (
                <div style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  marginBottom:   8,
                  padding:        "3px 10px",
                  borderRadius:   9999,
                  background:     "rgba(255,255,255,.18)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border:         "1px solid rgba(255,255,255,.28)",
                  color:          "#fff",
                  fontSize:       10,
                  fontWeight:     700,
                }}>
                  {s.badge}
                </div>
              )}
              {s.title && (
                <h2 style={{
                  margin:      "0 0 6px",
                  color:       "#fff",
                  fontSize:    "clamp(14px,3.8vw,20px)",
                  fontWeight:  800,
                  lineHeight:  1.3,
                  textShadow:  "0 2px 10px rgba(0,0,0,.6)",
                  overflow:    "hidden",
                  display:     "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                } as React.CSSProperties}>
                  {s.title}
                </h2>
              )}
              {s.subtitle && (
                <p style={{
                  margin:      "0 0 14px",
                  color:       "rgba(255,255,255,.78)",
                  fontSize:    "clamp(10px,2.8vw,13px)",
                  lineHeight:  1.5,
                  overflow:    "hidden",
                  display:     "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                } as React.CSSProperties}>
                  {s.subtitle}
                </p>
              )}
              {s.cta && (
                <a
                  href={s.link || "#"}
                  onClick={e => !s.link && e.preventDefault()}
                  style={{
                    display:        "inline-flex",
                    alignItems:     "center",
                    gap:            4,
                    background:     "rgba(255,255,255,.2)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    color:          "#fff",
                    fontSize:       12,
                    fontWeight:     700,
                    padding:        "7px 18px",
                    borderRadius:   9999,
                    border:         "1px solid rgba(255,255,255,.32)",
                    textDecoration: "none",
                    whiteSpace:     "nowrap",
                  }}
                >
                  {s.cta}
                  <span style={{ fontSize: 14, opacity: 0.8 }}>←</span>
                </a>
              )}
            </div>

            {/* تصویر */}
            {s.image && s.image !== "/placeholder.png" && (
              <div style={{ flex: "0 0 38%", height: "82%", position: "relative", flexShrink: 0 }}>
                <img
                  src={s.image}
                  alt={s.title || ""}
                  loading="lazy"
                  style={{
                    width:  "100%",
                    height: "100%",
                    objectFit:   "contain",
                    filter: "drop-shadow(0 6px 22px rgba(0,0,0,.55))",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* نشانگرها (dots) */}
      {showDots && slides.length > 1 && (
        <div style={{
          position:  "absolute",
          bottom:    10,
          left:      "50%",
          transform: "translateX(-50%)",
          display:   "flex",
          gap:       5,
          zIndex:    10,
        }}>
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={\`اسلاید \${i + 1}\`}
              onClick={() => { stopTimer(); goTo(i); startTimer(); }}
              style={{
                width:        i === active ? 20 : 6,
                height:       6,
                borderRadius: 9999,
                background:   i === active ? "#fff" : "rgba(255,255,255,.38)",
                border:       "none",
                padding:      0,
                cursor:       "pointer",
                transition:   "all .3s ease",
                flexShrink:   0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
`;

write("components/MobileSlider.tsx", MOBILE_SLIDER);

// ═══════════════════════════════════════════════════════════════
// 3. DynamicHomeSections.tsx — جایگزینی اسلایدر
// ═══════════════════════════════════════════════════════════════
{
  const rel = "components/DynamicHomeSections.tsx";
  let src = read(rel);
  if (!src) { log("❌ DynamicHomeSections.tsx نیافت"); process.exit(1); }

  // اضافه کردن import MobileSlider
  if (!src.includes("MobileSlider")) {
    src = src.replace(
      /^("use client";?\n)/,
      `"use client";\nimport MobileSlider from "@/components/MobileSlider";\n`
    );
    // اگر "use client" با \n نبود
    if (!src.includes('import MobileSlider')) {
      src = src.replace(
        /(["']use client["'];?)/,
        `$1\nimport MobileSlider from "@/components/MobileSlider";`
      );
    }
    log("✅ import MobileSlider اضافه شد");
  }

  // پیدا کردن بلوک رندر banners_slider (سومین و بعدی‌ها)
  // استراتژی: پیدا کردن if (sec.type === "banners_slider") در بدنه renderSectionByConfig
  const lines = src.split("\n");

  // پیدا کردن خط‌هایی که شامل banners_slider هستند
  const occurrences = [];
  lines.forEach((l, i) => {
    if (l.includes('"banners_slider"') || l.includes("'banners_slider'")) {
      occurrences.push(i);
    }
  });
  log(`تعداد banners_slider: ${occurrences.length} — در خطوط: ${occurrences.map(i=>i+1).join(", ")}`);

  // بلوک render (سوم به بعد) — معمولاً از if (sec.type شروع میشه
  let renderBlockStart = -1;
  for (let k = occurrences.length - 1; k >= 0; k--) {
    const lineIdx = occurrences[k];
    const line = lines[lineIdx].trim();
    // اگر شروع یه if block باشه
    if (line.startsWith("if") && line.includes("sec.type")) {
      renderBlockStart = lineIdx;
      break;
    }
  }

  if (renderBlockStart < 0) {
    // پیدا کردن خط بعد از effectiveSlides (جایی که render اتفاق میفته)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("sec.type") && lines[i].includes("banners_slider") && lines[i].includes("if")) {
        if (i > occurrences[0]) { // نه اولی (getDeviceVisibilityClasses)
          renderBlockStart = i;
          break;
        }
      }
    }
  }

  if (renderBlockStart < 0) {
    log("⚠️  render block پیدا نشد — نوشتن دستی");
    // بعد از effectiveSlides تعریف، پیدا کردن renderSectionByConfig
    const funcIdx = lines.findIndex(l => l.includes("renderSectionByConfig") || l.includes("renderSection"));
    if (funcIdx >= 0) {
      log(`renderSectionByConfig در خط ${funcIdx + 1}`);
    }
  } else {
    log(`render block شروع از خط ${renderBlockStart + 1}: ${lines[renderBlockStart].trim()}`);

    // پیدا کردن انتهای این بلوک if با شمارش {  }
    let depth = 0;
    let blockEnd = renderBlockStart;
    let started = false;
    for (let i = renderBlockStart; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (ch === "{") { depth++; started = true; }
        else if (ch === "}" && started) { depth--; }
      }
      if (started && depth === 0) { blockEnd = i; break; }
    }
    log(`render block پایان در خط ${blockEnd + 1}`);

    // بلوک جدید اسلایدر
    const newSliderBlock = `if (sec.type === "banners_slider") {
      if (effectiveSlides.length === 0) return null;
      return (
        <div key={sec.id} className={visibilityClass}>
          <MobileSlider
            slides={effectiveSlides}
            config={{ height: 224, autoPlay: true, interval: 4200, showDots: true }}
          />
        </div>
      );
    }`;

    // پیدا کردن indentation
    const indent = lines[renderBlockStart].match(/^(\s*)/)?.[1] || "    ";
    const indentedBlock = newSliderBlock
      .split("\n")
      .map((l, i) => i === 0 ? indent + l : indent + l)
      .join("\n");

    const before = lines.slice(0, renderBlockStart).join("\n");
    const after  = lines.slice(blockEnd + 1).join("\n");
    src = before + "\n" + indentedBlock + "\n" + after;
    log("✅ بلوک اسلایدر جدید جایگزین شد");
  }

  write(rel, src);
}

// ═══════════════════════════════════════════════════════════════
// 4. AIAssistantChat.tsx — bottom: 136px
// ═══════════════════════════════════════════════════════════════
{
  const rel = "components/AIAssistantChat.tsx";
  let src = read(rel);
  if (!src) { log("skip AIAssistantChat"); }
  else {
    let changed = false;

    // روش ۱: inline style با position fixed و bottom
    const newSrc1 = src.replace(
      /style=\{\{\s*position:\s*["']fixed["'],\s*bottom:\s*["'][^"']*["'],\s*right:\s*["']16px["'],\s*zIndex:\s*\d+\s*\}\}/,
      `style={{ position: "fixed", bottom: "136px", right: "16px", zIndex: 45 }}`
    );
    if (newSrc1 !== src) { src = newSrc1; changed = true; log("✅ AIAssistantChat — روش ۱"); }

    // روش ۲: فقط عدد bottom رو عوض کن
    if (!changed) {
      const newSrc2 = src.replace(
        /(bottom:\s*")(\d+)(px")/,
        `$1136$3`
      );
      if (newSrc2 !== src) { src = newSrc2; changed = true; log("✅ AIAssistantChat — روش ۲"); }
    }

    // روش ۳: جایگزینی خط حاوی bottom:
    if (!changed) {
      const lines2 = src.split("\n");
      const btnLine = lines2.findIndex(l => l.includes("ai-chat-float-btn"));
      if (btnLine >= 0) {
        for (let i = btnLine; i < Math.min(btnLine + 4, lines2.length); i++) {
          if (lines2[i].includes("bottom:")) {
            lines2[i] = lines2[i].replace(/bottom:\s*["']\d+px["']/, `bottom: "136px"`);
            changed = true;
            log(`✅ AIAssistantChat — روش ۳ در خط ${i + 1}`);
            break;
          }
        }
        if (changed) src = lines2.join("\n");
      }
    }

    if (!changed) log("⚠️  AIAssistantChat — هیچ تغییری نیافت");
    write(rel, src);
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. ProductCard.tsx — بهبود فضا و padding
// ═══════════════════════════════════════════════════════════════
{
  const rel = "components/ProductCard.tsx";
  let src = read(rel);
  if (src) {
    // اطمینان از اینکه بخش دکمه padding کافی داره
    const newSrc = src.replace(
      `className="p-3 sm:p-4 pt-2 relative z-10"`,
      `className="px-4 pb-4 pt-2 relative z-10"`
    );
    if (newSrc !== src) {
      write(rel, newSrc);
      log("✅ ProductCard — padding دکمه اصلاح شد");
    } else {
      log("ℹ️  ProductCard — padding تغییری نداشت");
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. بررسی خروجی نهایی
// ═══════════════════════════════════════════════════════════════
{
  const css = read("app/globals.css") || "";
  const aiCount = (css.match(/\.ai-chat-float-btn/g) || []).length;
  const slCount = (css.match(/\.axon-sl-wrap/g) || []).length;
  const lines = css.split("\n");

  log("\n═══ بررسی نهایی ═══");
  log(`globals.css: ${lines.length} خط`);
  log(`.ai-chat-float-btn: ${aiCount} بار`);
  log(`.axon-sl-wrap: ${slCount} بار`);
  log(`آخرین ۵ خط:\n${lines.slice(-5).join("\n")}`);

  // بررسی brace balance در globals.css
  let opens = 0, closes = 0;
  for (const ch of css) {
    if (ch === "{") opens++;
    else if (ch === "}") closes++;
  }
  log(`{ : ${opens}  } : ${closes}  تراز: ${opens === closes ? "✅ درست" : "❌ " + (opens - closes) + " باز مانده"}`);

  const dhs = read("components/DynamicHomeSections.tsx") || "";
  log(`\nMobileSlider import: ${dhs.includes("MobileSlider") ? "✅" : "❌"}`);
  log(`banners_slider blocks: ${(dhs.match(/banners_slider/g) || []).length}`);
}

// ═══════════════════════════════════════════════════════════════
// 7. Build
// ═══════════════════════════════════════════════════════════════
log("\n🔨 Build شروع شد...");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  log("✅ Build موفق");
} catch (e) {
  log("❌ Build ناموفق — git push انجام نمیشه");
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════
// 8. Git
// ═══════════════════════════════════════════════════════════════
const msg = `fix(mobile): nuclear CSS cleanup + new MobileSlider component

- globals.css: truncate at first broken .ai-chat-float-btn fragment
  (unclosed blocks were invalidating card-glass, btn-glass and all styles)
- MobileSlider.tsx: brand new clean component with touch/swipe,
  auto-play, dot indicators, gradient backgrounds, inline styles only
- DynamicHomeSections: replace old broken slider with MobileSlider
- AIAssistantChat: bottom 136px (above ProductDetail sticky bar)
- ProductCard: px-4 pb-4 on button section for edge breathing room

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GPCkuaxVKtN9Tnci5NSTZ8`;

fs.writeFileSync(path.join(ROOT, ".git", "AXON_FIX17.txt"), msg, "utf8");

try {
  execSync("git add -A",                              { stdio: "inherit", cwd: ROOT });
  execSync('git commit -F ".git/AXON_FIX17.txt"',    { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main",                    { stdio: "inherit", cwd: ROOT });
  log("🚀 Deploy به Vercel شروع شد!");
} catch (e) {
  log("❌ Git: " + (e.message || e));
  process.exit(1);
}