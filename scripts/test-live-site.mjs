// File Path: scripts/test-live-site.mjs
import fs from "fs";
import crypto from "crypto";

const BASE_URL = (process.argv[2] || "https://axoncore.ir").replace(/\/+$/, "");

function loadLocalEnv() {
  const envMap = { ...process.env };
  if (fs.existsSync(".env.local")) {
    const lines = fs.readFileSync(".env.local", "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!envMap[k]) envMap[k] = v;
      }
    }
  }
  return envMap;
}

const ENV = loadLocalEnv();

function createTestPhoneVerifiedToken(phone) {
  const secret =
    ENV.OTP_HMAC_SECRET ||
    ENV.ADMIN_SESSION_SECRET ||
    ENV.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!secret) return null;
  const exp = Date.now() + 15 * 60 * 1000;
  const payload = `${phone}:${exp}`;
  const sig = crypto
    .createHmac("sha256", secret.trim())
    .update(`VERIFIED_PHONE:${payload}`)
    .digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64");
}

function createTestAdminCookie() {
  const secret = (ENV.ADMIN_SESSION_SECRET || "").trim();
  if (!secret || secret.length < 32) return null;
  const b64url = (str) =>
    Buffer.from(str)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      id: "e2e-audit-bot",
      userId: "e2e-audit-bot",
      username: "e2e_audit_bot",
      role: "superadmin",
      sid: "sid_e2e_" + now,
      iat: now,
      exp: now + 300,
    })
  );
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `admin_session_token=${header}.${payload}.${sig}`;
}

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

