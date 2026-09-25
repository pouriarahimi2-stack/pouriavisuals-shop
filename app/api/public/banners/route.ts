import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// این route عمومی است — نیازی به ادمین‌بودن ندارد
export async function GET(_req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from("banners")
      .select("id, title, image_url, link_url, is_active, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) throw error;
    return NextResponse.json({ success: true, banners: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: true, banners: [] });
  }
}
