import AnnouncementBar from "@/components/AnnouncementBar";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import { CartProvider } from "@/context/CartContext";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 5,
  themeColor: "#0284c7",
};

// نگاشت نام فونت به لینک Google Fonts
const GOOGLE_FONT_MAP: Record<string, string> = {
  "Vazirmatn": "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&display=swap",
  "IRANSans":  "",
  "Yekan":     "",
  "Shabnam":   "",
  "Samim":     "https://fonts.googleapis.com/css2?family=Samim&display=swap",
};

async function getSiteStyles() {
  try {
    const { data } = await supabaseAdmin
      .from("site_styles")
      .select("primary_color,secondary_color,font_family,border_radius,custom_css")
      .limit(1)
      .maybeSingle();
    return data || null;
  } catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  let siteName    = "آکسون کور | Axon Core";
  let tagline     = "فروشگاه تخصصی محصولات تکنولوژی و گجت‌های هوشمند";
  let desc        = "مرجع تخصصی خرید آنلاین جدیدترین کالاهای تکنولوژی با تضمین اصالت و ارسال سریع.";
  let allowIndex  = true;
  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.from("site_info")
        .select("site_name,tagline,description,allow_google_index").limit(1).maybeSingle();
      if (data) {
        if (data.site_name)              siteName   = data.site_name;
        if (data.tagline)                tagline    = data.tagline;
        if (data.description)            desc       = data.description;
        if (data.allow_google_index !== undefined) allowIndex = Boolean(data.allow_google_index);
      }
    }
  } catch {}
  return {
    metadataBase: new URL("https://axoncore.ir"),
    title: { default: siteName + " | " + tagline, template: "%s | " + siteName },
    description: desc,
    robots: { index: allowIndex, follow: allowIndex,
      googleBot: { index: allowIndex, follow: allowIndex } },
    alternates: { canonical: "https://axoncore.ir" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const styles = await getSiteStyles();

  const primaryColor   = styles?.primary_color   || "#0071e3";
  const secondaryColor = styles?.secondary_color || "#4f46e5";
  const fontFamily     = styles?.font_family     || "Vazirmatn";
  const borderRadius   = styles?.border_radius   || "1.5rem";
  const customCss      = styles?.custom_css      || "";
  const googleFontUrl  = GOOGLE_FONT_MAP[fontFamily] || GOOGLE_FONT_MAP["Vazirmatn"];

  // CSS variables که روی کل سایت اعمال میشن
  const cssVars = [
    "--accent-blue: "     + primaryColor + ";",
    "--accent-purple: "   + secondaryColor + ";",
    "--font-primary: " + JSON.stringify(fontFamily) + ", Vazirmatn, sans-serif;",
    "--border-radius-card: " + borderRadius + ";",
  ].join(" ");

  const inlineStyle = ":root { " + cssVars + " } body { font-family: var(--font-primary); } " + customCss;

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* تاریک/روشن قبل از رندر */}
        <script dangerouslySetInnerHTML={{ __html:
          "(function(){try{var t=localStorage.getItem('theme');var m=localStorage.getItem('axon_theme_manual_override')==='true';var d=m?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();"
        }} />
        {/* فونت Google Fonts */}
        {googleFontUrl && <link rel="preconnect" href="https://fonts.googleapis.com" />}
        {googleFontUrl && <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />}
        {googleFontUrl && <link href={googleFontUrl} rel="stylesheet" />}
        {/* CSS variables هویت بصری از دیتابیس */}
        <style dangerouslySetInnerHTML={{ __html: inlineStyle }} />
      </head>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased selection:bg-[var(--accent-blue)] selection:text-white">
        <AnnouncementBar />
        <CartProvider>
          <LayoutShell>
            <div className="pb-16 lg:pb-0">{children}</div>
          </LayoutShell>
        </CartProvider>
      </body>
    </html>
  );
}