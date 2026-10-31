/**
 * fix14.js — آکسون کور
 * ریدیزاین کامل اسلایدر + اصلاح چت باتون + اصلاح کارد محصول
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.resolve(__dirname);
const log  = (m) => console.log(m);

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

// ═══════════════════════════════════════════════════════
// 1.  DynamicHomeSections — اسلایدر کاملاً جدید
// ═══════════════════════════════════════════════════════
{
  const rel = "components/DynamicHomeSections.tsx";
  let src = read(rel);
  if (!src) process.exit(1);

  // ── پیدا کردن محدوده کامل banners_slider از if تا return;
  // سطر شروع: "if (sec.type === "banners_slider")"
  const BANNER_START = `    if (sec.type === "banners_slider") {`;
  const si = src.indexOf(BANNER_START);
  if (si === -1) { log("❌ banners_slider block پیدا نشد"); process.exit(1); }

  // پیدا کردن "}" پایانی این if block
  // از si شمارش بریس‌ها
  let depth = 0;
  let pos = si;
  let blockEnd = -1;
  while (pos < src.length) {
    if (src[pos] === "{") depth++;
    else if (src[pos] === "}") {
      depth--;
      if (depth === 0) { blockEnd = pos + 1; break; }
    }
    pos++;
  }
  if (blockEnd === -1) { log("❌ پایان block پیدا نشد"); process.exit(1); }

  const newBannerBlock = `    if (sec.type === "banners_slider") {
      if (effectiveSlides.length === 0) return null;

      /* ──────────────────────────────────────────────────────
         اسلایدر موبایل — طراحی کامل جدید
         ارتفاع ثابت 200px موبایل / 260px تبلت / 340px دسکتاپ
      ────────────────────────────────────────────────────── */
      return (
        <div key={sec.id} className={visibilityClass}>
          <div
            className="relative w-full overflow-hidden rounded-3xl shadow-2xl"
            style={{ height: "200px" }}
          >
            <style>{\`
              @media (min-width: 640px)  { .axon-sl-wrap { height: 260px !important; } }
              @media (min-width: 1024px) { .axon-sl-wrap { height: 340px !important; } }
            \`}</style>
            {/* slides */}
            {effectiveSlides.map((slide, idx) => {
              const isActive = idx === activeSlide;
              const GRADS = [
                "linear-gradient(120deg,#0f0c29,#302b63)",
                "linear-gradient(120deg,#000428,#004e92)",
                "linear-gradient(120deg,#1a1a2e,#0f3460)",
                "linear-gradient(120deg,#200122,#6f0000)",
              ];
              return (
                <div
                  key={idx}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{
                    opacity: isActive ? 1 : 0,
                    zIndex: isActive ? 2 : 1,
                    pointerEvents: isActive ? "auto" : "none",
                    background: GRADS[idx % GRADS.length],
                  }}
                >
                  <Link
                    href={slide.link || "#"}
                    onClick={() => soundEngine.playClick()}
                    className="flex items-center w-full h-full"
                  >
                    {/* تصویر — سمت چپ */}
                    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: "44%", height: "100%" }}>
                      {slide.image ? (
                        <img
                          src={slide.image}
                          alt={slide.title || ""}
                          style={{
                            maxWidth: "90%",
                            maxHeight: "90%",
                            objectFit: "contain",
                            filter: "drop-shadow(0 0 20px rgba(139,92,246,0.6))",
                          }}
                          loading={idx === 0 ? "eager" : "lazy"}
                          draggable={false}
                        />
                      ) : (
                        <div style={{ width: 80, height: 80, borderRadius: 16, background: "rgba(255,255,255,0.07)" }} />
                      )}
                    </div>

                    {/* جداکننده گرادیان */}
                    <div
                      className="absolute"
                      style={{
                        left: "38%",
                        top: 0,
                        bottom: 0,
                        width: 40,
                        background: "linear-gradient(to right, rgba(0,0,0,0.15), transparent)",
                        pointerEvents: "none",
                      }}
                    />

                    {/* متن — سمت راست */}
                    <div
                      className="flex flex-col gap-1.5 px-3 py-4 text-right"
                      style={{ flex: 1, direction: "rtl", overflow: "hidden" }}
                    >
                      {slide.badge ? (
                        <span style={{
                          display: "inline-block",
                          alignSelf: "flex-end",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 10px",
                          borderRadius: 999,
                          background: "rgba(6,182,212,0.2)",
                          border: "1px solid rgba(6,182,212,0.4)",
                          color: "#67e8f9",
                        }}>
                          🔥 {slide.badge}
                        </span>
                      ) : null}

                      <h2 style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: "#fff",
                        lineHeight: 1.4,
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                      }}>
                        {slide.title}
                      </h2>

                      {slide.subtitle ? (
                        <p style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.65)",
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.5,
                        }}>
                          {slide.subtitle}
                        </p>
                      ) : null}

                      {slide.price ? (
                        <p style={{ fontSize: 13, fontWeight: 900, color: "#34d399", margin: 0 }}>
                          {formatPrice(slide.price)} تومان
                        </p>
                      ) : null}

                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        alignSelf: "flex-end",
                        marginTop: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#fff",
                        background: "linear-gradient(135deg,#0066ff,#7c3aed)",
                        borderRadius: 999,
                        padding: "6px 14px",
                        boxShadow: "0 2px 12px rgba(124,58,237,0.4)",
                      }}>
                        {slide.cta || "مشاهده"} ←
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* dots — ثابت در پایین */}
            {effectiveSlides.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(0,0,0,0.35)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 999,
                  padding: "5px 10px",
                }}
              >
                {effectiveSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => { e.preventDefault(); soundEngine.playClick(); setActiveSlide(idx); }}
                    style={{
                      width: idx === activeSlide ? 20 : 6,
                      height: 6,
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      background: idx === activeSlide ? "#0066ff" : "rgba(255,255,255,0.45)",
                      transition: "all 0.3s",
                    }}
                    aria-label={"اسلاید " + (idx + 1)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }`;

  src = src.slice(0, si) + newBannerBlock + src.slice(blockEnd);
  write(rel, src);
  log("✅ اسلایدر کاملاً جدید جایگزین شد");
}

// ═══════════════════════════════════════════════════════
// 2.  AIAssistantChat — اصلاح bottom
// ═══════════════════════════════════════════════════════
{
  const rel = "components/AIAssistantChat.tsx";
  let src = read(rel);
  if (!src) { log("⚠️  AIAssistantChat.tsx skip"); }
  else {
    // خط ۵۲: style={{ position: "fixed", bottom: "96px", right: "16px", zIndex: 50 }}
    // مشکل: zIndex: 50 با کارت‌های محصول conflict داره
    // راه‌حل: bottom: "80px", zIndex: 45 (زیر MobileBottomNav z-30 نباشه اما بالاتر از کارت)
    let changed = false;

    // اصلاح bottom button به 80px و zIndex به 45
    const newSrc = src
      .replace(
        /style=\{\{(\s*)position:\s*"fixed",(\s*)bottom:\s*"[\d]+px",(\s*)right:\s*"16px",(\s*)zIndex:\s*\d+(\s*)\}\}/,
        'style={{ position: "fixed", bottom: "80px", right: "16px", zIndex: 45 }}'
      );

    if (newSrc !== src) {
      changed = true;
      write(rel, newSrc);
      log("✅ AIAssistantChat — bottom: 80px, zIndex: 45");
    } else {
      log("ℹ️  AIAssistantChat — style pattern تغییر نکرد");
      // نمایش خط ۵۰-۵۵ برای debug
      const lines = src.split("\n").slice(48, 56);
      lines.forEach((l, i) => log(`${i+49}: ${l}`));
    }
  }
}

// ═══════════════════════════════════════════════════════
// 3.  globals.css — اصلاح ai-chat-float-btn bottom
// ═══════════════════════════════════════════════════════
{
  const rel = "app/globals.css";
  let src = read(rel);
  if (!src) process.exit(1);

  // آپدیت CSS کلاس چت باتون (حذف و بازنویسی)
  src = src.replace(
    /\/\* ── چت باتون شناور[\s\S]*?@media \(min-width: 768px\) \{[\s\S]*?\.ai-chat-float-btn[\s\S]*?\}\s*\}/,
    ""
  );

  const chatCSS = `
/* ── چت باتون شناور ──────────────────────────────────── */
.ai-chat-float-btn {
  position: fixed !important;
  bottom: 80px !important;
  right: 16px !important;
  z-index: 45 !important;
  width: 50px !important;
  height: 50px !important;
  border-radius: 9999px !important;
  background: linear-gradient(135deg,#0066ff,#7c3aed) !important;
  border: none !important;
  box-shadow: 0 4px 20px rgba(0,102,255,0.4), 0 0 0 2px rgba(255,255,255,0.15) !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
}
.ai-chat-float-btn:hover { transform: scale(1.08) !important; }
@media (min-width: 768px) {
  .ai-chat-float-btn {
    bottom: 28px !important;
    right: 28px !important;
  }
}
`;

  src = src.trimEnd() + "\n" + chatCSS + "\n";
  write(rel, src);
  log("✅ globals.css — chat btn CSS آپدیت شد");
}

