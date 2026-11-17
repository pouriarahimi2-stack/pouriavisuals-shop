// File Path: app/layout.tsx
import LiveStoreSyncGuard from "@/components/LiveStoreSyncGuard";
import AnnouncementBar from "@/components/AnnouncementBar";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import MotionInit from "@/components/MotionInit";
import { CartProvider } from "@/context/CartContext";
import { SiteInfoProvider } from "@/context/SiteInfoContext";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import RealtimeGlobalListener from "@/components/RealtimeGlobalListener";
import MobileBottomNav from "@/components/MobileBottomNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  themeColor: "#0284c7",
};

const GOOGLE_FONT_MAP: Record<string, string> = {
  Vazirmatn:
    "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap",
  YekanBakh:
    "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap",
  IRANSans:
    "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap",
  IRANSansX:
    "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap",
  Dana: "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap",
  Yekan: "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap",
  Peyda: "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap",
  Shabnam:
    "https://cdn.jsdelivr.net/gh/rastikerdar/shabnam-font@v5.0.1/dist/font-face.css",
  Samim: "https://fonts.googleapis.com/css2?family=Samim:wght@400;700&display=swap",
  Inter:
    "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Vazirmatn:wght@100..900&display=swap",
};

async function getSiteStyles() {
  try {
    const { data } = await supabaseAdmin
      .from("site_styles")
      .select(
        "primary_color,secondary_color,font_family,border_radius,custom_css"
      )
      .limit(1)
      .maybeSingle();
    if (data) return data;

    const siteRow = await getMasterSiteInfoRow();
    return siteRow?.homepage_layout_config?.visual_styles_config || null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  let siteName = "آکسون کور | Axon Core";
  let tagline = "فروشگاه تخصصی محصولات تکنولوژی و گجت‌های هوشمند";
  let desc =
    "مرجع تخصصی خرید آنلاین جدیدترین کالاهای تکنولوژی با تضمین اصالت و ارسال سریع.";
  let keywords = "آکسون کور, خرید آیفون, لوازم جانبی اپل, کالای دیجیتال";
  let allowIndex = true;
  let faviconUrl = "/favicon.ico";
  let appleTouchIconUrl = "/favicon.ico";
  let ogImageUrl = "";
  let canonicalBase = "https://axoncore.ir";
  let googleVerification = "";
  let enamadCode = "";

  try {
    const row = await getMasterSiteInfoRow();
    if (row) {
      const layoutCfg = row.homepage_layout_config || {};
      const sys = normalizeSystemSettings(layoutCfg, row);

      siteName = sys.site_name || siteName;
      tagline = sys.tagline || tagline;
      desc = sys.meta_description || sys.description || desc;
      keywords = sys.metaKeywords || keywords;
      allowIndex = !sys.noIndex;
      faviconUrl = sys.favicon_url || "/favicon.ico";
      appleTouchIconUrl = sys.apple_touch_icon_url || faviconUrl;
      ogImageUrl = sys.og_image_url || sys.logo_url || "";
      if (sys.canonicalBaseUrl && sys.canonicalBaseUrl.startsWith("http")) {
        canonicalBase = sys.canonicalBaseUrl;
      }
      googleVerification = sys.googleSiteVerification || "";
      enamadCode = sys.enamadCode || "";
    }
  } catch {}

  const fullTitle = tagline ? `${siteName} | ${tagline}` : siteName;

  const otherMeta: Record<string, string> = {};
  if (enamadCode) {
    otherMeta["enamad"] = enamadCode;
  }

  return {
    metadataBase: new URL(canonicalBase),
    title: { default: fullTitle, template: `%s | ${siteName}` },
    description: desc,
    keywords: keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: appleTouchIconUrl,
    },
    openGraph: {
      title: fullTitle,
      description: desc,
      url: canonicalBase,
      siteName,
      locale: "fa_IR",
      type: "website",
      ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
    },
    robots: {
      index: allowIndex,
      follow: allowIndex,
      googleBot: { index: allowIndex, follow: allowIndex },
    },
    ...(googleVerification
      ? { verification: { google: googleVerification } }
      : {}),
    ...(Object.keys(otherMeta).length > 0 ? { other: otherMeta } : {}),
    alternates: { canonical: canonicalBase },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const styles = await getSiteStyles();

  const primaryColor = styles?.primary_color || "#0071e3";
  const secondaryColor = styles?.secondary_color || "#4f46e5";
  const fontFamily = styles?.font_family || "Vazirmatn";
  const borderRadius = styles?.border_radius || "1.5rem";
  const customCss = styles?.custom_css || "";
  const googleFontUrl =
    GOOGLE_FONT_MAP[fontFamily] || GOOGLE_FONT_MAP["Vazirmatn"];

  const cssVars = [
    "--accent-blue: " + primaryColor + ";",
    "--accent-purple: " + secondaryColor + ";",
    "--secondary-color: " + secondaryColor + ";",
    "--font-primary: " + JSON.stringify(fontFamily) + ", Vazirmatn, sans-serif;",
    "--border-radius-card: " + borderRadius + ";",
  ].join(" ");

  const inlineStyle =
    ":root { " +
    cssVars +
    " } body { font-family: var(--font-primary); } " +
    customCss;

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(function(regs) {
            regs.forEach(function(r) { r.unregister(); });
          });
        }
      `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=sessionStorage.getItem('axon_theme_manual_override')==='true';var t=localStorage.getItem('theme');var sys=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var active=(m&&(t==='dark'||t==='light'))?t:sys;if(active==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();",
          }}
        />
        {googleFontUrl && (
          <link rel="preconnect" href="https://fonts.googleapis.com" />
        )}
        {googleFontUrl && (
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
        )}
        {googleFontUrl && <link href={googleFontUrl} rel="stylesheet" />}
        <style
          id="axon-live-custom-css"
          dangerouslySetInnerHTML={{ __html: inlineStyle }}
        />
      </head>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased selection:bg-[var(--accent-blue)] selection:text-white">
        <RealtimeGlobalListener />
        <MotionInit />
        <CartProvider>
          <SiteInfoProvider>
            <AnnouncementBar />
            <LayoutShell>
              <div className="pb-20 md:pb-0">{children}</div>
            </LayoutShell>
            <LiveStoreSyncGuard />
            <MobileBottomNav />
          </SiteInfoProvider>
        </CartProvider>
      </body>
    </html>
  );
}