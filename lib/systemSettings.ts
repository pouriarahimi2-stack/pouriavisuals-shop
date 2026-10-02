// File Path: lib/systemSettings.ts
export interface SystemSettingsData {
  defaultShippingCost: number;
  freeShippingThreshold: number;
  vatPercent: number;
  allowGuestCheckout: boolean;
  autoSendOrderSms: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  noIndex: boolean;
  disallowRobots: boolean;
}

export function parseExactNum(val: any, fallback: number): number {
  if (val === undefined || val === null || val === "") return fallback;
  const clean = String(val)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/,/g, "")
    .trim();
  if (clean === "") return fallback;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function normalizeSystemSettings(layoutCfg: any): SystemSettingsData {
  const cfg = layoutCfg && typeof layoutCfg === "object" ? layoutCfg : {};
  const sys =
    cfg.system_settings && typeof cfg.system_settings === "object"
      ? cfg.system_settings
      : {};

  return {
    defaultShippingCost: parseExactNum(
      sys.defaultShippingCost ?? cfg.defaultShippingCost ?? cfg.shipping_cost,
      0
    ),
    freeShippingThreshold: parseExactNum(
      sys.freeShippingThreshold ?? cfg.freeShippingThreshold ?? cfg.free_shipping_threshold,
      0
    ),
    vatPercent: parseExactNum(
      sys.vatPercent ?? cfg.vatPercent ?? cfg.tax_percent,
      10
    ),
    allowGuestCheckout:
      typeof sys.allowGuestCheckout === "boolean"
        ? sys.allowGuestCheckout
        : typeof cfg.allowGuestCheckout === "boolean"
        ? cfg.allowGuestCheckout
        : true,
    autoSendOrderSms:
      typeof sys.autoSendOrderSms === "boolean"
        ? sys.autoSendOrderSms
        : typeof cfg.autoSendOrderSms === "boolean"
        ? cfg.autoSendOrderSms
        : true,
    maintenanceMode:
      typeof sys.maintenanceMode === "boolean"
        ? sys.maintenanceMode
        : typeof cfg.maintenanceMode === "boolean"
        ? cfg.maintenanceMode
        : false,
    maintenanceMessage: String(
      sys.maintenanceMessage ??
        cfg.maintenanceMessage ??
        "فروشگاه آکسون در حال بروزرسانی زیرساخت‌های فنی است. به زودی باز می‌گردیم."
    ),
    noIndex:
      typeof sys.noIndex === "boolean"
        ? sys.noIndex
        : typeof sys.disallowRobots === "boolean"
        ? sys.disallowRobots
        : typeof cfg.noIndex === "boolean"
        ? cfg.noIndex
        : false,
    disallowRobots:
      typeof sys.disallowRobots === "boolean"
        ? sys.disallowRobots
        : typeof sys.noIndex === "boolean"
        ? sys.noIndex
        : false,
  };
}
