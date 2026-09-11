// File Path: components/ProductExplodedView.tsx
"use client";

import React from "react";
import DraftlyProceduralTeardown from "@/components/3d/DraftlyProceduralTeardown";

export interface ProductExplodedViewProps {
  productId?: string;
  productTitle?: string;
  category?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ProductExplodedView({
  productTitle = "Apple Studio Display 5K Retina",
  category = "مانیتور",
  isOpen = false,
  onClose = () => {},
}: ProductExplodedViewProps) {
  return (
    <DraftlyProceduralTeardown
      productTitle={productTitle}
      productCategory={category}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}
