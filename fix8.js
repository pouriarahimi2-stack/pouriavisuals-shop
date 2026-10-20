#!/usr/bin/env node
/**
 * fix8.js — رنگ محصول (انتخاب رنگ ادمین + نمایش کاربر + ایمپورت) + ذخیره color_options در DB
 * ─────────────────────────────────────────────────────────────────
 * فایل‌های تغییریافته:
 *   1. context/CartContext.tsx          — اضافه selectedColor به CartItem
 *   2. components/ProductDetailClient.tsx — UI انتخاب رنگ کاربر + پاس به addToCart
 *   3. app/api/products/route.ts        — ذخیره color_options در DB
 *   4. components/AdminProducts.tsx     — UI رنگ در فرم محصول + parse ستون Color_Options
 *
 * ⚠️  هیچ‌چیزی مربوط به ترب لمس نمیشه
 */

"use strict";
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ── یافتن ریشه پروژه ──────────────────────────────────────────────
function findRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("❌ ریشه پروژه پیدا نشد — package.json یافت نشد");
}
const ROOT = findRoot(__dirname);
console.log("📁 ریشه پروژه:", ROOT);

// ─────────────────────────────────────────────────────────────────
// ① context/CartContext.tsx — اضافه selectedColor به CartItem
// ─────────────────────────────────────────────────────────────────
{
  const FILE = path.join(ROOT, "context", "CartContext.tsx");
  let src = fs.readFileSync(FILE, "utf8");

  // ۱a. اضافه selectedColor به interface CartItem
  src = src.replace(
    `  category?: string;\n}

export interface AppliedCoupon {`,
    `  category?: string;
  selectedColor?: string;
}

export interface AppliedCoupon {`
  );

  // ۱b. پاس دادن selectedColor در addToCart هنگام insert آیتم جدید
  src = src.replace(
    `            category: item.category || "عمومی",
          },
        ];
      }

      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });`,
    `            category: item.category || "عمومی",
            selectedColor: item.selectedColor || undefined,
          },
        ];
      }

      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });`
  );

  fs.writeFileSync(FILE, src, "utf8");
  console.log("✅ context/CartContext.tsx — selectedColor اضافه شد");
}

// ─────────────────────────────────────────────────────────────────
// ② components/ProductDetailClient.tsx — UI انتخاب رنگ کاربر
// ─────────────────────────────────────────────────────────────────
{
  const FILE = path.join(ROOT, "components", "ProductDetailClient.tsx");
  let src = fs.readFileSync(FILE, "utf8");

  // ۲a. اضافه state انتخاب رنگ بعد از isRedirecting state
  src = src.replace(
    `  const [isRedirecting, setIsRedirecting] = useState(false);`,
    `  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");`
  );

  // ۲b. پاس دادن selectedColor به addToCart در handleAddToCartAndCheckout
  src = src.replace(
    `    addToCart(
      {
        id: String(product.id),
        title: product.title || product.name || "کالای دیجیتال",
        name: product.title || product.name,
        price: finalPrice,
        discountPrice: discountPrice ?? undefined,
        image: itemImage,
        images: [itemImage],
        stock: stockCount,
        category: product.category || "عمومی",
        quantity: 1,
      },
      false
    );`,
    `    addToCart(
      {
        id: String(product.id),
        title: product.title || product.name || "کالای دیجیتال",
        name: product.title || product.name,
        price: finalPrice,
        discountPrice: discountPrice ?? undefined,
        image: itemImage,
        images: [itemImage],
        stock: stockCount,
        category: product.category || "عمومی",
        quantity: 1,
        selectedColor: selectedColor || undefined,
      },
      false
    );`
  );

  // ۲c. اضافه UI انتخاب رنگ بین گارانتی و قیمت — قبل از price box
  const COLOR_UI = `
          {/* ══ انتخاب رنگ محصول ══ */}
          {Array.isArray(product.color_options) && product.color_options.length > 0 && (
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <p className="text-xs font-black text-[var(--text-secondary)] mb-3">رنگ محصول:</p>
              <div className="flex flex-wrap gap-2">
                {product.color_options.map((c: { name: string; hex: string }) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => setSelectedColor(selectedColor === c.name ? "" : c.name)}
                    className={
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all " +
                      (selectedColor === c.name
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                        : "border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent-blue)]/50")
                    }
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                  </button>
                ))}
              </div>
              {selectedColor && (
                <p className="mt-2 text-[10px] text-emerald-500 font-bold">✓ رنگ انتخاب‌شده: {selectedColor}</p>
              )}
            </div>
          )}

`;

  src = src.replace(
    `          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {isAvailable ? "قیمت محصول:" : "وضعیت موجودی:"}`,
    COLOR_UI +
    `          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {isAvailable ? "قیمت محصول:" : "وضعیت موجودی:"}`
  );

  fs.writeFileSync(FILE, src, "utf8");
  console.log("✅ components/ProductDetailClient.tsx — UI انتخاب رنگ اضافه شد");
}

