import { NextRequest, NextResponse } from "next/server";
import { verifyPayload, COOKIE_NAME } from "@/lib/session";

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // روت‌های مجاز بدون نیاز به ورود
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon.ico")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await verifyPayload(token);

  if (!session) {
    // در صورت نامعتبر یا منقضی بودن سشن
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "نشست امنیتی نامعتبر یا منقضی شده است. لطفا مجدداً وارد شوید." },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);

    // پاکسازی کوکی نامعتبر
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}
