// File Path: lib/siteInfoPersistence.ts
import { supabaseAdmin } from "@/lib/supabaseServer";
import { DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";

export function pickNonEmpty(...vals: any[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) {
      return v.trim();
    }
  }
  return "";
}

export function resolveSafeImageUrl(url: string): string {
  const clean = String(url || "").trim();
  if (!clean) return "";
  if (clean.startsWith("data:") || clean.startsWith("/") || clean.startsWith("blob:")) {
    return clean;
  }
  if (clean.includes(".supabase.co/storage/")) {
    return "/api/media-proxy?url=" + encodeURIComponent(clean);
  }
  return clean;
}

export async function getMasterSiteInfoRow(): Promise<any> {
  const { data: rows } = await supabaseAdmin.from("site_info").select("*");
  if (!rows || rows.length === 0) return null;

  const sorted = [...rows].sort((a: any, b: any) => {
    const tA = new Date(
      a?.homepage_layout_config?._persisted_identity?.updated_at ||
        a.updated_at ||
        a.created_at ||
        0
    ).getTime();
    const tB = new Date(
      b?.homepage_layout_config?._persisted_identity?.updated_at ||
        b.updated_at ||
        b.created_at ||
        0
    ).getTime();
    return tB - tA;
  });

  if (sorted.length > 1) {
    const extraIds = sorted
      .slice(1)
      .map((r: any) => r.id)
      .filter(Boolean);
    if (extraIds.length > 0) {
      try {
        await supabaseAdmin.from("site_info").delete().in("id", extraIds);
      } catch {}
    }
  }

  return sorted[0];
}

