// File Path: app/api/public/banners/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, banners: [], data: [] });
    }

    const activeBanners = (data || [])
      .filter((b: any) => b.is_active !== false)
      .map((b: any) => ({
        id: String(b.id),
        title: b.title || "پیشنهاد ویژه آکسون",
        subtitle: b.subtitle || "",
        image_url: b.image_url || b.image || "/placeholder.png",
        link_url: b.link_url || b.link || "/products",
        cta_text: b.cta_text || "مشاهده و خرید",
        badge_text: b.badge_text || "پیشنهاد ویژه",
        is_active: true,
      }));

    return NextResponse.json({
      success: true,
      banners: activeBanners,
      data: activeBanners,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      banners: [],
      data: [],
      message: err?.message,
    });
  }
}
