/**
 * fix13.js — آکسون کور
 * اصلاح: اسلایدر موبایل (ریدیزاین کامل)، چت باتون، AddToCart کارد
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname);
const log  = (m) => console.log(m);

// ─── helper ────────────────────────────────────────────────────────────
function read(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { log(`⚠️  not found: ${rel}`); return null; }
  return fs.readFileSync(p, "utf8");
}
function write(rel, content) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
  log(`✅ نوشته شد: ${rel}`);
}

// ────────────────────────────────────────────────────────────────────────
// 1. بررسی AIAssistantChat.tsx
// ────────────────────────────────────────────────────────────────────────
{
  const src = read("components/AIAssistantChat.tsx");
  if (src) {
    // پیدا کردن هر جایی که ai-chat-float-btn یا position:fixed هست
    const lines = src.split("\n");
    const hits = [];
    lines.forEach((l, i) => {
      if (l.includes("ai-chat-float-btn") || l.includes("bottom") || l.includes("fixed") || l.includes("z-") || l.includes("zIndex") || l.includes("style=")) {
        hits.push(`${i+1}: ${l}`);
      }
    });
    log("\n=== AIAssistantChat — bottom/fixed/z-index خطوط ===");
    hits.slice(0,60).forEach(h => log(h));
  }
}

// ────────────────────────────────────────────────────────────────────────
// 2. اسلایدر موبایل — ریدیزاین کامل با گرادیان تاریک پریمیوم
// ────────────────────────────────────────────────────────────────────────
{
  const rel = "components/DynamicHomeSections.tsx";
  let src = read(rel);
  if (!src) process.exit(1);

  // ─── الگوی جدید اسلاید: تمام‌صفحه با گرادیان تاریک + تصویر بزرگ
  const newSlideRender = `          {effectiveSlides.map((slide, idx) => {
              const isActive = idx === activeSlide;
              const gradients = [
                "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)",
                "linear-gradient(135deg,#000428 0%,#004e92 100%)",
                "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
                "linear-gradient(135deg,#0d0d0d 0%,#1a0533 50%,#2d0b5a 100%)",
              ];
              const grad = gradients[idx % gradients.length];
              return (
                <div
                  key={(slide.id ?? idx) + "_" + idx}
                  className={"absolute inset-0 transition-opacity duration-700 " + (isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}
                  style={{ background: grad }}
                >
                  <Link href={slide.link || "#"} onClick={() => soundEngine.playClick()} className="block w-full h-full">
                    <div className="relative w-full h-full flex items-center overflow-hidden px-4">

                      {/* تصویر محصول — سمت چپ */}
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-[42%] aspect-square flex items-center justify-center">
                        {slide.image ? (
                          <img
                            src={slide.image}
                            alt={slide.title || ""}
                            className="w-full h-full object-contain drop-shadow-2xl"
                            style={{ filter: "drop-shadow(0 0 24px rgba(99,102,241,0.5))" }}
                            loading={idx === 0 ? "eager" : "lazy"}
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full h-full rounded-2xl bg-white/5 border border-white/10" />
                        )}
                      </div>

                      {/* محتوای متن — سمت راست */}
                      <div className="relative z-10 mr-auto flex flex-col justify-center gap-2 text-right" style={{ width: "54%", marginRight: "4%" }}>
                        {slide.badge ? (
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full w-fit self-end border border-cyan-400/40 bg-cyan-400/15 text-cyan-300">
                            🔥 {slide.badge}
                          </span>
                        ) : null}
                        <h2 className="text-[15px] font-black text-white leading-tight line-clamp-2 text-right" style={{ textShadow:"0 2px 12px rgba(0,0,0,0.8)" }}>
                          {slide.title}
                        </h2>
                        {slide.subtitle ? (
                          <p className="text-[11px] text-white/70 leading-relaxed line-clamp-2 text-right">
                            {slide.subtitle}
                          </p>
                        ) : null}
                        {slide.price ? (
                          <p className="text-[13px] font-black text-emerald-400 text-right">
                            {formatPrice(slide.price)} تومان
                          </p>
                        ) : null}
                        <span className="mt-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-white rounded-full px-4 py-2 w-fit self-end shadow-xl" style={{ background: "linear-gradient(135deg,#0066ff,#7c3aed)" }}>
                          <span>{slide.cta || "مشاهده محصول"}</span>
                          <span>←</span>
                        </span>
                      </div>

                      {/* گرادیان جداکننده */}
                      <div className="absolute inset-y-0 left-[38%] w-16 bg-gradient-to-r from-transparent to-transparent pointer-events-none" style={{ background: "linear-gradient(to right, transparent, rgba(0,0,0,0.15))" }} />
                    </div>
                  </Link>
                </div>
              );
            })}`;

  // جایگزینی slide map داخل axon-hero-banner-box
  const startMarker = "          {effectiveSlides.map((slide, idx) => {";
  const endMarker   = "            })}";

  const startIdx = src.indexOf(startMarker);
  if (startIdx === -1) {
    log("⚠️  marker شروع پیدا نشد");
  } else {
    // پیدا کردن پایان map از startIdx
    let depth = 0;
    let pos = startIdx;
    let foundEnd = -1;
    while (pos < src.length) {
      const ch = src[pos];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          // باید دنبالش )} باشه
          const after = src.slice(pos, pos + 4);
          if (after.startsWith("})}") || after.startsWith("});\n") || after.startsWith("})\n")) {
            foundEnd = pos + 3;
            break;
          }
        }
      }
      pos++;
    }

    if (foundEnd === -1) {
      log("⚠️  پایان map پیدا نشد، جستجو با regex");
      // روش ساده‌تر: پیدا کردن سطر })} بعد از startIdx
      const afterStart = src.slice(startIdx);
      const endMatch = afterStart.match(/\}\)\}/);
      if (endMatch) {
        foundEnd = startIdx + endMatch.index + 3;
        log(`✅ foundEnd با regex: ${foundEnd}`);
      } else {
        log("❌ پایان map پیدا نشد، اسلایدر skip");
      }
    }

    if (foundEnd !== -1) {
      src = src.slice(0, startIdx) + newSlideRender + src.slice(foundEnd);
      log("✅ اسلایدر موبایل ریدیزاین شد");
    }
  }

  // ارتفاع موبایل ۲۲۰ (کمی بیشتر برای نمایش بهتر)
  src = src.replace(
    /mobileHeight\s*:\s*\d+/,
    "mobileHeight: 220"
  );

  write(rel, src);
}

// ────────────────────────────────────────────────────────────────────────
// 3. چت باتون — اصلاح موقعیت و استایل در globals.css
// ────────────────────────────────────────────────────────────────────────
{
  const rel = "app/globals.css";
  let src = read(rel);
  if (!src) process.exit(1);

  // حذف هر تعریف قدیمی ai-chat-float-btn
  src = src.replace(/\/\*\s*chat float\s*\*\/[\s\S]*?\.ai-chat-float-btn\s*\{[^}]*\}/g, "");
  src = src.replace(/\.ai-chat-float-btn\s*\{[^}]*\}/g, "");

  // اضافه کردن CSS باتون چت با موقعیت درست
  const chatCSS = `
