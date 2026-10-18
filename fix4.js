// fix4.js — AdminProducts.tsx: toggle bug fix + dry-run mismatch warning
// همچنین checkout: tipax = پس‌کرایه (بدون پیش‌پرداخت ارسال)
// node fix4.js  (بعد از اجرای fix2.js + fix3.js اجرا کن)

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

// ═══════════════════════════════════════════════════════════════════
// ① AdminProducts.tsx — باگ toggle + dry-run mismatch warning
// ═══════════════════════════════════════════════════════════════════
const ADMIN_PATH = path.join(ROOT, "components", "AdminProducts.tsx");
let adminSrc = fs.readFileSync(ADMIN_PATH, "utf8");

// ── patch: toggle فقط موجود ──────────────────────────────────────
const OLD_TOGGLE_AVAIL = `                {/* toggle فقط موجود */}
                <label className="flex items-center gap-3 cursor-pointer select-none mb-3">
                  <div onClick={()=>setImportOnlyAvailable(v=>!v)}
                    className={\`w-11 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 \${importOnlyAvailable?"bg-emerald-500":"bg-[var(--card-border)]"}\`}>
                    <div className={\`w-4 h-4 rounded-full bg-white shadow transition-transform \${importOnlyAvailable?"translate-x-5":"translate-x-0"}\`}/>
                  </div>
                  <span className="font-bold text-xs">فقط محصولات موجود را وارد کن <span className="text-[var(--text-secondary)] font-normal">(ناموجودها skip می‌شن)</span></span>
                </label>

                {/* toggle skip تکراری */}
                <label className="flex items-center gap-3 cursor-pointer select-none mb-5">
                  <div onClick={()=>setImportSkipExisting(v=>!v)}
                    className={\`w-11 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 \${importSkipExisting?"bg-amber-500":"bg-[var(--card-border)]"}\`}>
                    <div className={\`w-4 h-4 rounded-full bg-white shadow transition-transform \${importSkipExisting?"translate-x-5":"translate-x-0"}\`}/>
                  </div>
                  <span className="font-bold text-xs">اگر محصول از قبل در سایت هست، skip کن <span className="text-[var(--text-secondary)] font-normal">(محصولات تکراری آپدیت نمی‌شن)</span></span>
                </label>`;

const NEW_TOGGLE_AVAIL = `                {/* toggle فقط موجود — کل ردیف کلیکپذیره */}
                <div role="button" tabIndex={0}
                  onClick={()=>setImportOnlyAvailable(v=>!v)}
                  onKeyDown={e=>(e.key===" "||e.key==="Enter")&&setImportOnlyAvailable(v=>!v)}
                  className="flex items-center gap-3 cursor-pointer select-none mb-3 group">
                  <div className={\`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 \${importOnlyAvailable?"bg-emerald-500":"bg-slate-300 dark:bg-slate-600"}\`}>
                    <div className={\`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 \${importOnlyAvailable?"translate-x-5":"translate-x-0"}\`}/>
                  </div>
                  <span className="font-bold text-xs group-hover:text-[var(--accent-blue)] transition-colors">
                    فقط محصولات موجود را وارد کن
                    <span className="text-[var(--text-secondary)] font-normal"> (ناموجودها skip می‌شن)</span>
                  </span>
                </div>

                {/* toggle skip تکراری — کل ردیف کلیکپذیره */}
                <div role="button" tabIndex={0}
                  onClick={()=>setImportSkipExisting(v=>!v)}
                  onKeyDown={e=>(e.key===" "||e.key==="Enter")&&setImportSkipExisting(v=>!v)}
                  className="flex items-center gap-3 cursor-pointer select-none mb-5 group">
                  <div className={\`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 \${importSkipExisting?"bg-amber-500":"bg-slate-300 dark:bg-slate-600"}\`}>
                    <div className={\`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 \${importSkipExisting?"translate-x-5":"translate-x-0"}\`}/>
                  </div>
                  <span className="font-bold text-xs group-hover:text-[var(--accent-blue)] transition-colors">
                    اگر محصول از قبل در سایت هست، skip کن
                    <span className="text-[var(--text-secondary)] font-normal"> (محصولات تکراری آپدیت نمی‌شن)</span>
                  </span>
                </div>`;

if (adminSrc.includes(OLD_TOGGLE_AVAIL)) {
  adminSrc = adminSrc.replace(OLD_TOGGLE_AVAIL, NEW_TOGGLE_AVAIL);
  console.log("✅ toggle UI پچ شد — کل ردیف کلیکپذیر");
} else {
  console.warn("⚠️ toggle pattern پیدا نشد — ممکنه قبلاً پچ شده باشه");
}

