"use client";

import React from "react";
import DraftlyProceduralTeardown from "@/components/3d/DraftlyProceduralTeardown";

interface ProductExplodedViewProps {
  productId: string;
  productTitle: string;
  category?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductExplodedView({
  productId,
  productTitle,
  category,
  isOpen,
  onClose,
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
