"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactDock from "@/components/ContactDock";
import CartDrawer from "@/components/CartDrawer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ThemeProvider from "@/components/ThemeProvider";
import { useSiteInfo } from "@/context/SiteInfoContext";
import MaintenancePage from "@/app/maintenance/page";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const { siteInfo } = useSiteInfo();

  const isMaintenanceActive =
    !isAdminRoute &&
    siteInfo?.maintenance_mode &&
    siteInfo.maintenance_mode !== "none";

  if (isMaintenanceActive) return <MaintenancePage />;

  return (
    <ThemeProvider>
      <div
        className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300"
        style={{ overflowX: "hidden" }}
      >
        {!isAdminRoute && <Header />}

        <main
          className={[
            "flex-1 w-full",
            !isAdminRoute
              ? "pt-20 sm:pt-24 md:pt-28 pb-20 md:pb-8"
              : "",
          ].join(" ")}
        >
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
