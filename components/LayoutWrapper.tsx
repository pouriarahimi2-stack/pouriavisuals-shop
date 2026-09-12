"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactDock from "@/components/ContactDock";
import AIAssistantChat from "@/components/AIAssistantChat";
import CartDrawer from "@/components/CartDrawer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Header />}
      <main className="flex-1 w-full">{children}</main>
      {!isAdminRoute && (
        <>
          <Footer />
          <ContactDock />
          <AIAssistantChat />
          <CartDrawer />
        </>
      )}
    </>
  );
}
