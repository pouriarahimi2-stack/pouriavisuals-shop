import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message: "خطای امنیتی: درگاه پرداخت آنلاین شاپرک در وضعیت اتصال قرار ندارد. هیچ فاکتوری بدون تاییدیه سوییچ مرکزی بانک علامت پرداخت نمی‌خورد.",
    },
    { status: 503 }
  );
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: false, message: "تایید پرداخت مستقیم مجاز نیست." }, { status: 405 });
}
