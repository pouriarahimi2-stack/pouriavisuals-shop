"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactDock from "@/components/ContactDock";
import AIAssistantChat from "@/components/AIAssistantChat";
import CartDrawer from "@/components/CartDrawer";
import ThemeProvider from "@/components/ThemeProvider";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
        {/* هدر فروشگاه فقط در صفحات عمومی نمایش داده می‌شود */}
        {!isAdminRoute && <Header />}

        {/* محتوای صفحات */}
        <main className="flex-1 w-full">{children}</main>

        {/* فوتر و داک‌های تعاملی فقط در صفحات عمومی لود می‌شوند */}
        {!isAdminRoute && (
          <>
            <Footer />
            <ContactDock />
            <AIAssistantChat />
            <CartDrawer />
          </>
        )}
      </div>
    </ThemeProvider>
  );
}
