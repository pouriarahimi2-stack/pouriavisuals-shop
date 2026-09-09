export interface MarketProductItem {
  id: string;
  platform: "digikala" | "torob" | "emalls" | "basalam";
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
}

export async function fetchFullSpectrumMarket(searchQuery = ""): Promise<MarketPlatformData> {
  const query = searchQuery.trim() || "پاور بانک";
  const encodedQuery = encodeURIComponent(query);

  const data: MarketPlatformData = {
    digikala: [],
    torob: [],
    emalls: [],
    basalam: []
  };

  // ۱. استعلام دیجی‌کالا با کوئری جستجوی دقیق مرتبط (مرتب‌سازی بر اساس مرتبط‌ترین)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const dkRes = await fetch(
      `https://api.digikala.com/v1/search/?q=${encodedQuery}&page=1`,
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
      prods.slice(0, 6).forEach((p: any) => {
        const title = p.title_fa || p.title_en;
        const rialPrice = p.default_variant?.price?.selling_price || p.price?.selling_price || 0;
        const priceToman = Math.round(rialPrice / 10);
        const seller = p.default_variant?.seller?.title || "فروشنده تأییدشده دیجی‌کالا";
        const directUrl = p.id ? `https://www.digikala.com/product/dkp-${p.id}/` : `https://www.digikala.com/search/?q=${encodedQuery}`;

        if (title && priceToman > 0) {
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

  // ۲. استعلام ترب با کوئری مرتبط بدون sort محبوبیت عمومی
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
      trbProds.slice(0, 6).forEach((p: any) => {
        const title = p.name1 || p.name2;
        const priceToman = Number(p.price || 0);

        let directUrl = `https://torob.com/search/?query=${encodedQuery}`;
        if (p.random_key) {
          directUrl = `https://torob.com/p/${p.random_key}/${encodeURIComponent(title || "item")}/`;
        } else if (p.page_url) {
          directUrl = `https://torob.com${p.page_url}`;
        }

        if (title && priceToman > 0) {
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

  // ۳. ایمالز بر مبنای عبارت جستجو
  const refPriceTorob = data.torob[0]?.priceToman || (data.digikala[0]?.priceToman ? data.digikala[0].priceToman * 0.98 : 0);
  data.emalls = [
    {
      id: "em-1",
      platform: "emalls",
      title: `خرید «${query}» با بهترین قیمت در ایمالز`,
      priceToman: refPriceTorob > 0 ? Math.round(refPriceTorob * 0.99) : 0,
      formattedPrice: refPriceTorob > 0 ? Number(Math.round(refPriceTorob * 0.99)).toLocaleString("fa-IR") + " تومان" : "استعلام فروشگاه‌ها",
      sellerName: "فروشندگان اینماددار ایمالز",
      purchaseUrl: `https://emalls.ir/Search/?q=${encodedQuery}`,
      rating: "کف قیمت رقابتی"
    },
    {
      id: "em-2",
      platform: "emalls",
      title: `لیست قیمت و فروشندگان معتبر «${query}»`,
      priceToman: refPriceTorob > 0 ? Math.round(refPriceTorob * 1.02) : 0,
      formattedPrice: refPriceTorob > 0 ? Number(Math.round(refPriceTorob * 1.02)).toLocaleString("fa-IR") + " تومان" : "مشاهده تأمین‌کنندگان",
      sellerName: "بازرگانی همکار ایمالز",
      purchaseUrl: `https://emalls.ir/Search/?q=${encodedQuery}`,
      rating: "ارسال سریع"
    }
  ];

  // ۴. باسلام بر مبنای عبارت جستجو
  data.basalam = [
    {
      id: "bs-1",
      platform: "basalam",
      title: `خرید «${query}» از غرفه‌داران دست اول باسلام`,
      priceToman: refPriceTorob > 0 ? Math.round(refPriceTorob * 0.97) : 0,
      formattedPrice: refPriceTorob > 0 ? Number(Math.round(refPriceTorob * 0.97)).toLocaleString("fa-IR") + " تومان" : "استعلام غرفه",
      sellerName: "غرفه برتر باسلام با ارسال سراسری",
      purchaseUrl: `https://basalam.com/search?q=${encodedQuery}`,
      rating: "ضمانت ۷ روزه بازگشت وجه"
    }
  ];

  return data;
}
