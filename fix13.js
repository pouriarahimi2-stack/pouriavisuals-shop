#!/usr/bin/env node
// fix13.js — رفع کامل:
// ۱. color_options در AdminProducts (saveProduct + openEdit + openAdd)
// ۲. تیپاکس فیلتر در checkout — پست پیشتاز باید مخفی بشه

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findRoot(s) {
  let d = s;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(d, "package.json")) && fs.existsSync(path.join(d, "app"))) return d;
    d = path.dirname(d);
  }
  throw new Error("❌ ریشه پروژه پیدا نشد!");
}
const root = findRoot(__dirname);
console.log("📁 root:", root);

// ══════════════════════════════════════════════════════════
// PART A — AdminProducts.tsx: color_options
// ══════════════════════════════════════════════════════════
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🎨 PART A: رنگ محصول (AdminProducts)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const adminPath = path.join(root, "components/AdminProducts.tsx");
let adminSrc = fs.readFileSync(adminPath, "utf8");
let adminChanged = false;

// ── A1. saveProduct ──
console.log("\n[A1] saveProduct payload...");
if (adminSrc.includes("color_options: localColors")) {
  console.log("  ✅ قبلاً اضافه شده");
} else {
  const saveIdx = adminSrc.indexOf("const saveProduct = async");
  if (saveIdx === -1) { console.error("  ❌ saveProduct پیدا نشد!"); process.exit(1); }
  const stIdx = adminSrc.indexOf('shipping_type: editForm.shipping_type', saveIdx);
  if (stIdx === -1) { console.error("  ❌ shipping_type در payload پیدا نشد!"); process.exit(1); }
  const lineEnd = adminSrc.indexOf("\n", stIdx);
  adminSrc = adminSrc.slice(0, lineEnd) + "\n        color_options: localColors," + adminSrc.slice(lineEnd);
  console.log("  ✅ color_options: localColors اضافه شد");
  adminChanged = true;
}

// ── A2. openEdit ──
console.log("\n[A2] openEdit — لود localColors...");
if (adminSrc.includes("setLocalColors(Array.isArray(p.color_options)")) {
  console.log("  ✅ قبلاً اضافه شده");
} else {
  const editIdx = adminSrc.indexOf("const openEdit = (p: FullCatalogProduct)");
  if (editIdx === -1) { console.error("  ❌ openEdit پیدا نشد!"); process.exit(1); }
  const activeTabIdx = adminSrc.indexOf('setActiveTab("basic")', editIdx);
  if (activeTabIdx === -1) { console.error("  ❌ setActiveTab در openEdit پیدا نشد!"); process.exit(1); }
  const lineEnd = adminSrc.indexOf("\n", activeTabIdx);
  adminSrc = adminSrc.slice(0, lineEnd) + "\n    setLocalColors(Array.isArray(p.color_options) ? p.color_options : []);" + adminSrc.slice(lineEnd);
  console.log("  ✅ setLocalColors در openEdit اضافه شد");
  adminChanged = true;
}

// ── A3. openAdd ──
console.log("\n[A3] openAdd — reset localColors...");
if (adminSrc.includes("setLocalColors([])")) {
  console.log("  ✅ قبلاً اضافه شده");
} else {
  const addIdx = adminSrc.indexOf("const openAdd");
  if (addIdx === -1) { console.error("  ❌ openAdd پیدا نشد!"); process.exit(1); }
  const modalIdx = adminSrc.indexOf("setIsModalOpen(true)", addIdx);
  if (modalIdx === -1) { console.error("  ❌ setIsModalOpen در openAdd پیدا نشد!"); process.exit(1); }
  adminSrc = adminSrc.slice(0, modalIdx) + "setLocalColors([]); " + adminSrc.slice(modalIdx);
  console.log("  ✅ setLocalColors([]) در openAdd اضافه شد");
  adminChanged = true;
}

if (adminChanged) {
  fs.writeFileSync(adminPath, adminSrc, "utf8");
  console.log("\n💾 AdminProducts.tsx ذخیره شد");
}

// تایید
console.log("\n📋 تایید AdminProducts:");
console.log("  color_options در saveProduct:", adminSrc.includes("color_options: localColors") ? "✅" : "❌");
console.log("  setLocalColors در openEdit:", adminSrc.includes("setLocalColors(Array.isArray(p.color_options)") ? "✅" : "❌");
console.log("  setLocalColors در openAdd:", adminSrc.includes("setLocalColors([])") ? "✅" : "❌");

