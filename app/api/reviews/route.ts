import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// جدول یکپارچه — تمام نوشتن و خواندن دیدگاه‌ها روی product_reviews انجام می‌شود
// (هم ادمین و هم کاربران عمومی از همین جدول استفاده می‌کنند)
const REVIEWS_TABLE = "product_reviews";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");

    let query = supabaseAdmin
      .from(REVIEWS_TABLE)
      .select("id, product_id, user_name, author_name, rating, comment, is_approved, created_at")
      .order("created_at", { ascending: false });

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Reviews GET error:", error.message);
      return NextResponse.json({ success: true, reviews: [] });
    }

    // نرمال‌سازی فیلد نام نویسنده (ممکنه user_name یا author_name باشه)
    const normalized = (data || []).map((r: any) => ({
      ...r,
      author_name: r.author_name || r.user_name || "کاربر",
    }));

    return NextResponse.json({ success: true, reviews: normalized });
  } catch {
    return NextResponse.json({ success: true, reviews: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, author_name, rating, comment } = body;

    if (!author_name || String(author_name).trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "نام الزامی است (حداقل ۲ نویسه)." },
        { status: 400 }
      );
    }
    if (!comment || String(comment).trim().length < 5) {
      return NextResponse.json(
        { success: false, message: "متن دیدگاه الزامی است (حداقل ۵ نویسه)." },
        { status: 400 }
      );
    }

    const reviewRecord = {
      id:          randomUUID(),
      product_id:  product_id || null,
      user_name:   String(author_name).trim(),
      author_name: String(author_name).trim(),
      rating:      Math.min(5, Math.max(1, Number(rating) || 5)),
      comment:     String(comment).trim(),
      is_approved: false, // نیاز به تایید ادمین دارد
      created_at:  new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from(REVIEWS_TABLE)
      .insert([reviewRecord]);

    if (error) {
      console.error("Review insert error:", error.message);
      return NextResponse.json(
        { success: false, message: "خطا در ثبت دیدگاه در پایگاه داده." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "✓ دیدگاه شما ثبت شد و پس از تایید مدیر نمایش داده می‌شود.",
      review: reviewRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور." },
      { status: 500 }
    );
  }
}
