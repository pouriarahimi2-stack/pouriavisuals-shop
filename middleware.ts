import { NextRequest, NextResponse } from "next/server";
import { hasRouteAccess } from "@/lib/rolePermissions";

// route های عمومی که نیازی به ادمین ندارند
const PUBLIC_ROUTES = [
  "/admin/login",
  "/admin/setup",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // فقط route های /admin را بررسی می‌کنیم
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // صفحات عمومی ادمین
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // خواندن کوکی session
  const sessionToken = req.cookies.get("admin_session_token")?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // decode ساده برای خواندن role (بدون verify کامل — آن در API انجام می‌شود)
  try {
    const parts   = sessionToken.split(".");
    if (parts.length < 2) throw new Error("invalid token");

    let payloadStr = parts[1];
    // base64url → base64
    payloadStr = payloadStr.replace(/-/g, "+").replace(/_/g, "/");
    while (payloadStr.length % 4 !== 0) payloadStr += "=";

    const payload = JSON.parse(Buffer.from(payloadStr, "base64").toString("utf8"));

    // بررسی انقضا
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete("admin_session_token");
      return res;
    }

    const role = String(payload.role || "viewer");

    // superadmin همیشه دسترسی دارد
    if (role === "superadmin") return NextResponse.next();

    // بررسی دسترسی بر اساس role
    if (!hasRouteAccess(role, pathname)) {
      // ریدایرکت به داشبورد با پیام عدم دسترسی
      const url = new URL("/admin/dashboard", req.url);
      url.searchParams.set("access_denied", "1");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    // توکن نامعتبر
    const res = NextResponse.redirect(new URL("/admin/login", req.url));
    res.cookies.delete("admin_session_token");
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
