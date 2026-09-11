import React from "react";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseServer";
import ModularPageRenderer from "@/components/modular/ModularPageRenderer";

export const dynamic = "force-dynamic";

export default async function DynamicSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cleanSlug = String(slug || "").trim().toLowerCase();

  const { data: pageRecord } = await supabaseAdmin
    .from("modular_pages")
    .select("*")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (pageRecord && pageRecord.puck_data && pageRecord.puck_data.content?.length > 0) {
    return <ModularPageRenderer initialPage={pageRecord} slug={cleanSlug} />;
  }

  notFound();
}
