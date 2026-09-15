import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { smsService } from "@/services/smsService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const { phone, status, orderId, customerName, trackingCode } = body;
    const cleanPhone = String(phone || "").replace(/\D/g, "");

    if (trackingCode && status === "shipped") {
      await smsService.sendTrackingCode(cleanPhone, customerName || "مشتری گرامی", trackingCode);
    } else {
      await smsService.sendOrderStatusChange(cleanPhone, orderId || "---", status);
    }

    return NextResponse.json({ success: true, message: "پیامک وضعیت سفارش ارسال شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
