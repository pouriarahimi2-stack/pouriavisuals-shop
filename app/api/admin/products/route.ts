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
    const category = body.category || "تجهیزات هوشمند";

    let formattedDescription = body.description || "";
    if (body.colors && Array.isArray(body.colors) && body.colors.length > 0) {
      formattedDescription += "\n\nرنگ‌بندی مجاز: " + body.colors.join("، ");
    }
    if (body.specs && typeof body.specs === "object" && Object.keys(body.specs).length > 0) {
      formattedDescription += "\n\nمشخصات فنی:\n" + Object.entries(body.specs).map(([k, v]) => `• ${k}: ${v}`).join("\n");
    }

    const basePayload: Record<string, any> = {
      id: productId,
      title,
      name: title,
      category,
      price,
      discount_price: discountPrice,
      stock,
      is_available: stock > 0,
      description: formattedDescription,
      image_url: body.image_url || (Array.isArray(body.images) && body.images[0]) || "/placeholder.png",
      updated_at: new Date().toISOString(),
    };

    const fullPayload: Record<string, any> = {
      ...basePayload,
      colors: Array.isArray(body.colors) ? body.colors : [],
      specs: typeof body.specs === "object" && body.specs !== null ? body.specs : {},
    };

    let resultData = null;

    if (body.id) {
      const res = await supabaseAdmin.from("products").update(fullPayload).eq("id", body.id).select().maybeSingle();
      if (res.error) {
        const fallbackRes = await supabaseAdmin.from("products").update(basePayload).eq("id", body.id).select().maybeSingle();
        if (fallbackRes.error) throw fallbackRes.error;
        resultData = fallbackRes.data;
      } else {
        resultData = res.data;
      }
    } else {
      fullPayload.created_at = new Date().toISOString();
      basePayload.created_at = new Date().toISOString();

      const res = await supabaseAdmin.from("products").insert([fullPayload]).select().maybeSingle();
      if (res.error) {
        const fallbackRes = await supabaseAdmin.from("products").insert([basePayload]).select().maybeSingle();
        if (fallbackRes.error) throw fallbackRes.error;
        resultData = fallbackRes.data;
      } else {
        resultData = res.data;
      }
    }

    return NextResponse.json({
      success: true,
      message: "کالا با موفقیت در پایگاه داده ثبت شد.",
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