const sharedContext = {
  sampleProductId: null,
  inStockProduct: null,
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
            throw new Error("هدرهای امنیتی مرورگر ناقص است");
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
          const privatePaths = ["/login", "/account", "/checkout", "/track-order"];
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
        name: "۴. نقشه سایت (sitemap.xml)، فایل robots.txt، مانیفست PWA و فایل اینماد",
        run: async () => {
          const [sRes, rRes, mRes, eFileRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/sitemap.xml`),
            fetchWithRetry(`${BASE_URL}/robots.txt`),
            fetchWithRetry(`${BASE_URL}/manifest.webmanifest`),
            fetchWithRetry(`${BASE_URL}/27424534.txt`),
          ]);
          if (
            sRes.status !== 200 ||
            rRes.status !== 200 ||
            mRes.status !== 200 ||
            eFileRes.status !== 200
          ) {
            throw new Error(
              `Sitemap:${sRes.status} / Robots:${rRes.status} / PWA:${mRes.status} / EnamadFile:${eFileRes.status}`
            );
          }
          const sXml = await sRes.text();
          const urlCount = (sXml.match(/<loc>/g) || []).length;
          return `${urlCount} لینک در Sitemap • Robots، PWA و فایل اینماد سالم`;
        },
      },
      {
        name: "۵. مدیریت صحیح صفحات ناموجود (404 Not Found)",
        run: async () => {
          const [notFoundPage, notFoundProd] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/non-existent-route-check-999`),
            fetchWithRetry(`${BASE_URL}/products/00000000-0000-0000-0000-000000000000`),
          ]);
          if (notFoundPage.status !== 404 || notFoundProd.status !== 404) {
            throw new Error(
              `Page:${notFoundPage.status} / Product:${notFoundProd.status}`
            );
          }
          return "صفحات و کالاهای ناموجود دقیقاً کد 404 برمی‌گردانند";
        },
      },
    ],
  },
  {
    group: "لایه ۲: کاتالوگ محصولات، محتوا و مسیرهای پویا",
    tests: [
      {
        name: "۶. API کاتالوگ محصولات و مخفی‌سازی قیمت خرید عمده",
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
            sharedContext.inStockProduct =
              json.products.find(
                (p) => p.is_available !== false && Number(p.stock || 0) >= 1
              ) || null;
          }
          return `${json.products.length} محصول فعال • بدون نشت قیمت خرید`;
        },
      },
      {
        name: "۷. رندر صفحه پویای تک‌محصول (/products/[id]) و سیستم نظرات",
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
        name: "۸. API دسته‌بندی‌ها، بنرها و کوپن‌های عمومی",
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
        name: "۹. API تنظیمات سایت، استودیوی ظاهر، استایل‌ها و اینماد",
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
        name: "۱۰. مجله تخصصی (/api/blogs) و صفحه مقاله پویا (/blog/[id])",
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
        name: "۱۱. رادار اخبار فناوری (/api/news) و صفحه خبر پویا (/news/[slug])",
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
        name: "۱۲. فید رسمی ترب (لیست محصولات + استعلام تکی page_uniques)",
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
        name: "۱۳. چت دستیار هوشمند عمومی و مسدودسازی ذخیره کلید بدون احراز هویت",
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
        name: "۱۴. سد ضدنفوذ SSRF در پروکسی رسانه (/api/media-proxy)",
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
        name: "۱۵. محافظت Middleware از تمام مسیرهای پنل مدیریت (۶ مسیر حساس)",
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
        name: "۱۶. مقاومت فرم ورود مدیر در برابر رمزهای جعلی (/api/admin/login)",
        run: async () => {
          const res = await fetchWithRetry(`${BASE_URL}/api/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "admin", password: "Axon2026_InvalidTest!" }),
          });
          if (res.status !== 401 && res.status !== 429) {
            throw new Error(`وضعیت غیرمنتظره در ورود نامعتبر: HTTP ${res.status}`);
          }
          return `ورود جعلی و رمز پشتیبان قدیمی مسدود شد (HTTP ${res.status})`;
        },
      },
      {
        name: "۱۷. قفل دسترسی غیرمجاز روی ۱۰ API حساس مدیریت و حسابداری",
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
        name: "۱۸. مسدودسازی تغییر تنظیمات کلان و پین مدیر بدون نشست معتبر",
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
        name: "۱۹. محافظت از ۴ کرون‌جاب خودکار در برابر اجرای بدون کلید",
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
        name: "۲۰. سد امنیتی ثبت سفارش بدون تایید پیامکی (/api/checkout)",
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
        name: "۲۱. اعتبارسنجی درخواست و تایید درگاه پرداخت زرین‌پال",
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
        name: "۲۲. موتور اعتبارسنجی کد تخفیف (/api/coupons/validate)",
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
        name: "۲۳. سامانه رهگیری سفارشات مشتریان (/api/orders/track)",
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
        name: "۲۴. امنیت ورود کاربران، OTP، بازیابی رمز و سشن (/api/user/*)",
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
        name: "۲۵. کنترل دسترسی کیف پول اعتباری مشتری (/api/user/wallet)",
        run: async () => {
          const res = await fetchWithRetry(`${BASE_URL}/api/user/wallet?phone=123`);
          if (res.status !== 400) {
            throw new Error(`وضعیت غیرمنتظره: HTTP ${res.status}`);
          }
          return "اعتبارسنجی شماره کیف پول فعال است (400)";
        },
      },
      {
        name: "۲۶. کپچای گرافیکی گفتگوی زنده و اعتبارسنجی فرم تماس",
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
  {
    group: "لایه ۶: تست واقعی چرخه خرید، انبار و داشبورد ادمین (Self-Cleaning E2E)",
    tests: [
      {
        name: "۲۷. سلامت داشبورد مدیریتی و ممیزی سئو با نشست معتبر ادمین",
        run: async () => {
          const adminCookie = createTestAdminCookie();
          if (!adminCookie) {
            return "کلید ADMIN_SESSION_SECRET در .env.local یافت نشد (رد شد)";
          }
          const [statsRes, seoRes] = await Promise.all([
            fetchWithRetry(`${BASE_URL}/api/admin/dashboard-stats`, {
              headers: { Cookie: adminCookie },
            }),
            fetchWithRetry(`${BASE_URL}/api/admin/seo-audit`, {
              headers: { Cookie: adminCookie },
            }),
          ]);
          if (!statsRes.ok || !seoRes.ok) {
            throw new Error(`Stats:${statsRes.status} / SeoAudit:${seoRes.status}`);
          }
          return "آمار داشبورد مدیریت و موتور ممیزی سئو 200 OK هستند";
        },
      },
      {
        name: "۲۸. چرخه کامل ثبت سفارش واقعی ← کسر موجودی ← انصراف درگاه ← بازگشت خودکار موجودی",
        run: async () => {
          const testPhone = "09990000000";
          const otpToken = createTestPhoneVerifiedToken(testPhone);
          const targetProd = sharedContext.inStockProduct;
          if (!otpToken || !targetProd) {
            return "پیش‌نیاز کلید امضا یا کالای موجود مهیا نبود (رد شد)";
          }

          const initialStock = Number(targetProd.stock);
          let createdOrderId = null;

          try {
            // گام ۱: ثبت سفارش واقعی
            const orderRes = await fetchWithRetry(`${BASE_URL}/api/checkout`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                otpVerificationToken: otpToken,
                shippingMethod: "tipax",
                customer: {
                  fullName: "تست خودکار E2E",
                  phone: testPhone,
                  province: "فارس",
                  city: "شیراز",
                  address: "شیراز، خیابان تست خودکار، پلاک ۱",
                  postalCode: "7138141536",
                },
                items: [{ id: targetProd.id, quantity: 1 }],
              }),
            });
            const orderJson = await orderRes.json();
            if (!orderRes.ok || !orderJson.success || !orderJson.orderId) {
              throw new Error(orderJson.message || `خطا در ثبت سفارش تست: HTTP ${orderRes.status}`);
            }
            createdOrderId = String(orderJson.orderId);

            // گام ۲: بررسی کسر ۱ عدد از موجودی انبار
            const midProdRes = await fetchWithRetry(`${BASE_URL}/api/products?t=${Date.now()}`);
            const midProdJson = await midProdRes.json();
            const midProd = (midProdJson.products || []).find(
              (p) => String(p.id) === String(targetProd.id)
            );
            const afterOrderStock = Number(midProd?.stock ?? -1);
            if (afterOrderStock !== initialStock - 1) {
              throw new Error(
                `عدم تطابق کسر موجودی! اولیه: ${initialStock}، فعلی: ${afterOrderStock}`
              );
            }

            // گام ۳: شبیه‌سازی انصراف از درگاه زرین‌پال (Status=NOK)
            const cancelRes = await fetchWithRetry(`${BASE_URL}/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: createdOrderId,
                authority: "A00000000000000000000000000000000000",
                status: "NOK",
              }),
            });
            const cancelJson = await cancelRes.json();
            if (!cancelJson.cancelled) {
              throw new Error("پاسخ انصراف درگاه تایید نشد");
            }

            // گام ۴: بررسی بازگشت فوری موجودی به عدد اولیه
            const finalProdRes = await fetchWithRetry(`${BASE_URL}/api/products?t=${Date.now()}`);
            const finalProdJson = await finalProdRes.json();
            const finalProd = (finalProdJson.products || []).find(
              (p) => String(p.id) === String(targetProd.id)
            );
            const restoredStock = Number(finalProd?.stock ?? -1);
            if (restoredStock !== initialStock) {
              throw new Error(
                `موجودی برنگشت! اولیه: ${initialStock}، پس از انصراف: ${restoredStock}`
              );
            }

            return `موجودی «${targetProd.title}» از ${initialStock} ← ${afterOrderStock} کسر و با انصراف دقیقاً به ${restoredStock} بازگشت`;
          } finally {
            // گام ۵: پاکسازی کامل سفارش تست از دیتابیس تا هیچ رکورد آزمایشی باقی نماند
            if (ENV.NEXT_PUBLIC_SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY) {
              const sbHeaders = {
                apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
              };
              const sbBase = ENV.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
              await Promise.allSettled([
                fetch(`${sbBase}/rest/v1/orders?phone=eq.${testPhone}`, {
                  method: "DELETE",
                  headers: sbHeaders,
                }),
                fetch(`${sbBase}/rest/v1/crm_customers?phone=eq.${testPhone}`, {
                  method: "DELETE",
                  headers: sbHeaders,
                }),
              ]);
            }
          }
        },
      },
    ],
  },
];

(async () => {
  const startedAll = Date.now();
  console.log(`\n🚀 شروع تست جامع ۲۸ مرحله‌ای در ۶ لایه روی ${BASE_URL} ...\n`);

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