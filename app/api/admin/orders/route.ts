import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

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
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, tracking_code, trackingCode } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    const activeTrackingCode = tracking_code || trackingCode || null;

    // واکشی اطلاعات قبلی سفارش
    const { data: currentOrder } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (!currentOrder) {
      return NextResponse.json({ success: false, message: "سفارش یافت نشد." }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) updatePayload.status = status;
    if (activeTrackingCode !== undefined) {
      updatePayload.tracking_code = activeTrackingCode ? String(activeTrackingCode).trim() : null;
    }

    // در صورت تغییر به لغو شده، اقلام به انبار بازگردانده می‌شوند
    if (status === "cancelled" && currentOrder.status !== "cancelled" && Array.isArray(currentOrder.items)) {
      for (const item of currentOrder.items) {
        try {
          const pId = item.productId || item.id;
          const qty = Number(item.quantity || 1);
          const { data: prod } = await supabaseAdmin.from("products").select("stock").eq("id", pId).single();
          if (prod && prod.stock !== null && prod.stock !== undefined) {
            const restoredStock = Number(prod.stock) + qty;
            await supabaseAdmin.from("products").update({ stock: restoredStock, is_available: true }).eq("id", pId);
          }
        } catch (e) {
          console.warn("Restore stock error:", e);
        }
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "سفارش با موفقیت به‌روزرسانی شد.",
      order: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
