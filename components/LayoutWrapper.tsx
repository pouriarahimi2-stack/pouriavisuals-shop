"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import AIAssistantChat from "@/components/AIAssistantChat";
import MobileBottomNav from "@/components/MobileBottomNav";
import TechRadarFeed from "@/components/TechRadarFeed";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      {!isAdmin && <TechRadarFeed />}
      {!isAdmin && <Header />}
      <main className="flex-1 w-full">{children}</main>
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileBottomNav />}
      {!isAdmin && <AIAssistantChat />}
      <CartDrawer />
    </div>
  );
}
