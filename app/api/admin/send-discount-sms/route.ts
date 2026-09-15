import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { smsService } from "@/services/smsService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const { phone, discountPercent, couponCode } = body;
    const cleanPhone = String(phone || "").replace(/\D/g, "");

    await smsService.sendSMS(
      cleanPhone,
      `مشتری گرامی آکسون کور، کد تخفیف اختصاصی ${discountPercent || 15}٪ شما: ${couponCode || "VIP"} - خرید در: axoncore.ir`
    );

    return NextResponse.json({ success: true, message: "پیامک کد تخفیف ارسال شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
