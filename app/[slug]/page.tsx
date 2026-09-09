import { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import ModularPageRenderer from "@/components/modular/ModularPageRenderer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: page } = await supabaseAdmin
    .from("modular_pages")
    .select("title, meta_description")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) return { title: "صفحه یافت نشد | آکسون" };

  return {
    title: `${page.title} | آکسون استودیو`,
    description: page.meta_description || "صفحه لندینگ تخصصی فروشگاه آکسون",
  };
}

export default async function DynamicModularPage({ params }: Props) {
  const { slug } = await params;

  // واکشی داده‌های صفحه از Supabase
  const { data: page } = await supabaseAdmin
    .from("modular_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) {
    notFound();
  }

  return <ModularPageRenderer initialPage={page} slug={slug} />;
}
