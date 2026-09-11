import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import LayoutWrapper from '@/components/LayoutWrapper';
import { getSiteInfoServer } from '@/app/actions/siteInfo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteInfoServer();
  const sName = info.site_name || info.siteName || "آکسون";
  const iconUrl = info.favicon_url || "/favicon.ico";

  return {
    title: `${sName} | مرجع تخصصی مانیتورهای ۵K و تجهیزات تصویر`,
    description: info.description || "فروشگاه تخصصی و مرجع پیشرفته تجهیزات دیجیتال با ۱۸ ماه گارانتی اصالت طلایی",
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    },
    other: { enamad: '27424534' },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#07090e' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const info = await getSiteInfoServer();
  const faviconHref = info.favicon_url || "/favicon.ico";

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="enamad" content="27424534" />
        <link id="axon-dynamic-favicon" rel="icon" href={faviconHref} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
      </head>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors min-h-screen flex flex-col justify-between" suppressHydrationWarning>
        <CartProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}
