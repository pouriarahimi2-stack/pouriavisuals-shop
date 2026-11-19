// File Path: components/LayoutShell.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactDock from "@/components/ContactDock";
import CartDrawer from "@/components/CartDrawer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ThemeProvider from "@/components/ThemeProvider";
import ClientLayoutEnhancer from "@/components/ClientLayoutEnhancer";
import VpnGuardModal from "@/components/VpnGuardModal";
import { useSiteInfo } from "@/context/SiteInfoContext";
import MaintenancePage from "@/app/maintenance/page";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isAdminRoute = pathname.startsWith("/admin");
  const { siteInfo } = useSiteInfo();
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);

  useEffect(() => {
    if (isAdminRoute) return;
    let active = true;
    fetch("/api/admin/auth?t=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (active) {
          setIsVerifiedAdmin(Boolean(json?.authenticated && json?.user));
        }
      })
      .catch(() => {
        if (active) setIsVerifiedAdmin(false);
      });
    return () => {
      active = false;
    };
  }, [isAdminRoute, pathname]);

  const layoutCfg = siteInfo?.homepage_layout_config || {};
  const sys =
    siteInfo?.settings ||
    siteInfo?.system_settings ||
    layoutCfg?.system_settings ||
    {};

  const rawMaint =
    Boolean(sys.maintenanceMode) ||
    (siteInfo?.maintenance_mode &&
      siteInfo.maintenance_mode !== "none" &&
      siteInfo.maintenance_mode !== "false");

  const allowAdminBypass =
    sys.maintenanceAdminBypass !== false && isVerifiedAdmin;

  const isMaintenanceActive =
    !isAdminRoute &&
    pathname !== "/maintenance" &&
    pathname !== "/login" &&
    rawMaint &&
    !allowAdminBypass;

  if (isMaintenanceActive) return <MaintenancePage />;

  return (
    <ThemeProvider>
      <ClientLayoutEnhancer />
      <VpnGuardModal />
      <div
        className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300"
        style={{ overflowX: "hidden" }}
      >
        {!isAdminRoute && <Header />}
        <main
          className={[
            "flex-1 w-full",
            !isAdminRoute ? "pt-20 sm:pt-24 md:pt-28 pb-20 md:pb-8" : "",
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