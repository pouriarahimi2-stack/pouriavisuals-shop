import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("theme_builder_config")
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      config: data?.theme_builder_config || {
        globalHeader: {
          brandName: "AXON CORE",
          logoText: "آکسون استودیو",
          ctaText: "کاتالوگ محصولات",
          ctaUrl: "/products",
          bgColor: "#0f172a",
          textColor: "#ffffff"
        },
        globalFooter: {
          copyright: "تمامی حقوق محفوظ است © 2026 آکسون استودیو",
          supportPhone: "09376110200",
          bgColor: "#020617",
          textColor: "#94a3b8"
        },
        designTokens: {
          accentColor: "#0284c7",
          borderRadius: "2xl",
          containerWidth: "7xl"
        }
      }
    });
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
    const { config } = body;

    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1);

    if (existing && existing.length > 0) {
      await supabaseAdmin
        .from("site_info")
        .update({ theme_builder_config: config, updated_at: new Date().toISOString() })
        .eq("id", existing[0].id);
    } else {
      await supabaseAdmin
        .from("site_info")
        .insert([{ theme_builder_config: config }]);
    }

    return NextResponse.json({
      success: true,
      message: "✓ تنظیمات Theme Builder سراسری با موفقیت ذخیره و در کل سایت منتشر شد."
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
