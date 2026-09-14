import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, logs: [] });
    }

    // تلاش برای واکشی لاگ‌ها با مدیریت خطای جدول مفقود
    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      // اگر جدول هنوز در سوپابیس ساخته نشده است، آرایه خالی برمی‌گرداند تا فرانت کرش نکند
      return NextResponse.json({ success: true, logs: [] });
    }

    return NextResponse.json({ success: true, logs: data || [] });
  } catch (err) {
    return NextResponse.json({ success: true, logs: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!supabaseAdmin) return NextResponse.json({ success: true });

    await supabaseAdmin.from("audit_logs").insert([{
      action: body.action || "UNSPECIFIED",
      details: body.details || {},
      created_at: new Date().toISOString(),
    }]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
