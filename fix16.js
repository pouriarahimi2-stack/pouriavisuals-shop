/**
 * fix16.js — آکسون کور — فیکس نهایی
 * ۱. پاک‌سازی کامل globals.css از بلوک‌های شکسته/تکراری
 * ۲. chat bubble: bottom بالاتر برای همه صفحات
 * ۳. ProductDetailClient: chat bubble تداخل نداره
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
  log(`✅ ${rel}`);
}

// ═══════════════════════════════════════════════════════════════
// 1. globals.css — پاک‌سازی کامل همه fragment های تکراری
// ═══════════════════════════════════════════════════════════════
{
  const rel = "app/globals.css";
  let src = read(rel);
  if (!src) process.exit(1);

  log(`\n📄 globals.css — تعداد خطوط قبل از پاکسازی: ${src.split("\n").length}`);
  log(`تعداد .ai-chat-float-btn: ${(src.match(/\.ai-chat-float-btn/g) || []).length}`);
  log(`تعداد .axon-sl-wrap: ${(src.match(/\.axon-sl-wrap/g) || []).length}`);

  // ─── حذف همه بلوک‌های ai-chat-float-btn (با regex multiline) ───
  // الگو ۱: بلوک کامل با properties
  src = src.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/\s*\n\.ai-chat-float-btn\s*\{[\s\S]*?\}\s*\n\.ai-chat-float-btn:hover[^}]*\}\s*\n@media[^{]*\{[\s\S]*?\}\s*\}/g, "");
  // الگو ۲: هر بلوک { } که شامل ai-chat-float-btn هست
  src = src.replace(/\.ai-chat-float-btn\s*\{[^}]*\}/g, "");
  // الگو ۳: single-line hover
  src = src.replace(/\.ai-chat-float-btn:hover\s*\{[^}]*\}/g, "");
  // الگو ۴: تعریف داخل media query
  src = src.replace(/@media[^{]*\{\s*\.ai-chat-float-btn\s*\{[^}]*\}\s*\}/g, "");
  // الگو ۵: comment های مرتبط
  src = src.replace(/\/\*\s*[─—]*\s*چت باتون[\s\S]*?\*\//g, "");

  // ─── حذف همه بلوک‌های axon-sl-wrap ───
  src = src.replace(/\/\*\s*[─—]*\s*اسلایدر wrapper[\s\S]*?\*\//g, "");
  src = src.replace(/\.axon-sl-wrap\s*\{[^}]*\}/g, "");
  src = src.replace(/@media[^{]*\{\s*\.axon-sl-wrap\s*\{[^}]*\}\s*\}/g, "");

  // پاک کردن خطوط خالی اضافی (بیش از ۲ خط خالی متوالی)
  src = src.replace(/\n{3,}/g, "\n\n");

  log(`\n📄 globals.css — بعد از پاکسازی: ${src.split("\n").length} خط`);
  log(`تعداد .ai-chat-float-btn بعد: ${(src.match(/\.ai-chat-float-btn/g) || []).length}`);
  log(`تعداد .axon-sl-wrap بعد: ${(src.match(/\.axon-sl-wrap/g) || []).length}`);

  // ─── اضافه کردن تعریف‌های تمیز ───
  const newCSS = `

/* ══ چت باتون شناور ══════════════════════════════════════ */
.ai-chat-float-btn {
  position: fixed !important;
  bottom: 130px !important;
  right: 16px !important;
  z-index: 45 !important;
  width: 50px !important;
  height: 50px !important;
  border-radius: 9999px !important;
  background: linear-gradient(135deg, #0066ff, #7c3aed) !important;
  border: none !important;
  box-shadow: 0 4px 20px rgba(0,102,255,0.4), 0 0 0 2px rgba(255,255,255,0.12) !important;
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

/* ══ اسلایدر موبایل wrapper ══════════════════════════════ */
.axon-sl-wrap {
  height: 210px !important;
  min-height: 210px !important;
  position: relative !important;
  overflow: hidden !important;
}
@media (min-width: 640px) {
  .axon-sl-wrap {
    height: 270px !important;
    min-height: 270px !important;
  }
}
@media (min-width: 1024px) {
  .axon-sl-wrap {
    height: 350px !important;
    min-height: 350px !important;
  }
}
`;

  src = src.trimEnd() + newCSS + "\n";
  write(rel, src);
  log(`✅ globals.css پاک و بازنویسی شد — ${src.split("\n").length} خط`);
}

// ═══════════════════════════════════════════════════════════════
// 2. AIAssistantChat — bottom 130px برای همه پلتفرم‌ها
// ═══════════════════════════════════════════════════════════════
{
  const rel = "components/AIAssistantChat.tsx";
  let src = read(rel);
  if (!src) { log("skip AIAssistantChat"); }
  else {
    // اصلاح inline style button
    const newSrc = src.replace(
      /style=\{\{[^}]*position:\s*"fixed"[^}]*bottom:\s*"[^"]*"[^}]*right:\s*"16px"[^}]*zIndex:\s*\d+[^}]*\}\}/,
      `style={{ position: "fixed", bottom: "130px", right: "16px", zIndex: 45 }}`
    );
    if (newSrc !== src) {
      write(rel, newSrc);
      log("✅ AIAssistantChat bottom: 130px");
    } else {
      // fallback: replace any bottom value in style prop near ai-chat-float-btn
      const lines = src.split("\n");
      const btnIdx = lines.findIndex(l => l.includes("ai-chat-float-btn"));
      if (btnIdx >= 0 && btnIdx < lines.length - 1) {
        const styleLine = lines[btnIdx + 1];
        if (styleLine.includes("bottom:")) {
          lines[btnIdx + 1] = `        style={{ position: "fixed", bottom: "130px", right: "16px", zIndex: 45 }}`;
          write(rel, lines.join("\n"));
          log(`✅ AIAssistantChat fallback replace — خط ${btnIdx + 2}`);
        } else {
          log(`⚠️  AIAssistantChat خط ${btnIdx + 2}: ${styleLine.trim()}`);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. بررسی slider render block در DynamicHomeSections
// ═══════════════════════════════════════════════════════════════
{
  const src = read("components/DynamicHomeSections.tsx");
  if (src) {
    const allLines = src.split("\n");
    // پیدا کردن خط سوم که banners_slider داره (render block)
    let count = 0;
    let renderLine = -1;
    allLines.forEach((l, i) => {
      if (l.includes("banners_slider")) {
        count++;
        if (count === 3) renderLine = i + 1;
      }
    });
    if (renderLine > 0) {
      log(`\n=== Slider render block (خط ${renderLine}) ===`);
      allLines.slice(renderLine - 1, renderLine + 15).forEach((l, i) =>
        log(`${renderLine + i}: ${l}`)
      );
    } else {
      log(`\n⚠️  slider render block پیدا نشد — تعداد کل banners_slider: ${count}`);
      allLines.forEach((l, i) => {
        if (l.includes("banners_slider")) log(`${i+1}: ${l}`);
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. Build + Git
// ═══════════════════════════════════════════════════════════════
log("\n🔨 Build...");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  log("✅ Build موفق");
} catch (e) {
  log("❌ Build ناموفق");
  process.exit(1);
}

const msg = `fix(css): clean duplicate CSS fragments + fix chat bubble position

- globals.css: remove ALL broken/duplicate .ai-chat-float-btn fragments
  that were causing CSS parser to skip valid rules
- Chat bubble: bottom 130px (above MobileBottomNav 56px + sticky add-to-cart bar ~70px)
- axon-sl-wrap: clean single definition with !important
- AIAssistantChat: inline bottom updated to 130px

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GPCkuaxVKtN9Tnci5NSTZ8`;

fs.writeFileSync(path.join(ROOT, ".git", "AXON_FIX16.txt"), msg, "utf8");

try {
  execSync("git add -A", { stdio: "inherit", cwd: ROOT });
  execSync('git commit -F ".git/AXON_FIX16.txt"', { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit", cwd: ROOT });
  log("🚀 Deploy!");
} catch (e) {
  log("❌ Git: " + (e.message || e));
  process.exit(1);
}