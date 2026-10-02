// File Path: app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function unpackProductRow(p: any) {
  let rawDesc = String(p.description || "");
  let meta: Record<string, any> = {};
  const match = rawDesc.match(/<!--MEDIA_METADATA:([\s\S]*?)-->/);
  if (match && match[1]) {
    try {
      meta = JSON.parse(match[1]);
    } catch {}
    rawDesc = rawDesc.replace(/<!--MEDIA_METADATA:[\s\S]*?-->/g, "").trim();
  }

  const primaryImg =
    p.image ||
    p.image_url ||
    (Array.isArray(p.images) && p.images[0]) ||
    (Array.isArray(meta.images) && meta.images[0]) ||
    "/placeholder.png";

  const imagesArr =
    Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : Array.isArray(meta.images) && meta.images.length > 0
      ? meta.images
      : [primaryImg];

  return {
    ...p,
    id: String(p.id),
    title: p.title || p.name || "کالای دیجیتال",
    name: p.name || p.title || "کالای دیجیتال",
    sku: p.sku || meta.sku || ("SKU-" + String(p.id).slice(-6).toUpperCase()),
    brand: p.brand || meta.brand || "Axon",
    category: p.category || "کالای دیجیتال",
    price: Number(p.price || 0),
    discount_price: p.discount_price ? Number(p.discount_price) : null,
    purchase_price: Number(p.purchase_price || meta.purchase_price || Math.round(Number(p.price || 0) * 0.7)),
    stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 10,
    is_available: p.is_available !== false && Number(p.stock ?? 10) > 0,
    image: primaryImg,
    image_url: primaryImg,
    images: imagesArr,
    description: rawDesc,
    warranty: p.warranty || meta.warranty || "۱۸ ماه گارانتی اصالت طلایی",
    specs: (typeof p.specs === "object" && p.specs) || meta.specs || {},
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    const unpacked = (data || []).map(unpackProductRow);
    return NextResponse.json({ success: true, data: unpacked, products: unpacked });
  } catch (err: any) {
    return NextResponse.json({ success: false, data: [], products: [], message: err.message }, { status: 500 });
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

    const primaryImage =
      body.image ||
      body.image_url ||
      (Array.isArray(body.images) && body.images[0]) ||
      "/placeholder.png";

    const imagesList =
      Array.isArray(body.images) && body.images.length > 0
        ? body.images
        : [primaryImage];

    const mediaMeta = {
      images: imagesList,
      specs: typeof body.specs === "object" && body.specs ? body.specs : {},
      warranty: body.warranty || "۱۸ ماه گارانتی اصالت طلایی",
      sku: body.sku || ("SKU-" + productId.slice(-6).toUpperCase()),
      brand: body.brand || "Axon",
      purchase_price: Number(body.purchase_price || Math.round(Number(body.price || 0) * 0.7)),
    };

    const cleanDesc = String(body.description || "")
      .replace(/<!--MEDIA_METADATA:[\s\S]*?-->/g, "")
      .trim();
    const packagedDescription =
      cleanDesc + "\n\n<!--MEDIA_METADATA:" + JSON.stringify(mediaMeta) + "-->";

    const numericStock = body.stock !== undefined ? Math.max(0, Number(body.stock)) : 10;
    const discountPrice =
      body.discountPrice
        ? Number(body.discountPrice)
        : body.discount_price
        ? Number(body.discount_price)
        : null;

    // پی로드 استاندارد سازگار با جدول products دیتابیس
    const safePayload: Record<string, any> = {
      id: productId,
      title: cleanTitle,
      name: cleanTitle,
      category: body.category || "کالای دیجیتال",
      price: Math.max(0, Number(body.price || 0)),
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
      message: "✓ محصول با موفقیت در دیتابیس ذخیره شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
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

    return NextResponse.json({ success: true, message: "کالا با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
