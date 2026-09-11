// File Path: app/api/ai-assistant/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    await supabaseAdmin
      .from("copilot_chat_history")
      .delete()
      .lt("updated_at", fourteenDaysAgo.toISOString());

    const { data: list, error } = await supabaseAdmin
      .from("copilot_chat_history")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    if (list && list.length > 20) {
      const surplus = list.slice(20);
      const surplusIds = surplus.map((item: any) => item.id);
      await supabaseAdmin.from("copilot_chat_history").delete().in("id", surplusIds);
      return NextResponse.json({ success: true, history: list.slice(0, 20) });
    }

    return NextResponse.json({ success: true, history: list || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, message: "پیام‌ها الزامی است." }, { status: 400 });
    }

    const sessionId = id || ("chat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));
    const firstUserMsg = messages.find((m: any) => m.role === "user");
    const sessionTitle = title || (firstUserMsg ? firstUserMsg.text.slice(0, 35) + "..." : "گفتگوی مدیریت");

    const payload: Record<string, any> = {
      id: sessionId,
      title: sessionTitle,
      messages,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from("copilot_chat_history").select("id").eq("id", sessionId).maybeSingle();

    if (existing) {
      await supabaseAdmin.from("copilot_chat_history").update(payload).eq("id", sessionId);
    } else {
      payload.created_at = new Date().toISOString();
      await supabaseAdmin.from("copilot_chat_history").insert([payload]);
    }

    const { data: allList } = await supabaseAdmin
      .from("copilot_chat_history")
      .select("id")
      .order("updated_at", { ascending: false });

    if (allList && allList.length > 20) {
      const toDelete = allList.slice(20).map((i: any) => i.id);
      await supabaseAdmin.from("copilot_chat_history").delete().in("id", toDelete);
    }

    return NextResponse.json({ success: true, sessionId, title: sessionTitle });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه الزامی است." }, { status: 400 });
    }

    await supabaseAdmin.from("copilot_chat_history").delete().eq("id", id);
    return NextResponse.json({ success: true, message: "نشست با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
