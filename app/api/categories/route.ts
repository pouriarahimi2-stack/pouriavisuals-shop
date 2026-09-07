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

    // رفع قطعی ارور 23502 با تضمین وجود ID
    const categoryId = String(id || ("cat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6)));

    const payload: Record<string, any> = {
      id: categoryId,
      name: cleanName,
    };

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه دسته‌بندی الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "دسته‌بندی حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
