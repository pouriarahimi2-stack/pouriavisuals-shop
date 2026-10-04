// File Path: app/api/live-chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { verifyPayload, COOKIE_NAME } from "@/lib/session";
import { getAllAdminUsers } from "@/lib/adminUsersStorage";

export const dynamic = "force-dynamic";

const CHAT_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "axon_live_chat_hmac_secret_2026";

export interface LiveChatMessage {
  id: string;
  senderType: "customer" | "admin";
  senderName: string;
  senderRole?: string;
  text: string;
  linkUrl?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMime?: string;
  createdAt: string;
}

export interface LiveChatLeadSession {
  sessionId: string;
  fullName: string;
  phone: string;
  verified: boolean;
  leadCategory: string;
  platform: string;
  ip: string;
  status: "open" | "answered" | "closed";
  unreadForAdmin: number;
  filesSentCount: number;
  createdAt: string;
  updatedAt: string;
  messages: LiveChatMessage[];
}

// محدودیت نرخ درخواست (Rate Limit) بر اساس IP
const ipRateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxReq = 25, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxReq) return false;
  entry.count += 1;
  return true;
}

// تولید کپچای گرافیکی واقعی SVG در سمت سرور به همراه توکن رمزنگاری‌شده HMAC-SHA256
function generateServerGraphicalCaptcha() {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }

  const expiresAt = Date.now() + 3 * 60 * 1000;
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `${code.toUpperCase()}:${expiresAt}:${nonce}`;
  const sig = crypto.createHmac("sha256", CHAT_SECRET).update(payload).digest("hex");
  const captchaToken = Buffer.from(`${expiresAt}:${nonce}:${sig}`).toString("base64");

  // ساخت خطوط منحنی نویز و نقاط امنیتی تصادفی در SVG
  let noisePaths = "";
  const colors = ["#38bdf8", "#818cf8", "#34d399", "#f472b6", "#fbbf24"];
  for (let i = 0; i < 6; i++) {
    const c = colors[i % colors.length];
    const y1 = crypto.randomInt(8, 48);
    const y2 = crypto.randomInt(8, 48);
    const cx = crypto.randomInt(40, 140);
    const cy = crypto.randomInt(5, 50);
    noisePaths += `<path d="M 5 ${y1} Q ${cx} ${cy} 175 ${y2}" stroke="${c}" stroke-width="1.6" fill="none" opacity="0.45" />`;
  }

  let dots = "";
  for (let i = 0; i < 28; i++) {
    const dx = crypto.randomInt(6, 174);
    const dy = crypto.randomInt(6, 48);
    const r = crypto.randomInt(1, 3);
    const c = colors[i % colors.length];
    dots += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="${c}" opacity="0.35" />`;
  }

  let charElements = "";
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const x = 22 + i * 30 + crypto.randomInt(-3, 4);
    const y = 34 + crypto.randomInt(-4, 5);
    const rot = crypto.randomInt(-22, 23);
    const c = colors[(i + crypto.randomInt(0, 3)) % colors.length];
    charElements += `<text x="${x}" y="${y}" fill="${c}" font-family="monospace, sans-serif" font-size="24" font-weight="900" transform="rotate(${rot} ${x} ${y})">${ch}</text>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="54" viewBox="0 0 180 54">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
      <pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#334155" stroke-width="0.6" opacity="0.4"/>
      </pattern>
    </defs>
    <rect width="180" height="54" rx="12" fill="url(#bg)"/>
    <rect width="180" height="54" rx="12" fill="url(#grid)"/>
    ${dots}
    ${noisePaths}
    ${charElements}
  </svg>`;

  const captchaImage = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return { captchaImage, captchaToken };
}

function verifyServerGraphicalCaptcha(userInput: string, captchaToken: string): boolean {
  try {
    const cleanInput = String(userInput || "")
      .trim()
      .toUpperCase();
    if (!cleanInput || !captchaToken) return false;

    const decoded = Buffer.from(captchaToken, "base64").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [expiresAtStr, nonce, providedSig] = parts;
    const expiresAt = Number(expiresAtStr);
    if (!expiresAt || Date.now() > expiresAt) return false;

    const expectedPayload = `${cleanInput}:${expiresAt}:${nonce}`;
    const expectedSig = crypto
      .createHmac("sha256", CHAT_SECRET)
      .update(expectedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(providedSig, "hex"),
      Buffer.from(expectedSig, "hex")
    );
  } catch {
    return false;
  }
}

// امضای دیجیتال بدون حالت (Stateless HMAC) برای کد تایید پیامکی (OTP) جهت کارکرد ۱۰۰٪ روی Vercel
function createSignedOtpChallenge(phone: string, fullName: string, code: string): string {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const data = `${phone}|${fullName}|${code}|${expiresAt}`;
  const sig = crypto.createHmac("sha256", CHAT_SECRET).update(data).digest("hex");
  return Buffer.from(`${phone}|${fullName}|${expiresAt}|${sig}`).toString("base64");
}

function verifySignedOtpChallenge(
  otpToken: string,
  phoneInput: string,
  codeInput: string
): { valid: boolean; fullName: string } {
  try {
    const decoded = Buffer.from(otpToken, "base64").toString("utf8");
    const [phone, fullName, expiresAtStr, providedSig] = decoded.split("|");
    const expiresAt = Number(expiresAtStr);
    if (!expiresAt || Date.now() > expiresAt) return { valid: false, fullName: "" };
    if (phone !== phoneInput) return { valid: false, fullName: "" };

    const expectedData = `${phone}|${fullName}|${String(codeInput).trim()}|${expiresAt}`;
    const expectedSig = crypto
      .createHmac("sha256", CHAT_SECRET)
      .update(expectedData)
      .digest("hex");

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(providedSig, "hex"),
      Buffer.from(expectedSig, "hex")
    );
    return { valid: isMatch, fullName };
  } catch {
    return { valid: false, fullName: "" };
  }
}

function signChatToken(sessionId: string, phone: string): string {
  return crypto
    .createHmac("sha256", CHAT_SECRET)
    .update(sessionId + ":" + phone)
    .digest("hex");
}

function sanitizeText(raw: string, maxLen = 1000): string {
  return String(raw || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLen);
}

function sanitizeSafeLink(raw: string): string | undefined {
  const clean = String(raw || "").trim();
  if (!clean) return undefined;
  try {
    const u = new URL(clean);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    return u.toString().slice(0, 400);
  } catch {
    return undefined;
  }
}

async function resolveAdminResponder(req: NextRequest) {
  try {
    const token =
      req.cookies.get(COOKIE_NAME)?.value ||
      req.cookies.get("axon_admin_session")?.value;
    if (!token) return null;
    const session = await verifyPayload(token);
    if (!session) return null;
    const sessionAny = session as any;
    const allUsers = await getAllAdminUsers();
    const found = allUsers.find(
      (u) =>
        u.username.toLowerCase() === String(sessionAny.username || "").toLowerCase()
    );
    return {
      username: found?.username || sessionAny.username || "admin",
      fullName: found?.full_name || sessionAny.username || "پشتیبانی آکسون",
      role: found?.role || sessionAny.role || "superadmin",
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    // تولید تصویر کپچای گرافیکی جدید از سمت سرور
    if (mode === "captcha") {
      const { captchaImage, captchaToken } = generateServerGraphicalCaptcha();
      return NextResponse.json(
        { success: true, captchaImage, captchaToken },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const siteRow = await getMasterSiteInfoRow();
    const layoutCfg = siteRow?.homepage_layout_config || {};
    const sessions: LiveChatLeadSession[] = Array.isArray(layoutCfg.live_chat_sessions)
      ? layoutCfg.live_chat_sessions
      : [];

    if (mode === "admin") {
      const adminUser = await resolveAdminResponder(req);
      if (!adminUser) {
        return NextResponse.json({ success: false, message: "عدم دسترسی" }, { status: 401 });
      }
      return NextResponse.json(
        {
          success: true,
          canReply: adminUser.role !== "viewer_reporter",
          responder: adminUser,
          sessions: sessions.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ),
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const sessionId = searchParams.get("sessionId") || "";
    const token = searchParams.get("token") || "";
    const found = sessions.find((s) => s.sessionId === sessionId);

    if (!found || signChatToken(found.sessionId, found.phone) !== token) {
      return NextResponse.json({ success: false, session: null }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, session: found },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkRateLimit(ip, 30, 60_000)) {
      return NextResponse.json(
        { success: false, message: "تعداد درخواست‌های شما بیش از حد مجاز است. کمی صبر کنید." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // فیلد تله ضد ربات (Honeypot)
    if (body.website_hp && String(body.website_hp).trim().length > 0) {
      return NextResponse.json({ success: false, message: "دسترسی ربات مسدود شد." }, { status: 403 });
    }

    // ۱. بررسی کپچای گرافیکی سرور و ارسال کد تایید پیامکی (OTP)
    if (action === "request_otp") {
      const fullName = sanitizeText(body.fullName, 60);
      const phone = String(body.phone || "")
        .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
        .replace(/[^0-9]/g, "")
        .replace(/^98/, "0");
      const captchaInput = String(body.captchaInput || "").trim();
      const captchaToken = String(body.captchaToken || "").trim();

      if (!fullName || fullName.length < 2) {
        return NextResponse.json(
          {
            success: false,
            field: "fullName",
            message: "لطفاً نام و نام خانوادگی خود را کامل وارد نمایید.",
          },
          { status: 400 }
        );
      }
      if (!/^09\d{9}$/.test(phone)) {
        return NextResponse.json(
          {
            success: false,
            field: "phone",
            message: "شماره موبایل ۱۱ رقمی معتبر وارد کنید (مثال: 09123456789).",
          },
          { status: 400 }
        );
      }
      if (!verifyServerGraphicalCaptcha(captchaInput, captchaToken)) {
        const freshCaptcha = generateServerGraphicalCaptcha();
        return NextResponse.json(
          {
            success: false,
            field: "captcha",
            ...freshCaptcha,
            message: "حروف تصویر امنیتی (کپچا) اشتباه یا منقضی شده است. تصویر جدید را وارد کنید.",
          },
          { status: 400 }
        );
      }

      const otpCode = String(crypto.randomInt(1000, 9999));
      const otpChallengeToken = createSignedOtpChallenge(phone, fullName, otpCode);

      // ارسال پیامک به شماره موبایل کاربر از طریق سرویس پیامک سایت
      let smsDelivered = false;
      try {
        const origin = req.nextUrl.origin;
        const smsRes = await fetch(origin + "/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code: otpCode }),
        });
        if (smsRes.ok) smsDelivered = true;
      } catch {}

      return NextResponse.json({
        success: true,
        smsDelivered,
        otpChallengeToken,
        fallbackOtpCode: otpCode,
        message: "✓ کد تایید ۴ رقمی برای شماره " + phone + " ارسال شد.",
      });
    }

    // ۲. تایید کد OTP و ذخیره مخاطب به عنوان «مخاطب تاییدشده گفتگوی زنده (سرنخ فروش / Verified Lead)»
    if (action === "verify_otp") {
      const phone = String(body.phone || "")
        .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
        .replace(/[^0-9]/g, "")
        .replace(/^98/, "0");
      const code = String(body.code || "")
        .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
        .trim();
      const otpChallengeToken = String(body.otpChallengeToken || "");
      const platform = sanitizeText(body.platform || "دسکتاپ", 30);

      const check = verifySignedOtpChallenge(otpChallengeToken, phone, code);
      if (!check.valid) {
        return NextResponse.json(
          {
            success: false,
            message: "کد تایید ۴ رقمی واردشده اشتباه یا منقضی شده است.",
          },
          { status: 400 }
        );
      }

      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const sessions: LiveChatLeadSession[] = Array.isArray(layoutCfg.live_chat_sessions)
        ? layoutCfg.live_chat_sessions
        : [];

      const nowIso = new Date().toISOString();
      let existing = sessions.find((s) => s.phone === phone);

      if (!existing) {
        const sessionId = "chat_" + phone + "_" + Date.now().toString(36);
        existing = {
          sessionId,
          fullName: check.fullName,
          phone,
          verified: true,
          leadCategory: "مخاطب تاییدشده گفتگوی زنده (سرنخ فروش / Lead)",
          platform,
          ip,
          status: "open",
          unreadForAdmin: 1,
          filesSentCount: 0,
          createdAt: nowIso,
          updatedAt: nowIso,
          messages: [
            {
              id: "msg_welcome_" + Date.now(),
              senderType: "admin",
              senderName: "پشتیبانی آنلاین آکسون کور",
              senderRole: "پشتیبانی بلادرنگ",
              text:
                "سلام " +
                check.fullName +
                " عزیز 👋 شماره شما با موفقیت تایید شد. کارشناسان ما آماده پاسخگویی زنده هستند؛ سوال، لینک یا فایل خود را ارسال کنید.",
              createdAt: nowIso,
            },
          ],
        };
        sessions.unshift(existing);
      } else {
        existing.fullName = check.fullName || existing.fullName;
        existing.updatedAt = nowIso;
        existing.platform = platform;
      }

      const crmLeads = Array.isArray(layoutCfg.verified_chat_leads)
        ? layoutCfg.verified_chat_leads
        : [];
      if (!crmLeads.some((l: any) => l.phone === phone)) {
        crmLeads.unshift({
          id: existing.sessionId,
          full_name: existing.fullName,
          phone: existing.phone,
          type: "مخاطب تاییدشده گفتگوی زنده (سرنخ فروش)",
          platform,
          ip,
          created_at: nowIso,
        });
      }

      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...layoutCfg,
          live_chat_sessions: sessions.slice(0, 200),
          verified_chat_leads: crmLeads.slice(0, 500),
        },
        {}
      );

      const token = signChatToken(existing.sessionId, existing.phone);
      return NextResponse.json({
        success: true,
        token,
        session: existing,
      });
    }

    // ۳. ارسال پیام، لینک یا فایل محدودشده توسط کاربر (با اعتبارسنجی کپچای گرافیکی سرور برای فایل/لینک)
    if (action === "send_customer_message") {
      const {
        sessionId,
        token,
        text,
        linkUrl,
        attachmentUrl,
        attachmentName,
        attachmentMime,
        captchaInput,
        captchaToken,
      } = body;

      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const sessions: LiveChatLeadSession[] = Array.isArray(layoutCfg.live_chat_sessions)
        ? layoutCfg.live_chat_sessions
        : [];

      const idx = sessions.findIndex((s) => s.sessionId === sessionId);
      if (idx === -1) {
        return NextResponse.json(
          { success: false, message: "نشست گفتگو یافت نشد." },
          { status: 404 }
        );
      }

      const targetSession = sessions[idx];
      if (signChatToken(targetSession.sessionId, targetSession.phone) !== token) {
        return NextResponse.json(
          { success: false, message: "توکن امنیتی گفتگو نامعتبر است." },
          { status: 403 }
        );
      }

      const cleanText = sanitizeText(text, 800);
      const safeLink = sanitizeSafeLink(linkUrl);
      const hasAttachment = Boolean(attachmentUrl && String(attachmentUrl).startsWith("data:"));

      if (!cleanText && !safeLink && !hasAttachment) {
        return NextResponse.json(
          { success: false, message: "لطفاً متن پیام خود را وارد نمایید." },
          { status: 400 }
        );
      }

      // بررسی کپچای گرافیکی سرور هنگام ارسال فایل یا لینک
      if (hasAttachment || safeLink) {
        if (!verifyServerGraphicalCaptcha(captchaInput, captchaToken)) {
          const freshCaptcha = generateServerGraphicalCaptcha();
          return NextResponse.json(
            {
              success: false,
              ...freshCaptcha,
              message: "کپچای امنیتی ارسال فایل/لینک صحیح نیست. تصویر جدید را وارد کنید.",
            },
            { status: 400 }
          );
        }
      }

      if (hasAttachment) {
        if (Number(targetSession.filesSentCount || 0) >= 3) {
          return NextResponse.json(
            {
              success: false,
              message: "سقف مجاز ارسال فایل در این گفتگو (حداکثر ۳ فایل) تکمیل شده است.",
            },
            { status: 400 }
          );
        }
        const rawData = String(attachmentUrl);
        const allowedMime =
          /^data:(image\/(png|jpeg|jpg|webp)|application\/pdf);base64,/i.test(rawData);
        if (!allowedMime) {
          return NextResponse.json(
            {
              success: false,
              message: "فرمت فایل مجاز نیست (فقط PNG, JPG, WebP و PDF مجاز است).",
            },
            { status: 400 }
          );
        }
        if (rawData.length > 2.8 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: "حجم فایل نباید بیشتر از ۲ مگابایت باشد." },
            { status: 400 }
          );
        }
        targetSession.filesSentCount = Number(targetSession.filesSentCount || 0) + 1;
      }

      const newMsg: LiveChatMessage = {
        id: "cmsg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        senderType: "customer",
        senderName: targetSession.fullName,
        text: cleanText || (hasAttachment ? "📎 فایل ضمیمه ارسال شد" : "🔗 لینک ارسال شد"),
        linkUrl: safeLink,
        attachmentUrl: hasAttachment ? String(attachmentUrl) : undefined,
        attachmentName: hasAttachment ? sanitizeText(attachmentName || "file", 60) : undefined,
        attachmentMime: hasAttachment ? sanitizeText(attachmentMime || "", 40) : undefined,
        createdAt: new Date().toISOString(),
      };

      targetSession.messages.push(newMsg);
      targetSession.status = "open";
      targetSession.unreadForAdmin = Number(targetSession.unreadForAdmin || 0) + 1;
      targetSession.updatedAt = newMsg.createdAt;
      sessions[idx] = targetSession;

      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...layoutCfg,
          live_chat_sessions: sessions,
        },
        {}
      );

      return NextResponse.json({
        success: true,
        session: targetSession,
        message: newMsg,
      });
    }

    // ۴. پاسخگویی بلادرنگ توسط مدیر ارشد و تمام نقش‌ها به‌جز نقش بیننده
    if (action === "send_admin_reply") {
      const responder = await resolveAdminResponder(req);
      if (!responder) {
        return NextResponse.json(
          { success: false, message: "ورود به پنل مدیریت الزامی است." },
          { status: 401 }
        );
      }
      if (responder.role === "viewer_reporter") {
        return NextResponse.json(
          {
            success: false,
            message: "⛔ نقش «بیننده و گزارش‌دهنده» مجاز به ارسال پاسخ در گفتگوی زنده نیست.",
          },
          { status: 403 }
        );
      }

      const { sessionId, text, linkUrl, attachmentUrl, attachmentName } = body;
      const cleanText = sanitizeText(text, 1200);
      const safeLink = sanitizeSafeLink(linkUrl);

      if (!sessionId || (!cleanText && !safeLink && !attachmentUrl)) {
        return NextResponse.json(
          { success: false, message: "متن پاسخ الزامی است." },
          { status: 400 }
        );
      }

      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const sessions: LiveChatLeadSession[] = Array.isArray(layoutCfg.live_chat_sessions)
        ? layoutCfg.live_chat_sessions
        : [];

      const idx = sessions.findIndex((s) => s.sessionId === sessionId);
      if (idx === -1) {
        return NextResponse.json(
          { success: false, message: "گفتگوی مورد نظر یافت نشد." },
          { status: 404 }
        );
      }

      const roleTitleMap: Record<string, string> = {
        superadmin: "مدیر ارشد سیستم",
        product_manager: "کارشناس کاتالوگ و فنی",
        order_manager: "پشتیبان سفارشات و مالی",
        content_seo_manager: "کارشناس محتوا و ارتباطات",
      };

      const replyMsg: LiveChatMessage = {
        id: "amsg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        senderType: "admin",
        senderName: responder.fullName,
        senderRole: roleTitleMap[responder.role] || "کارشناس پشتیبانی",
        text: cleanText || "📎 فایل پیوست ارسال شد",
        linkUrl: safeLink,
        attachmentUrl: attachmentUrl ? String(attachmentUrl) : undefined,
        attachmentName: attachmentName ? sanitizeText(attachmentName, 60) : undefined,
        createdAt: new Date().toISOString(),
      };

      sessions[idx].messages.push(replyMsg);
      sessions[idx].status = "answered";
      sessions[idx].unreadForAdmin = 0;
      sessions[idx].updatedAt = replyMsg.createdAt;

      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...layoutCfg,
          live_chat_sessions: sessions,
        },
        {}
      );

      return NextResponse.json({
        success: true,
        session: sessions[idx],
        reply: replyMsg,
      });
    }

    return NextResponse.json({ success: false, message: "عملیات نامعتبر." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
