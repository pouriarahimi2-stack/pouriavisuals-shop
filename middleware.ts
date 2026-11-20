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

interface RedirectRuleItem {
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302;
}

let cachedRedirectRules: RedirectRuleItem[] = [];
let redirectCacheExpiresAt = 0;

function normalizeRoutePath(p: string): string {
  const clean = String(p || "").trim();
  if (!clean || clean === "/") return "/";
  return clean.replace(/\/+$/, "");
}

async function getActiveRedirectRules(origin: string): Promise<RedirectRuleItem[]> {
  const now = Date.now();
  if (now < redirectCacheExpiresAt) {
    return cachedRedirectRules;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${origin}/api/site-info`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const layoutCfg =
        json?.homepage_layout_config ||
        json?.data?.homepage_layout_config ||
        {};
      const rules = layoutCfg?.seo_technical_config?.redirectRules;
      if (Array.isArray(rules)) {
        cachedRedirectRules = rules
          .filter((r: any) => r && r.fromPath && r.toPath)
          .map((r: any) => ({
            fromPath: normalizeRoutePath(String(r.fromPath)),
            toPath: String(r.toPath).trim(),
            statusCode: Number(r.statusCode) === 302 ? 302 : 301,
          }));
      }
    }
  } catch {
    // در صورت تایم‌اوت، درخواست بدون وقفه عبور می‌کند
  } finally {
    redirectCacheExpiresAt = now + 60_000;
  }

  return cachedRedirectRules;
}

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
    res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
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

  // ۲. اجرای زنده قوانین ریدایرکت ۳۰۱ و ۳۰۲ تعریف‌شده در پنل سئو (/admin/seo)
  if (!pathname.startsWith("/api") && req.method === "GET") {
    const normalizedPath = normalizeRoutePath(pathname);
    const rules = await getActiveRedirectRules(req.nextUrl.origin);
    const matchedRule = rules.find((r) => r.fromPath === normalizedPath);
    if (matchedRule && matchedRule.toPath !== normalizedPath) {
      const targetUrl = matchedRule.toPath.startsWith("http")
        ? new URL(matchedRule.toPath)
        : new URL(matchedRule.toPath, req.url);
      return withSecurityHeaders(
        NextResponse.redirect(targetUrl, matchedRule.statusCode),
        pathname
      );
    }
  }

  return withSecurityHeaders(NextResponse.next(), pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};