export async function saveMasterSiteInfoRow(
  existingRow: any,
  updatedLayout: Record<string, any>,
  topLevelFields: Record<string, any>
): Promise<{ ok: boolean; savedRow: any; error?: string }> {
  const nowIso = new Date().toISOString();
  const prevPersisted =
    existingRow?.homepage_layout_config?._persisted_identity || {};

  const finalLogoUrl =
    topLevelFields.logo_url !== undefined
      ? String(topLevelFields.logo_url).trim()
      : prevPersisted.logo_url ?? "";

  const finalFooterLogoUrl =
    topLevelFields.footer_logo_url !== undefined
      ? String(topLevelFields.footer_logo_url).trim()
      : prevPersisted.footer_logo_url ?? "";

  const finalFaviconUrl =
    topLevelFields.favicon_url !== undefined
      ? String(topLevelFields.favicon_url).trim()
      : prevPersisted.favicon_url ?? "";

  // جلوگیری از کپی شدن چندباره رشته‌های سنگین در زیرشاخه‌های قدیمی
  const cleanUpdatedLayout = { ...updatedLayout };
  if (cleanUpdatedLayout.theme_builder_config?.siteInfo) {
    delete cleanUpdatedLayout.theme_builder_config.siteInfo;
  }

  const safeLayout = {
    ...(existingRow?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG),
    ...cleanUpdatedLayout,
    _persisted_identity: {
      ...prevPersisted,
      site_name:
        topLevelFields.site_name !== undefined
          ? String(topLevelFields.site_name)
          : prevPersisted.site_name ?? "",
      tagline:
        topLevelFields.tagline !== undefined
          ? String(topLevelFields.tagline)
          : prevPersisted.tagline ?? "",
      description:
        topLevelFields.description !== undefined
          ? String(topLevelFields.description)
          : prevPersisted.description ?? "",
      meta_description:
        topLevelFields.meta_description !== undefined
          ? String(topLevelFields.meta_description)
          : prevPersisted.meta_description ?? "",
      meta_keywords:
        topLevelFields.meta_keywords !== undefined
          ? String(topLevelFields.meta_keywords)
          : prevPersisted.meta_keywords ?? "",
      footer_text:
        topLevelFields.footer_text !== undefined
          ? String(topLevelFields.footer_text)
          : prevPersisted.footer_text ?? "",
      logo_url: finalLogoUrl,
      footer_logo_url: finalFooterLogoUrl,
      favicon_url: finalFaviconUrl,
      apple_touch_icon_url:
        topLevelFields.apple_touch_icon_url !== undefined
          ? String(topLevelFields.apple_touch_icon_url).trim()
          : prevPersisted.apple_touch_icon_url ?? finalFaviconUrl,
      og_image_url:
        topLevelFields.og_image_url !== undefined
          ? String(topLevelFields.og_image_url).trim()
          : prevPersisted.og_image_url ?? "",
      phone:
        topLevelFields.phone !== undefined
          ? String(topLevelFields.phone)
          : prevPersisted.phone ?? "",
      mobile_support:
        topLevelFields.mobile_support !== undefined
          ? String(topLevelFields.mobile_support)
          : prevPersisted.mobile_support ?? "",
      email:
        topLevelFields.email !== undefined
          ? String(topLevelFields.email)
          : prevPersisted.email ?? "",
      address:
        topLevelFields.address !== undefined
          ? String(topLevelFields.address)
          : prevPersisted.address ?? "",
      postal_code:
        topLevelFields.postal_code !== undefined
          ? String(topLevelFields.postal_code)
          : prevPersisted.postal_code ?? "",
      working_hours:
        topLevelFields.working_hours !== undefined
          ? String(topLevelFields.working_hours)
          : prevPersisted.working_hours ?? "",
      header_announcement:
        topLevelFields.header_announcement !== undefined
          ? String(topLevelFields.header_announcement)
          : prevPersisted.header_announcement ?? "",
      instagram_url:
        topLevelFields.instagram_url !== undefined
          ? String(topLevelFields.instagram_url)
          : prevPersisted.instagram_url ?? "",
      telegram_url:
        topLevelFields.telegram_url !== undefined
          ? String(topLevelFields.telegram_url)
          : prevPersisted.telegram_url ?? "",
      whatsapp_url:
        topLevelFields.whatsapp_url !== undefined
          ? String(topLevelFields.whatsapp_url)
          : prevPersisted.whatsapp_url ?? "",
      youtube_url:
        topLevelFields.youtube_url !== undefined
          ? String(topLevelFields.youtube_url)
          : prevPersisted.youtube_url ?? "",
      aparat_url:
        topLevelFields.aparat_url !== undefined
          ? String(topLevelFields.aparat_url)
          : prevPersisted.aparat_url ?? "",
      enamad_code:
        topLevelFields.enamad_code !== undefined
          ? String(topLevelFields.enamad_code)
          : prevPersisted.enamad_code ?? "",
      updated_at: nowIso,
    },
  };

  const { data: allRows } = await supabaseAdmin.from("site_info").select("id");

  if (allRows && allRows.length > 0) {
    for (const r of allRows) {
      if (!r?.id) continue;
      await supabaseAdmin
        .from("site_info")
        .update({
          site_name: safeLayout._persisted_identity.site_name || "Axon Core",
          homepage_layout_config: safeLayout,
        })
        .eq("id", r.id);

      // بروزرسانی ایمن ستون‌های سطح اول جدول در صورت وجود در اسکیمای دیتابیس
      const extraColumns: Record<string, any> = { updated_at: nowIso };
      if (safeLayout._persisted_identity.tagline) {
        extraColumns.tagline = safeLayout._persisted_identity.tagline;
      }
      if (safeLayout._persisted_identity.description) {
        extraColumns.description = safeLayout._persisted_identity.description;
      }
      if (finalLogoUrl.length < 500) {
        extraColumns.logo_url = finalLogoUrl;
      }
      if (finalFooterLogoUrl.length < 500) {
        extraColumns.footer_logo_url = finalFooterLogoUrl;
      }
      if (finalFaviconUrl.length < 500) {
        extraColumns.favicon_url = finalFaviconUrl;
      }

      try {
        await supabaseAdmin.from("site_info").update(extraColumns).eq("id", r.id);
      } catch {}
    }

    return {
      ok: true,
      savedRow: {
        ...(existingRow || {}),
        ...safeLayout._persisted_identity,
        homepage_layout_config: safeLayout,
        updated_at: nowIso,
      },
    };
  } else {
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("site_info")
      .insert([
        {
          site_name: safeLayout._persisted_identity.site_name || "Axon Core",
          homepage_layout_config: safeLayout,
        },
      ])
      .select()
      .maybeSingle();

    return {
      ok: !insErr,
      savedRow: inserted || {
        ...safeLayout._persisted_identity,
        homepage_layout_config: safeLayout,
      },
      error: insErr?.message,
    };
  }
}