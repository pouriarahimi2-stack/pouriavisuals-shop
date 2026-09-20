"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactDock from "@/components/ContactDock";
import CartDrawer from "@/components/CartDrawer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { siteInfoService } from "@/services/siteInfoService";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const [siteInfo, setSiteInfo] = useState<any>(null);

  useEffect(() => {
    siteInfoService.getSiteInfo().then(setSiteInfo);
    const handleUpdate = () => siteInfoService.getSiteInfo().then(setSiteInfo);
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const showAiDock = siteInfo?.homepage_layout_config?.aiChat?.show !== false;

  return (
    <>
      {!isAdminRoute && <Header />}
      <main className="flex-1 w-full">{children}</main>
      {!isAdminRoute && (
        <>
          <Footer />
          {showAiDock && <ContactDock />}
          <CartDrawer />
          <MobileBottomNav />
        </>
      )}
    </>
  );
}
