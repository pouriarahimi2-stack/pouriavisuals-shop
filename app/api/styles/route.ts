// File Path: app/api/styles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_styles")
      .select("*")
      .eq("id", "default_theme")
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || {
        id: "default_theme",
        primary_color: "#0071e3",
        secondary_color: "#4f46e5",
        font_family: "Vazirmatn",
        border_radius: "1.5rem",
        custom_css: "",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = {
      id: "default_theme",
      primary_color: body.primary_color || "#0071e3",
      secondary_color: body.secondary_color || "#4f46e5",
      font_family: body.font_family || "Vazirmatn",
      border_radius: body.border_radius || "1.5rem",
      custom_css: body.custom_css || "",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("site_styles")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}