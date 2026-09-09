/**
 * AXON CORE - Complete Restoration of Original Homepage & Safe Modular Builder (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ بازگردانی شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-RESTORE]\x1b[0m در حال بازگردانی کامل و ۱۰۰٪ طراحی صفحه اصلی اورجینال...");

// =============================================================================
// ۱. بازگردانی کامل و قطعی app/page.tsx به طراحی اورجینال و چشم‌نواز آکسون
// =============================================================================
const restoredHomePageCode = `import React from "react";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import TechRadarFeed from "@/components/TechRadarFeed";
import ProductExplodedView from "@/components/ProductExplodedView";
import ColorGamutSimulator from "@/components/ColorGamutSimulator";
import LiveMarketArbitrage from "@/components/LiveMarketArbitrage";
import { productService } from "@/services/productService";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await productService.getAll();
  const sampleProduct = products[0] || {
    id: "prod-studio-display-5k",
    title: "Apple Studio Display 27 5K Retina",
    price: 128500000,
    category: "مانیتور استودیو"
  };

  return (
    <div className="w-full flex flex-col font-sans select-none text-[var(--text-primary)] space-y-12 md:space-y-16 overflow-x-hidden" dir="rtl">
      {/* ۱. هیرو بنر سه‌بعدی و مدرن */}
      <Hero3DCanvas />

      {/* ۲. اسلایدر سه‌بعدی پرسپکتیو و بنرهای اصلی صفحه نخست */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ProductPerspectiveSlider />
      </div>

      {/* ۳. ویترین اصلی کاتالوگ محصولات با دسته‌بندی‌ها */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ProductList initialProducts={products} />
      </div>

      {/* ۴. کالبدشکافی سه‌بعدی سخت‌افزار (Exploded View) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ProductExplodedView productTitle={sampleProduct.title || "Apple Studio Display 5K"} />
      </div>

      {/* ۵. شبیه‌ساز پیشرفته گاموت رنگی و تفکیک بیش از ۱ میلیارد رنگ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ColorGamutSimulator productTitle={sampleProduct.title || "نمایشگر رتینا ۵K"} />
      </div>

      {/* ۶. پایش لحظه‌ای و تطبیق قیمت با ۵ پلتفرم بزرگ بازار */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <LiveMarketArbitrage productTitle={sampleProduct.title || "Apple Studio Display"} ourPrice={Number(sampleProduct.price || 128500000)} />
      </div>

      {/* ۷. رادار زنده اخبار تکنولوژی و سخت‌افزار */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
        <TechRadarFeed />
      </div>
    </div>
  );
}
`;
writeFile('app/page.tsx', restoredHomePageCode);

// =============================================================================
// ۲. غیرفعال‌سازی اسکریپت seedHomePage.ts تا صفحه اصلی را دستکاری نکند
// =============================================================================
const dummySeedCode = `export async function seedHomePageIfMissing() {
  // صفحه اصلی سایت از موتور اورجینال و طراحی پیش‌فرض با کالبدشکافی ۳D و اسلایدر تغذیه می‌کند
  return;
}
`;
writeFile('lib/seedHomePage.ts', dummySeedCode);

// =============================================================================
// ۳. تست بیلد نهایی پروژه و ارسال قطعی به گیت‌هاب و ورسل
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "revert(homepage): restore 100% original homepage layout, 3D hero canvas, exploded view and eliminate duplicate headers/footers"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ صفحه اصلی اصلی با موفقیت کامل بازگردانی شد و ورسل در حال دیپلوی است!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}