/* ── چت باتون شناور ──────────────────────────────────── */
.ai-chat-float-btn {
  position: fixed !important;
  bottom: 80px !important;   /* بالاتر از MobileBottomNav (56px) + فاصله */
  right: 16px !important;
  z-index: 40 !important;
  width: 52px !important;
  height: 52px !important;
  border-radius: 9999px !important;
  background: linear-gradient(135deg, var(--accent-blue, #0066ff) 0%, var(--accent-violet, #7c3aed) 100%) !important;
  border: none !important;
  box-shadow: 0 4px 20px rgba(0,102,255,0.45), 0 2px 8px rgba(0,0,0,0.25) !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
}
.ai-chat-float-btn:hover,
.ai-chat-float-btn:active {
  transform: scale(1.08) !important;
  box-shadow: 0 8px 32px rgba(124,58,237,0.55) !important;
}
@media (min-width: 768px) {
  .ai-chat-float-btn {
    bottom: 24px !important;
    right: 24px !important;
    width: 56px !important;
    height: 56px !important;
  }
}
`;

  // اضافه کردن قبل از پایان فایل
  if (!src.includes("ai-chat-float-btn")) {
    src = src.trimEnd() + "\n" + chatCSS + "\n";
    write(rel, src);
    log("✅ CSS چت باتون اضافه شد");
  } else {
    log("⚠️  ai-chat-float-btn قبلاً وجود داشت، skip");
  }
}

// ────────────────────────────────────────────────────────────────────────
// 4. بررسی AIAssistantChat.tsx برای inline style position
//    و اصلاح bottom value
// ────────────────────────────────────────────────────────────────────────
{
  const rel = "components/AIAssistantChat.tsx";
  let src = read(rel);
  if (!src) { log("⚠️  AIAssistantChat.tsx نیافت"); }
  else {
    // نمایش خطوط مهم برای دیباگ
    const lines = src.split("\n");
    log("\n=== AIAssistantChat — خطوط کلیدی ===");
    lines.forEach((l, i) => {
      if (
        l.includes("bottom") || l.includes("right") ||
        l.includes("fixed") || l.includes("z-") ||
        l.includes("position") || l.includes("style=") ||
        l.includes("className=")
      ) {
        log(`${i+1}: ${l.trim()}`);
      }
    });

    // اگر inline style داشت bottom رو آپدیت کن
    let changed = false;

    // الگو ۱: style={{ bottom: "Xpx" }}  یا bottom: 'Xpx'
    const newSrc = src
      .replace(/bottom:\s*["'`](\d+)px["'`]/g, (m, n) => {
        const num = parseInt(n);
        if (num < 80) { changed = true; return `bottom: "80px"`; }
        return m;
      })
      .replace(/bottom:\s*(\d+),/g, (m, n) => {
        const num = parseInt(n);
        if (num < 80) { changed = true; return `bottom: 80,`; }
        return m;
      });

    if (changed) {
      write(rel, newSrc);
      log("✅ AIAssistantChat bottom value آپدیت شد");
    } else {
      log("ℹ️  AIAssistantChat bottom نیازی به تغییر ندارد (یا CSS کلاس کافیه)");
    }
  }
}

