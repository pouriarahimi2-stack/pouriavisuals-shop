const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const globalsCssPath = path.join(__dirname, 'app/globals.css');

console.log('🚀 در حال اعمال قوانین اجباری CSS برای رفع قطعی مشکلات موبایل...');

const aggressiveMobileCss = `
/* =========================================
   AXON CORE - AGGRESSIVE MOBILE FIXES
   این قوانین تمام کش‌های مرورگر را نادیده می‌گیرند
   ========================================= */

@media (max-width: 768px) {
  /* 1. اجبار به دو ستونه شدن شبکه محصولات (گرید) در موبایل */
  .grid-cols-1,
  [class*="grid-cols-"],
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }

  /* 2. کوچک کردن کارت محصول برای جا شدن در دو ستون */
  .ProductCard_container,
  div[class*="product-card"],
  .aspect-square {
    width: 100% !important;
    max-width: 100% !important;
  }
  
  /* کوچک کردن متون کارت محصول در موبایل */
  div[class*="product-card"] h3,
  .ProductCard_container h3 {
    font-size: 11px !important;
    line-height: 1.4 !important;
  }
  
  div[class*="product-card"] .text-xs,
  div[class*="product-card"] .text-sm {
    font-size: 10px !important;
  }

  /* 3. حل مشکل لکه سیاه اسلایدرها (حذف دکمه‌های ناوبری پیش‌فرض در موبایل) */
  .swiper-button-next,
  .swiper-button-prev,
  .swiper-scrollbar,
  .slick-arrow,
  .slick-prev,
  .slick-next {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
  }

  /* 4. مخفی کردن منوی قدیمی و تکراری پایین صفحه */
  nav.fixed.bottom-0:not(.MobileBottomNav_container),
  div.fixed.bottom-0.bg-black,
  div.fixed.bottom-0.bg-\\[\\#1a1a1a\\] {
     display: none !important;
  }

  /* 5. بالا آوردن دکمه گفتگوی زنده (چت) برای جلوگیری از تداخل با دکمه خرید یا منوی پایین */
  #raychat_btn,
  .crisp-client,
  iframe[id^="raychat"],
  .chat-widget {
    bottom: 90px !important;
    z-index: 9999 !important;
  }

  /* 6. ایجاد فضای خالی در انتهای صفحات برای جلوگیری از افتادن محتوا زیر منوی موبایل */
  body, main, #axon-admin-shell {
    padding-bottom: 80px !important;
  }
}
`;

try {
  if (fs.existsSync(globalsCssPath)) {
    let css = fs.readFileSync(globalsCssPath, 'utf8');
    
    // پاک کردن نسخه قبلی اگر وجود داشت
    if (css.includes('AXON CORE - AGGRESSIVE MOBILE FIXES')) {
        css = css.replace(/\/\* =========================================\n   AXON CORE - AGGRESSIVE MOBILE FIXES[\s\S]*?\n}\n/g, '');
    }

    fs.writeFileSync(globalsCssPath, css + '\n' + aggressiveMobileCss, 'utf8');
    console.log('✅ استایل‌های اجباری موبایل با موفقیت به globals.css تزریق شد.');
  }

  console.log('🏗️ در حال اعتبارسنجی بیلد و پاکسازی کش...');
  
  // پاکسازی کش دایرکتوری .next
  const nextCacheDir = path.join(__dirname, '.next');
  if (fs.existsSync(nextCacheDir)) {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
    console.log('🗑️ پوشه .next برای حذف کامل کش پاک شد.');
  }

  execSync('npm run build', { stdio: 'inherit' });
  
  execSync('git add -A && git commit -m "fix(ui): apply aggressive !important css rules for mobile layout, fix slider artifacts and remove redundant nav" && git push origin main', { stdio: 'inherit' });
  
  console.log('🎉 عملیات با موفقیت پایان یافت!');
  console.log('⚠️ نکته بسیار مهم: حتماً سایت را در گوشی خود با حالت ناشناس (Incognito/Private Tab) باز کنید.');

} catch (error) {
  console.error('\n❌ خطای مجدد در بیلد:', error.message);
  process.exit(1);
}