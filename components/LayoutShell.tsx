"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactDock from "@/components/ContactDock";
import CartDrawer from "@/components/CartDrawer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ThemeProvider from "@/components/ThemeProvider";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
        {!isAdminRoute && <Header />}

        <main className={`flex-1 w-full ${!isAdminRoute ? "pt-24 sm:pt-28 pb-20 md:pb-6" : ""}`}>
          {children}
        </main>

        {!isAdminRoute && (
          <>
            <Footer />
            <ContactDock />
            <CartDrawer />
            <MobileBottomNav />
          </>
        )}
      </div>
    </ThemeProvider>
  );
}
