// app/robots.ts
import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabaseServer';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://axoncore.ir';

  let allowIndex = true;

  try {
    const { data } = await supabaseAdmin
      .from('site_info')
      .select('allow_google_index, maintenance_mode')
      .limit(1)
      .maybeSingle();

    if (data && (data.allow_google_index === false || data.maintenance_mode !== 'none')) {
      allowIndex = false;
    }
  } catch (err) {
    console.warn("Robots database check fallback:", err);
  }

  if (!allowIndex) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin',
          '/api/admin/',
          '/api/payment/',
          '/checkout/payment',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}