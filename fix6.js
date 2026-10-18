/**
 * fix6.js — آکسون کور
 *
 * تغییرات این نسخه:
 * 1. پشتیبانی از PDF و Word (docx) در ایمپورت محصولات (API سرور‌ساید)
 * 2. انتخاب نوع ارسال در مودال ایمپورت (override برای همه محصولات)
 * 3. بهبود نمایش اسلایدر در موبایل
 *
 * اجرا: node fix6.js
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/* ── پیدا کردن ریشه پروژه ── */
function findRoot(startDir) {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("❌ پوشه پروژه (package.json) پیدا نشد!");
}
const ROOT = findRoot(__dirname);
console.log("🔍 ریشه پروژه:", ROOT);

/* ── نصب کتابخانه‌های جدید ── */
console.log("📦 نصب pdf-parse و mammoth...");
execSync("npm install pdf-parse mammoth --legacy-peer-deps", { cwd: ROOT, stdio: "inherit" });
execSync("npm install --save-dev @types/pdf-parse --legacy-peer-deps", { cwd: ROOT, stdio: "inherit" });
console.log("✅ کتابخانه‌ها نصب شدند.");

/* ══════════════════════════════════════════════════════════
   فایل ۱: app/api/admin/parse-document/route.ts (جدید)
   پارسر سرور‌ساید برای PDF و Word
══════════════════════════════════════════════════════════ */
const PARSE_DOC_ROUTE = `// File Path: app/api/admin/parse-document/route.ts
// پارسر اسناد PDF و Word برای ایمپورت گروهی محصولات
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/** تبدیل متن خام به ردیف‌های آرایه */
function parseTextToRows(text: string): Record<string, any>[] {
  const lines = text
    .split(/\\r?\\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  // تشخیص جداکننده ستون‌ها
  const sample = lines[0];
  const sep =
    sample.includes("\\t") ? "\\t" :
    sample.includes("|")   ? "|"   :
    sample.includes(";")   ? ";"   :
    sample.includes(",")   ? ","   : null;

  if (!sep) return []; // فرمت قابل پارس نیست

  const headers = sample
    .split(sep)
    .map((h) => h.replace(/^[\\s"']+|[\\s"']+$/g, ""));

  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.replace(/^[\\s"']+|[\\s"']+$/g, ""));
    if (!cols.some((c) => c)) continue;
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "فایلی ارسال نشد." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "حجم فایل نباید بیشتر از ۱۰ مگابایت باشد." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name   = file.name.toLowerCase();
    let rows: Record<string, any>[] = [];
    let rawText = "";

    if (name.endsWith(".pdf")) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      rawText = data.text;
      rows = parseTextToRows(rawText);
    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mammoth = require("mammoth") as { extractRawText: (o: { buffer: Buffer }) => Promise<{ value: string }> };
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
      rows = parseTextToRows(rawText);
    } else {
      return NextResponse.json({ error: "فقط PDF یا Word (docx) پشتیبانی می‌شود." }, { status: 400 });
    }

    // اگر هیچ ردیفی پارس نشد، متن خام رو برمی‌گردونیم تا ادمین بدونه
    if (rows.length === 0) {
      return NextResponse.json({
        rows: [],
        count: 0,
        warning: "فایل پارس شد ولی ساختار جدولی تشخیص داده نشد. لطفاً فایل را به Excel/CSV تبدیل کنید.",
        rawPreview: rawText.slice(0, 500),
      });
    }

    return NextResponse.json({ rows, count: rows.length });
  } catch (err: any) {
    console.error("[parse-document]", err);
    return NextResponse.json(
      { error: "خطا در پردازش فایل: " + (err?.message || "خطای ناشناخته") },
      { status: 500 }
    );
  }
}
`;

/* ══════════════════════════════════════════════════════════
   فایل ۲: components/AdminProducts.tsx
   — اضافه کردن انتخاب نوع ارسال در مودال ایمپورت
   — پشتیبانی از PDF و Word در آپلود فایل
══════════════════════════════════════════════════════════ */

// خواندن فایل فعلی AdminProducts
const ADMIN_PRODUCTS_PATH = path.join(ROOT, "components", "AdminProducts.tsx");
let adminProd = fs.readFileSync(ADMIN_PRODUCTS_PATH, "utf8");

