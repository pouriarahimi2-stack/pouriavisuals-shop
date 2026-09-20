import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
  let allowIndex = true;

  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.from("site_info").select("allow_google_index").limit(1).maybeSingle();
      if (data && data.allow_google_index !== undefined) {
        allowIndex = Boolean(data.allow_google_index);
      }
    }
  } catch {}

  // اگر مدیر سوییچ مخفی‌سازی از گوگل را زده باشد، دسترسی تمام خزنده‌ها به کل سایت مسدود می‌شود
  if (!allowIndex) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: ["/"],
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/products/*",
          "/blog",
          "/blog/*",
          "/news",
          "/news/*",
          "/about",
          "/contact",
          "/api/torob",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/admin/*",
          "/checkout",
          "/checkout/*",
          "/payment",
          "/payment/*",
          "/my-orders",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
