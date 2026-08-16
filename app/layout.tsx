import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayoutEnhancer from "@/components/ClientLayoutEnhancer";
import ThemeProvider from "@/ThemeProvider";
import { CartProvider } from "@/context/CartContext";
import LayoutShell from "@/components/LayoutShell";
import AIAssistantChat from "@/components/AIAssistantChat";
import { siteInfoService } from "@/services/siteInfoService";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const info = await siteInfoService.getAll();
    const storeTitle = info?.storeName || info?.siteTitle || "Tech Store";
    const aboutDesc = info?.aboutText || info?.aboutUs || "مرجع تخصصی خرید محصولات اصل";

    return {
      title: {
        default: storeTitle,
        template: `%s | ${storeTitle}`,
      },
      description: aboutDesc,
      icons: {
        icon: info?.logo || "/favicon.ico",
      },
    };
  } catch (error) {
    return {
      title: "Tech Store",
      description: "فروشگاه تخصصی محصولات دیجیتال",
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors duration-200">
        <ThemeProvider>
          <CartProvider>
            <ClientLayoutEnhancer />
            <LayoutShell>
              {children}
            </LayoutShell>
            <AIAssistantChat />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}