/* ۱. اضافه کردن state نوع ارسال override */
adminProd = adminProd.replace(
  `  const [importSkipExisting, setImportSkipExisting]   = useState<boolean>(false);`,
  `  const [importSkipExisting, setImportSkipExisting]   = useState<boolean>(false);
  const [importShippingOverride, setImportShippingOverride] = useState<"auto"|"post"|"tipax"|"both">("auto");`
);

/* ۲. به‌روزرسانی تابع handleDocumentUpload تا از PDF/Word هم پشتیبانی کنه */
adminProd = adminProd.replace(
  `  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setImportLogs(["⏳ در حال خواندن فایل..."]); setImportSummary(null);
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type:"array" });
      const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const mult = 1 + profitMargin/100;
      const parsed = (json as any[]).map(row => {`,
  `  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setImportLogs(["⏳ در حال خواندن فایل..."]); setImportSummary(null);
      const name = file.name.toLowerCase();
      let json: any[] = [];

      if (name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".doc")) {
        // ارسال به API سرور‌ساید برای پارس PDF / Word
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/admin/parse-document", { method: "POST", body: fd });
        const result = await res.json();
        if (!res.ok) { notify("❌ " + (result.error || "خطا در پارس فایل"), "error"); e.target.value = ""; return; }
        if (result.warning) { setImportLogs([result.warning]); }
        json = result.rows || [];
      } else {
        // XLSX / CSV — پارس کلاینت‌ساید
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type:"array" });
        json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      }

      const mult = 1 + profitMargin/100;
      const parsed = (json as any[]).map(row => {`
);

/* ۳. اعمال importShippingOverride روی ردیف‌های parse‌شده */
adminProd = adminProd.replace(
  `      const afterAvail = importOnlyAvailable ? parsed.filter((r:any) => r.stock > 0) : parsed;`,
  `      // اعمال override نوع ارسال اگر ادمین انتخاب کرده باشه
      const withShipping = importShippingOverride !== "auto"
        ? parsed.map((r:any) => ({ ...r, shipping_type: importShippingOverride }))
        : parsed;
      const afterAvail = importOnlyAvailable ? withShipping.filter((r:any) => r.stock > 0) : withShipping;`
);

/* ۴. به‌روزرسانی accept فایل برای اضافه کردن PDF و Word */
adminProd = adminProd.replace(
  `<input ref={docInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleDocumentUpload} />`,
  `<input ref={docInputRef} type="file" accept=".xlsx,.xls,.csv,.pdf,.doc,.docx" className="hidden" onChange={handleDocumentUpload} />`
);

/* ۵. به‌روزرسانی دکمه انتخاب فایل */
adminProd = adminProd.replace(
  `                  📁 انتخاب فایل (Excel/CSV)`,
  `                  📁 انتخاب فایل (Excel/CSV/PDF/Word)`
);

/* ۶. به‌روزرسانی راهنمای ستون‌ها */
adminProd = adminProd.replace(
  `<p className="mt-3 text-[10px] text-[var(--text-secondary)]">ستون‌های پشتیبانی‌شده: نام محصول · قیمت دراپ · دسته بندی · برند · کد محصول · Photo_Filename · Telegram_Description · موجودی · نوع ارسال</p>`,
  `<p className="mt-3 text-[10px] text-[var(--text-secondary)]">فرمت‌های پشتیبانی‌شده: Excel ، CSV ، PDF ، Word (docx) — ستون‌ها: نام محصول · قیمت دراپ · دسته بندی · برند · کد محصول · Photo_Filename · Telegram_Description · موجودی · نوع ارسال</p>`
);

/* ۷. اضافه کردن dropdown نوع ارسال بعد از grid تنظیمات و قبل از toggles */
adminProd = adminProd.replace(
  `                {/* toggle فقط موجود — کل ردیف کلیکپذیره */}`,
  `                {/* ══ انتخاب نوع ارسال برای همه محصولات ══ */}
                <div className="mb-5 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  <label className="block font-black text-xs mb-2 text-[var(--text-secondary)]">🚚 نوع ارسال (برای همه محصولات این فایل):</label>
                  <select
                    value={importShippingOverride}
                    onChange={e => setImportShippingOverride(e.target.value as any)}
                    className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none font-bold text-xs cursor-pointer"
                  >
                    <option value="auto">📋 خودکار — از ستون نوع ارسال فایل بخوان</option>
                    <option value="post">📮 پست — همه محصولات فقط پست</option>
                    <option value="tipax">🚚 تیپاکس (پس‌کرایه) — همه محصولات فقط تیپاکس</option>
                    <option value="both">📦 هر دو روش — مشتری انتخاب کند</option>
                  </select>
                  {importShippingOverride !== "auto" && (
                    <p className="mt-1.5 text-[10px] text-amber-500 font-bold">
                      ⚠️ این انتخاب، ستون نوع ارسال فایل را نادیده می‌گیرد و برای همه محصولات اعمال می‌شود.
                    </p>
                  )}
                </div>

                {/* toggle فقط موجود — کل ردیف کلیکپذیره */}`
);

