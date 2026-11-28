// File Path: scripts/test-live-site.mjs
const BASE_URL = (process.argv[2] || "https://axoncore.ir").replace(/\/+$/, "");

async function fetchWithRetry(url, options = {}, retries = 3) {
  let lastErr;
  for (let i = 1; i <= retries; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const startedAt = Date.now();
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      res._elapsedMs = Date.now() - startedAt;
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 1000 * i));
      }
    }
  }
  const causeMsg =
    lastErr?.cause?.code ||
    lastErr?.cause?.message ||
    lastErr?.message ||
    "Network Error";
  throw new Error(`${lastErr?.message || "fetch failed"} (${causeMsg})`);
}

// متغیرهای اشتراکی برای تست مسیرهای پویای واقعی سایت
const sharedContext = {
  sampleProductId: null,
  sampleBlogSlug: null,
  sampleNewsSlug: null,
};

const testGroups = [
  {
    group: "لایه ۱: صفحات عمومی، سئو فنی و هدرهای امنیتی",
    tests: [
      {
        name: "۱. صفحه اصلی، اسکیمای JSON-LD و هدرهای امنیتی مرورگر",
        run: async () => {
          const res = await fetchWithRetry(`${BASE_URL}/`);
          const html = await res.text();
          if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
          if (!html.includes("application/ld+json")) {
            throw new Error("اسکیمای ساختاریافته JSON-LD یافت نشد");
          }
          const nosniff = res.headers.get("x-content-type-options");
          const frameOpt = res.headers.get("x-frame-options");
          if (nosniff !== "nosniff" || !frameOpt) {
            throw new Error("هدرهای امنیتی X-Content-Type-Options یا X-Frame-Options ناقص است");
          }
          return `200 OK (${res._elapsedMs}ms) • JSON-LD + Security Headers فعال`;
        },
      },
      {
        name: "۲. دسترس‌پذیری تمام صفحات اصلی فروشگاه (۷ مسیر)",
        run: async () => {
          const paths = [
            "/products",
            "/blog",
            "/news",
            "/about",
            "/contact",
            "/track-order",
            "/login",
          ];
          const results = await Promise.all(
            paths.map((p) => fetchWithRetry(`${BASE_URL}${p}`))
          );
          const failed = paths.filter((_, idx) => results[idx].status !== 200);
          if (failed.length > 0) {
            throw new Error(`خطا در مسیرهای: ${failed.join(", ")}`);
          }
          return `تمام ${paths.length} صفحه اصلی با وضعیت 200 OK باز شدند`;
        },
      },
      {
        name: "۳. جلوگیری از ایندکس شدن صفحات خصوصی در گوگل (X-Robots-Tag: noindex)",
        run: async () => {
          const privatePaths = ["/login", "/account", "/checkout"];
          for (const p of privatePaths) {
            const res = await fetchWithRetry(`${BASE_URL}${p}`, { redirect: "manual" });
            const robotsTag = String(res.headers.get("x-robots-tag") || "").toLowerCase();
            if (!robotsTag.includes("noindex")) {
              throw new Error(`مسیر ${p} فاقد هدر noindex است`);
            }
          }
          return `هدر noindex روی ${privatePaths.join("، ")} فعال است`;
        },
      },
      {
        name: "۴. نقشه سایت (sitemap.xml)، فایل robots.txt و مانیفست PWA",
        run: async () => {
          const [sRes, rRes, mRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/sitemap.xml`),
            fetchWithRetry(`${BASE_URL}/robots.txt`),
            fetchWithRetry(`${BASE_URL}/manifest.webmanifest`),
          ]);
          if (sRes.status !== 200 || rRes.status !== 200 || mRes.status !== 200) {
            throw new Error(
              `Sitemap:${sRes.status} / Robots:${rRes.status} / Manifest:${mRes.status}`
            );
          }
          const sXml = await sRes.text();
          const rTxt = await rRes.text();
          const urlCount = (sXml.match(/<loc>/g) || []).length;
          if (!rTxt.includes("Disallow: /admin")) {
            throw new Error("قانون Disallow: /admin در robots.txt یافت نشد");
          }
          return `${urlCount} لینک در Sitemap • قوانین Robots و PWA سالم`;
        },
      },
    ],
  },
  {
    group: "لایه ۲: کاتالوگ محصولات، محتوا و مسیرهای پویا",
    tests: [
      {
        name: "۵. API کاتالوگ محصولات و مخفی‌سازی قیمت خرید عمده",
        run: async () => {
          const res = await fetchWithRetry(`${BASE_URL}/api/products?t=${Date.now()}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (!json.success || !Array.isArray(json.products)) {
            throw new Error("ساختار JSON محصولات نامعتبر است");
          }
          const leakedCost = json.products.some((p) => p.purchase_price !== undefined);
          if (leakedCost) {
            throw new Error("نشت امنیتی: فیلد purchase_price در خروجی عمومی دیده شد!");
          }
          if (json.products.length > 0) {
            sharedContext.sampleProductId = String(json.products[0].id);
          }
          return `${json.products.length} محصول فعال • بدون نشت قیمت خرید`;
        },
      },
      {
        name: "۶. رندر صفحه پویای تک‌محصول (/products/[id]) و سیستم نظرات",
        run: async () => {
          if (!sharedContext.sampleProductId) {
            return "محصولی برای تست پویا یافت نشد (رد شد)";
          }
          const [pageRes, revRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/products/${sharedContext.sampleProductId}`),
            fetchWithRetry(
              `${BASE_URL}/api/reviews?productId=${encodeURIComponent(
                sharedContext.sampleProductId
              )}`
            ),
          ]);
          if (pageRes.status !== 200) {
            throw new Error(`صفحه محصول باز نشد: HTTP ${pageRes.status}`);
          }
          const revJson = await revRes.json();
          if (!revJson.success) throw new Error("خطا در دریافت دیدگاه‌های محصول");
          return `صفحه محصول 200 OK • ${revJson.reviews?.length || 0} دیدگاه تاییدشده`;
        },
      },
      {
        name: "۷. API دسته‌بندی‌ها، بنرها و کوپن‌های عمومی",
        run: async () => {
          const [catRes, banRes, cpnRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/api/categories`),
            fetchWithRetry(`${BASE_URL}/api/public/banners`),
            fetchWithRetry(`${BASE_URL}/api/public/coupons`),
          ]);
          if (!catRes.ok || !banRes.ok || !cpnRes.ok) {
            throw new Error(
              `Categories:${catRes.status} / Banners:${banRes.status} / Coupons:${cpnRes.status}`
            );
          }
          return "هر ۳ سرویس عمومی کاتالوگ فعال و پاسخگو هستند";
        },
      },
      {
        name: "۸. API تنظیمات سایت، استودیوی ظاهر، استایل‌ها و اینماد",
        run: async () => {
          const [infoRes, tbRes, stRes, enRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/api/site-info`),
            fetchWithRetry(`${BASE_URL}/api/theme-builder`),
            fetchWithRetry(`${BASE_URL}/api/styles`),
            fetchWithRetry(`${BASE_URL}/api/enamad`),
          ]);
          if (!infoRes.ok || !tbRes.ok || !stRes.ok || !enRes.ok) {
            throw new Error(
              `SiteInfo:${infoRes.status} / Theme:${tbRes.status} / Styles:${stRes.status} / Enamad:${enRes.status}`
            );
          }
          return "تنظیمات هویت سایت، استودیوی ظاهر و اینماد همگام هستند";
        },
      },
      {
        name: "۹. مجله تخصصی (/api/blogs) و صفحه مقاله پویا (/blog/[id])",
        run: async () => {
          const res = await fetchWithRetry(`${BASE_URL}/api/blogs?published=true`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const posts = json.posts || json.data || [];
          if (posts.length > 0) {
            const slug = encodeURIComponent(posts[0].slug || posts[0].id);
            const pRes = await fetchWithRetry(`${BASE_URL}/blog/${slug}`);
            if (pRes.status !== 200) {
              throw new Error(`صفحه مقاله باز نشد: HTTP ${pRes.status}`);
            }
          }
          return `${posts.length} مقاله منتشرشده • رندر صفحه مقاله سالم`;
        },
      },
      {
        name: "۱۰. رادار اخبار فناوری (/api/news) و صفحه خبر پویا (/news/[slug])",
        run: async () => {
          const res = await fetchWithRetry(`${BASE_URL}/api/news`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const newsList = json.news || json.data || [];
          if (newsList.length > 0 && newsList[0].slug) {
            const nRes = await fetchWithRetry(
              `${BASE_URL}/news/${encodeURIComponent(newsList[0].slug)}`
            );
            if (nRes.status !== 200) {
              throw new Error(`صفحه خبر باز نشد: HTTP ${nRes.status}`);
            }
          }
          return `${newsList.length} خبر فناوری • رندر صفحه خبر سالم`;
        },
      },
    ],
  },
  {
    group: "لایه ۳: موتور ترب (Torob) و دستیار هوشمند",
    tests: [
      {
        name: "۱۱. فید رسمی ترب (لیست محصولات + استعلام تکی page_uniques)",
        run: async () => {
          const res = await fetchWithRetry(`${BASE_URL}/api/torob`);
          const json = await res.json();
          if (json.api_version !== "torob_api_v3" || typeof json.max_pages !== "number") {
            throw new Error("ساختار استاندارد torob_api_v3 رعایت نشده است");
          }
          if (sharedContext.sampleProductId) {
            const singleRes = await fetchWithRetry(
              `${BASE_URL}/api/torob?page_uniques=${encodeURIComponent(
                sharedContext.sampleProductId
              )}`
            );
            const singleJson = await singleRes.json();
            if (!Array.isArray(singleJson.products)) {
              throw new Error("پاسخ استعلام تکی ترب نامعتبر است");
            }
          }
          return `torob_api_v3 • ${json.count} کالا • استعلام لیست و تکی سالم`;
        },
      },
      {
        name: "۱۲. چت دستیار هوشمند عمومی و مسدودسازی ذخیره کلید بدون احراز هویت",
        run: async () => {
          const [chatRes, hackKeyRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/api/ai-assistant`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: "سلام، محصولات موجود چیست؟" }),
            }),
            fetchWithRetry(`${BASE_URL}/api/ai-assistant`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "test_and_save_key",
                targetKey: "AIzaSyFakeKey1234567890",
              }),
            }),
          ]);
          const chatJson = await chatRes.json();
          if (!chatJson.success || !chatJson.reply) {
            throw new Error("پاسخ چت هوشمند دریافت نشد");
          }
          if (hackKeyRes.status !== 401 && hackKeyRes.status !== 403) {
            throw new Error(`ذخیره کلید AI بدون لاگین مسدود نشد! HTTP ${hackKeyRes.status}`);
          }
          return "پاسخ‌دهی چت فعال • ذخیره کلید API بدون لاگین مسدود (401)";
        },
      },
    ],
  },
  {
    group: "لایه ۴: دیوار آتش امنیتی، کنترل دسترسی و ضدنفوذ",
    tests: [
      {
        name: "۱۳. سد ضدنفوذ SSRF در پروکسی رسانه (/api/media-proxy)",
        run: async () => {
          const blockedTargets = [
            "http://127.0.0.1:8080/secret",
            "http://192.168.1.1/admin",
            "http://169.254.169.254/latest/meta-data/",
            "ftp://example.com/file.png",
          ];
          for (const target of blockedTargets) {
            const res = await fetchWithRetry(
              `${BASE_URL}/api/media-proxy?url=${encodeURIComponent(target)}`
            );
            if (res.status !== 403 && res.status !== 400) {
              throw new Error(`آدرس خطرناک ${target} مسدود نشد! HTTP ${res.status}`);
            }
          }
          return "تمام ۴ الگوی حمله SSRF و پروتکل غیرمجاز مسدود شدند";
        },
      },
      {
        name: "۱۴. محافظت Middleware از تمام مسیرهای پنل مدیریت (۶ مسیر حساس)",
        run: async () => {
          const adminRoutes = [
            "/admin",
            "/admin/dashboard",
            "/admin/products",
            "/admin/orders",
            "/admin/customers",
            "/admin/settings",
          ];
          for (const route of adminRoutes) {
            const res = await fetchWithRetry(`${BASE_URL}${route}`, {
              redirect: "manual",
            });
            if (res.status !== 307 && res.status !== 302 && res.status !== 401) {
              throw new Error(`مسیر ${route} بدون لاگین باز شد! HTTP ${res.status}`);
            }
          }
          return `تمام ${adminRoutes.length} مسیر پنل مدیریت به صفحه ورود ریدایرکت شدند`;
        },
      },
      {
        name: "۱۵. قفل دسترسی غیرمجاز روی ۱۰ API حساس مدیریت و حسابداری",
        run: async () => {
          const protectedGetApis = [
            "/api/admin/orders",
            "/api/admin/backup",
            "/api/accounting",
            "/api/crm",
            "/api/admin/coupons",
            "/api/admin/reviews",
            "/api/admin/messages",
            "/api/admin/users",
            "/api/sms/debug",
            "/api/products/back-in-stock",
          ];
          const results = await Promise.all(
            protectedGetApis.map((ep) => fetchWithRetry(`${BASE_URL}${ep}`))
          );
          const exposed = protectedGetApis.filter(
            (_, i) => results[i].status !== 401 && results[i].status !== 403
          );
          if (exposed.length > 0) {
            throw new Error(`APIهای باز بدون احراز هویت: ${exposed.join(", ")}`);
          }
          return `تمام ${protectedGetApis.length} سرویس محرمانه با کد 401 مسدود شدند`;
        },
      },
      {
        name: "۱۶. مسدودسازی تغییر تنظیمات کلان و پین مدیر بدون نشست معتبر",
        run: async () => {
          const [setRes, pinRes, prodRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/api/admin/settings`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ maintenanceMode: true }),
            }),
            fetchWithRetry(`${BASE_URL}/api/admin/change-pin`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ newPin: "999999" }),
            }),
            fetchWithRetry(`${BASE_URL}/api/products`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: "کالای غیرمجاز", price: 1000 }),
            }),
          ]);
          if (
            ![401, 403].includes(setRes.status) ||
            ![401, 403].includes(pinRes.status) ||
            ![401, 403].includes(prodRes.status)
          ) {
            throw new Error(
              `Settings:${setRes.status} / Pin:${pinRes.status} / Products:${prodRes.status}`
            );
          }
          return "تغییر تنظیمات، رمز مدیر و ثبت کالا بدون نشست مسدود است";
        },
      },
      {
        name: "۱۷. محافظت از ۴ کرون‌جاب خودکار در برابر اجرای بدون کلید",
        run: async () => {
          const crons = [
            "/api/cron/release-inventory",
            "/api/cron/review-sms",
            "/api/cron/news",
            "/api/cron/backup",
          ];
          const results = await Promise.all(
            crons.map((c) => fetchWithRetry(`${BASE_URL}${c}`))
          );
          const unguarded = crons.filter((_, i) => results[i].status !== 401);
          if (unguarded.length > 0) {
            throw new Error(`کرون‌جاب بدون احراز هویت: ${unguarded.join(", ")}`);
          }
          return "هر ۴ کرون‌جاب با Bearer Token محافظت می‌شوند (401)";
        },
      },
    ],
  },
  {
    group: "لایه ۵: جریان خرید، کیف پول، درگاه زرین‌پال، احراز هویت و پشتیبانی",
    tests: [
      {
        name: "۱۸. سد امنیتی ثبت سفارش بدون تایید پیامکی (/api/checkout)",
        run: async () => {
          const res = await fetchWithRetry(`${BASE_URL}/api/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customer: {
                fullName: "کاربر تست",
                phone: "09120000000",
                address: "شیراز، خیابان تست، پلاک ۱",
              },
              items: [{ id: sharedContext.sampleProductId || "1", quantity: 1 }],
            }),
          });
          if (res.status !== 403 && res.status !== 400) {
            throw new Error(`ثبت سفارش بدون OTP مسدود نشد! HTTP ${res.status}`);
          }
          return `ثبت سفارش بدون امضای OTP مسدود شد (HTTP ${res.status})`;
        },
      },
      {
        name: "۱۹. اعتبارسنجی درخواست و تایید درگاه پرداخت زرین‌پال",
        run: async () => {
          const [reqRes, verRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/api/payment/request`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }),
            fetchWithRetry(`${BASE_URL}/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }),
          ]);
          if (reqRes.status !== 400 || verRes.status !== 400) {
            throw new Error(`Request:${reqRes.status} / Verify:${verRes.status}`);
          }
          return "کنترل ورودی‌های درخواست و تایید تراکنش فعال است (400)";
        },
      },
      {
        name: "۲۰. موتور اعتبارسنجی کد تخفیف (/api/coupons/validate)",
        run: async () => {
          const res = await fetchWithRetry(`${BASE_URL}/api/coupons/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: "NONEXISTENT-999", cartTotal: 500000 }),
          });
          if (res.status !== 404 && res.status !== 400) {
            throw new Error(`وضعیت غیرمنتظره: HTTP ${res.status}`);
          }
          return "رد کردن کدهای نامعتبر و منقضی فعال است";
        },
      },
      {
        name: "۲۱. سامانه رهگیری سفارشات مشتریان (/api/orders/track)",
        run: async () => {
          const [postRes, getRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/api/orders/track`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: "AXN-000000" }),
            }),
            fetchWithRetry(`${BASE_URL}/api/orders/track?code=AXN-000000`),
          ]);
          if (postRes.status !== 200 || getRes.status !== 200) {
            throw new Error(`POST:${postRes.status} / GET:${getRes.status}`);
          }
          return "استعلام GET و POST رهگیری سفارش سالم است";
        },
      },
      {
        name: "۲۲. امنیت ورود کاربران، OTP، بازیابی رمز و سشن (/api/user/*)",
        run: async () => {
          const [otpRes, authRes, recRes, sessRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/api/send-otp`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: "12345", action: "send" }),
            }),
            fetchWithRetry(`${BASE_URL}/api/user/auth`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "login_credentials",
                identifier: "09000000000",
                password: "WrongPassword123",
              }),
            }),
            fetchWithRetry(`${BASE_URL}/api/auth/recovery`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "reset_customer_password",
                phone: "09000000000",
                newPassword: "NewPassword123",
                otpVerificationToken: "invalid_token",
              }),
            }),
            fetchWithRetry(`${BASE_URL}/api/user/session`),
          ]);
          if (
            otpRes.status !== 400 ||
            authRes.status !== 401 ||
            recRes.status !== 403 ||
            sessRes.status !== 200
          ) {
            throw new Error(
              `OTP:${otpRes.status} / Auth:${authRes.status} / Recovery:${recRes.status} / Session:${sessRes.status}`
            );
          }
          return "اعتبارسنجی OTP، رمز عبور و امضای بازیابی رمز سالم است";
        },
      },
      {
        name: "۲۳. کنترل دسترسی کیف پول اعتباری مشتری (/api/user/wallet)",
        run: async () => {
          const res = await fetchWithRetry(`${BASE_URL}/api/user/wallet?phone=123`);
          if (res.status !== 400) {
            throw new Error(`وضعیت غیرمنتظره: HTTP ${res.status}`);
          }
          return "اعتبارسنجی شماره کیف پول فعال است (400)";
        },
      },
      {
        name: "۲۴. کپچای گرافیکی گفتگوی زنده و اعتبارسنجی فرم تماس",
        run: async () => {
          const [capRes, fakeChatRes, contactRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/api/live-chat?mode=captcha`),
            fetchWithRetry(`${BASE_URL}/api/live-chat?sessionId=fake&token=fake`),
            fetchWithRetry(`${BASE_URL}/api/contact`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ full_name: "تست", phone: "123", message: "کوتاه" }),
            }),
          ]);
          const capJson = await capRes.json();
          if (!capJson.success || !capJson.captchaToken) {
            throw new Error("تولید کپچای گفتگوی زنده ناموفق بود");
          }
          if (fakeChatRes.status !== 404 || contactRes.status !== 400) {
            throw new Error(
              `FakeChat:${fakeChatRes.status} / Contact:${contactRes.status}`
            );
          }
          return "کپچای SVG امضاشده، قفل نشست گفتگو و فیلتر فرم تماس سالم است";
        },
      },
    ],
  },
];

(async () => {
  const startedAll = Date.now();
  console.log(`\n🚀 شروع تست جامع ۲۴ مرحله‌ای روی ${BASE_URL} ...\n`);

  let totalPassed = 0;
  let totalTests = 0;

  for (const grp of testGroups) {
    console.log(`━━━ ${grp.group} ━━━`);
    for (const t of grp.tests) {
      totalTests++;
      try {
        const detail = await t.run();
        console.log(`  ✅ [PASS] ${t.name}\n     ↳ ${detail}`);
        totalPassed++;
      } catch (err) {
        console.log(`  ❌ [FAIL] ${t.name}\n     ↳ ${err.message}`);
      }
    }
    console.log("");
  }

  const durationSec = ((Date.now() - startedAll) / 1000).toFixed(1);
  console.log(
    `📊 نتیجه نهایی کل سایت: ${totalPassed} از ${totalTests} تست در ${durationSec} ثانیه با موفقیت پاس شد.\n`
  );

  if (totalPassed < totalTests) {
    process.exitCode = 1;
  }
})();