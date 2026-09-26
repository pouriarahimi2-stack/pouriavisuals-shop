import { NextRequest, NextResponse } from "next/server";
import { hasRouteAccess } from "@/lib/rolePermissions";
const PUBLIC = ["/admin/login", "/admin/setup"];
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();
  const token = req.cookies.get("admin_session_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));
  try {
    const [, payload64] = token.split(".");
    const pad = payload64.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(payload64.length/4)*4,"=");
    const payload = JSON.parse(Buffer.from(pad, "base64").toString("utf8"));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete("admin_session_token");
      return res;
    }
    const role = String(payload.role || "viewer");
    if (role === "superadmin") return NextResponse.next();
    if (!hasRouteAccess(role, pathname)) {
      const url = new URL("/admin/dashboard", req.url);
      url.searchParams.set("access_denied", "1");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/admin/login", req.url));
    res.cookies.delete("admin_session_token");
    return res;
  }
}
export const config = { matcher: ["/admin/:path*"] };
