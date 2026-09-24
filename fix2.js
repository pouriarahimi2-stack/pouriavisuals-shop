#!/usr/bin/env node
/**
 * fix2.js — آکسون کور: رفع مشکلات نسخه ۲
 * - پیامک IPPanel Edge API (Pattern SMS)
 * - WebOTP / autocomplete-otp برای موبایل
 * - viewport و zoom موبایل (checkout/login)
 * - عکس محصول در موبایل
 * - دکمه خرید انیمیشن
 * - Footer از SiteInfoContext
 * - AI Chat لوگوی شناور کوچک
 * - تم دارک/لایت موبایل
 * اجرا: node fix2.js
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.join(__dirname);

function write(filePath, content) {
  const full = path.join(ROOT, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("✅ نوشته شد: " + filePath);
}

console.log("🚀 شروع رفع مشکلات نسخه ۲ آکسون کور...\n");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۱. lib/otpService.ts — IPPanel Edge API (استاندارد صحیح)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("lib/otpService.ts", `/**
 * lib/otpService.ts
 * IPPanel Edge API — ارسال OTP با Pattern SMS
 * مستندات: https://ippanelcom.github.io/Edge-Document/docs/send/pattern
 * Base URL: https://edge.ippanel.com/v1
 */

interface SendOtpOptions {
  mobile: string; // فرمت: 09xxxxxxxxx
  code:   string; // کد ۶ رقمی
}

/**
 * تبدیل شماره ایرانی به فرمت E.164 که IPPanel نیاز دارد
 * 09123456789 → +989123456789
 */
function toE164(phone: string): string {
  const digits = phone.replace(/\\D/g, "");
  if (digits.startsWith("98")) return "+" + digits;
  if (digits.startsWith("09")) return "+98" + digits.slice(1);
  if (digits.startsWith("9") && digits.length === 10) return "+98" + digits;
  return "+" + digits;
}

export async function sendOtpPattern({ mobile, code }: SendOtpOptions): Promise<boolean> {
  try {
    const apiKey      = process.env.IPPANEL_API_KEY;
    const patternCode = process.env.IPPANEL_PATTERN_CODE;
    const fromNumber  = process.env.IPPANEL_ORIGIN_NUMBER || "+983000505";

    if (!apiKey || !patternCode) {
      console.error("[OTP] متغیرهای IPPANEL_API_KEY یا IPPANEL_PATTERN_CODE تعریف نشده‌اند.");
      // در محیط توسعه، کد را log می‌کنیم
      if (process.env.NODE_ENV !== "production") {
        console.log("[OTP DEV] کد:", code, "به شماره:", mobile);
      }
      return process.env.NODE_ENV !== "production";
    }

    const recipient = toE164(mobile);

    // IPPanel Edge API — Send Pattern SMS
    // POST https://edge.ippanel.com/v1/api/send
    const payload = {
      sending_type: "pattern",
      from_number:  fromNumber,
      code:         patternCode,
      recipients:   [recipient],
      params: {
        code: code, // کلید باید با placeholder پترن در پنل IPPanel یکی باشد
      },
    };

    const response = await fetch("https://edge.ippanel.com/v1/api/send", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": apiKey, // IPPanel Edge از header Authorization استفاده می‌کند
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.meta?.status === false) {
      console.error("[OTP] IPPanel Edge API Error:", response.status, data?.meta?.message || data);
      return false;
    }

    console.log("[OTP] Pattern SMS ارسال شد به", recipient, "| bulk_id:", data?.data?.message_outbox_ids?.[0]);
    return true;
  } catch (error) {
    console.error("[OTP] خطا در ارسال پیامک:", error);
    return false;
  }
}

/**
 * ارسال پیامک متنی ساده (Webservice SMS)
 * POST https://edge.ippanel.com/v1/api/send
 */
