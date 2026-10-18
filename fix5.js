// fix5.js — رفع کامل مشکلات:
// ① api/products/route.ts: اضافه purchase_price + shipping_type به safePayload
// ② productUnpacker.ts: حذف hardcoded brand/warranty defaults
// ③ checkout/page.tsx: فیلتر هوشمند روش ارسال + تیپاکس=پس‌کرایه + نمایش محصولات سبد
// node fix5.js

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findRoot(dir) {
  if (fs.existsSync(path.join(dir, "package.json"))) return dir;
  const parent = path.dirname(dir);
  if (parent === dir) throw new Error("package.json پیدا نشد!");
  return findRoot(parent);
}
const ROOT = findRoot(__dirname);
console.log("📁 پروژه:", ROOT);

// ══════════════════════════════════════════════════════════════
// ① app/api/products/route.ts
// ══════════════════════════════════════════════════════════════
const ROUTE_PATH = path.join(ROOT, "app", "api", "products", "route.ts");
let routeSrc = fs.readFileSync(ROUTE_PATH, "utf8");

// ── ۱a: brand default را حذف کن ──────────────────────────────
routeSrc = routeSrc.replace(
  `brand: String(body.brand || "Axon").trim(),`,
  `brand: String(body.brand ?? "").trim(),`
);

// ── ۱b: warranty default را حذف کن ──────────────────────────
routeSrc = routeSrc.replace(
  `warranty: String(body.warranty || "۱۸ ماه گارانتی اصالت طلایی").trim(),`,
  `warranty: String(body.warranty ?? "").trim(),`
);

// ── ۱c: purchase_price + shipping_type به safePayload اضافه کن ──
const OLD_SAFE_PAYLOAD_END = `      updated_at: new Date().toISOString(),
    };`;

const NEW_SAFE_PAYLOAD_END = `      updated_at: new Date().toISOString(),
      // ← ستون‌های جدید — مستقیم به DB نوشته میشن
      purchase_price: purchasePrice,
      shipping_type: (["post","tipax","both"] as const).includes(body.shipping_type as any)
        ? (body.shipping_type as "post"|"tipax"|"both")
        : "both",
    };`;

if (routeSrc.includes(OLD_SAFE_PAYLOAD_END)) {
  routeSrc = routeSrc.replace(OLD_SAFE_PAYLOAD_END, NEW_SAFE_PAYLOAD_END);
  console.log("✅ route.ts: purchase_price + shipping_type به safePayload اضافه شد");
} else {
  console.error("❌ route.ts OLD_SAFE_PAYLOAD_END پیدا نشد");
  process.exit(1);
}

fs.writeFileSync(ROUTE_PATH, routeSrc, "utf8");
console.log("💾 route.ts نوشته شد");

// ══════════════════════════════════════════════════════════════
// ② lib/productUnpacker.ts
// ══════════════════════════════════════════════════════════════
const UNPACKER_PATH = path.join(ROOT, "lib", "productUnpacker.ts");
let unpackerSrc = fs.readFileSync(UNPACKER_PATH, "utf8");

// برند: حذف پیش‌فرض "Axon"
unpackerSrc = unpackerSrc.replace(
  `brand: p.brand || meta.brand || "Axon",`,
  `brand: p.brand || meta.brand || "",`
);

// گارانتی: حذف پیش‌فرض hardcoded
unpackerSrc = unpackerSrc.replace(
  `warranty: p.warranty || meta.warranty || "۱۸ ماه گارانتی اصالت طلایی",`,
  `warranty: p.warranty || meta.warranty || "",`
);

// shipping_type: مطمئن شو که از ستون DB خونده میشه
// (این فیلد از ...p spread برمیگرده ولی صریح اضافه میکنیم برای وضوح)
const OLD_UNPACK_RETURN_END = `    specs: (typeof p.specs === "object" && p.specs) || meta.specs || {},
  };
}`;

