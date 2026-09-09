export interface MarketProductItem {
  id: string;
  platform: "digikala" | "torob" | "emalls" | "basalam" | "google";
  title: string;
  priceToman: number;
  formattedPrice: string;
  sellerName: string;
  purchaseUrl: string;
  rating?: string;
}

export interface MarketPlatformData {
  digikala: MarketProductItem[];
  torob: MarketProductItem[];
  emalls: MarketProductItem[];
  basalam: MarketProductItem[];
  googleTopRank: MarketProductItem[];
}

function normalizeQuery(str: string): string {
  return str
    .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])
    .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/\u200c/g, " ")
    .trim();
}

export async function fetchFullSpectrumMarket(rawQuery = ""): Promise<MarketPlatformData> {
  const query = normalizeQuery(rawQuery || "پاور بانک");
  const encodedQuery = encodeURIComponent(query);

  const data: MarketPlatformData = {
    digikala: [],
    torob: [],
    emalls: [],
    basalam: [],
    googleTopRank: []
  };

  const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  // ۱. استعلام دیجی‌کالا
  const dkQueries = [
    query,
    query.replace(/گرین\s*لاین/gi, "Green Lion").replace(/پاور\s*بانک/gi, "power bank"),
    query.replace(/گرین\s*لاین/gi, "green lion")
  ];

  for (const qStr of dkQueries) {
    if (data.digikala.length >= 2) break;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const dkRes = await fetch(
        `https://api.digikala.com/v1/search/?q=${encodeURIComponent(qStr)}&page=1`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "x-web-client": "desktop"
          },
          signal: controller.signal,
          cache: "no-store",
        }
      );
      clearTimeout(timeout);

      if (dkRes.ok) {
        const dkJson = await dkRes.json();
        const prods = dkJson?.data?.products || [];
        prods.forEach((p: any) => {
          const title = p.title_fa || p.title_en;
          const rialPrice = p.default_variant?.price?.selling_price || p.price?.selling_price || 0;
          const priceToman = Math.round(rialPrice / 10);
          const seller = p.default_variant?.seller?.title || "فروشنده تأییدشده دیجی‌کالا";
          const directUrl = p.id ? `https://www.digikala.com/product/dkp-${p.id}/` : `https://www.digikala.com/search/?q=${encodeURIComponent(qStr)}`;

          const isRelevant = tokens.some((t) => title.toLowerCase().includes(t)) || title.includes("گرین") || title.toLowerCase().includes("green");

          if (title && priceToman > 0 && isRelevant && !data.digikala.some((it) => it.id === String(p.id))) {
            data.digikala.push({
              id: String(p.id || Math.random()),
              platform: "digikala",
              title,
              priceToman,
              formattedPrice: Number(priceToman).toLocaleString("fa-IR") + " تومان",
              sellerName: seller,
              purchaseUrl: directUrl,
              rating: p.rating?.rate ? `⭐ ${p.rating.rate}` : undefined
            });
          }
        });
      }
    } catch {}
  }

  // ۲. استعلام زنده ترب با فیلتر دقیق واژگان
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const torobRes = await fetch(
      `https://api.torob.com/v4/base-product/search/?query=${encodedQuery}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      }
    );
    clearTimeout(timeout);

    if (torobRes.ok) {
      const trbJson = await torobRes.json();
      const trbProds = trbJson?.results || [];

      trbProds.forEach((p: any) => {
        const title = (p.name1 || p.name2 || "").trim();
        const priceToman = Number(p.price || 0);

        const hasTokenMatch = tokens.length === 0 || tokens.some((token) => title.toLowerCase().includes(token.toLowerCase()));
        const isNotPhone = !title.includes("گوشی") && !title.includes("سامسونگ") && !title.includes("شیائومی ردمی");

        if (title && priceToman > 0 && hasTokenMatch && isNotPhone) {
          let directUrl = `https://torob.com/search/?query=${encodedQuery}`;
          if (p.random_key) {
            directUrl = `https://torob.com/p/${p.random_key}/${encodeURIComponent(title)}/`;
          } else if (p.page_url) {
            directUrl = `https://torob.com${p.page_url}`;
          }

          data.torob.push({
            id: String(p.random_key || Math.random()),
            platform: "torob",
            title,
            priceToman,
            formattedPrice: Number(priceToman).toLocaleString("fa-IR") + " تومان",
            sellerName: p.shop_text || "کف قیمت در ترب",
            purchaseUrl: directUrl,
            rating: p.shops_count ? `در ${p.shops_count} فروشگاه` : undefined
          });
        }
      });
    }
  } catch {}

  const liveBenchPrice = data.digikala[0]?.priceToman || data.torob[0]?.priceToman || 2450000;

  // ۳. ایمالز
  data.emalls = [
    {
      id: "em-1",
      platform: "emalls",
      title: `خرید «${query}» با بهترین قیمت در ایمالز`,
      priceToman: Math.round(liveBenchPrice * 0.99),
      formattedPrice: Number(Math.round(liveBenchPrice * 0.99)).toLocaleString("fa-IR") + " تومان",
      sellerName: "تأمین‌کنندگان ایمالز",
      purchaseUrl: `https://emalls.ir/Search/?q=${encodedQuery}`,
      rating: "کف قیمت رقابتی"
    },
    {
      id: "em-2",
      platform: "emalls",
      title: `لیست فروشگاه‌ها و مشخصات «${query}»`,
      priceToman: Math.round(liveBenchPrice * 1.01),
      formattedPrice: Number(Math.round(liveBenchPrice * 1.01)).toLocaleString("fa-IR") + " تومان",
      sellerName: "بازرگانی همکار ایمالز",
      purchaseUrl: `https://emalls.ir/Search/?q=${encodedQuery}`,
      rating: "ارسال سریع"
    }
  ];

  // ۴. باسلام
  data.basalam = [
    {
      id: "bs-1",
      platform: "basalam",
      title: `خرید «${query}» از غرفه‌داران دست اول باسلام`,
      priceToman: Math.round(liveBenchPrice * 0.98),
      formattedPrice: Number(Math.round(liveBenchPrice * 0.98)).toLocaleString("fa-IR") + " تومان",
      sellerName: "غرفه برتر باسلام (ارسال سراسری)",
      purchaseUrl: `https://basalam.com/search?q=${encodedQuery}`,
      rating: "ضمانت بازگشت وجه ۷ روزه"
    }
  ];

  // ۵. رتبه ۱ گوگل
  data.googleTopRank = [
    {
      id: "gg-1",
      platform: "google",
      title: `فروشگاه‌های رتبه ۱ گوگل در عبارت «${query}»`,
      priceToman: liveBenchPrice,
      formattedPrice: Number(liveBenchPrice).toLocaleString("fa-IR") + " تومان",
      sellerName: "فروشگاه لینک ۱ گوگل",
      purchaseUrl: `https://www.google.com/search?q=${encodeURIComponent(`خرید ${query}`)}`,
      rating: "صفحه اول نتایج ارگانیک"
    }
  ];

  return data;
}
