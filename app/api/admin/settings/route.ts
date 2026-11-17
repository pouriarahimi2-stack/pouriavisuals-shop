// File Path: app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { normalizeSystemSettings, parseExactNum } from "@/lib/systemSettings";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { logAuditEvent, getClientIp } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = await getMasterSiteInfoRow();
    const layoutCfg =
      row?.homepage_layout_config && typeof row.homepage_layout_config === "object"
        ? row.homepage_layout_config
        : {};

    const settings = normalizeSystemSettings(layoutCfg, row);

    return NextResponse.json(
      {
        success: true,
        settings,
        system_settings: settings,
        seo_identity: {
          site_name: settings.site_name,
          tagline: settings.tagline,
          description: settings.description,
          meta_description: settings.meta_description,
          meta_keywords: settings.metaKeywords,
          googleSiteVerification: settings.googleSiteVerification,
          canonicalBaseUrl: settings.canonicalBaseUrl,
          enamadCode: settings.enamadCode,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "خطا در خواندن تنظیمات کلان سیستم.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const input =
      body.settings && typeof body.settings === "object" ? body.settings : body;

    const existingRow = await getMasterSiteInfoRow();
    const currentLayout =
      existingRow?.homepage_layout_config &&
      typeof existingRow.homepage_layout_config === "object"
        ? existingRow.homepage_layout_config
        : {};

    const currentSys = normalizeSystemSettings(currentLayout, existingRow);
    const nowIso = new Date().toISOString();

    const noIndexBool =
      typeof input.noIndex === "boolean"
        ? input.noIndex
        : typeof input.seo_noindex === "boolean"
        ? input.seo_noindex
        : typeof input.disallowRobots === "boolean"
        ? input.disallowRobots
        : currentSys.noIndex;

    const updatedSettings = {
      defaultShippingCost: parseExactNum(
        input.defaultShippingCost ??
          input.default_shipping_cost ??
          input.shippingCost,
        currentSys.defaultShippingCost
      ),
      postShippingCost: parseExactNum(
        input.postShippingCost ?? input.post_shipping_cost,
        currentSys.postShippingCost
      ),
      tipaxShippingCost: parseExactNum(
        input.tipaxShippingCost ?? input.tipax_shipping_cost,
        currentSys.tipaxShippingCost
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
      codEnabled:
        typeof input.codEnabled === "boolean"
          ? input.codEnabled
          : currentSys.codEnabled,
      supportCardNumber:
        input.supportCardNumber !== undefined
          ? String(input.supportCardNumber).trim()
          : currentSys.supportCardNumber,
      supportCardHolder:
        input.supportCardHolder !== undefined
          ? String(input.supportCardHolder).trim()
          : currentSys.supportCardHolder,
      currencyLabel:
        input.currencyLabel !== undefined
          ? String(input.currencyLabel).trim() || "تومان"
          : currentSys.currencyLabel,

      maintenanceMode:
        typeof input.maintenanceMode === "boolean"
          ? input.maintenanceMode
          : typeof input.maintenance_mode === "boolean"
          ? input.maintenance_mode
          : currentSys.maintenanceMode,
      maintenanceAdminBypass:
        typeof input.maintenanceAdminBypass === "boolean"
          ? input.maintenanceAdminBypass
          : currentSys.maintenanceAdminBypass,
      maintenanceTitle:
        input.maintenanceTitle !== undefined
          ? String(input.maintenanceTitle).trim()
          : currentSys.maintenanceTitle,
      maintenanceMessage:
        input.maintenanceMessage !== undefined
          ? String(input.maintenanceMessage).trim()
          : input.maintenance_message !== undefined
          ? String(input.maintenance_message).trim()
          : currentSys.maintenanceMessage,
      maintenanceEndTime:
        input.maintenanceEndTime !== undefined
          ? String(input.maintenanceEndTime).trim()
          : currentSys.maintenanceEndTime,

      noIndex: noIndexBool,
      disallowRobots:
        typeof input.disallowRobots === "boolean"
          ? input.disallowRobots
          : noIndexBool,
      canonicalBaseUrl:
        input.canonicalBaseUrl !== undefined
          ? String(input.canonicalBaseUrl).trim().replace(/\/+$/, "") ||
            "https://axoncore.ir"
          : currentSys.canonicalBaseUrl,
      googleSiteVerification:
        input.googleSiteVerification !== undefined
          ? String(input.googleSiteVerification).trim()
          : currentSys.googleSiteVerification,
      enamadCode:
        input.enamadCode !== undefined
          ? String(input.enamadCode).trim()
          : currentSys.enamadCode,
      metaKeywords:
        input.metaKeywords !== undefined
          ? String(input.metaKeywords).trim()
          : currentSys.metaKeywords,

      site_name:
        input.site_name !== undefined
          ? String(input.site_name).trim()
          : currentSys.site_name,
      tagline:
        input.tagline !== undefined
          ? String(input.tagline).trim()
          : currentSys.tagline,
      description:
        input.description !== undefined
          ? String(input.description).trim()
          : currentSys.description,
      meta_description:
        input.meta_description !== undefined
          ? String(input.meta_description).trim()
          : currentSys.meta_description,
      logo_url:
        input.logo_url !== undefined
          ? String(input.logo_url).trim()
          : currentSys.logo_url,
      footer_logo_url:
        input.footer_logo_url !== undefined
          ? String(input.footer_logo_url).trim()
          : currentSys.footer_logo_url,
      favicon_url:
        input.favicon_url !== undefined
          ? String(input.favicon_url).trim() || "/favicon.ico"
          : currentSys.favicon_url,
      apple_touch_icon_url:
        input.apple_touch_icon_url !== undefined
          ? String(input.apple_touch_icon_url).trim()
          : currentSys.apple_touch_icon_url,
      og_image_url:
        input.og_image_url !== undefined
          ? String(input.og_image_url).trim()
          : currentSys.og_image_url,
      header_announcement:
        input.header_announcement !== undefined
          ? String(input.header_announcement).trim()
          : currentSys.header_announcement,
      header_announcement_enabled:
        typeof input.header_announcement_enabled === "boolean"
          ? input.header_announcement_enabled
          : currentSys.header_announcement_enabled,
      footer_text:
        input.footer_text !== undefined
          ? String(input.footer_text).trim()
          : currentSys.footer_text,

      phone:
        input.phone !== undefined
          ? String(input.phone).trim()
          : currentSys.phone,
      mobile_support:
        input.mobile_support !== undefined
          ? String(input.mobile_support).trim()
          : currentSys.mobile_support,
      email:
        input.email !== undefined
          ? String(input.email).trim()
          : currentSys.email,
      address:
        input.address !== undefined
          ? String(input.address).trim()
          : currentSys.address,
      postal_code:
        input.postal_code !== undefined
          ? String(input.postal_code).trim()
          : currentSys.postal_code,
      working_hours:
        input.working_hours !== undefined
          ? String(input.working_hours).trim()
          : currentSys.working_hours,
      instagram_url:
        input.instagram_url !== undefined
          ? String(input.instagram_url).trim()
          : currentSys.instagram_url,
      telegram_url:
        input.telegram_url !== undefined
          ? String(input.telegram_url).trim()
          : currentSys.telegram_url,
      whatsapp_url:
        input.whatsapp_url !== undefined
          ? String(input.whatsapp_url).trim()
          : currentSys.whatsapp_url,
      youtube_url:
        input.youtube_url !== undefined
          ? String(input.youtube_url).trim()
          : currentSys.youtube_url,
      aparat_url:
        input.aparat_url !== undefined
          ? String(input.aparat_url).trim()
          : currentSys.aparat_url,

      smartSliderEnabled:
        typeof input.smartSliderEnabled === "boolean"
          ? input.smartSliderEnabled
          : currentSys.smartSliderEnabled,
      floatingChatEnabled:
        typeof input.floatingChatEnabled === "boolean"
          ? input.floatingChatEnabled
          : currentSys.floatingChatEnabled,
      updatedAt: nowIso,
    };

    const prevTb = currentLayout.theme_builder_config || {};
    const prevHeader = prevTb.globalHeader || {};
    const prevFooter = prevTb.globalFooter || {};
    const prevSeoTech = currentLayout.seo_technical_config || {};

    // همگام‌سازی کامل با استودیوی ظاهر، هدر، فوتر و سئو تکنیکال
    const nextLayoutConfig = {
      ...currentLayout,
      system_settings: updatedSettings,
      store_settings: updatedSettings,
      defaultShippingCost: updatedSettings.defaultShippingCost,
      postShippingCost: updatedSettings.postShippingCost,
      tipaxShippingCost: updatedSettings.tipaxShippingCost,
      freeShippingThreshold: updatedSettings.freeShippingThreshold,
      vatPercent: updatedSettings.vatPercent,
      allowGuestCheckout: updatedSettings.allowGuestCheckout,
      autoSendOrderSms: updatedSettings.autoSendOrderSms,
      maintenanceMode: updatedSettings.maintenanceMode,
      maintenanceMessage: updatedSettings.maintenanceMessage,
      noIndex: updatedSettings.noIndex,
      disallowRobots: updatedSettings.disallowRobots,
      seo_technical_config: {
        ...prevSeoTech,
        allowGoogleIndex: !updatedSettings.noIndex,
        canonicalBaseUrl: updatedSettings.canonicalBaseUrl,
        googleSiteVerification: updatedSettings.googleSiteVerification,
      },
      theme_builder_config: {
        ...prevTb,
        globalHeader: {
          ...prevHeader,
          brandName: updatedSettings.site_name,
          logoUrl: updatedSettings.logo_url,
          faviconUrl: updatedSettings.favicon_url,
          announcementText: updatedSettings.header_announcement,
          showAnnouncement: updatedSettings.header_announcement_enabled,
        },
        globalFooter: {
          ...prevFooter,
          footerLogoUrl: updatedSettings.footer_logo_url,
          brandSubtitle: updatedSettings.tagline,
          brandDescription: updatedSettings.description,
          copyright: updatedSettings.footer_text,
          supportPhone: updatedSettings.phone,
          supportEmail: updatedSettings.email,
          warehouseAddress: updatedSettings.address,
          workingHours: updatedSettings.working_hours,
        },
      },
    };

    const topLevelFields = {
      site_name: updatedSettings.site_name,
      tagline: updatedSettings.tagline,
      description: updatedSettings.description,
      meta_description: updatedSettings.meta_description,
      meta_keywords: updatedSettings.metaKeywords,
      footer_text: updatedSettings.footer_text,
      logo_url: updatedSettings.logo_url,
      footer_logo_url: updatedSettings.footer_logo_url,
      favicon_url: updatedSettings.favicon_url,
      apple_touch_icon_url: updatedSettings.apple_touch_icon_url,
      og_image_url: updatedSettings.og_image_url,
      phone: updatedSettings.phone,
      mobile_support: updatedSettings.mobile_support,
      email: updatedSettings.email,
      address: updatedSettings.address,
      postal_code: updatedSettings.postal_code,
      working_hours: updatedSettings.working_hours,
      header_announcement: updatedSettings.header_announcement,
      instagram_url: updatedSettings.instagram_url,
      telegram_url: updatedSettings.telegram_url,
      whatsapp_url: updatedSettings.whatsapp_url,
      youtube_url: updatedSettings.youtube_url,
      aparat_url: updatedSettings.aparat_url,
      enamad_code: updatedSettings.enamadCode,
    };

    const { savedRow } = await saveMasterSiteInfoRow(
      existingRow,
      nextLayoutConfig,
      topLevelFields
    );

    // بروزرسانی ستون‌های سطح اول جدول site_info در صورت وجود در اسکیما
    if (savedRow?.id || existingRow?.id) {
      const targetId = savedRow?.id || existingRow?.id;
      try {
        await supabaseAdmin
          .from("site_info")
          .update({
            allow_google_index: !updatedSettings.noIndex,
            maintenance_mode: updatedSettings.maintenanceMode
              ? "indefinite"
              : "none",
            free_shipping_threshold: updatedSettings.freeShippingThreshold,
          })
          .eq("id", targetId);
      } catch {}
    }

    await logAuditEvent({
      action: "UPDATE_SYSTEM_SETTINGS",
      target_resource: "site_info:system_settings",
      admin_username: auth.session?.username || "admin",
      ip_address: getClientIp(req),
      details: {
        maintenanceMode: updatedSettings.maintenanceMode,
        noIndex: updatedSettings.noIndex,
        postShippingCost: updatedSettings.postShippingCost,
        tipaxShippingCost: updatedSettings.tipaxShippingCost,
        site_name: updatedSettings.site_name,
      },
    });

    return NextResponse.json(
      {
        success: true,
        settings: updatedSettings,
        system_settings: updatedSettings,
        message:
          "✓ تنظیمات کلان سیستم، هویت بصری، سئو و قوانین لجستیک با موفقیت ذخیره و در سراسر سایت اعمال گردید.",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ذخیره تنظیمات کلان." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}