const NEW_UNPACK_RETURN_END = `    specs: (typeof p.specs === "object" && p.specs) || meta.specs || {},
    // روش ارسال — از ستون DB
    shipping_type: (p.shipping_type as "post"|"tipax"|"both"|undefined) || "both",
  };
}`;

if (unpackerSrc.includes(OLD_UNPACK_RETURN_END)) {
  unpackerSrc = unpackerSrc.replace(OLD_UNPACK_RETURN_END, NEW_UNPACK_RETURN_END);
  console.log("✅ productUnpacker.ts: shipping_type صریح اضافه شد + brand/warranty default پاک شد");
} else {
  console.warn("⚠️ productUnpacker: end pattern عوض شده");
}

fs.writeFileSync(UNPACKER_PATH, unpackerSrc, "utf8");
console.log("💾 productUnpacker.ts نوشته شد");

// ══════════════════════════════════════════════════════════════
// ③ app/checkout/page.tsx — فیلتر هوشمند ارسال + نمایش سبد
// ══════════════════════════════════════════════════════════════
const CHECKOUT_PATH = path.join(ROOT, "app", "checkout", "page.tsx");
let checkoutSrc = fs.readFileSync(CHECKOUT_PATH, "utf8");

// ── ۳a: محاسبه نوع ارسال مجاز از محصولات سبد ──────────────────
const OLD_SHIP_COST_CALC = `  let shippingCost = 0;
  if (finalPayable > 0) {
    if (shippingMethod === "post") shippingCost = financialRules.postShippingCost;
    else if (shippingMethod === "tipax") shippingCost = financialRules.tipaxShippingCost;
  }`;

const NEW_SHIP_COST_CALC = `  // ── فیلتر هوشمند روش ارسال بر اساس نوع محصولات سبد ─────────
  const cartShipTypes = cartItems.map((i: any) => (i.shipping_type || "both") as string);
  const allowPost  = cartShipTypes.every(t => t === "post"  || t === "both");
  const allowTipax = cartShipTypes.every(t => t === "tipax" || t === "both");
  // اگر همه محصولات یه نوع خاص دارن، auto-select کن
  const forcedShipping: "post"|"tipax"|null =
    (allowPost && !allowTipax) ? "post" :
    (!allowPost && allowTipax) ? "tipax" : null;

  // اگر نوع ارسال محدود شده و انتخاب کنونی اشتباهه، ریست کن
  React.useEffect(() => {
    if (forcedShipping && shippingMethod !== forcedShipping) {
      setShippingMethod(forcedShipping);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedShipping]);

  // تیپاکس = پس‌کرایه: هزینه ارسال هنگام تحویل گرفته میشه
  let shippingCost = 0;
  if (finalPayable > 0) {
    if (shippingMethod === "post") shippingCost = financialRules.postShippingCost;
    else if (shippingMethod === "tipax") shippingCost = 0; // پس‌کرایه
  }`;

if (checkoutSrc.includes(OLD_SHIP_COST_CALC)) {
  checkoutSrc = checkoutSrc.replace(OLD_SHIP_COST_CALC, NEW_SHIP_COST_CALC);
  console.log("✅ checkout: فیلتر هوشمند ارسال + تیپاکس=پس‌کرایه اضافه شد");
} else {
  console.warn("⚠️ checkout: OLD_SHIP_COST_CALC pattern عوض شده");
}

// ── ۳b: بخش انتخاب روش ارسال — فیلتر دکمه‌ها ──────────────────
const OLD_SHIPPING_SECTION = `            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <label className={"p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col gap-2 " + (shippingMethod === "post" ? "border-emerald-500 bg-emerald-500/10" : "border-[var(--card-border)] bg-[var(--input-bg)]")}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="shippingMethod" value="post" checked={shippingMethod === "post"} onChange={() => { setShippingMethod("post"); soundEngine.playClick(); }} className="w-4 h-4 accent-emerald-500" />
                  <span className="font-black text-sm">پست پیشتاز</span>
                </div>
                <div className="pr-7 font-mono font-black text-emerald-600">{formatPrice(financialRules.postShippingCost)} تومان</div>
              </label>

              <label className={"p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col gap-2 " + (shippingMethod === "tipax" ? "border-amber-500 bg-amber-500/10" : "border-[var(--card-border)] bg-[var(--input-bg)]")}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="shippingMethod" value="tipax" checked={shippingMethod === "tipax"} onChange={() => { setShippingMethod("tipax"); soundEngine.playClick(); }} className="w-4 h-4 accent-amber-500" />
                  <span className="font-black text-sm">ارسال با تیپاکس</span>
                </div>
                <div className="pr-7 font-mono font-black text-amber-600">{formatPrice(financialRules.tipaxShippingCost)} تومان</div>
              </label>
            </div>`;

