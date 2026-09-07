import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

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

    const body = await req.json();
    const cleanTitle = String(body.title || body.name || "").trim();

    if (!cleanTitle) {
      return NextResponse.json({ success: false, message: "عنوان کالا الزامی است." }, { status: 400 });
    }

    const productId = String(body.id || ("prod_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7)));

    // رفع قطعی ارور 23502: تضمین ارسال همزمان name و title
    const payload: Record<string, any> = {
      id: productId,
      name: cleanTitle,
      title: cleanTitle,
      title_fa: body.title_fa || cleanTitle,
      sku: body.sku || ("SKU-" + productId.slice(-6).toUpperCase()),
      brand: body.brand || "Apple",
      category: body.category || "تجهیزات تخصصی",
      price: Number(body.price || 0),
      discount_price: body.discountPrice ? Number(body.discountPrice) : (body.discount_price ? Number(body.discount_price) : null),
      stock: body.stock !== undefined ? Number(body.stock) : 10,
      is_available: body.isAvailable ?? body.is_available ?? true,
      image: body.image || (body.images && body.images[0]) || null,
      images: body.images || [],
      description: body.description || null,
      warranty: body.warranty || "گارانتی اصالت طلایی",
      variants: body.variants || [],
      specs: body.specs || {},
      meta_title: body.meta_title || cleanTitle,
      meta_description: body.meta_description || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("products")
        .update(payload)
        .eq("id", productId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("products")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
  } catch (err: any) {
    console.error("API product save error:", err);
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
      return NextResponse.json({ success: false, message: "شناسه کالا الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "کالا با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
