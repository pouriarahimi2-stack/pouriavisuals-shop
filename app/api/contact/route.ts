// File Path: app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { smsService } from "@/services/smsService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { full_name, phone, subject, message } = await req.json();

    if (!full_name || !phone || !message) {
      return NextResponse.json(
        { success: false, message: "تکمیل نام، شماره موبایل و متن پیام الزامی است." },
        { status: 400 }
      );
    }

    const cleanPhone = phone
      .trim()
      .replace(/[۰-۹]/g, (d: string) => (d.charCodeAt(0) - 1776).toString())
      .replace(/\D/g, "");

    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل وارد شده باید ۱۱ رقمی و با ۰۹ شروع شود." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        full_name: full_name.trim(),
        phone: cleanPhone,
        subject: subject ? subject.trim() : "درخواست مشاوره تخصصی",
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
      message: "پیام شما با موفقیت ثبت شد و به زودی توسط کارشناسان بررسی و پاسخ داده خواهد شد.",
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, admin_reply, status } = await req.json();

    if (!id || !admin_reply) {
      return NextResponse.json(
        { success: false, message: "شناسه پیام و متن پاسخ مدیریت الزامی است." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .update({
        admin_reply: admin_reply.trim(),
        status: status || "answered",
        is_read: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) throw error;

    if (data.phone) {
      const smsText = `کاربر گرامی ${data.full_name}، به پیام شما با موضوع «${data.subject || "مشاوره"}» پاسخ داده شد:\n${admin_reply.substring(0, 120)}\nفروشگاه آکسون`;
      smsService.sendSMS(data.phone, smsText).catch(() => {});
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}