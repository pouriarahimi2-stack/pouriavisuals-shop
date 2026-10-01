import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ success: false, admin: null });
    }
    return NextResponse.json({
      success: true,
      admin: {
        username: auth.session?.username || "admin",
        role:     auth.session?.role     || "superadmin",
      },
    });
  } catch {
    return NextResponse.json({ success: false, admin: null });
  }
}
