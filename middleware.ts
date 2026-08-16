import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const adminSession = request.cookies.get("admin_session")?.value;
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  // مسدودسازی ورود کاربران احرازهویت‌نشده به بخش مدیریت
  if (isAdminRoute && !isLoginPage && !adminSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // در صورتی که ادمین لاگین است و صفحه لاگین را باز کند
  if (isLoginPage && adminSession) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};