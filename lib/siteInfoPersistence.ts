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
    const extraIds = sorted.slice(1).map((r: any) => r.id).filter(Boolean);
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
  const prevPersisted = existingRow?.homepage_layout_config?._persisted_identity || {};

  const finalLogoUrl =
    topLevelFields.logo_url !== undefined
      ? String(topLevelFields.logo_url).trim()
      : prevPersisted.logo_url ?? existingRow?.logo_url ?? "";

  const finalFooterLogoUrl =
    topLevelFields.footer_logo_url !== undefined
      ? String(topLevelFields.footer_logo_url).trim()
      : prevPersisted.footer_logo_url ?? existingRow?.footer_logo_url ?? "";

  const finalFaviconUrl =
    topLevelFields.favicon_url !== undefined
      ? String(topLevelFields.favicon_url).trim()
      : prevPersisted.favicon_url ?? existingRow?.favicon_url ?? "/favicon.ico";

  const safeLayout = {
    ...(existingRow?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG),
    ...updatedLayout,
    _persisted_identity: {
      site_name: topLevelFields.site_name || prevPersisted.site_name || "آکسون کور | Axon Core",
      tagline: topLevelFields.tagline ?? prevPersisted.tagline ?? "",
      description: topLevelFields.description ?? prevPersisted.description ?? "",
      footer_text: topLevelFields.footer_text ?? prevPersisted.footer_text ?? "",
      logo_url: finalLogoUrl,
      footer_logo_url: finalFooterLogoUrl,
      favicon_url: finalFaviconUrl,
      phone: topLevelFields.phone || prevPersisted.phone || "09376110200",
      email: topLevelFields.email || prevPersisted.email || "Pouriarahimi@yahoo.com",
      address: topLevelFields.address || prevPersisted.address || "شیراز - ستارخان",
      working_hours:
        topLevelFields.working_hours ||
        prevPersisted.working_hours ||
        "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      header_announcement:
        topLevelFields.header_announcement ?? prevPersisted.header_announcement ?? "",
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
          site_name: safeLayout._persisted_identity.site_name,
          homepage_layout_config: safeLayout,
        })
        .eq("id", r.id);

      try {
        await supabaseAdmin
          .from("site_info")
          .update({
            logo_url: finalLogoUrl,
            favicon_url: finalFaviconUrl,
            updated_at: nowIso,
          })
          .eq("id", r.id);
      } catch {}

      try {
        await supabaseAdmin
          .from("site_info")
          .update({
            footer_logo_url: finalFooterLogoUrl,
          })
          .eq("id", r.id);
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
          site_name: safeLayout._persisted_identity.site_name,
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
