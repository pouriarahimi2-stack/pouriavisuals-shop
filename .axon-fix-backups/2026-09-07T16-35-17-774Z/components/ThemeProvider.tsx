// File Path: components/ThemeProvider.tsx
"use client";

import React, { useEffect, useState } from "react";
import { themeEngine } from "@/lib/themeEngine";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    themeEngine.initThemeListener();
  }, []);

  return <>{children}</>;
}