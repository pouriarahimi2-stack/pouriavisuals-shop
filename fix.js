/**
 * AXON CORE - Modular Page Builder Engine - Phase 1 (fix.js)
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

console.log("\x1b[36m[AXON-BUILDER-PHASE1]\x1b[0m راه‌اندازی زیرساخت صفحه ساز ماژولار و روت‌های بلادرنگ...");

// =============================================================================
// ۱. تایپ‌ها و ساختار استاندارد بلوک‌های گرافیکی: lib/modularBuilderTypes.ts
// =============================================================================
const typesCode = `export type BlockType = 
  | "header_nav"
  | "hero_banner"
  | "features_grid"
  | "product_showcase"
  | "accordion_faq"
  | "cta_banner"
  | "rich_text"
  | "footer_block";

export interface StyleConfig {
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  paddingY?: number;
  maxWidth?: "full" | "7xl" | "5xl" | "3xl";
  borderRadius?: "none" | "lg" | "2xl" | "3xl" | "full";
  borderWidth?: number;
  borderColor?: string;
  textAlign?: "right" | "center" | "left";
  shadow?: "none" | "md" | "xl" | "2xl";
}

export interface PageBlock {
  id: string;
  type: BlockType;
  title: string;
  isVisible: boolean;
  styles: StyleConfig;
  data: Record<string, any>;
}

export interface ModularPageDocument {
  id: string;
  slug: string;
  title: string;
  meta_description?: string;
  blocks: PageBlock[];
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}
`;
writeFile('lib/modularBuilderTypes.ts', typesCode);

// =============================================================================
// ۲. روت سروری کنترل و انتشار صفحات ماژولار: app/api/pages/route.ts
// =============================================================================
const pagesApiRoute = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { PageBlock } from "@/lib/modularBuilderTypes";

export const dynamic = "force-dynamic";

// واکشی کل صفحات ساخته‌شده
export async function GET(req: NextRequest) {
  try {
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

// ایجاد یا ویرایش صفحه و بلوک‌ها همراه با تریگر وب‌سوکت CDC
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

    const { data: existing } = await supabaseAdmin.from("modular_pages").select("id").eq("id", pageId).maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin.from("modular_pages").update(payload).eq("id", pageId);
      if (error) throw error;
    } else {
      payload["created_at"] = new Date().toISOString();
      const { error } = await supabaseAdmin.from("modular_pages").insert([payload]);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: "صفحه ماژولار با موفقیت ذخیره شد.", page: payload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// حذف کامل صفحه
export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه صفحه الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("modular_pages").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "صفحه با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/pages/route.ts', pagesApiRoute);

// =============================================================================
// ۳. تست بیلد و پوش به گیت‌هاب
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
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
  execSync('git commit -m "feat(modular-builder): phase 1 - schema types, resilient api & realtime cdc readiness"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ فاز اول با موفقیت پوش شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}