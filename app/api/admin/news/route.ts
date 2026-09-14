import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, news: [] });
    }

    const { data, error } = await supabaseAdmin
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, news: [] });
    }

    return NextResponse.json({ success: true, news: data || [] });
  } catch {
    return NextResponse.json({ success: true, news: [] });
  }
}
