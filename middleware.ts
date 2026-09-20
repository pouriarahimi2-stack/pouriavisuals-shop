import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyPayload, COOKIE_NAME } from "@/lib/session";

// ─── کش ۳۰ ثانیه‌ای حالت تعمیرات (Edge isolate level) ────────────
let _maintCache: { mode: string; ts: number } = { mode: "none", ts: 0 };

async function getMaintenanceMode(): Promise<string> {
  const now = Date.now();
  // اگر کمتر از ۳۰ ثانیه از آخرین fetch گذشته، مقدار کش برگردان
  if (now - _maintCache.ts < 30_000) return _maintCache.mode;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return _maintCache.mode;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/site_info?select=maintenance_mode&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const mode: string = data?.[0]?.maintenance_mode ?? "none";
      _maintCache = { mode, ts: now };
      return mode;
    }
  } catch {
    // در صورت خطای شبکه، آخرین مقدار کش را برگردان
  }
  return _maintCache.mode;
}

// ─── middleware اصلی ──────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // ─── احراز هویت ادمین ─────────────────────────────────────────
  let isAuthenticated = false;
  if (token) {
    const payload = await verifyPayload(token);
    if (payload && payload.username) {
      isAuthenticated = true;
    }
  }

  // ─── حالت تعمیرات ─────────────────────────────────────────────
  // استثناء: ادمین‌ها، صفحه /maintenance و /admin و API‌های عمومی باید در دسترس باشن
  const isAdminPath        = pathname.startsWith("/admin");
  const isMaintenancePage  = pathname === "/maintenance";
  const isPublicApi        =
    pathname === "/api/admin/login"     ||
    pathname === "/api/admin/session"   ||
    pathname === "/api/site-info"       ||
    pathname.startsWith("/api/payment") ||
    pathname.startsWith("/_next")       ||
    pathname === "/favicon.ico";

  if (!isAdminPath && !isMaintenancePage && !isPublicApi) {
    const maintenanceMode = await getMaintenanceMode();

    if (maintenanceMode && maintenanceMode !== "none") {
      // ادمین‌های احراز‌هویت‌شده می‌توانند سایت را ببینند
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL("/maintenance", req.url));
      }
    }
  }

  // ─── محافظت از API‌های حساس ──────────────────────────────────
  const isProtectedApi =
    pathname.startsWith("/api/admin")    ||
    pathname === "/api/accounting"       ||
    pathname === "/api/sms/send"         ||
    pathname === "/api/test-ai";

  if (isProtectedApi) {
    const isPublicAdminEndpoint =
      pathname === "/api/admin/login"   ||
      pathname === "/api/admin/session";

    if (!isPublicAdminEndpoint && !isAuthenticated) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز. احراز هویت الزامی است." },
        { status: 401 }
      );
    }
  }

  // ─── محافظت از صفحات ادمین ───────────────────────────────────
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|placeholder.png|robots.txt|sitemap.xml|27424534.txt).*)",
  ],
};