// ─────────────────────────────────────────────────────────────────
// ③ app/api/products/route.ts — ذخیره color_options در safePayload
// ─────────────────────────────────────────────────────────────────
{
  const FILE = path.join(ROOT, "app", "api", "products", "route.ts");
  let src = fs.readFileSync(FILE, "utf8");

  src = src.replace(
    `      shipping_type: (["post","tipax","both"] as const).includes(body.shipping_type as any)
        ? (body.shipping_type as "post"|"tipax"|"both")
        : "both",`,
    `      shipping_type: (["post","tipax","both"] as const).includes(body.shipping_type as any)
        ? (body.shipping_type as "post"|"tipax"|"both")
        : "both",
      color_options: Array.isArray(body.color_options)
        ? body.color_options.filter((c: any) => c && typeof c.name === "string" && typeof c.hex === "string")
        : [],`
  );

  fs.writeFileSync(FILE, src, "utf8");
  console.log("✅ app/api/products/route.ts — color_options به safePayload اضافه شد");
}

// ─────────────────────────────────────────────────────────────────
// ④ components/AdminProducts.tsx — UI رنگ در فرم + parse Color_Options
// ─────────────────────────────────────────────────────────────────
{
  const FILE = path.join(ROOT, "components", "AdminProducts.tsx");
  let src = fs.readFileSync(FILE, "utf8");

  // ۴a. اضافه state importShippingOverride (از fix6 — اگر قبلاً نیست)
  if (!src.includes("importShippingOverride")) {
    src = src.replace(
      `  const [importSkipExisting, setImportSkipExisting]   = useState<boolean>(false);`,
      `  const [importSkipExisting, setImportSkipExisting]   = useState<boolean>(false);
  const [importShippingOverride, setImportShippingOverride] = useState<"auto"|"post"|"tipax"|"both">("auto");`
    );
  }

  // ۴b. اضافه parse ستون Color_Options در handleDocumentUpload / parseRow
  // پیدا کردن جایی که نام ستون‌ها map میشن — بعد از shipping_type
  if (!src.includes("Color_Options")) {
    // پارس ستون Color_Options از Excel row
    // به دنبال "نوع ارسال" یا "shipping_type" در parseRow میگردیم
    const SHIPPING_MAP_OLD = `const shippingRaw = String(r["نوع ارسال"] || r["shipping_type"] || r["Shipping_Type"] || "").trim().toLowerCase();
      const shippingType =`;
    const SHIPPING_MAP_NEW = `const shippingRaw = String(r["نوع ارسال"] || r["shipping_type"] || r["Shipping_Type"] || "").trim().toLowerCase();
      const colorOptionsRaw = String(r["Color_Options"] || r["رنگ‌ها"] || r["رنگها"] || r["Colors"] || "").trim();
      const colorOptions: { name: string; hex: string }[] = [];
      if (colorOptionsRaw) {
        colorOptionsRaw.split(",").forEach((part) => {
          const [hex, ...nameParts] = part.trim().split(":");
          const name = nameParts.join(":").trim();
          if (hex && name) colorOptions.push({ hex: hex.trim(), name });
        });
      }
      const shippingType =`;

    if (src.includes(SHIPPING_MAP_OLD)) {
      src = src.replace(SHIPPING_MAP_OLD, SHIPPING_MAP_NEW);
    } else {
      // fallback: پیدا کردن هر جایی که نوع ارسال map میشه
      src = src.replace(
        `const shippingType =`,
        `const colorOptionsRaw = String(r["Color_Options"] || r["رنگ‌ها"] || r["Colors"] || "").trim();
      const colorOptions: { name: string; hex: string }[] = [];
      if (colorOptionsRaw) {
        colorOptionsRaw.split(",").forEach((part) => {
          const [hex, ...nameParts] = part.trim().split(":");
          const name = nameParts.join(":").trim();
          if (hex && name) colorOptions.push({ hex: hex.trim(), name });
        });
      }
      const shippingType =`
      );
    }

    // اضافه color_options به آبجکت return در parseRow
    src = src.replace(
      `        shipping_type: shippingType,\n      }`,
      `        shipping_type: shippingType,
        color_options: colorOptions,
      }`
    );

    // fallback اگر بالایی کار نکرد
    if (!src.includes("color_options: colorOptions")) {
      src = src.replace(
        `        shipping_type: shippingType,`,
        `        shipping_type: shippingType,
        color_options: colorOptions,`
      );
    }
  }

  // ۴c. اضافه UI مدیریت رنگ در فرم افزودن/ویرایش محصول
  // پیدا کردن بخش گارانتی در فرم ادمین و اضافه کردن بخش رنگ بعد از آن
  if (!src.includes("color_options_admin_ui")) {
    const WARRANTY_FIELD_MARKER = `placeholder="۱۸ ماه گارانتی اصالت طلایی"`;

    // اضافه color_options به state مودال افزودن/ویرایش محصول
    // پیدا کردن warranty state در فرم
    src = src.replace(
      `warranty: product?.warranty || "",`,
      `warranty: product?.warranty || "",
    color_options: Array.isArray(product?.color_options) ? product.color_options : [],`
    );

    // اضافه UI بعد از فیلد گارانتی در فرم
    const COLOR_ADMIN_UI = `
              {/* ══ رنگ‌های محصول ══ */}
              {/* color_options_admin_ui */}
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-[var(--text-secondary)] mb-2">🎨 رنگ‌های موجود محصول</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(formData.color_options || []).map((c: { name: string; hex: string }, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--card-border)] bg-[var(--input-bg)] text-xs font-bold">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                      <span>{c.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (formData.color_options || []).filter((_: any, i: number) => i !== idx);
                          setFormData((p: any) => ({ ...p, color_options: updated }));
                        }}
                        className="text-rose-400 hover:text-rose-600 font-black ml-0.5 leading-none"
                      >×</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="colorPickerHex"
                    defaultValue="#000000"
                    className="w-10 h-9 rounded-xl border border-[var(--card-border)] cursor-pointer p-0.5 bg-[var(--input-bg)]"
                  />
                  <input
                    type="text"
                    id="colorPickerName"
                    placeholder="نام رنگ (مثلاً: مشکی)"
                    className="flex-1 px-3 py-2 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const hexEl = document.getElementById("colorPickerHex") as HTMLInputElement;
                      const nameEl = document.getElementById("colorPickerName") as HTMLInputElement;
                      const hex = hexEl?.value?.trim() || "#000000";
                      const name = nameEl?.value?.trim();
                      if (!name) return;
                      setFormData((p: any) => ({
                        ...p,
                        color_options: [...(p.color_options || []), { hex, name }],
                      }));
                      if (nameEl) nameEl.value = "";
                    }}
                    className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90"
                  >+ افزودن رنگ</button>
                </div>
                <p className="mt-1.5 text-[10px] text-[var(--text-secondary)]">برای ایمپورت Excel: ستون Color_Options — فرمت: #HEX:نام,#HEX:نام (مثال: #000000:مشکی,#FFFFFF:سفید)</p>
              </div>`;

    src = src.replace(
      `placeholder="۱۸ ماه گارانتی اصالت طلایی"`,
      `placeholder="۱۸ ماه گارانتی اصالت طلایی"` // نگه داشتن اصلی
    );

    // اضافه UI بعد از کل ردیف گارانتی — پیدا کردن بسته‌شدن div گارانتی
    src = src.replace(
      `              </div>\n            </div>\n            {/* مشخصات فنی */}`,
      `              </div>
            </div>
${COLOR_ADMIN_UI}
            {/* مشخصات فنی */}`
    );
  }

  // ۴d. اضافه color_options به payload ارسالی به API در submit فرم
  if (!src.includes("color_options: formData.color_options")) {
    src = src.replace(
      `shipping_type: formData.shipping_type,`,
      `shipping_type: formData.shipping_type,
          color_options: formData.color_options || [],`
    );
  }

  // ۴e. آپدیت متن راهنمای فرمت فایل ایمپورت
  src = src.replace(
    `فرمت‌های پشتیبانی‌شده: Excel ، CSV ، PDF ، Word (docx) — ستون‌ها: نام محصول · قیمت دراپ · دسته بندی · برند · کد محصول · Photo_Filename · Telegram_Description · موجودی · نوع ارسال`,
    `فرمت‌های پشتیبانی‌شده: Excel ، CSV ، PDF ، Word — ستون‌ها: نام محصول · قیمت دراپ · دسته بندی · برند · Photo_Filename · Telegram_Description · موجودی · نوع ارسال · Color_Options`
  );

  // fallback اگر متن قدیمی‌تر بود
  src = src.replace(
    `ستون‌های پشتیبانی‌شده: نام محصول · قیمت دراپ · دسته بندی · برند · کد محصول · Photo_Filename · Telegram_Description · موجودی · نوع ارسال`,
    `ستون‌های پشتیبانی‌شده: نام محصول · قیمت دراپ · دسته بندی · برند · Photo_Filename · Telegram_Description · موجودی · نوع ارسال · Color_Options`
  );

  fs.writeFileSync(FILE, src, "utf8");
  console.log("✅ components/AdminProducts.tsx — UI رنگ + parse Color_Options اضافه شد");
}