// ── patch: dry-run — ستون اخطار mismatch ───────────────────────
// اضافه کردن هشدار وقتی توضیحات با عنوان تناقض آشکار داره
const OLD_DRY_HEADER = `                        <thead className="bg-[var(--input-bg)] text-[var(--text-secondary)] sticky top-0 text-[10px]">
                        <tr>
                          <th className="p-2">تصویر</th>
                          <th className="p-2">عنوان</th>
                          <th className="p-2">دسته</th>
                          <th className="p-2">موجودی</th>
                          <th className="p-2">قیمت نهایی</th>
                          <th className="p-2">ارسال</th>
                          <th className="p-2">وضعیت</th>
                        </tr>
                      </thead>`;

const NEW_DRY_HEADER = `                        <thead className="bg-[var(--input-bg)] text-[var(--text-secondary)] sticky top-0 text-[10px]">
                        <tr>
                          <th className="p-2">تصویر</th>
                          <th className="p-2">عنوان</th>
                          <th className="p-2">دسته</th>
                          <th className="p-2">موجودی</th>
                          <th className="p-2">قیمت نهایی</th>
                          <th className="p-2">ارسال</th>
                          <th className="p-2">⚠️</th>
                          <th className="p-2">وضعیت</th>
                        </tr>
                      </thead>`;

if (adminSrc.includes(OLD_DRY_HEADER)) {
  adminSrc = adminSrc.replace(OLD_DRY_HEADER, NEW_DRY_HEADER);
}

// اضافه کردن ستون اخطار در سطر dry-run
const OLD_DRY_ROW_END = `                              <td className="p-2">
                                <span className={\`px-2 py-0.5 rounded-full text-[9px] font-black \${willSkip?"bg-slate-500/15 text-slate-500":ex?"bg-amber-500/15 text-amber-500":"bg-emerald-500/15 text-emerald-500"}\`}>
                                  {willSkip?"⏭️ skip":ex?"📝 آپدیت":"🆕 جدید"}
                                </span>
                              </td>
                            </tr>`;

const NEW_DRY_ROW_END = `                              <td className="p-2">
                                {/* هشدار: توضیحات با عنوان تناقض داره */}
                                {(()=>{
                                  if (!r.description || !r.title) return null;
                                  const titleWords = r.title.split(/\\s+/).filter((w:string)=>w.length>2).slice(0,3);
                                  const descLower = r.description.toLowerCase();
                                  const titleLower = r.title.toLowerCase();
                                  const hasMatch = titleWords.some((w:string)=>descLower.includes(w.toLowerCase()));
                                  if (!hasMatch && r.description.length > 30)
                                    return <span title="توضیحات با عنوان محصول مطابقت ندارد — احتمالاً خطای داده در فایل اکسل" className="text-orange-500 text-[11px] cursor-help">⚠️</span>;
                                  return null;
                                })()}
                              </td>
                              <td className="p-2">
                                <span className={\`px-2 py-0.5 rounded-full text-[9px] font-black \${willSkip?"bg-slate-500/15 text-slate-500":ex?"bg-amber-500/15 text-amber-500":"bg-emerald-500/15 text-emerald-500"}\`}>
                                  {willSkip?"⏭️ skip":ex?"📝 آپدیت":"🆕 جدید"}
                                </span>
                              </td>
                            </tr>`;

if (adminSrc.includes(OLD_DRY_ROW_END)) {
  adminSrc = adminSrc.replace(OLD_DRY_ROW_END, NEW_DRY_ROW_END);
  console.log("✅ dry-run mismatch warning اضافه شد");
}

fs.writeFileSync(ADMIN_PATH, adminSrc, "utf8");
console.log("💾 AdminProducts.tsx نوشته شد");

// ═══════════════════════════════════════════════════════════════════
// ② checkout/page.tsx — تیپاکس = پس‌کرایه (بدون پیش‌پرداخت ارسال)
// ═══════════════════════════════════════════════════════════════════
const CHECKOUT_PATH = path.join(ROOT, "app", "checkout", "page.tsx");