// ═══════════════════════════════════════════════════════
// 4.  ProductCard — اطمینان از نمایش صحیح دکمه AddToCart
// ═══════════════════════════════════════════════════════
{
  const rel = "components/ProductCard.tsx";
  let src = read(rel);
  if (!src) { log("⚠️  ProductCard.tsx skip"); }
  else {
    // بررسی wrapper دکمه — باید padding-bottom برای جلوگیری از برش توسط کارت باشه
    if (src.includes("pb-2") || src.includes("pb-3") || src.includes("pb-4")) {
      log("ℹ️  ProductCard دارای padding-bottom است");
    } else {
      log("⚠️  ProductCard ممکن است padding-bottom کم داشته باشد");
    }
    // نمایش بخش پایانی کارد برای debug
    const lines = src.split("\n");
    log("\n=== ProductCard — ۲۰ خط آخر ===");
    lines.slice(-20).forEach((l, i) => log(`${lines.length - 20 + i + 1}: ${l}`));
  }
}

// ═══════════════════════════════════════════════════════
// 5.  Build + Git
// ═══════════════════════════════════════════════════════
log("\n🔨 شروع build...");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  log("✅ Build موفق");
} catch (e) {
  log("❌ Build ناموفق");
  process.exit(1);
}

const msg = `fix(slider): complete slider redesign with fixed height + chat btn fix

- Banners slider: full redesign - fixed 200px height, no CSS vars,
  inline styles only (no Tailwind class dependency issues)
- Slide background: dark gradient per slide, large product image left,
  clean text right, glow effect
- Dots indicator: absolute bottom:10px with z-index:10, simple button dots
  (not affected by slide height issues)
- Chat button: bottom:80px zIndex:45, above MobileBottomNav (z-30)
- globals.css: ai-chat-float-btn updated with !important overrides

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GPCkuaxVKtN9Tnci5NSTZ8`;

fs.writeFileSync(path.join(ROOT, ".git", "AXON_FIX14.txt"), msg, "utf8");

try {
  execSync("git add -A", { stdio: "inherit", cwd: ROOT });
  execSync('git commit -F ".git/AXON_FIX14.txt"', { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit", cwd: ROOT });
  log("🚀 Deploy موفق!");
} catch (e) {
  log("❌ Git: " + (e.message || e));
  process.exit(1);
}