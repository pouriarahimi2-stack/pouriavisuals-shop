// File Path: app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { unpackProductRow, packProductDescription } from "@/lib/productUnpacker";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession(req);
    let query = supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("is_available", true);
    }

    const { data, error } = await query;
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
      stock: numericStock,
      is_available: body.is_available !== false,
      image: primaryImage,
      image_url: primaryImage,
      images: JSON.stringify(imagesList),
      description: packagedDescription,
      short_description: mediaMeta.short_description,
      meta_title: mediaMeta.meta_title,
      meta_description: mediaMeta.meta_description,
      brand: mediaMeta.brand,
      sku: mediaMeta.sku,
      warranty: mediaMeta.warranty,
      specs: JSON.stringify(mediaMeta.specs),
      purchase_price: purchasePrice,
      discount_price: discountPrice,
      tags: Array.isArray(body.tags) ? JSON.stringify(body.tags) : (body.tags || null),
      slug: String(body.slug || "").trim() || null,
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("products")
      .insert(safePayload)
      .select("*")
      .single();

    if (insertErr) throw insertErr;
    return NextResponse.json({ success: true, data: unpackProductRow(inserted) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ثبت محصول." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await verifyAdminSession(req))) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه محصول الزامی است." }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.category !== undefined) updates.category = String(body.category).trim();
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.stock !== undefined) updates.stock = Math.max(0, Number(body.stock));
    if (body.is_available !== undefined) updates.is_available = Boolean(body.is_available);
    if (body.description !== undefined) updates.description = String(body.description);
    if (body.meta_title !== undefined) updates.meta_title = String(body.meta_title);
    if (body.meta_description !== undefined) updates.meta_description = String(body.meta_description);
    if (body.brand !== undefined) updates.brand = String(body.brand);
    if (body.sku !== undefined) updates.sku = String(body.sku);
    if (body.warranty !== undefined) updates.warranty = String(body.warranty);
    if (body.discount_price !== undefined) updates.discount_price = body.discount_price ? Number(body.discount_price) : null;
    if (body.purchase_price !== undefined) updates.purchase_price = Number(body.purchase_price);
    if (Array.isArray(body.images)) updates.images = JSON.stringify(body.images);
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : body.tags;
    if (body.slug !== undefined) updates.slug = String(body.slug).trim() || null;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateErr) throw updateErr;
    return NextResponse.json({ success: true, data: unpackProductRow(updated) });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ویرایش محصول." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await verifyAdminSession(req))) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه محصول الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: "محصول با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در حذف محصول." },
      { status: 500 }
    );
  }
}
