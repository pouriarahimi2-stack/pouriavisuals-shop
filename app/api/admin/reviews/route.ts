// File Path: app/api/admin/reviews/route.ts
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

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      const fallback = await supabaseAdmin
        .from("product_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      return NextResponse.json({
        success: true,
        reviews: fallback.data || [],
        data: fallback.data || [],
      });
    }

    return NextResponse.json({
      success: true,
      reviews: data || [],
      data: data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: true, reviews: [], data: [], message: err.message });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, is_approved, status, admin_reply, comment } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه دیدگاه الزامی است." }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (is_approved !== undefined) updatePayload.is_approved = Boolean(is_approved);
    if (status !== undefined) updatePayload.status = status;
    if (admin_reply !== undefined) updatePayload.admin_reply = admin_reply;
    if (comment !== undefined) updatePayload.comment = comment;

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      await supabaseAdmin.from("product_reviews").update(updatePayload).eq("id", id);
    }

    return NextResponse.json({
      success: true,
      message: "وضعیت دیدگاه با موفقیت بروزرسانی شد.",
      review: data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
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
    if (error) {
      await supabaseAdmin.from("product_reviews").delete().eq("id", id);
    }

    return NextResponse.json({ success: true, message: "دیدگاه با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
