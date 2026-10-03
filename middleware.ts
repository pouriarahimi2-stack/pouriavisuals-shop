// File Path: middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { hasRouteAccess } from "@/lib/rolePermissions";
import { verifyPayload } from "@/lib/session";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/setup"];

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return withSecurityHeaders(NextResponse.next());
  }

  const token =
    req.cookies.get("admin_session_token")?.value ||
    req.cookies.get("axon_admin_session")?.value ||
    "";

  if (!token) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  try {
    const verifiedSession = await verifyPayload(token);
    if (!verifiedSession) {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete("admin_session_token");
      return withSecurityHeaders(res);
    }

    const role = String(verifiedSession.role || "superadmin");
    if (role !== "superadmin" && !hasRouteAccess(role, pathname)) {
      const url = new URL("/admin/dashboard", req.url);
      url.searchParams.set("access_denied", "1");
      return withSecurityHeaders(NextResponse.redirect(url));
    }

    return withSecurityHeaders(NextResponse.next());
  } catch {
    const res = NextResponse.redirect(new URL("/admin/login", req.url));
    res.cookies.delete("admin_session_token");
    return withSecurityHeaders(res);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