fs.writeFileSync(ADMIN_PRODUCTS_PATH, adminProd, "utf8");
console.log("✅ AdminProducts.tsx به‌روز شد.");

/* ══════════════════════════════════════════════════════════
   فایل ۳: components/ProductPerspectiveSlider.tsx
   بهبود نمایش موبایل
══════════════════════════════════════════════════════════ */
const SLIDER_PATH = path.join(ROOT, "components", "ProductPerspectiveSlider.tsx");
let slider = fs.readFileSync(SLIDER_PATH, "utf8");

/* ۱. اضافه کردن auto-play و interval */
slider = slider.replace(
  `  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);`,
  `  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);`
);

/* ۲. اضافه کردن useEffect برای auto-advance */
slider = slider.replace(
  `  useEffect(() => {
    fetch("/api/theme-builder", { cache: "no-store" })`,
  `  // پیشروی خودکار هر ۴ ثانیه
  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      if (!isDragging) setCurrentIndex((p) => (p + 1) % products.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [products.length, isDragging]);

  useEffect(() => {
    fetch("/api/theme-builder", { cache: "no-store" })`
);

/* ۳. بهبود ارتفاع برای موبایل */
slider = slider.replace(
  `        className="relative w-full h-[520px] md:h-[450px] rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-2xl touch-pan-y select-none"`,
  `        className="relative w-full h-[400px] sm:h-[460px] md:h-[440px] rounded-[2rem] sm:rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-2xl touch-pan-y select-none"`
);

/* ۴. بهبود رویدادهای لمسی (نشانه‌گذاری isDragging) */
slider = slider.replace(
  `  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;

    // سوایپ نرم بدون پرش
    if (distance > 40) {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    } else if (distance < -40) {
      setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };`,
  `  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(0);
    setIsDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    setIsDragging(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    } else if (distance < -50) {
      setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    }
    setTouchStart(0);
    setTouchEnd(0);
  };`
);

/* ۵. بهبود لایه‌بندی داخلی آیتم برای موبایل */
slider = slider.replace(
  `              <div key={prod.id} className="min-w-full w-full h-full flex flex-col md:flex-row items-center justify-center p-6 pb-16 md:p-12 md:pb-12 gap-4 md:gap-12">

                {/* عکس محصول (دایره سیاه مخرب حذف شد) */}
                <div className="w-44 h-44 md:w-64 md:h-64 flex items-center justify-center shrink-0 pointer-events-none">
                  <img
                    src={toSafeImgUrl(prod.image_url || prod.image)}
                    className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                    alt={prod.title}
                    draggable={false}
                  />
                </div>

                {/* متون و دکمه */}
                <div className="flex flex-col items-center md:items-start text-center md:text-right space-y-3 md:space-y-4 w-full max-w-sm md:max-w-lg">
                  <div className="px-3 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-[11px] font-black">
                    {prod.category || "پیشنهاد ویژه"}
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] leading-tight line-clamp-2">
                    {prod.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {prod.short_description || prod.description || "پرفروش‌ترین تجهیزات تخصصی در آکسون کور"}
                  </p>

                  <div className="w-full pt-4 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                    <div className="text-lg sm:text-xl font-black text-emerald-500 font-mono">
                      {finalPrice.toLocaleString("fa-IR")} <span className="text-xs font-sans">تومان</span>
                    </div>
                    <Link
                      href={"/products/" + prod.id}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg hover:scale-105 transition-transform text-center pointer-events-auto"
                    >
                      مشاهده و خرید محصول ←
                    </Link>
                  </div>
                </div>`,
  `              <div key={prod.id} className="min-w-full w-full h-full flex flex-col md:flex-row items-center justify-center px-4 pt-4 pb-12 sm:px-6 sm:pt-6 sm:pb-14 md:p-12 gap-3 md:gap-12">

                {/* عکس محصول */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-64 md:h-64 flex items-center justify-center shrink-0 pointer-events-none">
                  <img
                    src={toSafeImgUrl(prod.image_url || prod.image)}
                    className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500"
                    alt={prod.title}
                    draggable={false}
                  />
                </div>

                {/* متون و دکمه */}
                <div className="flex flex-col items-center md:items-start text-center md:text-right space-y-2 md:space-y-4 w-full max-w-sm md:max-w-lg">
                  <div className="px-2.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-[10px] sm:text-[11px] font-black">
                    {prod.category || "پیشنهاد ویژه"}
                  </div>
                  <h2 className="text-base sm:text-xl md:text-3xl font-black text-[var(--text-primary)] leading-tight line-clamp-2">
                    {prod.title}
                  </h2>
                  <p className="hidden sm:block text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {prod.short_description || prod.description || ""}
                  </p>

                  <div className="w-full pt-3 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                    <div className="text-base sm:text-xl font-black text-emerald-500 font-mono">
                      {finalPrice.toLocaleString("fa-IR")} <span className="text-xs font-sans">تومان</span>
                    </div>
                    <Link
                      href={"/products/" + prod.id}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg hover:scale-105 transition-transform text-center pointer-events-auto"
                    >
                      مشاهده و خرید ←
                    </Link>
                  </div>
                </div>`
);

