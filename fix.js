/**
 * AXON CORE - Full Header & Footer Visual Control Integration (fix.js)
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

console.log("\x1b[36m[AXON-HEADER-FOOTER-BUILDER]\x1b[0m اتصال تمام اجزای هدر و فوتر به سیستم ویژوال...");

// =============================================================================
// ۱. افزودن GlobalHeaderBlock و GlobalFooterBlock به lib/puckConfig.tsx
// =============================================================================
const puckFile = path.join(process.cwd(), 'lib/puckConfig.tsx');
let puckCode = fs.readFileSync(puckFile, 'utf8');

const headerFooterBlocks = `
    // هدر سراسری با کنترل تک‌تک اجزا
    GlobalHeaderBlock: {
      label: "هدر سراسری سایت (Header)",
      fields: {
        brandTitle: { type: "text", label: "عنوان برند (Axon | آکسون)" },
        ctaText: { type: "text", label: "متن دکمه ورود به کاتالوگ" },
        ctaUrl: { type: "text", label: "لینک دکمه ورود به کاتالوگ" },
        link1Title: { type: "text", label: "عنوان منوی اول" },
        link1Url: { type: "text", label: "لینک منوی اول" },
        link2Title: { type: "text", label: "عنوان منوی دوم" },
        link2Url: { type: "text", label: "لینک منوی دوم" },
        link3Title: { type: "text", label: "عنوان منوی سوم" },
        link3Url: { type: "text", label: "لینک منوی سوم" },
        link4Title: { type: "text", label: "عنوان منوی چهارم" },
        link4Url: { type: "text", label: "لینک منوی چهارم" },
      },
      defaultProps: {
        brandTitle: "Axon | آکسون",
        ctaText: "کاتالوگ محصولات",
        ctaUrl: "/products",
        link1Title: "اخبار تکنولوژی",
        link1Url: "/news",
        link2Title: "مجله سئو",
        link2Url: "/blog",
        link3Title: "پیگیری سفارش",
        link3Url: "/track-order",
        link4Title: "تماس با ما",
        link4Url: "/contact",
      },
      render: ({ brandTitle, ctaText, ctaUrl, link1Title, link1Url, link2Title, link2Url, link3Title, link3Url, link4Title, link4Url }) => (
        <div className="w-full max-w-7xl mx-auto px-4 py-3 select-none" dir="rtl">
          <div className="p-3.5 px-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <span className="font-black text-sm text-sky-400">{brandTitle}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">مرجع تخصصی مانیتورهای ۵K</span>
            </div>
            <div className="hidden md:flex items-center gap-5 text-xs font-bold text-slate-300">
              <Link href={ctaUrl || "/products"} className="hover:text-white transition">{ctaText}</Link>
              <Link href={link1Url || "/news"} className="hover:text-white transition">{link1Title}</Link>
              <Link href={link2Url || "/blog"} className="hover:text-white transition">{link2Title}</Link>
              <Link href={link3Url || "/track-order"} className="hover:text-white transition">{link3Title}</Link>
              <Link href={link4Url || "/contact"} className="hover:text-white transition">{link4Title}</Link>
            </div>
            <Link href={ctaUrl || "/products"} className="px-4 py-1.5 rounded-full bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 transition">
              {ctaText}
            </Link>
          </div>
        </div>
      )
    },

    // فوتر سراسری با کنترل تک‌تک بخش‌ها
    GlobalFooterBlock: {
      label: "فوتر سراسری سایت (Footer)",
      fields: {
        brandName: { type: "text", label: "نام استودیو" },
        bioText: { type: "textarea", label: "متن معرفی فوتر" },
        supportPhone: { type: "text", label: "شماره تماس پشتیبانی" },
        email: { type: "text", label: "ایمیل پشتیبانی" },
        address: { type: "text", label: "آدرس و دفتر" },
        copyright: { type: "text", label: "متن کپی‌رایت انتهای فوتر" }
      },
      defaultProps: {
        brandName: "Axon | آکسون",
        bioText: "مرجع تخصصی تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ ۵K و تجهیزات تصویر با ۱۸ ماه گارانتی طلایی در ایران.",
        supportPhone: "09376110200",
        email: "Pouriarahimi@yahoo.com",
        address: "شیراز - ستارخان",
        copyright: "تمامی حقوق مادی و معنوی برای آکسون استودیو محفوظ است © 2026"
      },
      render: ({ brandName, bioText, supportPhone, email, address, copyright }) => (
        <footer className="w-full max-w-7xl mx-auto px-4 py-8 select-none text-white border-t border-white/10 mt-12" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 text-xs">
            <div className="space-y-3">
              <h3 className="font-black text-base text-sky-400">{brandName}</h3>
              <p className="text-slate-400 leading-relaxed">{bioText}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-200">اطلاعات تماس</h4>
              <p className="text-slate-400">تلفن: <span className="font-mono text-slate-200">{supportPhone}</span></p>
              <p className="text-slate-400">ایمیل: <span className="font-mono text-slate-200">{email}</span></p>
              <p className="text-slate-400">نشانی: <span className="text-slate-200">{address}</span></p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-200">دسترسی سریع</h4>
              <div className="flex flex-col gap-1.5 text-slate-400">
                <Link href="/products" className="hover:text-sky-400 transition">کاتالوگ کالاها</Link>
                <Link href="/news" className="hover:text-sky-400 transition">جدیدترین اخبار تکنولوژی</Link>
                <Link href="/track-order" className="hover:text-sky-400 transition">سامانه رهگیری مرسولات</Link>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 text-center text-[11px] text-slate-500 font-medium">
            {copyright}
          </div>
        </footer>
      )
    },
`;

if (!puckCode.includes('GlobalHeaderBlock')) {
  // اضافه کردن به دسته‌بندی
  puckCode = puckCode.replace(
    'site_core: {',
    `site_navigation: {\n      title: "🧭 ناوبری هدر و فوتر",\n      components: ["GlobalHeaderBlock", "GlobalFooterBlock"]\n    },\n    site_core: {`
  );
  puckCode = puckCode.replace(
    'components: {',
    `components: {${headerFooterBlocks}`
  );
  writeFile('lib/puckConfig.tsx', puckCode);
}

// =============================================================================
// ۲. تست بیلد کامل و استقرار ورسل
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
  execSync('git commit -m "feat(puck-nav-builder): add granular visual controls for Header & Footer navigation, links, contacts and branding"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ کنترل کامل هدر و فوتر با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}