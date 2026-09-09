import React from "react";
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
