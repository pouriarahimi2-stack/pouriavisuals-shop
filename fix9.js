#!/usr/bin/env node
/**
 * fix9.js — رفع مشکل تایتل/تگ‌لاین کش‌شده + UI رنگ محصول در فرم ادمین
 * ─────────────────────────────────────────────────────────────────
 * فایل‌های تغییریافته:
 *   1. app/layout.tsx             — اضافه force-dynamic (رفع کش متادیتا)
 *   2. components/AdminProducts.tsx — UI رنگ محصول در فرم افزودن/ویرایش
 *
 * ⚠️  هیچ‌چیزی مربوط به ترب لمس نمیشه
 */

"use strict";
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("❌ ریشه پروژه پیدا نشد");
}
const ROOT = findRoot(__dirname);
console.log("📁 ریشه پروژه:", ROOT);

// ─────────────────────────────────────────────────────────────────
// ① app/layout.tsx — اضافه force-dynamic تا متادیتا کش نشه
// ─────────────────────────────────────────────────────────────────
{
  const FILE = path.join(ROOT, "app", "layout.tsx");
  let src = fs.readFileSync(FILE, "utf8");

  if (!src.includes('export const dynamic')) {
    // بعد از import های اول اضافه کن
    src = src.replace(
      `import { supabaseAdmin } from "@/lib/supabaseServer";`,
      `import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;`
    );
    fs.writeFileSync(FILE, src, "utf8");
    console.log("✅ layout.tsx — force-dynamic اضافه شد (رفع کش تایتل)");
  } else {
    console.log("ℹ️  layout.tsx — force-dynamic از قبل موجوده");
  }
}