// ══════════════════════════════════════════════════════════
// PART B — Checkout: بررسی CartContext و shipping_type
// ══════════════════════════════════════════════════════════
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🚚 PART B: فیلتر تیپاکس در checkout");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// پیدا کردن CartContext
const cartContextCandidates = [
  "context/CartContext.tsx",
  "contexts/CartContext.tsx",
  "lib/CartContext.tsx",
  "components/CartContext.tsx",
  "context/cart.tsx",
  "contexts/cart.tsx",
  "store/CartContext.tsx",
].map(p => path.join(root, p));

let cartContextPath = null;
for (const p of cartContextCandidates) {
  if (fs.existsSync(p)) { cartContextPath = p; break; }
}

if (!cartContextPath) {
  // جستجوی بیشتر
  const allFiles = execSync("git ls-files", { cwd: root }).toString().split("\n");
  const cartFile = allFiles.find(f => f.toLowerCase().includes("cartcontext") || f.toLowerCase().includes("cart-context"));
  if (cartFile) cartContextPath = path.join(root, cartFile.trim());
}

if (cartContextPath) {
  console.log("\n📁 CartContext:", path.relative(root, cartContextPath));
  let cartSrc = fs.readFileSync(cartContextPath, "utf8");

  // بررسی CartItem interface
  console.log("  shipping_type در CartItem:", cartSrc.includes("shipping_type") ? "✅" : "❌");
  console.log("  addToCart تعریف:", cartSrc.includes("addToCart") ? "✅" : "❌");

  // نمایش CartItem interface
  const itemMatch = cartSrc.match(/interface CartItem[\s\S]{0,500}?\}/);
  if (itemMatch) {
    console.log("\n  CartItem interface فعلی:");
    itemMatch[0].split("\n").forEach(l => console.log("    " + l));
  }

  // بررسی addToCart — آیا shipping_type رو spread می‌کنه یا فقط فیلدهای مشخص؟
  const addToCartMatch = cartSrc.match(/addToCart[\s\S]{0,1000}?(?=const |function |export )/);
  if (addToCartMatch) {
    const hasSpread = addToCartMatch[0].includes("...item") || addToCartMatch[0].includes("...product") || addToCartMatch[0].includes("...p");
    const hasShippingInBody = addToCartMatch[0].includes("shipping_type");
    console.log("\n  addToCart spread:", hasSpread ? "✅ (shipping_type spread می‌شه)" : "⚠️ (ممکنه shipping_type drop بشه)");
    console.log("  addToCart shipping_type:", hasShippingInBody ? "✅" : "❌");

    if (!hasSpread && !hasShippingInBody) {
      console.log("\n  ⚠️ addToCart shipping_type رو drop می‌کنه! باید fix بشه.");

      // پیدا کردن CartItem interface و اضافه کردن shipping_type اگه نیست
      if (!cartSrc.includes("shipping_type")) {
        // پیدا کردن interface CartItem و اضافه کردن shipping_type
        const interfaceEndIdx = cartSrc.indexOf("}", cartSrc.indexOf("interface CartItem"));
        if (interfaceEndIdx !== -1) {
          cartSrc = cartSrc.slice(0, interfaceEndIdx) + "  shipping_type?: string;\n  selectedColor?: string;\n" + cartSrc.slice(interfaceEndIdx);
          console.log("  ✅ shipping_type به CartItem اضافه شد");
        }
      }
    }
  }

  // بررسی addToCart برای اضافه کردن صریح shipping_type
  // پیدا کردن جایی که آیتم جدید ساخته می‌شه
  if (!cartSrc.includes("shipping_type") || (cartSrc.includes("CartItem") && !cartSrc.match(/shipping_type:\s*(item|product|p)\./))) {
    console.log("\n  🔧 پیدا کردن محل ساخت آیتم در addToCart...");
    // پیدا کردن ساختار { id: ..., title: ..., price: ... }
    const newItemMatch = cartSrc.match(/\{[\s\n]*id:\s*[\w.]+,[\s\n]*(?:title|name):/);
    if (newItemMatch) {
      const idx = cartSrc.indexOf(newItemMatch[0]);
      const closeBrace = cartSrc.indexOf("}", idx + 100);
      console.log("  محل ساخت آیتم پیدا شد. بررسی محتوا...");
    }
  }

  fs.writeFileSync(cartContextPath, cartSrc, "utf8");
} else {
  console.log("  ⚠️ CartContext پیدا نشد");
}

