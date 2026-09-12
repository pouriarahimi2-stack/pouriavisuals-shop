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
    default: "آکسون کور | مرجع مانیتورهای تدوین ۵K و تجهیزات استودیو رنگ",
    template: "%s | آکسون کور",
  },
  description: "تامین رسمی، کالیبراسیون و مشاوره فنی مانیتورهای ۵K استودیو دیسپلی، مک‌بوک پرو و درگاه‌های تاندربولت در ایران با گارانتی اصالت طلایی ۱۸ ماهه.",
  alternates: {
    canonical: "https://axoncore.ir",
  },
  openGraph: {
    title: "آکسون کور | مرجع مانیتورهای تدوین ۵K و سخت‌افزار استودیو",
    description: "تامین تخصصی مانیتورهای رتینا با تفکیک رنگ DCI-P3، درگاه‌های ۱۲۰Gbps تاندربولت و گارانتی اصالت طلایی.",
    url: "https://axoncore.ir",
    siteName: "آکسون کور",
    locale: "fa_IR",
    type: "website",
    images: [
      {
        url: "https://axoncore.ir/placeholder.png",
        width: 1200,
        height: 630,
        alt: "Axon Core Studio Displays",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