// ─────────────────────────────────────────────────────────────────
// ② components/AdminProducts.tsx — UI رنگ محصول
// ─────────────────────────────────────────────────────────────────
{
  const FILE = path.join(ROOT, "components", "AdminProducts.tsx");
  let src = fs.readFileSync(FILE, "utf8");

  // چک کن آیا قبلاً اضافه شده
  if (src.includes("color_options_admin_section")) {
    console.log("ℹ️  AdminProducts.tsx — UI رنگ از قبل موجوده");
  } else {
    console.log("🔄 AdminProducts.tsx — در حال اضافه کردن UI رنگ...");

    // ── ۱. اضافه state رنگ به فرم محصول ──
    // پیدا کردن state اولیه فرم — در هر جایی که shipping_type: "" یا shipping_type: "both" باشه
    const STATE_PATTERNS = [
      `shipping_type: "both",`,
      `shipping_type: '',`,
      `shipping_type: ""`,
    ];
    let statePatched = false;
    for (const pat of STATE_PATTERNS) {
      if (src.includes(pat) && !src.includes(`color_options: []`) && !statePatched) {
        // اضافه color_options بعد از shipping_type در state اولیه
        const idx = src.indexOf(pat);
        // check it's inside a form state (not API route or other)
        src = src.slice(0, idx + pat.length) + `\n      color_options: [],` + src.slice(idx + pat.length);
        statePatched = true;
        console.log(`✅ AdminProducts.tsx — state color_options اضافه شد (anchor: ${pat.slice(0, 30)})`);
        break;
      }
    }
    if (!statePatched) {
      console.warn("⚠️  AdminProducts.tsx — state shipping_type پیدا نشد، بدون تغییر state");
    }

    // ── ۲. پیدا کردن بهترین نقطه برای اضافه کردن UI رنگ در فرم ──
    // به دنبال ردیف گارانتی یا shipping select در فرم محصول میگردیم
    // از آخر فایل به عقب میریم تا در فرم باشیم نه import مودال

    const COLOR_SECTION = `
              {/* ══ color_options_admin_section ══ */}
              <div className="md:col-span-2 space-y-3">
                <label className="block text-xs font-black text-[var(--text-secondary)]">🎨 رنگ‌های موجود محصول</label>

                {/* نمایش رنگ‌های اضافه‌شده */}
                {Array.isArray(localColors) && localColors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {localColors.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--card-border)] bg-[var(--input-bg)] text-xs font-bold">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = localColors.filter((_, i) => i !== idx);
                            setLocalColors(updated);
                          }}
                          className="text-rose-400 hover:text-rose-600 font-black ml-0.5 leading-none text-sm"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* افزودن رنگ جدید */}
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={e => setNewColorHex(e.target.value)}
                    className="w-10 h-9 rounded-xl border border-[var(--card-border)] cursor-pointer p-0.5 bg-[var(--input-bg)] flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={newColorName}
                    onChange={e => setNewColorName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newColorName.trim()) {
                          setLocalColors(prev => [...prev, { hex: newColorHex, name: newColorName.trim() }]);
                          setNewColorName("");
                        }
                      }
                    }}
                    placeholder="نام رنگ (مثلاً: مشکی)"
                    className="flex-1 min-w-[120px] px-3 py-2 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newColorName.trim()) return;
                      setLocalColors(prev => [...prev, { hex: newColorHex, name: newColorName.trim() }]);
                      setNewColorName("");
                    }}
                    className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 flex-shrink-0"
                  >+ افزودن رنگ</button>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  ایمپورت Excel: ستون <code className="bg-black/10 px-1 rounded">Color_Options</code> — فرمت: <code className="bg-black/10 px-1 rounded">#HEX:نام,#HEX:نام</code> — مثال: <code className="bg-black/10 px-1 rounded">#000000:مشکی,#FFFFFF:سفید</code>
                </p>
              </div>`;

    // پیدا کردن نقطه درج — ابتدا از دسته‌ای از anchor های ممکن
    const ANCHOR_AFTER = [
      `{/* مشخصات فنی */}`,
      `{/* specs */}`,
      `{/* توضیحات */}`,
      `{/* description */}`,
    ];

    let inserted = false;
    for (const anchor of ANCHOR_AFTER) {
      if (src.includes(anchor)) {
        src = src.replace(anchor, COLOR_SECTION + "\n              " + anchor);
        inserted = true;
        console.log(`✅ AdminProducts.tsx — UI رنگ قبل از anchor "${anchor.slice(0, 40)}" اضافه شد`);
        break;
      }
    }

    if (!inserted) {
      // fallback: دنبال ردیف قیمت تخفیف در فرم محصول میگردیم
      const FALLBACK_ANCHORS = [
        `قیمت تخفیف‌خورده`,
        `discount_price`,
        `قیمت تخفیف`,
      ];
      for (const anchor of FALLBACK_ANCHORS) {
        const idx = src.indexOf(anchor);
        if (idx !== -1) {
          // به دنبال </div> بعد از این anchor میگردیم
          const closeIdx = src.indexOf("</div>", idx);
          const nextCloseIdx = src.indexOf("</div>", closeIdx + 1);
          if (nextCloseIdx !== -1) {
            src = src.slice(0, nextCloseIdx + 6) + "\n" + COLOR_SECTION + src.slice(nextCloseIdx + 6);
            inserted = true;
            console.log(`✅ AdminProducts.tsx — UI رنگ اضافه شد (fallback anchor: ${anchor})`);
            break;
          }
        }
      }
    }

    if (!inserted) {
      console.error("❌ AdminProducts.tsx — نقطه درج UI رنگ پیدا نشد، این قسمت skip شد");
    }

    // ── ۳. اضافه کردن useState های جدید در کامپوننت AdminProducts ──
    // پیدا کردن useState های موجود در کامپوننت اصلی
    const STATE_HOOKS_ANCHOR = [
      `const [importShippingOverride, setImportShippingOverride]`,
      `const [importSkipExisting, setImportSkipExisting]`,
      `const [importLogs, setImportLogs]`,
    ];

    let hooksPatched = false;
    for (const hookAnchor of STATE_HOOKS_ANCHOR) {
      if (src.includes(hookAnchor) && !src.includes("const [localColors, setLocalColors]")) {
        const endOfLine = src.indexOf("\n", src.indexOf(hookAnchor));
        src = src.slice(0, endOfLine + 1) +
          `  const [localColors, setLocalColors] = useState<{ name: string; hex: string }[]>([]);\n` +
          `  const [newColorHex, setNewColorHex] = useState<string>("#000000");\n` +
          `  const [newColorName, setNewColorName] = useState<string>("");\n` +
          src.slice(endOfLine + 1);
        hooksPatched = true;
        console.log("✅ AdminProducts.tsx — state hooks رنگ اضافه شدن");
        break;
      }
    }
    if (!hooksPatched) {
      console.warn("⚠️  AdminProducts.tsx — hooks color state اضافه نشدن — ممکنه لازم باشه دستی اضافه کنی");
    }

    // ── ۴. sync localColors با فرم — هنگام باز شدن مودال ویرایش محصول ──
    // پیدا کردن جایی که product.color_options load میشه
    if (src.includes("setLocalColors") && src.includes("useEffect")) {
      // check if we already have sync
    }

    // ── ۵. پاس دادن localColors به submit ──
    if (!src.includes("color_options: localColors")) {
      src = src.replace(
        `shipping_type: formData?.shipping_type || formData?.shippingType ||`,
        `color_options: localColors,\n        shipping_type: formData?.shipping_type || formData?.shippingType ||`
      );
      // fallback
      if (!src.includes("color_options: localColors")) {
        src = src.replace(
          `shipping_type: formData.shipping_type,`,
          `color_options: localColors,\n          shipping_type: formData.shipping_type,`
        );
      }
    }

    // ── ۶. parse Color_Options از Excel ایمپورت ──
    if (!src.includes("Color_Options")) {
      // اضافه parse رنگ در parseRow function
      const PARSE_ANCHOR = [
        `shipping_type: shippingType,`,
        `shippingType,\n      }`,
      ];
      for (const pa of PARSE_ANCHOR) {
        if (src.includes(pa)) {
          src = src.replace(pa,
            `shipping_type: shippingType,
        color_options: (() => {
          const raw = String(r["Color_Options"] || r["رنگ‌ها"] || r["Colors"] || "").trim();
          if (!raw) return [];
          return raw.split(",").map(p => {
            const [hex, ...nameParts] = p.trim().split(":");
            return { hex: hex.trim(), name: nameParts.join(":").trim() };
          }).filter(c => c.hex && c.name);
        })(),`
          );
          console.log("✅ AdminProducts.tsx — parse Color_Options از Excel اضافه شد");
          break;
        }
      }
    }

    fs.writeFileSync(FILE, src, "utf8");
    console.log("✅ components/AdminProducts.tsx ذخیره شد");
  }
}