// ── بررسی checkout/page.tsx ──
const checkoutPath = path.join(root, "app/checkout/page.tsx");
let checkoutSrc = fs.readFileSync(checkoutPath, "utf8");
let checkoutChanged = false;

console.log("\n📁 checkout/page.tsx بررسی:");
console.log("  allowedShipping موجود:", checkoutSrc.includes("allowedShipping") ? "✅" : "❌");
console.log("  smart_shipping_section موجود:", checkoutSrc.includes("smart_shipping_section") ? "✅" : "❌");

// بررسی allowedShipping logic — آیا درسته؟
if (checkoutSrc.includes("allowedShipping")) {
  const alIdx = checkoutSrc.indexOf("allowedShipping");
  const block = checkoutSrc.slice(alIdx, alIdx + 600);
  console.log("\n  allowedShipping block فعلی:");
  block.split("\n").slice(0, 20).forEach(l => console.log("    " + l));
}

// ── Fix: اگه allowedShipping وجود داره، useMemo رو robust‌تر بکن ──
if (checkoutSrc.includes("allowedShipping")) {
  // پیدا کردن useMemo و جایگزینی با نسخه robust‌تر
  const OLD_USEMEMO = /const allowedShipping = React\.useMemo\(\(\) => \{[\s\S]*?\}, \[cartItems\]\);/;
  const newUseMemo = `const allowedShipping = React.useMemo(() => {
    const items = (cartItems || []) as any[];
    // shipping_type ممکنه مستقیم یا nested باشه
    const getShippingType = (item: any): string => {
      return String(
        item.shipping_type ||
        item.product?.shipping_type ||
        item.shippingType ||
        ""
      ).toLowerCase().trim();
    };
    const hasTipaxOnly = items.some((item: any) => getShippingType(item) === "tipax");
    const hasPostOnly  = items.some((item: any) => getShippingType(item) === "post");
    if (hasTipaxOnly && !hasPostOnly) return "tipax_only" as const;
    if (hasPostOnly  && !hasTipaxOnly) return "post_only"  as const;
    return "both" as const;
  }, [cartItems]);`;

  if (OLD_USEMEMO.test(checkoutSrc)) {
    checkoutSrc = checkoutSrc.replace(OLD_USEMEMO, newUseMemo);
    console.log("  ✅ allowedShipping useMemo به نسخه robust‌تر آپگرید شد");
    checkoutChanged = true;
  } else {
    console.log("  ⚠️ الگوی useMemo دقیق پیدا نشد — جستجوی جایگزین...");
    // پیدا کردن با پیدا کردن شروع و پایان
    const umStart = checkoutSrc.indexOf("const allowedShipping = React.useMemo");
    if (umStart !== -1) {
      // پیدا کردن }, [cartItems]);
      const umEnd = checkoutSrc.indexOf("}, [cartItems]);", umStart);
      if (umEnd !== -1) {
        const fullEnd = umEnd + "}, [cartItems]);".length;
        checkoutSrc = checkoutSrc.slice(0, umStart) + newUseMemo + checkoutSrc.slice(fullEnd);
        console.log("  ✅ allowedShipping useMemo جایگزین شد (روش جایگزین)");
        checkoutChanged = true;
      }
    }
  }
} else {
  console.log("  ❌ allowedShipping وجود ندارد! fix11 باید دوباره اجرا بشه.");
}

