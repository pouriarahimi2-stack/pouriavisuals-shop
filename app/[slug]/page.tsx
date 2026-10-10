import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseServer";
import dynamic from "next/dynamic";
import { Metadata } from "next";

export const revalidate = 0;

const ModularPageRenderer = dynamic(
  () => import("@/components/modular/ModularPageRenderer").catch(() => {
    return function Fallback() {
      return <div className="p-10 text-center font-bold text-slate-400">سیستم رندر صفحات در حال بارگذاری است...</div>;
    };
  }),
  { ssr: true }
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabaseAdmin.from("pages").select("title").eq("slug", slug).maybeSingle();
  return { title: data?.title ? `${data.title} | آکسون کور` : "آکسون کور" };
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) return notFound();

  const { data, error } = await supabaseAdmin
    .from("pages")
    .select("content, title")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data || !data.content) {
    return notFound();
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <ModularPageRenderer initialPage={data.content} slug={slug} />
    </div>
  );
}
