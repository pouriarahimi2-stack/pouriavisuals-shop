/**
 * AXON CORE - Harden Coupon Validation Endpoint (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

function writeFile(relPath, content) {
  const fullPath = path.join(ROOT, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ایجاد/اصلاح شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[35m[COUPON-SECURITY]\x1b[0m مقاوم‌سازی اندپوینت بررسی و اعمال کوپن تخفیف...");

const couponValidateCode = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = body.code;
    const cartTotal = Number(body.cartTotal) || 0;

    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json(
        { valid: false, message: "لطفاً کد تخفیف را وارد کنید." },
        { status: 400 }
      );
    }

    const cleanCode = rawCode.trim().toUpperCase();

    // واکشی کوپن فعال از دیتابیس با supabaseAdmin
    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", cleanCode)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json(
        { valid: false, message: "کد تخفیف وارد شده معتبر نیست یا وجود ندارد." },
        { status: 404 }
      );
    }

    // ۱. بررسی فعال بودن کوپن
    if (coupon.is_active === false) {
      return NextResponse.json(
        { valid: false, message: "این کد تخفیف در حال حاضر غیرفعال است." },
        { status: 400 }
      );
    }

    // ۲. بررسی تاریخ انقضا
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { valid: false, message: "مهلت استفاده از این کد تخفیف به پایان رسیده است." },
        { status: 400 }
      );
    }

    // ۳. بررسی سقف تعداد دفعات استفاده
    if (
      typeof coupon.usage_limit === "number" &&
      coupon.usage_limit > 0 &&
      (coupon.times_used || 0) >= coupon.usage_limit
    ) {
      return NextResponse.json(
        { valid: false, message: "سقف ظرفیت استفاده از این کد تخفیف تکمیل شده است." },
        { status: 400 }
      );
    }

    // ۴. بررسی شرط حداقل خرید (Minimum Purchase)
    if (coupon.min_purchase && cartTotal < coupon.min_purchase) {
      return NextResponse.json(
        {
          valid: false,
          message: \`این کد تنها برای سفارش‌های بالاتر از \${Number(coupon.min_purchase).toLocaleString("fa-IR")} تومان معتبر است.\`,
        },
        { status: 400 }
      );
    }

    // ۵. محاسبه دقیق مبلغ کسر شده
    let discountAmount = 0;
    if (coupon.discount_type === "percent" || coupon.percent) {
      const p = Number(coupon.discount_percent || coupon.percent || 0);
      discountAmount = Math.round((cartTotal * p) / 100);
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else if (coupon.discount_amount || coupon.amount) {
      discountAmount = Number(coupon.discount_amount || coupon.amount || 0);
    }

    // تضمین اینکه تخفیف از کل مبلغ سبد فراتر نرود
    discountAmount = Math.min(discountAmount, cartTotal);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_amount: discountAmount,
        discount_percent: coupon.discount_percent || coupon.percent || null,
        description: coupon.description || "تخفیف سفارش",
      },
      message: "کد تخفیف با موفقیت روی سفارش اعمال شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, message: err.message || "خطا در پردازش کد تخفیف." },
      { status: 500 }
    );
  }
}
`;

writeFile('app/api/coupons/validate/route.ts', couponValidateCode);

// کامپایل و تست صحت پروژه
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ کامپایل با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

// ارسال تغییرات به مخزن گیت‌هاب
console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "security(coupons): enforce server-side expiration, usage caps, and min-purchase validation"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ روت ایمن‌شده اعتبارسنجی کوپن‌ها روی ورسل مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}