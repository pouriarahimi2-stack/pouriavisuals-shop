import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, logs: [] });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

    const { data: logs, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ success: true, logs: [] });
    }

    return NextResponse.json({ success: true, logs: logs || [] });
  } catch (err: any) {
    return NextResponse.json({ success: true, logs: [] });
  }
}