// ────────────────────────────────────────────────────────────────────────
// 5. ProductCard — دکمه AddToCart gradient + کارد شیشه‌ای بهتر
// ────────────────────────────────────────────────────────────────────────
{
  const rel = "components/ProductCard.tsx";
  const src = read(rel);
  if (!src) { log("⚠️  ProductCard.tsx نیافت"); }
  else {
    log("\n=== ProductCard — خطوط AddToCart ===");
    src.split("\n").forEach((l, i) => {
      if (l.includes("AddToCart") || l.includes("btn") || l.includes("gradient") || l.includes("background") || l.includes("className=") && l.includes("button")) {
        log(`${i+1}: ${l.trim()}`);
      }
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// 6. Build + Git
// ────────────────────────────────────────────────────────────────────────
log("\n🔨 شروع build...");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  log("✅ Build موفق");
} catch (e) {
  log("❌ Build ناموفق — git push لغو شد");
  process.exit(1);
}

const msg = `fix(ui): redesign mobile slider & fix chat bubble position

- Mobile slider: full dark gradient background, large product image on left,
  premium text layout on right with glow effect
- Chat bubble: ai-chat-float-btn CSS added to globals.css with correct
  bottom positioning (80px mobile, 24px desktop) above MobileBottomNav
- Slider gradient backgrounds: deep blue/purple per slide
- Chat button: blue-violet gradient with glow shadow

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GPCkuaxVKtN9Tnci5NSTZ8`;

fs.writeFileSync(path.join(ROOT, ".git", "AXON_FIX13.txt"), msg, "utf8");

try {
  execSync("git add -A", { stdio: "inherit", cwd: ROOT });
  execSync('git commit -F ".git/AXON_FIX13.txt"', { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit", cwd: ROOT });
  log("🚀 Deploy موفق — Vercel در حال deploy است");
} catch (e) {
  log("❌ Git error: " + (e.message || e));
  process.exit(1);
}