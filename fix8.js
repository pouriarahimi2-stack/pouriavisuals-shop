#!/usr/bin/env node
// fix8.js — redesign mobile slider + scroll fix + chat bubble fix
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = __dirname;

// ═══════════════════════════════════════════════════════════════
// ۱. app/page.tsx — اصلاح padding پایین برای اسکرول
// ═══════════════════════════════════════════════════════════════
{
  const p = path.join(ROOT, "app/page.tsx");
  let s = fs.readFileSync(p, "utf8");
  // pb-32 sm:pb-8 باعث میشه تبلت‌های 640-768px نتونن تا آخر اسکرول کنن
  // چون MobileBottomNav تا md:hidden (768px) نشون میده
  const wasChanged =
    s.includes('pb-32 sm:pb-8') ||
    s.includes('pb-32 sm:pb-6') ||
    s.includes('pb-28 sm:pb-8');

  s = s
    .replace(/\bpb-32\s+sm:pb-8\b/g,  'pb-36 sm:pb-28 md:pb-8')
    .replace(/\bpb-32\s+sm:pb-6\b/g,  'pb-36 sm:pb-28 md:pb-6')
    .replace(/\bpb-28\s+sm:pb-8\b/g,  'pb-36 sm:pb-28 md:pb-8');

  fs.writeFileSync(p, s, "utf8");
  console.log(wasChanged ? "✅ app/page.tsx — scroll padding اصلاح شد" : "ℹ️  app/page.tsx — بررسی شد");
}

// ═══════════════════════════════════════════════════════════════
// ۲. app/layout.tsx — اصلاح wrapper padding
// ═══════════════════════════════════════════════════════════════
{
  const p = path.join(ROOT, "app/layout.tsx");
  let s = fs.readFileSync(p, "utf8");
  // pb-16 lg:pb-0 کافی نیست برای موبایل
  s = s.replace(/\bpb-16\s+lg:pb-0\b/g, 'pb-20 md:pb-0');
  fs.writeFileSync(p, s, "utf8");
  console.log("✅ app/layout.tsx — wrapper padding اصلاح شد");
}

// ═══════════════════════════════════════════════════════════════
// ۳. AIAssistantChat — جابجایی trigger button
// ═══════════════════════════════════════════════════════════════
{
  const p = path.join(ROOT, "components/AIAssistantChat.tsx");
  let s = fs.readFileSync(p, "utf8");

  // چاپ خطوط مهم برای debug
  const lines = s.split("\n");
  console.log("\n=== AIAssistantChat — خطوط fixed ===");
  lines.forEach((l, i) => {
    if (l.includes("fixed") && (l.includes("bottom") || l.includes("right") || l.includes("left"))) {
      console.log(`  ${i+1}: ${l.trim()}`);
    }
  });

  // جابجایی trigger button (معمولاً bottom-4/5/6 left-4/right-4)
  let changed = false;

  // الگوهای رایج برای trigger button position
  const patterns = [
    // fixed bottom-X right-X  یا  fixed bottom-X left-X
    [/fixed bottom-4 right-4/g,   "fixed bottom-24 right-4"],
    [/fixed bottom-4 left-4/g,    "fixed bottom-24 right-4"],
    [/fixed bottom-5 right-4/g,   "fixed bottom-24 right-4"],
    [/fixed bottom-5 left-4/g,    "fixed bottom-24 right-4"],
    [/fixed bottom-6 right-4/g,   "fixed bottom-24 right-4"],
    [/fixed bottom-6 left-4/g,    "fixed bottom-24 right-4"],
    [/fixed bottom-4 right-5/g,   "fixed bottom-24 right-4"],
    [/fixed bottom-4 left-5/g,    "fixed bottom-24 right-4"],
    [/fixed bottom-20 left-4/g,   "fixed bottom-24 right-4"],
    [/fixed bottom-16 left-4/g,   "fixed bottom-24 right-4"],
    // bottom با مقدار px
    [/bottom-\[80px\] right-4/g,  "bottom-24 right-4"],
    [/bottom-\[80px\] left-4/g,   "bottom-24 right-4"],
    [/bottom-\[70px\] left-4/g,   "bottom-24 right-4"],
    [/bottom-\[60px\] left-4/g,   "bottom-24 right-4"],
  ];

  for (const [from, to] of patterns) {
    if (from.test(s)) {
      s = s.replace(from, to);
      changed = true;
    }
  }

  // اگر کاملاً پیدا نشد، نمایش کامل فایل برای debug
  if (!changed) {
    console.log("\n⚠️  AIAssistantChat — trigger button pattern پیدا نشد");
    console.log("خطوط ۱ تا ۳۰:");
    lines.slice(0, 30).forEach((l, i) => console.log(`  ${i+1}: ${l}`));
  }

  fs.writeFileSync(p, s, "utf8");
  if (changed) console.log("✅ AIAssistantChat — chat bubble به right-4 bottom-24 منتقل شد");
}