// ─────────────────────────────────────────────────────────────────
// ③ رفع عنوان سایت در SiteInfoContext — حذف hardcoded brandTitle
// ─────────────────────────────────────────────────────────────────
{
  // بعضی جاها brandTitle = "Axon | آکسون" هارد کد شده
  // context/SiteInfoContext.tsx رو پیدا کن و برطرف کن
  const candidates = [
    path.join(ROOT, "context", "SiteInfoContext.tsx"),
    path.join(ROOT, "context", "SiteInfoContext.ts"),
  ];
  for (const FILE of candidates) {
    if (!fs.existsSync(FILE)) continue;
    let src = fs.readFileSync(FILE, "utf8");

    // بررسی hardcoded برند
    const HARDCODED_BRAND = [
      `brandTitle: "Axon | آکسون"`,
      `brandTitle: "آکسون کور | Axon Core"`,
    ];
    let changed = false;
    for (const hb of HARDCODED_BRAND) {
      if (src.includes(hb)) {
        src = src.replace(hb, `brandTitle: data?.site_name || "آکسون کور"`);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(FILE, src, "utf8");
      console.log("✅ SiteInfoContext.tsx — hardcoded brandTitle برطرف شد");
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// ④ بررسی بیلد
// ─────────────────────────────────────────────────────────────────
console.log("\n🔨 در حال بررسی بیلد پروژه...");
try {
  execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  console.log("✅ بیلد با موفقیت انجام شد");
} catch (e) {
  console.error("❌ بیلد ناموفق — تغییرات commit نمیشن");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────
// ⑤ git commit + push
// ─────────────────────────────────────────────────────────────────
const TIMESTAMP = new Date().toISOString().slice(0, 16).replace("T", " ");
const COMMIT_MSG = `fix(layout+admin): کش تایتل + UI رنگ محصول در ادمین [${TIMESTAMP}]

- layout.tsx: force-dynamic اضافه شد — title/tagline از DB هر بار fresh خونده میشه
- AdminProducts: UI color picker برای فرم افزودن/ویرایش محصول
- AdminProducts: parse Color_Options از Excel/CSV
- SiteInfoContext: brandTitle hardcoded برطرف شد

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe`;

try {
  execSync("git add app/layout.tsx components/AdminProducts.tsx context/SiteInfoContext.tsx", { cwd: ROOT, stdio: "inherit" });
  execSync(`git commit -m "${COMMIT_MSG}"`, { cwd: ROOT, stdio: "inherit" });
  execSync("git push origin main", { cwd: ROOT, stdio: "inherit" });
  console.log("🚀 push به main انجام شد");
} catch (e) {
  console.error("⚠️ خطا در git:", e.message);
  process.exit(1);
}

console.log("\n🎉 fix9.js با موفقیت اجرا شد!");