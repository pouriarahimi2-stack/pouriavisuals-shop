// File Path: app/manifest.ts
import type { MetadataRoute } from "next";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { normalizeSystemSettings } from "@/lib/systemSettings";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let siteName = "آکسون کور | فروشگاه تخصصی تکنولوژی";
  let shortName = "آکسون کور";
  let description =
    "فروشگاه آنلاین جدیدترین کالاهای تکنولوژی، گجت‌های هوشمند و تجهیزات دیجیتال در ایران";
  let themeColor = "#0284c7";
  let backgroundColor = "#07090e";
  let faviconUrl = "/favicon.ico";

  try {
    const row = await getMasterSiteInfoRow();
    if (row) {
      const layout = row.homepage_layout_config || {};
      const tb = layout.theme_builder_config || {};
      const sys = normalizeSystemSettings(layout, row);

      if (sys.site_name) {
        siteName = sys.tagline ? `${sys.site_name} | ${sys.tagline}` : sys.site_name;
        shortName = sys.site_name.split("|")[0].trim() || shortName;
      }

      if (sys.meta_description || sys.description) {
        description = sys.meta_description || sys.description;
      }

      if (sys.apple_touch_icon_url || sys.favicon_url) {
        faviconUrl = sys.apple_touch_icon_url || sys.favicon_url;
      }

      if (layout.primaryColor || tb.primaryColor) {
        themeColor = String(layout.primaryColor || tb.primaryColor);
      }
      if (layout.backgroundColor || tb.backgroundColor) {
        backgroundColor = String(layout.backgroundColor || tb.backgroundColor);
      }
    }
  } catch {}

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