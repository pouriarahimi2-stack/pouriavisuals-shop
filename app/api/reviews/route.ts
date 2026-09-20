import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");

    if (supabaseAdmin) {
      let query = supabaseAdmin.from("reviews").select("*").order("created_at", { ascending: false });
      if (productId) query = query.eq("product_id", productId);
      const { data, error } = await query;
      if (!error && data) return NextResponse.json({ success: true, reviews: data });
    }

    return NextResponse.json({ success: true, reviews: [] });
  } catch {
    return NextResponse.json({ success: true, reviews: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, author_name, rating, comment } = body;

    if (!author_name || !comment) {
      return NextResponse.json({ success: false, message: "نام و متن دیدگاه الزامی است." }, { status: 400 });
    }

    const reviewRecord = {
      id: randomUUID(),
      product_id: product_id || null,
      author_name: String(author_name).trim(),
      rating: Number(rating) || 5,
      comment: String(comment).trim(),
      is_approved: true, // تایید مستقیم جهت نمایش در سایت
      created_at: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from("reviews").insert([reviewRecord]);
      } catch (err) {
        // فال‌بک در جدول product_reviews
        try {
          await supabaseAdmin.from("product_reviews").insert([{
            id: reviewRecord.id,
            product_id: reviewRecord.product_id,
            user_name: reviewRecord.author_name,
            rating: reviewRecord.rating,
            comment: reviewRecord.comment,
            created_at: reviewRecord.created_at,
          }]);
        } catch {}
      }
    }

    return NextResponse.json({ success: true, message: "دیدگاه با موفقیت ثبت شد.", review: reviewRecord });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
