import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { data: reviews, error } = await supabaseAdmin
      .from("product_reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, reviews: [] });
    }

    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { user_name, rating, comment } = body;

    if (!user_name || !comment || !rating) {
      return NextResponse.json({ success: false, message: "اطلاعات نظر ناقص است." }, { status: 400 });
    }

    const newReview = {
      id: randomUUID(),
      product_id: id,
      user_name: user_name.trim(),
      rating: Number(rating) || 5,
      comment: comment.trim(),
      created_at: new Date().toISOString(),
    };

    try {
      await supabaseAdmin.from("product_reviews").insert([newReview]);
    } catch (e) {}

    return NextResponse.json({ success: true, review: newReview, message: "دیدگاه شما با موفقیت ثبت شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
