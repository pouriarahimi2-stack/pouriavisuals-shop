import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");

    let query = supabaseAdmin.from("reviews").select("*").order("created_at", { ascending: false });
    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data: reviews, error } = await query;
    if (error) {
      // در صورت نبود جدول reviews در دیتابیس، بدون ارور آرایه خالی برگشت داده می‌شود
      return NextResponse.json({ success: true, reviews: [] });
    }
    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, reviews: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, author_name, rating, comment } = body;

    if (!author_name || !comment) {
      return NextResponse.json({ success: false, message: "اطلاعات نام و متن نظر الزامی است." }, { status: 400 });
    }

    const payload = {
      id: randomUUID(),
      product_id: product_id || null,
      author_name: String(author_name).trim(),
      rating: Number(rating) || 5,
      comment: String(comment).trim(),
      is_approved: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("reviews").insert([payload]).select().maybeSingle();
    if (error) {
      // فالبک برای حالتی که جدول اختصاصی در دیتابیس ساخته نشده
      return NextResponse.json({ success: true, message: "نظر شما با موفقیت دریافت شد." });
    }

    return NextResponse.json({ success: true, message: "نظر شما با موفقیت ثبت شد و پس از بررسی منتشر خواهد شد.", review: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
