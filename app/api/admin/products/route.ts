import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, products: products || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const title = String(body.title || "").trim();

    if (!title) {
      return NextResponse.json({ success: false, message: "نام کالا الزامی است." }, { status: 400 });
    }

    // تولید امن شناسه یکتا در صورت عدم وجود جهت جلوگیری از ارور NOT-NULL constraint
    const productId = body.id && String(body.id).trim().length > 0 ? String(body.id).trim() : randomUUID();

    const price = Number(body.price || 0);
    const discountPrice = body.discount_price ? Number(body.discount_price) : (body.discountPrice ? Number(body.discountPrice) : null);
    const stock = body.stock !== undefined ? Number(body.stock) : 10;

    const payload: Record<string, any> = {
      id: productId,
      title,
      name: title,
      category: body.category || "متفرقه",
      price,
      discount_price: discountPrice,
      stock,
      is_available: stock > 0,
      description: body.description || "",
      images: Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []),
      image_url: body.image_url || (Array.isArray(body.images) && body.images[0]) || "/placeholder.png",
      colors: Array.isArray(body.colors) ? body.colors : [],
      specs: typeof body.specs === "object" && body.specs !== null ? body.specs : {},
      updated_at: new Date().toISOString(),
    };

    if (body.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("products")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: "کالا به‌روزرسانی شد.", product: updated });
    } else {
      payload.created_at = new Date().toISOString();
      const { data: inserted, error } = await supabaseAdmin
        .from("products")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: "کالا با موفقیت ذخیره شد.", product: inserted });
    }
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
      return NextResponse.json({ success: false, message: "شناسه کالا الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "کالا حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
