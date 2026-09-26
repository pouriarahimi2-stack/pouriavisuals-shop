import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(_req: NextRequest) {
  try {
    const { data } = await supabaseAdmin
      .from("banners").select("id,title,image_url,link_url,is_active")
      .eq("is_active", true).order("created_at", { ascending: false }).limit(8);
    return NextResponse.json({ success: true, banners: data || [] });
  } catch { return NextResponse.json({ success: true, banners: [] }); }
}