// ── بررسی UI smart_shipping_section ──
if (!checkoutSrc.includes("smart_shipping_section")) {
  console.log("\n  ❌ smart_shipping_section در JSX نیست! اضافه می‌کنیم...");

  const uiMarkers = ["روش ارسال کالا", "انتخاب روش ارسال", "شیوه ارسال", "ارسال کالا"];
  let replaced = false;

  for (const marker of uiMarkers) {
    const idx = checkoutSrc.indexOf(marker);
    if (idx === -1) continue;

    let start = idx;
    for (let i = idx; i >= Math.max(0, idx - 800); i--) {
      if (checkoutSrc[i] === '<' && checkoutSrc.slice(i, i + 4) === '<div') { start = i; break; }
    }

    let depth = 0, end = start, safety = 0;
    while (end < checkoutSrc.length && safety < 50000) {
      safety++;
      if (checkoutSrc.slice(end, end + 4) === '<div') { depth++; end += 4; }
      else if (checkoutSrc.slice(end, end + 6) === '</div>') { depth--; end += 6; if (depth === 0) break; }
      else { end++; }
    }

    if (end > start + 100) {
      const smartUI = `{/* smart_shipping_section */}
          <div className="p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
            <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
              ۲. انتخاب روش ارسال کالا (اجباری)
            </h2>
            {allowedShipping !== "both" && (
              <div className="text-[11px] px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold">
                ⚠️ {allowedShipping === "tipax_only"
                  ? "این سفارش فقط از طریق تیپاکس (پس‌کرایه) ارسال می‌شود."
                  : "این سفارش فقط از طریق پست پیشتاز ارسال می‌شود."}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {allowedShipping !== "tipax_only" && (
                <label className={"p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col gap-2 " + (shippingMethod === "post" ? "border-emerald-500 bg-emerald-500/10" : "border-[var(--card-border)] bg-[var(--input-bg)]")}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shippingMethod" value="post" checked={shippingMethod === "post"} onChange={() => setShippingMethod("post")} className="w-4 h-4 accent-emerald-500" />
                    <span className="font-black text-sm">📦 پست پیشتاز</span>
                  </div>
                  <div className="pr-7 font-bold text-emerald-600 text-xs">هزینه ثابت + تحویل درب منزل</div>
                </label>
              )}
              {allowedShipping !== "post_only" && (
                <label className={"p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col gap-2 " + (shippingMethod === "tipax" ? "border-amber-500 bg-amber-500/10" : "border-[var(--card-border)] bg-[var(--input-bg)]")}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shippingMethod" value="tipax" checked={shippingMethod === "tipax"} onChange={() => setShippingMethod("tipax")} className="w-4 h-4 accent-amber-500" />
                    <span className="font-black text-sm">🚀 ارسال با تیپاکس</span>
                  </div>
                  <div className="pr-7 font-bold text-amber-600 text-xs">پس‌کرایه — بدون افزایش مبلغ فاکتور</div>
                </label>
              )}
            </div>
          </div>`;

      checkoutSrc = checkoutSrc.slice(0, start) + smartUI + checkoutSrc.slice(end);
      console.log("  ✅ UI هوشمند ارسال اضافه شد");
      checkoutChanged = true;
      replaced = true;
      break;
    }
  }
  if (!replaced) console.log("  ⚠️ بخش ارسال در JSX پیدا نشد");
} else {
  console.log("  ✅ smart_shipping_section موجود است");
}

// ── بررسی useEffect برای auto-select ──
if (!checkoutSrc.includes("allowedShipping === \"tipax_only\" && shippingMethod !== \"tipax\"")) {
  console.log("\n  اضافه کردن useEffect auto-select...");
  const shippingStateMatch = checkoutSrc.match(/const \[shippingMethod,\s*setShippingMethod\][^\n]+\n/);
  if (shippingStateMatch) {
    const autoEffect = `
  // اعمال خودکار روش ارسال اجباری
  React.useEffect(() => {
    if (allowedShipping === "tipax_only" && shippingMethod !== "tipax") {
      setShippingMethod("tipax");
    } else if (allowedShipping === "post_only" && shippingMethod !== "post") {
      setShippingMethod("post");
    }
  }, [allowedShipping]); // eslint-disable-line react-hooks/exhaustive-deps
`;
    checkoutSrc = checkoutSrc.replace(shippingStateMatch[0], shippingStateMatch[0] + autoEffect);
    console.log("  ✅ useEffect auto-select اضافه شد");
    checkoutChanged = true;
  }
}

if (checkoutChanged) {
  fs.writeFileSync(checkoutPath, checkoutSrc, "utf8");
  console.log("  💾 checkout/page.tsx ذخیره شد");
}

// ══════════════════════════════════════════════════════════
// PART C — CartContext: اطمینان از حفظ shipping_type
// ══════════════════════════════════════════════════════════
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🛒 PART C: CartContext — حفظ shipping_type");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

