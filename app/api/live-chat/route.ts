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

const pendingOtps = new Map<
  string,
  { code: string; fullName: string; expiresAt: number; attempts: number }
>();

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
    const body = await req.json();
    const { action } = body;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // ۱. درخواست کد تایید (OTP) برای شروع گفتگوی زنده همراه با بررسی کپچا
    if (action === "request_otp") {
      const fullName = sanitizeText(body.fullName, 60);
      const phone = String(body.phone || "")
        .replace(/[^0-9]/g, "")
        .replace(/^98/, "0");
      const captchaInput = String(body.captchaInput || "").trim();
      const captchaExpected = String(body.captchaExpected || "").trim();

      if (!fullName || fullName.length < 2) {
        return NextResponse.json(
          { success: false, message: "لطفاً نام و نام خانوادگی خود را وارد نمایید." },
          { status: 400 }
        );
      }
      if (!/^09\d{9}$/.test(phone)) {
        return NextResponse.json(
          { success: false, message: "شماره موبایل معتبر نیست (مثال: 09123456789)." },
          { status: 400 }
        );
      }
      if (!captchaInput || captchaInput !== captchaExpected) {
        return NextResponse.json(
          { success: false, message: "کد امنیتی (کپچا) به درستی وارد نشده است." },
          { status: 400 }
        );
      }

      const otpCode = String(Math.floor(1000 + Math.random() * 9000));
      pendingOtps.set(phone, {
        code: otpCode,
        fullName,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      });

      // تلاش برای ارسال پیامک واقعی از طریق درگاه پیامک سایت
      let smsSent = false;
      try {
        const origin = req.nextUrl.origin;
        const smsRes = await fetch(origin + "/api/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, purpose: "live_chat" }),
        });
        if (smsRes.ok) smsSent = true;
      } catch {}

      return NextResponse.json({
        success: true,
        smsSent,
        verificationHint: otpCode,
        message: "✓ کد تایید ۴ رقمی برای شماره " + phone + " صادر شد.",
      });
    }

    // ۲. تایید شماره موبایل و ثبت کاربر به عنوان «مخاطب تاییدشده گفتگوی زنده (سرنخ فروش / Verified Lead)»
    if (action === "verify_otp") {
      const phone = String(body.phone || "")
        .replace(/[^0-9]/g, "")
        .replace(/^98/, "0");
      const code = String(body.code || "").trim();
      const platform = sanitizeText(body.platform || "دسکتاپ", 30);
      const pending = pendingOtps.get(phone);

      if (!pending || Date.now() > pending.expiresAt) {
        return NextResponse.json(
          { success: false, message: "کد تایید منقضی شده است. مجدداً درخواست دهید." },
          { status: 400 }
        );
      }
      if (pending.code !== code) {
        pending.attempts += 1;
        return NextResponse.json(
          { success: false, message: "کد تایید واردشده صحیح نیست." },
          { status: 400 }
        );
      }

      pendingOtps.delete(phone);

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
          fullName: pending.fullName,
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
              senderRole: "سیستم هوشمند پشتیبانی",
              text:
                "سلام " +
                pending.fullName +
                " عزیز 👋 شماره شما تایید شد. کارشناسان ما آنلاین هستند؛ سوال، لینک یا تصویر مورد نظر خود را بفرستید.",
              createdAt: nowIso,
            },
          ],
        };
        sessions.unshift(existing);
      } else {
        existing.fullName = pending.fullName || existing.fullName;
        existing.updatedAt = nowIso;
        existing.platform = platform;
      }

      // ذخیره هم‌زمان در لیست سرنخ‌های مشتریان (CRM Leads)
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

    // ۳. ارسال پیام، لینک یا فایل محدودشده توسط مخاطب تاییدشده
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
        captchaExpected,
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
          { success: false, message: "متن پیام نمی‌تواند خالی باشد." },
          { status: 400 }
        );
      }

      // در صورت ارسال فایل یا لینک توسط کاربر، بررسی کپچای امنیتی و سقف مجاز (حداکثر ۳ فایل و ۲ مگابایت)
      if (hasAttachment || safeLink) {
        if (!captchaInput || String(captchaInput).trim() !== String(captchaExpected).trim()) {
          return NextResponse.json(
            {
              success: false,
              message: "برای ارسال فایل یا لینک، وارد کردن کد کپچای امنیتی الزامی است.",
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
              message: "سقف ارسال فایل در این گفتگو (حداکثر ۳ فایل) تکمیل شده است.",
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
              message: "فرمت فایل مجاز نیست (فقط تصاویر PNG, JPG, WebP و سند PDF مجاز است).",
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

    // ۴. پاسخگویی بلادرنگ توسط مدیر ارشد و تمام زیرمجموعه‌ها (به‌جز نقش بیننده viewer_reporter)
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
        text: cleanText || "📎 پاسخ پیوست شد",
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
