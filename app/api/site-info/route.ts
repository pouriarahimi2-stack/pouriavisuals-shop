// File Path: app/api/site-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { normalizeSystemSettings } from "@/lib/systemSettings";

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

    const systemSettings = normalizeSystemSettings(layoutCfg);

    const safeLayoutCfg = { ...layoutCfg };
    if (safeLayoutCfg.auth_security_config) {
      safeLayoutCfg.auth_security_config = {
        userDeck: safeLayoutCfg.auth_security_config.userDeck || { otpLength: 4 },
      };
    }

    const payload = {
      ...(row || {}),
      homepage_layout_config: {
        ...safeLayoutCfg,
        system_settings: systemSettings,
        store_settings: systemSettings,
      },
      settings: systemSettings,
      system_settings: systemSettings,
    };

    return NextResponse.json(
      {
        success: true,
        siteInfo: payload,
        data: payload,
        settings: systemSettings,
        system_settings: systemSettings,
        ...payload,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در دریافت اطلاعات سایت." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
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

    const incomingLayout =
      body.homepage_layout_config && typeof body.homepage_layout_config === "object"
        ? body.homepage_layout_config
        : {};

    const mergedLayout = {
      ...currentLayout,
      ...incomingLayout,
    };

    const updateFields: Record<string, any> = {
      homepage_layout_config: mergedLayout,
      updated_at: new Date().toISOString(),
    };

    const allowedColumns = [
      "site_name",
      "site_description",
      "logo_url",
      "favicon_url",
      "contact_phone",
      "contact_email",
      "contact_address",
      "instagram_url",
      "telegram_url",
      "whatsapp_url",
      "youtube_url",
      "footer_text",
      "enamad_code",
      "working_hours",
    ];

    for (const col of allowedColumns) {
      if (body[col] !== undefined) {
        updateFields[col] = body[col];
      }
    }

    if (existingRow?.id) {
      await supabaseAdmin.from("site_info").update(updateFields).eq("id", existingRow.id);
    } else {
      await supabaseAdmin.from("site_info").insert([updateFields]);
    }

    return NextResponse.json({
      success: true,
      message: "✓ تغییرات سایت با موفقیت ذخیره و منتشر شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در بروزرسانی اطلاعات سایت." },
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
