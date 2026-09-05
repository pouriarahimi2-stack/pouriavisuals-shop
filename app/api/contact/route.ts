import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { smsService } from "@/services/smsService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { full_name, phone, subject, message } = await req.json();

    if (!full_name || !phone || !message) {
      return NextResponse.json({ success: false, message: "فیلدهای نام، شماره تماس و متن پیام الزامی است." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[۰-۹]/g, (d: string) => (d.charCodeAt(0) - 1776).toString()).replace(/\D/g, "");

    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        full_name: full_name.trim(),
        name: full_name.trim(),
        phone: cleanPhone,
        subject: (subject || "درخواست مشاوره تخصصی").trim(),
        message: message.trim(),
        status: "pending",
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "پیام و درخواست مشاوره شما با موفقیت ثبت شد و به زودی پیامک پاسخ ارسال می‌گردد.",
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در ثبت پیام." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز. احراز هویت ادمین الزامی است." }, { status: 401 });
    }

    const { id, admin_reply, status = "answered" } = await req.json();

    if (!id || !admin_reply) {
      return NextResponse.json({ success: false, message: "شناسه پیام و متن پاسخ الزامی است." }, { status: 400 });
    }

    const { data: existingMsg, error: fetchErr } = await supabaseAdmin
      .from("contact_messages")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !existingMsg) {
      return NextResponse.json({ success: false, message: "پیام یافت نشد." }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .update({
        admin_reply: admin_reply.trim(),
        status,
        is_read: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (existingMsg.phone) {
      try {
        await smsService.sendTrackingCode(
          existingMsg.phone,
          existingMsg.full_name || "مشتری گرامی",
          `پاسخ کارشناسان آکسون: ${admin_reply.slice(0, 100)}`
        );
      } catch (smsErr) {
        console.warn("Contact reply SMS error:", smsErr);
      }
    }

    return NextResponse.json({ success: true, message: "پاسخ با موفقیت ذخیره و پیامک ارسال شد.", data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
