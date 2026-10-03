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


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  themeColor: "#0284c7",
};

const GOOGLE_FONT_MAP: Record<string, string> = {
  Vazirmatn: "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&display=swap",
  IRANSans: "",
  Yekan: "",
  Shabnam: "",
  Samim: "https://fonts.googleapis.com/css2?family=Samim&display=swap",
};

async function getSiteStyles() {
  try {
    const { data } = await supabaseAdmin
      .from("site_styles")
      .select("primary_color,secondary_color,font_family,border_radius,custom_css")
      .limit(1)
      .maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  let siteName = "آکسون کور | Axon Core";
  let tagline = "فروشگاه تخصصی محصولات تکنولوژی و گجت‌های هوشمند";
  let desc = "مرجع تخصصی خرید آنلاین جدیدترین کالاهای تکنولوژی با تضمین اصالت و ارسال سریع.";
  let allowIndex = true;
  let faviconUrl = "/favicon.ico";

  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("site_info")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) {
        const layoutCfg = data.homepage_layout_config || {};
        const tbHeader = layoutCfg?.theme_builder_config?.globalHeader || {};
        if (tbHeader.brandName || data.site_name) {
          siteName = tbHeader.brandName || data.site_name;
        }
        if (data.tagline) tagline = data.tagline;
        if (data.description) desc = data.description;
        if (data.allow_google_index !== undefined) {
          allowIndex = Boolean(data.allow_google_index);
        }
        if (layoutCfg?.system_settings?.noIndex === true) {
          allowIndex = false;
        }
        if (tbHeader.faviconUrl || data.favicon_url) {
          faviconUrl = tbHeader.faviconUrl || data.favicon_url;
        }
      }
    }
  } catch {}

  return {
    metadataBase: new URL("https://axoncore.ir"),
    title: { default: siteName + " | " + tagline, template: "%s | " + siteName },
    description: desc,
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
    robots: {
      index: allowIndex,
      follow: allowIndex,
      googleBot: { index: allowIndex, follow: allowIndex },
    },
    alternates: { canonical: "https://axoncore.ir" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const styles = await getSiteStyles();

  const primaryColor = styles?.primary_color || "#0071e3";
  const secondaryColor = styles?.secondary_color || "#4f46e5";
  const fontFamily = styles?.font_family || "Vazirmatn";
  const borderRadius = styles?.border_radius || "1.5rem";
  const customCss = styles?.custom_css || "";
  const googleFontUrl = GOOGLE_FONT_MAP[fontFamily] || GOOGLE_FONT_MAP["Vazirmatn"];

  const cssVars = [
    "--accent-blue: " + primaryColor + ";",
    "--accent-purple: " + secondaryColor + ";",
    "--font-primary: " + JSON.stringify(fontFamily) + ", Vazirmatn, sans-serif;",
    "--border-radius-card: " + borderRadius + ";",
  ].join(" ");

  const inlineStyle =
    ":root { " + cssVars + " } body { font-family: var(--font-primary); } " + customCss;

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=sessionStorage.getItem('axon_theme_manual_override')==='true';var t=localStorage.getItem('theme');var sys=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var active=(m&&(t==='dark'||t==='light'))?t:sys;if(active==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();",
          }}
        />
        {googleFontUrl && <link rel="preconnect" href="https://fonts.googleapis.com" />}
        {googleFontUrl && (
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        )}
        {googleFontUrl && <link href={googleFontUrl} rel="stylesheet" />}
        <style id="axon-live-custom-css" dangerouslySetInnerHTML={{ __html: inlineStyle }} />
      </head>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased selection:bg-[var(--accent-blue)] selection:text-white">
        <MotionInit />
        <CartProvider>
          <SiteInfoProvider>
            <AnnouncementBar />
            <LayoutShell>
              <div className="pb-16 lg:pb-0">{children}</div>
            </LayoutShell>
            <LiveStoreSyncGuard />
          </SiteInfoProvider>
        </CartProvider>
      </body>
    </html>
  );
}