// ─────────────────────────────────────────────────────────────────
// ⑤ بررسی بیلد
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
// ⑥ git commit + push
// ─────────────────────────────────────────────────────────────────
const TIMESTAMP = new Date().toISOString().slice(0, 16).replace("T", " ");
const COMMIT_MSG = `feat(products): color_options — انتخاب رنگ محصول در ادمین + نمایش برای کاربر + ایمپورت [${TIMESTAMP}]

- CartContext: selectedColor به CartItem اضافه شد
- ProductDetailClient: UI انتخاب رنگ (swatch) قبل از دکمه خرید
- api/products/route.ts: color_options در safePayload ذخیره میشه
- AdminProducts: فرم افزودن/ویرایش محصول با color picker
- AdminProducts: parse ستون Color_Options در Excel/CSV ایمپورت

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe`;

try {
  execSync("git add context/CartContext.tsx components/ProductDetailClient.tsx app/api/products/route.ts components/AdminProducts.tsx", { cwd: ROOT, stdio: "inherit" });
  execSync(`git commit -m "${COMMIT_MSG}"`, { cwd: ROOT, stdio: "inherit" });
  execSync("git push origin main", { cwd: ROOT, stdio: "inherit" });
  console.log("🚀 push به main انجام شد");
} catch (e) {
  console.error("⚠️ خطا در git:", e.message);
  process.exit(1);
}

console.log("\n🎉 fix8.js با موفقیت اجرا شد!");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📌 یادآوری: SQL migration رو در Supabase SQL Editor اجرا کن (فایل migration8.sql)");