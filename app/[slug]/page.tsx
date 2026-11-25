// File Path: app/[slug]/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseServer";
import ModularPageRenderer from "@/components/modular/ModularPageRenderer";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

async function resolveModularPage(cleanSlug: string) {
  const [{ data: dbPage }, siteRow] = await Promise.all([
    supabaseAdmin
      .from("modular_pages")
      .select("*")
      .eq("slug", cleanSlug)
      .maybeSingle(),
    getMasterSiteInfoRow(),
  ]);

  const backupMap = siteRow?.homepage_layout_config?.modular_pages_map;
  const backupPage =
    backupMap && typeof backupMap === "object" ? backupMap[cleanSlug] : null;

  const resolvedPage =
    dbPage ||
    (backupPage && !backupPage._deleted ? { slug: cleanSlug, ...backupPage } : null);

  return { pageRecord: resolvedPage, siteRow };
}

export async function generateMetadata({
  params,
}: SlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(String(slug || ""))
    .trim()
    .toLowerCase();

  const { pageRecord, siteRow } = await resolveModularPage(cleanSlug);

  const sys = normalizeSystemSettings(
    siteRow?.homepage_layout_config || {},
    siteRow
  );
  const baseUrl = (sys.canonicalBaseUrl || "https://axoncore.ir").replace(
    /\/+$/,
    ""
  );
  const siteName = sys.site_name || "آکسون کور";
  const allowIndex = !sys.noIndex;

  if (!pageRecord || pageRecord.is_published === false) {
    return {
      title: siteName,
      robots: { index: false, follow: false },
    };
  }

  const pageTitle = pageRecord.meta_title || pageRecord.title || cleanSlug;
  const pageDesc =
    pageRecord.meta_description || sys.meta_description || sys.description;

  return {
    title: `${pageTitle} | ${siteName}`,
    description: pageDesc,
    robots: {
      index: allowIndex,
      follow: allowIndex,
      googleBot: { index: allowIndex, follow: allowIndex },
    },
    alternates: {
      canonical: `${baseUrl}/${encodeURIComponent(cleanSlug)}`,
    },
  };
}

export default async function DynamicSlugPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(String(slug || ""))
    .trim()
    .toLowerCase();

  const { pageRecord } = await resolveModularPage(cleanSlug);

  if (
    pageRecord &&
    pageRecord.is_published !== false &&
    pageRecord.puck_data &&
    Array.isArray(pageRecord.puck_data.content) &&
    pageRecord.puck_data.content.length > 0
  ) {
    return <ModularPageRenderer initialPage={pageRecord} slug={cleanSlug} />;
  }

  notFound();
}