if (!fs.existsSync(CHECKOUT_PATH)) {
  console.warn("⚠️ checkout/page.tsx پیدا نشد — skip");
} else {
  let checkoutSrc = fs.readFileSync(CHECKOUT_PATH, "utf8");

  // ── اضافه کردن منطق tipax به محاسبه shipping ──
  // دنبال محل محاسبه shippingCost میگردیم
  // این pattern باید در checkout page باشه
  const OLD_SHIP_CALC = `  const shippingCost = useMemo(() => {`;
  const NEW_SHIP_CALC = `  // تشخیص محصولات تیپاکس در سبد
  const cartShippingTypes = useMemo(() => {
    const types = new Set<string>();
    cartItems.forEach(item => {
      const t = (item as any).shipping_type || "both";
      types.add(t);
    });
    return types;
  }, [cartItems]);

  // اگر همه محصولات تیپاکس هستن → پس‌کرایه، هزینه از مشتری موقع تحویل گرفته میشه
  const allTipax = cartShippingTypes.size === 1 && cartShippingTypes.has("tipax");
  const hasTipax  = cartShippingTypes.has("tipax");
  const hasPost   = cartShippingTypes.has("post") || cartShippingTypes.has("both");

  const shippingCost = useMemo(() => {`;

  if (checkoutSrc.includes(OLD_SHIP_CALC)) {
    checkoutSrc = checkoutSrc.replace(OLD_SHIP_CALC, NEW_SHIP_CALC);
    console.log("✅ checkout: shipping type detection اضافه شد");
  } else {
    console.warn("⚠️ shippingCost useMemo پیدا نشد در checkout");
  }

  // ── اگر allTipax → shipping = 0 ──
  // پیدا کردن جایی که shippingCost محاسبه میشه و اضافه کردن override
  const OLD_SHIP_RETURN = `    if (!province || !city) return financialRules.defaultShipping;`;
  const NEW_SHIP_RETURN = `    // تیپاکس = پس‌کرایه: هزینه ارسال هنگام تحویل گرفته میشه
    if (allTipax) return 0;
    if (!province || !city) return financialRules.defaultShipping;`;

  if (checkoutSrc.includes(OLD_SHIP_RETURN)) {
    checkoutSrc = checkoutSrc.replace(OLD_SHIP_RETURN, NEW_SHIP_RETURN);
    console.log("✅ checkout: allTipax → shippingCost=0 اعمال شد");
  } else {
    console.warn("⚠️ OLD_SHIP_RETURN pattern پیدا نشد");
  }

  // ── نمایش پیام پس‌کرایه در فرم ──
  // دنبال نمایش هزینه ارسال در UI میگردیم
  const OLD_SHIP_UI = `              <div className="flex justify-between">
                <span>هزینه ارسال:</span>`;

  const NEW_SHIP_UI = `              {hasTipax && (
                <div className="flex items-center gap-2 text-amber-500 text-[11px] font-bold p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span>🚚</span>
                  <span>
                    {allTipax
                      ? "ارسال تیپاکس — هزینه به‌صورت پس‌کرایه هنگام تحویل دریافت می‌شود"
                      : "بخشی از سفارش با تیپاکس ارسال می‌شود — هزینه آن هنگام تحویل جداگانه دریافت می‌گردد"}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>هزینه ارسال:</span>`;

  if (checkoutSrc.includes(OLD_SHIP_UI)) {
    checkoutSrc = checkoutSrc.replace(OLD_SHIP_UI, NEW_SHIP_UI);
    console.log("✅ checkout: پیام پس‌کرایه اضافه شد");
  } else {
    console.warn("⚠️ shipping UI pattern پیدا نشد — ممکنه ساختار صورتحساب فرق کنه");
  }

  // ── شرط نمایش هزینه ارسال در صورت‌حساب ──
  const OLD_SHIP_AMOUNT = `              <div className="flex justify-between">
                <span>هزینه ارسال:</span>
                <span className="font-mono">`;
  const NEW_SHIP_AMOUNT = `              <div className="flex justify-between" style={{opacity: allTipax ? 0.4 : 1}}>
                <span>هزینه ارسال:{allTipax?" (پس‌کرایه)":""}</span>
                <span className="font-mono">`;

  if (checkoutSrc.includes(OLD_SHIP_AMOUNT)) {
    checkoutSrc = checkoutSrc.replace(OLD_SHIP_AMOUNT, NEW_SHIP_AMOUNT);
  }

  fs.writeFileSync(CHECKOUT_PATH, checkoutSrc, "utf8");
  console.log("💾 checkout/page.tsx نوشته شد");
}

// ═══════════════════════════════════════════════════════════════════
// build + git
// ═══════════════════════════════════════════════════════════════════
console.log("🔨 npm run build...");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("✅ Build موفق!");
} catch {
  console.error("❌ Build شکست");
  process.exit(1);
}

try {
  execSync("git add components/AdminProducts.tsx app/checkout/page.tsx", { cwd: ROOT, stdio: "inherit" });
  execSync(`git commit -m "fix(admin+checkout): toggle click bug + tipax پس‌کرایه + dry-run mismatch warn

- AdminProducts: toggle به div role=button تبدیل شد (کل ردیف کلیکپذیر)
- AdminProducts: dry-run اخطار ⚠️ اگر توضیحات با عنوان تناقض داشت
- checkout: تیپاکس = پس‌کرایه، هزینه ارسال اضافه نمیشه
- checkout: پیام اطلاع‌رسانی پس‌کرایه در صورتحساب

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe"`, { cwd: ROOT, stdio: "inherit" });
  execSync("git push origin main", { cwd: ROOT, stdio: "inherit" });
  console.log("🚀 Push موفق!");
} catch(e) {
  console.error("⚠️ خطا در git:", e.message);
}