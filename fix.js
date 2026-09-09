/**
 * AXON CORE - Modular Page Builder Phase 4: Connecting Homepage (/) to Realtime Modular Engine (fix.js)
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

console.log("\x1b[36m[AXON-BUILDER-PHASE4]\x1b[0m اتصال صفحه اصلی (/) به سامانه ماژولار و راه‌اندازی اولیه اسلاگ home...");

// =============================================================================
// ۱. بازنویسی ریشه اصلی وب‌سایت: app/page.tsx
// =============================================================================
const homePageCode = `import { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import ModularPageRenderer from "@/components/modular/ModularPageRenderer";
import { productService } from "@/services/productService";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { data: page } = await supabaseAdmin
    .from("modular_pages")
    .select("title, meta_description")
    .eq("slug", "home")
    .eq("is_published", true)
    .maybeSingle();

  return {
    title: page?.title ? \`\${page.title} | آکسون استودیو\` : "آکسون | مرجع تخصصی مانیتورهای ۵K و تجهیزات تدوین",
    description: page?.meta_description || "واردات و کالیبراسیون تخصصی نمایشگرهای مرجع رنگ و تجهیزات استودیویی با ۱۸ ماه گارانتی طلایی",
  };
}

export default async function HomePage() {
  // ۱. بررسی وجود ساختار ماژولار برای صفحه اصلی
  const { data: modularHome } = await supabaseAdmin
    .from("modular_pages")
    .select("*")
    .eq("slug", "home")
    .eq("is_published", true)
    .maybeSingle();

  // اگر صفحه ماژولار با اسلاگ home در پنل ادمین تنظیم شده باشد، رندرر بلادرنگ لود می‌شود
  if (modularHome && modularHome.blocks && modularHome.blocks.length > 0) {
    return <ModularPageRenderer initialPage={modularHome} slug="home" />;
  }

  // ۲. چیدمان پیش‌فرض در صورت عدم تنظیم صفحه ماژولار
  const products = await productService.getAll();

  return (
    <div className="min-h-screen font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* هیرو بخش پیش‌فرض */}
      <section className="py-20 px-4 max-w-7xl mx-auto text-center space-y-6">
        <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold">
          🚀 مرجع مانیتورهای استودیویی و رتینا ۵K
        </span>
        <h1 className="text-4xl sm:text-6xl font-black leading-tight">
          تجهیزات تخصصی تصویر، تدوین و پردازش رنگ
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed font-medium">
          تأمین مستقیم مانیتورهای Apple Studio Display و پنل‌های کالیبره‌شده Nano-OLED با ضمانت اصالت فیزیکی.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/products"
            className="px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs sm:text-sm hover:opacity-90 shadow-xl transition"
          >
            مشاهده کاتالوگ فروشگاه
          </Link>
          <Link
            href="/admin/pages"
            className="px-8 py-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs sm:text-sm hover:border-[var(--accent-blue)] transition"
          >
            صفحه ساز ماژولار (ادمین) ⚙️
          </Link>
        </div>
      </section>

      {/* ویترین محصولات */}
      <section className="py-12 px-4 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
          <h2 className="text-lg sm:text-xl font-black">منتخب محصولات استودیو</h2>
          <Link href="/products" className="text-xs font-bold text-[var(--accent-blue)]">
            مشاهده همه ←
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 4).map((prod) => (
            <div
              key={prod.id}
              className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-3 shadow-md"
            >
              <div className="w-full h-44 rounded-2xl overflow-hidden bg-[var(--input-bg)]">
                <img src={prod.image || prod.images?.[0] || "/placeholder.png"} alt={prod.title} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-xs truncate">{prod.title}</h3>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-black text-emerald-500">{Number(prod.discount_price || prod.price).toLocaleString("fa-IR")} ت</span>
                <Link href={\`/products/\${prod.id}\`} className="text-[var(--accent-blue)] font-bold text-[11px]">
                  خرید ←
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
`;
writeFile('app/page.tsx', homePageCode);

// =============================================================================
// ۲. تضمین ثبت صفحه پیش‌فرض home در دیتابیس Supabase
// =============================================================================
const seedScriptCode = `import { supabaseAdmin } from "@/lib/supabaseServer";

export async function seedHomePageIfMissing() {
  try {
    const { data: existing } = await supabaseAdmin
      .from("modular_pages")
      .select("id")
      .eq("slug", "home")
      .maybeSingle();

    if (!existing) {
      const defaultBlocks = [
        {
          id: "blk_home_header",
          type: "header_nav",
          title: "هدر و نوبار سراسری",
          isVisible: true,
          styles: { paddingY: 4, maxWidth: "7xl", bgColor: "#0f172a", textColor: "#ffffff" },
          data: {
            brandName: "AXON CORE",
            logoText: "آکسون استودیو",
            navLinks: [
              { label: "صفحه اصلی", url: "/" },
              { label: "محصولات", url: "/products" },
              { label: "اخبار فناوری", url: "/news" },
              { label: "ارتباط با ما", url: "/contact" }
            ],
            ctaButtonText: "مشاهده کاتالوگ",
            ctaButtonUrl: "/products"
          }
        },
        {
          id: "blk_home_hero",
          type: "hero_banner",
          title: "هیرو بنر صفحه اصلی",
          isVisible: true,
          styles: { paddingY: 16, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff", textAlign: "center" },
          data: {
            badge: "🚀 مرجع تخصصی مانیتورهای ۵K و استودیو",
            headline: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
            subheadline: "تأمین مستقیم مانیتورهای مسترینگ، پنل‌های Tandem OLED و اتصالات پهنای باند بالای تاندربولت ۵.",
            primaryBtnText: "خرید مانیتورهای استودیو",
            primaryBtnUrl: "/products",
            secondaryBtnText: "مشاوره فنی با کارشناس",
            secondaryBtnUrl: "/contact",
            imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200"
          }
        },
        {
          id: "blk_home_features",
          type: "features_grid",
          title: "گرید مزایای آکسون",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#090d16", textColor: "#ffffff" },
          data: {
            heading: "استانداردهای مهندسی تجهیزات در آکسون",
            items: [
              { icon: "🛡️", title: "گارانتی طلایی تعویض", desc: "۱۸ ماه پوشش جامع تعویض بی قید و شرط برای تمامی نمایشگرهای مرجع." },
              { icon: "⚡", title: "کالیبراسیون ۳D LUT", desc: "تراز رنگ پایدار با گاموت‌های سینمایی DCI-P3 و Rec.2020 قبل از تحویل." },
              { icon: "📦", title: "بسته‌بندی گرید هوانوردی", desc: "محافظت کامل فیزیکی در برابر تکانه‌ها و ارتعاشات حمل‌ونقل." }
            ]
          }
        },
        {
          id: "blk_home_cta",
          type: "cta_banner",
          title: "کمپین فراخوان مشاوره",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#1e1b4b", textColor: "#ffffff", textAlign: "center" },
          data: {
            title: "آیا برای چیدمان میز تدوین خود نیاز به راهنمایی دارید؟",
            subtitle: "کارشناسان آکسون متناسب با نرم‌افزار کاری شما (Premiere، DaVinci یا Final Cut) بهترین مانیتور را پیشنهاد می‌دهند.",
            btnText: "شروع مشاوره رایگان",
            btnUrl: "/contact"
          }
        },
        {
          id: "blk_home_footer",
          type: "footer_block",
          title: "فوتر صفحه اصلی",
          isVisible: true,
          styles: { paddingY: 8, maxWidth: "7xl", bgColor: "#020617", textColor: "#94a3b8" },
          data: {
            copyrightText: "تمامی حقوق محفوظ است © 2026 آکسون استودیو",
            supportPhone: "09376110200"
          }
        }
      ];

      await supabaseAdmin.from("modular_pages").insert([{
        id: "page_home_root",
        slug: "home",
        title: "صفحه اصلی وب‌سایت",
        meta_description: "مرجع تخصصی مانیتورهای ۵K و تجهیزات تصویر آکسون",
        blocks: defaultBlocks,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    }
  } catch (e) {
    console.error("Error seeding home page:", e);
  }
}
`;
writeFile('lib/seedHomePage.ts', seedScriptCode);

// تزریق seedHomePageIfMissing در روت GET صفحات app/api/pages/route.ts
const pagesRoutePath = path.join(process.cwd(), 'app/api/pages/route.ts');
let pagesRouteContent = fs.readFileSync(pagesRoutePath, 'utf8');

if (!pagesRouteContent.includes('seedHomePageIfMissing')) {
  pagesRouteContent = pagesRouteContent.replace(
    'import { PageBlock } from "@/lib/modularBuilderTypes";',
    'import { PageBlock } from "@/lib/modularBuilderTypes";\nimport { seedHomePageIfMissing } from "@/lib/seedHomePage";'
  );
  pagesRouteContent = pagesRouteContent.replace(
    'export async function GET(req: NextRequest) {',
    'export async function GET(req: NextRequest) {\n  await seedHomePageIfMissing();'
  );
  writeFile('app/api/pages/route.ts', pagesRouteContent);
}

// =============================================================================
// ۳. تست بیلد و ارسال قطعی به گیت‌هاب و ورسل
// =============================================================================
console.log("تست بیلد نهایی فاز ۴ (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال قطعی تغییرات فاز ۴ به گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(modular-builder): phase 4 - link homepage (/) to realtime modular engine with default home page seed"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ فاز ۴ صفحه ساز ماژولار با موفقیت مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}