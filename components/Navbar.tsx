"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuService, MenuItem } from "@/services/menuService";
import { siteInfoService } from "@/services/siteInfoService";

export default function Navbar() {
  const pathname = usePathname();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [storeName, setStoreName] = useState("فروشگاه تخصصی Tech");

  const loadNavData = async () => {
    try {
      const [menuList, info] = await Promise.all([
        menuService.getAll(),
        siteInfoService.getAll(),
      ]);
      setMenus((menuList || []).filter((m) => m.is_active !== false));
      if (info?.storeName) {
        setStoreName(info.storeName);
      }
    } catch (err) {
      console.error("Navbar load error:", err);
    }
  };

  useEffect(() => {
    loadNavData();

    // شنود تغییرات زنده از پنل مدیریت
    const handleSiteUpdate = (event: any) => {
      if (event.detail?.storeName) {
        setStoreName(event.detail.storeName);
      }
    };

    window.addEventListener("site_info_updated", handleSiteUpdate);
    return () => window.removeEventListener("site_info_updated", handleSiteUpdate);
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-[var(--modal-bg)]/80 backdrop-blur-xl border-b border-[var(--card-border)] font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* لوگو و نام زنده فروشگاه */}
        <Link href="/" className="flex items-center gap-2 font-black text-sm text-[var(--text-primary)]">
          <span className="w-8 h-8 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center font-bold text-base shadow-md">
            
          </span>
          <span>{storeName}</span>
        </Link>

        {/* منوهای داینامیک */}
        <div className="hidden md:flex items-center gap-1">
          {menus.map((item) => {
            const isActive = pathname === item.url;
            return (
              <Link
                key={item.id}
                href={item.url}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
                }`}
              >
                {item.title}
              </Link>
            );
          })}
        </div>

        {/* دکمه پیگیری سفارش */}
        <div className="flex items-center gap-2">
          <Link
            href="/track-order"
            className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] transition flex items-center gap-1.5 shadow-sm"
          >
            <span>📦</span>
            <span className="hidden sm:inline">پیگیری مرسوله</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}