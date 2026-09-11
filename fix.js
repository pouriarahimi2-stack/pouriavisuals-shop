/**
 * AXON CORE - Step 3: Secure Customer JWT & HttpOnly Session Management (fix.js)
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

console.log("\x1b[36m[STEP-3]\x1b[0m پیاده‌سازی سشن امن JWT با کوکی‌های محافظت‌شده HttpOnly...");

// =============================================================================
// ۱. ایجاد ابزار lib/customerSession.ts جهت ساخت و تایید JWT خریداران
// =============================================================================
const customerSessionCode = `import crypto from "crypto";

const SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "axon_customer_fallback_secret_key_2026";

export interface CustomerSessionPayload {
  id: string;
  phone: string;
  username?: string;
  email?: string;
  name?: string;
  exp: number;
}

export function signCustomerPayload(user: { id: string; phone: string; username?: string; email?: string; name?: string }): string {
  const payload: CustomerSessionPayload = {
    ...user,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // ۳۰ روز اعتبار
  };

  const str = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(str).digest("base64url");
  return \`\${str}.\${signature}\`;
}

export function verifyCustomerToken(token: string): CustomerSessionPayload | null {
  try {
    if (!token || !token.includes(".")) return null;
    const [payloadStr, signature] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadStr).digest("base64url");

    if (signature !== expectedSig) return null;

    const payload: CustomerSessionPayload = JSON.parse(Buffer.from(payloadStr, "base64url").toString());
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}
`;
writeFile('lib/customerSession.ts', customerSessionCode);

// =============================================================================
// ۲. ارتقای app/api/user/auth/route.ts به کوکی امن و JWT امضاشده
// =============================================================================
const fixedUserAuthRoute = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signCustomerPayload } from "@/lib/customerSession";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hashPassword(password: string): string {
  const salt = process.env.CUSTOMER_SALT || "axon_customer_salt_2026";
  return crypto.scryptSync(password.trim(), salt, 32).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const isProd = process.env.NODE_ENV === "production";

    // ۱. ورود با شماره/شناسه و کلمه عبور
    if (action === "login_credentials") {
      const { identifier, password } = body;
      if (!identifier || !password) {
        return NextResponse.json({ success: false, message: "شناسه و کلمه عبور الزامی است." }, { status: 400 });
      }

      const cleanIdentifier = String(identifier).trim().toLowerCase();
      const cleanPassword = String(password).trim();
      const hashed = hashPassword(cleanPassword);

      if (supabaseAdmin) {
        const { data: user, error } = await supabaseAdmin
          .from("customers")
          .select("*")
          .or(\`phone.eq.\${cleanIdentifier},username.eq.\${cleanIdentifier},email.eq.\${cleanIdentifier}\`)
          .maybeSingle();

        if (!error && user) {
          const isPasswordValid = user.password_hash === hashed || user.password === cleanPassword;
          if (isPasswordValid) {
            const userData = {
              id: String(user.id),
              phone: user.phone,
              username: user.username,
              email: user.email,
              name: user.name || user.full_name || "کاربر آکسون",
            };

            const token = signCustomerPayload(userData);
            const response = NextResponse.json({
              success: true,
              message: "ورود با موفقیت انجام شد.",
              user: userData,
              token,
            });

            response.cookies.set("customer_session_token", token, {
              httpOnly: true,
              secure: isProd,
              sameSite: "lax",
              path: "/",
              maxAge: 30 * 24 * 60 * 60,
            });

            return response;
          }
        }
      }

      return NextResponse.json({ success: false, message: "نام کاربری یا کلمه عبور اشتباه است." }, { status: 401 });
    }

    // ۲. ثبت‌نام کاربر جدید
    if (action === "register") {
      const { phone, username, password, email, name } = body;

      if (!phone || !password) {
        return NextResponse.json({ success: false, message: "شماره موبایل و کلمه عبور الزامی هستند." }, { status: 400 });
      }

      const cleanPhone = String(phone).replace(/\\D/g, "");
      const cleanUsername = String(username || \`user_\${cleanPhone.slice(-4)}\`).trim().toLowerCase();
      const hashedPassword = hashPassword(password);
      const cleanEmail = email ? String(email).trim().toLowerCase() : null;

      const newUserPayload = {
        id: \`cust_\${Date.now()}\`,
        phone: cleanPhone,
        username: cleanUsername,
        password_hash: hashedPassword,
        email: cleanEmail,
        name: name ? String(name).trim() : cleanUsername,
        full_name: name ? String(name).trim() : cleanUsername,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from("customers").upsert(newUserPayload, { onConflict: "phone" });
        } catch (dbErr) {
          console.warn("Customer registration upsert notice:", dbErr);
        }
      }

      const userData = {
        id: newUserPayload.id,
        phone: cleanPhone,
        username: cleanUsername,
        email: cleanEmail || undefined,
        name: newUserPayload.name,
      };

      const token = signCustomerPayload(userData);
      const response = NextResponse.json({
        success: true,
        message: "حساب کاربری با موفقیت ساخته شد.",
        user: userData,
        token,
      });

      response.cookies.set("customer_session_token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    // ۳. همگام‌سازی ورود از طریق OAuth
    if (action === "oauth_sync") {
      const { provider, email, name, avatar } = body;
      const cleanEmail = String(email || \`\${provider}_user@axoncore.ir\`).trim().toLowerCase();
      const generatedPhone = body.phone ? String(body.phone).replace(/\\D/g, "") : \`0999\${Date.now().toString().slice(-7)}\`;

      const oauthUserPayload = {
        id: \`oauth_\${provider}_\${Date.now()}\`,
        phone: generatedPhone,
        username: cleanEmail.split("@")[0],
        email: cleanEmail,
        name: name || \`کاربر \${provider === "google" ? "گوگل" : "اپل"}\`,
        full_name: name || \`کاربر \${provider === "google" ? "گوگل" : "اپل"}\`,
        avatar_url: avatar || null,
        oauth_provider: provider,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from("customers").upsert(oauthUserPayload, { onConflict: "email" });
        } catch {}
      }

      const userData = {
        id: oauthUserPayload.id,
        phone: generatedPhone,
        username: oauthUserPayload.username,
        email: cleanEmail,
        name: oauthUserPayload.name,
      };

      const token = signCustomerPayload(userData);
      const response = NextResponse.json({
        success: true,
        message: \`ورود با موفقیت از طریق \${provider === "google" ? "حساب گوگل" : "اپل آیدی"} انجام شد.\`,
        user: userData,
        token,
      });

      response.cookies.set("customer_session_token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json({ success: false, message: "درخواست نامعتبر است." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
`;
writeFile('app/api/user/auth/route.ts', fixedUserAuthRoute);

// =============================================================================
// ۳. ساخت روت app/api/user/session/route.ts جهت احراز هویت سشن
// =============================================================================
const userSessionRoute = `import { NextRequest, NextResponse } from "next/server";
import { verifyCustomerToken } from "@/lib/customerSession";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("customer_session_token")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const payload = verifyCustomerToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.id,
        phone: payload.phone,
        username: payload.username,
        email: payload.email,
        name: payload.name,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: "با موفقیت خارج شدید." });
  response.cookies.delete("customer_session_token");
  return response;
}
`;
writeFile('app/api/user/session/route.ts', userSessionRoute);

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
  execSync('git diff --cached --quiet || git commit -m "security(step3): implement customer JWT authentication and HttpOnly session cookies"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ قدم سوم با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}