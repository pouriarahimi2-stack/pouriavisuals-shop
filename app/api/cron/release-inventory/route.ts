// File Path: app/api/cron/release-inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { triggerBackInStockNotifications } from "@/lib/backInStockService";

export const dynamic = "force-dynamic";

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

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret =
      process.env.CRON_SECRET || process.env.ADMIN_SESSION_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    const { data: expiredOrders } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, phone, address, coupon_code, items")
      .eq("status", "pending")
      .eq("payment_status", "pending")
      .lt("created_at", twentyMinsAgo);

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "سفارش منقضی‌شده‌ای یافت نشد.",
      });
    }

    let releasedItemsCount = 0;
    let refundedWalletsCount = 0;

    for (const order of expiredOrders) {
      const orderLabel = order.order_number || order.id;

      // ۱. بازگرداندن موجودی کالاها به انبار و فعال‌سازی مجدد موجودی
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const prodId = String(
            item.id || item.productId || item.product_id || ""
          ).trim();
          const qty = Math.max(1, Number(item.quantity || 1));
          if (!prodId) continue;

          try {
            const { data: pRow } = await supabaseAdmin
              .from("products")
              .select("id, title, name, stock, purchase_price, price")
              .eq("id", prodId)
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

              await supabaseAdmin.from("inventory_logs").insert([
                {
                  id:
                    "rel_" +
                    Date.now() +
                    "_" +
                    Math.random().toString(36).slice(2, 6),
                  product_id: String(pRow.id),
                  product_title: String(
                    pRow.title || pRow.name || item.title || "کالا"
                  ),
                  change_type: "adjustment",
                  quantity: qty,
                  cost_price: Number(
                    pRow.purchase_price ||
                      Math.round(Number(pRow.price || 0) * 0.7)
                  ),
                  supplier: "آزادسازی خودکار رزرو",
                  reference_note: `بازگشت موجودی بابت انقضای سفارش پرداخت‌نشده ${orderLabel}`,
                  created_at: new Date().toISOString(),
                },
              ]);

              if (prevStock <= 0 && nextStock > 0) {
                await triggerBackInStockNotifications(
                  pRow.id,
                  String(pRow.title || pRow.name || item.title || "محصول"),
                  nextStock
                );
              }

              releasedItemsCount++;
            }
          } catch {}
        }
      }

      // ۲. بازگرداندن اعتبار کیف پول کسرشده در صورت انقضای پرداخت بانکی
      const walletUsed = extractWalletDeductionFromAddress(order.address || "");
      const cleanPhone = String(order.phone || "").replace(/\D/g, "");
      if (walletUsed > 0 && /^09\d{9}$/.test(cleanPhone)) {
        try {
          const { data: walletRow } = await supabaseAdmin
            .from("customer_wallets")
            .select("balance")
            .eq("customer_phone", cleanPhone)
            .maybeSingle();

          const currentBal = Math.max(0, Number(walletRow?.balance || 0));
          const refundedBal = currentBal + walletUsed;

          await supabaseAdmin.from("customer_wallets").upsert(
            [
              {
                customer_phone: cleanPhone,
                balance: refundedBal,
                updated_at: new Date().toISOString(),
              },
            ],
            { onConflict: "customer_phone" }
          );

          await supabaseAdmin.from("admin_audit_logs").insert([
            {
              action: "WALLET_REFUND_ON_EXPIRED_ORDER",
              user_id: cleanPhone,
              details: {
                orderId: order.id,
                orderNumber: orderLabel,
                refundedAmount: walletUsed,
                newWalletBalance: refundedBal,
              },
              ip_address: "127.0.0.1",
              severity: "info",
              created_at: new Date().toISOString(),
            },
          ]);

          refundedWalletsCount++;
        } catch {}
      }

      // ۳. آزادسازی ظرفیت کد تخفیف استفاده‌شده
      if (order.coupon_code) {
        try {
          const { data: cpn } = await supabaseAdmin
            .from("coupons")
            .select("id, used_count, times_used")
            .eq("code", order.coupon_code)
            .maybeSingle();
          if (cpn) {
            const nextUsed = Math.max(
              0,
              Number(cpn.used_count ?? cpn.times_used ?? 1) - 1
            );
            await supabaseAdmin
              .from("coupons")
              .update({ used_count: nextUsed, times_used: nextUsed })
              .eq("id", cpn.id);
          }
        } catch {}
      }

      // ۴. لغو سفارش منقضی‌شده
      await supabaseAdmin
        .from("orders")
        .update({
          status: "cancelled",
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
    }

    return NextResponse.json({
      success: true,
      message: `تعداد ${expiredOrders.length} سفارش منقضی لغو شد، موجودی ${releasedItemsCount} قلم کالا بازگشت و ${refundedWalletsCount} کیف پول بازپرداخت گردید.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}