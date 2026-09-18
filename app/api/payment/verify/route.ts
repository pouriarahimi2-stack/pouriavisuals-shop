import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // تا زمان راه‌اندازی رسمی درگاه، تغییر وضعیت خودکار به پرداخت‌شده مسدود است
  return NextResponse.json(
    {
      success: false,
      message: "درگاه پرداخت هنوز متصل نشده است. سفارش در وضعیت در انتظار بررسی باقی می‌ماند."
    },
    { status: 400 }
  );
}
