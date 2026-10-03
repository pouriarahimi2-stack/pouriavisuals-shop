// File Path: app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { normalizeSystemSettings, parseExactNum } from "@/lib/systemSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: row } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    const layoutCfg =
      row?.homepage_layout_config && typeof row.homepage_layout_config === "object"
        ? row.homepage_layout_config
        : {};

    const settings = normalizeSystemSettings(layoutCfg);

    return NextResponse.json(
      {
        success: true,
        settings,
        system_settings: settings,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در خواندن تنظیمات سیستم." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const input = body.settings && typeof body.settings === "object" ? body.settings : body;

    const { data: existingRow } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    const currentLayout =
      existingRow?.homepage_layout_config &&
      typeof existingRow.homepage_layout_config === "object"
        ? existingRow.homepage_layout_config
        : {};

    const currentSys = normalizeSystemSettings(currentLayout);

    const updatedSettings = {
      defaultShippingCost: parseExactNum(
        input.defaultShippingCost ?? input.default_shipping_cost ?? input.shippingCost,
        currentSys.defaultShippingCost
      ),
      freeShippingThreshold: parseExactNum(
        input.freeShippingThreshold ?? input.free_shipping_threshold,
        currentSys.freeShippingThreshold
      ),
      vatPercent: parseExactNum(
        input.vatPercent ?? input.vat_percent ?? input.taxPercent,
        currentSys.vatPercent
      ),
      allowGuestCheckout:
        typeof input.allowGuestCheckout === "boolean"
          ? input.allowGuestCheckout
          : typeof input.allow_guest_checkout === "boolean"
          ? input.allow_guest_checkout
          : currentSys.allowGuestCheckout,
      autoSendOrderSms:
        typeof input.autoSendOrderSms === "boolean"
          ? input.autoSendOrderSms
          : typeof input.sms_notifications_enabled === "boolean"
          ? input.sms_notifications_enabled
          : currentSys.autoSendOrderSms,
      maintenanceMode:
        typeof input.maintenanceMode === "boolean"
          ? input.maintenanceMode
          : typeof input.maintenance_mode === "boolean"
          ? input.maintenance_mode
          : currentSys.maintenanceMode,
      maintenanceMessage:
        input.maintenanceMessage !== undefined
          ? String(input.maintenanceMessage).trim()
          : input.maintenance_message !== undefined
          ? String(input.maintenance_message).trim()
          : currentSys.maintenanceMessage,
      noIndex:
        typeof input.noIndex === "boolean"
          ? input.noIndex
          : typeof input.seo_noindex === "boolean"
          ? input.seo_noindex
          : typeof input.disallowRobots === "boolean"
          ? input.disallowRobots
          : currentSys.noIndex,
      disallowRobots:
        typeof input.disallowRobots === "boolean"
          ? input.disallowRobots
          : typeof input.noIndex === "boolean"
          ? input.noIndex
          : typeof input.seo_noindex === "boolean"
          ? input.seo_noindex
          : currentSys.noIndex,
      updatedAt: new Date().toISOString(),
    };

    const nextLayoutConfig = {
      ...currentLayout,
      system_settings: updatedSettings,
      store_settings: updatedSettings,
      defaultShippingCost: updatedSettings.defaultShippingCost,
      freeShippingThreshold: updatedSettings.freeShippingThreshold,
      vatPercent: updatedSettings.vatPercent,
      allowGuestCheckout: updatedSettings.allowGuestCheckout,
      autoSendOrderSms: updatedSettings.autoSendOrderSms,
      maintenanceMode: updatedSettings.maintenanceMode,
      maintenanceMessage: updatedSettings.maintenanceMessage,
      noIndex: updatedSettings.noIndex,
      disallowRobots: updatedSettings.disallowRobots,
    };

    if (existingRow?.id) {
      const { error: fullErr } = await supabaseAdmin
        .from("site_info")
        .update({
          homepage_layout_config: nextLayoutConfig,
          allow_google_index: !updatedSettings.noIndex,
          maintenance_mode: updatedSettings.maintenanceMode ? "indefinite" : "none",
          free_shipping_threshold: updatedSettings.freeShippingThreshold,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRow.id);

      if (fullErr) {
        await supabaseAdmin
          .from("site_info")
          .update({
            homepage_layout_config: nextLayoutConfig,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRow.id);
      }
    } else {
      await supabaseAdmin.from("site_info").insert([
        {
          site_name: "آکسون کور | AXON CORE",
          homepage_layout_config: nextLayoutConfig,
          updated_at: new Date().toISOString(),
        },
      ]);
    }

    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: "UPDATE_SYSTEM_SETTINGS",
          user_id: auth.session?.username || "admin",
          details: {
            resource: "site_info:system_settings",
            updatedSettings,
          },
          ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
          severity: "info",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json(
      {
        success: true,
        settings: updatedSettings,
        system_settings: updatedSettings,
        message: "✓ تنظیمات کلان سیستم ذخیره شد و بلافاصله در سراسر سایت اعمال گردید.",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ذخیره تنظیمات." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
