import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select("*, products(title)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, reviews: [] });
    }
    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, reviews: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, is_approved } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه دیدگاه الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("reviews")
      .update({ is_approved: Boolean(is_approved) })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "وضعیت دیدگاه تغییر یافت." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه دیدگاه الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "دیدگاه حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
