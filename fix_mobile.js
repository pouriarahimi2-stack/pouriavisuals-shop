const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 در حال اعمال قوانین اجباری CSS و پاکسازی کش فریم‌ورک...');

const globalsCssPath = path.join(__dirname, 'app/globals.css');
const nextCacheDir = path.join(__dirname, '.next');

const aggressiveMobileCss = `
/* =========================================
   AXON CORE - AGGRESSIVE MOBILE FIXES
   ========================================= */
@media (max-width: 768px) {
  /* اجبار به دو ستونه شدن شبکه محصولات */
  .grid, .grid-cols-1, .grid-cols-2, .sm\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
  div[class*="product-card"] h3 { font-size: 11px !important; line-height: 1.4 !important; }
  
  /* مخفی کردن لکه سیاه اسلایدرها در موبایل */
  .swiper-button-next, .swiper-button-prev, .swiper-scrollbar, .slick-arrow { display: none !important; opacity: 0 !important; visibility: hidden !important; }
  
  /* مخفی کردن منوی قدیمی پایین صفحه */
  nav.fixed.bottom-0:not(.MobileBottomNav_container), div.fixed.bottom-0.bg-black { display: none !important; }
  
  /* بالا بردن دکمه چت پشتیبانی */
  iframe[id^="raychat"], .crisp-client, #raychat_btn, .chat-widget { bottom: 90px !important; z-index: 9999 !important; }
  
  /* ایجاد فضای خالی برای فوتر */
  body, main { padding-bottom: 80px !important; }
}
`;

try {
  // تزریق CSS
  if (fs.existsSync(globalsCssPath)) {
    let css = fs.readFileSync(globalsCssPath, 'utf8');
    if (!css.includes('AGGRESSIVE MOBILE FIXES')) {
      fs.writeFileSync(globalsCssPath, css + '\n' + aggressiveMobileCss, 'utf8');
    }
  }

  // انهدام کش Next.js برای اعمال قطعی تغییرات
  if (fs.existsSync(nextCacheDir)) {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
    console.log('🗑️ پوشه کش .next با موفقیت پاکسازی شد.');
  }

  console.log('🏗️ در حال بیلد مجدد و استقرار...');
  execSync('npm run build', { stdio: 'inherit' });
  execSync('git add -A && git commit -m "fix(ui): apply absolute mobile CSS rules and wipe next cache" && git push origin main', { stdio: 'inherit' });
  
  console.log('🎉 مشکل موبایل برطرف شد! حالا سایت را در گوشی (حالت Incognito) چک کنید.');
} catch (err) {
  console.error('❌ خطا:', err.message);
}