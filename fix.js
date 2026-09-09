/**
 * AXON CORE - 1:1 Pixel-Perfect Native Header & Footer in Puck Canvas (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-HEADER-FOOTER-EXACT]\x1b[0m بازنویسی هدر و فوتر درون بوم منطبق با طراحی اختصاصی سایت...");

// =============================================================================
// بازنویسی بلوک‌های GlobalHeaderBlock و GlobalFooterBlock در lib/puckConfig.tsx
// =============================================================================
const puckFile = path.join(process.cwd(), 'lib/puckConfig.tsx');
let puckSource = fs.readFileSync(puckFile, 'utf8');

const exactHeaderAndFooterCode = `
    // هدر کپسولی شیشه‌ای کاملاً منطبق بر عکس ارسالی
    GlobalHeaderBlock: {
      label: "هدر کپسولی شیشه‌ای سراسری (Header)",
      fields: {
        brandName: { type: "text", label: "عنوان برند (Axon | آکسون)" },
        link1Text: { type: "text", label: "منو ۱: کاتالوگ محصولات" },
        link1Url: { type: "text", label: "لینک منو ۱" },
        link2Text: { type: "text", label: "منو ۲: اخبار تکنولوژی" },
        link2Url: { type: "text", label: "لینک منو ۲" },
        link3Text: { type: "text", label: "منو ۳: مجله سئو" },
        link3Url: { type: "text", label: "لینک منو ۳" },
        link4Text: { type: "text", label: "منو ۴: پیگیری سفارش" },
        link4Url: { type: "text", label: "لینک منو ۴" },
        link5Text: { type: "text", label: "منو ۵: تماس با ما" },
        link5Url: { type: "text", label: "لینک منو ۵" },
      },
      defaultProps: {
        brandName: "Axon | آکسون",
        link1Text: "کاتالوگ محصولات",
        link1Url: "/products",
        link2Text: "اخبار تکنولوژی",
        link2Url: "/news",
        link3Text: "مجله سئو",
        link3Url: "/blog",
        link4Text: "پیگیری سفارش",
        link4Url: "/track-order",
        link5Text: "تماس با ما",
        link5Url: "/contact",
      },
      render: ({ brandName, link1Text, link1Url, link2Text, link2Url, link3Text, link3Url, link4Text, link4Url, link5Text, link5Url }) => (
        <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 my-2 select-none font-sans" dir="rtl">
          <div className="flex items-center justify-between px-6 py-3 rounded-full bg-[var(--modal-bg,#ffffff)]/80 dark:bg-[#07090e]/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-xl transition-all">
            
            {/* سمت چپ: آیکون‌های سبد خرید، تم شب و پروفایل */}
            <div className="flex items-center gap-2">
              <Link href="/cart" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition">
                🛒
              </Link>
              <button type="button" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition">
                🌙
              </button>
              <Link href="/login" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition">
                👤
              </Link>
            </div>

            {/* بخش میانی: لینک‌های ناوبری اصلی */}
            <nav className="hidden lg:flex items-center gap-8 text-xs font-black text-slate-700 dark:text-slate-300">
              <Link href={link5Url || "/contact"} className="hover:text-sky-500 transition">{link5Text}</Link>
              <Link href={link4Url || "/track-order"} className="hover:text-sky-500 transition">{link4Text}</Link>
              <Link href={link3Url || "/blog"} className="hover:text-sky-500 transition">{link3Text}</Link>
              <Link href={link2Url || "/news"} className="hover:text-sky-500 transition">{link2Text}</Link>
              <Link href={link1Url || "/products"} className="hover:text-sky-500 transition">{link1Text}</Link>
            </nav>

            {/* سمت راست: نام و نشان اختصاصی برند آکسون */}
            <Link href="/" className="flex items-center gap-3 group">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                {brandName}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs">
                ▲
              </div>
            </Link>

          </div>
        </header>
      )
    },

    // فوتر ۴ ستونه مهندسی دقیقاً منطبق بر عکس ارسالی
    GlobalFooterBlock: {
      label: "فوتر ۴ ستونه کامل و سازمانی (Footer)",
      fields: {
        brandTitle: { type: "text", label: "تیتر برند در فوتر" },
        brandSubtitle: { type: "text", label: "زیرعنوان برند" },
        brandDesc: { type: "textarea", label: "متن معرفی گارانتی و استاندارد" },
        supportPhone: { type: "text", label: "شماره پشتیبانی" },
        supportEmail: { type: "text", label: "پست الکترونیک" },
        warehouseAddress: { type: "text", label: "نشانی انبار و تحویل" },
        workingHours: { type: "text", label: "ساعات پاسخگویی" },
        enamadCode: { type: "text", label: "کد رسمی نماد اعتماد (اینماد)" },
        copyrightText: { type: "text", label: "متن کپی‌رایت پایین فوتر" }
      },
      defaultProps: {
        brandTitle: "Axon | آکسون",
        brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
        brandDesc: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
        supportPhone: "09376110200",
        supportEmail: "Pouriarahimi@yahoo.com",
        warehouseAddress: "شیراز - ستارخان",
        workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: "27424534",
        copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026"
      },
      render: ({ brandTitle, brandSubtitle, brandDesc, supportPhone, supportEmail, warehouseAddress, workingHours, enamadCode, copyrightText }) => (
        <footer className="w-full bg-[var(--modal-bg,#ffffff)] dark:bg-[#07090e] border-t border-slate-200 dark:border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none mt-16" dir="rtl">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* گرید ۴ ستونه اصلی فوتر */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
              
              {/* ستون ۱ (راست): معرفی برند، بج‌ها و کلیدهای کیبورد CONTACT */}
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs">
                      ▲
                    </div>
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white">{brandTitle}</h3>
                  </div>
                  <p className="text-xs font-bold text-sky-500">{brandSubtitle}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">{brandDesc}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black flex items-center gap-1.5">
                    <span>✓</span> گارانتی اصالت ۱۰۰٪ فیزیکی
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-black flex items-center gap-1.5">
                    <span>🚀</span> ارسال پیشتاز سراسری
                  </span>
                </div>

                {/* کلیدهای ۳D تعاملی CONTACT */}
                <div className="pt-3 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> شبکه‌های ارتباطی و اجتماعی استودیو:
                  </span>
                  <div className="p-3 rounded-3xl bg-slate-900 text-white flex items-center justify-center gap-2 shadow-2xl" dir="ltr">
                    {["C", "O", "N", "T", "A", "C", "T"].map((k, i) => (
                      <div key={i} className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-black text-xs shadow-inner hover:scale-110 hover:border-sky-400 transition cursor-pointer">
                        {k}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-center text-slate-400">برای مشاهده امکانات، ماوس را روی کلیدها ببرید یا کلیک کنید</p>
                </div>
              </div>

              {/* ستون ۲: دسترسی سریع */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> دسترسی سریع
                </h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <li><Link href="/products" className="hover:text-sky-500 transition">کاتالوگ کالاها</Link></li>
                  <li><Link href="/track-order" className="hover:text-sky-500 transition">سامانه رهگیری مرسولات</Link></li>
                  <li><Link href="/news" className="hover:text-sky-500 transition">جدیدترین اخبار تکنولوژی</Link></li>
                  <li><Link href="/blog" className="hover:text-sky-500 transition">مجله مقالات تخصصی</Link></li>
                  <li><Link href="/about" className="hover:text-sky-500 transition">درباره آکسون</Link></li>
                </ul>
              </div>

              {/* ستون ۳: خدمات مشتریان */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> خدمات مشتریان
                </h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <li><Link href="/contact" className="hover:text-sky-500 transition">ثبت تیکت مشاوره</Link></li>
                  <li><Link href="/about" className="hover:text-sky-500 transition">شرایط گارانتی طلایی</Link></li>
                  <li><Link href="/about" className="hover:text-sky-500 transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
                  <li><Link href="/blog" className="hover:text-sky-500 transition">راهنمای کالیبراسیون ۵K</Link></li>
                  <li><Link href="/about" className="hover:text-sky-500 transition">روش‌های پرداخت امن شاپرک</Link></li>
                </ul>
              </div>

              {/* ستون ۴ (چپ): کارت‌های اطلاعات تماس و اینماد رسمی */}
              <div className="lg:col-span-4 space-y-4">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> اطلاعات تماس و دفتر
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">تلفن پشتیبانی:</span>
                      <span className="font-mono font-black text-slate-800 dark:text-slate-200">{supportPhone}</span>
                    </div>
                    <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 text-sm">📞</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">پست الکترونیک:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">{supportEmail}</span>
                    </div>
                    <span className="p-2 rounded-xl bg-sky-500/10 text-sky-500 text-sm">✉️</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">نشانی تحویل حضوری و انبار:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{warehouseAddress}</span>
                    </div>
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 text-sm">📍</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">ساعات پاسخگویی:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{workingHours}</span>
                    </div>
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 text-sm">⏰</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">نماد اعتماد الکترونیکی</span>
                      <span className="text-[10px] text-slate-400 block">کد رسمی: <strong className="font-mono text-sky-500">{enamadCode}</strong></span>
                    </div>
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm">🛡️</span>
                  </div>
                </div>
              </div>

            </div>

            {/* نوار پایانی کپی‌رایت و وضعیت اینماد */}
            <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>نماد اعتماد الکترونیکی فعال ({enamadCode})</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-400">طراحی و معماری مهندسی پایدار</span>
              </div>
              <p className="text-center sm:text-left text-[11px]">
                {copyrightText}
              </p>
            </div>

          </div>
        </footer>
      )
    },
`;

// جایگزینی تمیز کدهای هدر و فوتر در puckConfig
if (puckSource.includes('GlobalHeaderBlock:')) {
  puckSource = puckSource.replace(/GlobalHeaderBlock:[\s\S]*?render:[\s\S]*?}\s*\),/g, '');
  puckSource = puckSource.replace(/GlobalFooterBlock:[\s\S]*?render:[\s\S]*?}\s*\),/g, '');
}

puckSource = puckSource.replace('components: {', `components: {${exactHeaderAndFooterCode}`);
writeFile('lib/puckConfig.tsx', puckSource);

// =============================================================================
// بیلد و ارسال قطعی به گیت‌هاب و استقرار ورسل
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(puck-header-footer): 1:1 visual match for capsule header and 4-column engineering footer inside canvas"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ هدر و فوتر دقیق سایت با موفقیت در صفحه ساز مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}