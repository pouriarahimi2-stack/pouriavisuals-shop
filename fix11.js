#!/usr/bin/env node
// fix11.js — رفع نهایی:
//  ۱. shipping_type در API: پشتیبانی از مقادیر فارسی ادمین
//  ۲. حذف UI رنگ تکراری از ProductDetailClient.tsx

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "package.json")) && fs.existsSync(path.join(dir, "app")))
      return dir;
    dir = path.dirname(dir);
  }
  throw new Error("ریشه پروژه پیدا نشد!");
}
const root = findRoot(__dirname);
console.log("📁 ریشه:", root);

// ══════════════════════════════════════════════
// ۱. app/api/products/route.ts
//    مشکل: validator فقط مقادیر انگلیسی قبول می‌کرد
//    اما فرم ادمین مقادیر فارسی مثل "فقط تیپاکس" ارسال می‌کند
// ══════════════════════════════════════════════
console.log("\n📦 [۱] رفع shipping_type در API...");
{
  const fp = path.join(root, "app/api/products/route.ts");
  let c = fs.readFileSync(fp, "utf8");

  const oldValidator =
`      shipping_type: (["post","tipax","both"] as const).includes(body.shipping_type as any)
        ? (body.shipping_type as "post"|"tipax"|"both")
        : "both",`;

  const newValidator =
`      shipping_type: (() => {
        const stMap: Record<string, "post"|"tipax"|"both"> = {
          "post": "post", "tipax": "tipax", "both": "both",
          "فقط پست": "post",    "پست": "post",
          "فقط تیپاکس": "tipax", "تیپاکس": "tipax",
          "پست و تیپاکس": "both", "هر دو": "both",
        };
        return stMap[String(body.shipping_type || "").trim()] || "both";
      })(),`;

  if (c.includes(oldValidator)) {
    c = c.replace(oldValidator, newValidator);
    fs.writeFileSync(fp, c, "utf8");
    console.log("  ✅ shipping_type mapper جایگزین شد");
  } else if (c.includes("stMap")) {
    console.log("  ✅ mapper قبلاً اعمال شده");
  } else {
    // fallback: جستجوی خط‌به‌خط
    const lines = c.split("\n");
    let found = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('shipping_type: (["post","tipax","both"]') ||
          lines[i].includes("shipping_type: ([\"post\",\"tipax\",\"both\"]")) {
        found = i;
        break;
      }
    }
    if (found >= 0) {
      // حذف این ۳ خط و جایگزینی
      lines.splice(found, 3,
        '      shipping_type: (() => {',
        '        const stMap: Record<string, "post"|"tipax"|"both"> = {',
        '          "post": "post", "tipax": "tipax", "both": "both",',
        '          "فقط پست": "post",    "پست": "post",',
        '          "فقط تیپاکس": "tipax", "تیپاکس": "tipax",',
        '          "پست و تیپاکس": "both", "هر دو": "both",',
        '        };',
        '        return stMap[String(body.shipping_type || "").trim()] || "both";',
        '      })(),'
      );
      fs.writeFileSync(fp, lines.join("\n"), "utf8");
      console.log("  ✅ shipping_type (fallback) جایگزین شد");
    } else {
      console.error("  ❌ الگوی shipping_type پیدا نشد — بررسی دستی لازم است");
      process.exit(1);
    }
  }
}

