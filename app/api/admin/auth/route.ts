// File Path: app/api/admin/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  superadmin: ["all"],
  product_manager: ["dashboard", "products", "inventory", "menu", "banners", "reviews"],
  order_manager: ["dashboard", "orders", "customers", "financial", "coupons", "messages"],
  content_seo_manager: ["dashboard", "blog", "news", "seo", "ai", "pages", "appearance"],
  viewer_reporter: ["dashboard", "reports", "financial", "audit_logs"],
};

export async function GET(req: NextRequest) {
  try {
    const session: any = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const username = String(session.username || "").trim().toLowerCase();
    const role = String(session.role || "superadmin");
    let permissions: string[] = ROLE_DEFAULT_PERMISSIONS[role] || ["dashboard"];

    try {
      const { data: siteRow } = await supabaseAdmin
        .from("site_info")
        .select("auth_security_config")
        .limit(1)
        .maybeSingle();

      const permMap = siteRow?.auth_security_config?.admin_permissions_map || {};
      if (username && Array.isArray(permMap[username]) && permMap[username].length > 0) {
        permissions = permMap[username];
      } else if (role === "superadmin") {
        permissions = ["all"];
      }
    } catch {}

    return NextResponse.json({
      authenticated: true,
      user: {
        ...session,
        role,
        permissions,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
