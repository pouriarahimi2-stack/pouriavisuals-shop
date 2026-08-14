"use client";

import React, { useState, useEffect } from "react";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  const loadSiteInfo = () => {
    setSiteInfo(siteInfoService.getSiteInfo());
  };

  useEffect(() => {
    loadSiteInfo();
    window.addEventListener("siteInfoUpdated", loadSiteInfo);
    return () => window.removeEventListener("siteInfoUpdated", loadSiteInfo);
  }, []);

  const activeFontId = siteInfo?.activeFontId || "vazir";
  const activeCustomFont = siteInfo?.customFonts?.find((f) => f.id === activeFontId);
  const isMaintenance = siteInfo?.maintenanceMode ?? false;

  return (
    <html lang="fa" dir="rtl" className="dark">
      <head>
        <title>{siteInfo?.storeName || "BitByPouria"}</title>
        
        {/* مدیریت هوشمند ایندکس گوگل بر اساس وضعیت حالت تعمیرات */}
        {isMaintenance && (
          <>
            <meta name="robots" content="noindex, nofollow, noarchive" />
            <meta name="googlebot" content="noindex, nofollow, noimageindex" />
          </>
        )}

        {/* رندر فونت‌های سفارشی تعریف‌شده در ادمین */}
        {activeCustomFont && (
          <style dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'CustomAdminFont';
                src: url('${activeCustomFont.url}');
                font-weight: normal;
                font-style: normal;
              }
              body {
                font-family: 'CustomAdminFont', sans-serif !important;
              }
            `
          }} />
        )}
      </head>
      <body className={`bg-slate-950 text-white min-h-screen antialiased ${!activeCustomFont ? activeFontId : ""}`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}