const NEW_SHIPPING_SECTION = `            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* پست پیشتاز — فقط وقتی مجاز باشه */}
              {(allowPost || (!allowPost && !allowTipax)) && (
                <label className={"p-4 rounded-2xl border-2 transition flex flex-col gap-2 " + (!allowPost ? "opacity-40 cursor-not-allowed" : "cursor-pointer") + " " + (shippingMethod === "post" ? "border-emerald-500 bg-emerald-500/10" : "border-[var(--card-border)] bg-[var(--input-bg)]")}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shippingMethod" value="post" checked={shippingMethod === "post"} disabled={!allowPost}
                      onChange={() => { if (allowPost) { setShippingMethod("post"); soundEngine.playClick(); } }}
                      className="w-4 h-4 accent-emerald-500" />
                    <span className="font-black text-sm">📮 پست پیشتاز</span>
                  </div>
                  <div className="pr-7 font-mono font-black text-emerald-600">{formatPrice(financialRules.postShippingCost)} تومان</div>
                </label>
              )}

              {/* تیپاکس — فقط وقتی مجاز باشه */}
              {(allowTipax || (!allowPost && !allowTipax)) && (
                <label className={"p-4 rounded-2xl border-2 transition flex flex-col gap-2 " + (!allowTipax ? "opacity-40 cursor-not-allowed" : "cursor-pointer") + " " + (shippingMethod === "tipax" ? "border-amber-500 bg-amber-500/10" : "border-[var(--card-border)] bg-[var(--input-bg)]")}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shippingMethod" value="tipax" checked={shippingMethod === "tipax"} disabled={!allowTipax}
                      onChange={() => { if (allowTipax) { setShippingMethod("tipax"); soundEngine.playClick(); } }}
                      className="w-4 h-4 accent-amber-500" />
                    <span className="font-black text-sm">🚚 ارسال با تیپاکس</span>
                  </div>
                  <div className="pr-7">
                    <span className="font-mono font-black text-amber-600">پس‌کرایه</span>
                    <span className="text-[10px] text-[var(--text-secondary)] mr-2">(هنگام تحویل دریافت میشه)</span>
                  </div>
                </label>
              )}
            </div>`;

if (checkoutSrc.includes(OLD_SHIPPING_SECTION)) {
  checkoutSrc = checkoutSrc.replace(OLD_SHIPPING_SECTION, NEW_SHIPPING_SECTION);
  console.log("✅ checkout: دکمه‌های ارسال فیلتر + تیپاکس = پس‌کرایه نمایش داده شد");
} else {
  console.warn("⚠️ checkout: shipping section pattern عوض شده");
}

// ── ۳c: نمایش محصولات سبد در صورتحساب ──────────────────────────
const OLD_INVOICE_HEADER = `          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">۳. صورتحساب و تایید نهایی</h2>`;

