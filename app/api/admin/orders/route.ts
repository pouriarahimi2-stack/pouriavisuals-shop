// File Path: app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { sendTextSMS } from "@/lib/otpService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, orders: [], data: [] });
    }

    return NextResponse.json({ success: true, orders: orders || [], data: orders || [] });
  } catch {
    return NextResponse.json({ success: false, orders: [], data: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, payment_status, tracking_code, phone, customer_name } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    const resolvedStatus = status || payment_status;
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (resolvedStatus) {
      updatePayload.status = resolvedStatus;
      updatePayload.payment_status = resolvedStatus;
    }

    if (tracking_code !== undefined) {
      updatePayload.tracking_code = String(tracking_code).trim();
      if (String(tracking_code).trim().length > 0 && !resolvedStatus) {
        updatePayload.status = "shipped";
        updatePayload.payment_status = "shipped";
      }
    }

    const { error } = await supabaseAdmin.from("orders").update(updatePayload).eq("id", id);
    if (error) throw error;

    // ارسال خودکار پیامک بارنامه یا تغییر وضعیت به خریدار
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, "");
      if (cleanPhone.length === 11) {
        try {
          if (tracking_code) {
            await sendTextSMS(
              cleanPhone,
              (customer_name || "مشتری") +
                " عزیز، سفارش شما تحویل پست شد. کد رهگیری پستی: " +
                tracking_code +
                " | axoncore.ir"
            );
          } else if (resolvedStatus) {
            await sendTextSMS(
              cleanPhone,
              "وضعیت سفارش شما در فروشگاه آکسون کور به «" +
                resolvedStatus +
                "» بروزرسانی شد. | axoncore.ir"
            );
          }
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      message: "✓ وضعیت سفارش و بارنامه با موفقیت در دیتابیس بروزرسانی شد.",
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
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }
    await supabaseAdmin.from("orders").delete().eq("id", id);
    return NextResponse.json({ success: true, message: "✓ سفارش با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
