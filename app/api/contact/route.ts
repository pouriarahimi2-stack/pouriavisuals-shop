import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { validatePhoneNumber, sanitizeInput, createApiError, createApiSuccess } from "@/lib/validationGuard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: messages || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

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
      return createApiError("متن پیام باید حداقل ۵ کاراکتر باشد.", 400);
    }

    const { error } = await supabaseAdmin.from("contact_messages").insert([
      {
        full_name: fullName,
        phone: phone.replace(/\D/g, ""),
        subject,
        message,
        status: "pending",
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;
    return createApiSuccess(null, "پیام شما با موفقیت ثبت شد و به زودی بررسی خواهد شد.");
  } catch (err: any) {
    console.error("Contact API Error:", err);
    return createApiError("خطای داخلی در ثبت پیام.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, admin_reply, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه پیام الزامی است." }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (admin_reply !== undefined) updatePayload.admin_reply = admin_reply;
    if (status) updatePayload.status = status;

    const { data: updated, error } = await supabaseAdmin
      .from("contact_messages")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "پاسخ مدیریت با موفقیت در دیتابیس ثبت شد.",
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, is_read, message, admin_reply } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه پیام الزامی است." }, { status: 400 });
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (is_read !== undefined) updateData.is_read = Boolean(is_read);
    if (message !== undefined) updateData.message = message;
    if (admin_reply !== undefined) updateData.admin_reply = admin_reply;

    const { error } = await supabaseAdmin
      .from("contact_messages")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "تغییرات ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه پیام الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "پیام با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
