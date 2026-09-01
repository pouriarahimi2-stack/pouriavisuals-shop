// File Path: live-audit.js
const https = require('https');
const http = require('http');

console.clear();
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🛡️ سامانه تست خودکار، پایش امنیت و ارزیابی زنده فروشگاه آکسون');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════\n');

const DOMAIN = process.env.SITE_URL || 'https://axoncore.ir';

const TEST_SUITE = [
  { name: '۱. صفحه اصلی فروشگاه (SSR Home)', path: '/', method: 'GET' },
  { name: '۲. کاتالوگ مانیتورها و محصولات', path: '/products', method: 'GET' },
  { name: '۳. هاب جدیدترین اخبار تکنولوژی', path: '/news', method: 'GET' },
  { name: '۴. مجله مقالات تخصصی و سئو', path: '/blog', method: 'GET' },
  { name: '۵. سامانه رهگیری مرسولات پستی', path: '/track-order', method: 'GET' },
  { name: '۶. فرم تیکت و مشاوره آنلاین', path: '/contact', method: 'GET' },
  { name: '۷. تاییدیه اینماد (Enamad txt)', path: '/27424534.txt', method: 'GET', expectedBody: '27424534' },
  { name: '۸. وب‌سرویس پایش قیمت ترب (Torob API)', path: '/api/torob', method: 'GET' },
  { name: '۹. وب‌سرویس هویت بصری و فونت‌ها', path: '/api/styles', method: 'GET' },
  { name: '۱۰. وب‌سرویس تنظیمات سایت (Site Info)', path: '/api/site-info', method: 'GET' },
  { name: '۱۱. تست امنیت ورود ادمین (Brute Force Guard)', path: '/api/admin/login', method: 'POST', body: JSON.stringify({ username: 'test_audit', password: 'wrong_password' }), expectedStatus: 401 },
  { name: '۱۲. تست دستیار هوش مصنوعی (Gemini Engine)', path: '/api/ai-assistant', method: 'POST', body: JSON.stringify({ message: 'سلام، وضعیت مانیتورها چطوره؟' }) }
];

function request(urlPath, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const fullUrl = new URL(urlPath, DOMAIN);
    const client = fullUrl.protocol === 'https:' ? https : http;
    const startTime = Date.now();

    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || (fullUrl.protocol === 'https:' ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method: method,
      headers: {
        'User-Agent': 'Axon-Live-Audit-Agent/2026.1',
        'Accept': '*/*',
        ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {})
      },
      timeout: 10000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const latency = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          latency: latency,
          ok: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 'ERR', latency: Date.now() - startTime, error: err.message, ok: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 'TIMEOUT', latency: 10000, error: 'سرور در مدت ۱۰ ثانیه پاسخ نداد', ok: false });
    });

    if (body) req.write(body);
    req.end();
  });
}

async function startAudit() {
  console.log(`📡 در حال اتصال به سرور هدف: \x1b[32m${DOMAIN}\x1b[0m\n`);
  let passed = 0;
  let failed = 0;

  for (const test of TEST_SUITE) {
    process.stdout.write(`⏳ در حال سنجش: ${test.name} ... `);
    const res = await request(test.path, test.method, test.body);

    let isSuccess = false;
    if (test.expectedStatus) {
      isSuccess = res.statusCode === test.expectedStatus;
    } else if (test.expectedBody) {
      isSuccess = res.data && res.data.trim() === test.expectedBody.trim();
    } else {
      isSuccess = res.ok;
    }

    if (isSuccess) {
      passed++;
      console.log(`\x1b[32m[موفق - ${res.statusCode}]\x1b[0m (\x1b[33m${res.latency}ms\x1b[0m)`);
    } else {
      failed++;
      console.log(`\x1b[31m[ناموفق - ${res.statusCode}]\x1b[0m | خطا: ${res.error || 'کد وضعیت غیرمنتظره'}`);
    }
  }

  console.log('\n\x1b[36m%s\x1b[0m', '───────────────────────────────────────────────────────────────');
  console.log(`🏁 \x1b[1mنتیجه مانیتورینگ سلامت:\x1b[0m \x1b[32m${passed} مورد موفق\x1b[0m | \x1b[31m${failed} خطا\x1b[0m`);
  
  if (failed === 0) {
    console.log('\x1b[32m%s\x1b[0m', '🎉 تبریک! سرور، دیتابیس، هوش مصنوعی، اینماد و روت‌های سایت در بالاترین سطح پایداری و بدون خطا فعال هستند.');
  } else {
    console.log('\x1b[31m%s\x1b[0m', '⚠️ بخش‌های دارای خطا نیازمند بررسی لاگ یا بازبینی متغیرهای محیطی Vercel/Supabase هستند.');
  }
  console.log('\x1b[36m%s\x1b[0m', '───────────────────────────────────────────────────────────────\n');
}

startAudit();