// File Path: app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import LayoutWrapper from '@/components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'فروشگاه تخصصی تجهیزات دیجیتال و استودیو | آکسون',
  description: 'مرجع تخصصی مانیتورهای ۵K و ۴K تدوین، کالیبراسیون سخت‌افزاری رنگ و تجهیزات پیشرفته استودیو با گارانتی اصالت طلایی',
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
        <meta name="enamad" content="27424534" />
      </head>
      <body
        className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors min-h-screen flex flex-col justify-between"
        suppressHydrationWarning
      >
        <CartProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}