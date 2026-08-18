import "./globals.css";
import React from "react";
import ThemeProvider from "@/components/ThemeProvider";
import { CartProvider } from "@/context/CartContext";
import LayoutShell from "@/components/LayoutShell";
import ClientLayoutEnhancer from "@/components/ClientLayoutEnhancer";

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 font-sans antialiased">
        <ThemeProvider>
          <CartProvider>
            <ClientLayoutEnhancer />
            <LayoutShell>{children}</LayoutShell>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}