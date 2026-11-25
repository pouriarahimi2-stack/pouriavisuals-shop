// File Path: app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { sendTextSMS } from "@/lib/otpService";
import { triggerBackInStockNotifications } from "@/lib/backInStockService";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { normalizeSystemSettings } from "@/lib/systemSettings";

export const dynamic = "force-dynamic";

const PERSIAN_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  processing: "در حال پردازش",
  picking: "آماده‌سازی در انبار",
  packing: "در حال بسته‌بندی",
  ready: "آماده تحویل به پست",
  shipped: "تحویل به پست پیشتاز",
  delivered: "تحویل شده به مشتری",
  cancelled: "لغو شده",
};

function extractWalletDeductionFromAddress(addressStr: string): number {
  const match = String(addressStr || "").match(
    /\[کسر از کیف پول:\s*([\d,۰-۹]+)\s*تومان\]/
  );
  if (!match || !match[1]) return 0;
  const englishDigits = match[1]
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/,/g, "")
    .trim();
  const num = Number(englishDigits);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

async function creditCustomerWallet(phone: string, amount: number) {
  const cleanPhone = String(phone || "").replace(/\D/g, "");
  if (!/^09\d{9}$/.test(cleanPhone) || amount <= 0) return;

  const { data: wallet } = await supabaseAdmin
    .from("customer_wallets")
    .select("balance")
    .eq("customer_phone", cleanPhone)
    .maybeSingle();

  const currentBal = Math.max(0, Number(wallet?.balance || 0));
  await supabaseAdmin.from("customer_wallets").upsert(
    [
      {
        customer_phone: cleanPhone,
        balance: currentBal + amount,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "customer_phone" }
  );
}

async function restoreOrderItemsStock(items: any[], orderLabel?: string) {
  if (!Array.isArray(items)) return;
  for (const it of items) {
    const pId = String(it.id || it.productId || it.product_id || "");
    const qty = Math.max(1, Number(it.quantity || 1));
    if (!pId) continue;
    try {
      const { data: pRow } = await supabaseAdmin
        .from("products")
        .select("id, title, name, stock, purchase_price")
        .eq("id", pId)
        .maybeSingle();
      if (pRow) {
        const prevStock = Math.max(0, Number(pRow.stock || 0));
        const nextStock = prevStock + qty;
        await supabaseAdmin
          .from("products")
          .update({
            stock: nextStock,
            is_available: nextStock > 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pRow.id);

        try {
          await supabaseAdmin.from("inventory_logs").insert([
            {
              id: "restock_cancel_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
              product_id: String(pRow.id),
              product_title: pRow.title || pRow.name || it.title || "کالا",
              change_type: "restock",
              quantity: qty,
              cost_price: Number(pRow.purchase_price || 0),
              supplier: "بازگشت خودکار از لغو سفارش",
              reference_note: `عودت به انبار بابت لغو/حذف سفارش ${orderLabel || ""}`.trim(),
              created_at: new Date().toISOString(),
            },
          ]);
        } catch {}

        if (prevStock <= 0 && nextStock > 0) {
          await triggerBackInStockNotifications(
            pRow.id,
            String(pRow.title || pRow.name || it.title || "محصول"),
            nextStock
          );
        }
      }
    } catch {}
  }
}

async function deductOrderItemsStock(items: any[], orderLabel?: string) {
  if (!Array.isArray(items)) return;
  for (const it of items) {
    const pId = String(it.id || it.productId || it.product_id || "");
    const qty = Math.max(1, Number(it.quantity || 1));
    if (!pId) continue;
    try {
      const { data: pRow } = await supabaseAdmin
        .from("products")
        .select("id, title, stock, purchase_price")
        .eq("id", pId)
        .maybeSingle();
      if (pRow) {
        const nextStock = Math.max(0, Number(pRow.stock || 0) - qty);
        await supabaseAdmin
          .from("products")
          .update({
            stock: nextStock,
            is_available: nextStock > 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pRow.id);

        try {
          await supabaseAdmin.from("inventory_logs").insert([
            {
              id: "sale_reopen_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
              product_id: String(pRow.id),
              product_title: pRow.title || it.title || "کالا",
              change_type: "sale",
              quantity: qty,
              cost_price: Number(pRow.purchase_price || 0),
              supplier: "فعال‌سازی مجدد سفارش",
              reference_note: `کسر مجدد بابت تغییر وضعیت سفارش ${orderLabel || ""} از حالت لغو`.trim(),
              created_at: new Date().toISOString(),
            },
          ]);
        } catch {}
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
      return NextResponse.json(
        { success: false, message: "شناسه سفارش الزامی است." },
        { status: 400 }
      );
    }

    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, status, payment_status, items, phone, address, final_amount, total_amount"
      )
      .eq("id", id)
      .maybeSingle();

    const resolvedStatus = status || payment_status;
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (resolvedStatus) {
      updatePayload.status = resolvedStatus;
      if (
        resolvedStatus === "paid" ||
        resolvedStatus === "processing" ||
        resolvedStatus === "shipped" ||
        resolvedStatus === "delivered"
      ) {
        updatePayload.payment_status = "paid";
      }
      if (["picking", "packing", "ready"].includes(resolvedStatus)) {
        updatePayload.status = resolvedStatus;
      }
      if (resolvedStatus === "cancelled") {
        updatePayload.payment_status = "failed";
      }
    }

    if (tracking_code !== undefined) {
      updatePayload.tracking_code = String(tracking_code).trim();
      if (String(tracking_code).trim().length > 0 && !resolvedStatus) {
        updatePayload.status = "shipped";
      }
    }

    const orderLabel = existingOrder?.order_number || existingOrder?.id || String(id);

    // عودت وجه به کیف پول در صورت لغو سفارش توسط مدیر (چه پرداخت کامل و چه پرداخت جزئی کیف پول)
    if (
      resolvedStatus === "cancelled" &&
      existingOrder &&
      existingOrder.status !== "cancelled"
    ) {
      try {
        const walletUsedInOrder = extractWalletDeductionFromAddress(
          existingOrder.address || ""
        );
        const gatewayPaidAmount =
          existingOrder.payment_status === "paid"
            ? Number(existingOrder.final_amount ?? existingOrder.total_amount ?? 0)
            : 0;
        const totalRefund = walletUsedInOrder + gatewayPaidAmount;

        if (totalRefund > 0 && existingOrder.phone) {
          await creditCustomerWallet(existingOrder.phone, totalRefund);
        }
      } catch (walletErr) {
        console.error("خطا در عودت وجه به کیف پول:", walletErr);
      }
    }

    if (
      resolvedStatus === "cancelled" &&
      existingOrder &&
      existingOrder.status !== "cancelled" &&
      Array.isArray(existingOrder.items)
    ) {
      await restoreOrderItemsStock(existingOrder.items, orderLabel);
    }

    if (
      resolvedStatus &&
      resolvedStatus !== "cancelled" &&
      existingOrder &&
      existingOrder.status === "cancelled" &&
      Array.isArray(existingOrder.items)
    ) {
      await deductOrderItemsStock(existingOrder.items, orderLabel);
    }

    const { error } = await supabaseAdmin.from("orders").update(updatePayload).eq("id", id);
    if (error) throw error;

    const targetPhone = phone || existingOrder?.phone || "";
    const cleanPhone = String(targetPhone).replace(/\D/g, "");
    if (cleanPhone.length === 11) {
      try {
        const siteRow = await getMasterSiteInfoRow();
        const sys = normalizeSystemSettings(
          siteRow?.homepage_layout_config || {},
          siteRow
        );
        const storeName = sys.site_name || "آکسون کور";
        const storeDomain = (
          sys.canonicalBaseUrl ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          "https://axoncore.ir"
        )
          .replace(/^https?:\/\//i, "")
          .replace(/\/+$/, "");

        if (tracking_code) {
          await sendTextSMS(
            cleanPhone,
            `${customer_name || "مشتری"} عزیز، سفارش ${orderLabel} تحویل پست شد. کد رهگیری پستی: ${tracking_code} | ${storeDomain}`
          );
        } else if (resolvedStatus) {
          const statusPersian =
            PERSIAN_STATUS_LABELS[resolvedStatus] || resolvedStatus;
          await sendTextSMS(
            cleanPhone,
            `وضعیت سفارش ${orderLabel} در فروشگاه ${storeName} به «${statusPersian}» بروزرسانی شد. | ${storeDomain}`
          );
        }
      } catch {}
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
      return NextResponse.json(
        { success: false, message: "شناسه سفارش الزامی است." },
        { status: 400 }
      );
    }

    const { data: ord } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, status, payment_status, items, phone, address, final_amount, total_amount"
      )
      .eq("id", id)
      .maybeSingle();

    if (
      ord &&
      ord.status !== "cancelled" &&
      ord.status !== "paid" &&
      ord.payment_status !== "paid" &&
      ord.status !== "shipped" &&
      ord.status !== "delivered"
    ) {
      const walletUsed = extractWalletDeductionFromAddress(ord.address || "");
      if (walletUsed > 0 && ord.phone) {
        await creditCustomerWallet(ord.phone, walletUsed);
      }
      if (Array.isArray(ord.items)) {
        await restoreOrderItemsStock(ord.items, ord.order_number || ord.id);
      }
    }

    await supabaseAdmin.from("orders").delete().eq("id", id);
    return NextResponse.json({ success: true, message: "✓ سفارش با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}