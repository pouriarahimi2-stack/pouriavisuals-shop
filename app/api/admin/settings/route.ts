// File Path: app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

const DEFAULT_SYSTEM_SETTINGS = {
  maintenance_mode: false,
  maintenance_message: "فروشگاه آکسون در حال بروزرسانی زیرساخت‌های فنی است. به زودی باز می‌گردیم.",
  seo_noindex: false,
  allow_guest_checkout: true,
  sms_notifications_enabled: true,
  default_shipping_cost: 65000,
  free_shipping_threshold: 5000000,
  vat_percent: 10,
};

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data: row } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    const layoutCfg = row?.homepage_layout_config || {};
    const storedCfg = layoutCfg?.auth_security_config?.system_settings || {};

    const isMaint =
      (row?.maintenance_mode && row.maintenance_mode !== "none" && row.maintenance_mode !== "false") ||
      Boolean(storedCfg.maintenance_mode);

    const isNoIndex =
      row?.allow_google_index === false || Boolean(storedCfg.seo_noindex);

    const settings = {
      maintenance_mode: isMaint,
      maintenance_message:
        storedCfg.maintenance_message || DEFAULT_SYSTEM_SETTINGS.maintenance_message,
      seo_noindex: isNoIndex,
      allow_guest_checkout:
        storedCfg.allow_guest_checkout !== undefined
          ? Boolean(storedCfg.allow_guest_checkout)
          : true,
      sms_notifications_enabled:
        storedCfg.sms_notifications_enabled !== undefined
          ? Boolean(storedCfg.sms_notifications_enabled)
          : true,
      default_shipping_cost: Number(
        storedCfg.default_shipping_cost ?? DEFAULT_SYSTEM_SETTINGS.default_shipping_cost
      ),
      free_shipping_threshold: Number(
        storedCfg.free_shipping_threshold ?? DEFAULT_SYSTEM_SETTINGS.free_shipping_threshold
      ),
      vat_percent: Number(storedCfg.vat_percent ?? DEFAULT_SYSTEM_SETTINGS.vat_percent),
    };

    return NextResponse.json({ success: true, settings, data: settings });
  } catch (err: any) {
    return NextResponse.json(
      { success: true, settings: DEFAULT_SYSTEM_SETTINGS, message: err.message },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session: any = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const nextSettings = {
      maintenance_mode: Boolean(body.maintenance_mode),
      maintenance_message: String(
        body.maintenance_message || DEFAULT_SYSTEM_SETTINGS.maintenance_message
      ).trim(),
      seo_noindex: Boolean(body.seo_noindex),
      allow_guest_checkout: body.allow_guest_checkout !== false,
      sms_notifications_enabled: body.sms_notifications_enabled !== false,
      default_shipping_cost: Math.max(0, Number(body.default_shipping_cost ?? 65000)),
      free_shipping_threshold: Math.max(0, Number(body.free_shipping_threshold ?? 5000000)),
      vat_percent: Math.max(0, Math.min(30, Number(body.vat_percent ?? 10))),
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin
      .from("site_info")
      .select("id, homepage_layout_config")
      .limit(1)
      .maybeSingle();

    const prevLayout =
      existing?.homepage_layout_config && typeof existing.homepage_layout_config === "object"
        ? existing.homepage_layout_config
        : {};

    const updatedLayout = {
      ...prevLayout,
      auth_security_config: {
        ...(prevLayout.auth_security_config || {}),
        system_settings: nextSettings,
      },
    };

    if (existing && existing.id) {
      await supabaseAdmin
        .from("site_info")
        .update({
          homepage_layout_config: updatedLayout,
          allow_google_index: !nextSettings.seo_noindex,
          maintenance_mode: nextSettings.maintenance_mode ? "indefinite" : "none",
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("site_info").insert([
        {
          homepage_layout_config: updatedLayout,
          allow_google_index: !nextSettings.seo_noindex,
          maintenance_mode: nextSettings.maintenance_mode ? "indefinite" : "none",
        },
      ]);
    }

    return NextResponse.json({
      success: true,
      settings: nextSettings,
      message: "✓ تنظیمات کلان، وضعیت تعمیرات و ایندکس گوگل با موفقیت در دیتابیس ذخیره شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
