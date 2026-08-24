import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://axoncore.ir';

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