import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

const ALLOWED_PRODUCT_FIELDS = [
  "title", "name", "title_fa", "sku", "brand", "category", "price",
  "discount_price", "stock", "is_available", "image", "images",
  "description", "warranty", "variants", "specs", "meta_title", "meta_description"
];

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

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
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const title = String(body.title || body.name || "").trim();
    if (!title) {
      return NextResponse.json({ success: false, message: "عنوان کالا الزامی است." }, { status: 400 });
    }

    const payload: Record<string, any> = {
      title,
      name: title,
      price: Number(body.price || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    for (const k of ALLOWED_PRODUCT_FIELDS) {
      if (k in body) payload[k] = body[k];
    }

    const { data: newProd, error } = await supabaseAdmin
      .from("products")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, product: newProd, message: "کالا با موفقیت ایجاد شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه کالا الزامی است." }, { status: 400 });
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const k of ALLOWED_PRODUCT_FIELDS) {
      if (k in body) payload[k] = body[k];
    }

    const { data: updatedProd, error } = await supabaseAdmin
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, product: updatedProd, message: "کالا با موفقیت بروزرسانی شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه کالا الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: "کالا با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
