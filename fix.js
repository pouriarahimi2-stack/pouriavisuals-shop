/**
 * AXON CORE - Definitive Modular Page Builder & Auto-Seed Fix (fix.js)
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

console.log("\x1b[36m[AXON-BUILDER-INTEGRATION]\x1b[0m اتصال مسیر ادمین به AdminModularPages و تضمین سید خودکار صفحات...");

// =============================================================================
// ۱. اتصال قطعی صفحه مدیریت app/admin/pages/page.tsx به AdminModularPages
// =============================================================================
const adminPagesPageCode = `"use client";

import React from "react";
import AdminModularPages from "@/components/admin/AdminModularPages";

export default function AdminPagesRoute() {
  return <AdminModularPages />;
}
`;
writeFile('app/admin/pages/page.tsx', adminPagesPageCode);

// =============================================================================
// ۲. تضمین سید اولیه و خودکار صفحه اصلی با ساختار کامل بلوک‌ها در دیتابیس
// =============================================================================
const seedHomePageCode = `import { supabaseAdmin } from "@/lib/supabaseServer";

export async function seedHomePageIfMissing() {
  try {
    const { data: existing } = await supabaseAdmin
      .from("modular_pages")
      .select("id, blocks")
      .eq("slug", "home")
      .maybeSingle();

    if (!existing || !existing.blocks || existing.blocks.length === 0) {
      const defaultBlocks = [
        {
          id: "blk_home_header",
          type: "header_nav",
          title: "هدر و نوبار سراسری سایت",
          isVisible: true,
          styles: { paddingY: 4, maxWidth: "7xl", bgColor: "#0f172a", textColor: "#ffffff" },
          data: {
            brandName: "AXON CORE",
            logoText: "آکسون استودیو",
            navLinks: [
              { label: "صفحه اصلی", url: "/" },
              { label: "محصولات", url: "/products" },
              { label: "اخبار فناوری", url: "/news" },
              { label: "مجله تخصصی", url: "/blog" },
              { label: "تماس و مشاوره", url: "/contact" }
            ],
            ctaButtonText: "ورود به کاتالوگ",
            ctaButtonUrl: "/products"
          }
        },
        {
          id: "blk_home_hero",
          type: "hero_banner",
          title: "هیرو بنر بزرگ صفحه اصلی",
          isVisible: true,
          styles: { paddingY: 16, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff", textAlign: "center" },
          data: {
            badge: "🚀 مرجع تخصصی مانیتورهای ۵K و استودیو",
            headline: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
            subheadline: "تأمین، واردات و کالیبراسیون سخت‌افزاری مانیتورهای استودیویی Apple و LG با ۱۸ ماه گارانتی طلایی.",
            primaryBtnText: "خرید مانیتورهای استودیو",
            primaryBtnUrl: "/products",
            secondaryBtnText: "درخواست مشاوره فنی",
            secondaryBtnUrl: "/contact",
            imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200"
          }
        },
        {
          id: "blk_home_features",
          type: "features_grid",
          title: "گرید مزایای رقابتی آکسون",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#090d16", textColor: "#ffffff" },
          data: {
            heading: "چرا حرفه‌ای‌های تدوین آکسون را برمی‌گزینند؟",
            items: [
              { icon: "🛡️", title: "گارانتی طلایی تعویض", desc: "۱۸ ماه پوشش جامع تعویض بی قید و شرط برای تمامی نمایشگرهای مرجع." },
              { icon: "⚡", title: "کالیبراسیون ۳D LUT", desc: "تراز رنگ پایدار با گاموت‌های سینمایی DCI-P3 و Rec.2020 قبل از تحویل." },
              { icon: "📦", title: "بسته‌بندی گرید هوانوردی", desc: "محافظت کامل فیزیکی در برابر تکانه‌ها و ارتعاشات حمل‌ونقل." }
            ]
          }
        },
        {
          id: "blk_home_products",
          type: "product_showcase",
          title: "ویترین کالاهای پرچمدار استودیو",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff" },
          data: {
            heading: "پرفروش‌ترین مانیتورها و تجهیزات تصویر",
            viewAllText: "مشاهده تمام کالاها ←",
            viewAllUrl: "/products"
          }
        },
        {
          id: "blk_home_faq",
          type: "accordion_faq",
          title: "پرسش‌های متداول (FAQ)",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "5xl", bgColor: "#0b0f19", textColor: "#ffffff" },
          data: {
            heading: "پرسش‌های پرتکرار مشتریان",
            questions: [
              { q: "آیا مانیتورها دارای گارانتی تعویض هستند؟", a: "بله، تمام مانیتورهای ۵K دارای ۱۸ ماه گارانتی طلایی تعویض بی قید و شرط می‌باشند." },
              { q: "امکان تست حضوری و بررسی کالیبراسیون وجود دارد؟", a: "بله، در استودیوی شیراز با هماهنگی قبلی می‌توانید کیفیت رنگ پنل‌ها را از نزدیک ارزیابی کنید." }
            ]
          }
        },
        {
          id: "blk_home_cta",
          type: "cta_banner",
          title: "فراخوان عمل و کمپین مشاوره",
          isVisible: true,
          styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#1e1b4b", textColor: "#ffffff", textAlign: "center" },
          data: {
            title: "به یک مشاوره تخصصی برای استودیوی خود نیاز دارید؟",
            subtitle: "کارشناسان فنی آکسون شما را در انتخاب کابل تاندربولت، مانیتور و پایه هیدرولیک یاری می‌کنند.",
            btnText: "ثبت تیکت مشاوره آنلاین",
            btnUrl: "/contact"
          }
        },
        {
          id: "blk_home_footer",
          type: "footer_block",
          title: "فوتر سراسری سایت",
          isVisible: true,
          styles: { paddingY: 8, maxWidth: "7xl", bgColor: "#020617", textColor: "#94a3b8" },
          data: {
            copyrightText: "تمامی حقوق مادی و معنوی برای آکسون استودیو محفوظ است © 2026",
            supportPhone: "09376110200"
          }
        }
      ];

      const payload = {
        id: existing?.id || "page_home_root",
        slug: "home",
        title: "صفحه اصلی وب‌سایت",
        meta_description: "مرجع تخصصی مانیتورهای ۵K و تجهیزات تصویر آکسون با گارانتی طلایی",
        blocks: defaultBlocks,
        is_published: true,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        await supabaseAdmin.from("modular_pages").update(payload).eq("id", existing.id);
      } else {
        payload["created_at"] = new Date().toISOString();
        await supabaseAdmin.from("modular_pages").insert([payload]);
      }
    }
  } catch (err) {
    console.warn("seedHomePage notice:", err);
  }
}
`;
writeFile('lib/seedHomePage.ts', seedHomePageCode);

// =============================================================================
// ۳. روت سروری app/api/pages/route.ts با تضمین بارگذاری و حذف و ویرایش
// =============================================================================
const pagesApiRouteCode = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { seedHomePageIfMissing } from "@/lib/seedHomePage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await seedHomePageIfMissing();

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const { data, error } = await supabaseAdmin
        .from("modular_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ success: true, page: data });
    }

    const { data: list, error } = await supabaseAdmin
      .from("modular_pages")
      .select("id, slug, title, meta_description, is_published, updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, pages: list || [] });
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
    const { id, slug, title, meta_description, blocks, is_published } = body;

    const cleanSlug = String(slug || "").trim().toLowerCase()
      .replace(/[^a-z0-9\\u0600-\\u06FF\\-_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!cleanSlug || !title) {
      return NextResponse.json({ success: false, message: "عنوان صفحه و آدرس (Slug) الزامی است." }, { status: 400 });
    }

    const pageId = id || ("page_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));

    const payload = {
      id: pageId,
      slug: cleanSlug,
      title: String(title).trim(),
      meta_description: meta_description ? String(meta_description).trim() : null,
      blocks: Array.isArray(blocks) ? blocks : [],
      is_published: is_published !== false,
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabaseAdmin.from("modular_pages").select("id").eq("slug", cleanSlug).maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin.from("modular_pages").update(payload).eq("id", existing.id);
      if (error) throw error;
    } else {
      payload["created_at"] = new Date().toISOString();
      const { error } = await supabaseAdmin.from("modular_pages").insert([payload]);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: "صفحه ماژولار با موفقیت ذخیره و در سراسر سایت منتشر شد.", page: payload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    if (!id && !slug) {
      return NextResponse.json({ success: false, message: "شناسه صفحه الزامی است." }, { status: 400 });
    }

    let query = supabaseAdmin.from("modular_pages").delete();
    if (id) query = query.eq("id", id);
    else if (slug) query = query.eq("slug", slug);

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, message: "صفحه با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/pages/route.ts', pagesApiRouteCode);

// =============================================================================
// ۴. بیلد کامل و پوش قطعی به گیت‌هاب و ورسل
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به گیت‌هاب و استقرار لایو در ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "fix(modular-builder): link admin route to AdminModularPages, ensure automatic homepage seed and realtime controls"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ صفحه ساز ماژولار فعال شد و ورسل در حال دیپلوی است!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}