import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  // داده‌های نمونه محصول (بعداً از دیتابیس خوانده می‌شوند)
  const product = {
    id: id,
    title: "آیفون ۱۵ پرو مکس",
    subtitle: "طراحی تیتانیومی. تراشه A17 Pro. دکمه اکشن.",
    price: "۶۵,۰۰۰,۰۰۰",
    category: "موبایل",
    image: "📱",
    specs: [
      "بدنه تیتانیومی سبک و مقاوم",
      "نمایشگر Super Retina XDR با پروموشن",
      "دوربین اصلی ۴۸ مگاپیکسلی با زوم ۵ برابری",
      "پورت USB-C با سرعت انتقال بالا",
    ],
  };

  return (
    <main className="min-h-screen flex flex-col justify-between">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* مسیر بالای صفحه (Breadcrumb) */}
        <nav className="text-xs text-[var(--text-secondary)] mb-8 flex gap-2">
          <Link href="/" className="hover:text-[var(--text-primary)]">خانه</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[var(--text-primary)]">محصولات</Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-medium">{product.title}</span>
        </nav>

        {/* گرید ۲ ستونه: سمت راست عکس، سمت چپ اطلاعات */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* ستون عکس محصول به سبک اپل */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-16 flex items-center justify-center text-9xl shadow-sm">
            {product.image}
          </div>

          {/* ستون جزئیات و خرید */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold text-[var(--accent-blue)] uppercase tracking-wider">
                {product.category}
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 text-[var(--text-primary)]">
                {product.title}
              </h1>
              <p className="text-base text-[var(--text-secondary)] mt-2">
                {product.subtitle}
              </p>
            </div>

            {/* قیمت */}
            <div className="border-t border-b border-[var(--border-color)] py-4 flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">قیمت مصرف‌کننده:</span>
              <span className="text-2xl font-extrabold text-[var(--text-primary)]">
                {product.price} <span className="text-sm font-normal text-[var(--text-secondary)]">تومان</span>
              </span>
            </div>

            {/* مشخصات اصلی */}
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">ویژگی‌های کلیدی:</h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                {product.specs.map((spec, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-[var(--accent-blue)]">✓</span>
                    {spec}
                  </li>
                ))}
              </ul>
            </div>

            {/* دکمه‌های اقدام (Call to Action) */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button className="flex-1 bg-[var(--accent-blue)] text-white py-4 rounded-full font-bold hover:opacity-90 transition shadow-lg text-center">
                افزودن به سبد خرید
              </button>
              <button className="px-6 py-4 rounded-full border border-[var(--border-color)] font-medium hover:bg-[var(--card-bg)] transition text-center">
                اشتراک‌گذاری
              </button>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}