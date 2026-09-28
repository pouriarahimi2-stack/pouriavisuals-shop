import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info").select("*").limit(1).maybeSingle();
    return NextResponse.json({ success: true, data: data || {} },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  } catch (err: any) {
    return NextResponse.json({ success: false, data: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    delete payload.id;
    payload.updated_at = new Date().toISOString();
    const { data: ex } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
    if (ex?.id) {
      await supabaseAdmin.from("site_info").update(payload).eq("id", ex.id);
    } else {
      await supabaseAdmin.from("site_info").insert([{ ...payload, created_at: new Date().toISOString() }]);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) { return POST(req); }