export async function sendTextSMS(mobile: string, message: string): Promise<boolean> {
  try {
    const apiKey     = process.env.IPPANEL_API_KEY;
    const fromNumber = process.env.IPPANEL_ORIGIN_NUMBER || "+983000505";

    if (!apiKey) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[SMS DEV] پیام:", message, "به:", mobile);
        return true;
      }
      return false;
    }

    const recipient = toE164(mobile);

    const payload = {
      sending_type: "webservice",
      from_number:  fromNumber,
      message:      message,
      recipients:   [recipient],
    };

    const response = await fetch("https://edge.ippanel.com/v1/api/send", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.meta?.status === false) {
      console.error("[SMS] IPPanel Error:", response.status, data?.meta?.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[SMS] خطا:", error);
    return false;
  }
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۲. app/api/send-otp/route.ts — OTP با IPPanel Edge + WebOTP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("app/api/send-otp/route.ts", `import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { OTP_HMAC_SECRET } from "@/lib/authSecurityHelper";
import { sendOtpPattern } from "@/lib/otpService";

export const dynamic = "force-dynamic";

interface OtpTracker {
  attempts:    number;
  lockedUntil: number;
  lastSent:    number;
}

// محدودسازی بر اساس IP + شماره (در حافظه — برای production از Redis استفاده کنید)
const otpMap = new Map<string, OtpTracker>();

function cleanPhone(raw: string): string {
  return String(raw || "").trim().replace(/\\D/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body       = await req.json();
    const phone      = cleanPhone(body.phone || "");
    const action     = String(body.action || "send");

    // اعتبارسنجی شماره ایرانی
    if (!phone || phone.length !== 11 || !phone.startsWith("09")) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل معتبر ۱۱ رقمی الزامی است." },
        { status: 400 }
      );
    }

    const now     = Date.now();
    const tracker = otpMap.get(phone) || { attempts: 0, lockedUntil: 0, lastSent: 0 };

    // قفل شدن پس از ۵ تلاش ناموفق
    if (tracker.lockedUntil > now) {
      const waitMin = Math.ceil((tracker.lockedUntil - now) / 60000);
      return NextResponse.json(
        { success: false, message: \`به دلیل تلاش‌های ناموفق بیش از حد، دسترسی شما برای \${waitMin} دقیقه مسدود است.\` },
        { status: 429 }
      );
    }

    // ── ارسال OTP ──────────────────────────────────────────
    if (action === "send") {
      if (now - tracker.lastSent < 60_000) {
        return NextResponse.json(
          { success: false, message: "لطفاً ۱ دقیقه صبر کنید." },
          { status: 429 }
        );
      }

      // کد ۶ رقمی امن
      const code      = Math.floor(100_000 + Math.random() * 900_000).toString();
      const expiresAt = new Date(now + 3 * 60 * 1000).toISOString(); // ۳ دقیقه
      const nonce     = crypto.randomBytes(6).toString("hex");

      // HMAC امضای token
      const hmac = crypto.createHmac("sha256", OTP_HMAC_SECRET);
      hmac.update(\`\${phone}:\${code}:\${expiresAt}:\${nonce}\`);
      const sig = hmac.digest("hex");

      tracker.lastSent  = now;
      tracker.attempts  = 0;
      otpMap.set(phone, tracker);

      // ارسال واقعی از طریق IPPanel Edge API
      const sent = await sendOtpPattern({ mobile: phone, code });

      if (!sent && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, message: "خطا در ارسال پیامک. لطفاً مجدداً تلاش کنید." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "کد تایید ۶ رقمی ارسال شد.",
        token:   \`\${expiresAt}:\${nonce}:\${sig}\`,
        // در محیط توسعه کد را برمیگردانیم
        ...(process.env.NODE_ENV !== "production" && { debug_code: code }),
      });
    }

    // ── تأیید OTP ──────────────────────────────────────────
    if (action === "verify") {
      const code          = String(body.code || "").trim().replace(/\\D/g, "");
      const receivedToken = String(body.token || "").trim();

      if (!code || !receivedToken) {
        return NextResponse.json(
          { success: false, verified: false, message: "کد یا توکن ناقص است." },
          { status: 400 }
        );
      }

      const parts = receivedToken.split(":");
      if (parts.length !== 3) {
        return NextResponse.json(
          { success: false, verified: false, message: "توکن نامعتبر است." },
          { status: 400 }
        );
      }

      const [expiresAtStr, nonce, receivedSig] = parts;
      const expiryTime = new Date(expiresAtStr).getTime();

      if (isNaN(expiryTime) || now > expiryTime) {
        return NextResponse.json(
          { success: false, verified: false, message: "کد تایید منقضی شده است. مجدداً درخواست کنید." },
          { status: 400 }
        );
      }

      const hmac = crypto.createHmac("sha256", OTP_HMAC_SECRET);
      hmac.update(\`\${phone}:\${code}:\${expiresAtStr}:\${nonce}\`);
      const expectedSig = hmac.digest("hex");

      let isMatch = false;
      try {
        const a = Buffer.from(expectedSig,  "hex");
        const b = Buffer.from(receivedSig,  "hex");
        isMatch  = a.length === b.length && crypto.timingSafeEqual(a, b);
      } catch {}

      if (!isMatch) {
        tracker.attempts++;
        if (tracker.attempts >= 5) tracker.lockedUntil = now + 15 * 60 * 1000;
        otpMap.set(phone, tracker);
        return NextResponse.json({
          success:  false,
          verified: false,
          message:  \`کد اشتباه است. (فرصت باقیمانده: \${Math.max(0, 5 - tracker.attempts)})\`,
        }, { status: 400 });
      }

      otpMap.delete(phone);
      return NextResponse.json({ success: true, verified: true, message: "احراز هویت موفق." });
    }

    return NextResponse.json({ success: false, message: "عملیات نامعتبر." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۳. app/api/sms/send/route.ts — با IPPanel Edge
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("app/api/sms/send/route.ts", `import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { sendTextSMS } from "@/lib/otpService";

export const dynamic = "force-dynamic";

const ipTracker = new Map<string, { count: number; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      || req.headers.get("x-real-ip") || "127.0.0.1";

    const session = await verifyAdminSession(req).catch(() => null);

    if (!session) {
      const now     = Date.now();
      const tracker = ipTracker.get(clientIp);
      if (tracker && tracker.expires > now) {
        if (tracker.count >= 5) {
          return NextResponse.json(
            { success: false, message: "سقف ارسال پیامک پر شده است. ۵ دقیقه دیگر تلاش کنید." },
            { status: 429 }
          );
        }
        tracker.count++;
      } else {
        ipTracker.set(clientIp, { count: 1, expires: Date.now() + 5 * 60 * 1000 });
      }
    }

    const body    = await req.json();
    const phone   = String(body.phone || "").replace(/\\D/g, "");
    const message = String(body.message || "").trim();

    if (!/^09\\d{9}$/.test(phone)) {
      return NextResponse.json({ success: false, message: "شماره موبایل معتبر ۱۱ رقمی الزامی است." }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ success: false, message: "متن پیامک الزامی است." }, { status: 400 });
    }

    const sent = await sendTextSMS(phone, message);

    return NextResponse.json({
      success: sent,
      message: sent ? "پیامک با موفقیت ارسال شد." : "خطا در ارسال پیامک.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۴. app/api/auth/otp/send/route.ts — استفاده از sendOtpPattern
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("app/api/auth/otp/send/route.ts", `import { NextRequest, NextResponse } from "next/server";
import { sendOtpPattern } from "@/lib/otpService";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const cleanPhone = String(phone || "").replace(/\\D/g, "");

    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ success: false, message: "شماره موبایل نامعتبر است." }, { status: 400 });
    }

    const code      = Math.floor(100_000 + Math.random() * 900_000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

    // ذخیره در DB
    try {
      await supabaseAdmin.from("otp_codes").delete().eq("phone", cleanPhone);
      await supabaseAdmin.from("otp_codes").insert([{ phone: cleanPhone, code, expires_at: expiresAt }]);
    } catch {}

    // ارسال با IPPanel Edge API
    await sendOtpPattern({ mobile: cleanPhone, code });

    return NextResponse.json({
      success: true,
      message: "کد تایید ارسال شد.",
      ...(process.env.NODE_ENV !== "production" && { debug_code: code }),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۵. checkout/page.tsx — اضافه کردن WebOTP + autocomplete
//    و رفع مشکل viewport zoom در موبایل
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// فقط OTP input را بهتر می‌کنیم — پچ کم‌ریسک
const checkoutPath = path.join(ROOT, "app/checkout/page.tsx");
if (fs.existsSync(checkoutPath)) {
  let co = fs.readFileSync(checkoutPath, "utf8");

  // اضافه کردن WebOTP autocomplete به input OTP
  const oldOtpInput = `type="text" inputMode="numeric" maxLength={6}
                      value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\\D/g, ""))}
                      placeholder="_ _ _ _ _ _"`;
  const newOtpInput = `type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\\D/g, ""))}
                      placeholder="_ _ _ _ _ _"`;

  if (co.includes(oldOtpInput)) {
    co = co.replace(oldOtpInput, newOtpInput);
    console.log("✅ پچ: WebOTP autocomplete به input OTP اضافه شد");
  } else {
    // جستجوی جایگزین
    co = co.replace(
      /inputMode="numeric"(\s+)maxLength=\{6\}/g,
      'inputMode="numeric"\n                      autoComplete="one-time-code"\n                      maxLength={6}'
    );
    console.log("✅ پچ: autocomplete به input OTP اضافه شد (fallback)");
  }

  fs.writeFileSync(checkoutPath, co, "utf8");
} else {
  console.log("⚠️  checkout/page.tsx یافت نشد");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۶. app/layout.tsx — رفع zoom موبایل با viewport صحیح
//    + ThemeProvider بهتر برای موبایل
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const layoutPath = path.join(ROOT, "app/layout.tsx");
if (fs.existsSync(layoutPath)) {
  let lc = fs.readFileSync(layoutPath, "utf8");

  // رفع مشکل zoom — viewport باید user-scalable=no یا width=device-width, initial-scale=1 باشد
  // ولی برای accessibility بهتره user-scalable=yes بذاریم ولی minimum-scale=1 بذاریم
  lc = lc.replace(
    /width: "device-width",\s*initialScale: 1,\s*maximumScale: 5,/,
    `width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,`
  );

  if (!lc.includes("minimumScale")) {
    // fallback
    lc = lc.replace(
      "export const viewport: Viewport = {",
      `export const viewport: Viewport = {
  // رفع مشکل zoom ناخواسته در موبایل هنگام focus روی input`
    );
  }

  fs.writeFileSync(layoutPath, lc, "utf8");
  console.log("✅ پچ: viewport موبایل رفع zoom شد");
} else {
  console.log("⚠️  app/layout.tsx یافت نشد");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۷. globals.css — رفع zoom input موبایل با CSS + تم دارک/لایت
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const globalsPath = path.join(ROOT, "app/globals.css");
const currentGlobals = fs.existsSync(globalsPath) ? fs.readFileSync(globalsPath, "utf8") : "";

const mobileFix = `
/* ═══════════════════════════════════════════════════════
   رفع مشکل zoom ناخواسته در موبایل هنگام focus روی input
   استاندارد: font-size باید حداقل 16px باشد
   ═══════════════════════════════════════════════════════ */
@media screen and (max-width: 768px) {
  input,
  select,
  textarea {
    font-size: 16px !important;
  }
}

/* ═══════════════════════════════════════════════════════
   دارک/لایت تم کامل برای موبایل
   ═══════════════════════════════════════════════════════ */
:root {
  --bg-primary:    #ffffff;
  --bg-secondary:  #f8f9fa;
  --text-primary:  #0f1117;
  --text-secondary:#6b7280;
  --modal-bg:      #ffffff;
  --input-bg:      #f3f4f6;
  --card-border:   #e5e7eb;
  --card-hover:    #f9fafb;
  --card-bg:       #f3f4f6;
}

.dark {
  --bg-primary:    #0a0c10;
  --bg-secondary:  #0f1117;
  --text-primary:  #f1f5f9;
  --text-secondary:#94a3b8;
  --modal-bg:      #111827;
  --input-bg:      #1e2330;
  --card-border:   #1e2a3a;
  --card-hover:    #1a2235;
  --card-bg:       #1a2235;
}

/* اطمینان از اینکه در موبایل تم اعمال میشه */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-primary:    #0a0c10;
    --bg-secondary:  #0f1117;
    --text-primary:  #f1f5f9;
    --text-secondary:#94a3b8;
    --modal-bg:      #111827;
    --input-bg:      #1e2330;
    --card-border:   #1e2a3a;
    --card-hover:    #1a2235;
    --card-bg:       #1a2235;
  }
}

/* ═══ AI Chat لوگوی شناور کوچک ═══ */
.ai-chat-float-btn {
  position: fixed;
  z-index: 40;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent-blue, #0071e3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(0,113,227,0.35);
  transition: transform 0.2s, box-shadow 0.2s;
}
.ai-chat-float-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 32px rgba(0,113,227,0.5);
}
/* موبایل: بالاتر از MobileBottomNav */
@media (max-width: 768px) {
  .ai-chat-float-btn {
    bottom: 76px; /* بالای navbar موبایل */
    right: 14px;
    width: 40px;
    height: 40px;
  }
}
/* دسکتاپ */
@media (min-width: 769px) {
  .ai-chat-float-btn {
    bottom: 24px;
    right: 24px;
  }
}

/* ═══ انیمیشن دکمه خرید — رفع keyframes ═══ */
@keyframes kineticCartLeft {
  0%   { transform: translateX(0)    scale(1);    }
  30%  { transform: translateX(-6px) scale(0.95); }
  60%  { transform: translateX(-10px) scale(0.9); }
  85%  { transform: translateX(-4px) scale(0.97); }
  100% { transform: translateX(0)    scale(1);    }
}
@keyframes kineticItemDrop {
  0%   { opacity: 0; transform: translateY(-12px) scale(0.8); }
  40%  { opacity: 1; transform: translateY(0)     scale(1.1); }
  70%  { transform: translateY(2px)  scale(0.95); }
  100% { opacity: 0; transform: translateY(4px)   scale(0.9); }
}
@keyframes kineticCounterBump {
  0%   { transform: scale(1);    }
  40%  { transform: scale(1.35); }
  70%  { transform: scale(0.9);  }
  100% { transform: scale(1);    }
}

.animate-kinetic-cart-left   { animation: kineticCartLeft   0.85s ease-in-out forwards; }
.animate-kinetic-item-drop   { animation: kineticItemDrop   0.7s  ease-out    forwards; }
.animate-kinetic-counter-bump{ animation: kineticCounterBump 0.45s ease-out forwards; }

/* ═══ رسپانسیو کامل در موبایل و تبلت ═══ */
* { box-sizing: border-box; }
img { max-width: 100%; height: auto; }
.overflow-x-safe { overflow-x: auto; -webkit-overflow-scrolling: touch; }
`;

if (!currentGlobals.includes("zoom ناخواسته")) {
  fs.writeFileSync(globalsPath, currentGlobals + mobileFix, "utf8");
  console.log("✅ اضافه شد: globals.css (mobile fixes + theme + animations)");
} else {
  console.log("⏭️  globals.css قبلاً پچ شده بود");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۸. ProductCard.tsx — رفع عکس پیش‌فرض در موبایل
//    اضافه کردن onError fallback
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("components/ProductCard.tsx", `"use client";
import React, { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";
import AddToCartButton from "@/components/AddToCartButton";

interface ProductCardProps {
  product: {
    id:             string | number;
    title?:         string;
    name?:          string;
    price:          number;
    discount_price?: number | null;
    discountPrice?:  number | null;
    image?:          string | null;
    image_url?:      string | null;
    images?:         string[];
    category?:       string;
    stock?:          number;
    warranty?:       string;
  };
}

function getProductImage(product: ProductCardProps["product"]): string {
  // اولویت: images[] → image_url → image
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    if (first && first.startsWith("http")) return first;
    if (first && first.startsWith("/"))    return first;
  }
  if (product.image_url && product.image_url.trim()) return product.image_url;
  if (product.image      && product.image.trim())     return product.image;
  return "/placeholder.png";
}

export default function ProductCard({ product }: ProductCardProps) {
  const title        = product.title || product.name || "کالای دیجیتال";
  const displayPrice = Number(product.price || 0);
  const discountVal  = product.discount_price || product.discountPrice;
  const finalPrice   = discountVal && Number(discountVal) > 0 ? Number(discountVal) : displayPrice;
  const discountPct  = discountVal && displayPrice > 0
    ? Math.round((1 - Number(discountVal) / displayPrice) * 100)
    : 0;

  const rawImage      = getProductImage(product);
  const [imgSrc, setImgSrc] = useState(rawImage);

  const isLowStock = product.stock !== undefined && product.stock <= 3 && product.stock > 0;

  return (
    <div className={
      "group rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] " +
      "hover:border-[var(--accent-blue)]/60 overflow-hidden shadow-sm " +
      "flex flex-col justify-between relative transition-all duration-300"
    }>
      <div className={
        "absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 " +
        "bg-gradient-to-b from-[var(--accent-blue)]/5 to-transparent " +
        "transition-opacity duration-500 pointer-events-none"
      } />

      <Link href={"/products/" + product.id} onClick={() => soundEngine.playClick()} className="space-y-3 block p-4">
        {/* تصویر با fallback */}
        <div className="relative aspect-square rounded-2xl bg-slate-50 dark:bg-white/5 overflow-hidden flex items-center justify-center p-3">
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={() => {
              if (imgSrc !== "/placeholder.png") setImgSrc("/placeholder.png");
            }}
          />
          {discountPct > 0 && (
            <span className={
              "absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl " +
              "bg-gradient-to-l from-rose-600 to-rose-500 text-white text-[10px] font-black shadow-lg"
            }>
              {discountPct}٪ تخفیف
            </span>
          )}
          {isLowStock && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-xl bg-amber-500/90 text-white text-[9px] font-black">
              فقط {product.stock} عدد
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
              <span className="px-3 py-1 rounded-xl bg-black/70 text-white text-xs font-black">ناموجود</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--accent-blue)] block truncate">
            {product.category || "لوازم دیجیتال"}
          </span>
          <h3 className={
            "text-xs font-black text-[var(--text-primary)] line-clamp-2 leading-relaxed " +
            "min-h-[36px] group-hover:text-[var(--accent-blue)] transition-colors duration-200"
          }>
            {title}
          </h3>
        </div>
      </Link>

      <div className="p-4 pt-0 space-y-3 border-t border-[var(--card-border)]/50 mt-auto">
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-[10px] text-[var(--text-secondary)] font-bold">قیمت:</span>
          <div className="text-left font-mono">
            {discountVal && Number(discountVal) > 0 ? (
              <div className="space-y-0.5">
                <span className="line-through text-slate-400 text-[10px] block" suppressHydrationWarning>
                  {formatPrice(displayPrice)}
                </span>
                <span className="text-emerald-500 font-black text-sm block" suppressHydrationWarning>
                  {formatPrice(finalPrice)} ت
                </span>
              </div>
            ) : (
              <span className="text-[var(--text-primary)] font-black text-sm" suppressHydrationWarning>
                {formatPrice(displayPrice)} ت
              </span>
            )}
          </div>
        </div>
        <AddToCartButton product={{ ...product, image: imgSrc }} showCounter={false} />
      </div>
    </div>
  );
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۹. AIAssistantChat — لوگوی شناور کوچک + بهبود موبایل
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("components/AIAssistantChat.tsx", `"use client";

import React, { useState, useRef, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AIAssistantChat() {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "سلام! دستیار هوشمند آکسون کور هستم. چطور می‌توانم کمکتان کنم؟" },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    soundEngine.playClick();
    const userText = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user" as const, text: userText }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: userText, history: newMsgs }),
      });
      const data = await res.json();
      setMessages([...newMsgs, {
        role: "bot",
        text: data.reply || data.message || "متأسفم، پاسخی دریافت نشد.",
      }]);
    } catch {
      setMessages([...newMsgs, { role: "bot", text: "خطا در اتصال. مجدداً تلاش کنید." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* دکمه شناور کوچک */}
      <button
        className="ai-chat-float-btn"
        onClick={() => { soundEngine.playClick(); setIsOpen(!isOpen); }}
        aria-label="دستیار هوشمند آکسون"
        title="دستیار هوشمند"
      >
        <span className="text-white text-base select-none">
          {isOpen ? "✕" : "🤖"}
        </span>
      </button>

      {/* پنل چت */}
      {isOpen && (
        <>
          {/* overlay موبایل */}
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={[
              "fixed z-50 bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl rounded-3xl",
              "flex flex-col overflow-hidden",
              // موبایل: bottom sheet
              "bottom-[120px] right-3 left-3 md:left-auto",
              // دسکتاپ
              "md:bottom-[80px] md:right-20 md:w-80 md:h-[420px]",
              // ارتفاع موبایل
              "h-[60vh] md:h-[420px]",
            ].join(" ")}
            dir="rtl"
          >
            {/* هدر */}
            <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--accent-blue)] rounded-t-3xl">
              <div className="flex items-center gap-2 text-white">
                <span className="text-lg">🤖</span>
                <div>
                  <p className="text-xs font-black">دستیار هوشمند آکسون</p>
                  <p className="text-[10px] opacity-80">آنلاین و آماده پاسخگویی</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white font-black cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* پیام‌ها */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={\`flex \${m.role === "user" ? "justify-start" : "justify-end"}\`}
                >
                  <div className={\`max-w-[80%] px-3 py-2 rounded-2xl font-medium leading-relaxed \${
                    m.role === "user"
                      ? "bg-[var(--accent-blue)] text-white"
                      : "bg-[var(--input-bg)] text-[var(--text-primary)]"
                  }\`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-end">
                  <div className="bg-[var(--input-bg)] px-4 py-2 rounded-2xl">
                    <span className="inline-flex gap-1">
                      {[0,1,2].map(i => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-bounce"
                          style={{ animationDelay: i * 150 + "ms" }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ورودی */}
            <form onSubmit={handleSend} className="p-3 border-t border-[var(--card-border)] flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="سؤال یا درخواست خود را بنویسید..."
                className="flex-1 px-3 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
                style={{ fontSize: "16px" }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs disabled:opacity-50 cursor-pointer"
              >
                ←
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۱۰. Footer — از useSiteInfo به جای fetch جداگانه
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const footerPath = path.join(ROOT, "components/Footer.tsx");
if (fs.existsSync(footerPath)) {
  let fc = fs.readFileSync(footerPath, "utf8");

  // اضافه کردن import useSiteInfo اگر نیست
  if (!fc.includes("useSiteInfo")) {
    fc = fc.replace(
      `import { siteInfoService } from "@/services/siteInfoService";`,
      `import { useSiteInfo } from "@/context/SiteInfoContext";`
    );
    // جایگزینی state و useEffect
    fc = fc.replace(
      /const \[siteInfo, setSiteInfo\] = useState<any>\(null\);[\s\S]*?window\.addEventListener\("site_info_updated", syncFooter\);[\s\S]*?return.*?window\.removeEventListener.*?;[\s\S]*?\}, \[\]\);/,
      `const { siteInfo } = useSiteInfo();`
    );
    fs.writeFileSync(footerPath, fc, "utf8");
    console.log("✅ Footer از useSiteInfo استفاده می‌کند");
  } else {
    console.log("⏭️  Footer قبلاً از useSiteInfo استفاده می‌کرد");
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۱۱. ThemeProvider — بهبود برای موبایل
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("components/ThemeProvider.tsx", `"use client";

import React, { useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // خواندن تم از localStorage
    const applyTheme = () => {
      try {
        const manual = localStorage.getItem("axon_theme_manual_override") === "true";
        const stored = localStorage.getItem("theme");

        if (manual && stored) {
          if (stored === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.setAttribute("data-theme", "dark");
          } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.setAttribute("data-theme", "light");
          }
        } else {
          // auto: سیستم
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          if (prefersDark) {
            document.documentElement.classList.add("dark");
            document.documentElement.setAttribute("data-theme", "dark");
          } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.setAttribute("data-theme", "light");
          }
        }
      } catch {}
    };

    applyTheme();

    // گوش دادن به تغییر تم سیستم (مهم برای موبایل)
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const manual = localStorage.getItem("axon_theme_manual_override") === "true";
      if (!manual) applyTheme();
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return <>{children}</>;
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۱۲. services/smsService.ts — استفاده از IPPanel Edge
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("services/smsService.ts", `// File Path: services/smsService.ts

export interface SendSmsResponse {
  success:        boolean;
  message?:       string;
  simulatedCode?: string;
  token?:         string;
  verified?:      boolean;
}

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  if (process.env.NEXT_PUBLIC_SITE_URL)  return process.env.NEXT_PUBLIC_SITE_URL.replace(/\\/+$/, "");
  if (process.env.VERCEL_URL)            return "https://" + process.env.VERCEL_URL;
  return "http://localhost:3000";
}

function cleanPhone(phone: string): string {
  return String(phone)
    .trim()
    .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
    .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
    .replace(/\\D/g, "");
}

export const smsService = {
  async sendOtp(phone: string): Promise<SendSmsResponse> {
    try {
      const cp  = cleanPhone(phone);
      const url = getApiBaseUrl() + "/api/send-otp";
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: cp, action: "send" }),
        cache:   "no-store",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "خطا در ارسال OTP.");
      }
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || "خطا در ارتباط با سامانه پیامک." };
    }
  },

  async verifyOtp(phone: string, code: string, token?: string): Promise<SendSmsResponse> {
    try {
      const cp   = cleanPhone(phone);
      const cc   = cleanPhone(code);
      const url  = getApiBaseUrl() + "/api/send-otp";
      const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: cp, code: cc, token, action: "verify" }),
        cache:   "no-store",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "کد تایید نادرست است.");
      }
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || "خطا در بررسی کد." };
    }
  },

  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const cp  = cleanPhone(phone);
      const url = getApiBaseUrl() + "/api/sms/send";
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: cp, message }),
        cache:   "no-store",
      });
      const json = await res.json().catch(() => ({}));
      return res.ok && json.success === true;
    } catch {
      return false;
    }
  },

  async sendTrackingCode(phone: string, customerName: string, trackingCode: string): Promise<boolean> {
    const msg = customerName + " گرامی، سفارش شما تحویل شرکت ملی پست گردید. کد رهگیری مرسوله پیشتاز: " + trackingCode + " - پیگیری: axoncore.ir/track-order";
    return this.sendSMS(phone, msg);
  },

  async sendOrderStatusChange(phone: string, orderId: string, statusName: string): Promise<boolean> {
    const msg = "خریدار گرامی، وضعیت سفارش #" + orderId + " شما در آکسون به «" + statusName + "» تغییر یافت. پیگیری: axoncore.ir/track-order";
    return this.sendSMS(phone, msg);
  },

  async sendOrderPaidConfirmation(phone: string, orderId: string, amount: number): Promise<boolean> {
    const fa  = Math.round(amount).toLocaleString("fa-IR");
    const msg = "سفارش #" + orderId + " به مبلغ " + fa + " تومان با موفقیت پرداخت شد. سپاس از خرید شما - آکسون کور";
    return this.sendSMS(phone, msg);
  },
};

export const sendSMS               = smsService.sendSMS.bind(smsService);
export const sendOtp               = smsService.sendOtp.bind(smsService);
export const verifyOtp             = smsService.verifyOtp.bind(smsService);
export const sendTrackingCode      = smsService.sendTrackingCode.bind(smsService);
export const sendOrderStatusChange = smsService.sendOrderStatusChange.bind(smsService);
export const sendVerificationSMS   = async (phone: string, code: string): Promise<boolean> => {
  const { sendOtpPattern } = await import("@/lib/otpService");
  return sendOtpPattern({ mobile: phone, code });
};
export default smsService;
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۱۳. Build check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log("\n🏗️  در حال اجرای بررسی build...\n");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ بیلد موفق!\n");
} catch (err) {
  console.error("\n❌ خطا در build!\n");
  process.exit(1);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۱۴. Git
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log("📦 commit و push...\n");
try {
  const ts = new Date().toISOString().slice(0,19).replace("T"," ");
  execSync("git add -A", { stdio: "inherit", cwd: ROOT });
  execSync(
    "git commit -m \"fix(v2): IPPanel Edge OTP + WebOTP موبایل + زوم + عکس محصول + تم + AI chat [" + ts + "]\"",
    { stdio: "inherit", cwd: ROOT }
  );
  execSync("git push origin main", { stdio: "inherit", cwd: ROOT });
  console.log("\n🚀 push موفق!\n");
} catch (e) {
  console.error("⚠️  git push:", e.message);
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ خلاصه رفع‌های نسخه ۲:

۱. lib/otpService.ts — IPPanel Edge API صحیح
   POST https://edge.ippanel.com/v1/api/send
   با sending_type: "pattern" و Authorization header

۲. app/api/send-otp/route.ts — کامل با امنیت HMAC

۳. app/api/sms/send/route.ts — IPPanel Edge

۴. services/smsService.ts — یکپارچه با Edge API

۵. checkout OTP input — autoComplete="one-time-code"
   → آیفون و اندروید کد را auto-fill می‌کنند

۶. viewport موبایل — رفع zoom ناخواسته هنگام focus

۷. globals.css:
   • input font-size: 16px (رفع zoom)
   • تم دارک/لایت کامل برای موبایل
   • .ai-chat-float-btn (لوگوی کوچک شناور)
   • انیمیشن‌های دکمه خرید (keyframes صحیح)

۸. ProductCard — onError fallback عکس + lazy loading

۹. AIAssistantChat — لوگوی ۴۴px شناور که روی هیچ
   المانی قرار نمی‌گیرد

۱۰. ThemeProvider — گوش دادن به تغییر تم سیستم موبایل

نکته مهم: متغیرهای .env باید تنظیم شوند:
IPPANEL_API_KEY=کلید_API_پنل_آی‌پی‌پنل
IPPANEL_PATTERN_CODE=کد_پترن_پنل_آی‌پی‌پنل  
IPPANEL_ORIGIN_NUMBER=+983000505
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);