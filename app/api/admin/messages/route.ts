import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { sendTextSMS } from "@/lib/otpService";

export const dynamic = "force-dynamic";

function normalizeMessage(m: any, sourceTable: "messages" | "contact_messages") {
  return {
    id: String(m.id),
    sourceTable,
    name: m.name || m.full_name || "کاربر فروشگاه",
    full_name: m.full_name || m.name || "کاربر فروشگاه",
    email: m.email || "",
    phone: m.phone || "",
    subject: m.subject || "پیام و درخواست مشاوره",
    message: m.message || m.body || "",
    is_read: Boolean(m.is_read),
    admin_reply: m.admin_reply || "",
    status: m.admin_reply ? "answered" : m.status || "pending",
    created_at: m.created_at || new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const [m1, m2] = await Promise.all([
      supabaseAdmin.from("messages").select("*").order("created_at", { ascending: false }).limit(100),
      supabaseAdmin.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    const list1 = (m1.data || []).map((x: any) => normalizeMessage(x, "messages"));
    const list2 = (m2.data || []).map((x: any) => normalizeMessage(x, "contact_messages"));

    const combinedMap = new Map<string, any>();
    [...list1, ...list2].forEach((item) => {
      combinedMap.set(item.id, item);
    });

    const allMessages = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const unreadCount = allMessages.filter((x) => !x.is_read).length;

    return NextResponse.json({
      success: true,
      messages: allMessages,
      data: allMessages,
      unread: unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { id, is_read, reply, admin_reply, message, phone } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه پیام الزامی است." }, { status: 400 });
    }

    const finalReply = reply !== undefined ? reply : admin_reply;
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (is_read !== undefined) updates.is_read = Boolean(is_read);
    if (finalReply !== undefined) updates.admin_reply = finalReply;
    if (message !== undefined) updates.message = message;

    await Promise.all([
      supabaseAdmin.from("messages").update(updates).eq("id", id),
      supabaseAdmin
        .from("contact_messages")
        .update({
          ...updates,
          ...(finalReply ? { status: "answered" } : {}),
        })
        .eq("id", id),
    ]);

    // اگر پاسخ ثبت شد و شماره موبایل وجود داشت، پیامک اطلاع‌رسانی ارسال شود
    if (finalReply && phone) {
      const cleanPhone = String(phone).replace(/\D/g, "");
      if (cleanPhone.length === 11) {
        try {
          await sendTextSMS(
            cleanPhone,
            "پاسخ تیکت شما در فروشگاه آکسون ثبت شد: " + String(finalReply).slice(0, 120) + " | axoncore.ir"
          );
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      message: "✓ تغییرات و پاسخ تیکت با موفقیت در دیتابیس ثبت شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه الزامی است." }, { status: 400 });
    }
    await Promise.all([
      supabaseAdmin.from("messages").delete().eq("id", id),
      supabaseAdmin.from("contact_messages").delete().eq("id", id),
    ]);
    return NextResponse.json({ success: true, message: "پیام با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
