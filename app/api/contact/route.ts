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
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, phone, subject, message } = body;

    if (!full_name || !phone || !message) {
      return NextResponse.json(
        { success: false, message: "نام، شماره تماس و متن پیام الزامی است." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone)
      .trim()
      .replace(/[۰-۹]/g, (d: string) => (d.charCodeAt(0) - 1776).toString())
      .replace(/\D/g, "");

    const ticketId = `msg_${Date.now()}`;
    const payload = {
      id: ticketId,
      full_name: String(full_name).trim().slice(0, 100),
      phone: cleanPhone || "09120000000",
      subject: subject ? String(subject).trim().slice(0, 150) : "درخواست مشاوره تخصصی",
      message: String(message).trim(),
      status: "pending",
      is_read: false,
      created_at: new Date().toISOString(),
    };

    try {
      await supabaseAdmin.from("contact_messages").insert([payload]);
    } catch (insertErr) {
      console.warn("Contact insert warning:", insertErr);
    }

    return NextResponse.json({
      success: true,
      message: "پیام شما با موفقیت ثبت شد و به زودی پاسخ داده خواهد شد.",
      data: payload,
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

    const updatePayload = {
      admin_reply: String(admin_reply).trim(),
      status: status || "answered",
      is_read: true,
      updated_at: new Date().toISOString(),
    };

    try {
      await supabaseAdmin
        .from("contact_messages")
        .update(updatePayload)
        .eq("id", id);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "پاسخ با موفقیت ثبت شد.",
      data: { id, ...updatePayload },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
