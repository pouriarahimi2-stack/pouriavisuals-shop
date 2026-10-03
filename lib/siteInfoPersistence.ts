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

export async function getMasterSiteInfoRow(): Promise<any> {
  const { data: rows } = await supabaseAdmin.from("site_info").select("*");
  if (!rows || rows.length === 0) return null;

  // مرتب‌سازی دقیق در جاوااسکریپت تا ردیف‌های دارای updated_at=null در PostgreSQL اول قرار نگیرند
  const sorted = [...rows].sort((a: any, b: any) => {
    const tA = new Date(a.updated_at || a.created_at || 0).getTime();
    const tB = new Date(b.updated_at || b.created_at || 0).getTime();
    return tB - tA;
  });

  // حذف خودکار ردیف‌های قدیمی تکراری در صورت وجود بیش از ۱ ردیف
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

  // ذخیره کپی کامل تمام فیلدها در داخل خود JSONB (homepage_layout_config) که ۱۰۰٪ در دیتابیس وجود دارد
  const safeLayout = {
    ...(existingRow?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG),
    ...updatedLayout,
    _persisted_identity: {
      site_name: topLevelFields.site_name || "آکسون کور | Axon Core",
      tagline: topLevelFields.tagline || "",
      description: topLevelFields.description || "",
      footer_text: topLevelFields.footer_text || "",
      logo_url: topLevelFields.logo_url ?? "",
      footer_logo_url: topLevelFields.footer_logo_url ?? "",
      favicon_url: topLevelFields.favicon_url || "/favicon.ico",
      phone: topLevelFields.phone || "09376110200",
      email: topLevelFields.email || "Pouriarahimi@yahoo.com",
      address: topLevelFields.address || "شیراز - ستارخان",
      working_hours: topLevelFields.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      header_announcement: topLevelFields.header_announcement ?? "",
      updated_at: nowIso,
    },
  };

  if (existingRow?.id) {
    // گام ۱: ذخیره تضمینی ستون اصلی homepage_layout_config و site_name
    const { error: coreErr } = await supabaseAdmin
      .from("site_info")
      .update({
        site_name: topLevelFields.site_name || existingRow.site_name || "آکسون کور | Axon Core",
        homepage_layout_config: safeLayout,
      })
      .eq("id", existingRow.id);

    if (coreErr) {
      await supabaseAdmin
        .from("site_info")
        .update({ homepage_layout_config: safeLayout })
        .eq("id", existingRow.id);
    }

    // گام ۲: تلاش برای آپدیت ستون‌های فرعی در صورتی که در جدول SQL وجود داشته باشند
    const optionalCols: Record<string, any> = {
      logo_url: topLevelFields.logo_url,
      footer_logo_url: topLevelFields.footer_logo_url,
      favicon_url: topLevelFields.favicon_url,
      tagline: topLevelFields.tagline,
      description: topLevelFields.description,
      footer_text: topLevelFields.footer_text,
      phone: topLevelFields.phone,
      email: topLevelFields.email,
      address: topLevelFields.address,
      working_hours: topLevelFields.working_hours,
      header_announcement: topLevelFields.header_announcement,
      updated_at: nowIso,
    };

    const { error: fullErr } = await supabaseAdmin
      .from("site_info")
      .update(optionalCols)
      .eq("id", existingRow.id);

    if (fullErr) {
      // اگر برخی ستون‌ها در جدول SQL نبودند، ستون‌های استاندارد موجود را تک‌به‌تک آپدیت کن
      for (const [col, val] of Object.entries(optionalCols)) {
        if (val !== undefined && col in existingRow) {
          try {
            await supabaseAdmin.from("site_info").update({ [col]: val }).eq("id", existingRow.id);
          } catch {}
        }
      }
    }

    return {
      ok: true,
      savedRow: {
        ...existingRow,
        ...topLevelFields,
        homepage_layout_config: safeLayout,
        updated_at: nowIso,
      },
    };
  } else {
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("site_info")
      .insert([
        {
          site_name: topLevelFields.site_name || "آکسون کور | Axon Core",
          homepage_layout_config: safeLayout,
        },
      ])
      .select()
      .maybeSingle();

    return {
      ok: !insErr,
      savedRow: inserted || { ...topLevelFields, homepage_layout_config: safeLayout },
      error: insErr?.message,
    };
  }
}
