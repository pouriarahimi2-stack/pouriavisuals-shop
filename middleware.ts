import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminToken = req.cookies.get("admin_session_token")?.value;
  const isAuthenticated = Boolean(adminToken && adminToken.length >= 20);

  // ۱. حفاظت از اندپوینت‌های مدیریتی (/api/admin/*) به جز احراز هویت
  if (pathname.startsWith("/api/admin")) {
    const isAuthEndpoint = pathname === "/api/admin/auth";
    if (!isAuthEndpoint && !isAuthenticated) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز. سشن ادمین معتبر نیست." },
        { status: 401 }
      );
    }
  }

  // ۲. حفاظت از صفحات پنل ادمین (/admin/*) به جز صفحه لاگین
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";

    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAuthenticated && isLoginPage) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  // ۳. ایجاد پاسخ و تزریق هدرهای امنیتی دفاعی
  const response = NextResponse.next();

  // مقابله با Clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // مقابله با حدس فرمت فایل توسط مرورگر
  response.headers.set("X-Content-Type-Options", "nosniff");
  // سیاست محافظت از رفرر
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // قفل دسترسی‌های غیرضروری کلاینت
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    /*
     * اعمال روی تمام مسیرها به استثنای فایل‌های استاتیک و آیکون‌ها
     */
    "/((?!_next/static|_next/image|favicon.ico|images|icons).*)",
  ],
};
