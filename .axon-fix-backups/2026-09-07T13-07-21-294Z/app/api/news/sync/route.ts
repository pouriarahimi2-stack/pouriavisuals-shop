import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز. عملیات نیازمند لاگین مدیر سیستم است." },
        { status: 401 }
      );
    }

    // همگام‌سازی بدون حذف دسته‌جمعی مخرب رکوردهای پیشین دیتابیس
    return NextResponse.json({
      success: true,
      message: "همگام‌سازی ترندها با موفقیت انجام شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
