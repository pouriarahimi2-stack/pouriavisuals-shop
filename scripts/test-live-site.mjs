// File Path: scripts/test-live-site.mjs
const BASE_URL = (process.argv[2] || "https://axoncore.ir").replace(/\/+$/, "");

const checks = [
  {
    name: "۱. صفحه اصلی و متادیتای سئو",
    run: async () => {
      const res = await fetch(`${BASE_URL}/`);
      const html = await res.text();
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      if (!html.includes("application/ld+json")) throw new Error("JSON-LD یافت نشد");
      return "200 OK + اسکیمای سازمان فعال";
    },
  },
  {
    name: "۲. API کاتالوگ محصولات و امنیت مخفی‌سازی قیمت خرید",
    run: async () => {
      const res = await fetch(`${BASE_URL}/api/products`);
      const json = await res.json();
      if (!json.success || !Array.isArray(json.products)) throw new Error("پاسخ نامعتبر");
      const leakedCost = json.products.some((p) => p.purchase_price !== undefined);
      if (leakedCost) throw new Error("نشت purchase_price در خروجی عمومی!");
      return `${json.products.length} محصول سالم (بدون نشت قیمت خرید)`;
    },
  },
  {
    name: "۳. فید رسمی ترب (Torob API v3)",
    run: async () => {
      const res = await fetch(`${BASE_URL}/api/torob`);
      const json = await res.json();
      if (json.api_version !== "torob_api_v3") throw new Error("نسخه API ترب ناهماهنگ");
      if (typeof json.max_pages !== "number") throw new Error("کلید max_pages موجود نیست");
      return `torob_api_v3 • ${json.count} کالا • ${json.max_pages} صفحه`;
    },
  },
  {
    name: "۴. نقشه سایت (Sitemap.xml) و Robots.txt",
    run: async () => {
      const [sRes, rRes] = await Promise.all([
        fetch(`${BASE_URL}/sitemap.xml`),
        fetch(`${BASE_URL}/robots.txt`),
      ]);
      if (sRes.status !== 200 || rRes.status !== 200) {
        throw new Error(`Sitemap:${sRes.status} / Robots:${rRes.status}`);
      }
      const sXml = await sRes.text();
      const urlCount = (sXml.match(/<loc>/g) || []).length;
      return `${urlCount} لینک ثبت‌شده در Sitemap`;
    },
  },
  {
    name: "۵. سد ضدنفوذ SSRF در پروکسی رسانه (/api/media-proxy)",
    run: async () => {
      const res = await fetch(
        `${BASE_URL}/api/media-proxy?url=${encodeURIComponent("http://127.0.0.1:8080/secret")}`
      );
      if (res.status !== 403 && res.status !== 400) {
        throw new Error(`پروکسی درخواست داخلی را مسدود نکرد! HTTP ${res.status}`);
      }
      return `آی‌پی داخلی مسدود شد (HTTP ${res.status})`;
    },
  },
  {
    name: "۶. محافظت از مسیرهای پنل مدیریت (/admin/dashboard)",
    run: async () => {
      const res = await fetch(`${BASE_URL}/admin/dashboard`, { redirect: "manual" });
      if (res.status !== 307 && res.status !== 302 && res.status !== 401) {
        throw new Error(`عدم ریدایرکت به صفحه ورود! HTTP ${res.status}`);
      }
      return `ریدایرکت امن به لاگین (HTTP ${res.status})`;
    },
  },
  {
    name: "۷. API رهگیری سفارش (/api/orders/track)",
    run: async () => {
      const res = await fetch(`${BASE_URL}/api/orders/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "AXN-000000" }),
      });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      return "پاسخ‌دهی سالم و بدون خطا";
    },
  },
  {
    name: "۸. API اعتبارسنجی کد تخفیف (/api/coupons/validate)",
    run: async () => {
      const res = await fetch(`${BASE_URL}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "INVALID-TEST-999", cartTotal: 500000 }),
      });
      if (res.status !== 404 && res.status !== 400) {
        throw new Error(`وضعیت غیرمنتظره: HTTP ${res.status}`);
      }
      return "اعتبارسنجی فعال و سالم";
    },
  },
  {
    name: "۹. کپچای گرافیکی گفتگوی زنده (/api/live-chat)",
    run: async () => {
      const res = await fetch(`${BASE_URL}/api/live-chat?mode=captcha`);
      const json = await res.json();
      if (!json.success || !json.captchaToken || !json.captchaImage) {
        throw new Error("تولید کپچا ناموفق");
      }
      return "کپچای SVG امضاشده سالم";
    },
  },
  {
    name: "۱۰. سد امنیتی ثبت سفارش بدون تایید پیامکی (/api/checkout)",
    run: async () => {
      const res = await fetch(`${BASE_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { fullName: "تست", phone: "09120000000", address: "تست نشانی کامل" },
          items: [{ id: "1", quantity: 1 }],
        }),
      });
      if (res.status !== 403 && res.status !== 400) {
        throw new Error(`ثبت سفارش بدون OTP مسدود نشد! HTTP ${res.status}`);
      }
      return `مسدودسازی بدون OTP فعال (HTTP ${res.status})`;
    },
  },
];

(async () => {
  console.log(`\n🔍 شروع تست سرتاسری روی ${BASE_URL} ...\n`);
  let passed = 0;
  for (const c of checks) {
    try {
      const detail = await c.run();
      console.log(`✅ [PASS] ${c.name} -> ${detail}`);
      passed++;
    } catch (err) {
      console.log(`❌ [FAIL] ${c.name} -> ${err.message}`);
    }
  }
  console.log(`\n📊 نتیجه نهایی: ${passed} از ${checks.length} تست با موفقیت پاس شد.\n`);
})();