// File Path: app/page.tsx
import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import ModularPageRenderer from "@/components/modular/ModularPageRenderer";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
import { productService } from "@/services/productService";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data: pageRecord } = await supabaseAdmin
    .from("modular_pages")
    .select("*")
    .eq("slug", "home")
    .maybeSingle();

  if (pageRecord && pageRecord.puck_data && pageRecord.puck_data.content?.length > 0) {
    return <ModularPageRenderer initialPage={pageRecord} slug="home" />;
  }

  const products = await productService.getAll();
  const sampleProduct = products[0] || {
    id: "prod-studio-display-5k",
    title: "Apple Studio Display 27 5K Retina",
    price: 128500000,
    category: "مانیتور استودیو"
  };

  return (
    <div className="w-full flex flex-col font-sans select-none text-[var(--text-primary)] space-y-12 md:space-y-16 overflow-x-hidden pb-12" dir="rtl">
      <Hero3DCanvas />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ProductPerspectiveSlider products={products} />
      </div>
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ProductList initialProducts={products} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ProductExplodedView
          productId={sampleProduct.id}
          productTitle={sampleProduct.title || "Apple Studio Display 5K"}
          category={sampleProduct.category}
          isOpen={false}
          onClose={() => {}}
        />
      </div>
    </div>
  );
}
