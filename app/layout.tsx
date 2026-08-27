// File Path: app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import LayoutWrapper from '@/components/LayoutWrapper';
import ClientLayoutEnhancer from '@/components/ClientLayoutEnhancer';
import { getSiteInfoServer } from '@/app/actions/siteInfo';

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteInfoServer();
  const siteName = info.site_name || info.storeName || 'آکسون | Axon';
  const tagline = info.tagline || 'مرجع تخصصی تجهیزات تصویر، مانیتورینگ و استودیو';
  const isGoogleAllowed =
    info.allow_google_index !== false &&
    info.allowGoogleIndex !== false &&
    info.maintenance_mode === 'none';

  return {
    title: {
      default: `${siteName} | ${tagline}`,
      template: `%s | ${siteName}`,
    },
    description: tagline,
    robots: isGoogleAllowed
      ? {
          index: true,
          follow: true,
          nocache: false,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        }
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        },
    icons: {
      icon: info.logo_url || '/favicon.ico',
    },
    other: {
      enamad: '27424534',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <meta name="enamad" content="27424534" />
      </head>
      <body
        className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors min-h-screen flex flex-col justify-between"
        suppressHydrationWarning
      >
        <ClientLayoutEnhancer />
        <CartProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}