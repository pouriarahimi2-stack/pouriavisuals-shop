// File Path: app/actions/siteInfo.ts
"use server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { revalidatePath } from "next/cache";

export async function getSiteInfoServer(): Promise<SiteInfo> {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        site_name: "آکسون | Axon",
        siteName: "آکسون | Axon",
        storeName: "آکسون | Axon",
        tagline: "مرجع تخصصی تجهیزات تصویر، مانیتور و استودیو",
        allow_google_index: true,
        allowGoogleIndex: true,
        maintenance_mode: "none",
      };
    }

    const isAllowed = data.allow_google_index !== false && data.allowGoogleIndex !== false;

    return {
      id: data.id,
      site_name: data.site_name || data.store_name || "آکسون | Axon",
      siteName: data.site_name || data.store_name || "آکسون | Axon",
      storeName: data.site_name || data.store_name || "آکسون | Axon",
      tagline: data.tagline || "",
      logo_url: data.logo_url || "",
      logoUrl: data.logo_url || "",
      footer_logo_url: data.footer_logo_url || "",
      footerLogoUrl: data.footer_logo_url || "",
      active_font_id: data.active_font_id || "Vazirmatn",
      aboutText: data.about_text || data.description || "",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      working_hours: data.working_hours || "",
      instagram: data.instagram || "",
      telegram: data.telegram || "",
      whatsapp: data.whatsapp || "",
      youtube: data.youtube || "",
      header_announcement: data.header_announcement || "",
      free_shipping_threshold: Number(data.free_shipping_threshold || 2000000),
      allow_google_index: isAllowed,
      allowGoogleIndex: isAllowed,
      maintenance_mode: (data.maintenance_mode as MaintenanceMode) || (isAllowed ? "none" : "indefinite"),
      maintenance_until: data.maintenance_until || undefined,
      maintenance_duration_minutes: data.maintenance_duration_minutes ? Number(data.maintenance_duration_minutes) : undefined,
    };
  } catch (err) {
    console.error("Error in getSiteInfoServer:", err);
    return { site_name: "آکسون | Axon", allow_google_index: true, allowGoogleIndex: true, maintenance_mode: "none" };
  }
}

export async function updateSiteInfoServer(info: Partial<SiteInfo>) {
  try {
    const sName = info.site_name || info.siteName || info.storeName || "آکسون | Axon";
    const isAllowed =
      info.allow_google_index !== undefined
        ? info.allow_google_index
        : info.allowGoogleIndex !== undefined
        ? info.allowGoogleIndex
        : info.maintenance_mode === "none";

    const { data: existingRecords } = await supabaseAdmin
      .from("site_info")
      .select("id")
      .limit(1);

    const existingId = existingRecords && existingRecords.length > 0 ? existingRecords[0].id : null;

    const payload: Record<string, any> = {
      site_name: sName,
      store_name: sName,
      tagline: info.tagline || "",
      logo_url: info.logo_url || info.logoUrl || "",
      footer_logo_url: info.footer_logo_url || info.footerLogoUrl || "",
      active_font_id: info.active_font_id || "Vazirmatn",
      description: info.description || info.footer_text || "",
      footer_text: info.footer_text || info.description || "",
      phone: info.phone || "",
      email: info.email || "",
      address: info.address || "",
      working_hours: info.working_hours || "",
      instagram: info.instagram || "",
      telegram: info.telegram || "",
      whatsapp: info.whatsapp || "",
      youtube: info.youtube || "",
      header_announcement: info.header_announcement || "",
      free_shipping_threshold: Number(info.free_shipping_threshold || 2000000),
      allow_google_index: isAllowed,
      maintenance_mode: info.maintenance_mode || (isAllowed ? "none" : "indefinite"),
      maintenance_until: info.maintenance_until || null,
      maintenance_duration_minutes: info.maintenance_duration_minutes || null,
      custom_css: info.custom_css || "",
      updated_at: new Date().toISOString(),
    };

    if (existingId !== null && existingId !== undefined) {
      await supabaseAdmin.from("site_info").update(payload).eq("id", existingId);
    } else {
      await supabaseAdmin.from("site_info").insert([payload]);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating site info server action:", err);
    return { success: false, error: err.message };
  }
}