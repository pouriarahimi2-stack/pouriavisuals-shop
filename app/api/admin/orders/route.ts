import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set([
  "pending",
  "pending_manual_review",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

function checkAdminAuth(req: NextRequest) {
  const adminToken = req.cookies.get("admin_session_token")?.value;
  return Boolean(adminToken && adminToken.length >= 20);
}

async function logAudit(req: NextRequest, action: string, targetId: string, details: any) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "local";

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_username: "admin",
      action,
      target_resource: `order:${targetId}`,
      details,
      ip_address: clientIp,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[AUDIT_LOG_ERROR]:", err);
  }
}

// ۱. واکشی لیست تمام سفارشات با فیلتر (GET)
export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && VALID_STATUSES.has(status)) {
      query = query.eq("status", status);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در دریافت سفارشات." },
      { status: 500 }
    );
  }
}

// ۲. به‌روزرسانی وضعیت سفارش (PUT / PATCH)
export async function PUT(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, tracking_code } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    if (!status || !VALID_STATUSES.has(status)) {
      return NextResponse.json({ success: false, message: "وضعیت جدید ارسالی معتبر نیست." }, { status: 400 });
    }

    // دریافت وضعیت کنونی جهت مقایسه و کنترل انبار
    const { data: currentOrder, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !currentOrder) {
      return NextResponse.json({ success: false, message: "سفارش مورد نظر یافت نشد." }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (tracking_code !== undefined) {
      updatePayload.tracking_code = tracking_code ? String(tracking_code).trim() : null;
    }

    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // کسر خودکار انبار اگر وضعیت برای اولین بار به paid تغییر پیدا کرد
    if (status === "paid" && currentOrder.status !== "paid" && Array.isArray(currentOrder.items)) {
      for (const item of currentOrder.items) {
        if (item.product_id && item.quantity) {
          try {
            const { data: prod } = await supabaseAdmin
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .single();

            if (prod && typeof prod.stock === "number") {
              const newStock = Math.max(0, prod.stock - Number(item.quantity));
              await supabaseAdmin
                .from("products")
                .update({ stock: newStock })
                .eq("id", item.product_id);
            }
          } catch (stkErr) {
            console.error("[STOCK_DEDUCT_ERROR]:", stkErr);
          }
        }
      }
    }

    await logAudit(req, "UPDATE_ORDER_STATUS", String(id), {
      previous_status: currentOrder.status,
      new_status: status,
      tracking_code: updatePayload.tracking_code,
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: "وضعیت سفارش با موفقیت به‌روزرسانی شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در به‌روزرسانی سفارش." },
      { status: 500 }
    );
  }
}
