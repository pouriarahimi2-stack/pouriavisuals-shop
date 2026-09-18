import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, categories: categories || [], data: categories || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name || body.title || "").trim();

    if (!name) {
      return NextResponse.json({ success: false, message: "نام دسته‌بندی الزامی است." }, { status: 400 });
    }

    const slug = String(body.slug || name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload = {
      name,
      title: name,
      slug,
      description: body.description ? String(body.description).trim() : null,
      icon: body.icon || "📁",
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (body.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("categories")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: "دسته‌بندی با موفقیت به‌روزرسانی شد.", category: updated });
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("categories")
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: "دسته‌بندی جدید با موفقیت ایجاد شد.", category: inserted });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }
    if (session.role !== "superadmin") {
      return NextResponse.json({ success: false, message: "تنها مدیر ارشد مجاز به حذف دسته‌بندی است." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه دسته‌بندی الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "دسته‌بندی با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
