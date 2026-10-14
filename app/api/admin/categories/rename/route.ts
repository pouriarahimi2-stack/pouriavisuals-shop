import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { oldName, newName } = await req.json();
    if (!oldName || !newName) {
      return NextResponse.json({ success: false, message: "داده‌ها ناقص است." });
    }

    const { error } = await supabaseAdmin
      .from("products")
      .update({ category: newName.trim() })
      .eq("category", oldName);

    if (error) throw error;
    
    return NextResponse.json({ success: true, message: "نام دسته‌بندی با موفقیت تغییر کرد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message });
  }
}
