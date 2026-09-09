"use client";

import React, { useState, useEffect } from "react";
import { Render } from "@measured/puck";
import { puckConfig } from "@/lib/puckConfig";
import { supabase } from "@/lib/supabase";

interface Props {
  initialPage: any;
  slug: string;
}

export default function ModularPageRenderer({ initialPage, slug }: Props) {
  const [page, setPage] = useState<any>(initialPage);

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page) {
        setPage(json.page);
      }
    } catch {}
  };

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-puck-render-${slug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "modular_pages" }, () => {
        fetchPage();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  if (!page || !page.puck_data) {
    return null;
  }

  return (
    <div className="w-full min-h-screen font-sans select-none overflow-x-hidden" dir="rtl">
      <Render config={puckConfig} data={page.puck_data} />
    </div>
  );
}
