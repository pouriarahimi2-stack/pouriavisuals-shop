import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const { data, error } = await supabaseAdmin
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, banners: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body     = await req.json();
    const title    = String(body.title || "").trim();
    const imageUrl = String(body.image_url || body.image || "").trim();

    if (!title || !imageUrl) {
      return NextResponse.json({ success: false, message: "عنوان و تصویر الزامی هستند." }, { status: 400 });
    }

    const payload = {
      title,
      image_url: imageUrl,
      link_url:  body.link_url || body.link || "/products",
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (body.id) {
      const { data, error } = await supabaseAdmin
        .from("banners").update(payload).eq("id", body.id).select().single();
      if (error) throw error;
      // همه بنرها را برمی‌گردانیم
      const { data: all } = await supabaseAdmin.from("banners").select("*").order("created_at", { ascending: false });
      return NextResponse.json({ success: true, banner: data, banners: all || [] });
    } else {
      const { data, error } = await supabaseAdmin
        .from("banners")
        .insert([{ ...payload, id: randomUUID(), created_at: new Date().toISOString() }])
        .select().single();
      if (error) throw error;
      const { data: all } = await supabaseAdmin.from("banners").select("*").order("created_at", { ascending: false });
      return NextResponse.json({ success: true, banner: data, banners: all || [] });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "شناسه الزامی است." }, { status: 400 });

    const { error } = await supabaseAdmin.from("banners").delete().eq("id", id);
    if (error) throw error;

    const { data: all } = await supabaseAdmin.from("banners").select("*").order("created_at", { ascending: false });
    return NextResponse.json({ success: true, banners: all || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
