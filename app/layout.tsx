// File Path: app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import LayoutWrapper from '@/components/LayoutWrapper';
import ClientLayoutEnhancer from '@/components/ClientLayoutEnhancer';

export const metadata: Metadata = {
  title: '27424534',
  description: 'مرجع تخصصی تجهیزات تصویر، مانیتورینگ و استودیو',
  other: {
    enamad: '27424534',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <title>27424534</title>
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