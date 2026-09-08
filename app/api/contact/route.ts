import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { sendSMS } from "@/services/smsService";

export const dynamic = "force-dynamic";

// دریافت پیام‌ها (ویژه ادمین)
export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

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

// ثبت تیکت جدید توسط کاربر از سایت
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, phone, email, subject, message } = body;

    const cleanPhone = String(phone || "").trim().replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString()).replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 11) {
      return NextResponse.json({ success: false, message: "شماره موبایل ۱۱ رقمی الزامی است." }, { status: 400 });
    }

    const ticketId = "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    const payload: Record<string, any> = {
      id: ticketId,
      full_name: String(full_name || "کاربر سایت").trim(),
      phone: cleanPhone,
      email: email ? String(email).trim() : null,
      subject: String(subject || "درخواست مشاوره تخصصی").trim(),
      message: String(message || "").trim(),
      status: "pending",
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("contact_messages").insert([payload]).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, message: "تیکت شما با موفقیت ثبت شد و پاسخ به زودی پیامک خواهد شد.", data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// پاسخگویی ادمین به تیکت + ارسال پیامک SMS
export async function PATCH(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, admin_reply, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه تیکت الزامی است." }, { status: 400 });
    }

    // واکشی پیام جهت دریافت شماره کاربر
    const { data: ticket } = await supabaseAdmin.from("contact_messages").select("*").eq("id", id).single();
    if (!ticket) {
      return NextResponse.json({ success: false, message: "تیکت یافت نشد." }, { status: 404 });
    }

    const replyClean = String(admin_reply || "").trim();
    const updatePayload: Record<string, any> = {
      admin_reply: replyClean,
      status: status || "answered",
      is_read: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("contact_messages").update(updatePayload).eq("id", id).select().single();
    if (error) throw error;

    // ارسال خودکار پیامک حاوی پاسخ به شماره همراه خریدار
    if (ticket.phone && replyClean) {
      try {
        const smsMsg = `سلام ${ticket.full_name} عزیز، پاسخ تیکت شما در آکسون ثبت شد:\n${replyClean}\naxoncore.ir`;
        await sendSMS(ticket.phone, smsMsg);
      } catch (smsErr) {
        console.warn("SMS sending error:", smsErr);
      }
    }

    return NextResponse.json({ success: true, message: "پاسخ با موفقیت در دیتابیس ثبت و پیامک برای کاربر ارسال شد.", data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ویرایش متن پیام کاربر یا متن پاسخ مدیر (Edit functionality)
export async function PUT(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, message, admin_reply, subject } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه تیکت الزامی است." }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (message !== undefined) updates.message = String(message).trim();
    if (admin_reply !== undefined) updates.admin_reply = String(admin_reply).trim();
    if (subject !== undefined) updates.subject = String(subject).trim();

    const { data, error } = await supabaseAdmin.from("contact_messages").update(updates).eq("id", id).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, message: "تغییرات پیام در دیتابیس با موفقیت به‌روزرسانی شد.", data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// حذف تیکت از دیتابیس
export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه پیام الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("contact_messages").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "تیکت با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
