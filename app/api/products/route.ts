// File Path: app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { unpackProductRow, packProductDescription } from "@/lib/productUnpacker";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    const unpacked = (data || []).map(unpackProductRow);
    return NextResponse.json(
      { success: true, data: unpacked, products: unpacked },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, data: [], products: [], message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdminSession(req))) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const cleanTitle = String(body.title || body.name || "").trim();

    if (!cleanTitle) {
      return NextResponse.json({ success: false, message: "عنوان کالا الزامی است." }, { status: 400 });
    }

    const rawId = String(body.id || "").trim();
    const productId = UUID_REGEX.test(rawId) ? rawId : randomUUID();

    const rawImages = Array.isArray(body.images)
      ? body.images.map((x: any) => String(x || "").trim()).filter(Boolean)
      : [];

    const primaryImage =
      String(body.image || body.image_url || rawImages[0] || "/placeholder.png").trim() ||
      "/placeholder.png";

    const imagesList = Array.from(new Set([primaryImage, ...rawImages]));

    const basePrice = Math.max(0, Number(body.price || 0));
    const discountPrice =
      body.discountPrice && Number(body.discountPrice) > 0
        ? Number(body.discountPrice)
        : body.discount_price && Number(body.discount_price) > 0
        ? Number(body.discount_price)
        : null;

    const effectivePrice = discountPrice && discountPrice < basePrice ? discountPrice : basePrice;
    const purchasePrice =
      body.purchase_price !== undefined && body.purchase_price !== "" && Number(body.purchase_price) >= 0
        ? Number(body.purchase_price)
        : Math.round(effectivePrice * 0.7);

    const numericStock = body.stock !== undefined ? Math.max(0, Number(body.stock)) : 10;

    const cleanDesc = String(body.description || "")
      .replace(/<!--MEDIA_METADATA:[\s\S]*?-->/g, "")
      .trim();

    const mediaMeta = {
      images: imagesList,
      specs: typeof body.specs === "object" && body.specs ? body.specs : {},
      warranty: String(body.warranty || "۱۸ ماه گارانتی اصالت طلایی").trim(),
      sku: String(body.sku || "SKU-" + productId.slice(-6).toUpperCase()).trim(),
      brand: String(body.brand || "Axon").trim(),
      purchase_price: purchasePrice,
      discount_price: discountPrice,
      meta_title: String(body.meta_title || cleanTitle).trim(),
      meta_description: String(body.meta_description || cleanDesc.slice(0, 155)).trim(),
      short_description: String(body.short_description || cleanDesc.slice(0, 140)).trim(),
    };

    const packagedDescription = packProductDescription(cleanDesc, mediaMeta);

    const safePayload: Record<string, any> = {
      id: productId,
      title: cleanTitle,
      name: cleanTitle,
      category: String(body.category || "کالای دیجیتال").trim(),
      price: basePrice,
      discount_price: discountPrice,
      stock: numericStock,
      is_available: body.is_available !== undefined ? Boolean(body.is_available) : numericStock > 0,
      image_url: primaryImage,
      description: packagedDescription,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    let savedRecord: any = null;

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("products")
        .update(safePayload)
        .eq("id", productId)
        .select()
        .single();
      if (error) throw error;
      savedRecord = data;
    } else {
      safePayload.created_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("products")
        .insert([safePayload])
        .select()
        .single();
      if (error) throw error;
      savedRecord = data;
    }

    const unpacked = unpackProductRow(savedRecord);
    return NextResponse.json({
      success: true,
      data: unpacked,
      product: unpacked,
      message: "✓ محصول با موفقیت در کاتالوگ و انبار ذخیره شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await verifyAdminSession(req))) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه کالا الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "کالا با موفقیت از کاتالوگ حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
