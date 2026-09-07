import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { name, id } = await req.json();
    const cleanName = String(name || "").trim();

    if (!cleanName) {
      return NextResponse.json({ success: false, message: "نام دسته‌بندی الزامی است." }, { status: 400 });
    }

    const categoryId = String(id || ("cat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6)));

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert([{ id: categoryId, name: cleanName }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { id, name } = await req.json();
    const cleanName = String(name || "").trim();

    if (!id || !cleanName) {
      return NextResponse.json({ success: false, message: "شناسه و نام جدید الزامی است." }, { status: 400 });
    }

    const { data: oldCat } = await supabaseAdmin
      .from("categories")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from("categories")
      .update({ name: cleanName })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (oldCat?.name) {
      await supabaseAdmin
        .from("products")
        .update({ category: cleanName })
        .eq("category", oldCat.name);
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const name = searchParams.get("name");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه دسته‌بندی الزامی است." }, { status: 400 });
    }

    if (name) {
      await supabaseAdmin
        .from("products")
        .update({ category: "تجهیزات عمومی" })
        .eq("category", name);
    }

    const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "دسته‌بندی با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
