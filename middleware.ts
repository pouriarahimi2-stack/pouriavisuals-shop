import { NextResponse } from "next/server";
import type { NextRequest } from "next/request";
import { verifyPayload } from "./lib/session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // محافظت از مسیرهای پیشخوان ادمین
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionToken =
      req.cookies.get("admin_session_token")?.value ||
      req.cookies.get("pv_admin_session")?.value;

    if (!sessionToken) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // اعتبارسنجی رمزنگاری‌شده و دقیق سشن (بدون هیچ‌گونه Fallback فرضی یا ناامن)
    const payload = verifyPayload(sessionToken);

    if (!payload || (!payload.username && !payload.role)) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("admin_session_token");
      res.cookies.delete("pv_admin_session");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
