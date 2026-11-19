// File Path: middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { hasRouteAccess } from "@/lib/rolePermissions";
import { verifyPayload } from "@/lib/session";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/setup"];
const PRIVATE_NOINDEX_PREFIXES = [
  "/admin",
  "/login",
  "/account",
  "/my-orders",
  "/checkout",
  "/payment",
  "/maintenance",
];

function withSecurityHeaders(res: NextResponse, pathname: string): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  res.headers.set("X-DNS-Prefetch-Control", "off");

  if (PRIVATE_NOINDEX_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  }

  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ۱. محافظت مطلق و بدون استثنا از تمامی مسیرهای مدیریت (/admin)
  if (pathname.startsWith("/admin")) {
    if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      return withSecurityHeaders(NextResponse.next(), pathname);
    }

    const token =
      req.cookies.get("admin_session_token")?.value ||
      req.cookies.get("axon_admin_session")?.value ||
      "";

    if (!token) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl), pathname);
    }

    try {
      const verifiedSession = await verifyPayload(token);
      if (!verifiedSession) {
        const res = NextResponse.redirect(new URL("/admin/login", req.url));
        res.cookies.delete("admin_session_token");
        res.cookies.delete("admin_logged_in");
        return withSecurityHeaders(res, pathname);
      }

      const role = String(verifiedSession.role || "superadmin");
      if (role !== "superadmin" && !hasRouteAccess(role, pathname)) {
        const url = new URL("/admin/dashboard", req.url);
        url.searchParams.set("access_denied", "1");
        return withSecurityHeaders(NextResponse.redirect(url), pathname);
      }

      return withSecurityHeaders(NextResponse.next(), pathname);
    } catch {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete("admin_session_token");
      res.cookies.delete("admin_logged_in");
      return withSecurityHeaders(res, pathname);
    }
  }

  // ۲. عبور امن ربات‌های موتور جستجو و ترب فقط در مسیرهای عمومی فروشگاه
  const userAgent = req.headers.get("user-agent") || "";
  const isSearchBot = /torob|emalls|googlebot|bingbot|yandex|baiduspider/i.test(
    userAgent
  );
  if (isSearchBot) {
    return withSecurityHeaders(NextResponse.next(), pathname);
  }

  return withSecurityHeaders(NextResponse.next(), pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};