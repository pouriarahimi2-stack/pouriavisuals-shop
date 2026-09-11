/**
 * AXON CORE - Step 4: Enforce RBAC Permission Matrix on Admin APIs (fix.js)
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

console.log("\x1b[36m[STEP-4]\x1b[0m اعمال بررسی نقش‌محور (RBAC) روی کنترلرهای حساس ادمین...");

// =============================================================================
// ۱. ارتقای app/api/styles/route.ts با اعتبارسنجی نقش ادمین
// =============================================================================
const fixedStylesRoute = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { enforceRbac } from "@/lib/rbacGuard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin.from("site_styles").select("*").limit(1).maybeSingle();
    return NextResponse.json({
      success: true,
      data: data || {
        primary_color: "#0071e3",
        secondary_color: "#4f46e5",
        font_family: "Vazirmatn",
        border_radius: "1.5rem",
        custom_css: "",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    // بررسی دسترسی ویرایش استایل (فقط سوپرادمین یا طراح)
    if (!enforceRbac(session.role, "styles.manage") && session.role !== "superadmin") {
      return NextResponse.json(
        { success: false, message: "نقش کاربری شما اجازه تغییر هویت بصری و استایل‌های سایت را ندارد." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const payload = {
      primary_color: body.primary_color || "#0071e3",
      secondary_color: body.secondary_color || "#4f46e5",
      font_family: body.font_family || "Vazirmatn",
      border_radius: body.border_radius || "1.5rem",
      custom_css: body.custom_css || "",
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from("site_styles").select("id").limit(1);

    if (existing && existing.length > 0) {
      await supabaseAdmin.from("site_styles").update(payload).eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("site_styles").insert([payload]);
    }

    return NextResponse.json({ success: true, message: "استایل‌ها و هویت بصری با موفقیت در دیتابیس ثبت شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/styles/route.ts', fixedStylesRoute);

// =============================================================================
// ۲. ارتقای app/api/admin/users/route.ts (ایجاد و حذف مدیر منحصراً توسط superadmin)
// =============================================================================
const fixedAdminUsersRoute = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = verifyAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
  }

  if (session.role !== "superadmin") {
    return NextResponse.json({ success: false, message: "مشاهده لیست مدیران فقط برای مدیر ارشد مجاز است." }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, username, full_name, role, created_at");

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, users: data });
}

export async function POST(req: NextRequest) {
  const session = verifyAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
  }

  if (session.role !== "superadmin") {
    return NextResponse.json({ success: false, message: "ایجاد مدیر جدید منحصراً در اختیارات مدیر ارشد سیستم است." }, { status: 403 });
  }

  const body = await req.json();
  const { username, password, full_name, role } = body;

  if (!username || !password) {
    return NextResponse.json({ success: false, message: "اطلاعات ناقص است." }, { status: 400 });
  }

  const hashedPassword = authSecurity.hashPassword(password.trim());

  const { data, error } = await supabaseAdmin.from("admin_users").insert({
    username: username.trim().toLowerCase(),
    password: hashedPassword,
    password_hash: hashedPassword,
    full_name: full_name?.trim() || username.trim(),
    role: role || "product_manager",
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, user: data });
}

export async function DELETE(req: NextRequest) {
  const session = verifyAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
  }

  if (session.role !== "superadmin") {
    return NextResponse.json({ success: false, message: "حذف مدیر فقط در حیطه اختیارات مدیر ارشد سیستم است." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ success: false, message: "شناسه کاربر الزامی است." }, { status: 400 });

  if (String(session.id) === String(id)) {
    return NextResponse.json({ success: false, message: "نمی‌توانید حساب کاربری جاری خود را حذف کنید." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("admin_users").delete().eq("id", id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: "کاربر با موفقیت حذف شد." });
}
`;
writeFile('app/api/admin/users/route.ts', fixedAdminUsersRoute);

// =============================================================================
// بیلد و دیپلوی ورسل
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و انتشار در ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "security(step4): enforce role-based access control (RBAC) on styles and user management APIs"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ قدم چهارم با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}