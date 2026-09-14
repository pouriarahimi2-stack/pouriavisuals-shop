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
  const loggedInFlag = req.cookies.get("admin_logged_in")?.value;
  
  const isAuthenticated = isTokenValid(token) || loggedInFlag === "true";

  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";

    // اگر کاربر لاگین نیست و در لاگین هم نیست -> برود لاگین
    if (!isAuthenticated && !isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // اگر کاربر لاگین است و در صفحه لاگین قرار دارد -> برود مستقیم داشبورد
    if (isAuthenticated && isLoginPage) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (pathname === "/admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
