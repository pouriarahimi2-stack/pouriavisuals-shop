// File Path: app/api/admin/categories/rename/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdminSession(req))) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const oldName = String(body.oldName || "").trim();
    const newName = String(body.newName || "").trim();

    if (!oldName || !newName) {
      return NextResponse.json(
        { success: false, message: "داده‌ها ناقص است." },
        { status: 400 }
      );
    }

    if (oldName === newName) {
      return NextResponse.json({
        success: true,
        message: "نام دسته‌بندی با موفقیت تغییر کرد.",
      });
    }

    const { error } = await supabaseAdmin
      .from("products")
      .update({
        category: newName,
        updated_at: new Date().toISOString(),
      })
      .eq("category", oldName);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "نام دسته‌بندی با موفقیت تغییر کرد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "خطا در تغییر نام دسته‌بندی." },
      { status: 500 }
    );
  }
}