/* ۶. نقطه‌های ناوبری — تبدیل به دکمه‌های کلیکپذیر */
slider = slider.replace(
  `        {/* نقطه‌های ناوبری ساده و ایمن در پایین صفحه */}
        <div className="absolute bottom-5 left-0 right-0 z-30 flex items-center justify-center gap-2 pointer-events-none">
          {products.map((_, idx) => (
            <span
              key={idx}
              className={\`h-1.5 rounded-full transition-all duration-300 \${idx === currentIndex ? "w-6 bg-[var(--accent-blue)] shadow-md shadow-blue-500/50" : "w-1.5 bg-gray-400/40"}\`}
            />
          ))}
        </div>`,
  `        {/* نقطه‌های ناوبری — کلیکپذیر */}
        <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-2">
          {products.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={\`اسلاید \${idx + 1}\`}
              onClick={() => setCurrentIndex(idx)}
              className={\`h-1.5 rounded-full transition-all duration-300 focus:outline-none \${idx === currentIndex ? "w-6 bg-[var(--accent-blue)] shadow-md shadow-blue-500/50" : "w-1.5 bg-gray-400/40 hover:bg-gray-400/70"}\`}
            />
          ))}
        </div>`
);

fs.writeFileSync(SLIDER_PATH, slider, "utf8");
console.log("✅ ProductPerspectiveSlider.tsx به‌روز شد.");

/* ══════════════════════════════════════════════════════════
   فایل ۴: app/api/admin/parse-document/route.ts (جدید)
══════════════════════════════════════════════════════════ */
const PARSE_DOC_DIR = path.join(ROOT, "app", "api", "admin", "parse-document");
fs.mkdirSync(PARSE_DOC_DIR, { recursive: true });
fs.writeFileSync(path.join(PARSE_DOC_DIR, "route.ts"), PARSE_DOC_ROUTE, "utf8");
console.log("✅ app/api/admin/parse-document/route.ts ساخته شد.");

/* ══ بیلد ══ */
console.log("🔨 در حال بیلد پروژه...");
try {
  execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  console.log("✅ بیلد موفق!");
} catch (e) {
  console.error("❌ بیلد ناموفق بود. لطفاً خطا را بررسی کنید.");
  process.exit(1);
}

/* ══ Git ══ */
const ts = new Date().toISOString().replace("T", " ").slice(0, 16);
execSync(`git -C "${ROOT}" add -A`);
execSync(`git -C "${ROOT}" commit -m "feat(import): PDF/Word support + shipping override + mobile slider fix [${ts}]

- app/api/admin/parse-document/route.ts: parse PDF (pdf-parse) and Word (mammoth) server-side
- components/AdminProducts.tsx: shipping type override dropdown in import modal step 1; PDF/Word file support
- components/ProductPerspectiveSlider.tsx: better mobile layout (compact height/image), tappable nav dots, auto-advance

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe"`);
execSync(`git -C "${ROOT}" push origin main`);

console.log("🎉 fix6.js با موفقیت اجرا شد و به ریپو push شد.");