"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { SiteInfo } from "@/services/siteInfoService";
import { revalidatePath } from "next/cache";

export async function getSiteInfoServer(): Promise<SiteInfo> {
  try {
    const { data, error } = await supabaseServer
      .from("site_info")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return {
        storeName: "BitByPouria",
        allowGoogleIndex: true,
      };
    }

    return {
      storeName: data.store_name || "BitByPouria",
      logoUrl: data.logo_url || "",
      activeFontId: data.active_font_id || "vazir",
      customFonts: data.custom_fonts || [],
      aboutText: data.about_text || "",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      instagram: data.instagram || "",
      telegram: data.telegram || "",
      allowGoogleIndex: data.allow_google_index !== undefined ? data.allow_google_index : true,
    };
  } catch (err) {
    console.error("Error in getSiteInfoServer:", err);
    return { storeName: "BitByPouria", allowGoogleIndex: true };
  }
}

export async function updateSiteInfoServer(info: SiteInfo) {
  try {
    const payload = {
      id: 1,
      store_name: info.storeName,
      logo_url: info.logoUrl || "",
      active_font_id: info.activeFontId || "vazir",
      custom_fonts: info.customFonts || [],
      about_text: info.aboutText || "",
      phone: info.phone || "",
      email: info.email || "",
      address: info.address || "",
      instagram: info.instagram || "",
      telegram: info.telegram || "",
      allow_google_index: info.allowGoogleIndex ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseServer
      .from("site_info")
      .upsert(payload, { onConflict: "id" });

    if (error) throw error;

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating site info:", err);
    return { success: false, error: err.message };
  }
}