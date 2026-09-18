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

    const productId = body.id && String(body.id).trim().length > 0 ? String(body.id).trim() : randomUUID();
    const price = Number(body.price || 0);
    const discountPrice = body.discount_price ? Number(body.discount_price) : null;
    const stock = body.stock !== undefined ? Number(body.stock) : 10;
    const category = body.category || "عمومی";

    // ذخیره امن تصاویر چندگانه و ویدیو و مشخصات در قالب متادیتای ساختاریافته درون description
    const mediaMeta = {
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : (body.image_url ? [body.image_url] : []),
      video_url: body.video_url || null,
      specs: typeof body.specs === "object" ? body.specs : {},
      warranty: body.warranty || null,
    };

    let baseDescription = String(body.description || "").replace(/<!--MEDIA_METADATA:[\s\S]*?-->/g, "").trim();
    const packagedDescription = baseDescription + "\n\n<!--MEDIA_METADATA:" + JSON.stringify(mediaMeta) + "-->";

    const primaryImage = mediaMeta.images[0] || body.image_url || "/placeholder.png";

    const payload: Record<string, any> = {
      id: productId,
      title,
      name: title,
      category,
      price,
      discount_price: discountPrice,
      stock,
      is_available: stock > 0,
      description: packagedDescription,
      image_url: primaryImage,
      updated_at: new Date().toISOString(),
    };

    let resultData = null;

    if (body.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("products")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;
      resultData = updated;
    } else {
      payload.created_at = new Date().toISOString();
      const { data: inserted, error } = await supabaseAdmin
        .from("products")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      resultData = inserted;
    }

    return NextResponse.json({
      success: true,
      message: "کالا و رسانه‌ها با موفقیت در پایگاه داده ثبت شدند.",
      product: resultData,
    });
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