// ═══════════════════════════════════════════════════════════════
// ۴. DynamicHomeSections — طراحی کامل اسلایدر موبایل
// ═══════════════════════════════════════════════════════════════
{
  const p = path.join(ROOT, "components/DynamicHomeSections.tsx");
  let s = fs.readFileSync(p, "utf8");

  // ── نشون دادن slide render برای debug ──
  const lines = s.split("\n");
  const startIdx = lines.findIndex(l => l.includes("effectiveSlides.map((slide, idx)"));
  if (startIdx >= 0) {
    console.log("\n=== DynamicHomeSections — slide render (خطوط " + (startIdx+1) + " تا " + (startIdx+70) + ") ===");
    lines.slice(startIdx, startIdx+70).forEach((l, i) => console.log(`  ${startIdx+i+1}: ${l}`));
  }

  // ── طراحی جدید اسلایدر ──
  // پیدا کردن بلوک map تا قبل از navigation dots
  // تلاش برای پیدا کردن OLD slide render با الگوهای مختلف
  const OLD_SLIDE_MARKER_START = /\{effectiveSlides\.map\(\(slide,\s*idx\)\s*=>\s*\{/;
  const OLD_SLIDE_MARKER_END   = /\}\)\}\s*\{\/\*?\s*(nav|dot|نشانگر|اسلاید|indicator)/i;

  const mapStart = s.search(OLD_SLIDE_MARKER_START);
  if (mapStart === -1) {
    console.log("⚠️  الگوی effectiveSlides.map پیدا نشد");
  } else {
    // پیدا کردن انتهای map (})} قبل از dots)
    // جستجو برای پایان })} که بعدش dots میاد
    const afterMap = s.slice(mapStart);
    // پیدا کردن })} که انتهای .map است
    let depth = 0;
    let i = afterMap.indexOf("{");
    let mapEnd = -1;
    // اضافه کردن شروع bracket که قبل از { هست (خود map arrow)
    // counting از ابتدای afterMap
    for (let ci = 0; ci < afterMap.length; ci++) {
      if (afterMap[ci] === "{") depth++;
      else if (afterMap[ci] === "}") {
        depth--;
        if (depth === 0) {
          // این باید })} باشه
          if (afterMap.slice(ci, ci+3) === "})}") {
            mapEnd = ci + 3;
            break;
          }
        }
      }
    }

    if (mapEnd > 0) {
      const oldMapBlock = afterMap.slice(0, mapEnd);

      // نسخه جدید slide — طراحی تمیز برای موبایل فارسی RTL
      const newMapBlock = `{effectiveSlides.map((slide: any, idx: number) => {
              const isActive = idx === activeSlide;
              const bg = slide.bgColor || slide.bg_color || slide.backgroundColor || "var(--modal-bg)";
              const img = slide.imageUrl || slide.image_url || slide.image || slide.thumbnail || "";
              const title = slide.title || "";
              const badge = slide.badge || slide.category || slide.categoryName || "";
              const price = slide.price || slide.display_price || slide.finalPrice || 0;
              const href = slide.link || slide.url || slide.href || "#";
              return (
                <div
                  key={idx}
                  className={"absolute inset-0 transition-opacity duration-500 " + (isActive ? "opacity-100 z-10" : "opacity-0 z-0")}
                >
                  <div className="relative w-full h-full flex items-stretch overflow-hidden rounded-[1.5rem]" style={{ background: bg }}>
                    {/* ناحیه متن — راست (RTL) */}
                    <div className="relative z-10 flex flex-col justify-center pr-4 pl-2 py-4 gap-2" style={{ width: "58%" }}>
                      {badge ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full w-fit border border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                          {badge}
                        </span>
                      ) : null}
                      <h3 className="text-sm font-black text-[var(--text-primary)] leading-snug line-clamp-2 text-right">
                        {title}
                      </h3>
                      {price ? (
                        <p className="text-[11px] font-bold text-[var(--accent-blue)] text-right">
                          {typeof formatPrice === "function" ? formatPrice(Number(price)) : Number(price).toLocaleString("fa-IR")} ت
                        </p>
                      ) : null}
                      <Link
                        href={href}
                        onClick={() => soundEngine.playClick()}
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-l from-[var(--accent-blue)] to-[var(--accent-violet)] rounded-full px-3 py-1.5 w-fit shadow-md active:scale-95 transition-transform select-none"
                      >
                        مشاهده
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                      </Link>
                    </div>
                    {/* ناحیه تصویر — چپ */}
                    <div className="absolute left-0 top-0 bottom-0 overflow-hidden" style={{ width: "46%" }}>
                      {img ? (
                        <img
                          src={img}
                          alt={title}
                          className="absolute inset-0 w-full h-full object-contain object-center p-2"
                          loading={idx === 0 ? "eager" : "lazy"}
                          draggable={false}
                        />
                      ) : null}
                      {/* gradient fade از چپ به راست */}
                      <div className="absolute inset-0 bg-gradient-to-l from-[var(--modal-bg)] via-[var(--modal-bg)]/50 to-transparent pointer-events-none" />
                    </div>
                  </div>
                </div>
              );
            })}`;

      s = s.replace(oldMapBlock, newMapBlock);
      console.log("✅ DynamicHomeSections — slide render با طراحی جدید جایگزین شد");
    } else {
      console.log("⚠️  نتوانستم انتهای map block رو پیدا کنم — skip");
    }
  }

  // ── ارتفاع اسلایدر ──
  // container اسلایدر باید ارتفاع داشته باشه
  s = s.replace(/mobileHeight:\s*\d+,/g, "mobileHeight: 210,");

  // ── wrapper section ──
  // اضافه کردن overflow-hidden به wrapper
  s = s.replace(
    /className=\{getDeviceVisibilityClasses\(sec\)\}/g,
    'className={getDeviceVisibilityClasses(sec) + " overflow-hidden"}'
  );

  fs.writeFileSync(p, s, "utf8");
}

// ═══════════════════════════════════════════════════════════════
// Build
// ═══════════════════════════════════════════════════════════════
console.log("\n🔨 build...\n");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ بیلد موفق!\n");
} catch {
  console.error("❌ بیلد شکست — fix8 بدون push متوقف شد");
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════
// Git push
// ═══════════════════════════════════════════════════════════════
const msgFile = path.join(ROOT, ".git", "FIX8.txt");
fs.writeFileSync(msgFile, [
  "fix(ui): mobile slider redesign + scroll fix + chat bubble",
  "",
  "- DynamicHomeSections: complete mobile banner slider redesign",
  "  clean RTL card: text right 58% + image left 46% with overflow:hidden",
  "  badge / title / price / cta button with gradient, no overflow",
  "- app/page.tsx: pb-32 sm:pb-28 md:pb-8 (was pb-32 sm:pb-8)",
  "  fixes scroll-to-bottom on 640-768px devices with MobileBottomNav",
  "- app/layout.tsx: pb-20 md:pb-0 wrapper padding",
  "- AIAssistantChat: trigger button moved to bottom-24 right-4",
  "",
  "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>",
  "Claude-Session: https://claude.ai/code/session_01GPCkuddNi1nS597FzKS4FV",
].join("\n"), "utf8");

execSync("git add -A",                    { stdio: "inherit", cwd: ROOT });
execSync('git commit -F ".git/FIX8.txt"', { stdio: "inherit", cwd: ROOT });
execSync("git push origin main",          { stdio: "inherit", cwd: ROOT });
console.log("✅ push شد!");