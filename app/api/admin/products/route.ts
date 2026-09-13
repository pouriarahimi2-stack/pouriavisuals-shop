import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// بررسی نشست معتبر مدیریت
function checkAdminAuth(req: NextRequest) {
  const adminToken = req.cookies.get("admin_session_token")?.value;
  return Boolean(adminToken && adminToken.length >= 20);
}

// ثبت لاگ در جدول امنیتی
async function logAudit(req: NextRequest, action: string, targetId: string, details: any) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "local";

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_username: "admin",
      action,
      target_resource: `product:${targetId}`,
      details,
      ip_address: clientIp,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[AUDIT_LOG_ERROR]:", err);
  }
}

// ۱. ایجاد محصول جدید (POST)
export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, category, price, discount_price, stock, images, description, colors, storage_options } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ success: false, message: "عنوان محصول الزامی است." }, { status: 400 });
    }

    const cleanPrice = Number(price);
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      return NextResponse.json({ success: false, message: "مبلغ محصول نامعتبر است." }, { status: 400 });
    }

    const cleanStock = Number(stock ?? 0);
    if (isNaN(cleanStock) || cleanStock < 0) {
      return NextResponse.json({ success: false, message: "تعداد موجودی انبار نمی‌تواند منفی باشد." }, { status: 400 });
    }

    let cleanDiscountPrice = discount_price !== undefined && discount_price !== null ? Number(discount_price) : null;
    if (cleanDiscountPrice !== null) {
      if (isNaN(cleanDiscountPrice) || cleanDiscountPrice < 0 || cleanDiscountPrice > cleanPrice) {
        return NextResponse.json({ success: false, message: "قیمت با تخفیف نامعتبر یا بیشتر از قیمت اصلی است." }, { status: 400 });
      }
    }

    const productPayload = {
      title: title.trim(),
      category: category || "general",
      price: cleanPrice,
      discount_price: cleanDiscountPrice,
      stock: cleanStock,
      images: Array.isArray(images) ? images : [],
      description: description || "",
      colors: Array.isArray(colors) ? colors : [],
      storage_options: Array.isArray(storage_options) ? storage_options : [],
      updated_at: new Date().toISOString(),
    };

    const { data: newProd, error } = await supabaseAdmin
      .from("products")
      .insert(productPayload)
      .select()
      .single();

    if (error) throw error;

    await logAudit(req, "CREATE_PRODUCT", String(newProd.id), { title: newProd.title, price: cleanPrice });

    return NextResponse.json({
      success: true,
      product: newProd,
      message: "محصول جدید با موفقیت به کاتالوگ اضافه شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در ثبت محصول." }, { status: 500 });
  }
}

// ۲. ویرایش محصول موجود (PUT)
export async function PUT(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه محصول الزامی است." }, { status: 400 });
    }

    // اعتبارسنجی مقادیر عددی در صورت ارسال در آپدیت
    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
      if (isNaN(updates.price) || updates.price < 0) {
        return NextResponse.json({ success: false, message: "قیمت جدید نامعتبر است." }, { status: 400 });
      }
    }

    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);
      if (isNaN(updates.stock) || updates.stock < 0) {
        return NextResponse.json({ success: false, message: "موجودی انبار نامعتبر است." }, { status: 400 });
      }
    }

    if (updates.discount_price !== undefined && updates.discount_price !== null) {
      updates.discount_price = Number(updates.discount_price);
      if (isNaN(updates.discount_price) || updates.discount_price < 0) {
        return NextResponse.json({ success: false, message: "قیمت تخفیف‌خورده نامعتبر است." }, { status: 400 });
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: updatedProd, error } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAudit(req, "UPDATE_PRODUCT", String(id), { updates });

    return NextResponse.json({
      success: true,
      product: updatedProd,
      message: "مشخصات محصول با موفقیت به‌روزرسانی شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در ویرایش محصول." }, { status: 500 });
  }
}

// ۳. حذف محصول (DELETE)
export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه محصول ارائه نشده است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;

    await logAudit(req, "DELETE_PRODUCT", String(id), { deleted_at: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      message: "محصول با موفقیت از انبار حذف گردید.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در حذف محصول." }, { status: 500 });
  }
}
