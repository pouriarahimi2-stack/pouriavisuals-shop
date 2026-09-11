/**
 * AXON CORE - Fix Complete Persistence (No Reset on Refresh) + Visual Color Picker (fix.js)
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

console.log("\x1b[36m[AXON-PERSISTENCE-FIX]\x1b[0m ۱. تضمین ذخیره و بازخوانی دائمی دیتابیس بدون بازگشت به پیش‌فرض...");
console.log("\x1b[36m[AXON-PERSISTENCE-FIX]\x1b[0m ۲. افزودن انتخابگر رنگ بصری (Color Picker) برای پس‌زمینه و کادر...");

// =============================================================================
// ۱. اصلاح app/api/pages/route.ts برای تضمین تقدم دیتابیس بر SYSTEM_PAGES
// =============================================================================
const pagesApiContent = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const cleanSlug = String(slug).trim().toLowerCase();
      // تقدم ۱۰۰٪ واکشی از دیتابیس Supabase
      const { data, error } = await supabaseAdmin
        .from("modular_pages")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (data && data.puck_data) {
        return NextResponse.json({ success: true, page: data });
      }

      // فال‌بک لوکال در صورت نبود رکورد دیتابیس
      return NextResponse.json({
        success: true,
        page: { slug: cleanSlug, title: cleanSlug === "home" ? "صفحه اصلی" : cleanSlug, puck_data: null }
      });
    }

    const { data: allPages } = await supabaseAdmin
      .from("modular_pages")
      .select("id, slug, title, is_published, updated_at")
      .order("updated_at", { ascending: false });

    return NextResponse.json({ success: true, pages: allPages || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { slug, title, puck_data, is_published } = body;
    const cleanSlug = String(slug || "home").trim().toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from("modular_pages")
      .select("id")
      .eq("slug", cleanSlug)
      .maybeSingle();

    const payload: any = {
      slug: cleanSlug,
      title: String(title || cleanSlug).trim(),
      puck_data: puck_data || {},
      is_published: is_published !== false,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error: updErr } = await supabaseAdmin
        .from("modular_pages")
        .update(payload)
        .eq("id", existing.id);
      if (updErr) throw updErr;
    } else {
      payload.created_at = new Date().toISOString();
      const { error: insErr } = await supabaseAdmin
        .from("modular_pages")
        .insert([payload]);
      if (insErr) throw insErr;
    }

    return NextResponse.json({ success: true, message: "صفحه با موفقیت در دیتابیس ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/pages/route.ts', pagesApiContent);

// =============================================================================
// ۲. به‌روزرسانی lib/puckConfig.tsx با فیلد انتخابگر رنگ بصری (Color Picker)
// =============================================================================
const puckConfigContent = `import React, { useState, useEffect } from "react";
import type { Config } from "@measured/puck";
import Link from "next/link";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import ProductExplodedView from "@/components/ProductExplodedView";
import { productService, Product } from "@/services/productService";

// کامپوننت فیلد اختصاصی انتخابگر رنگ
const ColorPickerCustomField = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl" dir="ltr">
      <input
        type="color"
        value={value && value.startsWith("#") ? value : "#07090e"}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer p-0 shrink-0"
      />
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#07090e یا rgba(...)"
        className="w-full bg-transparent text-xs font-mono text-white outline-none px-2 text-right"
      />
    </div>
  );
};

export type ComponentProps = {
  HeaderCapsuleBar: {
    brandText: string;
    logoUrl: string;
    logoWidth: number;
    logoHeight: number;
    menu1Text: string;
    menu1Url: string;
    menu2Text: string;
    menu2Url: string;
    menu3Text: string;
    menu3Url: string;
    menu4Text: string;
    menu4Url: string;
    menu5Text: string;
    menu5Url: string;
    showCart: boolean;
    showTheme: boolean;
    showUser: boolean;
    capsuleBg: string;
    capsuleBorder: string;
  };
  NativeHero3D: {
    topBadge: string;
    badgeColor: string;
    title: string;
    titleSize: number;
    subtitle: string;
    bgColor: string;
  };
  NativePerspectiveSlider: {
    sectionTitle: string;
    sectionSubtitle: string;
  };
  NativeProductCatalog: {
    heading: string;
    subtitle: string;
    limit: number;
  };
  NativeExplodedView: {
    productTitle: string;
    sectionTitle: string;
  };
  GlobalFooterBlock: {
    footerLogoUrl: string;
    brandTitle: string;
    brandSubtitle: string;
    brandDesc: string;
    supportPhone: string;
    supportEmail: string;
    warehouseAddress: string;
    workingHours: string;
    enamadCode: string;
    copyrightText: string;
    footerBg: string;
  };
};

function PuckProductListWrapper({ limit }: { limit?: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    productService.getAll().then((data) => {
      if (data) setProducts(limit ? data.slice(0, limit) : data);
    });
  }, [limit]);
  return <ProductList initialProducts={products} />;
}

export const puckConfig: Config<ComponentProps> = {
  categories: {
    navigation: {
      title: "🧭 ناوبری هدر و فوتر",
      components: ["HeaderCapsuleBar", "GlobalFooterBlock"]
    },
    sections: {
      title: "⭐ بدنه صفحه و کاتالوگ",
      components: ["NativeHero3D", "NativePerspectiveSlider", "NativeProductCatalog", "NativeExplodedView"]
    }
  },
  components: {
    HeaderCapsuleBar: {
      label: "هدر کپسولی (کنترل تمام منوها، لوگو و انتخاب رنگ)",
      fields: {
        brandText: { type: "text", label: "نام برند" },
        logoUrl: { type: "text", label: "آدرس تصویر لوگو (URL)" },
        logoWidth: { type: "number", label: "عرض لوگو (px)" },
        logoHeight: { type: "number", label: "ارتفاع لوگو (px)" },
        menu1Text: { type: "text", label: "منو ۱: عنوان" },
        menu1Url: { type: "text", label: "منو ۱: لینک" },
        menu2Text: { type: "text", label: "منو ۲: عنوان" },
        menu2Url: { type: "text", label: "منو ۲: لینک" },
        menu3Text: { type: "text", label: "منو ۳: عنوان" },
        menu3Url: { type: "text", label: "منو ۳: لینک" },
        menu4Text: { type: "text", label: "منو ۴: عنوان" },
        menu4Url: { type: "text", label: "منو ۴: لینک" },
        menu5Text: { type: "text", label: "منو ۵: عنوان" },
        menu5Url: { type: "text", label: "منو ۵: لینک" },
        showCart: {
          type: "radio",
          label: "آیکون سبد خرید",
          options: [{ label: "فعال", value: true }, { label: "غیرفعال", value: false }]
        },
        showTheme: {
          type: "radio",
          label: "آیکون تغییر تم",
          options: [{ label: "فعال", value: true }, { label: "غیرفعال", value: false }]
        },
        showUser: {
          type: "radio",
          label: "آیکون پروفایل",
          options: [{ label: "فعال", value: true }, { label: "غیرفعال", value: false }]
        },
        capsuleBg: {
          type: "custom",
          label: "رنگ پس‌زمینه کپسول (پالت رنگ)",
          render: ({ value, onChange }) => <ColorPickerCustomField value={value} onChange={onChange} />
        },
        capsuleBorder: {
          type: "custom",
          label: "رنگ خط دور کپسول (پالت رنگ)",
          render: ({ value, onChange }) => <ColorPickerCustomField value={value} onChange={onChange} />
        }
      },
      defaultProps: {
        brandText: "Axon | آکسون",
        logoUrl: "",
        logoWidth: 36,
        logoHeight: 36,
        menu1Text: "کاتالوگ محصولات",
        menu1Url: "/products",
        menu2Text: "اخبار تکنولوژی",
        menu2Url: "/news",
        menu3Text: "مجله سئو",
        menu3Url: "/blog",
        menu4Text: "پیگیری سفارش",
        menu4Url: "/track-order",
        menu5Text: "تماس با ما",
        menu5Url: "/contact",
        showCart: true,
        showTheme: true,
        showUser: true,
        capsuleBg: "#07090e",
        capsuleBorder: "#27272a"
      },
      render: ({
        brandText, logoUrl, logoWidth, logoHeight,
        menu1Text, menu1Url, menu2Text, menu2Url, menu3Text, menu3Url, menu4Text, menu4Url, menu5Text, menu5Url,
        showCart, showTheme, showUser, capsuleBg, capsuleBorder
      }) => {
        const w = Number(logoWidth) || 36;
        const h = Number(logoHeight) || 36;
        return (
          <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 my-2 select-none font-sans" dir="ltr">
            <div
              style={{ backgroundColor: capsuleBg || "#07090e", borderColor: capsuleBorder || "#27272a" }}
              className="flex items-center justify-between px-6 py-3 rounded-full border backdrop-blur-2xl shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center gap-2 order-1">
                {showCart && <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">🛒</span>}
                {showTheme && <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">🌙</span>}
                {showUser && <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">👤</span>}
              </div>

              <nav className="hidden lg:flex items-center gap-7 text-xs font-black text-slate-300 order-2" dir="rtl">
                {menu1Text && <Link href={menu1Url || "/products"} className="hover:text-sky-400 transition">{menu1Text}</Link>}
                {menu2Text && <Link href={menu2Url || "/news"} className="hover:text-sky-400 transition">{menu2Text}</Link>}
                {menu3Text && <Link href={menu3Url || "/blog"} className="hover:text-sky-400 transition">{menu3Text}</Link>}
                {menu4Text && <Link href={menu4Url || "/track-order"} className="hover:text-sky-400 transition">{menu4Text}</Link>}
                {menu5Text && <Link href={menu5Url || "/contact"} className="hover:text-sky-400 transition">{menu5Text}</Link>}
              </nav>

              <div className="flex items-center gap-3 order-3" dir="rtl">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">{brandText || "Axon | آکسون"}</span>
                <div
                  style={{ width: w + "px", height: h + "px" }}
                  className="rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shadow-md p-1 shrink-0 transition-all duration-300"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                      ▲
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        );
      }
    },

    NativeHero3D: {
      label: "هیرو ۳D اصلی سایت",
      fields: {
        topBadge: { type: "text", label: "متن برچسب بالا" },
        badgeColor: { type: "text", label: "رنگ برچسب" },
        title: { type: "text", label: "تیتر اصلی هیرو" },
        titleSize: { type: "number", label: "اندازه تیتر اصلی (px)" },
        subtitle: { type: "textarea", label: "متن توضیحات زیرعنوان" },
        bgColor: { type: "text", label: "رنگ پس‌زمینه" }
      },
      defaultProps: {
        topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        badgeColor: "#38bdf8",
        title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
        titleSize: 42,
        subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
        bgColor: "transparent"
      },
      render: ({ topBadge, badgeColor, title, titleSize, subtitle, bgColor }) => (
        <section style={{ backgroundColor: bgColor || "transparent" }} className="w-full relative overflow-hidden select-none font-sans text-white text-center py-6" dir="rtl">
          <div className="max-w-4xl mx-auto space-y-4 px-4 relative z-10">
            {topBadge && (
              <span style={{ color: badgeColor || "#38bdf8" }} className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-black inline-block">
                {topBadge}
              </span>
            )}
            <h1 style={{ fontSize: (titleSize || 42) + "px" }} className="font-black leading-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <div className="w-full h-[480px] relative overflow-hidden mt-4">
            <Hero3DCanvas />
          </div>
        </section>
      )
    },

    NativePerspectiveSlider: {
      label: "اسلایدر پرسپکتیو بنرها",
      fields: {
        sectionTitle: { type: "text", label: "تیتر بخش" },
        sectionSubtitle: { type: "text", label: "زیرعنوان بخش" }
      },
      defaultProps: {
        sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
        sectionSubtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی"
      },
      render: ({ sectionTitle, sectionSubtitle }) => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none py-4" dir="rtl">
          <ProductPerspectiveSlider customTitle={sectionTitle} customSubtitle={sectionSubtitle} />
        </div>
      )
    },

    NativeProductCatalog: {
      label: "کاتالوگ اصلی محصولات",
      fields: {
        heading: { type: "text", label: "عنوان کاتالوگ" },
        subtitle: { type: "text", label: "زیرعنوان کاتالوگ" },
        limit: { type: "number", label: "حداکثر تعداد کالا" }
      },
      defaultProps: {
        heading: "کاتالوگ تجهیزات تخصصی و مانیتورها",
        subtitle: "تمامی کالاها با گارانتی اصالت طلایی عرضه می‌شوند",
        limit: 8
      },
      render: ({ limit }) => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none py-4" dir="rtl">
          <PuckProductListWrapper limit={limit} />
        </div>
      )
    },

    NativeExplodedView: {
      label: "کالبدشکافی ۳D سخت‌افزار",
      fields: {
        productTitle: { type: "text", label: "نام محصول مدل ۳D" },
        sectionTitle: { type: "text", label: "تیتر بخش" }
      },
      defaultProps: {
        productTitle: "Apple Studio Display 5K Retina",
        sectionTitle: "کالبدشکافی لایه‌های سخت‌افزاری"
      },
      render: ({ productTitle }) => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none py-4" dir="rtl">
          <ProductExplodedView productTitle={productTitle || "Apple Studio Display 5K"} />
        </div>
      )
    },

    GlobalFooterBlock: {
      label: "فوتر ۴ ستونه کامل و سازمانی",
      fields: {
        footerLogoUrl: { type: "text", label: "آدرس تصویر لوگوی فوتر (URL)" },
        brandTitle: { type: "text", label: "تیتر برند در فوتر" },
        brandSubtitle: { type: "text", label: "زیرعنوان برند" },
        brandDesc: { type: "textarea", label: "متن معرفی گارانتی" },
        supportPhone: { type: "text", label: "شماره تلفن پشتیبانی" },
        supportEmail: { type: "text", label: "پست الکترونیک" },
        warehouseAddress: { type: "text", label: "نشانی انبار" },
        workingHours: { type: "text", label: "ساعات پاسخگویی" },
        enamadCode: { type: "text", label: "کد اینماد" },
        copyrightText: { type: "text", label: "متن کپی‌رایت" },
        footerBg: {
          type: "custom",
          label: "رنگ پس‌زمینه فوتر (پالت رنگ)",
          render: ({ value, onChange }) => <ColorPickerCustomField value={value} onChange={onChange} />
        }
      },
      defaultProps: {
        footerLogoUrl: "",
        brandTitle: "Axon | آکسون",
        brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
        brandDesc: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
        supportPhone: "09376110200",
        supportEmail: "Pouriarahimi@yahoo.com",
        warehouseAddress: "شیراز - ستارخان",
        workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: "27424534",
        copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
        footerBg: "#07090e"
      },
      render: ({ footerLogoUrl, brandTitle, brandSubtitle, brandDesc, supportPhone, supportEmail, warehouseAddress, workingHours, enamadCode, copyrightText, footerBg }) => (
        <footer style={{ backgroundColor: footerBg || "#07090e" }} className="w-full border-t border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none text-white mt-16" dir="rtl">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shadow-md p-1 shrink-0">
                      {footerLogoUrl ? (
                        <img src={footerLogoUrl} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                          ▲
                        </div>
                      )}
                    </div>
                    <h3 className="font-black text-2xl text-white">{brandTitle}</h3>
                  </div>
                  <p className="text-xs font-bold text-sky-400">{brandSubtitle}</p>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">{brandDesc}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black">
                    ✓ گارانتی اصالت ۱۰۰٪ فیزیکی
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-black">
                    🚀 ارسال پیشتاز سراسری
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-white">دسترسی سریع</h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-400">
                  <li><Link href="/products" className="hover:text-sky-400 transition">کاتالوگ کالاها</Link></li>
                  <li><Link href="/track-order" className="hover:text-sky-400 transition">سامانه رهگیری مرسولات</Link></li>
                  <li><Link href="/news" className="hover:text-sky-400 transition">جدیدترین اخبار تکنولوژی</Link></li>
                  <li><Link href="/blog" className="hover:text-sky-400 transition">مجله مقالات تخصصی</Link></li>
                </ul>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-black text-sm text-white">خدمات مشتریان</h4>
                <ul className="space-y-2.5 text-xs font-bold text-slate-400">
                  <li><Link href="/contact" className="hover:text-sky-400 transition">ثبت تیکت مشاوره</Link></li>
                  <li><Link href="/about" className="hover:text-sky-400 transition">شرایط گارانتی طلایی</Link></li>
                  <li><Link href="/about" className="hover:text-sky-400 transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
                  <li><Link href="/blog" className="hover:text-sky-400 transition">راهنمای کالیبراسیون ۵K</Link></li>
                </ul>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <h4 className="font-black text-sm text-white">اطلاعات تماس و دفتر</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">تلفن پشتیبانی:</span>
                      <span className="font-mono font-black text-slate-200">{supportPhone}</span>
                    </div>
                    <span>📞</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">پست الکترونیک:</span>
                      <span className="font-mono font-bold text-slate-200">{supportEmail}</span>
                    </div>
                    <span>✉️</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">نشانی تحویل و انبار:</span>
                      <span className="font-bold text-slate-200">{warehouseAddress}</span>
                    </div>
                    <span>📍</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-200">نماد اعتماد الکترونیکی</span>
                      <span className="text-[10px] text-slate-400 block">کد: {enamadCode}</span>
                    </div>
                    <span>🛡️</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex justify-between text-xs font-bold text-slate-500">
              <span>نماد اعتماد الکترونیکی فعال ({enamadCode})</span>
              <p>{copyrightText}</p>
            </div>
          </div>
        </footer>
      )
    }
  }
};
`;
writeFile('lib/puckConfig.tsx', puckConfigContent);

// =============================================================================
// ۳. بازنویسی components/admin/AdminModularPages.tsx بدون بازگشت به مقدار پیش‌فرض
// =============================================================================
const adminModularPagesCode = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const loadPage = async (slug: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();
    try {
      const res = await fetch(\`/api/pages?slug=\${encodeURIComponent(slug)}\`, { cache: "no-store" });
      const json = await res.json();

      if (json.success && json.page && json.page.puck_data && Array.isArray(json.page.puck_data.content) && json.page.puck_data.content.length > 0) {
        setPageData(json.page.puck_data);
      } else {
        // ساختار اولیه در صورتی که دیتابیس کاملاً خالی باشد
        setPageData({
          content: [
            {
              type: "HeaderCapsuleBar",
              props: {
                id: "header-capsule-1",
                brandText: "Axon | آکسون",
                logoUrl: "",
                logoWidth: 36,
                logoHeight: 36,
                menu1Text: "کاتالوگ محصولات",
                menu1Url: "/products",
                menu2Text: "اخبار تکنولوژی",
                menu2Url: "/news",
                menu3Text: "مجله سئو",
                menu3Url: "/blog",
                menu4Text: "پیگیری سفارش",
                menu4Url: "/track-order",
                menu5Text: "تماس با ما",
                menu5Url: "/contact",
                showCart: true,
                showTheme: true,
                showUser: true,
                capsuleBg: "#07090e",
                capsuleBorder: "#27272a"
              }
            },
            {
              type: "NativeHero3D",
              props: {
                id: "hero-1",
                topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
                badgeColor: "#38bdf8",
                title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
                titleSize: 42,
                subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
                bgColor: "transparent"
              }
            },
            {
              type: "NativePerspectiveSlider",
              props: {
                id: "slider-1",
                sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
                sectionSubtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی"
              }
            },
            {
              type: "NativeProductCatalog",
              props: {
                id: "catalog-1",
                heading: "کاتالوگ تجهیزات تخصصی و مانیتورها",
                subtitle: "تمامی کالاها با گارانتی اصالت طلایی عرضه می‌شوند",
                limit: 8
              }
            },
            {
              type: "NativeExplodedView",
              props: {
                id: "exploded-1",
                productTitle: "Apple Studio Display 5K Retina",
                sectionTitle: "کالبدشکافی لایه‌های سخت‌افزاری"
              }
            },
            {
              type: "GlobalFooterBlock",
              props: {
                id: "footer-1",
                footerLogoUrl: "",
                brandTitle: "Axon | آکسون",
                brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
                brandDesc: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
                supportPhone: "09376110200",
                supportEmail: "Pouriarahimi@yahoo.com",
                warehouseAddress: "شیراز - ستارخان",
                workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
                enamadCode: "27424534",
                copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
                footerBg: "#07090e"
              }
            }
          ],
          root: { props: { title: slug } }
        });
      }
    } catch {
      // در صورت بروز خطا، داده‌های موجود حفظ می‌شوند
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال ذخیره و انتشار سراسری تغییرات در دیتابیس...");

    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: currentSlug === "home" ? "صفحه اصلی" : currentSlug,
          puck_data: data,
          is_published: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setPageData(data); // تثبیت فوری در استیت کلاینت
        setToast("✓ تغییرات با موفقیت ذخیره شد و پس از رفرش پایدار خواهد ماند.");

        // برودکست وب‌سوکت بلادرنگ
        try {
          const headerBlock = data.content?.find((b: any) => b.type === "HeaderCapsuleBar");
          supabase.channel("realtime-header-puck-sync").send({
            type: "broadcast",
            event: "header_updated",
            payload: headerBlock?.props || {}
          });
        } catch {}

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("puck_published"));
        }
      } else {
        setToast("خطا در ذخیره‌سازی: " + (json.message || ""));
      }
    } catch {
      setToast("خطا در برقراری ارتباط با سرور.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : \`/\${currentSlug}\`;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">انتخاب صفحه:</span>
            <select
              value={currentSlug}
              onChange={(e) => loadPage(e.target.value)}
              className="p-2 px-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black outline-none cursor-pointer"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده در سایت</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      <div className="w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[880px]">
        {loading || !pageData ? (
          <div className="py-32 text-center text-xs font-bold text-slate-400">در حال فراخوانی داده‌های ذخیره‌شده از دیتابیس...</div>
        ) : (
          <Puck
            key={currentSlug} // رفرش بوم متناسب با اسلاگ صفحه بدون باگ کش
            config={puckConfig}
            data={pageData}
            onPublish={handleSave}
          />
        )}
      </div>
    </div>
  );
}
`;
writeFile('components/admin/AdminModularPages.tsx', adminModularPagesCode);

// =============================================================================
// ۴. بیلد نهایی پروژه و انتشار در Vercel
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
  execSync('git commit -m "fix(persistence): permanently preserve all custom fields upon page refresh and add native visual color pickers"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ ذخیره دائمی و پالت انتخابگر رنگ با موفقیت مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}