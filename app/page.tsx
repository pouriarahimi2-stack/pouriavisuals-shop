import React from "react";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
import { productService } from "@/services/productService";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialProducts: any[] = [];
  let pageContent: any = null;

  try {
    initialProducts = await productService.getAll();
  } catch {
    initialProducts = [];
  }

  try {
    const { data } = await supabaseAdmin
      .from("modular_pages")
      .select("*")
      .eq("slug", "home")
      .maybeSingle();

    if (data && data.puck_data) {
      pageContent = data.puck_data;
    }
  } catch {}

  return (
    <div className="w-full flex flex-col min-h-screen font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* هیرو ۳D اصلی */}
      <section className="w-full relative overflow-hidden py-8 text-center" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-4 px-4 relative z-10">
          <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-black inline-block">
            🚀 مرجع تخصصی مانیتورهای ۵K استودیو
          </span>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight text-white">
            دیدن واقعیت رنگ‌ها بدون مصالحه و خطا
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.
          </p>
        </div>
        <div className="w-full h-[450px] relative overflow-hidden mt-4">
          <Hero3DCanvas />
        </div>
      </section>

      {/* اسلایدر پرسپکتیو */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
        <ProductPerspectiveSlider />
      </div>

      {/* کاتالوگ محصولات */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-black">کاتالوگ تجهیزات تخصصی و مانیتورها</h2>
          <p className="text-xs text-slate-400">تمامی کالاها با گارانتی اصالت طلایی و تست سلامت فیزیکی عرضه می‌شوند</p>
        </div>
        <ProductList initialProducts={initialProducts || []} />
      </div>

      {/* کالبدشکافی ۳D سخت‌افزار */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
        <ProductExplodedView productTitle="Apple Studio Display 5K Retina" />
      </div>
    </div>
  );
}
