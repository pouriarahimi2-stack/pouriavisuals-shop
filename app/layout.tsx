import type { Metadata, Viewport } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import { CartProvider } from "@/context/CartContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0284c7",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://axoncore.ir"),
  title: {
    default: "آکسون کور | مرجع تخصصی مانیتورهای تدوین ۵K و تجهیزات استودیو",
    template: "%s | آکسون کور",
  },
  description: "تامین، مشاوره فنی و کالیبراسیون تخصصی مانیتورهای تدوین رنگ ۵K، مک‌بوک و تجهیزات استودیویی در ایران با گارانتی اصالت طلایی.",
  alternates: {
    canonical: "./",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased selection:bg-[var(--accent-blue)] selection:text-white">
        <CartProvider>
          <LayoutShell>{children}</LayoutShell>
        </CartProvider>
      </body>
    </html>
  );
}
