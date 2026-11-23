// File Path: lib/backInStockService.ts
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { sendTextSMS } from "@/lib/otpService";
import { supabaseAdmin } from "@/lib/supabaseServer";

export interface BackInStockAlertItem {
  id: string;
  productId: string;
  productTitle: string;
  phone: string;
  createdAt: string;
}

export function normalizeIranMobile(raw: any): string {
  const digits = String(raw || "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) return "0" + digits.slice(2);
  if (digits.startsWith("9") && digits.length === 10) return "0" + digits;
  return digits;
}

export async function registerBackInStockAlert(params: {
  productId: string;
  productTitle: string;
  phone: string;
}): Promise<{ success: boolean; message: string; alreadyRegistered?: boolean }> {
  const cleanPhone = normalizeIranMobile(params.phone);
  const productId = String(params.productId || "").trim();
  const productTitle = String(params.productTitle || "کالای دیجیتال").trim();

  if (!productId) {
    return { success: false, message: "شناسه کالا نامعتبر است." };
  }

  if (!/^09\d{9}$/.test(cleanPhone)) {
    return {
      success: false,
      message: "لطفاً شماره موبایل معتبر ۱۱ رقمی (مثال: 09123456789) وارد نمایید.",
    };
  }

  const siteRow = await getMasterSiteInfoRow();
  const layoutCfg = siteRow?.homepage_layout_config || {};
  const alerts: BackInStockAlertItem[] = Array.isArray(layoutCfg.back_in_stock_alerts)
    ? layoutCfg.back_in_stock_alerts
    : [];

  const exists = alerts.some(
    (a) => String(a.productId) === productId && normalizeIranMobile(a.phone) === cleanPhone
  );

  if (exists) {
    return {
      success: true,
      alreadyRegistered: true,
      message:
        "✓ شماره شما قبلاً برای این کالا ثبت شده است. به محض موجود شدن پیامک اطلاع‌رسانی ارسال خواهد شد.",
    };
  }

  alerts.unshift({
    id: "bis_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    productId,
    productTitle,
    phone: cleanPhone,
    createdAt: new Date().toISOString(),
  });

  await saveMasterSiteInfoRow(
    siteRow,
    {
      ...layoutCfg,
      back_in_stock_alerts: alerts.slice(0, 2000),
    },
    {}
  );

  return {
    success: true,
    message:
      "🔔 شماره شما با موفقیت ثبت شد! به محض شارژ موجودی این کالا در انبار، پیامک اطلاع‌رسانی برایتان ارسال می‌شود.",
  };
}

export async function triggerBackInStockNotifications(
  productId: string | number,
  productTitle: string,
  newStock: number
): Promise<number> {
  if (Number(newStock || 0) <= 0) return 0;

  const targetId = String(productId || "").trim();
  if (!targetId) return 0;

  try {
    const siteRow = await getMasterSiteInfoRow();
    const layoutCfg = siteRow?.homepage_layout_config || {};
    const alerts: BackInStockAlertItem[] = Array.isArray(layoutCfg.back_in_stock_alerts)
      ? layoutCfg.back_in_stock_alerts
      : [];

    const matchingAlerts = alerts.filter((a) => String(a.productId) === targetId);
    if (matchingAlerts.length === 0) return 0;

    const remainingAlerts = alerts.filter((a) => String(a.productId) !== targetId);
    const uniquePhones = Array.from(
      new Set(
        matchingAlerts
          .map((a) => normalizeIranMobile(a.phone))
          .filter((p) => /^09\d{9}$/.test(p))
      )
    );

    const safeTitle = String(
      productTitle || matchingAlerts[0]?.productTitle || "محصول منتخب"
    ).trim();

    let sentCount = 0;
    for (const mobile of uniquePhones) {
      try {
        await sendTextSMS(
          mobile,
          `🔔 مژده! کالای «${safeTitle}» مجدداً در فروشگاه آکسون کور موجود شد. همین حالا سفارش دهید: https://axoncore.ir/products/${targetId}`
        );
        sentCount++;
      } catch {}
    }

    await saveMasterSiteInfoRow(
      siteRow,
      {
        ...layoutCfg,
        back_in_stock_alerts: remainingAlerts,
      },
      {}
    );

    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: "BACK_IN_STOCK_SMS_SENT",
          user_id: "system",
          details: {
            productId: targetId,
            productTitle: safeTitle,
            newStock,
            notifiedCount: sentCount,
          },
          ip_address: "127.0.0.1",
          severity: "info",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return sentCount;
  } catch {
    return 0;
  }
}