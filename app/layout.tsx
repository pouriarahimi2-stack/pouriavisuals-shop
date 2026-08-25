import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import LayoutWrapper from '@/components/LayoutWrapper';
import ClientLayoutEnhancer from '@/components/ClientLayoutEnhancer';
import { getSiteInfoServer } from '@/app/actions/siteInfo';

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteInfoServer();
  const siteName = info.site_name || info.storeName || 'Axon | فروشگاه تخصصی تجهیزات دیجیتال';
  const tagline = info.tagline || 'مرجع تخصصی فروش و مشاوره تجهیزات استودیویی و مانیتورینگ';
  const isGoogleAllowed = info.allow_google_index !== false && info.allowGoogleIndex !== false;

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
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors min-h-screen flex flex-col justify-between">
        <ClientLayoutEnhancer />
        <CartProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}