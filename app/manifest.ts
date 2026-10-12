// File Path: app/manifest.ts
import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let siteName = "آکسون کور | فروشگاه تخصصی تکنولوژی";
  let shortName = "آکسون";
  let description = "فروشگاه آنلاین جدیدترین کالاهای تکنولوژی، گجت‌های هوشمند و تجهیزات دیجیتال در ایران";
  let themeColor = "#0284c7";
  let backgroundColor = "#07090e";
  let faviconUrl = "/favicon.ico";

  try {
    const { data: row } = await supabaseAdmin
      .from("site_info")
      .select("homepage_layout_config, site_name, description, favicon_url")
      .limit(1)
      .maybeSingle();

    if (row) {
      const layout = row.homepage_layout_config || {};
      const tb = layout.theme_builder_config || {};
      const persisted = layout._persisted_identity || {};

      const resolvedName =
        tb.globalHeader?.brandName ||
        persisted.site_name ||
        row.site_name ||
        null;

      if (resolvedName) {
        siteName = String(resolvedName);
        shortName = siteName.split("|")[0].trim() || shortName;
      }

      const resolvedDesc =
        tb.globalFooter?.brandDescription ||
        persisted.description ||
        row.description ||
        null;
      if (resolvedDesc) description = String(resolvedDesc);

      const resolvedFavicon =
        tb.globalHeader?.faviconUrl ||
        persisted.favicon_url ||
        row.favicon_url ||
        null;
      if (resolvedFavicon) faviconUrl = String(resolvedFavicon);

      if (layout.primaryColor || tb.primaryColor) {
        themeColor = String(layout.primaryColor || tb.primaryColor);
      }
      if (layout.backgroundColor || tb.backgroundColor) {
        backgroundColor = String(layout.backgroundColor || tb.backgroundColor);
      }
    }
  } catch {
    // اگر DB در دسترس نبود، fallback ها استفاده می‌شند
  }

  return {
    name: siteName,
    short_name: shortName,
    description,
    start_url: "/",
    display: "standalone",
    background_color: backgroundColor,
    theme_color: themeColor,
    dir: "rtl",
    lang: "fa",
    icons: [
      {
        src: faviconUrl,
        sizes: "any",
        type: faviconUrl.endsWith(".svg") ? "image/svg+xml" : "image/x-icon",
      },
    ],
  };
}
