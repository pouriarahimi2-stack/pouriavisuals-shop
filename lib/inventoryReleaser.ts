// File Path: lib/inventoryReleaser.ts
import { supabaseAdmin } from "@/lib/supabaseServer";
import { triggerBackInStockNotifications } from "@/lib/backInStockService";

let lastSweepTimestamp = 0;
const SWEEP_THROTTLE_MS = 30_000;

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

export async function releaseSinglePendingOrder(
  order: any,
  reasonNote?: string
): Promise<{ releasedItems: number; refundedWallet: number }> {
  let releasedItems = 0;
  let refundedWallet = 0;
  const orderLabel = order.order_number || order.id;

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

          try {
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
                reference_note:
                  reasonNote ||
                  `بازگشت موجودی بابت انقضا/انصراف سفارش پرداخت‌نشده ${orderLabel}`,
                created_at: new Date().toISOString(),
              },
            ]);
          } catch {}

          if (prevStock <= 0 && nextStock > 0) {
            await triggerBackInStockNotifications(
              pRow.id,
              String(pRow.title || pRow.name || item.title || "محصول"),
              nextStock
            );
          }

          releasedItems++;
        }
      } catch {}
    }
  }

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

      refundedWallet = walletUsed;
    } catch {}
  }

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

  await supabaseAdmin
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  return { releasedItems, refundedWallet };
}

export async function releaseExpiredPendingOrders(options?: {
  maxAgeMinutes?: number;
  bypassThrottle?: boolean;
}): Promise<{
  cancelledOrdersCount: number;
  releasedItemsCount: number;
  refundedWalletsCount: number;
}> {
  const now = Date.now();
  if (!options?.bypassThrottle && now - lastSweepTimestamp < SWEEP_THROTTLE_MS) {
    return {
      cancelledOrdersCount: 0,
      releasedItemsCount: 0,
      refundedWalletsCount: 0,
    };
  }
  lastSweepTimestamp = now;

  try {
    if (!supabaseAdmin) {
      return {
        cancelledOrdersCount: 0,
        releasedItemsCount: 0,
        refundedWalletsCount: 0,
      };
    }

    const rawMinutes = Number(options?.maxAgeMinutes ?? 15);
    const effectiveMinutes = options?.bypassThrottle
      ? Math.max(0, rawMinutes)
      : Math.max(5, rawMinutes);
    const cutoffIso = new Date(now - effectiveMinutes * 60 * 1000).toISOString();

    let query = supabaseAdmin
      .from("orders")
      .select("id, order_number, phone, address, coupon_code, items")
      .eq("status", "pending")
      .eq("payment_status", "pending")
      .limit(40);

    if (effectiveMinutes > 0) {
      query = query.lt("created_at", cutoffIso);
    }

    const { data: expiredOrders } = await query;

    if (!expiredOrders || expiredOrders.length === 0) {
      return {
        cancelledOrdersCount: 0,
        releasedItemsCount: 0,
        refundedWalletsCount: 0,
      };
    }

    let releasedItemsCount = 0;
    let refundedWalletsCount = 0;

    for (const order of expiredOrders) {
      const res = await releaseSinglePendingOrder(
        order,
        effectiveMinutes === 0
          ? `آزادسازی دستی رزرو معلق توسط مدیر (${order.order_number || order.id})`
          : undefined
      );
      releasedItemsCount += res.releasedItems;
      if (res.refundedWallet > 0) refundedWalletsCount++;
    }

    return {
      cancelledOrdersCount: expiredOrders.length,
      releasedItemsCount,
      refundedWalletsCount,
    };
  } catch {
    return {
      cancelledOrdersCount: 0,
      releasedItemsCount: 0,
      refundedWalletsCount: 0,
    };
  }
}