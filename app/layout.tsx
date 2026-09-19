import AnnouncementBar from "@/components/AnnouncementBar";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import { CartProvider } from "@/context/CartContext";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0284c7",
};

export async function generateMetadata(): Promise<Metadata> {
  let siteName = "آکسون کور | Axon";
  let tagline = "فروشگاه تخصصی تجهیزات دیجیتال و تصویر";
  let desc = "مرجع تخصصی خرید جدیدترین گجت‌ها، سخت‌افزارهای نوین، تجهیزات تدوین و مانیتورهای استودیو با گارانتی اصالت طلایی.";
  let faviconUrl = "/favicon.ico";

  try {
    const { data } = await supabaseAdmin.from("site_info").select("site_name, tagline, description, favicon_url").limit(1).maybeSingle();
    if (data) {
      if (data.site_name) siteName = data.site_name;
      if (data.tagline) tagline = data.tagline;
      if (data.description) desc = data.description;
      if (data.favicon_url) faviconUrl = data.favicon_url;
    }
  } catch {}

  return {
    metadataBase: new URL("https://axoncore.ir"),
    title: {
      default: `${siteName} | ${tagline}`,
      template: `%s | ${siteName}`,
    },
    description: desc,
    alternates: {
      canonical: "https://axoncore.ir",
    },
    icons: {
      icon: faviconUrl,
      apple: faviconUrl,
    },
    openGraph: {
      title: `${siteName} | ${tagline}`,
      description: desc,
      url: "https://axoncore.ir",
      siteName: siteName,
      locale: "fa_IR",
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(){try{var t=localStorage.getItem('theme');var m=localStorage.getItem('axon_theme_manual_override')==='true';var d=m?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();",
          }}
        />
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
