import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "درگاه پرداخت شاپرک فعال نشده است. لطفاً جهت تکمیل فاکتور با پشتیبانی تماس بگیرید.",
    },
    { status: 503 }
  );
}