// ══════════════════════════════════════════════
// ۲. components/ProductDetailClient.tsx
//    مشکل: دو بلوک UI رنگ وجود دارد
//    - بلوک اول (درست): بعد از parsedWarranty
//    - بلوک دوم (اشتباه): داخل div قیمت که JSX را خراب می‌کند
//    باید بلوک دوم حذف شود
// ══════════════════════════════════════════════
console.log("\n🎨 [۲] حذف UI رنگ تکراری از ProductDetailClient...");
{
  const fp = path.join(root, "components/ProductDetailClient.tsx");
  let c = fs.readFileSync(fp, "utf8");

  // بلوک تکراری که باید حذف شود — با مارکر اضافه شده توسط fix10b
  const dupBlock =
`          {/* color_options_user_section */}
          {Array.isArray(product.color_options) && product.color_options.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              <span className="text-xs font-bold text-[var(--text-secondary)]">🎨 رنگ موجود — انتخاب کنید:</span>
              <div className="flex flex-wrap gap-2">
                {(product.color_options as Array<{hex: string; name: string}>).map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setSelectedColor(c.name)}
                    title={c.name}
                    aria-label={"رنگ " + c.name}
                    className={\`w-9 h-9 rounded-full border-2 transition-all shadow-sm \${
                      selectedColor === c.name
                        ? "border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/40 scale-110"
                        : "border-[var(--card-border)] hover:scale-105"
                    }\`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              {selectedColor && (
                <span className="text-[11px] font-bold text-[var(--accent-blue)]">رنگ انتخابی: {selectedColor}</span>
              )}
            </div>
          )}`;

  if (c.includes(dupBlock)) {
    c = c.replace(dupBlock, "");
    fs.writeFileSync(fp, c, "utf8");
    console.log("  ✅ بلوک تکراری رنگ حذف شد");
  } else if (c.includes("color_options_user_section")) {
    // جستجوی خط‌به‌خط برای حذف بلوک با مارکر
    const lines = c.split("\n");
    let startIdx = -1;
    let endIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("color_options_user_section")) {
        startIdx = i;
        // پیدا کردن پایان بلوک (بسته شدن آخرین پرانتز)}
        let depth = 0;
        for (let j = i + 1; j < lines.length; j++) {
          const t = lines[j].trim();
          if (t.startsWith("{(") || t.startsWith("(")) depth++;
          if (t.endsWith(")}") || t.endsWith(")};")) {
            if (depth === 0) { endIdx = j; break; }
            depth--;
          }
          if (t === ")}") { endIdx = j; break; }
        }
        break;
      }
    }
    if (startIdx >= 0 && endIdx > startIdx) {
      lines.splice(startIdx, endIdx - startIdx + 1);
      fs.writeFileSync(fp, lines.join("\n"), "utf8");
      console.log(`  ✅ بلوک تکراری (خطوط ${startIdx+1}–${endIdx+1}) حذف شد`);
    } else {
      // روش آخر: حذف تمام بین مارکر و بسته‌شدن آن
      const markerStart = c.indexOf("{/* color_options_user_section */}");
      if (markerStart >= 0) {
        // پیدا کردن انتهای بلوک if
        let pos = markerStart + 35;
        // بعد از مارکر، اولین { بزرگ را پیدا کن
        let braceDepth = 0;
        let inBlock = false;
        let blockEnd = -1;
        while (pos < c.length) {
          if (c[pos] === '{') { braceDepth++; inBlock = true; }
          if (c[pos] === '}') {
            braceDepth--;
            if (inBlock && braceDepth === 0) { blockEnd = pos + 1; break; }
          }
          pos++;
        }
        if (blockEnd > markerStart) {
          c = c.slice(0, markerStart) + c.slice(blockEnd);
          fs.writeFileSync(fp, c, "utf8");
          console.log("  ✅ بلوک تکراری (روش brace-depth) حذف شد");
        } else {
          console.warn("  ⚠️ نتوانستیم بلوک را پیدا کنیم — ادامه می‌دهیم");
        }
      }
    }
  } else {
    console.log("  ✅ بلوک تکراری وجود ندارد");
  }

  // همچنین بررسی تکراری selectedColor در addToCart
  const dupSel1 = "selectedColor: selectedColor || undefined,\n        selectedColor: selectedColor || undefined,";
  const dupSel2 = /selectedColor: selectedColor \|\| undefined,\s*\n\s*selectedColor: selectedColor \|\| undefined,/;
  if (dupSel2.test(c)) {
    c = c.replace(dupSel2, "selectedColor: selectedColor || undefined,");
    fs.writeFileSync(fp, c, "utf8");
    console.log("  ✅ selectedColor تکراری حذف شد");
  } else {
    console.log("  ✅ selectedColor تکراری نیست");
  }
}

// ══════════════════════════════════════════════
// Build
// ══════════════════════════════════════════════
console.log("\n🔨 Build...");
try {
  execSync("npm run build", { cwd: root, stdio: "inherit" });
  console.log("✅ Build موفق!");
} catch {
  console.error("❌ Build ناموفق — بررسی خطا");
  process.exit(1);
}

// ══════════════════════════════════════════════
// Git
// ══════════════════════════════════════════════
console.log("\n📤 Git commit & push...");
try {
  execSync("git add -A", { cwd: root, stdio: "inherit" });
  execSync(
    `git commit -m "fix(api+product): shipping_type Persian mapper + remove duplicate color UI

- API: shipping_type validator now maps Persian admin values (فقط تیپاکس→tipax, فقط پست→post, etc.)
- ProductDetailClient: removed duplicate color_options UI block inside price section

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe"`,
    { cwd: root, stdio: "inherit" }
  );
  execSync("git push origin main", { cwd: root, stdio: "inherit" });
  console.log("🚀 پوش شد!");
} catch (e) {
  console.error("⚠️ Git:", e.message);
}

console.log("\n✅ fix11 کامل!");