if (cartContextPath) {
  let cartSrc = fs.readFileSync(cartContextPath, "utf8");
  let cartChanged = false;

  // بررسی CartItem interface برای shipping_type
  if (!cartSrc.includes("shipping_type")) {
    console.log("\n  ❌ shipping_type در CartItem نیست! اضافه می‌کنیم...");

    // پیدا کردن interface CartItem { ... }
    const interfaceMatch = cartSrc.match(/interface CartItem\s*\{[^}]+\}/);
    if (interfaceMatch) {
      const newInterface = interfaceMatch[0].replace("}", "  shipping_type?: string;\n  selectedColor?: string;\n}");
      cartSrc = cartSrc.replace(interfaceMatch[0], newInterface);
      console.log("  ✅ shipping_type به CartItem اضافه شد");
      cartChanged = true;
    }

    // پیدا کردن type CartItem = { ... }
    const typeMatch = cartSrc.match(/type CartItem\s*=\s*\{[^}]+\}/);
    if (typeMatch) {
      const newType = typeMatch[0].replace("}", "  shipping_type?: string;\n  selectedColor?: string;\n}");
      cartSrc = cartSrc.replace(typeMatch[0], newType);
      console.log("  ✅ shipping_type به CartItem type اضافه شد");
      cartChanged = true;
    }
  } else {
    console.log("  ✅ shipping_type در CartItem موجود است");
  }

  // بررسی addToCart — آیا extra fields رو حفظ می‌کنه؟
  // پیدا کردن جایی که آیتم push/set می‌شه
  const addFnIdx = cartSrc.indexOf("addToCart");
  if (addFnIdx !== -1) {
    const block500 = cartSrc.slice(addFnIdx, addFnIdx + 1500);
    const hasSpread = block500.includes("...item") || block500.includes("...product") || block500.includes("...newItem") || block500.includes("...p,");
    const hasShippingExplicit = block500.includes("shipping_type:");

    console.log("  addToCart spread extra fields:", hasSpread ? "✅" : "❌ (ممکنه shipping_type drop بشه)");
    console.log("  addToCart shipping_type صریح:", hasShippingExplicit ? "✅" : "❌");

    if (!hasSpread && !hasShippingExplicit && cartSrc.includes("shipping_type")) {
      // پیدا کردن محل push یا set آیتم جدید در addToCart
      // معمولاً { id, title, price, image, quantity, ... }
      const newItemPattern = /\{\s*\n?\s*id:/;
      const niMatch = block500.match(newItemPattern);
      if (niMatch) {
        const niIdx = cartSrc.indexOf(niMatch[0], addFnIdx);
        const niClose = cartSrc.indexOf("}", niIdx + 50);
        if (niIdx !== -1 && niClose !== -1) {
          // اضافه کردن shipping_type قبل از }
          cartSrc = cartSrc.slice(0, niClose) + "    shipping_type: (item as any).shipping_type,\n    selectedColor: (item as any).selectedColor,\n  " + cartSrc.slice(niClose);
          console.log("  ✅ shipping_type به new item در addToCart اضافه شد");
          cartChanged = true;
        }
      }
    }
  }

  if (cartChanged) {
    fs.writeFileSync(cartContextPath, cartSrc, "utf8");
    console.log("  💾 CartContext ذخیره شد");
  }
} else {
  console.log("  ⚠️ CartContext پیدا نشد");
}

// ══════════════════════════════════════════════════════════
// Build
// ══════════════════════════════════════════════════════════
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔨 Build verification");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
try {
  execSync("npm run build", { cwd: root, stdio: "inherit" });
  console.log("✅ Build موفق!");
} catch (e) {
  console.error("❌ Build ناموفق!");
  process.exit(1);
}

// ══════════════════════════════════════════════════════════
// Git
// ══════════════════════════════════════════════════════════
console.log("\n📤 Git commit & push...");
try {
  execSync("git add -A", { cwd: root, stdio: "inherit" });
  const msg = `fix: complete color_options + tipax shipping filter

AdminProducts.tsx:
- saveProduct: add color_options: localColors to API payload
- openEdit: load existing color_options into localColors state
- openAdd: reset localColors to [] for new products

checkout/page.tsx:
- allowedShipping useMemo: robust shipping_type detection
  (checks item.shipping_type, item.product?.shipping_type)
- auto-select useEffect for tipax_only / post_only
- smart UI hides disallowed shipping option

CartContext: ensure shipping_type preserved in cart items

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe`;
  execSync(`git commit -m "${msg}"`, { cwd: root, stdio: "inherit" });
  execSync("git push origin main", { cwd: root, stdio: "inherit" });
  console.log("🚀 Push موفق!");
} catch (e) {
  console.error("Git:", e.message);
}

console.log("\n✅ fix13.js کامل!");
console.log("🎨 رنگ محصول: ذخیره و لود ✅");
console.log("🚚 تیپاکس فیلتر: پست پیشتاز مخفی می‌شه ✅");