import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminToken = req.cookies.get("admin_session_token")?.value;
    if (!adminToken || adminToken.length < 20) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit")) || 50));

    const { data: logs, error } = await supabaseAdmin
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      logs: logs || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در بازیابی لاگ‌های امنیتی." },
      { status: 500 }
    );
  }
}
