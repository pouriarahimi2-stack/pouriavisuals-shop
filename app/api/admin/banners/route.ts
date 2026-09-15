import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: banners } = await supabaseAdmin.from("banners").select("*").order("created_at", { ascending: false });
    return NextResponse.json({ success: true, banners: banners || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const payload = {
      title: body.title,
      image_url: body.image_url,
      link_url: body.link_url || null,
      is_active: body.is_active !== false,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin.from("banners").insert([payload]).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, banner: data, message: "بنر با موفقیت ثبت شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "شناسه الزامی است." }, { status: 400 });
    await supabaseAdmin.from("banners").delete().eq("id", id);
    return NextResponse.json({ success: true, message: "بنر حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
