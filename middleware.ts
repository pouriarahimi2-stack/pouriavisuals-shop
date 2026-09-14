import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "axon_core_fixed_session_secret_2026";

function isTokenValid(token?: string): boolean {
  if (!token || typeof token !== "string" || !token.includes(":")) return false;
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return false;
    const [user, expStr, sig] = parts;
    if (Date.now() > Number(expStr)) return false;
    const payload = `${user}:${expStr}`;
    const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"));
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("admin_session_token")?.value;
  const isAuthenticated = isTokenValid(token);

  // صفحات ادمین
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";

    // کاربر وارد نشده است و می‌خواهد به ادمین برود -> ریدایرکت به لاگین
    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // کاربر قبلاً وارد شده و در صفحه لاگین است -> هدایت به داشبورد
    if (isAuthenticated && isLoginPage) {
      const dashboardUrl = new URL("/admin/dashboard", req.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // مسیر پیش‌فرض /admin به /admin/dashboard
    if (pathname === "/admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