const NEW_INVOICE_HEADER = `          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">۳. صورتحساب و تایید نهایی</h2>
          {/* خلاصه محصولات سبد */}
          {cartItems.length > 0 && (
            <div className="space-y-2 text-[11px]">
              {cartItems.map((item: any, idx: number) => (
                <div key={item.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  {(item.image || item.image_url) && (
                    <img src={item.image || item.image_url} alt={item.title||""} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" onError={(e)=>{(e.target as HTMLImageElement).style.display="none"}} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[12px] truncate">{item.title || item.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[var(--text-secondary)]">
                      <span>تعداد: <span className="font-mono font-bold">{item.quantity || 1}</span></span>
                      {item.selectedColor && <span>رنگ: <span className="font-bold">{item.selectedColor}</span></span>}
                    </div>
                  </div>
                  <div className="font-mono font-black text-[var(--accent-blue)] whitespace-nowrap text-[11px]">
                    {typeof formatPrice === "function" ? formatPrice((item.discount_price||item.price||0)*(item.quantity||1)) : ((item.discount_price||item.price||0)*(item.quantity||1)).toLocaleString("fa-IR")} ت
                  </div>
                </div>
              ))}
            </div>
          )}`;

if (checkoutSrc.includes(OLD_INVOICE_HEADER)) {
  checkoutSrc = checkoutSrc.replace(OLD_INVOICE_HEADER, NEW_INVOICE_HEADER);
  console.log("✅ checkout: نمایش خلاصه محصولات سبد در صورتحساب اضافه شد");
} else {
  console.warn("⚠️ checkout: invoice header pattern عوض شده");
}

// ── ۳d: نمایش پس‌کرایه در ردیف هزینه ارسال ──────────────────────
const OLD_SHIP_LINE = `            <div className="flex justify-between">
              <span>هزینه ارسال ({shippingMethod === "post" ? "پست" : shippingMethod === "tipax" ? "تیپاکس" : "انتخاب نشده"}):</span>
              <span className="font-mono text-emerald-500">{!shippingMethod ? "---" : formatPrice(shippingCost) + " تومان"}</span>
            </div>`;

const NEW_SHIP_LINE = `            <div className="flex justify-between">
              <span>هزینه ارسال ({shippingMethod === "post" ? "پست" : shippingMethod === "tipax" ? "تیپاکس" : "انتخاب نشده"}):</span>
              <span className={\`font-mono \${shippingMethod==="tipax"?"text-amber-500":"text-emerald-500"}\`}>
                {!shippingMethod ? "---" : shippingMethod === "tipax" ? "پس‌کرایه 🚚" : formatPrice(shippingCost) + " تومان"}
              </span>
            </div>`;

if (checkoutSrc.includes(OLD_SHIP_LINE)) {
  checkoutSrc = checkoutSrc.replace(OLD_SHIP_LINE, NEW_SHIP_LINE);
  console.log("✅ checkout: ردیف هزینه ارسال «پس‌کرایه» نمایش داد");
} else {
  console.warn("⚠️ checkout: ship line pattern عوض شده");
}

fs.writeFileSync(CHECKOUT_PATH, checkoutSrc, "utf8");
console.log("💾 checkout/page.tsx نوشته شد");

// ══════════════════════════════════════════════════════════════
// Build + Git
// ══════════════════════════════════════════════════════════════
console.log("\n🔨 npm run build...");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("✅ Build موفق!");
} catch {
  console.error("❌ Build شکست — git push انجام نشد");
  process.exit(1);
}

try {
  execSync("git add app/api/products/route.ts lib/productUnpacker.ts app/checkout/page.tsx", { cwd: ROOT, stdio: "inherit" });
  execSync(`git commit -m "fix(api+checkout): purchase_price+shipping_type ذخیره در DB + فیلتر ارسال

- route.ts: purchase_price + shipping_type به safePayload اضافه شد
- route.ts: حذف hardcoded default برند (Axon) و گارانتی
- productUnpacker.ts: shipping_type صریح از ستون DB
- productUnpacker.ts: brand/warranty بدون auto-fill
- checkout: فیلتر هوشمند — فقط روش ارسال مجاز محصول نمایش داده میشه
- checkout: تیپاکس = پس‌کرایه (هزینه ارسال 0)
- checkout: نمایش خلاصه محصولات سبد با تعداد و رنگ

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe"`, { cwd: ROOT, stdio: "inherit" });
  execSync("git push origin main", { cwd: ROOT, stdio: "inherit" });
  console.log("🚀 Push موفق!");
} catch(e) {
  console.error("⚠️ git error:", e.message);
}