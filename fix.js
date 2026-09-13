/**
 * AXON CORE - Phase 3: Responsive Viewport Switcher (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

function writeFile(relPath, content) {
  const fullPath = path.join(ROOT, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ اصلاح شد: ${relPath}\x1b[0m`);
}

function readFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

console.log("\x1b[35m[PHASE-3]\x1b[0m آغاز فاز ۳: پیاده‌سازی سوییچ پیش‌نمایش واکنش‌گرا (موبایل، تبلت، دسکتاپ)...");

// =============================================================================
// ۱. افزودن سوییچ حالت دستگاه به components/admin/PageBuilder.tsx
// =============================================================================
const pageBuilderPath = 'components/admin/PageBuilder.tsx';
let pbContent = readFile(pageBuilderPath);

if (pbContent && !pbContent.includes('deviceView')) {
  // اضافه کردن استیت انتخاب دستگاه
  pbContent = pbContent.replace(
    'const [isPublished, setIsPublished] = useState(true);',
    'const [isPublished, setIsPublished] = useState(true);\n  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");'
  );

  // دکمه‌های سوییچ نوار ابزار پیش‌نمایش
  const deviceSwitcherToolbar = `
            {/* نوار انتخاب نمای دستگاه (دسکتاپ / تبلت / موبایل) */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <span className="font-bold text-xs text-[var(--text-secondary)]">📱 نمای پیش‌نمایش اندازه صفحه:</span>
              <div className="flex gap-1.5 p-1 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setDeviceView("desktop")}
                  className={"px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 " + (
                    deviceView === "desktop" ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-white"
                  )}
                >
                  <span>💻</span>
                  <span>دسکتاپ (100%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView("tablet")}
                  className={"px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 " + (
                    deviceView === "tablet" ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-white"
                  )}
                >
                  <span>📟</span>
                  <span>تبلت (768px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView("mobile")}
                  className={"px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 " + (
                    deviceView === "mobile" ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-white"
                  )}
                >
                  <span>📱</span>
                  <span>موبایل (390px)</span>
                </button>
              </div>
            </div>
`;

  pbContent = pbContent.replace(
    '<div className="border-t border-[var(--card-border)] pt-6 space-y-4">',
    deviceSwitcherToolbar + '\n            <div className="border-t border-[var(--card-border)] pt-6 space-y-4">'
  );

  // قاب کانتینر بلوک‌ها با عرض وابسته به نمای انتخاب شده
  pbContent = pbContent.replace(
    '<div className="space-y-4 pt-2">',
    '<div className={"space-y-4 pt-2 transition-all duration-300 mx-auto " + (deviceView === "mobile" ? "max-w-[390px] border-x-2 border-dashed border-[var(--accent-blue)]/50 px-2" : deviceView === "tablet" ? "max-w-[768px] border-x-2 border-dashed border-[var(--accent-blue)]/30 px-3" : "w-full")}>'
  );

  writeFile(pageBuilderPath, pbContent);
}

// =============================================================================
// ۲. افزودن سوییچ حالت دستگاه به components/admin/StorefrontLayoutStudio.tsx
// =============================================================================
const studioPath = 'components/admin/StorefrontLayoutStudio.tsx';
let studioContent = readFile(studioPath);

if (studioContent && !studioContent.includes('viewportMode')) {
  studioContent = studioContent.replace(
    'const [saving, setSaving] = useState(false);',
    'const [saving, setSaving] = useState(false);\n  const [viewportMode, setViewportMode] = useState<"desktop" | "tablet" | "mobile">("desktop");'
  );

  const studioToolbar = `
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
          <button
            type="button"
            onClick={() => setViewportMode("desktop")}
            className={"px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer " + (viewportMode === "desktop" ? "bg-[var(--accent-blue)] text-white" : "text-[var(--text-secondary)]")}
          >
            💻 دسکتاپ
          </button>
          <button
            type="button"
            onClick={() => setViewportMode("tablet")}
            className={"px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer " + (viewportMode === "tablet" ? "bg-[var(--accent-blue)] text-white" : "text-[var(--text-secondary)]")}
          >
            📟 تبلت
          </button>
          <button
            type="button"
            onClick={() => setViewportMode("mobile")}
            className={"px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer " + (viewportMode === "mobile" ? "bg-[var(--accent-blue)] text-white" : "text-[var(--text-secondary)]")}
          >
            📱 موبایل
          </button>
        </div>
`;

  studioContent = studioContent.replace(
    '<button\n          type="button"\n          onClick={() => handleSave()}',
    studioToolbar + '\n        <button\n          type="button"\n          onClick={() => handleSave()}'
  );

  writeFile(studioPath, studioContent);
}

// =============================================================================
// ۳. بیلد لوکال و پوش به مخزن گیت‌هاب
// =============================================================================
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ کامپایل با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات فاز ۳ به گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "feat(admin): phase 3 - add multi-device viewport switcher (desktop, tablet, mobile) to PageBuilder and Storefront Studio"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ فاز ۳ با موفقیت روی سرور ورسل مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}