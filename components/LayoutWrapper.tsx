"use client";

import React from "react";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  // این کامپوننت نباید هدر و فوتر اضافه رندر کند تا از تکرار چندباره هدر روی صفحه جلوگیری شود
  return <>{children}</>;
}
