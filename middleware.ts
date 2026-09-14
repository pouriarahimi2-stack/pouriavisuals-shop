import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "axon_secure_production_fallback_2026_key";

function verifyTokenSecure(token?: string): boolean {
  if (!token || typeof token !== "string" || !token.includes(":")) return false;
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return false;
    const [username, expStr, sig] = parts;
    if (Date.now() > Number(expStr)) return false;
    const payload = `${username}:${expStr}`;
    const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"));
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminToken = req.cookies.get("admin_session_token")?.value;
  const isAuthenticated = verifyTokenSecure(adminToken);

  // محافظت از API های ادمین
  if (pathname.startsWith("/api/admin")) {
    const isAuthEndpoint = pathname === "/api/admin/login" || pathname === "/api/admin/auth";
    if (!isAuthEndpoint && !isAuthenticated) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }
  }

  // محافظت از صفحات ادمین
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";
    
    // اگر کاربر وارد نشده و در لاگین نیست -> برود لاگین
    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // اگر کاربر وارد شده و در صفحه لاگین است -> برود مستقیم داشبورد
    if (isAuthenticated && isLoginPage) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // اگر مسیر دقیقاً /admin بود -> برود داشبورد
    if (pathname === "/admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|icons).*)"],
};
