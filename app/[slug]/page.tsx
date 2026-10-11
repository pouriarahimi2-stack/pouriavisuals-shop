import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import ElementorVisualBridge from "@/components/modular/ElementorVisualBridge";

export const dynamic = "force-dynamic";

// اصلاحیه نسخه Next.js 15: تبدیل params به Promise
export default async function ModularPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // واکشی اتمیک و امن اطلاعات صفحه
  const { data: page } = await supabaseAdmin.from("modular_pages").select("*").eq("slug", slug).maybeSingle();

  if (!page) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300" dir="rtl">
      <ElementorVisualBridge />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[2rem] p-8 md:p-12 shadow-xl">
          <h1 className="text-2xl md:text-4xl font-black mb-8 text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-6">
            {page.title}
          </h1>
          {/* اصلاح رنگ متون با متغیرهای هوشمند برای پشتیبانی همزمان از تم لایت و دارک */}
          <div
            className="prose dark:prose-invert max-w-none text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-h2:text-[var(--text-primary)] prose-h3:text-[var(--text-primary)] leading-loose text-justify font-medium"
            dangerouslySetInnerHTML={{ __html: page.content || "<p>محتوایی یافت نشد.</p>" }}
          />
        </div>
      </div>
    </div>
  );
}
