/**
 * AXON CORE - Clean Up Homepage & Streamline Modular Sections (fix.js)
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

console.log("\x1b[36m[AXON-LAYOUT-CLEANUP]\x1b[0m حذف شبیه‌ساز رنگ، مقایسه قیمت و فید اخبار از صفحه نخست...");

// =============================================================================
// بازنویسی تمیز و بهینه app/page.tsx
// =============================================================================
const cleanHomePageCode = `import React from "react";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
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
    <div className="w-full flex flex-col font-sans select-none text-[var(--text-primary)] space-y-12 md:space-y-16 overflow-x-hidden pb-12" dir="rtl">
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
    </div>
  );
}
`;
writeFile('app/page.tsx', cleanHomePageCode);

// =============================================================================
// تست بیلد و ارسال قطعی به گیت‌هاب و ورسل
// =============================================================================
console.log("تست بیلد کامل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "refactor(home): remove color gamut simulator, price arbitrage and news feed from homepage into product detail scope"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ صفحه اصلی سبک‌سازی و بازآرایی شد و ورسل در حال دیپلوی است!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}