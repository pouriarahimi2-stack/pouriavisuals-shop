// File Path: app/admin/styles/page.tsx
import React from "react";
import GlobalBackgroundStudio from "@/components/admin/GlobalBackgroundStudio";
import StyleFontManager from "@/components/admin/StyleFontManager";

export const dynamic = "force-dynamic";

export default function AdminRoutePage() {
  return (
    <div className="space-y-8">
      <GlobalBackgroundStudio />
      <StyleFontManager />
    </div>
  );
}
