import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyPayload, COOKIE_NAME } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  
  let isAuthenticated = false;
  if (token) {
    const payload = await verifyPayload(token);
    if (payload && payload.username) {
      isAuthenticated = true;
    }
  }

  // محافظت از روت‌های حساس مدیریت و حسابداری
  if (pathname.startsWith("/api/admin") || pathname === "/api/accounting") {
    const isPublic = 
      pathname === "/api/admin/login" || 
      pathname === "/api/admin/session" || 
      pathname === "/api/admin/auth";
      
    if (!isPublic && !isAuthenticated) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز. احراز هویت الزامی است." }, { status: 401 });
    }
  }

  // محافظت از صفحات پیشخوان ادمین
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";

    if (!isAuthenticated && !isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|icons|placeholder.png|robots.txt|sitemap.xml|27424534.txt).*)"],
};
