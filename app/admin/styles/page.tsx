"use client";
import React from "react";
import StyleFontManager from "@/components/admin/StyleFontManager";

export default function AdminStylesRoute() {
  return (<div className="p-4">
      <div className="p-4 mb-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold dir-rtl">
        ℹ️ راهنمای بخش تایپوگرافی و رنگ: این صفحه منحصراً جهت تنظیم و کالیبراسیون فونت‌های رسمی (وزن، سایز) و پالت رنگ سیستم است.
      </div>
    <StyleFontManager /></div>);
}
