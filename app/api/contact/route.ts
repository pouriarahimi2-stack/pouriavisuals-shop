import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { validatePhoneNumber, sanitizeInput, createApiError, createApiSuccess } from "@/lib/validationGuard";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fullName = sanitizeInput(body?.full_name || body?.fullName);
    const phone = String(body?.phone || "").trim();
    const subject = sanitizeInput(body?.subject || "مشاوره تخصصی");
    const message = sanitizeInput(body?.message);

    if (!fullName || fullName.length < 2) {
      return createApiError("نام و نام خانوادگی نامعتبر است.", 400);
    }

    if (!validatePhoneNumber(phone)) {
      return createApiError("شماره موبایل وارد شده باید ۱۱ رقمی و با ۰۹ شروع شود.", 400);
    }

    if (!message || message.length < 5) {
      return createApiError("متن پیام یا شرح نیاز باید حداقل ۵ کاراکتر باشد.", 400);
    }

    const { error } = await supabaseAdmin.from("contact_messages").insert([
      {
        full_name: fullName,
        phone: phone.replace(/\D/g, ""),
        subject,
        message,
        status: "unread",
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      throw error;
    }

    return createApiSuccess(null, "پیام شما با موفقیت ثبت شد و به زودی توسط کارشناسان بررسی خواهد شد.");
  } catch (err: any) {
    console.error("Contact API Error:", err);
    return createApiError("خطای داخلی سرور در ثبت پیام.", 500);
  }
}
