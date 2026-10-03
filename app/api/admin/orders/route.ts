// File Path: app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { sendTextSMS } from "@/lib/otpService";

export const dynamic = "force-dynamic";

async function restoreOrderItemsStock(items: any[]) {
  if (!Array.isArray(items)) return;
  for (const it of items) {
    const pId = String(it.id || it.productId || it.product_id || "");
    const qty = Math.max(1, Number(it.quantity || 1));
    if (!pId) continue;
    try {
      const { data: pRow } = await supabaseAdmin
        .from("products")
        .select("id, stock")
        .eq("id", pId)
        .maybeSingle();
      if (pRow) {
        const nextStock = Number(pRow.stock || 0) + qty;
        await supabaseAdmin
          .from("products")
          .update({
            stock: nextStock,
            is_available: nextStock > 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pRow.id);
      }
    } catch {}
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, orders: [], data: [] });
    }

    return NextResponse.json({ success: true, orders: orders || [], data: orders || [] });
  } catch {
    return NextResponse.json({ success: false, orders: [], data: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, payment_status, tracking_code, phone, customer_name } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select("id, status, payment_status, items")
      .eq("id", id)
      .maybeSingle();

    const resolvedStatus = status || payment_status;
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (resolvedStatus) {
      updatePayload.status = resolvedStatus;
      if (resolvedStatus === "paid") updatePayload.payment_status = "paid";
      if (resolvedStatus === "cancelled") updatePayload.payment_status = "failed";
    }

    if (tracking_code !== undefined) {
      updatePayload.tracking_code = String(tracking_code).trim();
      if (String(tracking_code).trim().length > 0 && !resolvedStatus) {
        updatePayload.status = "shipped";
      }
    }

    // اگر سفارش برای اولین بار به وضعیت «لغو شده» تغییر یابد، موجودی کالاهای آن به انبار بازگردانده شود
    if (
      resolvedStatus === "cancelled" &&
      existingOrder &&
      existingOrder.status !== "cancelled" &&
      Array.isArray(existingOrder.items)
    ) {
      await restoreOrderItemsStock(existingOrder.items);
    }

    const { error } = await supabaseAdmin.from("orders").update(updatePayload).eq("id", id);
    if (error) throw error;

    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, "");
      if (cleanPhone.length === 11) {
        try {
          if (tracking_code) {
            await sendTextSMS(
              cleanPhone,
              (customer_name || "مشتری") +
                " عزیز، سفارش شما تحویل پست شد. کد رهگیری پستی: " +
                tracking_code +
                " | axoncore.ir"
            );
          } else if (resolvedStatus) {
            await sendTextSMS(
              cleanPhone,
              "وضعیت سفارش شما در فروشگاه آکسون کور به «" +
                resolvedStatus +
                "» بروزرسانی شد. | axoncore.ir"
            );
          }
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      message: "✓ وضعیت سفارش و موجودی انبار با موفقیت در دیتابیس بروزرسانی شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
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
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    const { data: ord } = await supabaseAdmin
      .from("orders")
      .select("id, status, payment_status, items")
      .eq("id", id)
      .maybeSingle();

    if (
      ord &&
      ord.status !== "cancelled" &&
      ord.status !== "paid" &&
      ord.payment_status !== "paid" &&
      ord.status !== "shipped" &&
      ord.status !== "delivered" &&
      Array.isArray(ord.items)
    ) {
      await restoreOrderItemsStock(ord.items);
    }

    await supabaseAdmin.from("orders").delete().eq("id", id);
    return NextResponse.json({ success: true, message: "✓ سفارش با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
