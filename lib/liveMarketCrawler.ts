export interface MarketProductItem {
  platform: "digikala" | "torob";
  title: string;
  priceToman: number;
  formattedPrice: string;
  extraInfo?: string;
}

export async function fetchLiveMarketBestsellers(keyword = "مانیتور"): Promise<MarketProductItem[]> {
  const results: MarketProductItem[] = [];

  // ۱. استعلام زنده از دیجی‌کالا (مرتب‌سازی بر اساس پرفروش‌ترین‌ها)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const dkRes = await fetch(
      `https://api.digikala.com/v1/search/?q=${encodeURIComponent(keyword)}&sort=7&page=1`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      }
    );
    clearTimeout(timeoutId);

    if (dkRes.ok) {
      const dkJson = await dkRes.json();
      const prods = dkJson?.data?.products || [];
      prods.slice(0, 4).forEach((p: any) => {
        const title = p.title_fa || p.title_en || "کالای دیجیتال";
        const rialPrice = p.default_variant?.price?.selling_price || p.price?.selling_price || 0;
        const priceToman = Math.round(rialPrice / 10);
        if (priceToman > 0) {
          results.push({
            platform: "digikala",
            title,
            priceToman,
            formattedPrice: Number(priceToman).toLocaleString("fa-IR") + " تومان",
            extraInfo: p.rating?.rate ? `امتیاز: ${p.rating.rate} از ۵` : undefined,
          });
        }
      });
    }
  } catch (err) {
    console.warn("Live Digikala crawler notice:", err);
  }

  // ۲. استعلام زنده از ترب (مرتب‌سازی بر اساس بیشترین محبوبیت و فروش)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const torobRes = await fetch(
      `https://api.torob.com/v4/base-product/search/?query=${encodeURIComponent(keyword)}&sort=popularity`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      }
    );
    clearTimeout(timeoutId);

    if (torobRes.ok) {
      const trbJson = await torobRes.json();
      const trbProds = trbJson?.results || [];
      trbProds.slice(0, 4).forEach((p: any) => {
        const title = p.name1 || p.name2 || "کالای سخت‌افزار";
        const priceToman = Number(p.price || 0);
        if (priceToman > 0) {
          results.push({
            platform: "torob",
            title,
            priceToman,
            formattedPrice: Number(priceToman).toLocaleString("fa-IR") + " تومان",
            extraInfo: p.shop_text || undefined,
          });
        }
      });
    }
  } catch (err) {
    console.warn("Live Torob crawler notice:", err);
  }

  return results;
}
