"use client";

import React, { useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { soundEngine } from "@/lib/soundEngine";

interface DynamicHomeSectionsProps {
  initialProducts: any[];
  initialBanners: any[];
}

export default function DynamicHomeSections({
  initialProducts = [],
  initialBanners = [],
}: DynamicHomeSectionsProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = Array.from(
    new Set(initialProducts.map((p) => p.category).filter(Boolean))
  );

  const filteredProducts =
    activeCategory === "all"
      ? initialProducts
      : initialProducts.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-16 py-6 sm:py-10 max-w-7xl mx-auto px-4 font-sans select-none" dir="rtl">
      {/* بخش هیرو استودیویی و بنر اصلی */}
      
    </div>
  );
}
